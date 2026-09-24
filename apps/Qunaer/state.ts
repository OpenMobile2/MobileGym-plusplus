import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { DATA_VERSION } from './constants';
import { QUNAER_CONFIG } from './data';
import { manifest } from './manifest';
import type { CityTarget, PendingBooking, QunaerActions, QunaerState, TravelOrder } from './types';

const initialState: QunaerState = JSON.parse(JSON.stringify(QUNAER_CONFIG));
let sequence = 0;

// 身份证/证件号中间打码，保留前6后4位。
function maskIdNo(raw: string): string {
  const value = raw.trim();
  if (value.length <= 10) {
    if (value.length <= 4) return value;
    return `${value.slice(0, 2)}${'*'.repeat(value.length - 4)}${value.slice(-2)}`;
  }
  return `${value.slice(0, 6)}${'*'.repeat(value.length - 10)}${value.slice(-4)}`;
}

const navigationLabels: Record<string, string> = {
  'pay.cashier.0.open': '支付成功',
  'mine.settings.0.open': '已退出登录',
  'auth.login.0.open': '登录成功',
};

// 每条「进入收银台」的跳转对应的订单信息，收银台完成后据此生成真实订单。
const BOOKING_META: Record<string, PendingBooking> = {
  'hotel.booking.0.open': { kind: '酒店', title: '汉庭酒店(烟台火车站烟台港客运站店)', amount: 368 },
  'flight.booking.1.open': { kind: '机票', title: '广州 → 长沙 HO1234', amount: 318 },
  'ticket.booking.0.open': { kind: '门票', title: '南京欢乐谷 · 成人票', amount: 153 },
  'train.booking.2.open': { kind: '火车票', title: '南京 → 鞍山 G1234', amount: 198 },
  'homestay.detail.0.open': { kind: '民宿', title: '海景整套民宿 · 大床房', amount: 428 },
  'oversea.booking.0.open': { kind: '海外酒店', title: '曼谷素坤逸酒店 · 高级房', amount: 512 },
  'carrental.carlist.0.open': { kind: '租车', title: '大众朗逸 · 3天租期', amount: 296 },
  'transfer.carlist.0.open': { kind: '接送机', title: '接机 · 经济型4座', amount: 74 },
  'tour.detail.0.open': { kind: '跟团游', title: '云南昆明大理6日5晚', amount: 3280 },
};

const CITY_FIELD: Record<CityTarget, keyof QunaerState['search']> = {
  hotel: 'hotelCity',
  'flight-from': 'fromCity',
  'flight-to': 'toCity',
  'train-from': 'trainFrom',
  'train-to': 'trainTo',
};

const AI_REPLIES: Array<{ match: RegExp; reply: string }> = [
  { match: /退款|退票/, reply: '您可在「我的-订单」中找到对应订单，点击「退款/售后」发起申请，审核通过后原路退回，预计1-3个工作日到账。' },
  { match: /改期|改签/, reply: '支持改期的订单可在订单详情点击「改期」，系统会展示可改日期与差价，确认后即可完成改签。' },
  { match: /入园|开放时间/, reply: '景区当日开放时间为 08:30-17:30，凭订单二维码在检票口闸机扫码即可入园，无需换票。' },
  { match: /身份证|证件/, reply: '未带身份证可在景区自助机凭购票手机号与姓名核验入园；机票/火车票需到柜台办理临时身份证明。' },
  { match: /人工|客服/, reply: '正在为您转接人工客服，工作时间 08:00-22:00，请稍候，或点击右下角「电话咨询」直接来电。' },
];

function botReply(text: string): string {
  for (const item of AI_REPLIES) {
    if (item.match.test(text)) return item.reply;
  }
  return `已收到您的问题「${text}」，正在为您查询，请稍候~`;
}

export const useQunaerStore = createAppStoreWithActions<QunaerState, QunaerActions>(
  manifest.id,
  initialState,
  (set) => ({
    recordAction: (id, label) => set((state) => {
      const disabled = label.includes('借钱') || label.includes('金融') || label.includes('暂未');
      const notImplemented = label.includes('暂未实现');
      const count = (state.selected[id] ?? 0) + 1;
      const swap = id === 'flight.search.2.other';
      return {
        search: swap
          ? { ...state.search, fromCity: state.search.toCity, toCity: state.search.fromCity }
          : state.search,
        selected: { ...state.selected, [id]: count },
        lastFeedback: disabled ? (notImplemented ? '该功能暂未实现' : '该功能暂未开放') : `已选择：${label}`,
        actionLog: [
          ...state.actionLog,
          { id, label, timestamp: TimeService.now() },
        ].slice(-80),
      };
    }),
    recordNavigation: (id) => set((state) => {
      const patch: Partial<QunaerState> = {
        actionLog: [
          ...state.actionLog,
          { id, label: navigationLabels[id] ?? '页面跳转', timestamp: TimeService.now() },
        ].slice(-80),
        lastFeedback: navigationLabels[id] ?? '',
      };
      if (id === 'mine.settings.0.open') {
        patch.session = { ...state.session, loggedIn: false };
      }
      if (id === 'auth.login.0.open') {
        patch.session = { ...state.session, loggedIn: true };
      }
      // 进入收银台前记录本次要下的订单。下单页若算好了真实总价（按晚数/间数），优先用它。
      if (BOOKING_META[id]) {
        const meta = BOOKING_META[id];
        const draft = state.bookingDraft;
        patch.pendingBooking = draft
          ? { kind: meta.kind, title: draft.title || meta.title, amount: draft.amount }
          : meta;
        patch.pendingOrderId = '';
        patch.bookingDraft = null;
      }
      // 收银台点「支付」：优先支付一张已存在的待支付订单，否则用 pendingBooking 生成新订单
      if (id === 'pay.cashier.0.open') {
        if (state.pendingOrderId) {
          const paidId = state.pendingOrderId;
          patch.orders = state.orders.map((order) =>
            order.id === paidId ? { ...order, status: '待出行' } : order,
          );
          patch.lastOrderId = paidId;
          patch.currentOrderId = paidId;
          patch.pendingOrderId = '';
        } else {
          const booking = state.pendingBooking ?? { kind: '旅行订单', title: '去哪儿旅行订单', amount: 318 };
          const orderId = `o_paid_${TimeService.now()}_${sequence++}`;
          const paid: TravelOrder = {
            id: orderId,
            kind: booking.kind,
            title: booking.title,
            status: '待出行',
            amount: booking.amount,
            date: '2026-08-26',
          };
          patch.orders = [paid, ...state.orders];
          patch.lastOrderId = orderId;
          patch.currentOrderId = orderId;
          patch.pendingBooking = null;
        }
      }
      return patch;
    }),
    clearFeedback: () => set(() => ({ lastFeedback: '' })),
    addPassenger: (name, idNo) => set((state) => {
      const id = `p_${TimeService.now()}_${sequence++}`;
      return {
        lastFeedback: `已添加乘机人：${name}`,
        passengers: [
          ...state.passengers,
          { id, name, type: '成人票', idNo: maskIdNo(idNo), phone: '139****0002' },
        ],
        // 新增乘机人默认勾选，便于直接用于下单计价。
        selectedPassengerIds: [...state.selectedPassengerIds, id],
      };
    }),
    togglePassengerSelected: (id) => set((state) => {
      const has = state.selectedPassengerIds.includes(id);
      const next = has
        ? state.selectedPassengerIds.filter((x) => x !== id)
        : [...state.selectedPassengerIds, id];
      return {
        selectedPassengerIds: next,
        lastFeedback: has ? '' : `已选乘机人 · 共${next.length}人`,
      };
    }),
    setCityTarget: (target) => set(() => ({ cityTarget: target })),
    setCity: (target, city) => set((state) => ({
      search: { ...state.search, [CITY_FIELD[target]]: city },
      lastFeedback: `已切换到${city}`,
    })),
    cancelOrder: (orderId) => set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status: '已取消' } : order,
      ),
      lastFeedback: '订单已取消',
    })),
    setCurrentOrder: (orderId) => set(() => ({ currentOrderId: orderId })),
    setPendingOrder: (orderId) => set(() => ({ pendingOrderId: orderId })),
    sendChat: (thread, text) => set((state) => {
      const now = TimeService.now();
      const userMsg = { id: `m_${now}_${sequence++}`, role: 'user' as const, text };
      const reply = thread === 'ai'
        ? botReply(text)
        : '收到您的消息，商家会尽快回复您，感谢耐心等待~';
      const botMsg = { id: `m_${now}_${sequence++}`, role: 'bot' as const, text: reply };
      return {
        chat: { ...state.chat, [thread]: [...state.chat[thread], userMsg, botMsg] },
      };
    }),
    setDepartDate: (date) => set((state) => ({
      search: { ...state.search, departDate: date },
      lastFeedback: `已选择日期：${date}`,
    })),
    setReturnDate: (date) => set((state) => ({
      search: { ...state.search, returnDate: date },
      lastFeedback: `已选择返程：${date}`,
    })),
    setHotelDates: (checkIn, checkOut) => set((state) => ({
      search: { ...state.search, hotelCheckIn: checkIn, hotelCheckOut: checkOut },
      lastFeedback: `已选择 ${checkIn} - ${checkOut}`,
    })),
    setHotelKeyword: (keyword) => set((state) => ({
      search: { ...state.search, hotelKeyword: keyword },
    })),
    setSelectedRoom: (room) => set(() => ({ selectedRoom: room })),
    setSelectedFare: (fare) => set(() => ({ selectedFare: fare })),
    setBookingDraft: (draft) => set(() => ({ bookingDraft: draft })),
    setRoundTrip: (selection) => set(() => ({ roundTrip: selection })),
    setStay: (patch) => set((state) => ({ stay: { ...state.stay, ...patch } })),
    setCar: (patch) => set((state) => ({ car: { ...state.car, ...patch } })),
    setTransfer: (patch) => set((state) => ({ transfer: { ...state.transfer, ...patch } })),
    toggleWorldCollect: (id) => set((state) => {
      const on = state.collectedWorld.includes(id);
      return {
        collectedWorld: on ? state.collectedWorld.filter((x) => x !== id) : [...state.collectedWorld, id],
        lastFeedback: on ? '已取消收藏' : '已收藏到「收藏浏览」',
      };
    }),
    setTripType: (value) => set((state) => ({ search: { ...state.search, tripType: value } })),
    setTrainTripType: (value) => set((state) => ({ search: { ...state.search, trainTripType: value } })),
    setTrainHighSpeed: (value) => set((state) => ({
      search: { ...state.search, trainHighSpeed: value },
      lastFeedback: value ? '已勾选「只看高铁动车」' : '已取消「只看高铁动车」',
    })),
    setVacationCity: (city) => set((state) => ({
      search: { ...state.search, vacationCity: city },
      lastFeedback: `已切换到${city}`,
    })),
    setDateTarget: (target) => set(() => ({ dateTarget: target })),
    swapTrainCities: () => set((state) => ({
      search: { ...state.search, trainFrom: state.search.trainTo, trainTo: state.search.trainFrom },
      lastFeedback: '已交换出发/到达',
    })),
    setEditingPassenger: (id) => set(() => ({ editingPassengerId: id })),
    setCurrentWorld: (id) => set(() => ({ currentWorldId: id })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(state as unknown as Record<string, unknown>)) {
        if (typeof value !== 'function' && key !== '_temp') result[key] = value;
      }
      return result as Partial<QunaerState>;
    },
  },
);

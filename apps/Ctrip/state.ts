import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { CTRIP_CONFIG } from './data';
import type {
  CtripState, CtripActions, CtripOrder, Traveler, CsMessage,
} from './types';

const initialState: CtripState = JSON.parse(JSON.stringify(CTRIP_CONFIG));

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

/** 证件号掩码:保留前6后2,中间星号(出行人新增用)。 */
function maskIdCard(raw: string): string {
  const s = raw.trim();
  if (s.length <= 8) return s;
  return s.slice(0, 6) + '*'.repeat(s.length - 8) + s.slice(-2);
}

/** 品类 -> 待付款状态文案。 */
const STATUS_TEXT: Record<CtripOrder['status'], string> = {
  unpaid: '待付款',
  upcoming: '待出行',
  completed: '已完成',
  cancelled: '已取消',
  refunded: '已退款',
};

/**
 * 客服模拟回答(P2,不接真模型;Q7 酒店客服 + cs.main 在线客服共用)。
 * 关键词命中优先,兜底通用话术。
 */
function csReply(input: string): string {
  const q = input.trim();
  if (/停车|车位|parking/i.test(q)) return '酒店提供免费停车场,车位充足,到店后告知前台房号即可,如遇满位可停周边合作车场~';
  if (/早餐|breakfast|餐/.test(q)) return '酒店含双早套餐,早餐时间为 07:00-10:00,在一楼全日餐厅享用,儿童1.2米以下免费哦~';
  if (/取消|退款|改期/.test(q)) return '您可在「我的-订单」里找到该订单,未出行订单支持在线申请取消,具体退款规则以订单页「取消政策」为准~';
  if (/几点|入住|退房|时间/.test(q)) return '酒店入住时间为 14:00 后,退房时间为次日 12:00 前,如需提前入住或延迟退房可联系前台协调~';
  if (/位置|地址|怎么走|地铁/.test(q)) return '酒店位于市中心,距最近地铁站步行约 8 分钟,详细位置可在详情页「位置/周边」查看地图导航~';
  if (/发票|报销/.test(q)) return '离店后可在「订单详情-报销凭证」里在线申请开具电子发票,1-3 个工作日发送至您的邮箱~';
  return '您好,这里是携程在线客服,已收到您的问题,可在订单页查看详情或直接说明需求,我会尽力帮您解决~';
}

export const useCtripStore = createAppStoreWithActions<CtripState, CtripActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const word = q.trim();
      if (!word) return;
      set((s) => ({
        searchHistory: [word, ...s.searchHistory.filter((w) => w !== word)].slice(0, 10),
      }));
    },
    removeSearchHistory: (word) => {
      set((s) => ({ searchHistory: s.searchHistory.filter((w) => w !== word) }));
    },

    // ---------- 酒店收藏(Q5:变实心红心 + toast,toast 在页面层) ----------
    toggleHotelFavorite: (id) => {
      set((s) => ({
        favoriteHotels: s.favoriteHotels.includes(id)
          ? s.favoriteHotels.filter((x) => x !== id)
          : [id, ...s.favoriteHotels],
      }));
    },

    // ---------- 设置开关(Q16:通知/网络/关怀模式等可切换) ----------
    toggleSetting: (key) => {
      set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } }));
    },

    // ---------- 下单 -> 收银台(四大品类共用,Q14) ----------
    startBooking: (o) => {
      set(() => ({ _pendingOrder: o }));
    },
    /** 收银台「支付」:Q2=A 直接成功。生成 upcoming 订单,清挂起态,返回新订单 id。 */
    payPending: () => {
      const pending = get()._pendingOrder;
      if (!pending) return '';
      const orderId = genId('o');
      const order: CtripOrder = {
        id: orderId,
        category: pending.category,
        title: pending.title,
        subtitle: pending.subtitle,
        date: TimeService.getDate().toISOString().slice(0, 10),
        status: 'upcoming',
        statusText: pending.category === 'hotel' ? '待入住'
          : pending.category === 'train' || pending.category === 'flight' ? '已出票'
          : '待使用',
        price: pending.amount,
        image: pending.image,
      };
      set((s) => ({
        orders: [order, ...s.orders],
        _pendingOrder: undefined,
      }));
      return orderId;
    },

    // ---------- 订单取消 / 退款(订单页「取消订单」「退票」复用) ----------
    cancelOrder: (id) => {
      set((s) => ({
        orders: s.orders.map((o) => {
          if (o.id !== id) return o;
          // 未付款 -> 已取消;已出行类 -> 已退款
          const next: CtripOrder['status'] = o.status === 'unpaid' ? 'cancelled' : 'refunded';
          return {
            ...o,
            status: next,
            statusText: STATUS_TEXT[next],
            refundInfo: next === 'refunded' ? '退款将于 1-7 个工作日原路退回' : undefined,
          };
        }),
      }));
    },

    // ---------- 常用出行人(Q15:可本地增删) ----------
    addTraveler: (name, idCard, phone) => {
      const nm = name.trim();
      if (!nm) return;
      const t: Traveler = {
        id: genId('tv'),
        name: nm,
        idCard: maskIdCard(idCard),
        phone: phone.trim(),
      };
      set((s) => ({ travelers: [...s.travelers, t] }));
    },
    removeTraveler: (id) => {
      set((s) => ({ travelers: s.travelers.filter((t) => t.id !== id) }));
    },

    // ---------- 客服模拟问答(volatile,_csLog 不持久化是约定,但此处放 state 简化) ----------
    csAsk: (text) => {
      const t = text.trim();
      if (!t) return;
      const userMsg: CsMessage = { role: 'user', text: t };
      const botMsg: CsMessage = { role: 'assistant', text: csReply(t) };
      set((s) => ({ _csLog: [...(s._csLog ?? []), userMsg, botMsg] }));
    },
    resetCs: () => {
      set(() => ({ _csLog: [] }));
    },
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        // 函数(actions)与 volatile 临时态不持久化
        if (typeof v === 'function') continue;
        if (k === '_pendingOrder' || k === '_csLog') continue;
        result[k] = v;
      }
      return result as Partial<CtripState>;
    },
  },
);

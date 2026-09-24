import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { DIDI_CONFIG } from './data';
import {
  findLatLngByName,
  findMapPlaceByName,
  getMapPlace,
  getPickupPointLatLng,
  getPickupPoints,
  getPlaceLatLng,
  MAP_PLACES,
} from './data/mapPlaces';
import { estimateBand, scaleDiscount, scaleFare } from './pricing';
import { partializeDidiState, removeLegacyDidiStorage } from './privacy';
import { computeRouteOptions, estimateStraightLineKm } from './routing';
import type {
  DidiState, DidiActions, DidiSettings, DidiOrder, DidiDriver, DidiDriverChat,
  DidiLatLng, DidiRouteOption,
} from './types';

const initialState: DidiState = {
  ...JSON.parse(JSON.stringify(DIDI_CONFIG)),
  invoiceApplications: [],
  taskAudit: {},
};
const PERSIST_NAME = `${manifest.id}_v${DATA_VERSION}`;

removeLegacyDidiStorage(DATA_VERSION);

let seq = 0;
const newId = (p: string) => `${p}_${TimeService.now()}_${seq++}`;

/** 上车点真实坐标：以地图选点的 anchor + 候选点为准。 */
function resolvePickupLatLng(state: DidiState): DidiLatLng | null {
  const place = MAP_PLACES.find((item) => item.id === state.mapAnchorId);
  if (!place) return null;
  const pickup = getPickupPoints(place).find((point) => point.id === state.selectedPickupId);
  return pickup ? getPickupPointLatLng(place, pickup) : getPlaceLatLng(place);
}

/** 地点名 → 真实坐标。搜索框自由输入且匹配不到任何 POI/上车点时返回 null。 */
function resolvePlaceLatLng(name: string): DidiLatLng | null {
  return findLatLngByName(name);
}

type TripRouting = {
  routeOptions: DidiRouteOption[];
  routeId: string;
  distanceKm: number;
  durationMin: number;
};

/**
 * 按真实起终点算候选路线；路网图还没加载完时退回直线估算，
 * 加载完成后由 refreshRouteOptions 补算。
 */
function routeTrip(
  origin: DidiLatLng | null,
  dest: DidiLatLng | null,
  waypoints: DidiLatLng[],
  fallbackKm: number,
): TripRouting {
  const options = origin && dest ? computeRouteOptions(origin, dest, waypoints) : [];
  if (options.length) {
    const chosen = options[0];
    return {
      routeOptions: options,
      routeId: chosen.id,
      distanceKm: chosen.distanceKm,
      durationMin: chosen.durationMin,
    };
  }
  const km = origin && dest
    ? Math.max(0.5, estimateStraightLineKm(origin, dest))
    : Math.max(0.5, fallbackKm);
  return {
    routeOptions: [],
    routeId: 'r1',
    distanceKm: Math.round(km * 10) / 10,
    durationMin: Math.round(km * 1.35 + 4),
  };
}

/** 完全合成的演示司机，不复用真机素材中的姓名或有效车牌。 */
const DRIVERS: DidiDriver[] = [
  { name: '演示司机04', plate: '测试·A004', plateColor: '黑', rating: 5.0, tags: ['一年内新车', '宽敞大车'] },
  { name: '演示司机05', plate: '测试·A005', plateColor: '蓝', rating: 5.0, tags: ['服务好评', '认真负责'] },
];

export const useDidiStore = createAppStoreWithActions<DidiState, DidiActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    toast: (msg) => set(() => ({ lastToast: msg })),

    // ---- 叫车链路 ----
    setDestQuery: (q) => set(() => ({ destQuery: q })),
    setPickup: (p) => set(() => ({ pickupPoint: p })),
    setMapPickerSource: (source) => set(() => ({ mapPickerSource: source })),
    setPlaceSearchTarget: (target, fromMap = false) =>
      set(() => ({ placeSearchTarget: target, destQuery: '', placeSearchFromMap: fromMap })),
    setMapPickerMode: (mode) =>
      set((state) => ({
        mapPickerMode: mode,
        ...(mode === 'destination' ? { selectedMapPlaceId: state.mapAnchorId } : {}),
      })),
    focusMapPlace: (placeId) =>
      set(() => {
        const place = getMapPlace(placeId);
        const firstPickup = getPickupPoints(place)[0];
        return {
          mapAnchorId: place.id,
          selectedMapPlaceId: place.id,
          selectedPickupId: firstPickup.id,
        };
      }),
    choosePickupPlace: (placeId) =>
      set(() => {
        const place = getMapPlace(placeId);
        const firstPickup = getPickupPoints(place)[0];
        return {
          mapPickerMode: 'pickup',
          mapAnchorId: place.id,
          selectedMapPlaceId: place.id,
          selectedPickupId: firstPickup.id,
          pickupPoint: firstPickup.name,
          destQuery: '',
        };
      }),
    selectPickupCandidate: (placeId, pickupId) =>
      set(() => {
        const place = getMapPlace(placeId);
        const pickup = getPickupPoints(place).find((point) => point.id === pickupId)
          ?? getPickupPoints(place)[0];
        return {
          mapAnchorId: place.id,
          selectedMapPlaceId: place.id,
          selectedPickupId: pickup.id,
          pickupPoint: pickup.name,
        };
      }),
    selectMapDestination: (placeId) =>
      set(() => {
        const place = getMapPlace(placeId);
        return {
          mapAnchorId: place.id,
          selectedMapPlaceId: place.id,
        };
      }),
    chooseDest: (name) =>
      set((s) => {
        // 预估:里程/时长来自真实路网算路，价带沿用车型目录价的同一套缩放。
        const addr = s.addresses.find((a) => a.name === name);
        const mapPlace = findMapPlaceByName(name);
        const origin = resolvePickupLatLng(s);
        const dest = resolvePlaceLatLng(name);
        const routing = routeTrip(origin, dest, [], mapPlace?.distanceKm ?? addr?.distanceKm ?? 30.6);
        const km = routing.distanceKm;
        const min = routing.durationMin;
        const checked = s.carGroups.flatMap((g) => g.types).filter((t) => t.checked);
        const bandSources = checked.length > 0
          ? checked
          : s.carGroups.flatMap((g) => g.types).slice(0, 2);
        const { estMin, estMax } = estimateBand(bandSources.map((t) => t.price), km);
        const fixedAddresses = s.addresses.filter((item) => item.label !== '历史');
        const historyAddresses = s.addresses.filter(
          (item) => item.label === '历史' && item.name !== name,
        );
        const selectedAddress = addr?.label === '历史'
          ? addr
          : mapPlace
            ? {
                id: `map_${mapPlace.id}`,
                label: '历史' as const,
                name: mapPlace.name,
                address: mapPlace.address,
                distanceKm: mapPlace.distanceKm,
                ...(mapPlace.metro ? { metro: mapPlace.metro } : {}),
              }
            : null;
        return {
          addresses: selectedAddress
            ? [...fixedAddresses, selectedAddress, ...historyAddresses].slice(0, 14)
            : s.addresses,
          trip: {
            ...s.trip, phase: 'idle', to: name, from: s.pickupPoint,
            fromLatLng: origin, toLatLng: dest,
            distanceKm: km, durationMin: min,
            routeOptions: routing.routeOptions, routeId: routing.routeId,
            estMin, estMax, carType: '', fare: 0, discount: 0, driver: null,
            orderId: null, appended: [], waypoints: [],
          },
          destQuery: '',
        };
      }),
    toggleCarType: (typeId) =>
      set((s) => {
        const carGroups = s.carGroups.map((g) => ({
          ...g,
          types: g.types.map((t) => (t.id === typeId ? { ...t, checked: !t.checked } : t)),
        }));
        const checked = carGroups.flatMap((g) => g.types).filter((t) => t.checked);
        const band = checked.length > 0
          ? estimateBand(checked.map((t) => t.price), s.trip.distanceKm)
          : { estMin: s.trip.estMin, estMax: s.trip.estMax };
        return {
          carGroups,
          trip: { ...s.trip, estMin: band.estMin, estMax: band.estMax },
        };
      }),
    callCars: () =>
      set((s) => {
        const picked = s.carGroups.flatMap((g) => g.types).filter((t) => t.checked);
        if (picked.length === 0) return { lastToast: '请先选择车型' };
        const cheapest = picked.reduce((a, b) => (a.price <= b.price ? a : b));
        const fare = scaleFare(cheapest.price, s.trip.distanceKm);
        const discount = scaleDiscount(cheapest.discount, s.trip.distanceKm, cheapest.price);
        const band = estimateBand(picked.map((t) => t.price), s.trip.distanceKm);
        return {
          trip: {
            ...s.trip,
            phase: 'waiting',
            fare,
            discount,
            carType: cheapest.name,
            estMin: band.estMin,
            estMax: band.estMax,
          },
        };
      }),
    appendCarType: (typeId) =>
      set((s) => ({
        trip: {
          ...s.trip,
          appended: s.trip.appended.includes(typeId)
            ? s.trip.appended.filter((x) => x !== typeId)
            : [...s.trip.appended, typeId],
        },
      })),
    confirmAppendCarTypes: (typeIds) =>
      set((s) => {
        const unique = [...new Set(typeIds)];
        return {
          trip: { ...s.trip, appended: unique },
          lastToast: unique.length > 0
            ? `已追加${unique.length}种车型,加速应答中`
            : '已更新追加车型',
        };
      }),
    driverAccept: () =>
      set((s) => {
        if (s.trip.phase !== 'waiting') return {};
        const d = DRIVERS[s.orders.length % DRIVERS.length];
        return { trip: { ...s.trip, phase: 'driver', driver: d } };
      }),
    startTrip: () => set((s) => ({ trip: { ...s.trip, phase: 'ongoing' } })),
    arriveTrip: () =>
      set((s) => {
        // 免密支付事实:到达即自动扣款生成已完成订单,无支付方式弹层
        const order: DidiOrder = {
          id: newId('o'),
          status: 'completed',
          carType: s.trip.carType || '快车',
          from: s.trip.from,
          to: s.trip.to || '目的地',
          createdAt: TimeService.now(),
          fare: s.trip.fare,
          estFare: Math.round((s.trip.fare + s.trip.discount) * 100) / 100,
          discount: s.trip.discount,
          distanceKm: s.trip.distanceKm,
          durationMin: s.trip.durationMin,
          payMethod: '免密支付',
          rated: false,
          rating: null,
          invoiced: false,
        };
        return {
          orders: [order, ...s.orders],
          trip: { ...s.trip, phase: 'finished', orderId: order.id },
          currentOrderId: order.id,
          rateLevel: null, rateTags: [], rateAnonymous: false, rateText: '',
          couponsClaimed: false,
          messageThreads: s.messageThreads.map((t) =>
            t.kind === 'pay'
              ? {
                  ...t,
                  unread: t.unread + 1,
                  preview: '免密支付成功',
                  items: [{
                    title: '免密支付成功',
                    body: `亲爱的乘客您好,您从(${order.from})到(${order.to})的行程已结束,费用共${order.fare.toFixed(2)}元已通过微信支付分免密支付扣除。`,
                    time: '刚刚',
                  }, ...t.items],
                }
              : t,
          ),
        };
      }),
    addWaypoint: (name) =>
      set((s) => {
        if (!name) return {};
        if (name === s.trip.to) return { lastToast: '途经点不能与终点相同' };
        if (s.trip.waypoints.includes(name)) return { lastToast: '途经点已存在' };
        const waypoints = [...s.trip.waypoints, name].slice(0, 2);
        const routing = routeTrip(
          s.trip.fromLatLng,
          s.trip.toLatLng,
          waypoints.map(resolvePlaceLatLng).filter((point): point is DidiLatLng => point !== null),
          s.trip.distanceKm,
        );
        return {
          trip: {
            ...s.trip,
            waypoints,
            routeOptions: routing.routeOptions,
            routeId: routing.routeId,
            distanceKm: routing.distanceKm,
            durationMin: routing.durationMin,
          },
          lastToast: '途经点已添加',
        };
      }),
    refreshRouteOptions: () =>
      set((s) => {
        // 路网图是异步加载的，选终点时可能还没就绪；就绪后按已存坐标补算真实路线。
        if (s.trip.routeOptions.length > 0) return {};
        if (!s.trip.fromLatLng || !s.trip.toLatLng) return {};
        if (s.trip.phase !== 'idle') return {};
        const routing = routeTrip(
          s.trip.fromLatLng,
          s.trip.toLatLng,
          s.trip.waypoints.map(resolvePlaceLatLng).filter((p): p is DidiLatLng => p !== null),
          s.trip.distanceKm,
        );
        if (!routing.routeOptions.length) return {};
        const checked = s.carGroups.flatMap((g) => g.types).filter((t) => t.checked);
        const bandSources = checked.length > 0
          ? checked
          : s.carGroups.flatMap((g) => g.types).slice(0, 2);
        const band = estimateBand(bandSources.map((t) => t.price), routing.distanceKm);
        return {
          trip: {
            ...s.trip,
            routeOptions: routing.routeOptions,
            routeId: routing.routeId,
            distanceKm: routing.distanceKm,
            durationMin: routing.durationMin,
            estMin: band.estMin,
            estMax: band.estMax,
          },
        };
      }),
    setRoute: (routeId) =>
      set((s) => {
        const option = s.trip.routeOptions.find((item) => item.id === routeId);
        if (!option) return { trip: { ...s.trip, routeId } };
        // 换路线即换真实里程与时长；已成单的一口价不再变动，只更新预估。
        const rebased = {
          ...s.trip,
          routeId,
          distanceKm: option.distanceKm,
          durationMin: option.durationMin,
        };
        if (s.trip.phase !== 'idle') return { trip: rebased };
        const checked = s.carGroups.flatMap((g) => g.types).filter((t) => t.checked);
        const bandSources = checked.length > 0
          ? checked
          : s.carGroups.flatMap((g) => g.types).slice(0, 2);
        const band = estimateBand(bandSources.map((t) => t.price), option.distanceKm);
        return { trip: { ...rebased, estMin: band.estMin, estMax: band.estMax } };
      }),
    setRoutePref: (pref) =>
      set((s) => {
        // 偏好落到真实候选上：时间优先取用时最短，低价优先取免高速/最短里程。
        const options = s.trip.routeOptions;
        if (!options.length) return { trip: { ...s.trip, routePref: pref } };
        const picked = pref === 'time'
          ? options.reduce((a, b) => (a.durationMin <= b.durationMin ? a : b))
          : pref === 'cheap'
            ? options.reduce((a, b) => {
              const cost = (route: DidiRouteOption) => route.tollFee * 100 + route.distanceKm;
              return cost(a) <= cost(b) ? a : b;
            })
            : options.find((option) => option.recommended) ?? options[0];
        return {
          trip: {
            ...s.trip,
            routePref: pref,
            routeId: picked.id,
            distanceKm: picked.distanceKm,
            durationMin: picked.durationMin,
          },
        };
      }),
    changeDest: (name) =>
      set((s) => {
        // 改终点后去掉与新终点冲突的途经点，并按新坐标重算路线与里程。
        const waypoints = s.trip.waypoints.filter((point) => point !== name);
        const dest = resolvePlaceLatLng(name);
        const routing = routeTrip(
          s.trip.fromLatLng,
          dest,
          waypoints.map(resolvePlaceLatLng).filter((point): point is DidiLatLng => point !== null),
          findMapPlaceByName(name)?.distanceKm ?? s.trip.distanceKm,
        );
        return {
          trip: {
            ...s.trip,
            to: name,
            toLatLng: dest,
            waypoints,
            routeOptions: routing.routeOptions,
            routeId: routing.routeId,
            distanceKm: routing.distanceKm,
            durationMin: routing.durationMin,
          },
          lastToast: '终点已修改',
        };
      }),
    resetTrip: () =>
      set((s) => {
        // 恢复默认车型勾选，避免「去呼叫」残留勾选污染下一单计价
        const baselineGroups = (JSON.parse(JSON.stringify(initialState.carGroups)) as DidiState['carGroups']);
        return {
          carGroups: baselineGroups,
          trip: {
            ...s.trip, phase: 'idle', to: '', toLatLng: null, fare: 0, discount: 0, carType: '',
            driver: null, appended: [], waypoints: [], orderId: null, routeOptions: [],
            routeId: 'r1',
          },
          cancelKeep: false, cancelPicked: [],
        };
      }),

    // ---- 取消流 ----
    showCancelKeep: (v) => set(() => ({ cancelKeep: v })),
    confirmCancel: () =>
      set((s) => {
        const order: DidiOrder = {
          id: newId('o'),
          status: 'canceled',
          carType: s.trip.carType || '快车',
          from: s.trip.from,
          to: s.trip.to || '目的地',
          createdAt: TimeService.now(),
          fare: 0, distanceKm: 0, durationMin: 0,
          payMethod: '免密支付', rated: false, rating: null, invoiced: false,
        };
        return {
          orders: [order, ...s.orders],
          trip: { ...s.trip, phase: 'canceled' },
          cancelKeep: false,
          cancelPicked: [],
        };
      }),
    toggleCancelReason: (opt) =>
      set((s) => ({
        cancelPicked: s.cancelPicked.includes(opt)
          ? s.cancelPicked.filter((x) => x !== opt)
          : [...s.cancelPicked, opt],
      })),
    submitCancelSurvey: () =>
      set(() => ({ lastToast: '感谢反馈,订单已取消' })),

    // ---- 评价 ----
    setCurrentOrderId: (orderId) => set(() => ({ currentOrderId: orderId })),
    openRate: (orderId) =>
      set((s) => {
        const o = s.orders.find((x) => x.id === orderId);
        return {
          currentOrderId: orderId,
          rateLevel: o?.rating?.level ?? null,
          rateTags: o?.rating?.tags ?? [],
          rateAnonymous: o?.rating?.anonymous ?? false,
          rateText: o?.rating?.text ?? '',
        };
      }),
    setRateLevel: (l) => set(() => ({ rateLevel: l, rateTags: [] })),
    toggleRateTag: (t) =>
      set((s) => ({
        rateTags: s.rateTags.includes(t)
          ? s.rateTags.filter((x) => x !== t)
          : [...s.rateTags, t],
      })),
    setRateAnonymous: (v) => set(() => ({ rateAnonymous: v })),
    setRateText: (t) => set(() => ({ rateText: t })),
    submitRate: (quick) =>
      set((s) => {
        if (!s.currentOrderId) return {};
        const level = quick ? 'good' : s.rateLevel;
        if (!level) return { lastToast: '请先选择评价' };
        return {
          orders: s.orders.map((o) =>
            o.id === s.currentOrderId
              ? {
                  ...o, rated: true,
                  rating: {
                    level,
                    tags: quick && s.rateTags.length === 0 ? ['一键好评'] : s.rateTags,
                    anonymous: s.rateAnonymous,
                    text: s.rateText,
                  },
                }
              : o,
          ),
          lastToast: quick ? '已一键好评' : '评价已提交',
        };
      }),
    claimFinishCoupons: () =>
      set((s) => {
        if (s.couponsClaimed) return { lastToast: '已领取' };
        return {
          couponsClaimed: true,
          user: { ...s.user, couponCount: s.user.couponCount + 4 },
          coupons: [
            {
              id: newId('cp'), title: '一起5折·5折券', amountText: '5折',
              condition: '3天内有效', expire: '3天内', category: 'travel',
              usable: true, count: 4,
            },
            ...s.coupons,
          ],
          lastToast: '4张5折券已到账',
        };
      }),
    claimHomeCoupons: () =>
      set((s) => {
        if (s.coupons.some((coupon) => coupon.id === 'cp_home_ride_bundle')) {
          return { lastToast: '打车券已领取' };
        }
        return {
          user: { ...s.user, couponCount: s.user.couponCount + 3 },
          coupons: [
            {
              id: 'cp_home_ride_bundle', title: '一起5折·打车券', amountText: '5折',
              condition: '快车、特惠快车可用', expire: '3天内', category: 'travel',
              usable: true, count: 3,
            },
            ...s.coupons,
          ],
          lastToast: '3张5折打车券已到账',
        };
      }),

    // ---- 订单/发票 ----
    setTripsSection: (section) => set(() => ({ tripsSection: section })),
    setTripsTab: (t) => set(() => ({ tripsTab: t, tripsSection: 'all' })),
    toggleTripsFilterType: (t) =>
      set((s) => ({
        tripsFilterTypes: s.tripsFilterTypes.includes(t)
          ? s.tripsFilterTypes.filter((x) => x !== t)
          : [...s.tripsFilterTypes, t],
      })),
    resetTripsFilter: () => set(() => ({ tripsFilterTypes: [] })),
    toggleInvoiceTrip: (orderId) =>
      set((s) => ({
        invoiceSelected: s.invoiceSelected.includes(orderId)
          ? s.invoiceSelected.filter((x) => x !== orderId)
          : [...s.invoiceSelected, orderId],
      })),
    setInvoiceSelected: (orderIds) => set(() => ({ invoiceSelected: [...orderIds] })),
    setInvoiceHeadType: (t) => set(() => ({ invoiceHeadType: t })),
    setInvoiceField: (k, v) =>
      set((s) => ({ invoiceFields: { ...s.invoiceFields, [k]: v } })),
    clearInvoiceDraft: () =>
      set(() => ({ invoiceFields: {}, invoiceHeadType: 'company' })),
    toggleInvoiceItinerary: () =>
      set((s) => ({ invoiceItinerary: !s.invoiceItinerary })),
    submitInvoice: () =>
      set((s) => ({
        orders: s.orders.map((o) =>
          s.invoiceSelected.includes(o.id) ? { ...o, invoiced: true } : o,
        ),
        invoiceSelected: [],
        invoiceFields: {},
        invoiceHeadType: 'company',
        invoiceApplications: [...s.invoiceApplications, {
          id: newId('invoice'), orderIds: [...s.invoiceSelected], headType: s.invoiceHeadType,
          fields: { ...s.invoiceFields }, itinerary: s.invoiceItinerary, submittedAt: TimeService.now(),
        }],
        lastToast: '开票申请已提交,发票将发送至邮箱',
      })),

    // ---- 消息/聊天 ----
    setMsgTab: (t) => set(() => ({ msgTab: t })),
    markMessagesRead: () =>
      set((s) => ({
        messageThreads: s.messageThreads.map((thread) => (
          thread.unread > 0 ? { ...thread, unread: 0 } : thread
        )),
      })),
    clearMessages: () =>
      set(() => ({ messageThreads: [], currentThreadId: null, lastToast: '消息已清空' })),
    clearMessageThread: (id) =>
      set((s) => ({
        messageThreads: s.messageThreads.filter((thread) => thread.id !== id),
        currentThreadId: s.currentThreadId === id ? null : s.currentThreadId,
        lastToast: '消息已清空',
      })),
    openThread: (id) =>
      set((s) => ({
        currentThreadId: id,
        messageThreads: s.messageThreads.map((t) => (t.id === id ? { ...t, unread: 0 } : t)),
      })),
    deleteChat: (id) =>
      set((s) => ({
        driverChats: s.driverChats.map((c) => (c.id === id ? { ...c, deleted: true } : c)),
        lastToast: '会话已删除',
      })),
    sendChat: (chatId, text) =>
      set((s) => ({
        driverChats: s.driverChats.map((c) =>
          c.id === chatId
            ? {
                ...c,
                lastMsg: text,
                msgs: [...c.msgs, { from: 'me', text, time: '刚刚' }],
              }
            : c,
        ),
      })),
    openChat: (id) => set(() => ({ currentChatId: id })),
    openTripChat: () =>
      set((s) => {
        const driver = s.trip.driver;
        if (!driver) {
          return { currentChatId: s.driverChats.find((c) => !c.deleted)?.id ?? null };
        }
        const existing = s.driverChats.find((c) => !c.deleted && c.driver === driver.name);
        if (existing) return { currentChatId: existing.id };
        const chat: DidiDriverChat = {
          id: newId('dc'),
          driver: driver.name,
          badge: s.trip.carType || '快车',
          plate: driver.plate,
          lastMsg: '我已接单,正在赶来',
          time: '刚刚',
          deleted: false,
          msgs: [
            {
              from: 'driver',
              text: '您好,我已接单,正在赶来接您,请在上车点稍候。',
              time: '刚刚',
            },
          ],
        };
        return {
          driverChats: [chat, ...s.driverChats],
          currentChatId: chat.id,
        };
      }),

    // ---- 钱包/券/支付 ----
    setCouponsCat: (c) => set(() => ({ couponsCat: c })),
    recordCouponViewed: (couponId) => set((s) => ({ taskAudit: { ...s.taskAudit, viewedCouponId: couponId } })),
    togglePayChannel: (id) =>
      set((s) => ({
        payChannels: s.payChannels.map((p) => (p.id === id ? { ...p, on: !p.on } : p)),
      })),
    setFamilyTab: (t) => set(() => ({ familyTab: t })),

    // ---- 着陆页 UI ----
    setHitchTab: (t) => set(() => ({ hitchTab: t })),
    setReserveTab: (t) => set(() => ({ reserveTab: t })),
    setReserveTime: (t) => set(() => ({ reserveTime: t })),
    setDeliveryTab: (t) => set(() => ({ deliveryTab: t })),
    setFeeStep: (sname) => set(() => ({ feeStep: sname })),

    // ---- 设置/安全 ----
    toggleSetting: (key) =>
      set((s) => ({
        settings: { ...s.settings, [key]: !s.settings[key] } as DidiSettings,
      })),
    setPayPasswordConfigured: (on) =>
      set((s) => ({ settings: { ...s.settings, payPasswordSet: on } })),
    setSkin: (skin) => set((s) => ({ settings: { ...s.settings, skin } })),
    clearCache: () =>
      set((s) => ({ settings: { ...s.settings, cacheMB: 0 }, lastToast: '缓存已清除' })),
    clearPrivateData: () => {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(PERSIST_NAME);
      const baseline = JSON.parse(JSON.stringify(initialState)) as DidiState;
      set(() => ({
        ...baseline,
        lastToast: '本地个人数据已清除',
      }));
    },
    addEmergencyContact: (name) =>
      set((s) => {
        if (s.settings.emergencyContacts.includes(name)) {
          return { lastToast: '该紧急联系人已添加' };
        }
        return {
          settings: {
            ...s.settings,
            emergencyContacts: [...s.settings.emergencyContacts, name],
          },
          lastToast: '紧急联系人已添加',
        };
      }),
    setAddress: (label, name) =>
      set((s) => ({
        addresses: s.addresses.map((a) => (a.label === label ? { ...a, name } : a)),
        lastToast: `${label}地址已更新`,
      })),
    setUserName: (name) => set((s) => ({ user: { ...s.user, name } })),
    setAvatarUri: (uri) => set(() => ({ avatarUri: uri })),
    openFaq: (id) => set(() => ({ currentFaqId: id })),
  }),
  {
    persistName: PERSIST_NAME,
    partialize: partializeDidiState,
  },
);

import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { seedTs } from './utils/appTime';
import { estimateFee } from './utils/pricing';
import { CAINIAO_CONFIG } from './data';
import { DATA_VERSION, PROHIBITED_DICT, ITEM_REF_WEIGHT } from './constants';
import type {
  FullState, AppActions, PackageItem, ShipOrder, ShipDraft, Address, Recipient, MessageEntry, TempState,
} from './types';

type SeedAt = { dayOffset: number; hm: string };
const ts = (at: SeedAt) => seedTs(at.dayOffset, at.hm);

function seedPackages(): PackageItem[] {
  return (CAINIAO_CONFIG.packages as unknown as Array<Record<string, unknown>>).map((p) => ({
    ...(p as unknown as PackageItem),
    statusTs: ts(p.statusAt as SeedAt),
    timeline: (p.timeline as Array<{ at: SeedAt; title: string; desc: string }>).map((n) => ({
      ts: ts(n.at), title: n.title, desc: n.desc,
    })),
  }));
}

function seedShipOrders(): ShipOrder[] {
  return (CAINIAO_CONFIG.shipOrders as unknown as Array<Record<string, unknown>>).map((o) => ({
    ...(o as unknown as ShipOrder),
    itemName: typeof o.itemName === 'string' ? o.itemName : '',
    remark: typeof o.remark === 'string' ? o.remark : '',
    placedAtTs: ts(o.placedAt as SeedAt),
  }));
}

function seedMsgs(key: 'packageMsgs' | 'wenwenMsgs'): MessageEntry[] {
  return (CAINIAO_CONFIG[key] as unknown as Array<Record<string, unknown>>).map((m) => ({
    ...(m as unknown as MessageEntry),
    ts: ts(m.at as SeedAt),
  }));
}

const EMPTY_FILTER = { packageType: [], owner: [], logistics: [], trade: [], company: [] };

function freshDraft(): ShipDraft {
  return {
    senderId: '', // 默认无寄件人,点地址簿选择(阶段⑥反馈#16)
    recipients: [],
    itemName: '',
    remark: '',
    method: 'pickup',
    speedTier: 'standard',
    slotDay: '明天',
    slot: '09:00-11:00',
    handover: null,
    stationId: 'st_north',
    lockerId: 'lk1',
    lockerCell: '小格口',
    insurance: 'none',
    insuranceValue: 0,
    agreement: true,
    recycleBox: false,
    modifyOrderId: null,
  };
}

const initialTemp: TempState = {
  toast: '', toastSeq: 0,
  filter: { ...EMPTY_FILTER },
  filterApplied: false,
  packageSearch: '', addressSearch: '',
  cancelReason: '',
  multiSelect: [], batchSelect: [],
  pendingDeleteAddressId: null, pendingDeleteOrderId: null,
  pendingConfirmPackageId: null, pendingReceiptOrderId: null,
  phoneDraft: '', phoneModifyMode: false, prohibitedQuery: '', prohibitedResult: null,
  pricingViewed: false, pricingRulesViewed: false,
  shipTopTab: '寄件',
  editingRecipientId: null,
};

const initialState: FullState = {
  _dataVersion: DATA_VERSION,
  user: { ...CAINIAO_CONFIG.user },
  addresses: CAINIAO_CONFIG.addresses.map((a) => ({ ...a })) as Address[],
  packages: seedPackages(),
  shipOrders: seedShipOrders(),
  shopOrders: CAINIAO_CONFIG.shopOrders.map((o) => ({ ...o })) as FullState['shopOrders'],
  packageMsgs: seedMsgs('packageMsgs'),
  wenwenMsgs: seedMsgs('wenwenMsgs'),
  unread: { ...CAINIAO_CONFIG.unread },
  coupons: CAINIAO_CONFIG.coupons.map((c) => ({ ...c })) as FullState['coupons'],
  marketCoupons: CAINIAO_CONFIG.marketCoupons.map((c) => ({ ...c })) as FullState['marketCoupons'],
  phones: CAINIAO_CONFIG.phones.map((p) => ({ ...p })),
  draft: freshDraft(),
  addressDraft: null,
  homeSegment: 'shouqu',
  homeHintDismissed: false,
  serviceChat: [],
  waybillScanImages: [],
  _temp: { ...initialTemp },
};

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

/** 订单号:时间戳数字串(避免 Math.random 拼 id,R7 合规) */
function genOrderNo(): string {
  return `2227${String(TimeService.now()).slice(-9)}${String(idCounter).padStart(4, '0')}`;
}

function genShipCode(): string {
  return String(1000 + ((TimeService.now() + idCounter * 97) % 9000));
}

export const useCainiaoStore = createAppStoreWithActions<FullState, AppActions>(
  'cainiao',
  initialState,
  (set, get) => ({
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),

    setTemp: (patch) => set((s) => ({ _temp: { ...s._temp, ...patch } })),

    setHomeSegment: (seg) => set(() => ({ homeSegment: seg })),
    dismissHomeHint: () => set(() => ({ homeHintDismissed: true })),

    confirmTaken: (packageId) =>
      set((s) => {
        const pid = packageId ?? s._temp.pendingConfirmPackageId ?? undefined;
        const now = TimeService.now();
        const signed: PackageItem[] = [];
        const packages = s.packages.map((p) => {
          if (p.status !== '待取件') return p;
          if (pid && p.id !== pid) return p;
          signed.push(p);
          return {
            ...p,
            status: '已签收' as const,
            statusTs: now,
            timeline: [
              { ts: now, title: '已签收', desc: '包裹已从代收点签收,签收人凭取货码签收。【来自代收点】' },
              ...p.timeline,
            ],
          };
        });
        // 包裹状态变化同步包裹消息(阶段⑥反馈#18)
        const newMsgs: MessageEntry[] = signed.map((p) => ({
          id: genId('pm'),
          ts: now,
          title: '签收通知',
          desc: `您的包裹「${p.title.slice(0, 12)}」已签收,点击查看 >>`,
          image: p.image,
          packageId: p.id,
        }));
        return {
          packages,
          packageMsgs: [...s.packageMsgs, ...newMsgs],
          unread: { ...s.unread, package: s.unread.package + newMsgs.length },
          _temp: { ...s._temp, pendingConfirmPackageId: null },
        };
      }),

    // ---- 地址 ----
    saveAddress: (a) => {
      let id = a.id ?? '';
      set((s) => {
        if (id && s.addresses.some((x) => x.id === id)) {
          return {
            addresses: s.addresses.map((x) => {
              if (x.id === id) return { ...x, ...a } as Address;
              return a.isDefaultSender ? { ...x, isDefaultSender: false } : x;
            }),
            addressDraft: null,
          };
        }
        id = genId('addr');
        const na: Address = {
          id,
          name: a.name ?? '',
          phone: a.phone ?? '',
          phoneType: a.phoneType ?? 'mobile',
          ext: a.ext,
          province: a.province ?? '',
          city: a.city ?? '',
          district: a.district ?? '',
          detail: a.detail ?? '',
          tagAddress: a.tagAddress,
          tagRelation: a.tagRelation,
          isDefaultSender: a.isDefaultSender ?? false,
        };
        return {
          addresses: [na, ...s.addresses.map((x) => (na.isDefaultSender ? { ...x, isDefaultSender: false } : x))],
          addressDraft: null,
        };
      });
      return id;
    },

    deleteAddresses: (ids) =>
      set((s) => ({
        addresses: s.addresses.filter((a) => !ids.includes(a.id)),
        draft: { ...s.draft, recipients: s.draft.recipients.filter((r) => !ids.includes(r.addressId)) },
        _temp: { ...s._temp, batchSelect: [], pendingDeleteAddressId: null },
      })),

    setAddressDraft: (patch) =>
      set((s) => ({ addressDraft: patch === null ? null : { ...(s.addressDraft ?? {}), ...patch } })),

    // ---- 寄件草稿 ----
    patchDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),

    setRecipient: (addressIds) =>
      set((s) => ({
        draft: {
          ...s.draft,
          recipients: addressIds.map((aid) => makeRecipient(aid)),
        },
      })),

    addRecipients: (addressIds) =>
      set((s) => {
        const exist = new Set(s.draft.recipients.map((r) => r.addressId));
        const added = addressIds.filter((a) => !exist.has(a)).map((aid) => makeRecipient(aid));
        return { draft: { ...s.draft, recipients: [...s.draft.recipients, ...added] }, _temp: { ...s._temp, multiSelect: [] } };
      }),

    removeRecipient: (recipientId) =>
      set((s) => ({ draft: { ...s.draft, recipients: s.draft.recipients.filter((r) => r.id !== recipientId) } })),

    patchRecipientItem: (patch) =>
      set((s) => {
        const rs = s.draft.recipients;
        if (rs.length === 0) return {};
        const targetId = s._temp.editingRecipientId ?? rs[0].id;
        return {
          draft: {
            ...s.draft,
            recipients: rs.map((r) => (r.id === targetId ? ({ ...r, ...patch } as Recipient) : r)),
          },
        };
      }),

    resetDraft: () => set(() => ({ draft: freshDraft() })),

    enterModify: (orderId) =>
      set((s) => {
        const o = s.shipOrders.find((x) => x.id === orderId);
        if (!o) return {};
        const addr = s.addresses.find((a) => a.name === o.toName) ?? s.addresses[0];
        const [itemType, w] = o.itemLabel.split(', ');
        const senderId = s.addresses.find((a) => a.isDefaultSender)?.id ?? s.addresses[0]?.id ?? '';
        return {
          draft: {
            ...freshDraft(),
            senderId,
            method: o.method,
            recipients: [{ ...makeRecipient(addr.id), itemType: itemType || '日用品', weightKg: parseInt(w, 10) || 1 }],
            itemName: o.itemName ?? '',
            remark: o.remark ?? '',
            modifyOrderId: orderId,
          },
        };
      }),

    submitOrder: () => {
      const s = get();
      const d = s.draft;
      if (d.recipients.length === 0) return null;
      const fee = estimateFee(d, s.addresses);
      const first = d.recipients[0];
      const addr = s.addresses.find((a) => a.id === first.addressId);
      if (!addr || !fee) return null;
      const statusOf = { pickup: '待上门取件', locker: '待投柜', station: '待到店自寄' } as const;
      const handoverText = d.handover ? `${d.handover.place} | ${d.handover.note}` : undefined;
      if (d.modifyOrderId) {
        // 修改模式(qa:Q17):更新原订单
        const oid = d.modifyOrderId;
        set((st) => ({
          shipOrders: st.shipOrders.map((o) =>
            o.id === oid
              ? {
                  ...o,
                  toName: addr.name, toCity: addr.city, toPhone: addr.phone,
                  toDetail: `${addr.province}${addr.city}${addr.district}${addr.detail}`,
                  itemLabel: `${first.itemType}, ${first.weightKg}kg`,
                  itemName: (d.itemName ?? '').trim(),
                  remark: (d.remark ?? '').trim(),
                  feeYuan: fee.total, method: d.method, status: statusOf[d.method],
                  slotText: d.method === 'pickup' ? `${d.slotDay} ${d.slot}` : undefined,
                  handoverText,
                  speedTier: d.speedTier,
                  stationId: d.stationId || undefined,
                  lockerId: d.lockerId || undefined,
                  lockerCell: d.method === 'locker' ? d.lockerCell : undefined,
                  insurance: d.insurance,
                  insuranceValue: d.insuranceValue,
                  recycleBox: d.recycleBox,
                  dims: { ...first.dims },
                  weightKg: first.weightKg,
                  slotDay: d.slotDay,
                  slot: d.slot,
                  handover: d.handover ? { ...d.handover, extras: [...d.handover.extras] } : null,
                }
              : o,
          ),
          draft: freshDraft(),
        }));
        return oid;
      }
      const id = genId('so');
      const now = TimeService.now();
      const sender = s.addresses.find((a) => a.id === d.senderId)
        ?? s.addresses.find((a) => a.isDefaultSender)
        ?? s.addresses[0];
      const shipCode = genShipCode();
      const order: ShipOrder = {
        id,
        orderNo: genOrderNo(),
        placedAtTs: now,
        typeLabel: '裹裹-标准寄',
        shipCode,
        status: statusOf[d.method],
        method: d.method,
        fromName: sender.name, fromCity: sender.city, fromPhone: sender.phone,
        fromDetail: `${sender.province}${sender.city}${sender.district}${sender.detail}`,
        toName: addr.name, toCity: addr.city, toPhone: addr.phone,
        toDetail: `${addr.province}${addr.city}${addr.district}${addr.detail}`,
        itemLabel: `${first.itemType}, ${first.weightKg}kg`,
        itemName: (d.itemName ?? '').trim(),
        remark: (d.remark ?? '').trim(),
        feeYuan: fee.total,
        slotText: d.method === 'pickup' ? `${d.slotDay} ${d.slot}` : undefined,
        handoverText,
        speedTier: d.speedTier,
        stationId: d.stationId || undefined,
        lockerId: d.lockerId || undefined,
        lockerCell: d.method === 'locker' ? d.lockerCell : undefined,
        insurance: d.insurance,
        insuranceValue: d.insuranceValue,
        recycleBox: d.recycleBox,
        dims: { ...first.dims },
        weightKg: first.weightKg,
        slotDay: d.slotDay,
        slot: d.slot,
        handover: d.handover ? { ...d.handover, extras: [...d.handover.extras] } : null,
      };
      // 寄件同步包裹消息(阶段⑥反馈#18)
      const shipMsg: MessageEntry = {
        id: genId('pm'),
        ts: now,
        title: '寄件通知',
        desc: `寄件订单已创建,寄件码 ${shipCode},快递员将按时上门取件 >>`,
        image: '/@app-assets/Cainiao/misc/courier.png',
      };
      set((st) => ({
        shipOrders: [order, ...st.shipOrders],
        packageMsgs: [...st.packageMsgs, shipMsg],
        unread: { ...st.unread, package: st.unread.package + 1 },
        draft: freshDraft(),
      }));
      return id;
    },

    cancelOrder: (orderId, reason) =>
      set((s) => ({
        shipOrders: s.shipOrders.map((o) =>
          o.id === orderId ? { ...o, status: '已取消' as const, cancelReason: reason } : o,
        ),
        _temp: { ...s._temp, cancelReason: '' },
      })),

    deleteShipOrder: (orderId) =>
      set((s) => ({
        shipOrders: s.shipOrders.filter((o) => o.id !== orderId),
        _temp: { ...s._temp, pendingDeleteOrderId: null },
      })),

    // ---- 消息 ----
    readAllMessages: () => set(() => ({ unread: { wenwen: 0, package: 0 } })),
    readChannel: (ch) => set((s) => ({ unread: { ...s.unread, [ch]: 0 } })),

    // ---- 购物 ----
    confirmReceipt: (orderId) =>
      set((s) => ({
        shopOrders: s.shopOrders.map((o) => (o.id === orderId ? { ...o, status: '交易成功' as const } : o)),
        _temp: { ...s._temp, pendingReceiptOrderId: null },
      })),

    claimMarketCoupon: (couponId) =>
      set((s) => {
        const mc = s.marketCoupons.find((c) => c.id === couponId);
        if (!mc || mc.claimed) return {};
        return {
          marketCoupons: s.marketCoupons.map((c) => (c.id === couponId ? { ...c, claimed: true } : c)),
          coupons: [
            ...s.coupons,
            { id: genId('r'), kind: 'redpacket' as const, discount: `¥${mc.redpacket}`, title: '菜鸟淘礼金红包', expiryText: '3天后过期' },
          ],
        };
      }),

    // 刷新:重置所有精选券领取态,回收本次领取产生的红包(阶段⑥反馈#12)
    refreshMarketCoupons: () =>
      set((s) => ({
        marketCoupons: s.marketCoupons.map((c) => ({ ...c, claimed: false })),
        coupons: s.coupons.filter((c) => !(c.kind === 'redpacket' && c.id.startsWith('r_'))),
      })),

    // ---- 手机号 ----
    addPhone: (number) =>
      set((s) => ({
        phones: s.phones.some((p) => p.number === number) ? s.phones : [...s.phones, { number, primary: false }],
        _temp: { ...s._temp, phoneDraft: '', phoneModifyMode: false },
      })),

    /** 换绑账号绑定手机号(修改流程) */
    updatePrimaryPhone: (number) =>
      set((s) => ({
        phones: s.phones.map((p) => (p.primary ? { ...p, number } : p)),
        user: { ...s.user, phone: number },
        _temp: { ...s._temp, phoneDraft: '', phoneModifyMode: false },
      })),

    /** 客服对话追加(持久化,退出重进仍在) */
    pushServiceChat: (msgs) =>
      set((s) => {
        const ts = TimeService.realNow();
        const added = msgs.map((m, i) => ({ ...m, id: `sc_${ts.toString(36)}_${i}` }));
        return { serviceChat: [...s.serviceChat, ...added] };
      }),

    // ---- 禁寄查询 ----
    queryProhibited: (name) =>
      set((s) => {
        const q = (name || s._temp.prohibitedQuery).trim();
        if (!q) return {};
        const hit = PROHIBITED_DICT[q];
        const verdictText = hit ? { ok: '可以邮寄', limited: '限制寄递', no: '禁止寄递' }[hit.verdict] : '可以邮寄';
        return {
          _temp: {
            ...s._temp,
            prohibitedQuery: q,
            prohibitedResult: { name: q, verdict: verdictText, note: hit?.note ?? '普通物品,可正常寄递(请勿夹带禁寄品)' },
          },
        };
      }),
  }),
  {
    persistName: `cainiao_v${DATA_VERSION}`,
    partialize: (state) => {
      const { _temp, ...rest } = state as FullState & AppActions;
      void _temp;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<FullState>;
    },
  },
);

function makeRecipient(addressId: string): Recipient {
  idCounter += 1;
  return {
    id: `rcp_${idCounter}_${addressId}`,
    addressId,
    itemType: '日用品',
    weightKg: ITEM_REF_WEIGHT['日用品'] ?? 1,
    volumeOn: false,
    dims: { l: '', w: '', h: '' },
  };
}

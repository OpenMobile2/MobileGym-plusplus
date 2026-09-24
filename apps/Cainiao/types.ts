/** 菜鸟复刻 — 类型定义。所有 *Ts 字段为绝对 Unix 毫秒(种子经 appTime 映射到模拟今天附近)。 */

export type PackageStatus = '待取件' | '派送中' | '运输中' | '已揽件' | '待发货' | '已签收';

export interface TimelineNode {
  ts: number; // 绝对 Unix 毫秒
  title: string; // 已签收/待取件/派送中/运输中/已揽件
  desc: string;
}

export interface PackageItem {
  id: string;
  title: string;
  source: string; // 天猫 | 天猫退货
  image: string; // /@app-assets/Cainiao/...
  company: string; // 极兔速递/邮政快递/中通快递…
  trackingNo: string;
  status: PackageStatus;
  kind: '收件' | '寄件' | '停滞件';
  owner: '我的' | '亲友';
  tradeStatus?: '退款成功' | '已确认收货';
  official?: boolean; // 菜鸟速递官方
  staleHint?: boolean; // 「很久没更新了」提示条
  pickupCode?: string;
  station?: string;
  stationCell?: string;
  daysInStation?: number;
  statusTs: number; // 状态时间(签收时间/入站时间)
  timeline: TimelineNode[];
}

export type PhoneType = 'mobile' | 'landline';

export interface Address {
  id: string;
  name: string;
  phone: string;
  phoneType: PhoneType;
  ext?: string; // 座机分机号
  province: string;
  city: string;
  district: string;
  detail: string;
  tagAddress?: string; // 家/公司/学校
  tagRelation?: string; // 亲人/朋友/客户
  isDefaultSender?: boolean;
}

export interface Recipient {
  id: string; // recipientId(草稿内唯一)
  addressId: string;
  itemType: string;
  weightKg: number;
  volumeOn: boolean;
  dims: { l: string; w: string; h: string };
}

export type ShipMethod = 'pickup' | 'locker' | 'station';
export type SpeedTier = 'standard' | 'premium' | 'large';
export type InsuranceTier = 'none' | 'p500' | 'p1000' | 'custom';

export interface ShipDraft {
  senderId: string;
  recipients: Recipient[];
  itemName: string;
  remark: string;
  method: ShipMethod;
  speedTier: SpeedTier;
  slotDay: '今天' | '明天' | '后天';
  slot: string; // 09:00-11:00
  handover: { place: string; note: string; extras: string[] } | null;
  stationId: string; // 服务点自寄选中的驿站
  lockerId: string; // 到柜寄选中的柜机(柜机查询页回填)
  lockerCell: '小格口' | '中格口' | '大格口';
  insurance: InsuranceTier;
  insuranceValue: number; // 自定义物品价值(元)
  agreement: boolean;
  recycleBox: boolean;
  modifyOrderId: string | null; // 修改模式(qa:Q17)
}

export type ShipOrderStatus = '待上门取件' | '待投柜' | '待到店自寄' | '已寄出' | '已取消';

export interface ShipOrder {
  id: string;
  orderNo: string;
  placedAtTs: number;
  typeLabel: string; // 裹裹-标准寄 / 天猫-标准寄
  shipCode?: string; // 寄件码
  status: ShipOrderStatus;
  method: ShipMethod;
  fromName: string;
  fromCity: string;
  fromPhone: string;
  fromDetail?: string; // 寄件人详细地址(脱敏展示)
  toName: string;
  toCity: string;
  toPhone: string;
  toDetail: string;
  itemLabel: string; // 衣物, 1kg
  itemName: string;
  remark: string;
  feeYuan: number;
  slotText?: string; // 明天 09:00-11:00
  handoverText?: string; // 当面交件 | 需要打电话
  speedTier?: SpeedTier;
  stationId?: string;
  lockerId?: string;
  lockerCell?: ShipDraft['lockerCell'];
  insurance?: InsuranceTier;
  insuranceValue?: number;
  recycleBox?: boolean;
  dims?: Recipient['dims'];
  weightKg?: number;
  slotDay?: ShipDraft['slotDay'];
  slot?: string;
  handover?: ShipDraft['handover'];
  cancelReason?: string;
}

export interface ShopOrder {
  id: string;
  shop: string;
  status: '卖家已发货' | '交易成功' | '待付款' | '待发货';
  itemTitle: string;
  image: string;
  paidYuan: number;
  packageId?: string; // 查看物流跳包裹
}

export interface MessageEntry {
  id: string;
  ts: number;
  title: string; // 签收通知/派送通知…
  desc: string;
  image?: string;
  packageId?: string;
}

export interface Coupon {
  id: string;
  kind: 'shipping' | 'redpacket';
  discount: string; // 1折 / 8.8折 / ¥8 / ¥0.5
  title: string;
  expiryText: string;
}

export interface MarketCoupon {
  id: string;
  title: string;
  image: string;
  priceBefore: number;
  redpacket: number; // 红包 0.5元
  claimed: boolean;
}

export interface UserInfo {
  nick: string;
  name: string;
  phone: string;
  avatar: string;
  idCode: string;
  station: string; // 常用驿站
  points: number;
  timeoutPerk: number;
  shipDiscountYuan: number;
}

export interface PackageFilter {
  packageType: string[];
  owner: string[];
  logistics: string[];
  trade: string[];
  company: string[];
}

export interface TempState {
  toast: string;
  toastSeq: number;
  filter: PackageFilter;
  filterApplied: boolean;
  packageSearch: string;
  addressSearch: string;
  cancelReason: string;
  multiSelect: string[]; // 地址簿多选勾选
  batchSelect: string[]; // 地址簿批量删除勾选
  pendingDeleteAddressId: string | null;
  pendingDeleteOrderId: string | null;
  pendingConfirmPackageId: string | null;
  pendingReceiptOrderId: string | null;
  phoneDraft: string; // 添加/修改手机号草稿
  phoneModifyMode: boolean; // true=换绑主号,false=添加新号
  prohibitedQuery: string;
  prohibitedResult: { name: string; verdict: string; note: string } | null;
  pricingViewed: boolean;
  pricingRulesViewed: boolean;
  shipTopTab: string; // 寄件页顶部Tab(仅视觉选中)
  editingRecipientId: string | null; // 物品信息弹层作用的收件人
}

/** 客服中心对话气泡(退出重进保留) */
export interface ServiceChatMsg {
  id: string;
  role: 'user' | 'bot';
  text: string;
  orderId?: string;
  canModify?: boolean;
}

export interface FullState {
  _dataVersion: number;
  user: UserInfo;
  addresses: Address[];
  packages: PackageItem[];
  shipOrders: ShipOrder[];
  shopOrders: ShopOrder[];
  packageMsgs: MessageEntry[];
  wenwenMsgs: MessageEntry[];
  unread: { wenwen: number; package: number };
  coupons: Coupon[];
  marketCoupons: MarketCoupon[];
  phones: { number: string; primary: boolean }[];
  draft: ShipDraft;
  addressDraft: Partial<Address> | null;
  homeSegment: 'shouqu' | 'jitui';
  homeHintDismissed: boolean;
  serviceChat: ServiceChatMsg[];
  /** 搜索页「批量上传图片」选中的运单截图 URI（系统相册写入，getState 可见） */
  waybillScanImages: string[];
  _temp: TempState;
}

export interface AppActions {
  showToast: (msg: string) => void;
  setTemp: (patch: Partial<TempState>) => void;
  // 包裹
  confirmTaken: (packageId?: string) => void;
  setHomeSegment: (seg: 'shouqu' | 'jitui') => void;
  dismissHomeHint: () => void;
  // 地址
  saveAddress: (a: Partial<Address> & { id?: string }) => string;
  deleteAddresses: (ids: string[]) => void;
  setAddressDraft: (patch: Partial<Address> | null) => void;
  // 寄件草稿
  patchDraft: (patch: Partial<ShipDraft>) => void;
  setRecipient: (addressIds: string[]) => void;
  addRecipients: (addressIds: string[]) => void;
  removeRecipient: (recipientId: string) => void;
  patchRecipientItem: (patch: { itemType?: string; weightKg?: number; volumeOn?: boolean; dims?: { l: string; w: string; h: string } }) => void;
  resetDraft: () => void;
  enterModify: (orderId: string) => void;
  submitOrder: () => string | null;
  cancelOrder: (orderId: string, reason: string) => void;
  deleteShipOrder: (orderId: string) => void;
  // 消息
  readAllMessages: () => void;
  readChannel: (ch: 'wenwen' | 'package') => void;
  // 购物
  confirmReceipt: (orderId: string) => void;
  claimMarketCoupon: (couponId: string) => void;
  refreshMarketCoupons: () => void;
  // 手机号
  addPhone: (number: string) => void;
  updatePrimaryPhone: (number: string) => void;
  pushServiceChat: (msgs: Omit<ServiceChatMsg, 'id'>[]) => void;
  // 禁寄查询
  queryProhibited: (name: string) => void;
}

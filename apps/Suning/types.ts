/**
 * 苏宁易购复刻 — 类型定义(L1 数据层)。
 * 种子时间统一用 SeedAt(dayOffset 相对模拟今天 + hm 时刻),由 L2 store 初始化时经
 * appTime 映射为绝对时间(参考 Cainiao 的 SeedAt 模式),种子里不写死日历日期。
 */

/** 相对时间种子:dayOffset=0 为模拟今天,负数为过去;hm 为 "HH:mm" 或 "HH:mm:ss" */
export interface SeedAt {
  dayOffset: number;
  hm: string;
}

/* ============ 商品 ============ */

export type ProductCategory =
  | 'fan'
  | 'ac'
  | 'fridge'
  | 'washer'
  | 'tv'
  | 'tablet'
  | 'phone'
  | 'laptop'
  | 'kitchen'
  | 'tissue'
  | 'drink'
  | 'food'
  | 'clean';

/** 促销标:gov=政府补贴 / baibu=百亿补贴 / juhui=大聚惠 / null=无 */
export type PromoTag = 'gov' | 'baibu' | 'juhui' | null;

/** 商详模板:4 个全量商详商品用前 4 种,其余列表级商品用 list(spec product.detail uiStates) */
export type DetailTemplate = 'fan' | 'tablet' | 'fresh' | 'cola' | 'list';

/** 榜型重排序字段(rank.detail 销量/回购/折扣/趋势/新品 榜型行) */
export interface RankFields {
  sales: number; // 月销量
  rebuy: number; // 回购指数
  discount: number; // 折扣率(到手价/划线价×100,越小折扣越深)
  trend: number; // 趋势热度
  newness: number; // 上市天数(越小越新)
}

export interface SkuOption {
  id: string;
  label: string;
  price?: number;
  priceOriginal?: number;
  hot?: boolean; // 「热销」角标
  disabled?: boolean; // 置灰划线禁用项
}

export interface SkuGroup {
  name: string; // 型号 / 颜色 / 配置 / 规格
  options: SkuOption[];
}

export interface WarrantyOption {
  id: string;
  label: string; // 只换不修N年 / 整机保修N年 / 性能意外全保N年
  price: number;
  tag?: string; // 9折 / 限时赠1年
}

export interface ProductSku {
  codeText: string; // 商品编码文案
  groups: SkuGroup[];
  warranty?: WarrantyOption[]; // 保障服务档位
  minQty: number;
  limitQty: number; // 限购件数(风扇5 / 榴莲10)
  installments?: string[]; // 花呗分期/任性付档位(展示型)
}

export interface Product {
  id: string;
  title: string;
  category: ProductCategory;
  brand: string;
  shopId: string;
  price: number; // 到手价
  priceOriginal: number; // 划线价
  promoTag: PromoTag;
  salesText: string; // 「月销497」
  reviewCount: number;
  goodRate: number; // 好评率百分数(79 = 79%)
  rankFields: RankFields;
  /** 筛选维度属性(风扇 type/control/gears/windMode…,平板 storage/screen/ram/os…,其余 service/spec 等) */
  attrs: Record<string, string | string[]>;
  image: string; // /@app-assets/Suning/products/<id>.png
  gallery: string[]; // 1~3 张
  detailTemplate: DetailTemplate;
  tradeInPrice?: number; // 以旧换新预计换新价(3C,MatePad=794.15)
  sku?: ProductSku; // 4 个全量商详商品携带
}

/* ============ 店铺 ============ */

/** self=苏宁自营(红标) / store=专卖店·专营店·旗舰店(苏宁好店标) */
export type ShopType = 'self' | 'store';

export interface Shop {
  id: string;
  name: string;
  type: ShopType;
  followers: number;
  followed: boolean; // 华为/美的/格力初始已关注(s346/s347 + me.follow 店铺Tab)
  logo: string;
}

/* ============ 订单 ============ */

export type OrderStatus =
  | 'pendingPay'
  | 'awaitShip'
  | 'supplierShip'
  | 'shipping'
  | 'completed'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  skuText: string;
  qty: number;
  price: number;
}

export interface OrderTimestamps {
  placed: SeedAt;
  paid?: SeedAt;
  shipped?: SeedAt;
  delivered?: SeedAt;
  cancelled?: SeedAt;
}

/** 物流时间线节点(数组倒序:最新在前) */
export interface LogisticsNode {
  at: SeedAt;
  title: string; // 已支付/订单已确认/已揽收/运输中/已签收
  desc: string;
}

export interface OrderInvoice {
  type: '不开发票' | '电子普通发票';
  title?: string; // 发票抬头(脱敏:苏宁用户)
  status: '未开票' | '已开票';
}

/** 退款单(供应商单退款审核中;refund.detail 四步进度固定停留第 1 步) */
export interface OrderRefund {
  /** 服务单号(refund.detail 的 ?serviceId=,样式同订单号 G3001617207) */
  serviceNo: string;
  status: string; // 等待审核
  reason: string;
  amount: number;
  qty: number;
  appliedAt: SeedAt;
  steps: string[]; // 发起申请/供应商审核/退款处理/退款完成
  currentStep: number;
}

/** 订单收货地址快照:order.modify 改地址只落到本单,不动地址簿 */
export interface OrderAddress {
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  detail: string;
}

export interface Order {
  id: string;
  orderNo: string;
  status: OrderStatus;
  shopId: string;
  items: OrderItem[];
  amount: number;
  payMethod: string | null; // 支付宝;待支付/已取消为 null
  timestamps: OrderTimestamps;
  logistics: LogisticsNode[];
  invoice: OrderInvoice | null;
  remainSec?: number; // 待支付倒计时秒数(86387)
  etaDayOffset?: number; // 预计送达 = 今天 + N 天
  etaRange?: string; // 09:00-21:00
  reviewed?: boolean; // completed 单是否已评价(false → 待评价 Tab 非空)
  refund?: OrderRefund;
  cancelReason?: string;
  /** 本单收货地址;未改过则为空,展示时回落到地址簿默认地址 */
  address?: OrderAddress;
}

/* ============ 地址(单条,全量脱敏) ============ */

export interface Address {
  id: string;
  name: string; // 苏宁用户(脱敏)
  phone: string; // 198****0000
  tags: string[]; // 默认/学校
  province: string;
  city: string;
  district: string;
  street: string;
  detail: string; // 翠屏华庭快递驿站
  isDefault: boolean;
}

/* ============ 优惠券 ============ */

export interface Coupon {
  id: string;
  title: string; // 新人专享礼包券
  tag: string; // 礼包券
  amountYuan: number;
  thresholdYuan: number;
  scopeText: string;
  validText: string; // 2026.03.18-2026.10.31
  useKeyword: string; // 「去使用」预置搜索词(qa coupons-use-target=B)
}

export interface CouponsData {
  yigou: Coupon[]; // 易购券 9 张
  redpacket: Coupon[]; // 红包 0
  lijin: number; // 我的礼金 0
}

/* ============ 评价 ============ */

export interface ReviewSummary {
  total: number;
  withImages: number;
  quality: number; // 优质评价
  mid: number; // 中评
  bad: number; // 差评
  goodRate: number; // 百分数
}

export interface ReviewItem {
  id: string;
  nick: string; // 打码昵称 p***a
  avatar: string; // 狮子头像
  level: string; // 会员等级角标
  ip: string; // IP属地
  stars: number; // 1~5
  sku: string; // 已购规格
  text: string;
  likes: number;
  at: SeedAt;
  images?: string[]; // 晒图(复用商品 gallery 路径)
}

export interface ProductReviews {
  summary: ReviewSummary;
  items: ReviewItem[];
}

/* ============ 榜单 ============ */

export type RankBoardType = 'sales' | 'rebuy' | 'discount' | 'trend' | 'new';

export interface RankEntry {
  productId: string;
  badges: string[]; // 近30天销量过千 / 87天价格最低 / 近4天连续入榜
  quote: { nick: string; text: string }; // 用户评价摘录(打码昵称 1***1 式)
}

export interface Rank {
  id: string; // acHot | phonePop | tissue
  title: string;
  soldText: string; // 卖爆NNN件
  boardTypes: RankBoardType[]; // 榜型行(按 rankFields 重排序)
  items: RankEntry[];
}

/** 百亿补贴频道 listing(s288);productId 指向商品池 */
export interface BaibuChannelItem {
  productId: string;
  category: 'featured' | '3c' | 'ac' | 'appliance' | 'furniture';
  dailyPrice: number;
  subsidyPrice: number;
  savedYuan: number;
  progress: number; // 已抢进度 0~100
  salesText: string;
}

/* ============ 关注 / 足迹 ============ */

export interface FollowedProduct {
  productId: string;
  /** 降价通知订阅价;null=初始未订阅(MatePad 照用户拍板为 null,水壶=85) */
  subscribePrice: number | null;
}

export interface FollowsData {
  products: FollowedProduct[];
  shops: string[]; // shopId 列表(与 Shop.followed 一致)
  creators: string[]; // creatorId 列表
}

export interface HistoryEntry {
  productId: string;
  dayOffset: number; // 0=今天,负数为历史日期(分布 ≥3 个日期)
}

/* ============ 达人 / 发现内容 ============ */

export interface CreatorPost {
  id: string;
  title: string;
  views: number;
  cover: string;
}

/** 发现Tab 关注流的一条动态(s295:文案 + 可选封面卡 + 直播中角标 + 资质行) */
export interface CreatorFeed {
  text: string;
  cover?: string;
  live?: boolean;
  /** 达人资质行(脱敏泛化:江苏××文化传媒有限公司) */
  cert?: string;
}

export interface Creator {
  id: string;
  name: string;
  avatar: string;
  followingCount: number;
  fansText: string; // 3.1万
  likeCount: number;
  ip: string;
  bio: string;
  tabCounts: { posts: number; videos: number; lives: number };
  posts: CreatorPost[]; // 妮子 4 条图文,其余空数组
  /** 有此字段的达人才进发现Tab 关注流动态列表 */
  feed?: CreatorFeed;
}

export type ContentCardType = 'video' | 'live' | 'post';

/** 精选流二级Tab:内容广场=全部,其余按此标签过滤 */
export type ContentChannel = 'daily' | 'food' | 'trend';

export interface ContentCard {
  id: string;
  type: ContentCardType;
  title: string;
  creatorId: string;
  cover: string;
  viewsText: string; // 2.3万次播放 / 8642阅读
  channel: ContentChannel;
  /** 封面角标:视频时长 / 图文张数 / 直播中 */
  badge: string;
  /** 内嵌商品条(Q29=A 独立热区 → 商详);≥2 张卡携带 */
  productId?: string;
}

/* ============ 购物车 ============ */

export interface CartItem {
  id: string;
  shopId: string;
  productId: string;
  skuText: string;
  qty: number;
  price: number;
  priceOriginal?: number;
  selected: boolean; // 初始全不勾选(s296)
  serviceText?: string; // 服务:整机保修3年
  tags?: string[]; // 领券
  subsidyHint?: string; // 国补领后约¥6586.65
  freeShipping?: boolean; // 勾选后显示「已免运费」
}

export interface CompareParamKey {
  key: string; // 对应 Product.attrs 的键(brand 取 Product.brand)
  label: string;
}

export interface CompareGroup {
  name: string; // 电脑品类
  category: ProductCategory;
  productIds: string[]; // 仅同品类两台(阶段④强调)
  paramKeys: CompareParamKey[]; // 精简 ~14 行(a353)
  reputation: { productId: string; reviewText: string; rankText?: string }[];
  service: {
    delivery: string[]; // 苏宁发货 / 店铺发货
    deliveryEtaDayOffsets: number[]; // 预计送达相对今天的偏移
    install: string;
    warranty: string;
  };
}

export interface CartData {
  items: CartItem[];
  compareGroup: CompareGroup;
}

/* ============ 搜索 ============ */

export interface HotCategory {
  name: string; // 手机 / 冰箱
  heatText: string; // 11.6万热度
  topBrands: string[]; // Top3 品牌
}

export interface SearchSuggestGroup {
  prefix: string; // 输入前缀(华为)
  shopHint: string; // 首行「搜索"华为"相关店铺」
  words: string[];
}

export interface SearchConfig {
  placeholders: string[]; // 首页搜索框轮播占位词
  recentDefault: string[]; // 最近搜索初始 4 条(s275)
  guessWords: string[]; // 猜你想搜双列 8 条
  hotCategories: HotCategory[];
  suggest: SearchSuggestGroup[];
  fullResultKeywords: string[]; // 做全量结果的词(风扇/华为平板),其余回退通用列表
}

/* ============ 筛选维度(a358~a362) ============ */

export interface FilterDim {
  key: string; // 对应 Product.attrs 键;priceRange 特殊处理
  label: string;
  multi: boolean;
  options?: string[];
  presets?: string[]; // 价格区间预设档
  inputEnabled?: boolean; // 最低/最高价手输
}

export interface FilterDimSet {
  dims: FilterDim[];
}

/** fan/tablet 两套完整 + generic 通用套(服务/价格/品牌) */
export interface FilterDimsData {
  fan: FilterDimSet;
  tablet: FilterDimSet;
  generic: FilterDimSet;
}

/* ============ 客服(会话按 shopId 隔离) ============ */

export interface ChatRule {
  keywords: string[];
  reply: string;
}

export interface ChatCommonConfig {
  systemNotice: string; // 系统灰条欢迎语
  robotName: string; // Sunny
  robotAvatar: string;
  robotWelcome: string;
  hotQuestions: string[]; // 热门问题卡(横滑两张)
  quickGrid: string[]; // 快捷宫格
  bottomChips: string[]; // 底部 chips(与规则引擎同机制)
  rules: ChatRule[]; // 命中关键词 → 预设答案
  fallback: string; // 未命中兜底话术
}

export interface ChatShopConfig {
  shopId: string;
  /** 标题按店铺类型:自营家电=家电管家 / 超市自营=苏宁超市客服 / 专卖店=店铺名 */
  title: string;
}

export interface ChatConfig {
  common: ChatCommonConfig;
  byShop: ChatShopConfig[];
}

/* ============ 消息 ============ */

/** 四开关默认全开(s302),纯本地 state;字段对齐 spec actionId */
export interface MsgSettings {
  chatRemind: boolean;
  banner: boolean;
  ring: boolean;
  vibrate: boolean;
}

/** 消息(默认空态 s301;交易物流频道由订单事件动态生成) */
export interface MessageEntry {
  id: string;
  channel: 'trade' | 'notice' | 'interact';
  title: string;
  desc: string;
  at: SeedAt;
  orderId?: string;
  image?: string;
}

/* ============ 用户 / 全量默认数据 ============ */

export interface UserInfo {
  nickname: string;
  phoneMasked: string;
  avatar: string;
  yunzuan: number;
  registeredAt: string;
}

/** defaults.json 的完整形状(SUNING_CONFIG 的类型) */
export interface SuningDefaults {
  user: UserInfo;
  products: Product[];
  shops: Shop[];
  orders: Order[];
  addresses: Address[]; // 种子地址 2 条(默认「学校」+「公司」)
  coupons: CouponsData;
  reviews: Record<string, ProductReviews>; // key=productId(4 个全量商详)
  ranks: Rank[];
  baibuChannel: BaibuChannelItem[];
  follows: FollowsData;
  history: HistoryEntry[];
  creators: Creator[];
  contentCards: ContentCard[];
  cart: CartData;
  searchConfig: SearchConfig;
  filterDims: FilterDimsData;
  chatConfig: ChatConfig;
  msgSettings: MsgSettings;
  messages: MessageEntry[];
}

/* ============ L2 运行时类型(SeedAt 在 store 初始化时映射为绝对时间戳) ============ */

/** 物流节点(运行时,倒序:最新在前) */
export interface RuntimeLogisticsNode {
  ts: number;
  title: string;
  desc: string;
}

export interface RuntimeOrderTimestamps {
  placed: number;
  paid?: number;
  shipped?: number;
  delivered?: number;
  cancelled?: number;
}

export interface RuntimeOrderRefund extends Omit<OrderRefund, 'appliedAt'> {
  appliedAtTs: number;
  note?: string; // 退款说明(选填,≤60字)
}

export interface RuntimeOrder extends Omit<Order, 'timestamps' | 'logistics' | 'refund' | 'etaDayOffset'> {
  timestamps: RuntimeOrderTimestamps;
  logistics: RuntimeLogisticsNode[];
  refund?: RuntimeOrderRefund;
  /** 预计送达日 00:00 的绝对时间戳(文案「预计2026-07-28送达」由 fmtYmd 生成) */
  etaTs?: number;
  /** 下单来源购物车条目 id(支付成功后从购物车移除;buyNow 单为空) */
  cartItemIds?: string[];
  /** 同一次结算(多店铺拆单)创建的订单批次;paySuccess 按批次整体流转 */
  batchId?: string;
  /** 结算时选择的支付方式文案(待支付期间 payMethod 保持 null,支付成功后落入 payMethod) */
  chosenPayMethod?: string;
}

export interface RuntimeHistoryEntry {
  productId: string;
  ts: number;
}

export interface RuntimeReviewItem extends Omit<ReviewItem, 'at'> {
  ts: number;
}

export interface RuntimeProductReviews {
  summary: ReviewSummary;
  items: RuntimeReviewItem[];
}

export interface RuntimeMessageEntry extends Omit<MessageEntry, 'at'> {
  ts: number;
}

/** 客服会话消息(运行时追加;种子消息流为 chatConfig 静态区块,不入 store) */
export interface RuntimeChatMessage {
  id: string;
  role: 'user' | 'bot';
  /** text=文字气泡;product=商品卡消息(「发送商品」) */
  kind: 'text' | 'product';
  text: string;
  productId?: string;
  ts: number;
}

/* ============ 结算草稿 ============ */

export interface CheckoutDraftItem {
  /** 来源购物车条目 id;buyNow 单品为 null */
  cartItemId: string | null;
  productId: string;
  shopId: string;
  skuText: string;
  price: number;
  qty: number;
}

export type PayMethod = 'alipay' | 'wechat';
export type InvoiceType = 'none' | 'electronic';

export interface CheckoutDraft {
  source: 'cart' | 'buyNow';
  items: CheckoutDraftItem[];
  /** 选中的收货地址 id */
  addressId: string;
  payMethod: PayMethod;
  /** 送货日=今天+N(1~7,spec checkout sheetDeliveryTime) */
  deliveryDayOffset: number;
  deliverySlot: string; // 09:00-21:00
  invoiceType: InvoiceType;
  /** 延保档位(可取消单选);价格计入合计 */
  warrantyId: string | null;
  warrantyPrice: number;
  /** 国补勾选:勾选→合计按 -15% 计(展示层按此布尔换算) */
  subsidyChecked: boolean;
  /** 国补弹窗是否已弹过(进入结算页仅自动弹一次) */
  subsidyDialogSeen: boolean;
}

/* ============ 地址草稿(address.edit 表单) ============ */

export interface AddressDraft {
  id: string | null; // null=新增
  name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  street: string;
  detail: string;
  /** 单选标签:家/公司/学校/自定义标签文案;''=未选 */
  tag: string;
  /** 「添加标签」弹窗保存的自定义标签池(≤5字) */
  customLabels: string[];
  isDefault: boolean;
}

/* ============ 搜索结果筛选(集合选择放 _temp;排序等离散态走 URL) ============ */

export interface SearchFilterState {
  /** 维度 key → 已选值(多选维度可多值,单选维度至多一值) */
  dims: Record<string, string[]>;
  pricePreset: string | null;
  priceMin: string;
  priceMax: string;
}

export interface UnreadState {
  trade: number;
  notice: number;
  interact: number;
}

/* ============ Store(L2) ============ */

export interface TempState {
  toast: string;
  toastSeq: number;
  /** 关注/足迹编辑态多选(productId 集合) */
  multiSelect: string[];
  /** 购物车编辑态勾选(独立于正常勾选,进入编辑态清零重计,s298) */
  editSelect: string[];
  /** 取消订单弹层当前选中原因 */
  cancelReason: string;
  /** 退款申请表单草稿 */
  refundDraft: { reason: string; note: string };
  /** 昵称编辑弹窗草稿 */
  nicknameDraft: string;
  /** 设置页账号卡「个人信息」红点,进入 profile 后消除 */
  profileDot: boolean;
  /** me.follow ?dialog=priceWatch 的期望价格输入(空串=用现价占位) */
  priceWatchDraft: string;
  /** 收银台密码页已输数字串(≤6位) */
  payDigits: string;
  /**
   * 「立即支付」建单后的待付订单 id:orderId 在点击瞬间才由 placeOrder 生成,
   * URL 参数在控件 bind 期已固化无法携带,故经此交接给 pay.password
   */
  payingOrderId: string | null;
  /** 取消原因弹层作用的订单 id(弹层 transition 无 paramsSchema) */
  pendingCancelOrderId: string | null;
  /** 删除确认弹窗上下文 */
  pendingDeleteAddressId: string | null;
  pendingDeleteOrderId: string | null;
  /** 修改订单表单草稿(order.modify 表单,提交写回订单 address) */
  orderModifyDraft: OrderAddress | null;
  /** 草稿所属订单;与当前 orderId 不符才用订单地址重新初始化(去地址簿选完返回时不能被覆盖) */
  orderModifyDraftId: string | null;
  /** 地区选择器弹层内的逐级点选路径 [省,市,区,街道],选满四级才回填草稿 */
  orderModifyRegion: string[];
  /** address.edit ?sheet=region 的逐级点选路径,与 orderModifyRegion 同构但互不干扰 */
  addressRegion: string[];
  /** ?dialog=addLabel 输入框内容(≤5字校验在保存时做) */
  addressLabelDraft: string;
  /** 「粘贴地址 自动识别填写」文本域内容 */
  addressPasteDraft: string;
  /**
   * address.list ?mode=picker 的回填目标:
   * default=置为全局默认地址(商详送至/购物车定位/筛选地址行);orderModify=回填改单表单
   */
  addressPickTarget: 'default' | 'orderModify' | null;
  /** address.edit 由结算页地址选择器进入:保存后该地址即成为本单选中地址 */
  addressEditFromCheckout: boolean;
  /** logistics.detail 底部通知条本次会话内已关闭 */
  logisticsNotifyClosed: boolean;
  /** 筛选面板草稿 */
  filterDraft: SearchFilterState;
  /** 已生效筛选;null=无筛选 */
  filterApplied: SearchFilterState | null;
  /**
   * 外部商品卡「+」快捷加购跳商详时携带的 SKU 弹层入口模式(走查 0813 反馈③:
   * 快捷加号也弹规格选择)。商详挂载时消费一次:'add'=打开即加购态。
   */
  skuEntryHint: 'spec' | 'warranty' | 'add' | 'buy' | null;
}

export interface FullState {
  _dataVersion: number;
  user: UserInfo;
  /** 购物车条目(含 selected 勾选态;角标=Σqty 由组件算) */
  cartItems: CartItem[];
  checkoutDraft: CheckoutDraft | null;
  orders: RuntimeOrder[];
  addresses: Address[];
  addressDraft: AddressDraft | null;
  coupons: CouponsData;
  followedProducts: FollowedProduct[];
  followedShops: string[];
  followedCreators: string[];
  history: RuntimeHistoryEntry[];
  /** 商详已领国补资格的商品(结算默认勾国补) */
  subsidyClaimedIds: string[];
  reviews: Record<string, RuntimeProductReviews>;
  /** 交易物流频道消息(初始空,由订单事件生成) */
  transMsgs: RuntimeMessageEntry[];
  /** 客服会话按 shopId 隔离(每店独立消息记录,阶段④强调:禁止全局单会话) */
  chatSessions: Record<string, RuntimeChatMessage[]>;
  unread: UnreadState;
  msgSettings: MsgSettings;
  recentSearches: string[];
  likedReviewIds: string[];
  taskAudit: {
    compareOnlyDiff?: boolean;
    compareProductIds?: string[];
    rankBoard?: { rankId: string; board: RankBoardType };
    reviewFilter?: { productId: string; filter: string };
    orderSearch?: string;
    invoiceSearch?: string;
    searchResult?: { keyword: string; quick: string[]; filter: SearchFilterState | null };
  };
  _temp: TempState;
}

export interface AppActions {
  showToast: (msg: string) => void;
  setTemp: (patch: Partial<TempState>) => void;
  // 购物车
  addToCart: (productId: string, skuText: string, price: number, qty?: number) => void;
  toggleCartItem: (itemId: string) => void;
  toggleCartShop: (shopId: string) => void;
  toggleCartSelectAll: () => void;
  setCartQty: (itemId: string, qty: number) => void;
  removeCartItems: (itemIds: string[]) => void;
  moveCartToFollow: (itemIds: string[]) => void;
  clearInvalidCartItems: () => void;
  // 结算 + 支付
  beginCheckout: (itemIds: string[]) => void;
  beginBuyNow: (productId: string, skuText: string, price: number, qty?: number) => void;
  setCheckoutQty: (cartItemKey: string, delta: number) => void;
  setCheckoutAddress: (addressId: string) => void;
  setPayMethod: (method: PayMethod) => void;
  setDeliverySlot: (dayOffset: number, slot: string) => void;
  setInvoice: (invoiceType: InvoiceType) => void;
  setCheckoutWarranty: (warrantyId: string | null, price: number) => void;
  toggleSubsidy: () => void;
  claimSubsidy: () => void;
  markSubsidyDialogSeen: () => void;
  placeOrder: () => string | null;
  paySuccess: (orderId: string) => void;
  // 订单
  cancelOrder: (orderId: string, reason: string) => void;
  deleteOrder: (orderId: string) => void;
  confirmReceipt: (orderId: string) => void;
  modifyOrderAddress: (orderId: string, address: OrderAddress) => void;
  // 退款/售后
  applyRefund: (orderId: string, reason: string, note: string) => void;
  cancelRefund: (orderId: string) => void;
  // 商详联动
  recordHistory: (productId: string) => void;
  claimProductSubsidy: (productId: string) => void;
  // 客服(按 shopId 隔离)
  sendChatText: (shopId: string, text: string) => void;
  sendChatProduct: (shopId: string, productId: string) => void;
  // 关注域
  toggleFollowProduct: (productId: string) => void;
  unfollowProducts: (productIds: string[]) => void;
  toggleFollowShop: (shopId: string) => void;
  toggleFollowCreator: (creatorId: string) => void;
  setPriceWatch: (productId: string, price: number) => void;
  // 足迹
  removeHistory: (productIds: string[]) => void;
  // 消息
  readChannel: (ch: 'trade' | 'notice' | 'interact') => void;
  clearAllMessages: () => void;
  /** 顶栏「清除未读」:三频道未读归零,保留消息 */
  markAllRead: () => void;
  /** 清空聊天记录(消息设置页):清掉客服会话实体 */
  clearChatSessions: () => void;
  toggleMsgSetting: (key: keyof MsgSettings) => void;
  // 地址
  saveAddress: (a: Partial<Address> & { id?: string }) => string;
  deleteAddress: (addressId: string) => void;
  setDefaultAddress: (addressId: string) => void;
  setAddressDraft: (patch: Partial<AddressDraft> | null) => void;
  // 个人信息
  setNickname: (name: string) => void;
  // 搜索
  addRecentSearch: (word: string) => void;
  clearRecentSearches: () => void;
  // 筛选
  openFilterDraft: () => void;
  toggleFilterDim: (dim: string, value: string, multi?: boolean) => void;
  setFilterPrice: (patch: Partial<Pick<SearchFilterState, 'pricePreset' | 'priceMin' | 'priceMax'>>) => void;
  resetFilterDraft: () => void;
  applyFilter: () => void;
  clearFilter: () => void;
  toggleReviewLike: (reviewId: string) => void;
  recordTaskAudit: (patch: Partial<FullState['taskAudit']>) => void;
}

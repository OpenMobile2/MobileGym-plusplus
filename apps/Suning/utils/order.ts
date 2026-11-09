import type { Address, OrderAddress, OrderStatus, RuntimeOrder } from '../types';
import type { STRINGS } from '../res/strings';

type StringKey = keyof typeof STRINGS;

/** orders.list 状态 Tab(URL ?tab= 驱动;queryParam 键不作离散 uiState 键) */
export type OrderTab = 'all' | 'pendingPay' | 'awaitShip' | 'completed' | 'toReview';

export const ORDER_TABS: readonly { key: OrderTab; label: StringKey }[] = [
  { key: 'all', label: 'orderTabAll' },
  { key: 'pendingPay', label: 'orderTabPendingPay' },
  { key: 'awaitShip', label: 'orderTabAwaitShip' },
  { key: 'completed', label: 'orderTabCompleted' },
  { key: 'toReview', label: 'orderTabToReview' },
];

export const asOrderTab = (raw: string | null): OrderTab =>
  ORDER_TABS.some((t) => t.key === raw) ? (raw as OrderTab) : 'all';

/** 「待收货」Tab 覆盖全部已付未签收状态(待发货/待供应商发货/运输中) */
const IN_TRANSIT: OrderStatus[] = ['awaitShip', 'supplierShip', 'shipping'];

export function ordersOfTab(orders: RuntimeOrder[], tab: OrderTab): RuntimeOrder[] {
  switch (tab) {
    case 'pendingPay':
      return orders.filter((o) => o.status === 'pendingPay');
    case 'awaitShip':
      // 已发起退款的订单移出「待收货」(状态归入退款/售后,避免同单双列,走查 0813 反馈②)
      return orders.filter((o) => IN_TRANSIT.includes(o.status) && o.refund == null);
    case 'completed':
      return orders.filter((o) => o.status === 'completed');
    case 'toReview':
      return orders.filter((o) => o.status === 'completed' && o.reviewed === false);
    default:
      return orders;
  }
}

export const STATUS_LABEL: Record<OrderStatus, StringKey> = {
  pendingPay: 'statusPendingPay',
  awaitShip: 'statusAwaitShip',
  supplierShip: 'statusSupplierShip',
  shipping: 'statusShipping',
  completed: 'statusCompleted',
  cancelled: 'statusCancelled',
};

/**
 * 订单卡/详情顶栏展示的状态文案:一旦发起退款(且非已取消),统一显示「退款中」,
 * 与售后中心的退换记录保持同一状态口径(走查 0813 反馈②)。
 */
export function orderStatusLabelKey(o: RuntimeOrder): StringKey {
  if (o.refund != null && o.status !== 'cancelled') return 'statusRefunding';
  return STATUS_LABEL[o.status];
}

/** 顶栏副文案(order.detail 五态) */
export const STATUS_SUBTITLE: Record<OrderStatus, StringKey | null> = {
  pendingPay: 'subPayHint',
  awaitShip: 'subShip48',
  supplierShip: 'subShip48',
  shipping: null,
  completed: 'subSigned',
  cancelled: 'subCancelled',
};

/** 取消原因 7 项(s329) */
export const CANCEL_REASONS: readonly StringKey[] = [
  'cancelReason1',
  'cancelReason2',
  'cancelReason3',
  'cancelReason4',
  'cancelReason5',
  'cancelReason6',
  'cancelReason7',
];

export const addressLine = (a: Address | OrderAddress): string =>
  `${a.province}${a.city}${a.district}${a.street} ${a.detail}`;

/** 本单收货地址:order.modify 改过用快照,否则回落到地址簿默认地址 */
export function orderAddressOf(o: RuntimeOrder, addresses: Address[]): OrderAddress | null {
  if (o.address) return o.address;
  const a = addresses.find((x) => x.isDefault) ?? addresses[0];
  if (!a) return null;
  const { name, phone, province, city, district, street, detail } = a;
  return { name, phone, province, city, district, street, detail };
}

/** 售后中心三 Tab(URL ?tab= 驱动) */
export type AftersaleTab = 'apply' | 'records' | 'services';

export const AFTERSALE_TABS: readonly { key: AftersaleTab; label: StringKey }[] = [
  { key: 'apply', label: 'aftersaleTabApply' },
  { key: 'records', label: 'aftersaleTabRecords' },
  { key: 'services', label: 'aftersaleTabServices' },
];

export const asAftersaleTab = (raw: string | null): AftersaleTab =>
  AFTERSALE_TABS.some((t) => t.key === raw) ? (raw as AftersaleTab) : 'apply';

/** 可发起售后的订单:已付款且未取消(aftersale.main 售后申请 Tab) */
export const canAftersale = (o: RuntimeOrder): boolean =>
  IN_TRANSIT.includes(o.status) || o.status === 'completed';

/** 退款原因:专营店版 6 项(s331) */
export const REFUND_REASONS_STORE: readonly StringKey[] = [
  'refundReasonS1', 'refundReasonS2', 'refundReasonS3',
  'refundReasonS4', 'refundReasonS5', 'refundReasonS6',
];

/** 退款原因:供应商国补版 9 项(frame:r3@12.0) */
export const REFUND_REASONS_SUPPLIER: readonly StringKey[] = [
  'refundReasonV1', 'refundReasonV2', 'refundReasonV3', 'refundReasonV4', 'refundReasonV5',
  'refundReasonV6', 'refundReasonV7', 'refundReasonV8', 'refundReasonV9',
];

/** 供应商单(国补/自营供应商发货):退款原因用国补版、页顶多一条供应商提示 */
export const isSupplierOrder = (o: RuntimeOrder): boolean => o.status === 'supplierShip';

/**
 * 四级地区选择器数据(order.modify / address.edit 共用 ?sheet=region,r2@50.4)。
 * 地名属数据层(与 defaults.json 的地址同源),不进 strings。
 * 范围铁律:江苏细到街道(南京/苏州/宿迁),其余省份只保留热门城市宫格覆盖到的市与精简区县。
 */
export const REGIONS: readonly {
  name: string;
  cities: readonly { name: string; districts: readonly { name: string; streets: readonly string[] }[] }[];
}[] = [
  {
    name: '江苏省',
    cities: [
      {
        name: '南京市',
        districts: [
          { name: '栖霞区', streets: ['翠屏街道', '马群街道', '尧化街道'] },
          { name: '玄武区', streets: ['新街口街道', '梅园新村街道'] },
          { name: '鼓楼区', streets: ['湖南路街道', '宁海路街道'] },
        ],
      },
      {
        name: '苏州市',
        districts: [
          { name: '姑苏区', streets: ['平江街道', '沧浪街道'] },
          { name: '工业园区', streets: ['娄葑街道', '斜塘街道'] },
        ],
      },
      {
        name: '宿迁市',
        districts: [
          { name: '沭阳县', streets: ['沭城街道', '梦溪街道', '南湖街道'] },
          { name: '宿豫区', streets: ['顺河街道', '豫新街道'] },
        ],
      },
    ],
  },
  {
    name: '上海市',
    cities: [
      {
        name: '上海市',
        districts: [
          { name: '浦东新区', streets: ['陆家嘴街道', '张江镇'] },
          { name: '徐汇区', streets: ['徐家汇街道', '天平路街道'] },
          { name: '黄浦区', streets: ['南京东路街道', '外滩街道'] },
        ],
      },
    ],
  },
  {
    name: '北京市',
    cities: [
      {
        name: '北京市',
        districts: [
          { name: '朝阳区', streets: ['三里屯街道', '望京街道'] },
          { name: '海淀区', streets: ['中关村街道', '清华园街道'] },
          { name: '东城区', streets: ['东华门街道', '景山街道'] },
        ],
      },
    ],
  },
  {
    name: '天津市',
    cities: [
      {
        name: '天津市',
        districts: [
          { name: '和平区', streets: ['劝业场街道', '南市街道'] },
          { name: '南开区', streets: ['华苑街道', '鼓楼街道'] },
        ],
      },
    ],
  },
  {
    name: '重庆市',
    cities: [
      {
        name: '重庆市',
        districts: [
          { name: '渝中区', streets: ['解放碑街道', '朝天门街道'] },
          { name: '江北区', streets: ['观音桥街道', '五里店街道'] },
        ],
      },
    ],
  },
  {
    name: '广东省',
    cities: [
      {
        name: '广州市',
        districts: [
          { name: '天河区', streets: ['天河南街道', '珠江新城街道'] },
          { name: '越秀区', streets: ['北京街道', '农林街道'] },
        ],
      },
      {
        name: '深圳市',
        districts: [
          { name: '南山区', streets: ['粤海街道', '招商街道'] },
          { name: '福田区', streets: ['园岭街道', '华富街道'] },
        ],
      },
    ],
  },
  {
    name: '浙江省',
    cities: [
      {
        name: '杭州市',
        districts: [
          { name: '西湖区', streets: ['北山街道', '灵隐街道'] },
          { name: '余杭区', streets: ['良渚街道', '仓前街道'] },
        ],
      },
    ],
  },
  {
    name: '四川省',
    cities: [
      {
        name: '成都市',
        districts: [
          { name: '武侯区', streets: ['浆洗街街道', '望江路街道'] },
          { name: '锦江区', streets: ['春熙路街道', '书院街街道'] },
        ],
      },
    ],
  },
  {
    name: '湖北省',
    cities: [
      {
        name: '武汉市',
        districts: [
          { name: '武昌区', streets: ['中南路街道', '水果湖街道'] },
          { name: '洪山区', streets: ['珞南街道', '关山街道'] },
        ],
      },
    ],
  },
  {
    name: '陕西省',
    cities: [
      {
        name: '西安市',
        districts: [
          { name: '雁塔区', streets: ['小寨路街道', '电子城街道'] },
          { name: '碑林区', streets: ['柏树林街道', '东关南街街道'] },
        ],
      },
    ],
  },
];

/** region 弹层第一级的热门城市宫格 12 项(s311):点选直接锁定省+市,面包屑跳到区县级 */
export const HOT_CITIES: readonly { label: string; province: string; city: string }[] = [
  { label: '北京', province: '北京市', city: '北京市' },
  { label: '上海', province: '上海市', city: '上海市' },
  { label: '广州', province: '广东省', city: '广州市' },
  { label: '深圳', province: '广东省', city: '深圳市' },
  { label: '南京', province: '江苏省', city: '南京市' },
  { label: '苏州', province: '江苏省', city: '苏州市' },
  { label: '杭州', province: '浙江省', city: '杭州市' },
  { label: '成都', province: '四川省', city: '成都市' },
  { label: '武汉', province: '湖北省', city: '武汉市' },
  { label: '西安', province: '陕西省', city: '西安市' },
  { label: '重庆', province: '重庆市', city: '重庆市' },
  { label: '天津', province: '天津市', city: '天津市' },
];

/** 逐级点选路径 [省,市,区,街道] → 当前层可选项(order.modify / address.edit 共用) */
export function regionOptionsAt(path: readonly string[]): readonly string[] {
  const province = REGIONS.find((p) => p.name === path[0]);
  const city = province?.cities.find((c) => c.name === path[1]);
  const district = city?.districts.find((d) => d.name === path[2]);
  const depth = Math.min(path.length, 3);
  if (depth === 0) return REGIONS.map((p) => p.name);
  if (depth === 1) return (province?.cities ?? []).map((c) => c.name);
  if (depth === 2) return (city?.districts ?? []).map((d) => d.name);
  return district?.streets ?? [];
}

/**
 * 「粘贴地址 自动识别填写」(spec address.edit,轻实现:正则 + 地名匹配,不接外部能力)。
 * 手机号与地区都识别不出时返回 null,由页面发「识别失败,请手动填写」。
 */
export function parseAddressText(
  raw: string,
): { name: string; phone: string; region: string[]; detail: string } | null {
  const text = raw.trim();
  if (!text) return null;
  const phone = text.match(/1[\d*]{10}/)?.[0] ?? '';
  const region = matchRegionInText(text);
  if (!phone && region.length === 0) return null;

  const clean = (s: string) => s.replace(/[,,;;、\s]+/g, ' ').trim();
  const rest = phone ? text.replace(phone, ' ') : text;
  if (region.length === 0) {
    const tokens = clean(rest).split(' ').filter(Boolean);
    return { name: tokens[0] ?? '', phone, region, detail: tokens.slice(1).join('') };
  }
  // 姓名取省名之前的首个词,详细地址取最末一级地名之后的剩余部分
  const head = rest.slice(0, rest.indexOf(region[0]));
  const tail = [...region].reverse().find((r) => r && rest.includes(r)) ?? region[0];
  const detail = clean(rest.slice(rest.indexOf(tail) + tail.length)).replace(/ /g, '');
  return { name: clean(head).split(' ').filter(Boolean)[0] ?? '', phone, region, detail };
}

/** 「江苏省南京市栖霞区翠屏街道…」整段文本按省/市/区/街道逐级前缀匹配(粘贴地址自动识别) */
export function matchRegionInText(text: string): string[] {
  const province = REGIONS.find((p) => text.includes(p.name));
  if (!province) return [];
  const city = province.cities.find((c) => text.includes(c.name)) ?? province.cities[0];
  if (!city) return [province.name];
  const district = city.districts.find((d) => text.includes(d.name)) ?? city.districts[0];
  if (!district) return [province.name, city.name];
  const street = district.streets.find((s) => text.includes(s)) ?? district.streets[0];
  return [province.name, city.name, district.name, street ?? ''];
}

/** orders.search / aftersale.main / invoice.list 共用:按商品名 + 订单号 + 服务单号匹配 */
export function orderMatches(o: RuntimeOrder, keyword: string, titleOf: (id: string) => string): boolean {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return true;
  if (o.orderNo.toLowerCase().includes(kw)) return true;
  if (o.refund?.serviceNo.toLowerCase().includes(kw)) return true;
  return o.items.some(
    (it) => titleOf(it.productId).toLowerCase().includes(kw) || it.skuText.toLowerCase().includes(kw),
  );
}

const p2 = (n: number) => String(n).padStart(2, '0');

/** 86387 → 23:59:47(待支付倒计时,静态展示,不起 interval) */
export function fmtCountdown(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  return `${p2(Math.floor(s / 3600))}:${p2(Math.floor((s % 3600) / 60))}:${p2(s % 60)}`;
}

export const orderQty = (o: RuntimeOrder): number => o.items.reduce((sum, it) => sum + it.qty, 0);

/** 同一次多店结算会按店铺拆单；支付与成功页按 batchId 聚合展示。 */
export function orderBatchOf(orders: RuntimeOrder[], order: RuntimeOrder): RuntimeOrder[] {
  if (!order.batchId) return [order];
  return orders.filter((candidate) => candidate.batchId === order.batchId);
}

export const orderBatchAmount = (orders: RuntimeOrder[]): number =>
  Math.round(orders.reduce((sum, order) => sum + order.amount, 0) * 100) / 100;

/** 商品金额(实付 = 商品金额 - 国补优惠,运费恒 0) */
export const goodsAmountOf = (o: RuntimeOrder): number =>
  Math.round(o.items.reduce((sum, it) => sum + it.price * it.qty, 0) * 100) / 100;

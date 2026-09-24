/**
 * 唯品会 结构性常量(固定 App 结构,非用户数据)。
 * OS 宿主约束数值来源:os/data/simulatorConfig.ts。
 */
export const OS = {
  STATUS_BAR_H: 40, // pt-10
  GESTURE_BAR_H: 16, // h-4
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/** 每次修改 defaults.json 必须递增;persistName = `vipshop_v${DATA_VERSION}` */
export const DATA_VERSION = 5;

/** 底部 TabBar(spec: chrome.tabbar) */
export const MAIN_TABS = [
  { id: 'home', path: '/', label: '首页', transitionId: 'tabbar.home-open' },
  { id: 'favorites', path: '/favorites', label: '收藏', transitionId: 'tabbar.favorites-open' },
  { id: 'discover', path: '/discover', label: '发现品牌', transitionId: 'tabbar.discover-open' },
  { id: 'cart', path: '/cart', label: '购物车', transitionId: 'tabbar.cart-open' },
  { id: 'mine', path: '/me', label: '我的', transitionId: 'tabbar.mine-open' },
] as const;

/**
 * 两级品类体系(阶段⑥):一级品类 → 该级下的二级"智能推荐"分类。
 * 首页顶部一级 tab 切换时,二级分类条 + 商品同步切换;金刚区每格 → 该一级品类页;
 * 品牌专场子分类按品牌 category 派生。items.category=一级 id,items.subCategory=二级中文标签。
 */
export const CATEGORY_TAXONOMY: Record<string, { label: string; color: string; subs: string[] }> = {
  women: { label: '女装', color: '#E4007F', subs: ['连衣裙', 'T恤', '衬衫', '外套', '半身裙', '阔腿裤'] },
  men: { label: '男装', color: '#3B4A6B', subs: ['短裤', '休闲裤', 'T恤', '衬衫', '外套'] },
  beauty: { label: '美妆', color: '#FF6FA5', subs: ['口红', '面膜', '精华', '面霜', '眼影', '防晒', '香水'] },
  shoes: { label: '鞋靴', color: '#FF7A00', subs: ['运动鞋', '凉鞋', '单鞋', '靴子'] },
  bag: { label: '箱包', color: '#C9A063', subs: ['手提包', '双肩包', '单肩包', '钱包'] },
  home: { label: '居家', color: '#8B5CF6', subs: ['床品', '厨具', '毛巾浴巾', '保温杯', '收纳'] },
  appliance: { label: '家电', color: '#0EA5E9', subs: ['厨房电器', '个护电器', '生活电器'] },
  digital: { label: '数码', color: '#2563EB', subs: ['耳机', '手表', '充电周边', '影音'] },
  sport: { label: '运动', color: '#16A34A', subs: ['运动裤', '运动上衣', '瑜伽服'] },
  baby: { label: '母婴', color: '#F59E0B', subs: ['连体衣', '童装', '玩具'] },
};

/** 某一级品类的二级分类(前置"全部")。未知类目回落空 subs。 */
export function subsOf(catId: string): string[] {
  return ['全部', ...(CATEGORY_TAXONOMY[catId]?.subs ?? [])];
}
export function catLabel(catId: string): string {
  return CATEGORY_TAXONOMY[catId]?.label ?? catId;
}

/** 首页顶部一级品类 tab(推荐 + 全部一级品类) */
export const HOME_CATEGORIES = [
  { id: 'recommend', label: '推荐' },
  ...Object.entries(CATEGORY_TAXONOMY).map(([id, v]) => ({ id, label: v.label })),
] as const;

/** 首页金刚区(每格 → /category/:id 品类页) */
export const KINGKONG_GRID = Object.entries(CATEGORY_TAXONOMY).map(([id, v]) => ({
  id, label: v.label, color: v.color,
}));

/** 秒杀品类 tab(spec: flash.main;无时间轴分场) */
export const FLASH_CATEGORIES = [
  { id: 'featured', label: '精选' },
  { id: 'makeup', label: '彩妆' },
  { id: 'home', label: '家居' },
  { id: 'beauty', label: '美容' },
] as const;

/** 专场子分类 tab(spec: brand.event) */
export const BRAND_SUBCATS = [
  { id: 'new', label: '上新' },
  { id: 'men', label: '男士' },
  { id: 'women', label: '女士' },
  { id: 'boy', label: '男童' },
  { id: 'girl', label: '女童' },
] as const;

/** 专场/搜索排序(spec: brand.event 销量/价格/折扣) */
export const BRAND_SORTS = [
  { id: 'sales', label: '销量' },
  { id: 'price', label: '价格' },
  { id: 'discount', label: '折扣' },
] as const;

/** 搜索结果排序(spec: search.result 综合/销量/价格/榜单) */
export const RESULT_SORTS = [
  { id: 'default', label: '综合' },
  { id: 'sales', label: '销量' },
  { id: 'price', label: '价格' },
  { id: 'rank', label: '榜单' },
] as const;

/** 搜索结果快捷筛选 chips(spec: search.result) */
export const RESULT_CHIPS = ['显瘦', '碎花', '收腰', '气质', '通勤', '度假'] as const;

/** 购物车筛选 chips(spec: cart.main) */
export const CART_CHIPS = ['降价', '库存紧张', '常购'] as const;

/** 订单状态 tab(spec: orders.list) */
export const ORDER_TABS = [
  { id: 'all', label: '全部' },
  { id: 'pendingPayment', label: '待付款' },
  { id: 'pendingReceipt', label: '待收货' },
  { id: 'completed', label: '已完成' },
  { id: 'canceled', label: '已取消' },
] as const;

/** 收藏 tab(spec: favorites.main) */
export const FAVORITE_TABS = [
  { id: 'item', label: '商品' },
  { id: 'brand', label: '品牌' },
  { id: 'outfit', label: '穿搭' },
] as const;

/** 消息子 tab(spec: message.list) */
export const MESSAGE_SUBTABS = [
  { id: 'logistics', label: '物流' },
  { id: 'activity', label: '动态' },
  { id: 'pricedrop', label: '降价' },
] as const;

/** 消息分类(spec: message.list 分类,均汇入唯小蜜) */
export const MESSAGE_CATEGORIES = [
  { id: 'service', label: '客服消息' },
  { id: 'promo', label: '优惠促销' },
  { id: 'subscribe', label: '订阅上新' },
  { id: 'account', label: '账户通知' },
  { id: 'brand', label: '品牌动态' },
] as const;

/** 唯小蜜快捷菜单(spec: message.chat) */
export const CHAT_QUICK_MENU = ['尺码推荐', '价保申请', '商品活动', '客服评价'] as const;

/** 支付方式(spec: order.confirm) */
export const PAY_METHODS = [
  { id: 'vippay', label: '唯品支付', desc: '推荐 · 支付立减' },
  { id: 'wechat', label: '微信支付', desc: '' },
  { id: 'bankcard', label: '银行卡支付', desc: '' },
] as const;

/** 地址类型标签(spec: address.edit) */
export const ADDRESS_TAGS = ['家庭', '公司', '其他'] as const;

/** 筛选抽屉分组(spec: search.filter) */
export const FILTER_GROUPS = [
  { id: 'price', label: '价格区间', options: ['0-100', '100-300', '300-500', '500以上'] },
  { id: 'brand', label: '品牌', options: ['花漾年华', '素肌轻语', '悦动', '暖冬', '奢遇'] },
  { id: 'color', label: '色系', options: ['白色', '黑色', '粉色', '蓝色', '大地色'] },
  { id: 'type', label: '类型', options: ['连衣裙', 'T恤', '面霜', '口红', '运动鞋'] },
  { id: 'effect', label: '功效', options: ['补水', '抗皱', '美白', '控油'] },
  { id: 'style', label: '款型', options: ['修身', '宽松', '直筒', 'A字'] },
] as const;

/** 售后服务类型(spec: orders.refund) */
export const REFUND_TYPES = [
  { id: 'exchange', label: '免费换货', desc: '同款换货,唯品会包邮' },
  { id: 'return', label: '退货退款', desc: '7天无理由,极速退款' },
  { id: 'priceGuard', label: '价格保护', desc: '买贵退差价' },
] as const;

/** 分享渠道(spec: cart.sharePanel) */
export const SHARE_CHANNELS = [
  { id: 'link', label: '复制链接' },
  { id: 'poster', label: '生成海报' },
  { id: 'wechat', label: '微信好友' },
  { id: 'qq', label: 'QQ好友' },
] as const;

/** 省市区选择器数据(spec: address.regionPicker,精简) */
export const REGION_DATA: Record<string, Record<string, string[]>> = {
  广东省: {
    广州市: ['天河区', '越秀区', '海珠区', '番禺区'],
    深圳市: ['南山区', '福田区', '罗湖区', '宝安区'],
  },
  上海市: { 上海市: ['浦东新区', '徐汇区', '静安区', '黄浦区'] },
  北京市: { 北京市: ['朝阳区', '海淀区', '东城区', '西城区'] },
  浙江省: { 杭州市: ['西湖区', '拱墅区', '滨江区', '余杭区'] },
};

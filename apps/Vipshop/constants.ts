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
export const DATA_VERSION = 12;

/** 底部 TabBar(spec: chrome.tabbar) */
export const MAIN_TABS = [
  { id: 'home', path: '/', label: '首页', transitionId: 'tabbar.home-open' },
  { id: 'favorites', path: '/favorites', label: '收藏', transitionId: 'tabbar.favorites-open' },
  { id: 'discover', path: '/discover', label: '发现品牌', transitionId: 'tabbar.discover-open' },
  { id: 'cart', path: '/cart', label: '购物车', transitionId: 'tabbar.cart-open' },
  { id: 'mine', path: '/me', label: '个人中心', transitionId: 'tabbar.mine-open' },
] as const;

/**
 * 两级品类体系(阶段⑥):一级品类 → 该级下的二级"智能推荐"分类。
 * 首页顶部一级 tab 切换时,二级分类条 + 商品同步切换;金刚区每格 → 该一级品类页;
 * 品牌专场子分类按品牌 category 派生。items.category=一级 id,items.subCategory=二级中文标签。
 */
export const CATEGORY_TAXONOMY: Record<string, { label: string; color: string; subs: string[] }> = {
  women: { label: '女装', color: '#E4007F', subs: ['连衣裙', 'T恤', '背心', '衬衫', '外套', '半身裙', '阔腿裤'] },
  men: { label: '男装', color: '#3B4A6B', subs: ['短裤', '休闲裤', 'T恤', '衬衫', '外套'] },
  beauty: { label: '美妆', color: '#FF6FA5', subs: ['口红', '彩妆', '面膜', '精华', '面霜', '洁面', '防晒', '眼影', '香水', '洗护', '身体护理', '个人护理'] },
  shoes: { label: '鞋靴', color: '#FF7A00', subs: ['运动鞋', '凉鞋', '单鞋', '靴子'] },
  bag: { label: '箱包', color: '#C9A063', subs: ['手提包', '双肩包', '单肩包', '拉杆箱', '钱包'] },
  home: { label: '居家', color: '#8B5CF6', subs: ['床品', '厨具', '毛巾浴巾', '保温杯', '收纳', '灯具', '装饰', '雨具', '户外', '车品'] },
  appliance: { label: '家电', color: '#0EA5E9', subs: ['厨房电器', '个护电器', '生活电器'] },
  digital: { label: '数码', color: '#2563EB', subs: ['耳机', '手表', '充电周边', '影音', '电脑外设'] },
  sport: { label: '运动', color: '#16A34A', subs: ['运动裤', '运动上衣', '瑜伽服', '运动配件'] },
  baby: { label: '母婴', color: '#F59E0B', subs: ['连体衣', '童装', '玩具', '喂养', '婴儿洗护'] },
  underwear: { label: '内衣', color: '#EC4899', subs: ['文胸', '内裤', '家居服', '袜子'] },
  food: { label: '食品', color: '#D97706', subs: ['零食', '冲饮', '坚果', '滋补', '生鲜', '速食'] },
};

/**
 * 品类模式下「精选分类」的分组 tab(真机:精选分类 / 上装 / 下装 …),
 * 每个分组对应一组二级分类圈。切换分组时,下方分类圈同步切换(真机行为)。
 * 分组内子类须是该品类 CATEGORY_TAXONOMY.subs 的子集,保证分类圈能取到商品图。
 * 第一项固定为「精选分类」= 该品类全部二级分类。
 */
export const CATEGORY_GROUPS: Record<string, Record<string, string[]>> = {
  women: { 上装: ['T恤', '背心', '衬衫', '外套'], 下装: ['半身裙', '阔腿裤'], 裙装: ['连衣裙', '半身裙'] },
  men: { 上装: ['T恤', '衬衫', '外套'], 下装: ['短裤', '休闲裤'] },
  beauty: { 护肤: ['面膜', '精华', '面霜', '防晒', '洁面'], 彩妆: ['口红', '眼影', '彩妆'], 香水: ['香水'], 个护: ['洗护', '身体护理', '个人护理'] },
  shoes: { 运动鞋: ['运动鞋'], 时尚鞋: ['单鞋', '凉鞋', '靴子'] },
  bag: { 背包: ['双肩包', '单肩包'], 手拿包: ['手提包', '钱包'], 旅行箱: ['拉杆箱'] },
  home: { 家纺布艺: ['床品', '毛巾浴巾'], 餐厨: ['厨具', '保温杯'], 收纳: ['收纳'], 家装: ['灯具', '装饰'], 出行户外: ['雨具', '户外', '车品'] },
  appliance: { 厨房电器: ['厨房电器'], 个护电器: ['个护电器'], 生活电器: ['生活电器'] },
  digital: { 影音: ['耳机', '影音'], 配件: ['手表', '充电周边'], 电脑外设: ['电脑外设'] },
  sport: { 上装: ['运动上衣'], 下装: ['运动裤', '瑜伽服'], 装备: ['运动配件'] },
  baby: { 服饰: ['连体衣', '童装'], 玩具: ['玩具'], 喂养洗护: ['喂养', '婴儿洗护'] },
  underwear: { 内衣: ['文胸', '内裤'], 家居服: ['家居服', '袜子'] },
  food: { 零食: ['零食', '坚果'], 滋补: ['滋补', '冲饮'], 生鲜速食: ['生鲜', '速食'] },
};

/** 品类模式的分组 tab 列表(精选分类 + CATEGORY_GROUPS 的分组名)。 */
export function groupTabsOf(catId: string): string[] {
  return ['精选分类', ...Object.keys(CATEGORY_GROUPS[catId] ?? {})];
}

/** 某品类某分组对应的二级分类圈;精选分类=全部二级分类。 */
export function subsOfGroup(catId: string, group: string): string[] {
  const all = CATEGORY_TAXONOMY[catId]?.subs ?? [];
  if (group === '精选分类') return all;
  return CATEGORY_GROUPS[catId]?.[group] ?? all;
}

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

/**
 * 秒杀品类 tab(spec: flash.main;无时间轴分场)。
 * category/subs 决定该 tab 过滤出哪些商品;精选不带条件 = 全部。
 */
export const FLASH_CATEGORIES = [
  { id: 'featured', label: '精选' },
  { id: 'makeup', label: '彩妆', category: 'beauty', subs: ['口红', '眼影'] },
  { id: 'beauty', label: '美容', category: 'beauty', subs: ['面膜', '精华', '面霜', '防晒', '香水'] },
  { id: 'home', label: '家居', category: 'home' },
  { id: 'digital', label: '数码', category: 'digital' },
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

/** 待付款自动取消倒计时(分钟);真机顶部显示「剩 xx分xx秒 自动取消订单」 */
export const PAY_DEADLINE_MINUTES = 30;

/** 支付方式(收银台;确认订单页不展示,提交后才弹) */
export const PAY_METHODS = [
  { id: 'vippay', label: '唯品支付', desc: '推荐 · 支付立减' },
  { id: 'wechat', label: '微信支付', desc: '' },
  { id: 'bankcard', label: '银行卡支付', desc: '' },
] as const;

/** 地址类型标签(spec: address.edit) */
export const ADDRESS_TAGS = ['家庭', '公司', '其他'] as const;

/**
 * 筛选项不再写死:选项由当前结果集动态派生,见 utils/search.ts 的 buildFilterGroups。
 * 曾经写死的清单和商品数据漂移得很厉害——"粉色/蓝色/控油"在 268 件商品里一件都没有,
 * "暖冬"不是任何品牌,价格上限 349 却提供"500以上",选中即空列表。
 */

/**
 * 评价标签按一级品类划分。尺码只对穿戴类成立——面膜/零食/家电挂"尺码偏大"是错的。
 * 首项固定为「买家秀」(带图评价,全品类通用)。
 */
export const REVIEW_TAGS_BY_CATEGORY: Record<string, string[]> = {
  women: ['买家秀', '尺码偏大', '尺码偏小', '版型好评'],
  men: ['买家秀', '尺码偏大', '尺码偏小', '版型好评'],
  shoes: ['买家秀', '尺码偏大', '尺码偏小', '穿着舒适'],
  underwear: ['买家秀', '尺码偏大', '尺码偏小', '面料舒适'],
  baby: ['买家秀', '尺码偏大', '尺码偏小', '面料舒适'],
  sport: ['买家秀', '尺码偏大', '尺码偏小', '透气排汗'],
  beauty: ['买家秀', '效果不错', '气味好闻', '包装完好'],
  food: ['买家秀', '味道不错', '分量很足', '包装完好'],
  appliance: ['买家秀', '做工扎实', '性能满意', '静音省电'],
  digital: ['买家秀', '做工扎实', '性能满意', '续航持久'],
  home: ['买家秀', '材质不错', '做工扎实', '实用方便'],
  bag: ['买家秀', '材质不错', '容量合适', '做工扎实'],
};

/** 该品类可用的评价标签;未知品类回落到通用三项 */
export function reviewTagsOf(category: string): string[] {
  return REVIEW_TAGS_BY_CATEGORY[category] ?? ['买家秀', '质量不错', '物流很快'];
}

/** 售后服务类型(spec: orders.refund) */
export const REFUND_TYPES = [
  { id: 'exchange', label: '免费换货', desc: '同款换货,唯品会包邮' },
  { id: 'return', label: '退货退款', desc: '7天无理由,极速退款' },
  { id: 'priceGuard', label: '价格保护', desc: '买贵退差价' },
] as const;

/** 分享渠道(spec: cart.sharePanel);icon 为 res/icons 的 Ic* 别名,由页面映射成组件 */
export const SHARE_CHANNELS = [
  { id: 'wechat', label: '微信好友', icon: 'IcSend', color: '#07C160' },
  { id: 'qq', label: 'QQ好友', icon: 'IcMessage', color: '#12B7F5' },
  { id: 'link', label: '复制链接', icon: 'IcCopy', color: '#8A8A8E' },
  { id: 'poster', label: '生成海报', icon: 'IcQrCode', color: '#E4007F' },
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

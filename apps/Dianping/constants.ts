export const DATA_VERSION = 15;

export const TAB_PATHS = ['/', '/map', '/checkin', '/msg', '/me'] as const;

export const DIAMOND_ITEMS = [
  { id: 'food', labelKey: 'catFood' as const, color: '#FF8A4C', enabled: true },
  { id: 'waimai', labelKey: 'catWaimai' as const, color: '#FFB84D', enabled: false },
  { id: 'fun', labelKey: 'catFun' as const, color: '#6BCB77', enabled: false },
  { id: 'scenic', labelKey: 'catScenic' as const, color: '#4D96FF', enabled: false },
  { id: 'movie', labelKey: 'catMovie' as const, color: '#FF6B6B', enabled: false },
  { id: 'medical', labelKey: 'catMedical' as const, color: '#C084FC', enabled: false },
  { id: 'photo', labelKey: 'catPhoto' as const, color: '#F472B6', enabled: false },
  { id: 'hotel', labelKey: 'catHotel' as const, color: '#38BDF8', enabled: false },
  { id: 'massage', labelKey: 'catMassage' as const, color: '#A78BFA', enabled: false },
  { id: 'beauty', labelKey: 'catBeauty' as const, color: '#FB7185', enabled: false },
] as const;

export const FOOD_TABS = [
  { id: 'restaurant', labelKey: 'foodTabRestaurant' as const },
  { id: 'cafe', labelKey: 'foodTabCafe' as const },
  { id: 'snack', labelKey: 'foodTabSnack' as const },
  { id: 'hotpot', labelKey: 'foodTabHotpot' as const },
] as const;

export const HOT_SEARCHES = ['火锅', '海鲜', '蛋糕', '一人食', '瑞幸', '烤肉', '必吃榜'];

/** 美食频道 · 智能排序(对齐 dp_404) */
export const SORT_OPTIONS = [
  { id: 'smart', label: '智能排序' },
  { id: 'distance', label: '距离优先' },
  { id: 'popular', label: '人气优先' },
  { id: 'good', label: '好评优先' },
  { id: 'taste', label: '口味优先' },
  { id: 'lowprice', label: '低价优先' },
  { id: 'highprice', label: '高价优先' },
] as const;

/** 美食频道 · 附近范围 */
export const DIST_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: '全部范围' },
  { value: 500, label: '500m内' },
  { value: 1000, label: '1km内' },
  { value: 3000, label: '3km内' },
  { value: 5000, label: '5km内' },
];

/** 美食频道 · 价格区间(对齐 dp_405) */
export const PRICE_BANDS = [
  { id: 'p0', label: '50以下', min: 0, max: 50 },
  { id: 'p1', label: '50-100', min: 50, max: 100 },
  { id: 'p2', label: '100-150', min: 100, max: 150 },
  { id: 'p3', label: '150-200', min: 150, max: 200 },
  { id: 'p4', label: '200-300', min: 200, max: 300 },
  { id: 'p5', label: '300以上', min: 300, max: 1000000 },
] as const;

/** 地图页顶部分类(对齐 dp_375);cats=null 表示全部 */
export const MAP_CATS: { id: string; label: string; cats: string[] | null }[] = [
  { id: 'rec', label: '推荐', cats: null },
  { id: 'food', label: '美食', cats: ['海鲜火锅', '烤肉', '日料', '小吃简餐', '烧烤', '咖啡', '冰淇淋', '蛋糕甜品'] },
  { id: 'fun', label: '玩乐', cats: [] },
  { id: 'scenic', label: '景点', cats: [] },
  { id: 'shop', label: '购物', cats: [] },
];

/** 榜单页 · 指数榜维度(对齐 dp_395);key 决定排序字段 */
export const RANK_DIMS = [
  { id: 'hot', label: '热门榜', field: 'reviewCount' as const },
  { id: 'good', label: '好评榜', field: 'score' as const },
  { id: 'taste', label: '口味榜', field: 'taste' as const },
  { id: 'sales', label: '销量榜', field: 'reviewCount' as const },
  { id: 'env', label: '环境榜', field: 'env' as const },
  { id: 'service', label: '服务榜', field: 'service' as const },
] as const;

/** 榜单头部四大品类卡 */
export const RANK_CATEGORY_CARDS = [
  { id: 'eat', title: '必吃榜', sub: '口味至上', bg: '#FFF1EA', fg: '#E8542B' },
  { id: 'play', title: '必玩榜', sub: '城市玩乐', bg: '#E9F3FF', fg: '#2E7BE6' },
  { id: 'stay', title: '必住榜', sub: '特色旅宿', bg: '#EAF6FF', fg: '#2E9BD6' },
  { id: 'black', title: '黑珍珠', sub: '食之甄选', bg: '#F3EEE7', fg: '#8A6A3A' },
] as const;

/** 打卡页 · 心情标签(对齐 dp_376) */
export const CHECKIN_MOODS = [
  { id: 'charge', label: '充电' },
  { id: 'energy', label: '元气' },
  { id: 'daze', label: '发呆' },
  { id: 'emo', label: 'emo' },
  { id: 'happy', label: '开心' },
] as const;

/** 卡券包 · 神券(对齐 dp_439) */
export const SHEN_COUPONS = [
  { id: 's1', amount: 6, cond: '满69可用', title: '休闲玩乐&丽人新客券', expire: '明天23:59过期', tag: '外卖' as string | null },
  { id: 's2', amount: 10, cond: '满129可用', title: '休闲玩乐&丽人新客券', expire: '明天23:59过期', tag: null },
  { id: 's3', amount: 18, cond: '满88可用', title: '闪购神券', expire: '今天23:59过期', tag: '外卖' },
  { id: 's4', amount: 18, cond: '满78可用', title: '健康变美神券', expire: '2026.08.06到期', tag: null },
  { id: 's5', amount: 10, cond: '满39可用', title: '闪购便利店神券', expire: '2天后过期', tag: '外卖' },
] as const;

/** 新人福利频道 · 首单必买(对齐 dp_444);为单份美食/饮品,shopId 关联下单店铺,dishId 取配图 */
export const NEWBIE_DEALS = [
  { id: 'nb1', shopId: 'sushiya', dishId: 'beef2', title: '三文鱼五切', shopLabel: '牛New寿喜烧', newPrice: 23.9, origin: 34 },
  { id: 'nb2', shopId: 'yeren', dishId: 'ball', title: '经典口味冰淇淋任选', shopLabel: '野人先生现做冰淇淋', newPrice: 15.9, origin: 28 },
  { id: 'nb3', shopId: 'luckin', dishId: 'coco', title: '首单生椰拿铁 冰爽美式', shopLabel: '瑞幸咖啡', newPrice: 6.8, origin: 18 },
  { id: 'nb4', shopId: 'malatang', dishId: 'beef3', title: '麻辣烫单人餐', shopLabel: '杨国福麻辣烫', newPrice: 15, origin: 22 },
  { id: 'nb5', shopId: 'pangpang', dishId: 'cup', title: '纸杯小蛋糕2枚', shopLabel: 'PangPang·熊', newPrice: 9.9, origin: 14 },
] as const;

/** 新人福利券包(仅 2 张) */
export const NEWBIE_COUPONS = [
  { id: 'nc1', amount: 5, cond: '满10可用', title: '玩乐新客券', expire: '1天后过期' },
  { id: 'nc2', amount: 9, cond: '满69可用', title: '玩乐新客券', expire: '1天后过期' },
] as const;

/** 设置页分组(对齐 dp_383) */
export const SETTINGS_GROUPS: { label: string; extra?: string; badge?: string }[][] = [
  [{ label: '个人资料' }, { label: '账号与安全' }],
  [{ label: '消息通知设置' }, { label: '隐私管理' }, { label: '通用' }],
  [
    { label: '长辈版', extra: '未开启' },
    { label: '未成年人模式', badge: '新功能', extra: '未开启' },
    { label: '多语言' },
  ],
  [
    { label: '存储空间', badge: '新功能', extra: '917.3 MB' },
    { label: '诊断网络' },
  ],
  [
    { label: '隐私政策' },
    { label: '个人信息收集清单' },
    { label: '第三方信息数据共享' },
    { label: '意见反馈' },
    { label: '关于我们' },
    { label: '热线电话', extra: '10100011' },
  ],
];

export const REFUND_REASONS = [
  '计划有变，不想去了',
  '买多了/买错了',
  '协商一致退款',
  '商家营业但不接待',
  '商家停业/装修/转让',
  '其他',
];

/** 确认订单 · 美团券（可用/不可用，对齐 a451） */
export const PLATFORM_COUPONS = [
  {
    id: 'c_surprise',
    title: '美食团购惊喜券',
    amount: 1,
    usable: true,
    subText: '金额随机，仅限当前商品使用',
    expireText: '有效期至 2026/07/30 23:59',
  },
  {
    id: 'c_shen27',
    title: '堂食膨胀神券',
    amount: 27,
    usable: false,
    tag: '神券',
    subText: '满300可用',
    expireText: '今日到期',
    reason: '此订单不满300.0元，且仅限神券商家使用',
  },
  {
    id: 'c_shen16',
    title: '堂食精选膨胀神券',
    amount: 16,
    usable: false,
    tag: '神券',
    subText: '满200可用',
    expireText: '今日到期',
    reason: '此订单不满200.0元，仅限神券商家使用',
  },
] as const;

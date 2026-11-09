import { IcCalendarDays, IcCoffee, IcDrink, IcHome, IcMovie, IcStore } from './res/icons';

/**
 * 存档数据版本。改 data/defaults.json 的**结构或种子内容**时必须 +1,
 * 否则装过旧版的浏览器 localStorage 会一直喂回旧值(state.ts afterHydration 钩子据此重置)。
 */
export const DATA_VERSION = 11;

/** 薪资档 → 月薪 K 下限分档 [minInclusive, maxExclusive]；最后一档无上限。 */
export const SALARY_BANDS: Record<string, [number, number]> = {
  '3K以下': [0, 3], '3-5K': [3, 5], '5-10K': [5, 10],
  '10-20K': [10, 20], '20-50K': [20, 50], '50K以上': [50, 10000],
};

/** 解析 "30-35K·15薪" / "30-50K" → [30,35];非月薪K格式返回 null */
export function salaryRangeK(salary: string): [number, number] | null {
  const m = salary.match(/(\d+)(?:-(\d+))?K/);
  if (!m) return null;
  const lo = Number(m[1]);
  return [lo, m[2] ? Number(m[2]) : lo];
}

/** BOSS 活跃档位(有序,选"3日内活跃"应包含更活跃的档) */
export const ACTIVE_TIERS = ['刚刚活跃', '今日活跃', '3日内活跃', '本周活跃', '本月活跃'];

/** Boss 自动回复延迟(ms):真实感的"对方正在输入…" */
export const BOSS_REPLY_DELAY_MS = 1500;

/** 主 TabBar(职位/有了/消息/我的) */
export const TABS = [
  { id: 'jobs', path: '/', labelKey: 'tabJobs', transitionId: 'tabbar.jobs-open' },
  { id: 'feed', path: '/feed', labelKey: 'tabFeed', transitionId: 'tabbar.feed-open' },
  { id: 'messages', path: '/messages', labelKey: 'tabMessages', transitionId: 'tabbar.messages-open' },
  { id: 'mine', path: '/me', labelKey: 'tabMine', transitionId: 'tabbar.mine-open' },
] as const;

/** 筛选面板分组(IMG_8497~8499 实锤;薪资/BOSS活跃单选) */
export const FILTER_GROUPS: {
  key: string; title: string; single?: boolean;
  options: string[]; expandable?: boolean; hint?: string;
}[] = [
  { key: 'edu', title: '学历要求', options: ['全部', '初中及以下', '中专/中技', '高中', '大专', '本科', '硕士', '博士'] },
  { key: 'salary', title: '薪资待遇', single: true, options: ['全部', '3K以下', '3-5K', '5-10K', '10-20K', '20-50K', '50K以上'] },
  { key: 'exp', title: '经验要求', options: ['全部', '在校生', '应届生', '1年以内', '1-3年', '3-5年', '5-10年', '10年以上'] },
  { key: 'active', title: 'BOSS活跃状态', single: true, options: ['不限', '刚刚活跃', '今日活跃', '3日内活跃', '本周活跃', '本月活跃'] },
  { key: 'industry', title: '行业分类', hint: '(根据期望为你推荐~)', expandable: true, options: ['全部', '电子商务', '数据服务', '生活服务', '智能硬件', '移动互联网', '互联网', '计算机软件', '人工智能', '教育培训', '医疗健康', '文化传媒', '汽车', '汽车/出行', '游戏', '物流/供应链', '芯片/半导体', '新能源'] },
  { key: 'scale', title: '公司规模', options: ['全部', '0-20人', '20-99人', '100-499人', '500-999人', '1000-9999人', '10000人以上'] },
  { key: 'stage', title: '融资阶段', expandable: true, options: ['全部', '未融资', '天使轮', 'A轮', 'B轮', 'C轮', 'D轮及以上', '已上市'] },
];

/** 城市筛选页分组(IMG_8418) */
export const CITY_GROUPS: { title: string; cities: string[] }[] = [
  { title: '计算机类专业热招', cities: ['广州', '成都', '武汉', '北京', '上海', '深圳'] },
  { title: '求职意向岗位多', cities: ['重庆', '济南', '郑州', '苏州', '宁波', '东莞'] },
  { title: '互联网行业发达', cities: ['杭州', '南京', '合肥', '西安', '福州', '长沙'] },
];

/** 不感兴趣原因弹层(IMG_8493)。动态首项由页面按职位薪资/公司拼接 */
export const DISMISS_REASON_GROUPS: { title: string; reasons: string[] }[] = [
  { title: '不太感兴趣', reasons: ['薪资低', '公司不合适', '每周兼职天数不合适', '距离远', '不是兼职职位', '结钱方式不合适'] },
  { title: '效率反馈', reasons: ['职位停招/招满', '重复推荐'] },
];

/** 求职状态选项(IMG_8502) */
export const JOB_STATUS_OPTIONS = [
  { value: '离校-随时到岗', recommended: true },
  { value: '在校-月内到岗', recommended: true },
  { value: '在校-考虑机会', recommended: false },
  { value: '在校-暂不考虑', recommended: false },
] as const;

/** 期望薪资选择器选项(Q3:弹层选,非自由输入) */
export const SALARY_RANGE_OPTIONS = [
  '3K以下', '3-5K', '5-10K', '10-15K', '15-16K', '15-20K', '20-25K', '20-30K', '30-50K', '50K以上',
];

export const POSITION_OPTIONS = ['算法工程师', 'AI Agent研发工程师', '大模型算法工程师', '机器学习工程师', 'NLP算法工程师', '前端开发工程师', '后端开发工程师', '数据分析师'];
export const INDUSTRY_OPTIONS = ['行业不限', '互联网', '人工智能', '计算机软件', '智能硬件', '教育培训', '医疗健康'];

/** 兼职页分类金刚区：固定结构放 constants，图标统一使用 Lucide 别名。 */
export const PARTTIME_CATEGORY_TABS = [
  { id: 'store', label: '店铺兼职', icon: IcStore, tint: '#FFE9E0' },
  { id: 'weekend', label: '周末兼职', icon: IcCalendarDays, tint: '#FFF3D6' },
  { id: 'milk-tea', label: '奶茶店兼职', icon: IcDrink, tint: '#EFE5FF' },
  { id: 'cinema', label: '电影院兼职', icon: IcMovie, tint: '#FFE3EC' },
  { id: 'long-term', label: '长期兼职', icon: IcCoffee, tint: '#FFE9D6' },
  { id: 'remote', label: '宅家可做', icon: IcHome, tint: '#E0F2FF' },
] as const;

/**
 * “综合”首屏的跨岗位推荐顺序。
 * 种子数据前半段集中为算法岗，直接沿用 JSON 顺序会导致“综合”和“算法工程师”首屏看起来完全相同。
 */
export const COMPREHENSIVE_RECOMMENDATION_JOB_IDS = [
  'j22', // Java 后端
  'j28', // 数据分析
  'j1',  // 算法
  'j23', // 前端
  'j33', // 客服
  'j34', // UI 设计
  'j29', // 测试开发
  'j54', // 理货
  'j47', // 游戏客户端
  'j64', // 新媒体运营
  'j55', // 数字 IC
  'j3',  // AI Agent
] as const;

/** VIP 会员页(IMG_8440)静态结构 */
export const VIP_PAGE = {
  slogan: '尊享10大权益,68元/30天',
  saveTip: '开通会员预计至少节省720元',
  cards: [
    { id: 'card30', label: '30天卡', price: '68元' },
    { id: 'card60', label: '60天卡', price: '98元', badge: '优惠7.2折' },
  ],
  benefits: [
    { name: '自动追聊', normal: false, vip: true },
    { name: '新岗位速递', normal: false, vip: true },
    { name: '竞争力分析', normalText: '5元/天', vipText: '不限次数' },
    { name: 'AI润色简历', normalText: '1次/天', vipText: '不限次数' },
    { name: '专属简历模板', normal: false, vip: true },
  ],
  moreBenefits: ['自动追聊', '新岗位速递', '竞争力分析', 'AI润色简历'],
};

/** 16型人格测评购买页(IMG_8438) */
export const MBTI_PAGE = {
  title: '16型人格职业性格测试',
  subtitle: '探索自我,解锁职业潜力',
  rights: ['专业测评报告', '职业规划建议', '多维度职业解析'],
  editions: [
    { id: 'std', name: '标准版(60道题)', desc: '报告包含职业性格、职业特征、职业偏好、职业发展指南等内容' },
    { id: 'full', name: '完整版(94道题)', desc: '报告另外增加代表人物、性格标签、职业盲区、职业建议等' },
  ],
  price: '12',
  priceUnit: '直豆',
};

/** 竞争力分析器购买页(IMG_8439) */
export const COMP_BUY_PAGE = {
  title: '竞争力分析器',
  badge: '全新升级',
  subtitle: '分析职位数据,让求职更有把握',
  cards: [
    { id: '30d', days: '30天', desc: '不限次数/天', price: '49直豆', badge: '3.3折优惠' },
    { id: '1d', days: '1天', desc: '不限次数/天', price: '5直豆' },
  ],
  notes: [
    '对职位使用竞争力分析器后,可永久查看该职位近90天的数据情况,实时更新,分析结果仅供参考',
    '道具激活有效期为购买后365天(不含购买当天),过期未激活道具失效',
    '按天进行售卖的道具,激活后道具当天生效。',
  ],
};

/** 职业测评列表(IMG_8445) */
export const ASSESSMENT_LIST = [
  { id: 'mbti', name: '16型人格职业性格测试', desc: '探索自我,解锁职业潜力', open: true },
  { id: 'mental', name: '心理健康测评', desc: '偏执?抑郁?焦虑?强迫症?不安全感', open: false },
  { id: 'eq', name: '职场情商测评', desc: '了解自我情绪智慧,获取职场行动建议', open: false },
  { id: 'match', name: '职业匹配度测评', desc: '定向评估岗位胜任潜力,定位个人长短板', open: false },
];

/** 羚羊计划(IMG_8444) */
export const GUIDANCE_PAGE = {
  title: '羚羊计划',
  banner: '爱心导师为应届学生、职场新人提供免费公益咨询,BOSS直聘以该导师的名义,向可可西里进行公益捐赠。',
  categories: ['职场提高课', '简历修改', '大厂面经', '随便聊聊'],
  courses: [
    { id: 'gc1', mentor: '梧小枝', badge: '金牌导师', title: '求职一站式辅导', category: '随便聊聊', desc: '课程名称:求职一站式辅导 导师简介:内容/市…', mentorTitle: '书店主编·10年以上', avatar: 'f1' },
    { id: 'gc2', mentor: '楚南絮', title: '职场劳动法律小知识', category: '职场提高课', desc: '人在职场,不得不学的劳动法律小知识 1,公司…', mentorTitle: '首席法务师·10年以上', avatar: 'f3' },
    { id: 'gc3', mentor: '池亦舟', title: '创业大牛:每个人都要有创业思维', category: '职场提高课', desc: '导师介绍 多年创业经验,拥有优秀的商业顶层架…', mentorTitle: '总经理·10年以上', avatar: 'f4' },
    { id: 'gc4', mentor: '岑佳树', badge: '金牌导师', title: '求职实战分享:学历普通如何逆袭', category: '职场提高课', desc: '#为什么选我# 横跨多行业总能拿到离家20分钟路…', mentorTitle: '市场主管·10年以上', avatar: 'f6' },
  ],
};

/** 实习专区(IMG_8443) */
export const INTERNSHIP_PAGE = {
  title: '0实习冲刺计划',
  slogans: ['0经验友好岗位', '同专业热投岗位'],
  greeting: '毕业找工作时,有实习经历会更有竞争力!',
  category: '技术',
};

/** 竞争力分析详情(Q8 推断 + IMG_8439 顶部卡片样式) */
export const COMP_DETAIL = {
  percentile: 96,
  tags: ['数据分析', '创意策划', '算法相关专业', '在校生'],
  matchLevels: ['一般', '良好', '优秀', '极好'],
  matchLevel: 2,
};

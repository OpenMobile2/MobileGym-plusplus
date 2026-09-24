// 百词斩 文案(中文基准)。英文覆盖见 strings.en.ts,经 useAppStrings 跟随 OS 语言。
// 真机设置无 in-app 语言开关(8335),双语在字符串层随系统切换(§10.2)。

export const strings = {
  appName: '百词斩',

  // tabbar(主)
  tabHome: '首页',
  tabCourse: '学习',
  tabTrain: '训练场',
  tabTogether: '一起背',
  tabMall: '商城',

  // tabbar(阅读子模块)
  readTabHome: '推荐',
  readTabMine: '我读',
  readTabCamp: '老师带读',
  readTabProfile: '我的',

  // 通用
  back: '返回',
  confirm: '确认',
  cancel: '取消',
  save: '保存',
  done: '完成',
  add: '添加',
  added: '已添加',
  notAvailable: '该功能暂未开放',
  featureDefaultName: '此功能',
  featureUnavailableDetail: '当前版本暂未实现，请点击“确认”返回上一页继续操作。',
  shareSuccess: '分享成功',
  membershipActivated: '会员已开通',
  registrationSuccess: '报名成功',
  continue: '继续',
  loading: '加载中…',

  // 首页
  streakUnit: '天',
  newLearn: '新学',
  review: '复习',
  groupsUnit: '组',
  wordsUnit: '词',
  backToLegacy: '返回旧版',
  task: '任务',
  rank: '排行榜',
  dict: '查询',
  wordbook: '单词本',
  reading: '阅读',
  member: '会员',

  // 学习流
  studyKnown: '记住了',
  studyKnownSub: '做题确认',
  studyUnknown: '没记住',
  studyUnknownSub: '再学一遍',
  noPrevWord: '暂无上一词',
  comboUnit: '连对',
  protectPlus: '不断电+1天',
  finishGroup: '完成',
  wordSummary: '单词小结',
  todayPlan: '今日计划',
  todayReviewProgress: '今日复习进度',
  restAwhile: '休息一下',
  nextGroup: '下一组',
  addReview: '加量复习',
  finishTodayReview: '完成今日复习',
  firstGroupBonus: '首组复习加成!',

  // 词详情知识 tab
  ktabRoots: '词根词缀',
  ktabExam: '真题考频',
  ktabSyn: '同义替换',
  ktabMnemonic: '小斩助记',
  collect: '收藏',
  collectSuccess: '收藏成功',

  // 查词
  dictPlaceholder: '请输入要查询的英文或中文',
  wordReport: '单词报错',

  // 单词本
  wordbookTitle: '单词本',
  collectedWords: '收藏的单词',
  newWordbook: '新建单词本',
  pasteToken: '粘贴口令',
  sortOrder: '展示顺序',
  sortTimeAsc: '按时间顺序',
  sortTimeDesc: '按时间倒序',
  sortAlphaAsc: '按字母顺序',
  sortAlphaDesc: '按字母倒序',
  sortRandom: '随机乱序',
  manageWordbook: '管理单词本',
  wordbookName: '单词本名称',
  addWords: '添加单词',
  batchEdit: '批量编辑',
  deleteWordbook: '删除单词本',
  noWords: '这个单词本还没有单词',
  searchWords: '搜索英文或中文释义',
  addSelected: '添加所选单词',
  selectedCount: '已选择',

  // 课程
  courseStart: '开始学习',
  coursePause: '暂停学习',
  completeLesson: '完成本节',
  nextLesson: '下一节',
  courseUnavailable: '即将开放',
  independentApp: '独立 App',

  // 计划 / 词书
  myPlan: '我的计划',
  currentPlan: '当前计划',
  addedPlans: '添加过的计划',
  viewMorePlans: '查看更多计划',
  adjustPlan: '调整计划',
  dailyGroups: '每日组数',
  savePlan: '保存计划',
  planManage: '计划管理',
  bookStore: '全部内容',
  manage: '管理',

  // 铜板 / 不断电
  coin: '铜板',
  myCoin: '我的铜板',
  howToGetCoin: '如何获得铜板',
  howToUseCoin: '铜板怎么使用',
  streakTitle: '不断电',
  streakContinuous: '连续不断电',
  protectCard: '断电保护卡',
  equipped: '已装备',

  // 训练场
  trainGames: '单词小游戏',
  trainDrill: '专项训练',
  trainQuick: '快速训练',
  trainChoice: '单词选义',
  trainSpell: '单词拼写',

  // 商城
  mallCart: '购物车',
  cartEmpty: '购物车里什么都没有',
  goBrowse: '去逛逛',
  selectAll: '全选',
  total: '合计',
  checkout: '去结算',
  buyNow: '立即购买',
  addCart: '加入购物车',
  mallDetailGoods: '商品',
  mallDetailReviews: '晒单',
  mallDetailRecommend: '推荐',
  mallDetailIntro: '详情',
  guessLike: '猜你喜欢',
  coinPrice: '铜板购到手价',
  confirmOrder: '确认订单',
  addAddress: '新增收货地址',
  noAddress: '您还没有收货地址,请点击添加',
  saveAndUse: '保存并使用',
  payNow: '付款',
  payMethod: '支付方式',
  orderNote: '订单备注',

  // 设置
  settings: '设置',
  accountManage: '账号管理',
  soundVibrate: '音效与震动设置',
  pushSettings: '推送消息设置',
  privacy: '隐私设置',
  cacheManage: '缓存管理',
  logout: '退出登录',
  myCollect: '我的收藏',
  vocabTest: '词汇量测试',
  identityTitle: '9月后你将会是',

  // 阅读
  startReading: '开始阅读',
  addToWordbook: '加入单词本',
  oneClickAddRead: '一键加入我读',
  exploreCity: '探索书城',
  shelfEmpty: '书架暂时为空',
  generatePlan: '生成计划',
  dailyMinutes: '每日学习时长',
  planTitle: '我的外刊计划',
  planGoal: '7 天完成 3 篇外刊精读',
  todayLearning: '今天的学习',
  articleCollection: '文章集',
  readingProgress: '朗读进度',

  // 空态 / 通用
  emptyList: '这里空空如也',
  comingSoon: '敬请期待',
} as const;

export type StringKey = keyof typeof strings;

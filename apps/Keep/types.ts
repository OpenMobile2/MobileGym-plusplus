// apps/Keep/types.ts —— 应用级类型。
// 状态形状的单一事实源;与 data/defaults.json(种子数据 v2)一一对应。
// 图片字段(cover/avatar/images)存图片 id(res/images.ts 的 imgUrl/Img 解析),不存路径。
import type { CourseActions } from './store/courseSlice';
import type { RunActions } from './store/runSlice';
import type { MallActions } from './store/mallSlice';
import type { SocialActions } from './store/socialSlice';
import type { MeActions } from './store/meSlice';

/* ============ 基础字面量 ============ */

/** 课程难度等级(K1 零基础 ~ K4 挑战) */
export type KeepLevel = 'K1' | 'K2' | 'K3' | 'K4';
/** 运动记录类型(证据 recG/s088/s089) */
export type KeepRunRecordType = '户外跑步' | '室内有氧' | '户外行走' | '室内跑步' | '户外骑行';
/** 运动tab 二级模式(证据 s056-s062) */
export type KeepRunMode = '目标跑' | '自由跑' | '课程跑' | '自定义';

/* ============ 用户 / 会员 ============ */

export interface KeepUser {
  id: string;
  nickname: string;
  avatar: string;
  /** 个人主页封面（系统相册选中后写入） */
  cover?: string;
  gender: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  kgLevel: number;
  following: number;
  followers: number;
  cheers: number;
  sportCoins: number;
  totalMinutes: number;
  totalRunKm: number;
  memberExpired: boolean;
}

/** 会员档位(证据 s023/s098:连续包月¥4/月卡¥25/季卡¥40/年卡¥128) */
export interface KeepMemberPlan {
  id: string;
  label: string;
  price: number;
  origPrice: number;
  note: string;
}

export interface KeepMember {
  active: boolean;
  /** 到期日(过期态则为已过期日期,绝对字符串 "2026-07-07") */
  expireDate: string;
  plans: KeepMemberPlan[];
}

/* ============ 课程 / 教练 / 计划 ============ */

export interface KeepCourseSegment {
  name: string;
  seconds: number;
}

export interface KeepCommentReply {
  id: string;
  author: string;
  content: string;
  time: string;
  region: string;
  likes: number;
}

export interface KeepComment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  time: string;
  region: string;
  likes: number;
  replies: KeepCommentReply[];
}

export interface KeepCourse {
  id: string;
  title: string;
  /** 展示用教练名(可为「××、×× 2位教练」) */
  coach: string;
  /** 关联达人主页;非达人课程为 null */
  coachId: string | null;
  level: KeepLevel;
  minutes: number;
  /** 如 "22-32千卡" */
  kcalRange: string;
  rating: number;
  /** 练过人数展示串,如 "1942万" */
  practiced: string;
  /** 全部课程左侧分类:免费课/会员课/户外跑步/HIIT训练/健身操/跳绳燃脂/健康改善… */
  category: string;
  cover: string;
  isMember: boolean;
  segments: KeepCourseSegment[];
  description: string;
  commentsCount: number;
  comments: KeepComment[];
  /** 跑步课程距离(如法特莱克 3.05) */
  distanceKm?: number;
  /** 系列课进度(如 系列1/6) */
  seriesIndex?: number;
  seriesTotal?: number;
}

export interface KeepCoachAchievement {
  label: string;
  value: string;
}

export interface KeepCoach {
  id: string;
  name: string;
  avatar: string;
  /** 粉丝展示串,如 "271.6w" */
  fans: string;
  /** 月跟练展示串,如 "34.5w" */
  monthly: string;
  /** 收获加油展示串,如 "81.0w" */
  cheers: string;
  following: number;
  /** 认证,如 ["ACE教练"] / ["YouTube运动博主"] */
  certs: string[];
  /** 成就栏(半马PB 01:16:15 / 最远22.22公里 / KG11) */
  achievements: KeepCoachAchievement[];
  /** 达人课程 id 列表 */
  courses: string[];
  bio: string;
}

export interface KeepPlan {
  id: string;
  title: string;
  weeks: number;
  daysPerWeek: number;
  /** 练过展示串,如 "935万人" */
  practiced: string;
  /** 计划筛选chips:瘦全身/大体重掉秤/练腹肌/跑步 */
  tags: string[];
  cover: string;
  /** 计划天数(plan.result:28天) */
  days: number;
  /** 预计消耗千卡(plan.result:8784) */
  kcal: number;
  level: KeepLevel;
}

/* ============ 定制问卷 / 日程 ============ */

export interface KeepQuiz {
  /** 题 id → 选项(单选 string / 复选 string[]) */
  answers: Record<string, string | string[]>;
  generatedPlanId: string | null;
}

export interface KeepScheduleGoal {
  id: string;
  label: string;
  current: number | null;
  target: number | null;
  unit: string;
}

export interface KeepSchedule {
  activePlanId: string | null;
  /** 智能计划推荐/今日课程(course id)；与 dayCourses[today] 同步 */
  todayCourses: string[];
  /** 按日期归档的已排课程(YYYY-MM-DD → courseId[])；加日历保存写入此处 */
  dayCourses?: Record<string, string[]>;
  /** 周日期条(一13~日19) */
  weekDays: { date: string; label: string }[];
  /** 目标卡横滑(时长/消耗/大腿围) */
  goals: KeepScheduleGoal[];
  /** 当前智能推荐计划 id(默认 p_abs,「暂不推荐」轮换) */ // clusterD 追加
  recommendedPlanId?: string | null;
  /** 请假顺延天数(未请假为 undefined/0) */ // clusterD 追加
  leaveDays?: number;
  /** 「暂不推荐」后收起推荐卡 */ // clusterD 追加
  recommendHidden?: boolean;
  /** 进行中计划当前第几天(从 1 起) */ // clusterD 追加
  planDay?: number;
}

/* ============ 跑步 / 运动记录 / 路线 / 动作库 ============ */

export interface KeepRunState {
  /** 顶部运动类型(户外跑步▼) */
  sportType: string;
  mode: KeepRunMode;
  goalKm: number;
  /** 语音陪跑引导是否看过(run.voiceguide) */
  voiceguideSeen: boolean;
}

/** 跑步会话状态机(run.active 计时/里程模拟) */ // clusterB 追加
export interface KeepRunSession {
  status: 'countdown' | 'running' | 'paused' | 'done';
  /** 3-2-1 倒计时结束时刻(realNow 毫秒) */
  countdownEndMs: number;
  /** 当前 running 段起点(realNow 毫秒;非 running 时为 0) */
  startMs: number;
  /** 已累计秒数(不含当前 running 段) */
  baseSec: number;
  /** 已累计米数(不含当前 running 段) */
  baseM: number;
  /** 目标跑目标距离;自由跑为 null */
  goalKm: number | null;
  /** 结算生成的 runRecord id(run.summary 读取) */
  lastRecordId: string | null;
}

export interface KeepRunRecord {
  id: string;
  type: KeepRunRecordType;
  /** 列表展示名(默认同 type) */
  name: string;
  /** 距离公里;室内有氧无距离为 null */
  km: number | null;
  durationSec: number;
  kcal: number;
  /** 配速 秒/公里;无配速记录为 null */
  paceSecPerKm: number | null;
  date: string;
  /** 当日时刻,如 "07:32" */
  timeOfDay: string;
  /** 来源角标:Keep/Garmin佳明/Apple健康 */
  source: string;
  uploaded: boolean;
  /** 行走类记录步数 */
  steps?: number;
  heartAvg?: number;
  heartMax?: number;
  /** 爬升高度(米) */
  climb?: number;
  /** 平均步频 */
  cadence?: number;
  /** 平均功率(瓦) */
  power?: number;
  /** 运动负荷 */
  load?: number;
  /** 总时长(含暂停,record.detail 00:25:57) */
  totalSec?: number;
  vo2max?: number;
  /** 装备,如 "Garmin佳明" */
  gear?: string;
}

export interface KeepRoute {
  id: string;
  name: string;
  km: number;
  /** 爬升(米) */
  climb: number;
  /** 路线类型:跑步/骑行/健走 */
  type: string;
  shape: '单程' | '环形';
  /** 距离我 x 公里 */
  distanceMe: number;
  checkins: number;
  creator: string;
  createdDate: string;
  cover: string;
}

export interface KeepActionItem {
  id: string;
  name: string;
  /** 目标肌群,如 ["腹直肌下部","髂腰肌"] */
  muscle: string[];
  /** 部位分栏:胸部/上腹部/下腹部/腿部/核心/全身… */
  bodyPart: string;
  /** 器械筛选:自重/哑铃/器械 */
  equipment?: string;
  /** 姿势筛选:站立/仰卧/俯卧 */
  posture?: string;
  rating: number;
  /** 练过展示串,如 "490万" */
  practiced: string;
  steps: string[];
}

/* ============ 社区 ============ */

export interface KeepPostSportData {
  type: string;
  km?: number;
  /** 展示时长,如 "01:27:40" */
  duration?: string;
  kcal?: number;
  /** 均速展示,如 "10.0" */
  speed?: string;
  /** 奖牌名次:金牌①/银牌② */
  medal?: string;
  /** 组别名次,如 "男子组No.2" */
  rank?: string;
  /** 成就,如 "个人成绩最佳" */
  achievement?: string;
}

export interface KeepPost {
  id: string;
  /** 关联达人 id;普通用户/官方号为 null */
  authorId: string | null;
  author: string;
  avatar: string;
  time: string;
  region: string;
  type: '图文' | '视频' | '运动记录';
  content: string;
  images: string[];
  sportData?: KeepPostSportData;
  cheers: number;
  commentsCount: number;
  comments: KeepComment[];
  collects: number;
  /** 表情回应 chips(📢19 等) */
  emojis: Record<string, number>;
}

/* ============ 商城 ============ */

export interface KeepSku {
  id: string;
  label: string;
  stock: number;
}

export interface KeepProduct {
  id: string;
  title: string;
  price: number;
  origPrice: number | null;
  /** 运动币可抵扣金额(元) */
  coinDeduct?: number;
  /** 可用券描述,如 "满99减47代金券" */
  coupon?: string;
  /** 月销展示串,如 "1000+"、"54" */
  monthlySales: string;
  /** 类目:运动装备/健康食品/智能穿戴/体脂秤/运动服饰… */
  category: string;
  cover: string;
  skus: KeepSku[];
  sellPoints: string[];
  /** 保障条:包邮·七天无理由退换 / 包邮·不支持七天无理由 */
  guarantee: string;
  /** Keepers说 好评数 */
  commentsCount?: number;
  /** 限时直降倒计时(天) */
  countdownDays?: number;
  /** 新人专享 */
  isNewUser?: boolean;
  /** SKU 弹层「优惠搭配」商品 id */
  bundleIds?: string[];
  /** 临期秒杀到期日 */
  flashExpire?: string;
}

export interface KeepCartItem {
  productId: string;
  skuId: string;
  count: number;
  /** 勾选态(缺省视为已勾选) */ // clusterC 追加
  checked?: boolean;
}

/* ============ 下单草稿(mall.sku / mall.cart → order.confirm → order.pay) ============ */
// clusterC 追加
export interface KeepOrderDraftItem {
  productId: string;
  skuId: string;
  count: number;
}

// clusterC 追加
export interface KeepOrderDraft {
  items: KeepOrderDraftItem[];
  /** 顺手买一件已勾选商品 id */
  addonIds: string[];
  /** 自动领取的优惠券面额(-¥47;不满足门槛为 0) */
  couponAmount: number;
  /** 进入 order.confirm 的一次性自动领券 toast 是否已弹 */
  couponToasted: boolean;
  /** 运动币抵扣勾选 */
  coinChecked: boolean;
  /** 支付宝支付 / 微信支付 */
  payMethod: string;
}

export interface KeepOrder {
  id: string;
  type: '商城' | '活动' | '会员';
  title: string;
  /** 状态:待付款/待发货/待收货/已完成/已取消/退款中 */
  status: string;
  amount: number;
  paidAmount: number;
  sku: string;
  payMethod: string;
  payTime: string;
  createTime: string;
  addressName: string;
  addressPhone: string;
  address: string;
  cover: string;
}

export interface KeepCoupon {
  id: string;
  title: string;
  /** 面额(元);折扣券存折扣描述在 title,amount 为 0 */
  amount: number;
  /** 门槛,如 "满199可用";无门槛空串 */
  threshold: string;
  scope: string;
  expireDate: string;
  status: '未使用' | '已使用' | '已过期';
}

/* ============ 奖牌 / 比赛 ============ */

export interface KeepMedal {
  id: string;
  name: string;
  /** IP 名,如 "Hello Kitty"、"线条小狗" */
  ip: string;
  price?: number;
  /** 报名人数展示串,如 "247332人已报名" */
  participants: string;
  /** 如 "06.24-08.23" */
  dateRange: string;
  /** 完赛任务,如 "跑步累计1.314公里即可完赛" */
  taskDesc: string;
  /** 奖励:实体奖牌/奖牌身份卡/虚拟Plus/虚拟徽章/完赛证书 */
  rewards: string[];
  cover: string;
  /** 「可提交完赛」绿标 */
  canSubmit: boolean;
}

export interface KeepRace {
  id: string;
  name: string;
  /** 线上活动/品牌赛/比赛报名 */
  type: string;
  date: string;
  location: string;
  cover: string;
}

/* ============ 消息 ============ */

export interface KeepMsgThread {
  id: string;
  name: string;
  avatar: string;
  preview: string;
  time: string;
  unread: number;
  kind: '好友' | '系统';
}

export interface KeepChatMsg {
  id: string;
  from: 'me' | 'peer';
  content: string;
  time: string;
}

export interface KeepMessages {
  threads: KeepMsgThread[];
  /** threadId → 消息流(仅好友会话) */
  chat: Record<string, KeepChatMsg[]>;
}

/* ============ 设置 / 钱包 / 身体数据 ============ */

export interface KeepAddress {
  name: string;
  phone: string;
  detail: string;
}

/** 训练设置弹层(n01)+ 收货地址 + 同步开关 */
export interface KeepSettings {
  bgMusic: string;
  bgMusicVolume: number;
  headphoneControl: boolean;
  voiceGuide: boolean;
  voiceVolume: number;
  teamMode: boolean;
  backgroundTraining: boolean;
  screenLock: boolean;
  /** 「自动上传 Apple 健康数据」开关(records.sync 弹窗) */
  autoUpload: boolean;
  address: KeepAddress;
}

export interface KeepWallet {
  coins: number;
  redPacket: number;
  kBalance: number;
}

export interface KeepWeightEntry {
  date: string;
  kg: number;
}

export interface KeepSteps {
  today: number;
  /** 近7天步数(周一~周日) */
  week: number[];
}

export interface KeepSearchState {
  recents: string[];
  hotwords: string[];
}

/* ============ 簇A 追加:训练会话 / 目标 / 结算 ============ */

/** 跟练会话状态机(course.training)// clusterA 追加 */
export interface KeepTrainingSession {
  courseId: string | null;
  status: 'running' | 'paused';
  /** 当前 running 段起点(TimeService.realNow) */
  startedRealMs: number;
  /** 之前累计运动毫秒(不含当前 running 段) */
  accumMs: number;
  segIndex: number;
  /** 当前动作累计毫秒(不含当前 running 段) */
  segAccumMs: number;
  /** 当前动作 running 段起点 */
  segStartedRealMs: number;
  checkins: number;
  danmaku: boolean;
}

/** 单动作跟练会话(action.training)// clusterA 追加 */
export interface KeepActionSession {
  actionId: string | null;
  status: 'running' | 'paused';
  startedRealMs: number;
  accumMs: number;
  /** 已完成次数/秒（计次按节奏估算，计时取已练秒数） */
  completed: number;
}

/** 动作目标设置(action.goal)// clusterA 追加 */
export interface KeepActionGoal {
  mode: '计次' | '计时';
  /** null = ∞ 不设目标 */
  value: number | null;
  weightKg: number | null;
}

/** 训练完成结算(course.complete)// clusterA 追加 */
export interface KeepCompleteSummary {
  courseId: string | null;
  durationSec: number;
  kcal: number;
  actionCount: number;
  feeling: number | null;
}

/* ============ 根状态 ============ */

export interface KeepState {
  lastToast: string | null;
  user: KeepUser;
  member: KeepMember;
  courses: KeepCourse[];
  coaches: KeepCoach[];
  plans: KeepPlan[];
  quiz: KeepQuiz;
  schedule: KeepSchedule;
  runState: KeepRunState;
  runRecords: KeepRunRecord[];
  routes: KeepRoute[];
  actionsLib: KeepActionItem[];
  posts: KeepPost[];
  products: KeepProduct[];
  cart: KeepCartItem[];
  orders: KeepOrder[];
  coupons: KeepCoupon[];
  medals: KeepMedal[];
  races: KeepRace[];
  messages: KeepMessages;
  /** 消息中心是否已全部已读 */
  notificationsRead: boolean;
  settings: KeepSettings;
  wallet: KeepWallet;
  weightLog: KeepWeightEntry[];
  steps: KeepSteps;
  /** 发现·关注 feed(post id 引用) */
  feedFollow: string[];
  /** 发现·社区 feed(post id 引用) */
  feedCommunity: string[];
  searchState: KeepSearchState;
  /** 跨页「当前选中项」(courseId/productId/postId/recordId/routeId/coachId/medalId/actionId/orderId/planId/threadId…),列表页跳详情前 setCurrent 写入 */
  current: Record<string, string | null>;
  /** 跑步进行中会话(无会话时为 null/undefined) */ // clusterB 追加
  runSession?: KeepRunSession | null;
  /** 「想练」课程 id 列表(run.home 课程跑卡) */ // clusterB 追加
  wishCourseIds?: string[];
  /** 想练课程 id 列表 // clusterA 追加 */
  wishCourses?: string[];
  /** 想练动作 id 列表 // clusterA 追加 */
  wishActions?: string[];
  /** 一键想练的模板 id 列表 // clusterA 追加 */
  wishTemplates?: string[];
  /** 加日历已选训练日(YYYY-MM-DD)// clusterA 追加 */
  trainingDays?: string[];
  /** 课程社区已关注用户昵称 // clusterA 追加 */
  followedNames?: string[];
  /** 已关注达人 id // clusterA 追加 */
  followedCoaches?: string[];
  /** 已点赞评论 id // clusterA 追加 */
  likedComments?: string[];
  /** 社区互动标签计数增量(key=`${host}:${tag}`)// clusterA 追加 */
  reactionCounts?: Record<string, number>;
  /** 跟练会话(null=未在训)// clusterA 追加 */
  trainingSession?: KeepTrainingSession | null;
  /** 单动作会话 // clusterA 追加 */
  actionSession?: KeepActionSession | null;
  /** 动作目标设置 // clusterA 追加 */
  actionGoal?: KeepActionGoal;
  /** 最近一次训练结算 // clusterA 追加 */
  lastComplete?: KeepCompleteSummary | null;
  /** 已加油动态 id // clusterC 追加 */
  cheeredPosts?: string[];
  /** 已收藏动态 id // clusterC 追加 */
  favedPosts?: string[];
  /** 动态表情回应(postId → 已点表情) // clusterC 追加 */
  emojiReacted?: Record<string, string[]>;
  /** 社区已关注用户昵称(动态详情/推荐关注) // clusterC 追加 */
  followedUsers?: string[];
  /** 已关闭的广告/促销卡片 id // clusterC 追加 */
  closedCards?: string[];
  /** 商城新人 ¥100 券包已领取 // clusterC 追加 */
  newuserCouponClaimed?: boolean;
  /** 下单草稿(null=无) // clusterC 追加 */
  orderDraft?: KeepOrderDraft | null;
  interactionAudit: {
    coachDynamicViewedIds: string[];
    runPanelViewed: number[];
    runPauseCount: number;
    runResumeCount: number;
    recordViews: Array<{ metric: string; segment: string; offset: number }>;
    scheduleHomeViewed?: boolean;
  };
}

export interface BaseActions {
  toast: (msg: string | null) => void;
  /** 列表→详情传参:bindTap(tid, { beforeTrigger: () => setCurrent('courseId', id) }) */
  setCurrent: (key: string, id: string | null) => void;
  recordCoachDynamicView: (coachId: string) => void;
  recordRunPanelView: (panel: number) => void;
  recordRecordsView: (metric: string, segment: string, offset: number) => void;
  recordScheduleHomeView: () => void;
}

export type KeepActions = BaseActions & CourseActions & RunActions & MallActions & SocialActions & MeActions;

export type KeepSet = (
  partial: Partial<KeepState & KeepActions> | ((state: KeepState & KeepActions) => Partial<KeepState & KeepActions>),
) => void;
export type KeepGet = () => KeepState & KeepActions;

export interface CourseCard {
  id: string;
  name: string;
  tags: string[];
  price: string;
  icon: string;
  available: boolean;
}

export interface CourseTopic {
  title: string;
  desc: string;
  learners: string;
  tabs: string[];
  icon: string;
  courses: CourseCard[];
}

export const COURSE_CATEGORIES: [string, string, string][] = [
  ['career', '职场技能', '💼'], ['practical', '实用英语', '🧭'], ['exam', '大学考试', '🎓'], ['abroad', '出国留学', '✈️'],
  ['lsrw', '听说读写', '🎧'], ['cet', '四六级课', '📝'], ['highschool', '高中英语', '🏫'], ['spoken', '口语课', '💬'],
  ['grammar', '语法基础', 'Aa'], ['lecture', '小讲堂', '💡'],
];

export const FEATURED_COURSES: CourseCard[] = [
  { id: 'listen-fun', name: '听力·趣味磨耳', tags: ['情景听力', '三节体验课'], price: '免费体验', icon: '🎧', available: true },
  { id: 'journal-bootcamp', name: '外刊精读训练营', tags: ['拆句精读', '核心词表'], price: '免费体验', icon: '📰', available: true },
  { id: 'tomato-spoken', name: '番茄口语', tags: ['场景表达', '跟读练习'], price: '免费体验', icon: '💬', available: true },
];

export const MY_COURSE: CourseCard = {
  id: 'kids-l1-6', name: '百词斩少儿拓展包 L1-6', tags: ['长期有效', '已加入'], price: '继续学习', icon: '🌱', available: true,
};

export const COURSE_TOPICS: Record<string, CourseTopic> = {
  practical: { title: '实用英语', desc: '读原著、出国旅行、职场交流，把英语真的用起来', learners: '2.3w', tabs: ['全部', '看电影/去旅行', '阅读'], icon: '🧭',
    courses: [
      { id: 'practical-listen', name: '听力体验营', tags: ['听力技巧解锁', '趣味视频学习'], price: '免费体验', icon: '🎧', available: true },
      { id: 'practical-journal', name: '外刊精读课', tags: ['阅读技巧', '时事新闻'], price: '免费体验', icon: '📰', available: true },
      { id: 'practical-scene', name: '场景英语体验', tags: ['旅游口语', '追 vlog 学英语'], price: '即将开放', icon: '🗺️', available: false },
    ] },
  abroad: { title: '出国英语', desc: '过了语言关，出国学习、旅行不是问题', learners: '3w', tabs: ['全部', '雅思/托福', '实用'], icon: '✈️',
    courses: [
      { id: 'abroad-ielts', name: '王牌产品｜百词斩雅思', tags: ['只学重点', '150h 提分'], price: '即将开放', icon: '🏅', available: false },
      { id: 'abroad-listen', name: '出国听力体验营', tags: ['听力技巧', '机场与校园'], price: '免费体验', icon: '🎧', available: true },
    ] },
  exam: { title: '大学考试', desc: '百词斩出品，助同学速效不挂科、冲高分', learners: '4.3w', tabs: ['全部', '大学数学', '大学计算机', '大学英语'], icon: '🎓',
    courses: [
      { id: 'exam-cet4', name: '四级无忧备考营', tags: ['系统规划', '真题训练'], price: '免费体验', icon: '4', available: true },
      { id: 'exam-cet6', name: '六级考试大杀器', tags: ['应试技巧', '全真模拟'], price: '即将开放', icon: '6', available: false },
      { id: 'exam-c', name: 'C 语言', tags: ['速效基础课'], price: '即将开放', icon: 'C', available: false },
    ] },
  career: { title: '职场技能', desc: '提升竞争力，职场脱颖而出', learners: '2.5w', tabs: ['全部', '竞争力提升', '办公效率', '副业/转行'], icon: '💼',
    courses: [
      { id: 'career-python', name: '0 基础学编程 Python 入门', tags: ['高效办公', '数据分析'], price: '免费体验', icon: 'Py', available: true },
      { id: 'career-excel', name: 'Excel 技巧', tags: ['每日 1 个小技巧', '学练结合'], price: '免费体验', icon: 'X', available: true },
      { id: 'career-resume', name: '简历速成课', tags: ['求职必备', '资深 HR'], price: '即将开放', icon: 'CV', available: false },
    ] },
  lsrw: { title: '听说读写', desc: '听得懂、说得出、能阅读、会写作，专项逐个突破', learners: '3.7w', tabs: ['全部', '英语听力', '英语口语', '英语阅读'], icon: '🎧',
    courses: [
      { id: 'lsrw-listen', name: '听力体验营', tags: ['技巧解锁', '趣味素材'], price: '免费体验', icon: '🎧', available: true },
      { id: 'lsrw-read', name: '外刊精读课', tags: ['拆长难句', '时事新闻'], price: '免费体验', icon: '📰', available: true },
      { id: 'lsrw-spoken', name: '口语练习', tags: ['电影素材', '练习反馈'], price: '免费体验', icon: '💬', available: true },
    ] },
  cet: { title: '大学英语四六级', desc: '一次过、速效过、高分过，都有解决方案', learners: '1.9w', tabs: ['全部', '四级课', '六级课', '补差课'], icon: '📝',
    courses: [
      { id: 'cet4-plan', name: '四级无忧备考营', tags: ['系统规划', '真题训练'], price: '免费体验', icon: '4', available: true },
      { id: 'cet6-plan', name: '六级考试大杀器', tags: ['应试技巧', '全真模拟'], price: '即将开放', icon: '6', available: false },
      { id: 'cet-grammar', name: '专升本英语·语法题型课', tags: ['基础提升', '真题强化'], price: '免费体验', icon: 'Aa', available: true },
    ] },
  grammar: { title: '语法基础', desc: '语法是框架，学好语法，进步更快', learners: '5.7w', tabs: ['全部', '初中语法', '高中语法', '综合'], icon: 'Aa',
    courses: [{ id: 'grammar-ai', name: '初中英语·AI 提分宝', tags: ['语法词汇', '动画讲解'], price: '免费体验', icon: 'AI', available: true }] },
  highschool: { title: '高中英语', desc: '高效提分，词汇语法双管齐下', learners: '3.2w', tabs: ['全部', '词汇', '语法', '真题'], icon: '🏫',
    courses: [
      { id: 'highschool-smart', name: '高中英语·智能教辅', tags: ['专项词汇计划'], price: '免费体验', icon: '🏫', available: true },
      { id: 'highschool-cet', name: '斩家四级课', tags: ['系统规划', '助你过关'], price: '即将开放', icon: '4', available: false },
    ] },
  spoken: { title: '口语课', desc: '开口说英语，场景对话轻松学', learners: '2.1w', tabs: ['全部', '日常口语', '商务口语', '出国口语'], icon: '💬',
    courses: [
      { id: 'spoken-tomato', name: '番茄口语', tags: ['场景演练', '跟读表达'], price: '免费体验', icon: '🍅', available: true },
      { id: 'spoken-free', name: '免费练口语', tags: ['日常练习材料'], price: '免费体验', icon: '💬', available: true },
    ] },
  lecture: { title: '小讲堂', desc: '碎片时间，学点有用的英语小知识', learners: '1.2w', tabs: ['全部', '词汇', '语法', '文化'], icon: '💡',
    courses: [
      { id: 'lecture-daily', name: '每日一句', tags: ['地道表达', '每天进步一点'], price: '免费体验', icon: '☀️', available: true },
      { id: 'lecture-culture', name: '英语文化小课', tags: ['背景知识', '趣味拓展'], price: '免费体验', icon: '🌍', available: true },
    ] },
};

export const ALL_COURSES = [
  ...FEATURED_COURSES,
  MY_COURSE,
  ...Object.values(COURSE_TOPICS).flatMap((topic) => topic.courses),
];

export function findCourse(courseId: string | null): CourseCard {
  return ALL_COURSES.find((course) => course.id === courseId) ?? FEATURED_COURSES[0];
}

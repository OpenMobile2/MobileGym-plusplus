/** flomo 中文基线。导航 / 主按钮 / 空态走这里。 */
export const strings = {
  appName: 'flomo',
  back: '返回',
  search: '搜索',
  menu: '菜单',
  writeMemo: '写笔记',
  draft: '草稿',
  send: '发送',
  collapse: '收起',
  pleaseInput: '请输入笔记内容',
  memoSaved: '笔记已保存',
  memoPublished: '笔记发布成功',
  aiInsight: 'AI 洞察',
  dailyReview: '每日回顾',
  randomWalk: '随机漫步',
  viewStats: '查看记录统计',
  emptyMemos: '还没有笔记',
  searchPlaceholder: '搜索笔记',
  noMatch: '没有匹配的笔记',
  notOpen: '该功能暂未开放',
} as const;

export type StringKey = keyof typeof strings;

/** 豆瓣中文基线。导航 / Tab / 主按钮 / 空态走这里。 */
export const strings = {
  appName: '豆瓣',
  back: '返回',
  search: '搜索',
  cancel: '取消',
  confirm: '确定',
  tabHome: '首页',
  tabBookMovie: '书影音',
  tabGroup: '小组',
  tabMarket: '市集',
  tabMe: '我',
  want: '想看',
  watched: '看过',
  watching: '在看',
  mark: '标记',
  like: '点赞',
  noResult: '未找到相关内容',
  tryOtherKeyword: '换个关键词试试',
  notOpen: '该功能暂未开放',
  movie: '电影',
  noRating: '暂无评分',
} as const;

export type StringKey = keyof typeof strings;

/**
 * 网易云音乐配色 —— 取自 docs/wangyiyun-replication/design-tokens.md
 * 主红 #E84849(队列高亮/tab选中/播放全部/红心),识曲红 #FB1B42,页底 #F2F6F9。
 */
export const WY = {
  primary: '#E84849',
  primaryDeep: '#DD3A3A',
  recognizeRed: '#FB1B42',
  pageBg: '#F2F6F9',
  cardBg: '#FFFFFF',
  textPrimary: '#1A1A1A',
  textSecondary: '#8A8A8F',
  textTertiary: '#B0B0B5',
  divider: '#EFEFF1',
  dailyFrom: '#FCA17D',
  dailyTo: '#F5E5DE',
  vipGold: '#D8B06E',
  noteBg: '#101014',
  noteCard: '#1C1C22',
  playerBgFrom: '#5B4632',
  playerBgTo: '#2A2018',
} as const;

export const recognizeRed = WY.recognizeRed;

/** 播放页沉浸背景:按歌曲 seed 派生一组深色渐变(运行时应取自封面,mock 用 seed) */
export function playerGradient(seed: string): { from: string; to: string } {
  let h = 5;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) % 360;
  const from = `hsl(${h}, 28%, 26%)`;
  const to = `hsl(${(h + 18) % 360}, 30%, 12%)`;
  return { from, to };
}

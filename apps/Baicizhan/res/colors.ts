/** 色值取自真机截图区域众数采样,见 docs/baicizhan-replication/design-tokens.md */
export const colors = {
  primary: '#2F58E8',
  primaryDeep: '#1F50E7',
  primarySoft: '#8FB1E4',

  // 学习流(浅蓝底是最强品类特征)
  studyBg: '#D8E8F8',
  studyCard: '#E6F0FB',
  correctBg: '#88D0B2',
  wrongBg: '#E4B4C0',
  wrongText: '#7C0009',
  spellWrong: '#FE1225',
  settleBg: '#C7D8EF',

  // 首页
  homeBgTop: '#D8E8FA',
  homeBg: '#F5F7FB',

  ink: '#212121',
  inkSub: '#9AA5B1',
  inkFaint: '#C9CDD3',
  line: '#EEEEEE',
  white: '#FFFFFF',

  // 模块色(一屏一色)
  mallBg: '#F8EBCF',
  mallBuy: '#FF5320',
  mallPrice: '#F12F2F',
  coinGold: '#F5A623',
  coinChip: '#FFDAA8',
  taskBg: '#C9DFF8',
  rankDark: '#18263A',
  mapGrass: '#98C88B',
  readTeal: '#50B0A8',
  readVip: '#EFD8AE',
  memberGold: '#E8D6B1',
} as const;

export type ColorKey = keyof typeof colors;

/** 跟随 OS 深色模式覆盖需要反转的组件色。 */
export const colorsDark: { [K in keyof typeof colors]?: string } = {
  primary: '#7293FF',
  primaryDeep: '#5E80F2',
  primarySoft: '#6684B6',
  studyBg: '#162231',
  studyCard: '#202D3D',
  correctBg: '#356B5A',
  wrongBg: '#633F4A',
  wrongText: '#FFB9C0',
  settleBg: '#27374C',
  homeBgTop: '#192638',
  homeBg: '#10131A',
  ink: '#F2F5FA',
  inkSub: '#A7B1C0',
  inkFaint: '#6F7887',
  line: '#303744',
  white: '#1B202A',
  mallBg: '#2C261B',
  taskBg: '#1E3045',
  rankDark: '#101722',
  readTeal: '#397F7A',
  readVip: '#594F3D',
  memberGold: '#665D49',
};

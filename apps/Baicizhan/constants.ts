/**
 * 存档数据版本。改 data/defaults.json 的**结构或种子内容**时必须 +1,
 * 否则装过旧版的浏览器 localStorage 会一直喂回旧值(state.ts afterHydration 钩子据此重置)。
 */
export const DATA_VERSION = 7;

/** 每组词数(真机 8324:每组10词) */
export const WORDS_PER_GROUP = 10;

/** 连对里程碑:每 N 连对掉一次奖励(单词保护+1 / 铜板+10),对齐 R3 的 10/12 连对 */
export const COMBO_MILESTONE = 10;
export const COMBO_COIN_REWARD = 10;

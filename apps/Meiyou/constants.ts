/**
 * OS 宿主约束 —— 来源:os/data/simulatorConfig.ts
 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

/**
 * DATA_VERSION —— 每次修改 defaults.json 必须递增。
 */
export const DATA_VERSION = 2;

/** 底部四格(qa:Q1=B 去掉返现tab) */
export const TABS = [
  { id: 'home', route: '/', label: 'navHome' },
  { id: 'record', route: '/record', label: 'navRecord' },
  { id: 'message', route: '/message', label: 'navMessage' },
  { id: 'me', route: '/me', label: 'navMe' },
] as const;

/** 记录项弹层类型(record.entrySheet uiStates) */
export const SHEET_KINDS = [
  'flow', 'color', 'pain', 'poop', 'weight', 'love', 'symptom', 'leukorrhea', 'temperature',
] as const;
export type SheetKind = (typeof SHEET_KINDS)[number];

export const FLOW_OPTIONS = ['非常少量', '少量', '中量', '大量', '非常大量'] as const;
export const COLOR_OPTIONS = ['浅红色', '鲜红色', '深红色', '褐色', '黑色'] as const;
export const PAIN_OPTIONS = ['完全不痛', '轻微痛', '比较痛', '非常痛', '痛到极致'] as const;
export const POOP_OPTIONS = ['舒畅', '有残便感', '排便困难'] as const;
export const LEUKORRHEA_OPTIONS = ['干燥', '粘稠', '稀糊状', '水状', '蛋清状'] as const;
export const MOOD_OPTIONS = ['好伤心', '不开心', '一般', '开心', '超开心'] as const;
export const LOVE_OPTIONS = [
  '无措施', '避孕套', '体外排精', '未射精', '紧急避孕药', '短效避孕药', '长效避孕药', '节育环', '其他措施', '自慰',
] as const;
export const SYMPTOM_BODY = [
  '没有症状', '腰酸', '腹痛', '小腹坠胀', '乳房胀痛', '身体酸痛', '头痛', '眩晕',
  '失眠', '粉刺', '皮肤干燥', '食欲不振', '食欲旺盛', '腹泻', '便秘', '疲惫',
] as const;
export const SYMPTOM_DISCHARGE = ['褐色分泌物', '出血', '有血块', '白带增多'] as const;

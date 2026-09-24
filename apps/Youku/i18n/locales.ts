/**
 * @deprecated 文案已迁至 res/strings.ts + res/strings.en.ts。
 * 保留本文件仅作历史对照;运行时请走 useI18n / useAppStrings。
 */
export type AppLocale = 'zh' | 'en';

export { strings as messagesZh } from '../res/strings';
export { stringsEn as messagesEn } from '../res/strings.en';

/** 兼容旧 import { messages } 的空壳(勿再扩展) */
export const messages: Record<AppLocale, Record<string, string>> = { zh: {}, en: {} };

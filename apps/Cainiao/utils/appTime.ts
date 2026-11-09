import * as TimeService from '../../../os/TimeService';

/**
 * 种子时间映射:defaults.json 里用 { dayOffset, hm } 相对描述,
 * 初始化时映射到模拟时钟的「今天」附近,保证首页/消息/列表的相对日期永远自洽。
 */
export function seedTs(dayOffset: number, hm: string): number {
  const now = TimeService.getDate();
  const [h, m] = hm.split(':').map((x) => parseInt(x, 10));
  const d = TimeService.fromLocalParts(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  const raw = d.getTime() + dayOffset * 86400000;
  // 禁止种子时间跑到「现在」之后(阶段⑥:下单时间显示未来时刻)
  return Math.min(raw, TimeService.now());
}

/** 近日签收窗口:最近 14 天内已签收 */
export const RECENT_SIGNED_MS = 14 * 86400000;

export function isRecentSigned(statusTs: number): boolean {
  return statusTs >= TimeService.now() - RECENT_SIGNED_MS;
}

export function fmtMonthDay(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function fmtHm(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function fmtFull(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function fmtMdHm(ts: number): string {
  return `${fmtMonthDay(ts)} ${fmtHm(ts)}`;
}

/** 明天的月/日文案,如 7月18日 */
export function tomorrowLabel(): string {
  const d = TimeService.fromTimestamp(TimeService.now() + 86400000);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

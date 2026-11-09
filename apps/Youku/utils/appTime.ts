import * as TimeService from '../../../os/TimeService';

/**
 * 种子时间映射:defaults.json 里用 { dayOffset, hm } 相对描述,
 * state.ts 初始化时映射到模拟时钟的「今天」附近,保证历史/消息/通知的相对日期永远自洽。
 * 全 App 禁止 Date.now()/new Date(),统一走本文件 + TimeService。
 */
export type SeedAt = { dayOffset: number; hm: string };

export function seedTs(dayOffset: number, hm: string): number {
  const now = TimeService.getDate();
  const [h, m] = hm.split(':').map((x) => parseInt(x, 10));
  const d = TimeService.fromLocalParts(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
  let ts = d.getTime() + dayOffset * 86400000;
  // 种子落在「今天尚未到达的钟点」时回退一天,避免消息/历史出现未来时间
  if (ts > TimeService.now()) ts -= 86400000;
  return ts;
}

export const fromSeedAt = (at: SeedAt): number => seedTs(at.dayOffset, at.hm);

export function fmtMonthDay(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getMonth() + 1)}月${p(d.getDate())}日`;
}

export function fmtHm(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 2026/6/23 风格(消息中心列表日期) */
export function fmtSlashDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/** 07月17日 22:32 风格(通知时间分组) */
export function fmtMdHm(ts: number): string {
  return `${fmtMonthDay(ts)} ${fmtHm(ts)}`;
}

/** 历史/通知分组:今天 / 昨天 / MM月DD日 */
export function dayGroupLabel(ts: number): string {
  const now = TimeService.getDate();
  const today0 = TimeService.fromLocalParts(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
  if (ts >= today0) return '今天';
  if (ts >= today0 - 86400000) return '昨天';
  return fmtMonthDay(ts);
}

/** 消息中心列表侧时间:今天只显时分,非今天显月日(与详情胶囊日期一致) */
export function fmtConvListTime(ts: number): string {
  const now = TimeService.getDate();
  const today0 = TimeService.fromLocalParts(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
  if (ts >= today0) return fmtHm(ts);
  return fmtMonthDay(ts);
}

/** 秒 → mm:ss 或 h:mm:ss(播放器时间) */
export function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const p = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${p(h)}:${p(m)}:${p(s % 60)}`;
  return `${p(m)}:${p(s % 60)}`;
}

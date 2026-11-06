import * as TimeService from '../../../os/TimeService';

export const DAY_MS = 86400000;

/** 种子叙事锚日(截图当天 2026-07-06);defaults 绝对时间戳相对此日有 dayOffset */
export const SEED_ANCHOR_MS = TimeService.fromLocalParts(2026, 6, 6).getTime();

/** 模拟系统「今天」00:00(每次调用取最新,与锁机/系统时钟一致) */
export function getAppTodayMs(): number {
  const t = TimeService.getDate();
  return TimeService.fromLocalParts(t.getFullYear(), t.getMonth(), t.getDate()).getTime();
}

/** @deprecated 兼容旧引用;请优先用 getAppTodayMs() */
export const APP_TODAY_MS = getAppTodayMs();

/** 今天的日号(月历高亮/默认选中) */
export function appTodayDay(): number {
  return TimeService.fromTimestamp(getAppTodayMs()).getDate();
}
/** 今天的月份(0-11)与年份 */
export function appTodayMonth(): number {
  return TimeService.fromTimestamp(getAppTodayMs()).getMonth();
}
export function appTodayYear(): number {
  return TimeService.fromTimestamp(getAppTodayMs()).getFullYear();
}

/** 新建记录时间戳 = 模拟此刻 */
export function narrativeNow(): number {
  return TimeService.now();
}

/** 某日 00:00 的本地毫秒 */
export function dayStartMs(ts: number): number {
  const d = TimeService.fromTimestamp(ts);
  return TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * 把种子时间戳按相对 SEED_ANCHOR 的日偏移搬到「今天」附近,保留时:分:秒。
 * todayMs 可传入以便测试/强制对齐。
 */
export function remapSeedTs(ts: number, todayMs: number = getAppTodayMs()): number {
  const d = TimeService.fromTimestamp(ts);
  const seedDay = TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayOffset = Math.round((seedDay - SEED_ANCHOR_MS) / DAY_MS);
  const todMs = ((d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds()) * 1000 + d.getMilliseconds();
  return todayMs + dayOffset * DAY_MS + todMs;
}

/** @deprecated 旧单日种子用;新种子请用 remapSeedTs */
export function toToday(ts: number): number {
  return remapSeedTs(ts);
}

/** YYYY-MM-DD key,用于跨日比较 */
export function dayKey(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

export function sameDay(a: number, b: number): boolean {
  return dayKey(a) === dayKey(b);
}

/** 含 anchor 的自然周(周一~周日)起止 00:00 */
export function weekRangeContaining(anchorMs: number): { start: number; end: number } {
  const d = TimeService.fromTimestamp(dayStartMs(anchorMs));
  const dow = d.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const start = dayStartMs(anchorMs) + mondayOffset * DAY_MS;
  return { start, end: start + 6 * DAY_MS };
}

/** 含 anchor 的自然月起止 */
export function monthRangeContaining(anchorMs: number): { start: number; end: number } {
  const d = TimeService.fromTimestamp(anchorMs);
  const start = TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), 1).getTime();
  const end = TimeService.fromLocalParts(d.getFullYear(), d.getMonth() + 1, 0).getTime();
  return { start, end };
}

const p2 = (n: number) => String(n).padStart(2, '0');
/** 格式化为「2026年07月07日」 */
export function formatCnDate(ms: number): string {
  const d = TimeService.fromTimestamp(ms);
  return `${d.getFullYear()}年${p2(d.getMonth() + 1)}月${p2(d.getDate())}日`;
}
/** 格式化为「2026-07-07」 */
export function formatDashDate(ms: number): string {
  const d = TimeService.fromTimestamp(ms);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

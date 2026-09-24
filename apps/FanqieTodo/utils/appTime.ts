import * as TimeService from '../../../os/TimeService';

/**
 * 「今天」= 模拟系统当天(与锁机页/系统时钟一致,不再硬编码某一天)。
 * 在模块加载时锚定一次(会话足够短);月历「今」、打卡卡日期、统计当日、
 * 以及种子/新建专注记录的归属日都以此为准,保证全 App 日期自洽。
 */
const _t = TimeService.getDate();
export const APP_TODAY_MS = TimeService.fromLocalParts(_t.getFullYear(), _t.getMonth(), _t.getDate()).getTime();

/** 今天的日号(月历高亮/默认选中) */
export function appTodayDay(): number {
  return TimeService.fromTimestamp(APP_TODAY_MS).getDate();
}
/** 今天的月份(0-11)与年份 */
export function appTodayMonth(): number {
  return TimeService.fromTimestamp(APP_TODAY_MS).getMonth();
}
export function appTodayYear(): number {
  return TimeService.fromTimestamp(APP_TODAY_MS).getFullYear();
}

/** 新建记录时间戳 = 模拟此刻(即今天) */
export function narrativeNow(): number {
  return TimeService.now();
}

/** 把一个种子时间戳「搬到今天」,保留其时:分:秒,只改日期 */
export function toToday(ts: number): number {
  const d = TimeService.fromTimestamp(ts);
  const todMs = ((d.getHours() * 60 + d.getMinutes()) * 60 + d.getSeconds()) * 1000 + d.getMilliseconds();
  return APP_TODAY_MS + todMs;
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

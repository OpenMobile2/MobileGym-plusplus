import * as TimeService from '@/os/TimeService';

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** flomo 笔记卡时间戳:同年 MM-DD HH:mm,跨年带年份。 */
export function memoTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const now = TimeService.fromTimestamp(TimeService.now());
  const ymd = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.getFullYear() === now.getFullYear()) {
    return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${hm}`;
  }
  return `${ymd} ${hm}`;
}

/** 全量日期时间(详情页)。 */
export function fullTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** 日期键 'YYYY-MM-DD'(热力图/日期筛选用)。 */
export function dayKey(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 按日历加减天,避免用 86400000ms 跨 DST 撞上同一天 key。 */
export function shiftDay(ts: number, delta: number): number {
  const d = TimeService.fromTimestamp(ts);
  d.setDate(d.getDate() + delta);
  return d.getTime();
}

/** 'YYYY-MM-DD' -> 'YYYY/MM/DD'。 */
export function dayLabel(dateStr: string): string {
  return dateStr.replace(/-/g, '/');
}

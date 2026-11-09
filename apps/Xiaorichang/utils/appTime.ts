// 时间工具。铁律:禁止 Date.now() / new Date(...),一律走 TimeService(AGENTS.md + eslint 强制)。
import * as TimeService from '../../../os/TimeService';

const DAY_MS = 86400000;

/** 'YYYY-MM-DD' */
export function toDateKey(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(TimeService.getDate());
}

/** dayOffset=0 表示今天,-1 表示昨天 */
export function dateKeyAt(dayOffset: number): string {
  return toDateKey(TimeService.fromTimestamp(TimeService.now() + dayOffset * DAY_MS));
}

/** 把种子数据的 (dayOffset, minuteOfDay) 物化成时间戳 */
export function tsAt(dayOffset: number, minuteOfDay = 0): number {
  const d = TimeService.fromTimestamp(TimeService.now() + dayOffset * DAY_MS);
  return TimeService.fromLocalParts(
    d.getFullYear(), d.getMonth(), d.getDate(),
    Math.floor(minuteOfDay / 60), minuteOfDay % 60,
  ).getTime();
}

/** 该自然月的天数 —— 达成率的分母(s231→s233 定式) */
export function daysInMonth(year: number, monthIndex: number): number {
  return TimeService.fromLocalParts(year, monthIndex + 1, 0).getDate();
}

/** 周几,1=周一 … 7=周日(与 Recurrence.weekdays 对齐) */
export function isoWeekday(d: Date): number {
  const w = d.getDay();
  return w === 0 ? 7 : w;
}

import * as TimeService from '@/os/TimeService';
import { getLocale } from '@/os/locale';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];
const WEEK_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 金额:两位小数 + 千分位,不带符号 */
export function money(n: number): string {
  const v = Math.abs(n);
  return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** 'YYYY-MM-DD' */
export function dateKey(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function monthKey(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function fmtMonthLabel(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return getLocale() === 'en'
    ? `${MONTH_EN[d.getMonth()]} ${d.getFullYear()}`
    : `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

/** Localized day label with month, date, and weekday (CJK form for zh, "Jun 12 (Fri)" form for en) */
export function fmtDayLabel(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  if (getLocale() === 'en') {
    return `${MONTH_EN[d.getMonth()]} ${d.getDate()} (${WEEK_EN[d.getDay()]})`;
  }
  return `${d.getMonth() + 1}月${d.getDate()}日(周${WEEK[d.getDay()]})`;
}

/** '2026.06.01 22:33' */
export function fmtDateTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** 'HH:mm' */
export function fmtTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function isSameDay(a: number, b: number): boolean {
  return dateKey(a) === dateKey(b);
}

export function todayTs(): number {
  return TimeService.now();
}

import * as TimeService from '@/os/TimeService';

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

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

/** '6月12日(周五)' */
export function fmtDayLabel(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
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

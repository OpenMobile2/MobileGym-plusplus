import * as TimeService from '../../../os/TimeService';
import type { DMEvent } from '../types';
import type { AppLocale } from '../types';
import { createT } from '../i18n';

export const DAY = 86_400_000;

export interface DayInfo {
  diff: number;
  count: number;
  state: 'future' | 'today' | 'past';
}

export function todayMidnight(): number {
  return Math.floor(TimeService.now() / DAY) * DAY;
}

export function toMidnight(ms: number): number {
  return Math.floor(ms / DAY) * DAY;
}

export function dayInfo(ev: DMEvent): DayInfo {
  const diff = Math.round((toMidnight(ev.targetDate) - todayMidnight()) / DAY);
  if (diff > 0) return { diff, count: diff, state: 'future' };
  if (diff === 0) return { diff, count: 0, state: 'today' };
  return { diff, count: Math.abs(diff) + (ev.plusOne ? 1 : 0), state: 'past' };
}

export function phrase(info: DayInfo, locale: AppLocale = 'zh'): string {
  const t = createT(locale);
  if (info.state === 'today') return t('day.phraseToday');
  return info.state === 'future' ? t('day.phraseFuture') : t('day.phrasePast');
}

export function ymd(ev: DMEvent, locale: AppLocale = 'zh'): string {
  const t = createT(locale);
  const target = TimeService.fromTimestamp(toMidnight(ev.targetDate));
  const today = TimeService.fromTimestamp(todayMidnight());
  let a = today;
  let b = target;
  if (b.getTime() < a.getTime()) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  let years = b.getUTCFullYear() - a.getUTCFullYear();
  let months = b.getUTCMonth() - a.getUTCMonth();
  let days = b.getUTCDate() - a.getUTCDate();
  if (days < 0) {
    months -= 1;
    days += daysInMonth(b.getUTCFullYear(), b.getUTCMonth() - 1);
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  const parts: string[] = [];
  if (years > 0) parts.push(`${years}${t('day.year')}`);
  if (months > 0) parts.push(`${months}${t('day.month')}`);
  parts.push(`${days}${t('day.day')}`);
  return parts.join(locale === 'en' ? ' ' : '');
}

function daysInMonth(year: number, monthZeroBased: number): number {
  let y = year;
  let m = monthZeroBased;
  if (m < 0) {
    m += 12;
    y -= 1;
  }
  return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m];
}

function isLeap(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function dateLabel(ms: number, calendar: 'solar' | 'lunar' = 'solar', locale: AppLocale = 'zh'): string {
  const t = createT(locale);
  const d = TimeService.fromTimestamp(toMidnight(ms));
  const weekdays = t('day.weekdays').split(',');
  const wd = weekdays[d.getUTCDay()] ?? '';
  const base =
    locale === 'en'
      ? `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${wd}`
      : `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日 ${wd}`;
  return calendar === 'lunar' ? `${t('day.lunarPrefix')}${base}` : base;
}

export function shortDate(ms: number): string {
  const d = TimeService.fromTimestamp(toMidnight(ms));
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())}`;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function parts(ms: number): { y: number; m: number; d: number } {
  const dt = TimeService.fromTimestamp(toMidnight(ms));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

export function fromParts(y: number, m: number, d: number): number {
  return Date.UTC(y, m - 1, d);
}

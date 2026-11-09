/**
 * 邮件时间显示 —— 复刻 iOS 邮件列表那套相对时间规则（对照 mail_images/IMG_2168）：
 *   今天    → 13:24
 *   昨天    → Yesterday / 昨天
 *   本周内  → Tuesday / 星期二
 *   今年内  → 7/16
 *   更早    → 2026/7/16
 *
 * 全部走 TimeService，以便跟模拟时钟对齐（ESLint 禁止裸用 Date）。
 */
import * as TimeService from '../../../os/TimeService';
import type { strings } from '../res/strings';

type Strings = typeof strings;

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function dayIndex(d: Date): number {
  return Math.floor(TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);
}

function hhmm(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** 邮件列表行右侧的时间 */
export function formatListTime(timestamp: number, s: Strings): string {
  const date = TimeService.fromTimestamp(timestamp);
  const today = TimeService.getDate();

  if (isSameDay(date, today)) return hhmm(date);

  const diffDays = dayIndex(today) - dayIndex(date);
  if (diffDays === 1) return s.time_yesterday;
  if (diffDays < 7) return TimeService.formatDateTimeForLocale(date, { weekday: 'long' });
  if (date.getFullYear() === today.getFullYear()) return `${date.getMonth() + 1}/${date.getDate()}`;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
}

/** 详情页头部展开后那行完整时间：Today at 16:55 / 2026/7/16 at 09:20 */
export function formatDetailTime(timestamp: number, s: Strings): string {
  const date = TimeService.fromTimestamp(timestamp);
  const today = TimeService.getDate();
  const time = hhmm(date);

  if (isSameDay(date, today)) return `${s.time_today} ${time}`;
  const diffDays = dayIndex(today) - dayIndex(date);
  if (diffDays === 1) return `${s.time_yesterday} ${time}`;
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${time}`;
}

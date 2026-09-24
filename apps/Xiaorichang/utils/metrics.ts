// 派生指标。⚠ 今日页的 N/M 与习惯详情的「本月达成率」是**两套完全独立的计量**,
// 不要用同一个函数算 —— 这是 v0.5.0 审核订正出来的错误之一。
import type { CheckinLog, Habit, Recurrence } from '../types';
import * as TimeService from '../../../os/TimeService';
import { daysInMonth, isoWeekday, toDateKey } from './appTime';

const DAY_MS = 86400000;

/** 该习惯在某天是否被安排 */
export function isScheduled(r: Recurrence, d: Date): boolean {
  switch (r.kind) {
    case 'daily':
      return true;
    case 'weekly':
      return r.weekdays.includes(isoWeekday(d));
    case 'weeklyCount':
      return true;
    case 'monthly':
      return r.days.includes(d.getDate());
    case 'monthlyCount':
      return true;
    case 'interval':
      return true; // 起算日相关,由调用方按 createdAt 计算;此处不臆造
    default:
      return false;
  }
}

export function scheduledHabits(habits: Habit[], d: Date, logs: CheckinLog[] = []): Habit[] {
  const dateKey = toDateKey(d);
  return habits.filter((h) => {
    if (h.archived || !isScheduled(h.recurrence, d)) return false;
    const recurrence = h.recurrence;
    if (recurrence.kind !== 'weeklyCount' && recurrence.kind !== 'monthlyCount') return true;

    const hasLogToday = logs.some((l) => l.habitId === h.id && l.date === dateKey);
    if (hasLogToday) return true;

    let fromKey: string;
    if (recurrence.kind === 'weeklyCount') {
      const weekStart = TimeService.fromTimestamp(d.getTime() - (isoWeekday(d) - 1) * DAY_MS);
      fromKey = toDateKey(weekStart);
    } else {
      fromKey = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-01`;
    }
    const completed = new Set(logs
      .filter((l) => l.habitId === h.id && l.status === 'done' && l.date >= fromKey && l.date <= dateKey)
      .map((l) => l.date)).size;
    return completed < recurrence.count;
  });
}

/**
 * 今日页光芒条 `N / M`。
 * M = 今日已安排的所有习惯的 reward 之和(Q1=A;IMG_8216 的 80/70 独立印证:
 *     归档一个习惯后分母立刻从 80 掉到 70)。
 * N = 今日已完成习惯的 reward 之和(失败/待定均不计入 N)。
 */
export function todayProgress(habits: Habit[], logs: CheckinLog[], d: Date): { earned: number; total: number } {
  const sched = scheduledHabits(habits, d, logs);
  const key = toDateKey(d);
  const total = sched.reduce((a, h) => a + h.reward, 0);
  const earned = sched.reduce((a, h) => {
    const log = logs.find((l) => l.habitId === h.id && l.date === key);
    return a + (log?.status === 'done' ? h.reward : 0);
  }, 0);
  return { earned, total };
}

/**
 * 习惯详情「本月统计」。
 * 达成率 = 本月完成天数 ÷ **当月自然日天数**(不是已安排天数)。
 * 定式来源:s231→s233 —— 4/31 = 12.9%,5/31 = 16.1%,两点唯一确定分母。
 */
export function monthStats(
  logs: CheckinLog[], habitId: string, year: number, monthIndex: number,
): { doneDays: number; failedDays: number; glow: number; quantity: number; rate: number } {
  const prefix = `${year}-${`${monthIndex + 1}`.padStart(2, '0')}-`;
  const mine = logs.filter((l) => l.habitId === habitId && l.date.startsWith(prefix));
  const doneDays = mine.filter((l) => l.status === 'done').length;
  const failedDays = mine.filter((l) => l.status === 'failed').length;
  const quantity = mine.reduce((a, l) => a + (l.quantity ?? 0), 0);
  return {
    doneDays,
    failedDays,
    glow: 0, // 由调用方乘以 habit.reward —— reward 不在 log 上,避免此处误算
    quantity,
    rate: doneDays / daysInMonth(year, monthIndex),
  };
}

/** 习惯详情顶部「总完成 Nd」= 累计完成天数,只增不减(Q2=B) */
export function totalDoneDays(logs: CheckinLog[], habitId: string): number {
  return logs.filter((l) => l.habitId === habitId && l.status === 'done').length;
}

/** 习惯详情顶部「专注 Xm」。⚠ 只由专注记录驱动,与打卡状态无关(Q8 裁定)。 */
export function totalFocusMinutes(records: { habitId?: string; minutes: number }[], habitId: string): number {
  return records.filter((r) => r.habitId === habitId).reduce((a, r) => a + r.minutes, 0);
}

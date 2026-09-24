import type { KapiBill } from '../types';
import { monthKey, dateKey } from './format';
import * as TimeService from '@/os/TimeService';

/** 纯函数派生(在组件内用 useMemo 调用,勿放进 store selector 以免无限重渲染) */

export type StatsPeriod = 'week' | 'month' | 'year' | 'custom';
export interface PeriodRange { start: number; end: number; label: string }

const DAY_MS = 86400000;

/**
 * 按周期 + 偏移量算出统计时间窗 [start, end) 与展示标签。
 * week=周一→周日;month=自然月;year=自然年;custom=用户选定区间(含结束日)。
 * offset:0=当前期,-1=上一期,+1=下一期(custom 忽略 offset)。
 */
export function periodRange(
  period: StatsPeriod,
  now: number,
  offset: number,
  custom?: { start: number; end: number } | null,
): PeriodRange {
  const d = TimeService.fromTimestamp(now);
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();

  if (period === 'year') {
    const yr = y + offset;
    return {
      start: TimeService.fromLocalParts(yr, 0, 1).getTime(),
      end: TimeService.fromLocalParts(yr + 1, 0, 1).getTime(),
      label: `${yr}年`,
    };
  }

  if (period === 'week') {
    const dow = (d.getDay() + 6) % 7; // 0=周一
    const start = TimeService.fromLocalParts(y, m, day - dow + offset * 7).getTime();
    const end = TimeService.fromLocalParts(y, m, day - dow + offset * 7 + 7).getTime();
    const s = TimeService.fromTimestamp(start);
    const e = TimeService.fromTimestamp(end - DAY_MS);
    return { start, end, label: `${s.getMonth() + 1}/${s.getDate()} - ${e.getMonth() + 1}/${e.getDate()}` };
  }

  if (period === 'custom') {
    if (!custom) return { start: 0, end: 0, label: '选择起止日期' };
    const e = TimeService.fromTimestamp(custom.end);
    const end = TimeService.fromLocalParts(e.getFullYear(), e.getMonth(), e.getDate() + 1).getTime();
    const s = TimeService.fromTimestamp(custom.start);
    return {
      start: custom.start,
      end,
      label: `${s.getFullYear()}/${s.getMonth() + 1}/${s.getDate()} - ${e.getFullYear()}/${e.getMonth() + 1}/${e.getDate()}`,
    };
  }

  // month
  const start = TimeService.fromLocalParts(y, m + offset, 1).getTime();
  const end = TimeService.fromLocalParts(y, m + offset + 1, 1).getTime();
  const s = TimeService.fromTimestamp(start);
  return { start, end, label: `${s.getMonth() + 1}/${s.getFullYear()}` };
}

/** 取某账本在时间窗 [r.start, r.end) 内的账单 */
export function rangeBills(bills: KapiBill[], ledgerId: string, r: PeriodRange): KapiBill[] {
  if (r.end <= r.start) return [];
  return bills.filter((b) => b.ledgerId === ledgerId && b.date >= r.start && b.date < r.end);
}

export function ledgerBills(bills: KapiBill[], ledgerId: string): KapiBill[] {
  return bills.filter((b) => b.ledgerId === ledgerId);
}

export function monthBills(bills: KapiBill[], ledgerId: string, ts: number): KapiBill[] {
  const mk = monthKey(ts);
  return bills.filter((b) => b.ledgerId === ledgerId && monthKey(b.date) === mk);
}

export function sumByType(bills: KapiBill[], type: 'expense' | 'income'): number {
  return Math.round(bills.filter((b) => b.type === type && !b.excludeFlow).reduce((a, b) => a + b.amount, 0) * 100) / 100;
}

/** 按分类聚合支出 [{id,name,icon,color,amount,pct}] 降序 */
export function expenseByCategory(bills: KapiBill[]) {
  const map = new Map<string, { id: string; name: string; icon: string; color: string; amount: number }>();
  for (const b of bills) {
    if (b.type !== 'expense' || b.excludeFlow) continue;
    const cur = map.get(b.categoryId) ?? { id: b.categoryId, name: b.categoryName, icon: b.icon, color: b.color, amount: 0 };
    cur.amount = Math.round((cur.amount + b.amount) * 100) / 100;
    map.set(b.categoryId, cur);
  }
  const list = [...map.values()].sort((a, b) => b.amount - a.amount);
  const total = list.reduce((a, c) => a + c.amount, 0) || 1;
  return list.map((c) => ({ ...c, pct: Math.round((c.amount / total) * 1000) / 10 }));
}

/** 按日分组(降序日期) */
export function groupByDay(bills: KapiBill[]) {
  const map = new Map<string, KapiBill[]>();
  for (const b of [...bills].sort((a, b) => b.date - a.date)) {
    const k = dateKey(b.date);
    const arr = map.get(k) ?? [];
    arr.push(b);
    map.set(k, arr);
  }
  return [...map.entries()].map(([key, items]) => ({
    key,
    ts: items[0].date,
    items,
    expense: sumByType(items, 'expense'),
    income: sumByType(items, 'income'),
  }));
}

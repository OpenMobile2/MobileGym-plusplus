/**
 * 周期计算纯函数(经期/预测/易孕期/排卵日/怀孕几率)。
 * 日期一律 'YYYY-MM-DD' 本地日字符串;“今天”由调用方传入(源自 TimeService)。
 */
import * as TimeService from '@/os/TimeService';
import type { CycleConfig, PeriodSpan } from '../types';

export const DAY_MS = 86400000;

export function fmtDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseDate(s: string): number {
  const [y, m, d] = s.split('-').map(Number);
  return TimeService.fromLocalParts(y, m - 1, d).getTime();
}

export function addDays(s: string, n: number): string {
  return fmtDate(parseDate(s) + n * DAY_MS);
}

export function diffDays(a: string, b: string): number {
  return Math.round((parseDate(a) - parseDate(b)) / DAY_MS);
}

export type DayKind = 'period' | 'predict' | 'fertile' | 'ovulation' | 'none';

export interface DayInfo {
  kind: DayKind;
  /** 经期第几天(1-based),仅 kind=period */
  periodDay?: number;
}

/** 当前(最近一段)经期;可能进行中(end=null) */
export function currentPeriod(periods: PeriodSpan[]): PeriodSpan | undefined {
  return [...periods].sort((a, b) => (a.start < b.start ? 1 : -1))[0];
}

/** 进行中经期的实际结束日(end 或按 periodLen 推) */
function spanEnd(p: PeriodSpan, cfg: CycleConfig): string {
  return p.end ?? addDays(p.start, cfg.periodLen - 1);
}

/** 下次经期预测开始日 = 最近经期开始 + cycleLen */
export function nextPeriodStart(periods: PeriodSpan[], cfg: CycleConfig): string | null {
  const cur = currentPeriod(periods);
  if (!cur) return null;
  return addDays(cur.start, cfg.cycleLen);
}

/** 排卵日 = 下次经期开始 - 14;易孕期 = 排卵日前5天~后1天(不含排卵日本身单列) */
export function ovulationDay(periods: PeriodSpan[], cfg: CycleConfig): string | null {
  const nxt = nextPeriodStart(periods, cfg);
  return nxt ? addDays(nxt, -14) : null;
}

/** 某日的周期属性(供日历着色/首页大卡) */
export function dayInfo(date: string, periods: PeriodSpan[], cfg: CycleConfig): DayInfo {
  for (const p of periods) {
    const end = spanEnd(p, cfg);
    if (date >= p.start && date <= end) {
      return { kind: 'period', periodDay: diffDays(date, p.start) + 1 };
    }
  }
  if (!cfg.smartPredict) return { kind: 'none' };
  const cur = currentPeriod(periods);
  if (!cur) return { kind: 'none' };
  // 往后推 24 个周期做预测(年历需要)
  for (let i = 1; i <= 24; i++) {
    const ps = addDays(cur.start, cfg.cycleLen * i);
    const pe = addDays(ps, cfg.periodLen - 1);
    const ov = addDays(ps, -14);
    if (date >= ps && date <= pe) return { kind: 'predict' };
    if (date === ov) return { kind: 'ovulation' };
    const fs = addDays(ov, -5);
    const fe = addDays(ov, 4);
    if (date >= fs && date <= fe) return { kind: 'fertile' };
  }
  return { kind: 'none' };
}

/** 距下次经期开始还有几天 */
export function daysToNextPeriod(today: string, periods: PeriodSpan[], cfg: CycleConfig): number | null {
  const nxt = nextPeriodStart(periods, cfg);
  return nxt ? diffDays(nxt, today) : null;
}

/** 距本段经期预计结束还有几天(仅经期中) */
export function daysToPeriodEnd(today: string, periods: PeriodSpan[], cfg: CycleConfig): number | null {
  const cur = currentPeriod(periods);
  if (!cur) return null;
  const end = spanEnd(cur, cfg);
  if (today < cur.start || today > end) return null;
  return diffDays(end, today);
}

/** 怀孕几率(粗表,与真机观感一致:经期低、排卵期高) */
export function pregnancyProb(date: string, periods: PeriodSpan[], cfg: CycleConfig): number {
  const info = dayInfo(date, periods, cfg);
  if (info.kind === 'period') return 3.2;
  if (info.kind === 'ovulation') return 25.0;
  if (info.kind === 'fertile') return 18.5;
  const cur = currentPeriod(periods);
  if (!cur) return 3.2;
  const d = ((diffDays(date, cur.start) % cfg.cycleLen) + cfg.cycleLen) % cfg.cycleLen;
  if (d < cfg.periodLen + 3) return 3.2;
  if (d > cfg.cycleLen - 5) return 1.5;
  return 8.0;
}

/** 周期阶段名(今日密报环形图) */
export function phaseName(date: string, periods: PeriodSpan[], cfg: CycleConfig): '月经期' | '卵泡期' | '排卵期' | '黄体期' {
  const info = dayInfo(date, periods, cfg);
  if (info.kind === 'period' || info.kind === 'predict') return '月经期';
  if (info.kind === 'ovulation') return '排卵期';
  if (info.kind === 'fertile') return '排卵期';
  const cur = currentPeriod(periods);
  if (!cur) return '卵泡期';
  const d = ((diffDays(date, cur.start) % cfg.cycleLen) + cfg.cycleLen) % cfg.cycleLen;
  return d < cfg.cycleLen - 14 ? '卵泡期' : '黄体期';
}

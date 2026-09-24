import type { DayHours } from '../types';
import { nowMinutes, parseHm } from './appTime';

export type OpenStatus = 'open' | 'closed' | 'closingSoon';

/**
 * 根据 app 时钟与营业时段计算状态。
 * close < open 视为跨夜(如 11:00-02:00)。
 */
export function computeOpenStatus(hours: DayHours, soonMinutes = 60): OpenStatus {
  const now = nowMinutes();
  const open = parseHm(hours.open);
  const close = parseHm(hours.close);
  let inOpen: boolean;
  let minutesToClose: number;
  if (close > open) {
    inOpen = now >= open && now < close;
    minutesToClose = close - now;
  } else {
    // 跨夜: open..24h 或 0..close
    inOpen = now >= open || now < close;
    minutesToClose = now >= open ? 24 * 60 - now + close : close - now;
  }
  if (!inOpen) return 'closed';
  if (minutesToClose <= soonMinutes) return 'closingSoon';
  return 'open';
}

export function hoursLabel(hours: DayHours): string {
  const close = parseHm(hours.close);
  const open = parseHm(hours.open);
  if (close <= open) return `${hours.open} - 次日 ${hours.close}`;
  return `${hours.open} - ${hours.close}`;
}

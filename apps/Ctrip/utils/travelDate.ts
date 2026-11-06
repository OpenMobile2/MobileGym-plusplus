import * as TimeService from '@/os/TimeService';

export function startOfSystemDay(): Date {
  const now = TimeService.getDate();
  return TimeService.fromLocalParts(now.getFullYear(), now.getMonth(), now.getDate());
}

export function addSystemDays(days: number, base = startOfSystemDay()): Date {
  const result = TimeService.fromTimestamp(base.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

export function formatMonthDay(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function systemMonthDay(offsetDays = 0): string {
  return formatMonthDay(addSystemDays(offsetDays));
}

export function daysInMonth(date = startOfSystemDay()): number {
  return TimeService.fromLocalParts(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

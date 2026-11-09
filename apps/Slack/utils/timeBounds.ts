import * as TimeService from '../../../os/TimeService';

export function endOfToday(): number {
  const d = TimeService.getDate();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

export function startOfTomorrow(): number {
  const d = TimeService.getDate();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function startOfNextWeek(): number {
  const d = TimeService.getDate();
  const day = d.getDay();
  const days = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function endOfWeek(): number {
  const d = TimeService.getDate();
  const day = d.getDay();
  const days = day === 0 ? 0 : 7 - day;
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

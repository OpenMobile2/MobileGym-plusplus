import * as TimeService from '@/os/TimeService';
import type { CalendarEvent } from '../types';

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const CLOCK_TIME_RE = /^(\d{2}):(\d{2})$/;
const ISO_DATE_TIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?$/;

export interface CalendarBusyInterval {
  startTs: number;
  endTs: number;
}

export function parseCalendarDate(value: string): Date | null {
  const match = ISO_DATE_RE.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = TimeService.fromLocalParts(year, month - 1, day);
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function parseClockTime(value: string): { hour: number; minute: number } | null {
  const match = CLOCK_TIME_RE.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 23 || minute > 59) return null;
  return { hour, minute };
}

export function parseCalendarDateTime(value: string): number | null {
  if (!ISO_DATE_TIME_RE.test(value)) return null;
  const timestamp = TimeService.parseToTimestamp(value);
  return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
}

export function addLocalDays(date: Date, days: number): Date {
  const next = TimeService.fromTimestamp(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

export function formatLocalDate(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatLocalDateTime(timestamp: number): string {
  const date = TimeService.fromTimestamp(timestamp);
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const offsetHour = String(Math.floor(Math.abs(offsetMinutes) / 60)).padStart(2, '0');
  const offsetMinute = String(Math.abs(offsetMinutes) % 60).padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${minute}:${second}${sign}${offsetHour}:${offsetMinute}`;
}

export function eventOverlapsRange(event: CalendarEvent, startTs: number, endTs: number): boolean {
  return event.startTs < endTs && event.endTs > startTs;
}

export function findEventsInRange(
  events: readonly CalendarEvent[],
  startTs: number,
  endTs: number,
): CalendarEvent[] {
  return events
    .filter((event) => eventOverlapsRange(event, startTs, endTs))
    .sort((a, b) => a.startTs - b.startTs);
}

export function searchCalendarEvents(
  events: readonly CalendarEvent[],
  options: {
    query: string;
    rangeStartTs?: number;
    rangeEndTs?: number;
  },
): CalendarEvent[] {
  const query = options.query.trim().toLowerCase();
  if (!query) return [];
  return events
    .filter((event) => {
      const textMatches = event.title.toLowerCase().includes(query)
        || (event.description ?? '').toLowerCase().includes(query);
      if (!textMatches) return false;
      if (options.rangeStartTs !== undefined && event.endTs <= options.rangeStartTs) return false;
      if (options.rangeEndTs !== undefined && event.startTs >= options.rangeEndTs) return false;
      return true;
    })
    .sort((a, b) => b.startTs - a.startTs);
}

export function mergeBusyIntervals(
  events: readonly CalendarEvent[],
  rangeStartTs: number,
  rangeEndTs: number,
): CalendarBusyInterval[] {
  const intervals = findEventsInRange(events, rangeStartTs, rangeEndTs)
    .map((event) => ({
      startTs: Math.max(event.startTs, rangeStartTs),
      endTs: Math.min(event.endTs, rangeEndTs),
    }))
    .filter((interval) => interval.endTs > interval.startTs);

  const merged: CalendarBusyInterval[] = [];
  for (const interval of intervals) {
    const previous = merged[merged.length - 1];
    if (!previous || interval.startTs > previous.endTs) {
      merged.push({ ...interval });
      continue;
    }
    previous.endTs = Math.max(previous.endTs, interval.endTs);
  }
  return merged;
}

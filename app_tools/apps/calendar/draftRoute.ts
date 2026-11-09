import {
  addLocalDays,
  parseCalendarDate,
  parseClockTime,
} from '@/system/Calendar/domain/eventQueries';
import * as TimeService from '@/os/TimeService';

export interface CalendarToolDraft {
  title: string;
  description?: string;
  allDay: boolean;
  startTs: number;
  endTs: number;
}

export interface CalendarToolDraftInput {
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  allDay: boolean;
  description?: string;
}

export function resolveCalendarToolDraft(input: CalendarToolDraftInput): CalendarToolDraft | null {
  const date = parseCalendarDate(input.date);
  if (!date) return null;

  if (input.allDay) {
    return {
      title: input.title,
      description: input.description,
      allDay: true,
      startTs: date.getTime(),
      endTs: addLocalDays(date, 1).getTime(),
    };
  }

  if (!input.startTime || !input.endTime) return null;
  const start = parseClockTime(input.startTime);
  const end = parseClockTime(input.endTime);
  if (!start || !end) return null;
  const startDate = TimeService.fromTimestamp(date.getTime());
  const endDate = TimeService.fromTimestamp(date.getTime());
  startDate.setHours(start.hour, start.minute, 0, 0);
  endDate.setHours(end.hour, end.minute, 0, 0);
  if (endDate.getTime() <= startDate.getTime()) return null;
  return {
    title: input.title,
    description: input.description,
    allDay: false,
    startTs: startDate.getTime(),
    endTs: endDate.getTime(),
  };
}

export function buildCalendarDraftRoute(input: CalendarToolDraftInput): string {
  const params = new URLSearchParams({
    source: 'tool',
    title: input.title,
    date: input.date,
    allDay: input.allDay ? 'true' : 'false',
  });
  if (input.startTime) params.set('startTime', input.startTime);
  if (input.endTime) params.set('endTime', input.endTime);
  if (input.description) params.set('description', input.description);
  return `/new-event?${params.toString()}`;
}

export function parseCalendarDraftRoute(searchParams: URLSearchParams): CalendarToolDraft | null {
  if (searchParams.get('source') !== 'tool') return null;
  const title = searchParams.get('title')?.trim();
  const date = searchParams.get('date');
  if (!title || !date) return null;
  return resolveCalendarToolDraft({
    title,
    date,
    startTime: searchParams.get('startTime') ?? undefined,
    endTime: searchParams.get('endTime') ?? undefined,
    allDay: searchParams.get('allDay') === 'true',
    description: searchParams.get('description')?.trim() || undefined,
  });
}

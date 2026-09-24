import {
  assertAllowedKeys,
  optionalBoolean,
  optionalInteger,
  optionalString,
  requireString,
  ToolExecutionError,
} from '../../core/errors';
import { toolRegistry } from '../../core/registry';
import type { JsonObject, ToolHandler } from '../../core/types';
import { useCalendarStore } from '@/system/Calendar/state';
import {
  addLocalDays,
  formatLocalDateTime,
  mergeBusyIntervals,
  parseCalendarDate,
  parseCalendarDateTime,
  searchCalendarEvents,
} from '@/system/Calendar/domain/eventQueries';
import { buildCalendarDraftRoute, resolveCalendarToolDraft } from './draftRoute';
import { CALENDAR_TOOL_DEFINITIONS, CALENDAR_TOOL_NAMES } from './definitions';
import * as TimeService from '@/os/TimeService';
import { openAppRoute } from '../../core/navigation';

function getCalendarEvents() {
  return useCalendarStore.getState().events;
}

async function openCalendarRoute(route: string): Promise<void> {
  await openAppRoute('calendar', route);
}

function parseOptionalDate(input: JsonObject, key: string): Date | undefined {
  const value = optionalString(input, key);
  if (value === undefined) return undefined;
  const date = parseCalendarDate(value);
  if (!date) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must use YYYY-MM-DD format.`);
  }
  return date;
}

const handlers: Record<string, ToolHandler> = {
  [CALENDAR_TOOL_NAMES.searchEvents]: (input) => {
    assertAllowedKeys(input, ['query', 'date_from', 'date_to', 'limit']);
    const query = requireString(input, 'query', { maxLength: 200 });
    const dateFrom = parseOptionalDate(input, 'date_from');
    const dateTo = parseOptionalDate(input, 'date_to');
    if (dateFrom && dateTo && dateTo.getTime() < dateFrom.getTime()) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"date_to" must not be before "date_from".');
    }
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = searchCalendarEvents(getCalendarEvents(), {
      query,
      rangeStartTs: dateFrom?.getTime(),
      rangeEndTs: dateTo ? addLocalDays(dateTo, 1).getTime() : undefined,
    });
    return {
      events: matches.slice(0, limit).map((event) => ({
        event_id: event.id,
        title: event.title,
        start: formatLocalDateTime(event.startTs),
        all_day: event.allDay,
      })),
      total: matches.length,
      truncated: matches.length > limit,
    };
  },

  [CALENDAR_TOOL_NAMES.openEvent]: async (input) => {
    assertAllowedKeys(input, ['event_id']);
    const eventId = requireString(input, 'event_id', { maxLength: 200 });
    if (!getCalendarEvents().some((event) => event.id === eventId)) {
      throw new ToolExecutionError('EVENT_NOT_FOUND', `Calendar event not found: ${eventId}`);
    }
    const route = `/event/${encodeURIComponent(eventId)}`;
    await openCalendarRoute(route);
    return { event_id: eventId, route };
  },

  [CALENDAR_TOOL_NAMES.openDate]: async (input) => {
    assertAllowedKeys(input, ['date']);
    const dateText = requireString(input, 'date');
    const date = parseCalendarDate(dateText);
    if (!date) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"date" must use YYYY-MM-DD format.');
    }
    useCalendarStore.getState().setSelectedDate(date);
    const route = `/?date=${encodeURIComponent(dateText)}&view=month`;
    await openCalendarRoute(route);
    return { date: dateText, route };
  },

  [CALENDAR_TOOL_NAMES.getBusyIntervals]: (input) => {
    assertAllowedKeys(input, ['start', 'end']);
    const startText = requireString(input, 'start');
    const endText = requireString(input, 'end');
    const startTs = parseCalendarDateTime(startText);
    const endTs = parseCalendarDateTime(endText);
    if (startTs === null || endTs === null) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"start" and "end" must be ISO 8601 date-times.');
    }
    if (endTs <= startTs) {
      throw new ToolExecutionError('INVALID_ARGUMENT', '"end" must be after "start".');
    }
    const busy = mergeBusyIntervals(getCalendarEvents(), startTs, endTs).map((interval) => ({
      start: formatLocalDateTime(interval.startTs),
      end: formatLocalDateTime(interval.endTs),
    }));
    return {
      start: formatLocalDateTime(startTs),
      end: formatLocalDateTime(endTs),
      is_free: busy.length === 0,
      busy,
    };
  },

  [CALENDAR_TOOL_NAMES.prepareEventDraft]: async (input) => {
    assertAllowedKeys(input, ['title', 'date', 'start_time', 'end_time', 'all_day', 'description']);
    const title = requireString(input, 'title', { maxLength: 200 });
    const date = requireString(input, 'date');
    const allDay = optionalBoolean(input, 'all_day', false);
    const startTime = optionalString(input, 'start_time');
    const endTime = optionalString(input, 'end_time');
    const description = optionalString(input, 'description', { maxLength: 2000 });
    const draftInput = { title, date, startTime, endTime, allDay, description };
    const draft = resolveCalendarToolDraft(draftInput);
    if (!draft) {
      throw new ToolExecutionError(
        'INVALID_ARGUMENT',
        allDay
          ? '"date" must use YYYY-MM-DD format.'
          : 'Timed drafts require a valid date and HH:mm start_time/end_time with end_time after start_time.',
      );
    }
    useCalendarStore.getState().setSelectedDate(TimeService.fromTimestamp(draft.startTs));
    const route = buildCalendarDraftRoute(draftInput);
    await openCalendarRoute(route);
    return { route, persisted: false };
  },
};

export function executeCalendarTool(name: string, input: JsonObject): ReturnType<ToolHandler> {
  const handler = handlers[name];
  if (!handler) throw new ToolExecutionError('TOOL_NOT_FOUND', `Unknown Calendar tool: ${name}`);
  return handler(input);
}

export function registerCalendarTools(registry: Pick<typeof toolRegistry, 'register'>): void {
  for (const definition of CALENDAR_TOOL_DEFINITIONS) {
    registry.register(definition, handlers[definition.name]);
  }
}

export { CALENDAR_TOOL_DEFINITIONS, CALENDAR_TOOL_NAMES } from './definitions';

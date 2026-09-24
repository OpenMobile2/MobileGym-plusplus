import { useDaysmatterStore } from '@/apps/Daysmatter/state';
import type { DMEvent, DMNotebook, ReminderKind, RepeatKind } from '@/apps/Daysmatter/types';
import { dayInfo, fromParts, parts, todayMidnight } from '@/apps/Daysmatter/utils/dayMath';
import {
  assertAllowedKeys, optionalBoolean, optionalEnum, optionalInteger, optionalString, requireString, ToolExecutionError,
} from '../../core/errors';
import { openAppRoute } from '../../core/navigation';
import { toolRegistry } from '../../core/registry';
import type { JsonObject, ToolHandler } from '../../core/types';
import { DAYSMATTER_TOOL_DEFINITIONS, DAYSMATTER_TOOL_NAMES } from './definitions';

const DAY = 86_400_000;
function state() { return useDaysmatterStore.getState(); }
function eventById(id: string): DMEvent {
  const event = state().events.find((item) => item.id === id);
  if (!event) throw new ToolExecutionError('EVENT_NOT_FOUND', `Days Matter event not found: ${id}`);
  return event;
}
function notebookById(id: string): DMNotebook {
  const notebook = state().notebooks.find((item) => item.id === id);
  if (!notebook) throw new ToolExecutionError('NOTEBOOK_NOT_FOUND', `Days Matter notebook not found: ${id}`);
  return notebook;
}
function parseDate(value: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new ToolExecutionError('INVALID_ARGUMENT', 'Dates must use YYYY-MM-DD format.');
  const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]);
  const timestamp = fromParts(year, month, day); const parsed = parts(timestamp);
  if (parsed.y !== year || parsed.m !== month || parsed.d !== day) throw new ToolExecutionError('INVALID_ARGUMENT', `Invalid date: ${value}`);
  return timestamp;
}
function formatDate(timestamp: number): string {
  const value = parts(timestamp);
  return `${value.y.toString().padStart(4, '0')}-${value.m.toString().padStart(2, '0')}-${value.d.toString().padStart(2, '0')}`;
}
function summary(event: DMEvent) {
  const info = dayInfo(event);
  return { event_id: event.id, title: event.title, target_date: formatDate(event.targetDate), state: info.state, days: info.count, notebook_id: event.notebookId, pinned: event.pinned };
}

const handlers: Record<string, ToolHandler> = {
  [DAYSMATTER_TOOL_NAMES.searchEvents]: (input) => {
    assertAllowedKeys(input, ['query', 'notebook_id', 'limit']);
    const query = requireString(input, 'query', { maxLength: 100 }).toLowerCase();
    const notebookId = optionalString(input, 'notebook_id'); if (notebookId) notebookById(notebookId);
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = state().events.filter((event) => !event.archived && !event.parentId && (!notebookId || event.notebookId === notebookId) && event.title.toLowerCase().includes(query));
    return { events: matches.slice(0, limit).map(summary), total: matches.length, truncated: matches.length > limit };
  },
  [DAYSMATTER_TOOL_NAMES.listUpcomingEvents]: (input) => {
    assertAllowedKeys(input, ['notebook_id', 'days_ahead', 'limit']);
    const notebookId = optionalString(input, 'notebook_id'); if (notebookId) notebookById(notebookId);
    const daysAhead = optionalInteger(input, 'days_ahead', { min: 0, max: 3650, defaultValue: 365 });
    const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const today = todayMidnight(); const end = today + daysAhead * DAY;
    const matches = state().events.filter((event) => !event.archived && !event.parentId && (!notebookId || event.notebookId === notebookId) && event.targetDate >= today && event.targetDate <= end).sort((a, b) => a.targetDate - b.targetDate);
    return { events: matches.slice(0, limit).map(summary), total: matches.length, truncated: matches.length > limit };
  },
  [DAYSMATTER_TOOL_NAMES.getEventCountdown]: (input) => {
    assertAllowedKeys(input, ['event_id']); const event = eventById(requireString(input, 'event_id')); return summary(event);
  },
  [DAYSMATTER_TOOL_NAMES.listNotebooks]: (input) => {
    assertAllowedKeys(input, []); const current = state();
    return { notebooks: [...current.notebooks].sort((a, b) => a.order - b.order).map((notebook) => ({ notebook_id: notebook.id, name: notebook.name, icon: notebook.icon, event_count: current.events.filter((event) => event.notebookId === notebook.id && !event.archived && !event.parentId).length, system: notebook.isSystem })) };
  },
  [DAYSMATTER_TOOL_NAMES.openEvent]: async (input) => {
    assertAllowedKeys(input, ['event_id']); const eventId = requireString(input, 'event_id'); eventById(eventId);
    const route = `/event/${encodeURIComponent(eventId)}`; await openAppRoute('daysmatter', route); return { event_id: eventId, route };
  },
  [DAYSMATTER_TOOL_NAMES.openNotebook]: async (input) => {
    assertAllowedKeys(input, ['notebook_id']); const notebookId = requireString(input, 'notebook_id'); notebookById(notebookId);
    state().setFilter({ kind: 'notebook', notebookId }); const route = '/'; await openAppRoute('daysmatter', route); return { notebook_id: notebookId, route };
  },
  [DAYSMATTER_TOOL_NAMES.calculateDateDifference]: (input) => {
    assertAllowedKeys(input, ['start_date', 'end_date', 'include_start']);
    const startText = requireString(input, 'start_date'); const endText = requireString(input, 'end_date');
    const start = parseDate(startText); const end = parseDate(endText); const includeStart = optionalBoolean(input, 'include_start', false);
    const raw = Math.round((end - start) / DAY); const days = raw === 0 ? 0 : raw + (includeStart ? Math.sign(raw) : 0);
    return { start_date: startText, end_date: endText, days, direction: days === 0 ? 'same_day' : days > 0 ? 'forward' : 'backward' };
  },
  [DAYSMATTER_TOOL_NAMES.prepareEventDraft]: async (input) => {
    assertAllowedKeys(input, ['title', 'target_date', 'notebook_id', 'repeat', 'reminder', 'pinned', 'show_on_home']);
    const title = requireString(input, 'title', { maxLength: 200 }); const targetDate = parseDate(requireString(input, 'target_date'));
    const notebookId = optionalString(input, 'notebook_id') ?? state().notebooks[0]?.id ?? 'nb_life'; notebookById(notebookId);
    const repeat = optionalEnum(input, 'repeat', ['none', 'week', 'month', 'year'] as const, 'none') as RepeatKind;
    const reminder = optionalEnum(input, 'reminder', ['none', 'daily', 'weekly', 'monthly', 'yearly'] as const, 'none') as ReminderKind;
    state().initDraft({ id: null, title, targetDate, notebookId, calendar: 'solar', pinned: optionalBoolean(input, 'pinned', false), showOnHome: optionalBoolean(input, 'show_on_home', true), repeat, reminder, plusOne: false, hasEndDate: false, endDate: null, parentId: null });
    const route = '/event/add'; await openAppRoute('daysmatter', route); return { route, persisted: false };
  },
  [DAYSMATTER_TOOL_NAMES.archiveEvent]: (input) => {
    assertAllowedKeys(input, ['event_id']); const eventId = requireString(input, 'event_id'); const event = eventById(eventId);
    if (!event.archived) state().setArchived(eventId, true); return { event_id: eventId, archived: true };
  },
};

export function executeDaysmatterTool(name: string, input: JsonObject): ReturnType<ToolHandler> {
  const handler = handlers[name];
  if (!handler) throw new ToolExecutionError('TOOL_NOT_FOUND', `Unknown Days Matter tool: ${name}`);
  return handler(input);
}

export function registerDaysmatterTools(registry: Pick<typeof toolRegistry, 'register'>): void {
  DAYSMATTER_TOOL_DEFINITIONS.forEach((definition) => registry.register(definition, handlers[definition.name]));
}
export { DAYSMATTER_TOOL_DEFINITIONS, DAYSMATTER_TOOL_NAMES } from './definitions';

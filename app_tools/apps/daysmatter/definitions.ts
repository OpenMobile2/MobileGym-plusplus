import type { ToolDefinition } from '../../core/types';

const STRING = { type: 'string' } as const;
const LIMIT = { type: 'integer', minimum: 1, maximum: 20, default: 10 } as const;
const EVENTS = { type: 'array', items: { type: 'object', properties: { event_id: STRING, title: STRING, target_date: STRING, state: { type: 'string', enum: ['future', 'today', 'past'] }, days: { type: 'integer' }, notebook_id: STRING, pinned: { type: 'boolean' } }, required: ['event_id', 'title', 'target_date', 'state', 'days', 'notebook_id', 'pinned'] } } as const;
const ann = (readOnly: boolean, uiEffect: 'none' | 'navigation' | 'draft' = 'none', idempotent = true) => ({ readOnlyHint: readOnly, destructiveHint: false, idempotentHint: idempotent, uiEffect });

export const DAYSMATTER_TOOL_NAMES = {
  searchEvents: 'daysmatter__search_events',
  listUpcomingEvents: 'daysmatter__list_upcoming_events',
  getEventCountdown: 'daysmatter__get_event_countdown',
  listNotebooks: 'daysmatter__list_notebooks',
  openEvent: 'daysmatter__open_event',
  openNotebook: 'daysmatter__open_notebook',
  calculateDateDifference: 'daysmatter__calculate_date_difference',
  prepareEventDraft: 'daysmatter__prepare_event_draft',
  archiveEvent: 'daysmatter__archive_event',
} as const;

export const DAYSMATTER_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: DAYSMATTER_TOOL_NAMES.searchEvents, app: 'daysmatter',
    description: 'Search active top-level Days Matter events by title. Returns compact candidates without changing the UI.',
    inputSchema: { type: 'object', properties: { query: { ...STRING, maxLength: 100 }, notebook_id: STRING, limit: LIMIT }, required: ['query'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { events: EVENTS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['events', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.listUpcomingEvents, app: 'daysmatter',
    description: 'List active top-level countdown events on or after today, ordered by target date.',
    inputSchema: { type: 'object', properties: { notebook_id: STRING, days_ahead: { type: 'integer', minimum: 0, maximum: 3650, default: 365 }, limit: LIMIT }, additionalProperties: false },
    outputSchema: { type: 'object', properties: { events: EVENTS, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['events', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.getEventCountdown, app: 'daysmatter',
    description: 'Get the current countdown or elapsed-day value for one Days Matter event.',
    inputSchema: { type: 'object', properties: { event_id: STRING }, required: ['event_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { event_id: STRING, title: STRING, state: STRING, days: { type: 'integer' }, target_date: STRING }, required: ['event_id', 'title', 'state', 'days', 'target_date'] }, annotations: ann(true),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.listNotebooks, app: 'daysmatter',
    description: 'List Days Matter notebooks and active top-level event counts.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    outputSchema: { type: 'object', properties: { notebooks: { type: 'array', items: { type: 'object', properties: { notebook_id: STRING, name: STRING, icon: STRING, event_count: { type: 'integer' }, system: { type: 'boolean' } }, required: ['notebook_id', 'name', 'icon', 'event_count', 'system'] } } }, required: ['notebooks'] }, annotations: ann(true),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.openEvent, app: 'daysmatter',
    description: 'Open a Days Matter event detail page by event_id. The next screenshot shows its full details.',
    inputSchema: { type: 'object', properties: { event_id: STRING }, required: ['event_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { event_id: STRING, route: STRING }, required: ['event_id', 'route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.openNotebook, app: 'daysmatter',
    description: 'Open the Days Matter home filtered to one notebook. Event contents remain in the GUI.',
    inputSchema: { type: 'object', properties: { notebook_id: STRING }, required: ['notebook_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { notebook_id: STRING, route: STRING }, required: ['notebook_id', 'route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.calculateDateDifference, app: 'daysmatter',
    description: 'Calculate the signed number of days from start_date to end_date without creating an event.',
    inputSchema: { type: 'object', properties: { start_date: { ...STRING, description: 'YYYY-MM-DD' }, end_date: { ...STRING, description: 'YYYY-MM-DD' }, include_start: { type: 'boolean', default: false } }, required: ['start_date', 'end_date'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { start_date: STRING, end_date: STRING, days: { type: 'integer' }, direction: { type: 'string' } }, required: ['start_date', 'end_date', 'days', 'direction'] }, annotations: ann(true),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.prepareEventDraft, app: 'daysmatter',
    description: 'Open a prefilled Days Matter event form. The event is not saved; review advanced options and save through the GUI.',
    inputSchema: { type: 'object', properties: { title: { ...STRING, maxLength: 200 }, target_date: { ...STRING, description: 'YYYY-MM-DD' }, notebook_id: STRING, repeat: { type: 'string', enum: ['none', 'week', 'month', 'year'], default: 'none' }, reminder: { type: 'string', enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'], default: 'none' }, pinned: { type: 'boolean', default: false }, show_on_home: { type: 'boolean', default: true } }, required: ['title', 'target_date'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { route: STRING, persisted: { type: 'boolean' } }, required: ['route', 'persisted'] }, annotations: ann(false, 'draft'),
  },
  {
    name: DAYSMATTER_TOOL_NAMES.archiveEvent, app: 'daysmatter',
    description: 'Archive one existing event using the same reversible archive action as the GUI. It is removed from home but not deleted.',
    inputSchema: { type: 'object', properties: { event_id: STRING }, required: ['event_id'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { event_id: STRING, archived: { type: 'boolean' } }, required: ['event_id', 'archived'] }, annotations: ann(false),
  },
];

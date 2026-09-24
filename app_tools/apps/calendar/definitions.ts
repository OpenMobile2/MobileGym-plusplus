import type { ToolDefinition } from '../../core/types';

const STRING = { type: 'string' } as const;

export const CALENDAR_TOOL_NAMES = {
  searchEvents: 'calendar__search_events',
  openEvent: 'calendar__open_event',
  openDate: 'calendar__open_date',
  getBusyIntervals: 'calendar__get_busy_intervals',
  prepareEventDraft: 'calendar__prepare_event_draft',
} as const;

export const CALENDAR_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: CALENDAR_TOOL_NAMES.searchEvents,
    app: 'calendar',
    description: 'Search calendar event titles and notes. Returns compact candidates, not private event details.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { ...STRING, description: 'Non-empty text to match in event titles or notes.' },
        date_from: { ...STRING, description: 'Optional inclusive local date in YYYY-MM-DD format.' },
        date_to: { ...STRING, description: 'Optional inclusive local date in YYYY-MM-DD format.' },
        limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 },
      },
      required: ['query'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        events: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              event_id: { type: 'string' },
              title: { type: 'string' },
              start: { type: 'string' },
              all_day: { type: 'boolean' },
            },
            required: ['event_id', 'title', 'start', 'all_day'],
          },
        },
        total: { type: 'integer' },
        truncated: { type: 'boolean' },
      },
      required: ['events', 'total', 'truncated'],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      uiEffect: 'none',
    },
  },
  {
    name: CALENDAR_TOOL_NAMES.openEvent,
    app: 'calendar',
    description: 'Open an existing calendar event detail page by an event_id returned from search.',
    inputSchema: {
      type: 'object',
      properties: { event_id: { ...STRING, description: 'Opaque calendar event identifier.' } },
      required: ['event_id'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: { event_id: { type: 'string' }, route: { type: 'string' } },
      required: ['event_id', 'route'],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      uiEffect: 'navigation',
    },
  },
  {
    name: CALENDAR_TOOL_NAMES.openDate,
    app: 'calendar',
    description: 'Open Calendar on a specific local date. Event contents remain visible only in the GUI.',
    inputSchema: {
      type: 'object',
      properties: { date: { ...STRING, description: 'Local date in YYYY-MM-DD format.' } },
      required: ['date'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: { date: { type: 'string' }, route: { type: 'string' } },
      required: ['date', 'route'],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      uiEffect: 'navigation',
    },
  },
  {
    name: CALENDAR_TOOL_NAMES.getBusyIntervals,
    app: 'calendar',
    description: 'Return merged busy intervals in a time range without exposing event titles or notes.',
    inputSchema: {
      type: 'object',
      properties: {
        start: { ...STRING, description: 'Range start as an ISO 8601 date-time.' },
        end: { ...STRING, description: 'Exclusive range end as an ISO 8601 date-time.' },
      },
      required: ['start', 'end'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: {
        start: { type: 'string' },
        end: { type: 'string' },
        is_free: { type: 'boolean' },
        busy: {
          type: 'array',
          items: {
            type: 'object',
            properties: { start: { type: 'string' }, end: { type: 'string' } },
            required: ['start', 'end'],
          },
        },
      },
      required: ['start', 'end', 'is_free', 'busy'],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      uiEffect: 'none',
    },
  },
  {
    name: CALENDAR_TOOL_NAMES.prepareEventDraft,
    app: 'calendar',
    description: 'Open a prefilled new-event form. This does not save an event; use the GUI to review and submit it.',
    inputSchema: {
      type: 'object',
      properties: {
        title: { ...STRING, maxLength: 200 },
        date: { ...STRING, description: 'Local event date in YYYY-MM-DD format.' },
        start_time: { ...STRING, description: 'HH:mm; required unless all_day is true.' },
        end_time: { ...STRING, description: 'HH:mm; required unless all_day is true.' },
        all_day: { type: 'boolean', default: false },
        description: { ...STRING, maxLength: 2000 },
      },
      required: ['title', 'date'],
      additionalProperties: false,
    },
    outputSchema: {
      type: 'object',
      properties: { route: { type: 'string' }, persisted: { type: 'boolean' } },
      required: ['route', 'persisted'],
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      uiEffect: 'draft',
    },
  },
];

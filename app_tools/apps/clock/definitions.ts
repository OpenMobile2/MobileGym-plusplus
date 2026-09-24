import type { ToolDefinition } from '../../core/types';

const STRING = { type: 'string' } as const;
const ALARMS = { type: 'array', items: { type: 'object', properties: { alarm_id: STRING, time: STRING, enabled: { type: 'boolean' }, repeat: STRING, label: STRING, vibrate: { type: 'boolean' }, auto_delete: { type: 'boolean' } }, required: ['alarm_id', 'time', 'enabled', 'repeat', 'label', 'vibrate', 'auto_delete'] } } as const;
const CITIES = { type: 'array', items: { type: 'object', properties: { city_id: STRING, name: STRING, country: STRING, gmt_offset: STRING, selected: { type: 'boolean' } }, required: ['city_id', 'name', 'country', 'gmt_offset'] } } as const;
const ann = (readOnly: boolean, uiEffect: 'none' | 'navigation' | 'draft' = 'none', idempotent = true) => ({ readOnlyHint: readOnly, destructiveHint: false, idempotentHint: idempotent, uiEffect });
export const CLOCK_TOOL_NAMES = {
  listAlarms: 'clock__list_alarms',
  getNextAlarm: 'clock__get_next_alarm',
  createAlarm: 'clock__create_alarm',
  setAlarmEnabled: 'clock__set_alarm_enabled',
  openAlarms: 'clock__open_alarms',
  searchWorldCities: 'clock__search_world_cities',
  getWorldTimes: 'clock__get_world_times',
  addWorldCity: 'clock__add_world_city',
  openTimer: 'clock__open_timer',
} as const;

export const CLOCK_TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: CLOCK_TOOL_NAMES.listAlarms, app: 'clock', description: 'List configured alarms with stable alarm IDs and their enabled state.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, outputSchema: { type: 'object', properties: { alarms: ALARMS }, required: ['alarms'] }, annotations: ann(true),
  },
  {
    name: CLOCK_TOOL_NAMES.getNextAlarm, app: 'clock', description: 'Return the next enabled alarm occurrence based on the simulated device time.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, outputSchema: { type: 'object', properties: { alarm: { type: ['object', 'null'] } }, required: ['alarm'] }, annotations: ann(true),
  },
  {
    name: CLOCK_TOOL_NAMES.createAlarm, app: 'clock', description: 'Create and enable an alarm through the same alarm store action as the GUI and Android alarm provider.',
    inputSchema: { type: 'object', properties: { hour: { type: 'integer', minimum: 0, maximum: 23 }, minute: { type: 'integer', minimum: 0, maximum: 59 }, repeat: { type: 'string', enum: ['once', 'daily', 'workday', 'holiday', 'weekday'], default: 'once' }, label: { ...STRING, maxLength: 100 }, vibrate: { type: 'boolean', default: true }, auto_delete: { type: 'boolean', default: false } }, required: ['hour', 'minute'], additionalProperties: false },
    outputSchema: { type: 'object', properties: { alarm_id: STRING, enabled: { type: 'boolean' }, next_trigger: STRING }, required: ['alarm_id', 'enabled', 'next_trigger'] }, annotations: ann(false, 'none', false),
  },
  {
    name: CLOCK_TOOL_NAMES.setAlarmEnabled, app: 'clock', description: 'Enable or disable one existing alarm. Repeating the same requested state has no additional effect.',
    inputSchema: { type: 'object', properties: { alarm_id: STRING, enabled: { type: 'boolean' } }, required: ['alarm_id', 'enabled'], additionalProperties: false }, outputSchema: { type: 'object', properties: { alarm_id: STRING, enabled: { type: 'boolean' } }, required: ['alarm_id', 'enabled'] }, annotations: ann(false),
  },
  {
    name: CLOCK_TOOL_NAMES.openAlarms, app: 'clock', description: 'Open the alarm tab. The next screenshot shows all configured alarms and GUI controls.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, outputSchema: { type: 'object', properties: { route: STRING }, required: ['route'] }, annotations: ann(true, 'navigation'),
  },
  {
    name: CLOCK_TOOL_NAMES.searchWorldCities, app: 'clock', description: 'Search available world-clock cities by city, country, or GMT offset.',
    inputSchema: { type: 'object', properties: { query: { ...STRING, maxLength: 100 }, limit: { type: 'integer', minimum: 1, maximum: 20, default: 10 } }, required: ['query'], additionalProperties: false }, outputSchema: { type: 'object', properties: { cities: CITIES, total: { type: 'integer' }, truncated: { type: 'boolean' } }, required: ['cities', 'total', 'truncated'] }, annotations: ann(true),
  },
  {
    name: CLOCK_TOOL_NAMES.getWorldTimes, app: 'clock', description: 'Get current times for city IDs returned by search_world_cities. Without city_ids, returns configured world clocks.',
    inputSchema: { type: 'object', properties: { city_ids: { type: 'array', items: STRING, maxItems: 10 } }, additionalProperties: false }, outputSchema: { type: 'object', properties: { cities: { type: 'array', items: { type: 'object', properties: { city_id: STRING, name: STRING, local_time: STRING, gmt_offset: STRING }, required: ['city_id', 'name', 'local_time', 'gmt_offset'] } }, observed_at: STRING }, required: ['cities', 'observed_at'] }, annotations: ann(true),
  },
  {
    name: CLOCK_TOOL_NAMES.addWorldCity, app: 'clock', description: 'Add one city to the world-clock list. Re-adding an existing city is idempotent.',
    inputSchema: { type: 'object', properties: { city_id: STRING }, required: ['city_id'], additionalProperties: false }, outputSchema: { type: 'object', properties: { city_id: STRING, added: { type: 'boolean' } }, required: ['city_id', 'added'] }, annotations: ann(false),
  },
  {
    name: CLOCK_TOOL_NAMES.openTimer, app: 'clock', description: 'Open the timer tab. Set and start the timer through the GUI after navigation.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }, outputSchema: { type: 'object', properties: { route: STRING }, required: ['route'] }, annotations: ann(true, 'navigation'),
  },
];

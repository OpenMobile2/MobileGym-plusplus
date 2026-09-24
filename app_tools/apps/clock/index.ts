import { CLOCK_CONFIG } from '@/system/Clock/data';
import { useClockStore } from '@/system/Clock/state';
import type { Alarm, AlarmRepeat, WorldCity } from '@/system/Clock/types';
import { formatAlarmTime, formatGmtLabel, getCityTime, getNextTrigger } from '@/system/Clock/utils';
import * as TimeService from '@/os/TimeService';
import {
  assertAllowedKeys, optionalBoolean, optionalEnum, optionalInteger, optionalString, requireBoolean, requireInteger, requireString, ToolExecutionError,
} from '../../core/errors';
import { openAppRoute } from '../../core/navigation';
import { toolRegistry } from '../../core/registry';
import type { JsonObject, ToolHandler } from '../../core/types';
import { CLOCK_TOOL_DEFINITIONS, CLOCK_TOOL_NAMES } from './definitions';

function state() { return useClockStore.getState(); }
function alarmById(id: string): Alarm {
  const alarm = state().alarms.find((item) => item.id === id);
  if (!alarm) throw new ToolExecutionError('ALARM_NOT_FOUND', `Alarm not found: ${id}`);
  return alarm;
}
function cityById(id: string): WorldCity {
  const city = (CLOCK_CONFIG.cities as WorldCity[]).find((item) => item.id === id);
  if (!city) throw new ToolExecutionError('CITY_NOT_FOUND', `World-clock city not found: ${id}`);
  return city;
}
function alarmSummary(alarm: Alarm) {
  return { alarm_id: alarm.id, time: formatAlarmTime(alarm.hour, alarm.minute), enabled: alarm.enabled, repeat: alarm.repeat, label: alarm.note ?? '', vibrate: alarm.vibrate, auto_delete: alarm.autoDelete };
}
function requireCityIds(input: Record<string, unknown>): string[] {
  const value = input.city_ids;
  if (value === undefined) return state().selectedCityIds;
  if (!Array.isArray(value) || value.length > 10 || value.some((id) => typeof id !== 'string' || !id.trim())) throw new ToolExecutionError('INVALID_ARGUMENT', '"city_ids" must be an array of at most 10 city IDs.');
  return value.map(String);
}

const handlers: Record<string, ToolHandler> = {
  [CLOCK_TOOL_NAMES.listAlarms]: (input) => { assertAllowedKeys(input, []); return { alarms: [...state().alarms].sort((a, b) => a.hour - b.hour || a.minute - b.minute).map(alarmSummary) }; },
  [CLOCK_TOOL_NAMES.getNextAlarm]: (input) => {
    assertAllowedKeys(input, []); const now = TimeService.getDate();
    const next = state().alarms.filter((alarm) => alarm.enabled).map((alarm) => ({ alarm, trigger: getNextTrigger(alarm, now) })).sort((a, b) => a.trigger - b.trigger)[0];
    return { alarm: next ? { ...alarmSummary(next.alarm), next_trigger: TimeService.fromTimestamp(next.trigger).toISOString() } : null };
  },
  [CLOCK_TOOL_NAMES.createAlarm]: (input) => {
    assertAllowedKeys(input, ['hour', 'minute', 'repeat', 'label', 'vibrate', 'auto_delete']);
    const hour = requireInteger(input, 'hour', { min: 0, max: 23 }); const minute = requireInteger(input, 'minute', { min: 0, max: 59 });
    const repeat = optionalEnum(input, 'repeat', ['once', 'daily', 'workday', 'holiday', 'weekday'] as const, 'once') as AlarmRepeat;
    const alarm: Alarm = { id: `a-tool-${TimeService.now()}-${Math.random().toString(36).slice(2, 6)}`, hour, minute, enabled: true, repeat, note: optionalString(input, 'label', { maxLength: 100 }), vibrate: optionalBoolean(input, 'vibrate', true), autoDelete: optionalBoolean(input, 'auto_delete', false) };
    state().saveAlarm(alarm); const saved = alarmById(alarm.id); return { alarm_id: saved.id, enabled: saved.enabled, next_trigger: TimeService.fromTimestamp(getNextTrigger(saved, TimeService.getDate())).toISOString() };
  },
  [CLOCK_TOOL_NAMES.setAlarmEnabled]: (input) => {
    assertAllowedKeys(input, ['alarm_id', 'enabled']); const alarmId = requireString(input, 'alarm_id'); const enabled = requireBoolean(input, 'enabled'); const alarm = alarmById(alarmId);
    if (alarm.enabled !== enabled) state().toggleAlarm(alarmId); return { alarm_id: alarmId, enabled: alarmById(alarmId).enabled };
  },
  [CLOCK_TOOL_NAMES.openAlarms]: async (input) => { assertAllowedKeys(input, []); const route = '/alarm'; await openAppRoute('clock', route); return { route }; },
  [CLOCK_TOOL_NAMES.searchWorldCities]: (input) => {
    assertAllowedKeys(input, ['query', 'limit']); const query = requireString(input, 'query', { maxLength: 100 }).toLowerCase(); const limit = optionalInteger(input, 'limit', { min: 1, max: 20, defaultValue: 10 });
    const matches = (CLOCK_CONFIG.cities as WorldCity[]).filter((city) => `${city.name} ${city.country} ${formatGmtLabel(city.gmtOffsetMinutes)}`.toLowerCase().includes(query));
    return { cities: matches.slice(0, limit).map((city) => ({ city_id: city.id, name: city.name, country: city.country, gmt_offset: formatGmtLabel(city.gmtOffsetMinutes), selected: state().selectedCityIds.includes(city.id) })), total: matches.length, truncated: matches.length > limit };
  },
  [CLOCK_TOOL_NAMES.getWorldTimes]: (input) => {
    assertAllowedKeys(input, ['city_ids']); const now = TimeService.getDate(); const ids = requireCityIds(input); const cities = ids.map(cityById);
    return { observed_at: now.toISOString(), cities: cities.map((city) => { const value = getCityTime(city.gmtOffsetMinutes, now); return { city_id: city.id, name: city.name, local_time: `${value.getFullYear().toString().padStart(4, '0')}-${(value.getMonth() + 1).toString().padStart(2, '0')}-${value.getDate().toString().padStart(2, '0')} ${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`, gmt_offset: formatGmtLabel(city.gmtOffsetMinutes) }; }) };
  },
  [CLOCK_TOOL_NAMES.addWorldCity]: (input) => {
    assertAllowedKeys(input, ['city_id']); const cityId = requireString(input, 'city_id'); cityById(cityId); const existed = state().selectedCityIds.includes(cityId); if (!existed) state().addCity(cityId); return { city_id: cityId, added: !existed };
  },
  [CLOCK_TOOL_NAMES.openTimer]: async (input) => { assertAllowedKeys(input, []); const route = '/timer'; await openAppRoute('clock', route); return { route }; },
};

export function executeClockTool(name: string, input: JsonObject): ReturnType<ToolHandler> {
  const handler = handlers[name];
  if (!handler) throw new ToolExecutionError('TOOL_NOT_FOUND', `Unknown Clock tool: ${name}`);
  return handler(input);
}

export function registerClockTools(registry: Pick<typeof toolRegistry, 'register'>): void {
  CLOCK_TOOL_DEFINITIONS.forEach((definition) => registry.register(definition, handlers[definition.name]));
}
export { CLOCK_TOOL_DEFINITIONS, CLOCK_TOOL_NAMES } from './definitions';

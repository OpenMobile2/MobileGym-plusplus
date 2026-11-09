import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { BrowserToolApi } from '../app_tools/core/types';
import type { CalendarEvent } from '../system/Calendar/types';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

describe('Calendar environment tools', () => {
  let api: BrowserToolApi;
  let route = '/';
  let useCalendarStore: typeof import('../system/Calendar/state').useCalendarStore;
  let TimeService: typeof import('../os/TimeService');

  beforeAll(async () => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: createLocalStorageMock(),
      configurable: true,
    });
    Object.defineProperty(globalThis, 'window', {
      value: {
        setTimeout,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        __OS__: {
          openApp: (_appId: string, nextRoute?: string) => {
            if (nextRoute) route = nextRoute;
          },
          getAppRoute: () => ({ app: 'calendar', path: route }),
        },
      },
      configurable: true,
    });

    TimeService = await import('../os/TimeService');
    ({ useCalendarStore } = await import('../system/Calendar/state'));
    await import('../app_tools/bootstrap');
    api = (globalThis.window as Window).__MOBILE_GYM_TOOLS__!;
  });

  beforeEach(() => {
    route = '/';
    const ts = (day: number, hour: number, minute = 0) =>
      TimeService.fromLocalParts(2026, 6, day, hour, minute).getTime();
    const events: CalendarEvent[] = [
      {
        id: 'evt_project_early',
        type: 'event',
        title: '项目周会',
        description: '讨论排期',
        allDay: false,
        startTs: ts(13, 9),
        endTs: ts(13, 10),
      },
      {
        id: 'evt_project_late',
        type: 'event',
        title: '客户沟通',
        description: '项目复盘',
        allDay: false,
        startTs: ts(13, 9, 30),
        endTs: ts(13, 11),
      },
      {
        id: 'evt_other',
        type: 'event',
        title: '健身',
        allDay: false,
        startTs: ts(14, 18),
        endTs: ts(14, 19),
      },
    ];
    useCalendarStore.setState({
      events,
      selectedDateTs: TimeService.fromLocalParts(2026, 6, 1).getTime(),
    });
  });

  it('registers only the five intended Calendar tools', () => {
    expect(api.listTools({ app: 'calendar' }).map((tool) => tool.name)).toEqual([
      'calendar__search_events',
      'calendar__open_event',
      'calendar__open_date',
      'calendar__get_busy_intervals',
      'calendar__prepare_event_draft',
    ]);
  });

  it('searches with the same title/notes semantics as the Calendar search page', async () => {
    const result = await api.callTool('calendar__search_events', {
      query: '项目',
      date_from: '2026-07-13',
      date_to: '2026-07-13',
      limit: 1,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.output).toMatchObject({ total: 2, truncated: true });
    expect((result.output as any).events).toEqual([
      expect.objectContaining({ event_id: 'evt_project_late', title: '客户沟通' }),
    ]);
  });

  it('returns merged free/busy data without event content', async () => {
    const result = await api.callTool('calendar__get_busy_intervals', {
      start: '2026-07-13T08:00:00',
      end: '2026-07-13T12:00:00',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.output).toMatchObject({ is_free: false });
    expect((result.output as any).busy).toHaveLength(1);
    expect(JSON.stringify(result.output)).not.toContain('项目周会');
    expect(JSON.stringify(result.output)).not.toContain('客户沟通');
  });

  it('opens dates and existing events through normal Calendar routes', async () => {
    const dateResult = await api.callTool('calendar__open_date', { date: '2026-07-13' });
    expect(dateResult.ok).toBe(true);
    expect(route).toBe('/?date=2026-07-13&view=month');
    expect(TimeService.fromTimestamp(useCalendarStore.getState().selectedDateTs).getDate()).toBe(13);

    const eventResult = await api.callTool('calendar__open_event', { event_id: 'evt_project_early' });
    expect(eventResult.ok).toBe(true);
    expect(route).toBe('/event/evt_project_early');
  });

  it('opens a prefilled draft without persisting a new event', async () => {
    const before = useCalendarStore.getState().events;
    const result = await api.callTool('calendar__prepare_event_draft', {
      title: '项目复盘',
      date: '2026-07-15',
      start_time: '14:00',
      end_time: '15:30',
      description: '整理本周进展',
    });

    expect(result.ok).toBe(true);
    expect(useCalendarStore.getState().events).toEqual(before);
    expect(route.startsWith('/new-event?')).toBe(true);
    const params = new URLSearchParams(route.split('?')[1]);
    expect(params.get('source')).toBe('tool');
    expect(params.get('title')).toBe('项目复盘');
    expect(params.get('date')).toBe('2026-07-15');
    expect(params.get('startTime')).toBe('14:00');
    expect(params.get('endTime')).toBe('15:30');
  });

  it('returns structured errors for invalid or unsafe calls', async () => {
    const missing = await api.callTool('calendar__open_event', { event_id: 'missing' });
    expect(missing).toMatchObject({ ok: false, error: { code: 'EVENT_NOT_FOUND' } });

    const invalidDraft = await api.callTool('calendar__prepare_event_draft', {
      title: '错误时间',
      date: '2026-07-15',
      start_time: '15:00',
      end_time: '14:00',
    });
    expect(invalidDraft).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });

    const extra = await api.callTool('calendar__open_date', {
      date: '2026-07-13',
      hidden_state: true,
    });
    expect(extra).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });
  });
});

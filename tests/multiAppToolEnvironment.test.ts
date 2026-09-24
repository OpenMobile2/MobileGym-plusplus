import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { BrowserToolApi } from '../app_tools/core/types';
import type { ContactItem, ChatSession } from '../apps/Wechat/types';
import type { DMEvent, DMNotebook } from '../apps/Daysmatter/types';
import type { Alarm } from '../system/Clock/types';
import type { Note, NotesFolder, NotesTodo } from '../system/Notes/types';

function createLocalStorageMock() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };
}

function expectArraySchemasHaveItems(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const schema = value as Record<string, unknown>;
  if (schema.type === 'array') expect(schema.items).toBeDefined();
  Object.values(schema).forEach(expectArraySchemasHaveItems);
}

describe('multi-app environment tools', () => {
  let api: BrowserToolApi;
  const routes = new Map<string, string>();
  let useWechatStore: typeof import('../apps/Wechat/state').useWechatStore;
  let useTbsgStore: typeof import('../apps/TaobaoShangou/state').useTbsgStore;
  let useDaysmatterStore: typeof import('../apps/Daysmatter/state').useDaysmatterStore;
  let useClockStore: typeof import('../system/Clock/state').useClockStore;
  let useNotesStore: typeof import('../system/Notes/state').useNotesStore;
  let TimeService: typeof import('../os/TimeService');

  beforeAll(async () => {
    Object.defineProperty(globalThis, 'localStorage', { value: createLocalStorageMock(), configurable: true });
    Object.defineProperty(globalThis, 'window', {
      value: {
        setTimeout,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        __OS__: {
          openApp: (appId: string, route?: string) => routes.set(appId, route ?? '/'),
          getAppRoute: (appId: string) => ({ app: appId, path: routes.get(appId) ?? '/' }),
        },
      },
      configurable: true,
    });
    TimeService = await import('../os/TimeService');
    ({ useWechatStore } = await import('../apps/Wechat/state'));
    ({ useTbsgStore } = await import('../apps/TaobaoShangou/state'));
    ({ useDaysmatterStore } = await import('../apps/Daysmatter/state'));
    ({ useClockStore } = await import('../system/Clock/state'));
    ({ useNotesStore } = await import('../system/Notes/state'));
    await import('../app_tools/bootstrap');
    api = (globalThis.window as Window).__MOBILE_GYM_TOOLS__!;
  });

  beforeEach(() => routes.clear());

  it('registers the intended 48 tools under five app namespaces', () => {
    const expected = { wechat: 10, tbsg: 10, daysmatter: 9, clock: 9, notes: 10 };
    for (const [app, count] of Object.entries(expected)) {
      const tools = api.listTools({ app });
      expect(tools).toHaveLength(count);
      expect(tools.every((tool) => tool.name.startsWith(`${app}__`))).toBe(true);
      expect(tools.every((tool) => tool.inputSchema && tool.outputSchema && tool.annotations)).toBe(true);
      tools.forEach((tool) => expectArraySchemasHaveItems(tool.outputSchema));
    }
    const names = api.listTools().map((tool) => tool.name);
    expect(new Set(names).size).toBe(names.length);
  });

  describe('WeChat', () => {
    const contacts: ContactItem[] = [
      { wxid: 'wx_alice', name: 'Alice', alias: 'A同事', memo: '项目负责人', avatar: 'alice.jpg' },
      { wxid: 'wx_blocked', name: 'Blocked', avatar: 'blocked.jpg', isBlacklisted: true },
    ];
    const chats: ChatSession[] = [{
      id: 'wx_alice', user: { wxid: 'wx_alice', name: 'Alice', avatar: 'alice.jpg' },
      messages: [{ id: 'm1', type: 'text', content: '评审地点在三号会议室', senderId: 'wx_alice', timestamp: 1000 }],
    }];

    beforeEach(() => {
      useWechatStore.setState({
        contacts,
        chats,
        moments: [],
        textMomentDraft: { content: '', location: null },
      });
    });

    it('searches contacts and bounded message content', async () => {
      const contactsResult = await api.callTool('wechat__search_contacts', { query: '项目' });
      expect(contactsResult).toMatchObject({ ok: true, output: { total: 1 } });
      const messagesResult = await api.callTool('wechat__search_messages', { query: '会议室' });
      expect(messagesResult).toMatchObject({ ok: true, output: { total: 1 } });
      expect(JSON.stringify(messagesResult)).not.toContain('blocked.jpg');
    });

    it('sends through the real send action and rejects blacklisted recipients', async () => {
      const sent = await api.callTool('wechat__send_text_message', { contact_id: 'wx_alice', text: '收到' });
      expect(sent.ok).toBe(true);
      expect(useWechatStore.getState().chats[0].messages.at(-1)?.content).toBe('收到');
      const blocked = await api.callTool('wechat__send_text_message', { contact_id: 'wx_blocked', text: 'test' });
      expect(blocked).toMatchObject({ ok: false, error: { code: 'PERMISSION_DENIED' } });
    });

    it('opens chats and prepares an unsent Moments draft', async () => {
      const opened = await api.callTool('wechat__open_chat', { contact_id: 'wx_alice' });
      expect(opened.ok).toBe(true);
      expect(routes.get('wechat')).toBe('/chat/wx_alice');
      const beforeMoments = useWechatStore.getState().moments;
      const draft = await api.callTool('wechat__prepare_moment_draft', { text: '项目完成', location: '办公室' });
      expect(draft).toMatchObject({ ok: true, output: { persisted: false } });
      expect(routes.get('wechat')).toBe('/post-text-moment');
      expect(useWechatStore.getState().moments).toEqual(beforeMoments);
      expect(useWechatStore.getState().textMomentDraft).toMatchObject({ content: '项目完成', location: '办公室' });
    });
  });

  describe('Taobao Instant', () => {
    beforeEach(() => {
      useTbsgStore.setState({ cart: [], checkoutDraft: null });
    });

    it('searches catalog data and returns menu SKU contracts', async () => {
      const first = useTbsgStore.getState().items[0];
      const result = await api.callTool('tbsg__search_items', { query: first.name, limit: 1 });
      expect(result).toMatchObject({ ok: true, output: { total: expect.any(Number) } });
      const menu = await api.callTool('tbsg__get_shop_menu', { shop_id: first.shopId, limit: 20 });
      expect(menu.ok).toBe(true);
      expect(JSON.stringify(menu)).toContain(first.id);
    });

    it('adds a non-SKU item using store pricing rather than caller pricing', async () => {
      const item = useTbsgStore.getState().items.find((entry) => !entry.skuGroups)!;
      const result = await api.callTool('tbsg__add_item_to_cart', { item_id: item.id, quantity: 2 });
      expect(result).toMatchObject({ ok: true, output: { item_id: item.id, quantity: 2, unit_price: item.price } });
      expect(useTbsgStore.getState().cart).toHaveLength(1);
    });

    it('validates SKU labels and derives the same description and price as the GUI sheet', async () => {
      const item = useTbsgStore.getState().items.find((entry) => entry.skuGroups?.length)!;
      const options = item.skuGroups!.filter((group) => group.type === 'single').map((group) => group.options[0].label);
      const expectedDelta = item.skuGroups!.flatMap((group) => group.options).filter((option) => options.includes(option.label)).reduce((sum, option) => sum + option.delta, 0);
      const result = await api.callTool('tbsg__add_item_to_cart', { item_id: item.id, options });
      expect(result).toMatchObject({ ok: true, output: { item_id: item.id, unit_price: Math.round((item.price + expectedDelta) * 100) / 100 } });
      const invalid = await api.callTool('tbsg__add_item_to_cart', { item_id: item.id, options: ['not-a-real-option'] });
      expect(invalid).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });
    });

    it('prepares checkout without creating an order', async () => {
      const item = useTbsgStore.getState().items.find((entry) => !entry.skuGroups)!;
      useTbsgStore.getState().addToCart(item.id, null, item.price, 1);
      const beforeOrders = useTbsgStore.getState().orders.map((order) => order.id);
      const result = await api.callTool('tbsg__prepare_checkout', { shop_id: item.shopId });
      expect(result).toMatchObject({ ok: true, output: { persisted: false, line_count: 1 } });
      expect(routes.get('tbsg')).toBe('/checkout');
      expect(useTbsgStore.getState().orders.map((order) => order.id)).toEqual(beforeOrders);
      expect(useTbsgStore.getState().checkoutDraft).not.toBeNull();
    });
  });

  describe('Days Matter', () => {
    const notebooks: DMNotebook[] = [
      { id: 'nb_work', name: '工作', icon: 'W', cover: 'cover_work', isSystem: false, order: 0 },
    ];
    const events: DMEvent[] = [{
      id: 'dm_review', title: '项目评审', targetDate: Date.UTC(2026, 6, 20), notebookId: 'nb_work',
      calendar: 'solar', pinned: false, showOnHome: true, repeat: 'none', reminder: 'none', plusOne: false,
      hasEndDate: false, endDate: null, parentId: null, archived: false, createdAt: Date.UTC(2026, 6, 1),
    }];

    beforeEach(() => useDaysmatterStore.setState({ events, notebooks, filter: { kind: 'home' }, _temp: { toast: null, toastSeq: 0, draft: null } }));

    it('searches, counts, and navigates to events', async () => {
      expect(await api.callTool('daysmatter__search_events', { query: '评审' })).toMatchObject({ ok: true, output: { total: 1 } });
      const opened = await api.callTool('daysmatter__open_event', { event_id: 'dm_review' });
      expect(opened.ok).toBe(true);
      expect(routes.get('daysmatter')).toBe('/event/dm_review');
    });

    it('prepares a form without persisting and archives reversibly', async () => {
      const beforeIds = useDaysmatterStore.getState().events.map((event) => event.id);
      const draft = await api.callTool('daysmatter__prepare_event_draft', { title: '发布日', target_date: '2026-07-30', notebook_id: 'nb_work' });
      expect(draft).toMatchObject({ ok: true, output: { persisted: false } });
      expect(routes.get('daysmatter')).toBe('/event/add');
      expect(useDaysmatterStore.getState().events.map((event) => event.id)).toEqual(beforeIds);
      expect(useDaysmatterStore.getState()._temp.draft?.title).toBe('发布日');
      expect(await api.callTool('daysmatter__archive_event', { event_id: 'dm_review' })).toMatchObject({ ok: true, output: { archived: true } });
      expect(useDaysmatterStore.getState().events[0].archived).toBe(true);
    });

    it('rejects impossible dates without changing state', async () => {
      const before = useDaysmatterStore.getState()._temp.draft;
      const result = await api.callTool('daysmatter__prepare_event_draft', { title: 'bad', target_date: '2026-02-30' });
      expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });
      expect(useDaysmatterStore.getState()._temp.draft).toEqual(before);
    });
  });

  describe('Clock', () => {
    const alarms: Alarm[] = [{ id: 'alarm_1', hour: 8, minute: 30, enabled: true, repeat: 'weekday', note: '上班', vibrate: true, autoDelete: false }];
    beforeEach(() => useClockStore.setState({ alarms, selectedCityIds: [] }));

    it('creates and toggles alarms through manager-backed store actions', async () => {
      const created = await api.callTool('clock__create_alarm', { hour: 9, minute: 15, label: '会议', repeat: 'once' });
      expect(created.ok).toBe(true);
      expect(useClockStore.getState().alarms).toHaveLength(2);
      const disabled = await api.callTool('clock__set_alarm_enabled', { alarm_id: 'alarm_1', enabled: false });
      expect(disabled).toMatchObject({ ok: true, output: { enabled: false } });
    });

    it('searches world cities, adds one idempotently, and reports its time', async () => {
      const search = await api.callTool('clock__search_world_cities', { query: 'GMT', limit: 1 });
      expect(search.ok).toBe(true);
      if (!search.ok) return;
      const cityId = (search.output as any).cities[0].city_id;
      expect(await api.callTool('clock__add_world_city', { city_id: cityId })).toMatchObject({ ok: true, output: { added: true } });
      expect(await api.callTool('clock__add_world_city', { city_id: cityId })).toMatchObject({ ok: true, output: { added: false } });
      const times = await api.callTool('clock__get_world_times', {});
      expect(times).toMatchObject({ ok: true, output: { cities: [expect.objectContaining({ city_id: cityId })] } });
    });

    it('opens timer only after its route is ready', async () => {
      expect(await api.callTool('clock__open_timer', {})).toMatchObject({ ok: true, output: { route: '/timer' } });
      expect(routes.get('clock')).toBe('/timer');
    });
  });

  describe('Notes', () => {
    const folders: NotesFolder[] = [{ id: 'all', name: '全部', system: true }, { id: 'unfiled', name: '未分类', system: true }, { id: 'work', name: '工作' }];
    const notes: Note[] = [
      { id: 'note_public', title: '评审纪要', content: '地点三号会议室', updatedAt: 2000, folderId: 'work' },
      { id: 'note_private', title: '密码', content: 'secret', updatedAt: 3000, folderId: 'unfiled', isPrivate: true },
      { id: 'note_trash', title: '已删除', content: 'trash', updatedAt: 1000, folderId: 'unfiled', trashedAt: 1000 },
    ];
    const todos: NotesTodo[] = [{ id: 'todo_1', text: '整理会议纪要', completed: false, updatedAt: 2000 }];
    beforeEach(() => useNotesStore.setState({ notes, todos, folders, selectedFolderId: 'all' }));

    it('keeps private and trashed notes outside search results', async () => {
      expect(await api.callTool('notes__search_notes', { query: '会议室' })).toMatchObject({ ok: true, output: { total: 1 } });
      expect(await api.callTool('notes__search_notes', { query: 'secret' })).toMatchObject({ ok: true, output: { total: 0 } });
      expect(await api.callTool('notes__open_note', { note_id: 'note_private' })).toMatchObject({ ok: false, error: { code: 'NOTE_NOT_FOUND' } });
    });

    it('creates notes and to-dos through existing actions', async () => {
      const note = await api.callTool('notes__create_note', { title: '新纪要', content: '待发送', folder_id: 'work' });
      expect(note.ok).toBe(true);
      expect(useNotesStore.getState().notes.some((item) => item.title === '新纪要')).toBe(true);
      const todo = await api.callTool('notes__create_todo', { text: '发送纪要' });
      expect(todo.ok).toBe(true);
      if (!todo.ok) return;
      const todoId = (todo.output as any).todo_id;
      expect(await api.callTool('notes__set_todo_completed', { todo_id: todoId, completed: true })).toMatchObject({ ok: true, output: { completed: true } });
    });

    it('opens a folder with selected state already applied', async () => {
      expect(await api.callTool('notes__open_folder', { folder_id: 'work' })).toMatchObject({ ok: true, output: { route: '/' } });
      expect(useNotesStore.getState().selectedFolderId).toBe('work');
      expect(routes.get('notes')).toBe('/');
    });
  });

  it('rejects extra arguments before any state change', async () => {
    const before = useClockStore.getState().alarms;
    const result = await api.callTool('clock__open_timer', { hidden_state: true });
    expect(result).toMatchObject({ ok: false, error: { code: 'INVALID_ARGUMENT' } });
    expect(useClockStore.getState().alarms).toEqual(before);
  });
});

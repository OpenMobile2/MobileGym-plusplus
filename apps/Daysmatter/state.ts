import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { createT } from './i18n';
import { DAYSMATTER_CONFIG } from './data';
import { DATA_VERSION } from './constants';
import type { DMState, DMActions, DMEvent, DMNotebook, HomeFilter } from './types';

interface PersistMeta {
  _dataVersion: number;
}

type FullState = DMState & PersistMeta;

const initialState: FullState = {
  _dataVersion: DATA_VERSION,
  user: { ...DAYSMATTER_CONFIG.user },
  events: DAYSMATTER_CONFIG.events.map((e) => ({ ...e })),
  notebooks: DAYSMATTER_CONFIG.notebooks.map((n) => ({ ...n })),
  settings: { ...DAYSMATTER_CONFIG.settings },
  filter: DAYSMATTER_CONFIG.filter,
  widgetEventId: DAYSMATTER_CONFIG.widgetEventId,
  _temp: { toast: null, toastSeq: 0, draft: null },
};

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

export const useDaysmatterStore = createAppStoreWithActions<FullState, DMActions>(
  'daysmatter',
  initialState,
  (set) => ({
    showToast: (msg: string) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),

    initDraft: (d) => set((s) => ({ _temp: { ...s._temp, draft: d } })),
    patchDraft: (patch) =>
      set((s) => ({ _temp: { ...s._temp, draft: s._temp.draft ? { ...s._temp.draft, ...patch } : s._temp.draft } })),
    clearDraft: () => set((s) => ({ _temp: { ...s._temp, draft: null } })),

    addEvent: (e: Partial<DMEvent>) => {
      const id = genId('e');
      const now = TimeService.now();
      set((s) => {
        const t = createT(s.settings.locale ?? 'zh');
        const ev: DMEvent = {
          id,
          title: e.title && e.title.trim() ? e.title.trim() : t('common.unnamed'),
          targetDate: e.targetDate ?? now,
          notebookId: e.notebookId ?? 'nb_life',
          calendar: e.calendar ?? 'solar',
          pinned: e.pinned ?? false,
          showOnHome: e.showOnHome ?? true,
          repeat: e.repeat ?? 'none',
          reminder: e.reminder ?? 'none',
          plusOne: e.plusOne ?? false,
          hasEndDate: e.hasEndDate ?? false,
          endDate: e.endDate ?? null,
          parentId: e.parentId ?? null,
          archived: false,
          createdAt: now,
        };
        return { events: [ev, ...s.events] };
      });
      return id;
    },

    updateEvent: (id, patch) =>
      set((s) => ({
        events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      })),

    deleteEvent: (id) =>
      set((s) => ({ events: s.events.filter((e) => e.id !== id && e.parentId !== id) })),

    setArchived: (id, archived) =>
      set((s) => ({
        events: s.events.map((e) =>
          e.id === id ? { ...e, archived, showOnHome: archived ? false : e.showOnHome } : e,
        ),
      })),

    togglePin: (id) =>
      set((s) => ({
        events: s.events.map((e) => (e.id === id ? { ...e, pinned: !e.pinned } : e)),
      })),

    addNotebook: (n: Partial<DMNotebook>) => {
      const id = genId('nb');
      set((s) => {
        const t = createT(s.settings.locale ?? 'zh');
        return {
          notebooks: [
            ...s.notebooks,
            {
              id,
              name: n.name && n.name.trim() ? n.name.trim() : t('notebook.newDefault'),
              icon: n.icon ?? '📔',
              cover: n.cover ?? 'cover_warm',
              isSystem: false,
              order: s.notebooks.length,
            },
          ],
        };
      });
      return id;
    },

    updateNotebook: (id, patch) =>
      set((s) => ({
        notebooks: s.notebooks.map((n) => (n.id === id ? { ...n, ...patch } : n)),
      })),

    deleteNotebook: (id) =>
      set((s) => {
        const nb = s.notebooks.find((n) => n.id === id);
        if (!nb || nb.isSystem) return {} as Partial<FullState>;
        // 连带删除本子内的事件,以及这些事件下的小倒数日
        const removedIds = new Set(s.events.filter((e) => e.notebookId === id).map((e) => e.id));
        return {
          notebooks: s.notebooks.filter((n) => n.id !== id),
          events: s.events.filter(
            (e) => e.notebookId !== id && !(e.parentId && removedIds.has(e.parentId)),
          ),
        };
      }),

    reorderNotebook: (id, dir) =>
      set((s) => {
        const list = [...s.notebooks].sort((a, b) => a.order - b.order);
        const idx = list.findIndex((n) => n.id === id);
        const swap = idx + dir;
        if (idx < 0 || swap < 0 || swap >= list.length) return {} as Partial<FullState>;
        const a = list[idx];
        const b = list[swap];
        return {
          notebooks: s.notebooks.map((n) => {
            if (n.id === a.id) return { ...n, order: b.order };
            if (n.id === b.id) return { ...n, order: a.order };
            return n;
          }),
        };
      }),

    moveNotebook: (id, toIndex) =>
      set((s) => {
        const list = [...s.notebooks].sort((a, b) => a.order - b.order);
        const from = list.findIndex((n) => n.id === id);
        if (from < 0) return {} as Partial<FullState>;
        const clamped = Math.max(0, Math.min(toIndex, list.length - 1));
        if (clamped === from) return {} as Partial<FullState>;
        const [moved] = list.splice(from, 1);
        list.splice(clamped, 0, moved);
        const orderById = new Map(list.map((n, i) => [n.id, i]));
        return {
          notebooks: s.notebooks.map((n) => ({ ...n, order: orderById.get(n.id) ?? n.order })),
        };
      }),

    setFilter: (f: HomeFilter) => set(() => ({ filter: f })),

    patchSettings: (patch) =>
      set((s) => ({ settings: { ...s.settings, ...patch } })),

    setWidgetEvent: (eventId) => set(() => ({ widgetEventId: eventId })),

    login: (name?: string) =>
      set((s) => ({ user: { loggedIn: true, name: name && name.trim() ? name.trim() : s.user.name } })),

    logout: () => set(() => ({ user: { loggedIn: false, name: DAYSMATTER_CONFIG.user.name } })),
  }),
  {
    afterHydration: () => {
      // persist 对同步 storage 在 create() 期间同步完成,此时 `const useDaysmatterStore = …`
      // 尚未赋值,直接引用会触发 TDZ。用 queueMicrotask 延迟到赋值之后。
      queueMicrotask(() => {
        const s = useDaysmatterStore.getState();
        if (s._dataVersion !== DATA_VERSION) {
          useDaysmatterStore.setState({ ...initialState });
        }
      });
    },
  },
);

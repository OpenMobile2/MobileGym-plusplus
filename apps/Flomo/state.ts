import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { FLOMO_CONFIG } from './data';
import type { FlomoState, FlomoActions, FlomoMemo, FlomoSettings } from './types';

const initialState: FlomoState = {
  ...JSON.parse(JSON.stringify(FLOMO_CONFIG)),
  currentMemoId: null,
  currentTagId: null,
  currentFilter: null,
  currentDate: null,
  selectedMemoIds: [],
  composeMode: 'new',
  composeDraft: '',
  composeDraftImages: [],
  searchQuery: '',
  searchRecents: [],
  searchFilters: [],
  sortBy: 'created',
  sortOrder: 'newest',
  lastDeleted: null,
  previewImage: null,
  payPlan: 'monthly',
  lastToast: null,
};

let seq = 0;
const newId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

export const useFlomoStore = createAppStoreWithActions<FlomoState, FlomoActions>(
  manifest.id,
  initialState,
  (set) => ({
    addMemo: (content, opts) =>
      set((s) => {
        const now = TimeService.now();
        const memo: FlomoMemo = {
          id: newId('m'),
          content,
          createdAt: now,
          updatedAt: now,
          tags: opts?.tags ?? [],
          images: opts?.images ?? [],
          hasLink: /https?:\/\//.test(content),
          hasAudio: false,
          source: 'app',
          sourceMemoId: opts?.sourceMemoId ?? null,
          pinned: false,
          deleted: false,
        };
        return { memos: [memo, ...s.memos] };
      }),

    updateMemo: (id, content) =>
      set((s) => ({
        memos: s.memos.map((m) =>
          m.id === id ? { ...m, content, updatedAt: TimeService.now() } : m,
        ),
      })),

    deleteMemo: (id) =>
      set((s) => ({
        memos: s.memos.map((m) => (m.id === id ? { ...m, deleted: true } : m)),
        lastDeleted: [id],
      })),

    deleteMemos: (ids) =>
      set((s) => ({
        memos: s.memos.map((m) => (ids.includes(m.id) ? { ...m, deleted: true } : m)),
        lastDeleted: ids,
      })),

    undoDelete: () =>
      set((s) => {
        if (!s.lastDeleted) return {};
        const ids = s.lastDeleted;
        return {
          memos: s.memos.map((m) => (ids.includes(m.id) ? { ...m, deleted: false } : m)),
          lastDeleted: null,
        };
      }),

    restoreMemo: (id) =>
      set((s) => ({
        memos: s.memos.map((m) => (m.id === id ? { ...m, deleted: false } : m)),
      })),

    purgeMemo: (id) =>
      set((s) => ({ memos: s.memos.filter((m) => m.id !== id) })),

    duplicateMemo: (id) =>
      set((s) => {
        const src = s.memos.find((m) => m.id === id);
        if (!src) return {};
        const now = TimeService.now();
        const copy: FlomoMemo = { ...src, id: newId('m'), createdAt: now, updatedAt: now, pinned: false };
        return { memos: [copy, ...s.memos] };
      }),

    togglePin: (id) =>
      set((s) => ({
        memos: s.memos.map((m) => (m.id === id ? { ...m, pinned: !m.pinned } : m)),
      })),

    addTagToMemos: (memoIds, tagName) =>
      set((s) => {
        const tag = s.tags.find((t) => t.name === tagName);
        const tagId = tag ? tag.id : newId('t');
        const tags = tag ? s.tags : [...s.tags, { id: tagId, name: tagName, parentId: null, count: 0 }];
        return {
          tags,
          memos: s.memos.map((m) =>
            memoIds.includes(m.id) && !m.tags.includes(tagId)
              ? { ...m, tags: [...m.tags, tagId], updatedAt: TimeService.now() }
              : m,
          ),
        };
      }),

    renameTag: (id, name) =>
      set((s) => ({ tags: s.tags.map((t) => (t.id === id ? { ...t, name } : t)) })),

    deleteTag: (id, alsoDeleteMemos) =>
      set((s) => ({
        tags: s.tags.filter((t) => t.id !== id),
        memos: alsoDeleteMemos
          ? s.memos.map((m) => (m.tags.includes(id) ? { ...m, deleted: true } : m))
          : s.memos.map((m) =>
              m.tags.includes(id) ? { ...m, tags: m.tags.filter((t) => t !== id) } : m,
            ),
      })),

    setTheme: (theme) =>
      set((s) => ({ settings: { ...s.settings, theme } })),

    setSetting: (key, value) =>
      set((s) => ({ settings: { ...s.settings, [key]: value } as FlomoSettings })),

    markNotificationsRead: () =>
      set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),

    setCurrentMemo: (id) => set(() => ({ currentMemoId: id })),
    setCurrentTag: (id) => set(() => ({ currentTagId: id })),
    setCurrentFilter: (f) => set(() => ({ currentFilter: f })),
    setCurrentDate: (d) => set(() => ({ currentDate: d })),
    setCompose: (mode, memoId) =>
      set((s) => {
        const m = memoId ? s.memos.find((x) => x.id === memoId) : null;
        // 新建:保留已有草稿(关闭未发送时不丢);编辑:载入原文;批注:空白
        if (mode === 'new') return { composeMode: mode, currentMemoId: memoId };
        if (mode === 'edit' && m)
          return { composeMode: mode, currentMemoId: memoId, composeDraft: m.content, composeDraftImages: [...m.images] };
        return { composeMode: mode, currentMemoId: memoId, composeDraft: '', composeDraftImages: [] };
      }),
    setDraft: (text) => set(() => ({ composeDraft: text })),
    insertDraft: (snippet) => set((s) => ({ composeDraft: s.composeDraft + snippet })),
    addDraftImage: (src) =>
      set((s) => ({ composeDraftImages: [...s.composeDraftImages, src] })),
    clearDraft: () => set(() => ({ composeDraft: '', composeDraftImages: [] })),
    removeDraftImage: (src) =>
      set((s) => ({ composeDraftImages: s.composeDraftImages.filter((x) => x !== src) })),
    setSearchQuery: (q) =>
      set((s) => {
        const t = q.trim();
        return {
          searchQuery: q,
          searchRecents: t
            ? [t, ...s.searchRecents.filter((x) => x !== t)].slice(0, 8)
            : s.searchRecents,
        };
      }),
    toggleSearchFilter: (id) =>
      set((s) => ({
        searchFilters: s.searchFilters.includes(id)
          ? s.searchFilters.filter((x) => x !== id)
          : [...s.searchFilters, id],
      })),
    setSort: (by, order) => set(() => ({ sortBy: by, sortOrder: order })),
    setPreviewImage: (src) => set(() => ({ previewImage: src })),
    setPayPlan: (p) => set(() => ({ payPlan: p })),
    paySuccess: () =>
      set((s) => {
        const days = s.payPlan === 'yearly' ? 366 : 31;
        const d = TimeService.fromTimestamp(TimeService.now() + days * 86400000);
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        return {
          user: {
            ...s.user,
            pro: true,
            proExpire: `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`,
          },
        };
      }),
    toast: (msg) => set(() => ({ lastToast: msg })),
    toggleSelectMemo: (id) =>
      set((s) => ({
        selectedMemoIds: s.selectedMemoIds.includes(id)
          ? s.selectedMemoIds.filter((x) => x !== id)
          : [...s.selectedMemoIds, id],
      })),
    clearSelection: () => set(() => ({ selectedMemoIds: [] })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<FlomoState>;
    },
  },
);

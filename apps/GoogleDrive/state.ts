// apps/GoogleDrive/state.ts — Google 云端硬盘运行时状态
import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { GOOGLEDRIVE_CONFIG } from './data';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import type { AccessRole, DriveItem, GoogleDriveActions, GoogleDriveState } from './types';
import { buildShareLink } from './utils/shareLink';

const C = GOOGLEDRIVE_CONFIG as unknown as GoogleDriveState;

const initialState: GoogleDriveState = {
  user: C.user,
  contacts: C.contacts,
  items: C.items,
  starredIds: C.starredIds,
  offlineIds: C.offlineIds,
  trashedIds: C.trashedIds,
  trashedAt: C.trashedAt,
  recentIds: C.recentIds,
  spamIds: C.spamIds,
  uploads: C.uploads,
  storage: C.storage,
  view: C.view,
  sort: C.sort,
  searchSort: C.searchSort,
  searchQuery: C.searchQuery,
  searchFilters: C.searchFilters,
  recentQueries: C.recentQueries,
  selectedIds: C.selectedIds,
  notify: C.notify,
  pendingUpload: C.pendingUpload,
  geminiTurns: C.geminiTurns,
};

const without = (arr: string[], id: string) => arr.filter(x => x !== id);
const toggle = (arr: string[], id: string) => (arr.includes(id) ? without(arr, id) : [...arr, id]);

/**
 * 生成新条目 id。刻意不用时间戳：TimeService 之外的时间源被 ESLint 禁止，
 * 而 TimeService.now() 在同一毫秒内连续建两个文件会撞 id。改用「前缀 + 递增序号」。
 */
function nextId(items: Record<string, DriveItem>, prefix: string) {
  let n = 1;
  while (items[`${prefix}${n}`]) n += 1;
  return `${prefix}${n}`;
}

/** 移入回收站时一并从星标/离线/最近里摘掉，避免出现「回收站里的文件还在星标列表」 */
function detach(state: GoogleDriveState, id: string) {
  return {
    starredIds: without(state.starredIds, id),
    offlineIds: without(state.offlineIds, id),
    recentIds: without(state.recentIds, id),
    selectedIds: without(state.selectedIds, id),
  };
}

export const useGoogleDriveStore = createAppStoreWithActions<GoogleDriveState, GoogleDriveActions>(
  manifest.id,
  initialState,
  (set) => ({
    toggleStar: (id) => set((s) => ({ starredIds: toggle(s.starredIds, id) })),
    toggleOffline: (id) => set((s) => ({ offlineIds: toggle(s.offlineIds, id) })),

    rename: (id, name) =>
      set((s) => {
        const it = s.items[id];
        if (!it || !name.trim()) return {};
        return { items: { ...s.items, [id]: { ...it, name: name.trim() } } };
      }),

    move: (id, parentId) =>
      set((s) => {
        const it = s.items[id];
        if (!it) return {};
        return { items: { ...s.items, [id]: { ...it, parentId } } };
      }),

    // 副本名由调用处按当前语言传入（原先在这里硬编码「的副本」，英文界面会串中文）
    duplicate: (id, copyName) =>
      set((s) => {
        const it = s.items[id];
        if (!it) return {};
        const newId = nextId(s.items, 'copy_');
        return {
          items: {
            ...s.items,
            [newId]: { ...it, id: newId, name: copyName },
          },
        };
      }),

    moveToTrash: (id) =>
      set((s) => {
        if (!s.items[id]) return {};
        return {
          ...detach(s, id),
          trashedIds: [id, ...without(s.trashedIds, id)],
          trashedAt: { ...s.trashedAt, [id]: TimeService.now() },
        };
      }),

    moveManyToTrash: (ids) =>
      set((s) => {
        const valid = ids.filter(id => s.items[id]);
        const trashedAt = { ...s.trashedAt };
        const at = TimeService.now();
        for (const id of valid) trashedAt[id] = at;
        return {
          starredIds: s.starredIds.filter(x => !valid.includes(x)),
          offlineIds: s.offlineIds.filter(x => !valid.includes(x)),
          recentIds: s.recentIds.filter(x => !valid.includes(x)),
          selectedIds: [],
          trashedIds: [...valid, ...s.trashedIds.filter(x => !valid.includes(x))],
          trashedAt,
        };
      }),

    restore: (id) =>
      set((s) => {
        const trashedAt = { ...s.trashedAt };
        delete trashedAt[id];
        return { trashedIds: without(s.trashedIds, id), trashedAt };
      }),

    deleteForever: (id) =>
      set((s) => {
        const items = { ...s.items };
        delete items[id];
        const trashedAt = { ...s.trashedAt };
        delete trashedAt[id];
        return { items, trashedIds: without(s.trashedIds, id), trashedAt };
      }),

    emptyTrash: () =>
      set((s) => {
        const items = { ...s.items };
        for (const id of s.trashedIds) delete items[id];
        return { items, trashedIds: [], trashedAt: {} };
      }),

    createFolder: (name, parentId, fallbackName) =>
      set((s) => {
        const trimmed = name.trim() || fallbackName;
        const newId = nextId(s.items, 'folder_');
        const at = TimeService.now();
        const folder: DriveItem = {
          id: newId,
          name: trimmed,
          kind: 'folder',
          parentId,
          modifiedAt: at,
          createdAt: at,
          size: 0,
          uploadedByMe: true,
          ownerName: null,
          color: null,
          sharedFolder: false,
        };
        return { items: { ...s.items, [newId]: folder } };
      }),

    createDocument: (kind, parentId, fallbackName) => {
      let createdId = '';
      set((s) => {
        const newId = nextId(s.items, `${kind}_`);
        createdId = newId;
        const at = TimeService.now();
        const emptyPreview =
          kind === 'doc'
            ? { kind: 'doc' as const, title: fallbackName, paragraphs: [''] }
            : kind === 'sheet'
              ? { kind: 'sheet' as const, title: fallbackName, columns: ['A', 'B', 'C'], rows: [['', '', '']] }
              : { kind: 'slide' as const, title: fallbackName, slides: [{ heading: fallbackName, bullets: [] }] };
        const item: DriveItem = {
          id: newId,
          name: fallbackName,
          kind,
          parentId,
          modifiedAt: at,
          createdAt: at,
          size: 4 * 1024,
          uploadedByMe: true,
          ownerName: null,
          color: null,
          sharedFolder: false,
          linkAccess: 'restricted',
          linkRole: 'viewer',
          shareLink: buildShareLink(newId),
          preview: emptyPreview,
        };
        return {
          items: { ...s.items, [newId]: item },
          recentIds: [newId, ...s.recentIds],
        };
      });
      return createdId;
    },

    setFolderColor: (id, color) =>
      set((s) => {
        const it = s.items[id];
        if (!it) return {};
        return { items: { ...s.items, [id]: { ...it, color } } };
      }),

    setLinkAccess: (id, linkAccess, linkRole) =>
      set((s) => {
        const it = s.items[id];
        if (!it) return {};
        return {
          items: {
            ...s.items,
            [id]: {
              ...it,
              linkAccess,
              linkRole: linkRole ?? it.linkRole ?? 'viewer',
              // 切到「任何人有链接」时确保该文档已有独立链接
              shareLink: it.shareLink ?? buildShareLink(id),
            },
          },
        };
      }),

    ensureAccessDefaults: (id) =>
      set((s) => {
        const it = s.items[id];
        if (!it) return {};
        const roles: AccessRole[] = ['viewer', 'commenter', 'editor'];
        const shareLink = it.shareLink || buildShareLink(id);
        // 空数组也算未初始化（新建文档曾写过 collaborators: []）
        const collaborators = (it.collaborators && it.collaborators.length > 0)
          ? it.collaborators
          : s.contacts.slice(0, 3).map((c, i) => ({
              contactId: c.id,
              role: roles[i % roles.length],
            }));
        const linkAccess = it.linkAccess ?? 'restricted';
        const linkRole = it.linkRole ?? 'viewer';
        if (
          it.shareLink === shareLink
          && it.collaborators === collaborators
          && it.linkAccess === linkAccess
          && it.linkRole === linkRole
        ) return {};
        return {
          items: {
            ...s.items,
            [id]: { ...it, shareLink, collaborators, linkAccess, linkRole },
          },
        };
      }),

    setCollaboratorRole: (id, contactId, role) =>
      set((s) => {
        const it = s.items[id];
        if (!it) return {};
        const list = it.collaborators ?? [];
        const next = list.some(c => c.contactId === contactId)
          ? list.map(c => (c.contactId === contactId ? { ...c, role } : c))
          : [...list, { contactId, role }];
        return { items: { ...s.items, [id]: { ...it, collaborators: next } } };
      }),

    removeCollaborator: (id, contactId) =>
      set((s) => {
        const it = s.items[id];
        if (!it?.collaborators) return {};
        return {
          items: {
            ...s.items,
            [id]: { ...it, collaborators: it.collaborators.filter(c => c.contactId !== contactId) },
          },
        };
      }),

    setView: (view) => set(() => ({ view })),
    setSort: (field, order) => set(() => ({ sort: { field, order } })),
    setSearchSort: (field, order) => set(() => ({ searchSort: { field, order } })),
    setSearchQuery: (q) => set(() => ({ searchQuery: q })),

    setSearchFilter: (kind, value) =>
      set((s) => ({ searchFilters: { ...s.searchFilters, [kind]: value } })),
    clearSearchFilters: () =>
      set(() => ({ searchFilters: { type: null, people: null, modified: null } })),

    pushRecentQuery: (q) =>
      set((s) => {
        const trimmed = q.trim();
        if (!trimmed) return {};
        return { recentQueries: [trimmed, ...without(s.recentQueries, trimmed)].slice(0, 8) };
      }),

    toggleSelect: (id) => set((s) => ({ selectedIds: toggle(s.selectedIds, id) })),
    selectAll: (ids) => set(() => ({ selectedIds: [...ids] })),
    clearSelection: () => set(() => ({ selectedIds: [] })),

    toggleNotify: (key) => set((s) => ({ notify: { ...s.notify, [key]: !s.notify[key] } })),

    setPendingUpload: (name, kind, parentId, size) => set(() => ({ pendingUpload: { name, kind, parentId, size } })),
    renamePendingUpload: (name) =>
      set((s) => (s.pendingUpload ? { pendingUpload: { ...s.pendingUpload, name: name.trim() || s.pendingUpload.name } } : {})),
    setPendingUploadLocation: (parentId) =>
      set((s) => (s.pendingUpload ? { pendingUpload: { ...s.pendingUpload, parentId } } : {})),

    commitUpload: () =>
      set((s) => {
        const p = s.pendingUpload;
        if (!p) return {};
        const newId = nextId(s.items, 'upload_');
        const at = TimeService.now();
        const item: DriveItem = {
          id: newId,
          name: p.name,
          kind: p.kind,
          parentId: p.parentId,
          modifiedAt: at,
          createdAt: at,
          // 预置文件的 OS 元数据不带大小，取个合理默认值，避免详情页显示 0
          size: p.size > 0 ? p.size : 128 * 1024,
          uploadedByMe: true,
          ownerName: null,
          color: null,
          sharedFolder: false,
        };
        return {
          items: { ...s.items, [newId]: item },
          uploads: [{ id: newId, name: p.name, kind: p.kind, progress: 100 }, ...s.uploads],
          recentIds: [newId, ...s.recentIds],
          pendingUpload: null,
        };
      }),

    cancelUpload: (taskId) => set((s) => ({ uploads: s.uploads.filter(u => u.id !== taskId) })),

    askGemini: (q, a) => set((s) => ({ geminiTurns: [...s.geminiTurns, { q, a }] })),
    setUserAvatar: (avatar) => set((s) => ({ user: { ...s.user, avatar } })),
    expandStorage: (extraBytes) =>
      set((s) => ({
        storage: { ...s.storage, totalBytes: s.storage.totalBytes + Math.max(0, extraBytes) },
      })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<GoogleDriveState>;
    },
  },
);

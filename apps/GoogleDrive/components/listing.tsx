// apps/GoogleDrive/components/listing.tsx — 列表页共用的排序与副标题逻辑
import { useMemo } from 'react';
import * as TimeService from '@/os/TimeService';
import { useGoogleDriveStore } from '../state';
import type { DriveItem, ItemKind, SearchFilters, SortSetting } from '../types';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useDateFormat } from './common';

/**
 * 文件夹永远排在文件前面（真机行为），再按选定字段排。
 * trashedAt 是回收站专用维度（按「移入回收站的时间」排），不传就退回修改时间。
 */
export function sortItems(
  list: DriveItem[],
  sort: SortSetting,
  trashedAt?: Record<string, number>,
): DriveItem[] {
  const dir = sort.order === 'asc' ? 1 : -1;
  const stamp = (it: DriveItem) =>
    sort.field === 'trashed' ? (trashedAt?.[it.id] ?? it.modifiedAt) : it.modifiedAt;
  return [...list].sort((a, b) => {
    if (a.kind === 'folder' && b.kind !== 'folder') return -1;
    if (a.kind !== 'folder' && b.kind === 'folder') return 1;
    if (sort.field === 'name') return a.name.localeCompare(b.name, 'zh-Hans') * dir;
    return (stamp(a) - stamp(b)) * dir;
  });
}

/** 按扩展名判定条目类型（本机文件选择器 / 上传用） */
export function kindFromFileName(name: string): ItemKind {
  const ext = name.toLowerCase().split('.').pop() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'sheet';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'slide';
  return 'other';
}

/** 关键字匹配（大小写不敏感；中英文都按 includes，排除回收站内容） */
export function matchItems(items: Record<string, DriveItem>, trashed: string[], q: string): DriveItem[] {
  const key = q.trim().toLowerCase();
  if (!key) return [];
  return Object.values(items).filter(
    it => !trashed.includes(it.id) && it.name.toLowerCase().includes(key),
  );
}

/** 筛选项 id → 命中哪些 kind（与 FILTER_TYPE_OPTIONS 对应） */
const TYPE_TO_KINDS: Record<string, ItemKind[]> = {
  documents: ['doc', 'other'],
  spreadsheets: ['sheet'],
  presentations: ['slide'],
  photos: ['image'],
  forms: [],
  pdfs: ['pdf'],
  videos: [],
  shortcuts: [],
  folders: ['folder'],
};

/** 模拟数据里没有对应 kind 的类型（forms/videos/shortcuts）不可选，避免「选了永远空」 */
export function isSearchTypeSupported(typeId: string): boolean {
  return (TYPE_TO_KINDS[typeId] ?? []).length > 0;
}

/** 修改日期筛选项 → 相对今天的天数窗口；null 表示不限 */
function withinModified(item: DriveItem, kind: string, now: Date): boolean {
  const d = TimeService.fromTimestamp(item.modifiedAt);
  const dayMs = 24 * 60 * 60 * 1000;
  const diffDays = (now.getTime() - d.getTime()) / dayMs;
  switch (kind) {
    case 'today':
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    case 'last7': return diffDays <= 7;
    case 'last30': return diffDays <= 30;
    case 'thisyear': return d.getFullYear() === now.getFullYear();
    case 'lastyear': return d.getFullYear() === now.getFullYear() - 1;
    // custom 没有真实取值界面（只有一个确认按钮），按「不限」处理，避免出现「选了却筛不出东西」
    default: return true;
  }
}

/**
 * 把筛选条件真正作用到结果上。
 * 之前只画了 chip 的选中态、没过滤列表 —— 那属于「行为错误」，比不做更糟。
 */
export function applyFilters(list: DriveItem[], filters: SearchFilters): DriveItem[] {
  const now = TimeService.getDate();
  return list.filter(it => {
    if (filters.type) {
      const kinds = TYPE_TO_KINDS[filters.type] ?? [];
      if (!kinds.includes(it.kind)) return false;
    }
    if (filters.people && it.ownerName !== filters.people) return false;
    if (filters.modified && !withinModified(it, filters.modified, now)) return false;
    return true;
  });
}

/** 某个父文件夹下的可见条目（排除回收站内容） */
export function useChildren(parentId: string | null) {
  const items = useGoogleDriveStore(s => s.items);
  const trashed = useGoogleDriveStore(s => s.trashedIds);
  const sort = useGoogleDriveStore(s => s.sort);
  return useMemo(
    () => sortItems(
      Object.values(items).filter(it => {
        if (it.parentId !== parentId || trashed.includes(it.id)) return false;
        // 根目录「我的云端硬盘」不混入「别人分享给我」的条目（那些只在 Shared）
        if (parentId === null && it.ownerName) return false;
        return true;
      }),
      sort,
    ),
    [items, trashed, parentId, sort],
  );
}

/** 按 id 列表取条目并排序（星标 / 离线 / 最近使用 用） */
export function useItemsByIds(ids: string[], sort?: SortSetting) {
  const items = useGoogleDriveStore(s => s.items);
  const trashed = useGoogleDriveStore(s => s.trashedIds);
  const defaultSort = useGoogleDriveStore(s => s.sort);
  const effective = sort ?? defaultSort;
  return useMemo(
    () => sortItems(ids.map(id => items[id]).filter((it): it is DriveItem => Boolean(it) && !trashed.includes(it.id)), effective),
    [ids, items, trashed, effective],
  );
}

/** 列表行副标题：本人上传显示「你已上传 · 日期」，否则「修改时间 日期」 */
export function useSubtitle() {
  const s = useGoogleDriveStrings();
  const fmt = useDateFormat();
  return (item: DriveItem) =>
    item.uploadedByMe
      ? `${s.sub_you_uploaded} · ${fmt(item.modifiedAt)}`
      : `${s.sub_modified} ${fmt(item.modifiedAt)}`;
}

/** 排序 chip 上显示的字段名 */
export function useSortLabel() {
  const s = useGoogleDriveStrings();
  return (sort: SortSetting) => {
    const map: Record<string, string> = {
      name: s.sort_name,
      modified: s.sort_modified,
      modifiedByMe: s.sort_modified_by_me,
      openedByMe: s.sort_opened_by_me,
      relevance: s.sort_relevance,
      trashed: s.sort_trashed,
    };
    return map[sort.field] ?? s.sort_name;
  };
}

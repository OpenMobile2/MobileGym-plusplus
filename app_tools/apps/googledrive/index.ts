import { useGoogleDriveStore } from '@/apps/GoogleDrive/state';
import type { DriveItem } from '@/apps/GoogleDrive/types';
import { assertAllowedKeys, optionalString, requireString, ToolExecutionError } from '../../core/errors';
import { compactResult, getLimit, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { GOOGLEDRIVE_TOOL_DEFINITIONS } from './definitions';

const state = () => useGoogleDriveStore.getState();

function matchByName(query: string): DriveItem[] {
  const trash = new Set(state().trashedIds);
  return Object.values(state().items).filter(
    (item) => !trash.has(item.id) && includesQuery([item.name], query),
  );
}

function itemById(id: string): DriveItem {
  return requireFound(state().items[id], 'ITEM_NOT_FOUND', `Google Drive item not found: ${id}`);
}

function itemSummary(item: DriveItem) {
  return {
    item_id: item.id,
    name: item.name,
    kind: item.kind,
    parent_id: item.parentId,
    owner_name: item.ownerName,
    size: item.size,
    starred: state().starredIds.includes(item.id),
    offline: state().offlineIds.includes(item.id),
    trashed: state().trashedIds.includes(item.id),
  };
}

const handlers: Record<string, ToolHandler> = {
  googledrive__search: (input) => {
    assertAllowedKeys(input, ['query', 'limit']);
    const query = requireString(input, 'query', { maxLength: 200 });
    const rows = matchByName(query).map(itemSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  googledrive__list_folder: (input) => {
    assertAllowedKeys(input, ['folder_id', 'limit']);
    const folderId = optionalString(input, 'folder_id', { maxLength: 200 }) ?? null;
    if (folderId !== null) {
      const folder = itemById(folderId);
      if (folder.kind !== 'folder') {
        throw new ToolExecutionError('NOT_A_FOLDER', `Google Drive item is not a folder: ${folderId}`);
      }
    }
    const trash = new Set(state().trashedIds);
    const rows = Object.values(state().items)
      .filter((item) => !trash.has(item.id) && item.parentId === folderId)
      .map(itemSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  googledrive__list_starred: (input) => {
    assertAllowedKeys(input, ['limit']);
    const rows = state().starredIds
      .map((id) => state().items[id])
      .filter((item): item is DriveItem => Boolean(item))
      .map(itemSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  googledrive__get_item: (input) => {
    assertAllowedKeys(input, ['item_id']);
    return itemSummary(itemById(requireString(input, 'item_id', { maxLength: 200 })));
  },

  googledrive__open_item: async (input) => {
    assertAllowedKeys(input, ['item_id']);
    const item = itemById(requireString(input, 'item_id', { maxLength: 200 }));
    const route = item.kind === 'folder'
      ? `/folder/${encodeURIComponent(item.id)}`
      : `/preview/${encodeURIComponent(item.id)}`;
    await openAppRoute('googledrive', route);
    return { route, item_id: item.id };
  },

  googledrive__toggle_star: (input) => {
    assertAllowedKeys(input, ['item_id']);
    const item = itemById(requireString(input, 'item_id', { maxLength: 200 }));
    state().toggleStar(item.id);
    return { item_id: item.id, starred: state().starredIds.includes(item.id) };
  },

  googledrive__create_folder: (input) => {
    assertAllowedKeys(input, ['name', 'parent_id']);
    const name = requireString(input, 'name', { maxLength: 200 });
    const parentId = optionalString(input, 'parent_id', { maxLength: 200 }) ?? null;
    if (parentId !== null) {
      const parent = itemById(parentId);
      if (parent.kind !== 'folder') {
        throw new ToolExecutionError('NOT_A_FOLDER', `Google Drive item is not a folder: ${parentId}`);
      }
    }
    const before = new Set(Object.keys(state().items));
    state().createFolder(name, parentId, name);
    const created = Object.values(state().items).find((item) => !before.has(item.id));
    const folder = requireFound(created, 'FOLDER_NOT_CREATED', 'Google Drive folder was not created.');
    return itemSummary(folder);
  },

  googledrive__move_item: (input) => {
    assertAllowedKeys(input, ['item_id', 'dest_folder_id']);
    const item = itemById(requireString(input, 'item_id', { maxLength: 200 }));
    const dest = itemById(requireString(input, 'dest_folder_id', { maxLength: 200 }));
    if (dest.kind !== 'folder') {
      throw new ToolExecutionError('NOT_A_FOLDER', `Google Drive item is not a folder: ${dest.id}`);
    }
    state().move(item.id, dest.id);
    return itemSummary(itemById(item.id));
  },
};

export function executeGoogleDriveTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Google Drive tool: ${name}`)(input);
}

export { GOOGLEDRIVE_TOOL_DEFINITIONS } from './definitions';

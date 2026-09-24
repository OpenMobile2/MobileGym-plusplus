import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

export const GOOGLEDRIVE_TOOL_DEFINITIONS = defineAppTools('googledrive', [
  {
    name: 'search',
    description: 'Search Drive items by filename substring only. Preview body text is not searched. Query is required. Trash is excluded.',
    properties: { query: STRING, limit: LIMIT },
    required: ['query'],
  },
  {
    name: 'list_folder',
    description: 'List compact children of one folder. Omit folder_id for My Drive root. Trash is excluded. Does not return preview body.',
    properties: { folder_id: ID, limit: LIMIT },
  },
  {
    name: 'list_starred',
    description: 'List starred items with name, kind, and owner. Does not return preview body.',
    properties: { limit: LIMIT },
  },
  {
    name: 'get_item',
    description: 'Return compact metadata for one item: name, kind, parent, owner, size, starred, offline. Preview paragraphs and sheet cells are not returned; open_item to read them in the GUI.',
    properties: { item_id: ID },
    required: ['item_id'],
  },
  {
    name: 'open_item',
    description: 'Open a folder page or file preview. Read a fresh screenshot after this call.',
    properties: { item_id: ID },
    required: ['item_id'],
    kind: 'navigation',
  },
  {
    name: 'toggle_star',
    description: 'Star or unstar one item, matching the GUI star control.',
    properties: { item_id: ID },
    required: ['item_id'],
    kind: 'write',
  },
  {
    name: 'create_folder',
    description: 'Create one folder. Omit parent_id to create at My Drive root.',
    properties: { name: { ...STRING, maxLength: 200 }, parent_id: ID },
    required: ['name'],
    kind: 'write',
  },
  {
    name: 'move_item',
    description: 'Move one item into a destination folder.',
    properties: { item_id: ID, dest_folder_id: ID },
    required: ['item_id', 'dest_folder_id'],
    kind: 'write',
  },
]);

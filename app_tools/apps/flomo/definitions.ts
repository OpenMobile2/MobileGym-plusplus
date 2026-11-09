import { defineCatalogTools } from '../../core/catalog';

export const FLOMO_TOOL_DEFINITIONS = defineCatalogTools(
  'flomo',
  { field: 'memos', label: 'memos' },
  { field: 'tags', label: 'tags' },
);

import { defineCatalogTools } from '../../core/catalog';

export const XIANYU_TOOL_DEFINITIONS = defineCatalogTools(
  'xianyu',
  { field: 'items', label: 'second-hand listings' },
  { field: 'listings', label: 'published listings' },
);

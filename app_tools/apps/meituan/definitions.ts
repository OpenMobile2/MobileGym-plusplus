import { defineCatalogTools } from '../../core/catalog';

export const MEITUAN_TOOL_DEFINITIONS = defineCatalogTools(
  'meituan',
  { field: 'restaurants', label: 'restaurants and dishes' },
  { field: 'orders', label: 'orders' },
);

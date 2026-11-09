import { defineCatalogTools } from '../../core/catalog';

export const VIPSHOP_TOOL_DEFINITIONS = defineCatalogTools(
  'vipshop',
  { field: 'items', label: 'products' },
  { field: 'brands', label: 'brands' },
);

import { defineCatalogTools } from '../../core/catalog';

export const PINDUODUO_TOOL_DEFINITIONS = defineCatalogTools(
  'pinduoduo',
  { field: 'items', label: 'products' },
  { field: 'orders', label: 'orders' },
);

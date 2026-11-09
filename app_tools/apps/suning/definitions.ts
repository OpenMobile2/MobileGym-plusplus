import { defineCatalogTools } from '../../core/catalog';

export const SUNING_TOOL_DEFINITIONS = defineCatalogTools(
  'suning',
  { field: 'products', label: 'products' },
  { field: 'orders', label: 'orders' },
);

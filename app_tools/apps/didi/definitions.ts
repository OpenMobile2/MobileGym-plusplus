import { defineCatalogTools } from '../../core/catalog';

export const DIDI_TOOL_DEFINITIONS = defineCatalogTools(
  'didi',
  { field: 'orders', label: 'trip orders' },
  { field: 'coupons', label: 'coupons' },
);

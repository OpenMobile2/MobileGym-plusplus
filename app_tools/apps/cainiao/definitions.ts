import { defineCatalogTools } from '../../core/catalog';

export const CAINIAO_TOOL_DEFINITIONS = defineCatalogTools(
  'cainiao',
  { field: 'packages', label: 'packages' },
  { field: 'stations', label: 'pickup stations' },
);

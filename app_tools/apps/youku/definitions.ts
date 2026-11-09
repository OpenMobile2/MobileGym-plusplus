import { defineCatalogTools } from '../../core/catalog';

export const YOUKU_TOOL_DEFINITIONS = defineCatalogTools(
  'youku',
  { field: 'catalog', label: 'videos and series' },
  { field: 'ranks', label: 'rankings' },
);

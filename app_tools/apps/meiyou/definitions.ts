import { defineCatalogTools } from '../../core/catalog';

export const MEIYOU_TOOL_DEFINITIONS = defineCatalogTools(
  'meiyou',
  { field: 'posts', label: 'community posts' },
  { field: 'circles', label: 'circles' },
);

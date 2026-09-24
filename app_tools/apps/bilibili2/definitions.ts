import { defineCatalogTools } from '../../core/catalog';

export const BILIBILI2_TOOL_DEFINITIONS = defineCatalogTools(
  'bilibili2',
  { field: 'videos', label: 'videos' },
  { field: 'messages', label: 'messages' },
);

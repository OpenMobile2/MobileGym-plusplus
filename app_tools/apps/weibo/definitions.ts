import { defineCatalogTools } from '../../core/catalog';

export const WEIBO_TOOL_DEFINITIONS = defineCatalogTools(
  'weibo',
  { field: 'statuses', label: 'public posts' },
  { field: 'hotWords', label: 'hot searches' },
);

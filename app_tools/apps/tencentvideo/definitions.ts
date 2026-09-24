import { defineCatalogTools } from '../../core/catalog';

export const TENCENTVIDEO_TOOL_DEFINITIONS = defineCatalogTools(
  'tencentvideo',
  { field: 'contents', label: 'videos and series' },
  { field: 'rankings', label: 'rankings' },
);

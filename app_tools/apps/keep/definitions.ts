import { defineCatalogTools } from '../../core/catalog';

export const KEEP_TOOL_DEFINITIONS = defineCatalogTools(
  'keep',
  { field: 'courses', label: 'courses' },
  { field: 'plans', label: 'training plans' },
);

import { defineCatalogTools } from '../../core/catalog';

export const BOSS_TOOL_DEFINITIONS = defineCatalogTools(
  'boss',
  { field: 'jobs', label: 'job listings' },
  { field: 'companies', label: 'companies' },
);

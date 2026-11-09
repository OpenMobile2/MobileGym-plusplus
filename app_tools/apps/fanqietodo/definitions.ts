import { defineCatalogTools } from '../../core/catalog';

export const FANQIETODO_TOOL_DEFINITIONS = defineCatalogTools(
  'fanqietodo',
  { field: 'todos', label: 'todos' },
  { field: 'records', label: 'focus records' },
);

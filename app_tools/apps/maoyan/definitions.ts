import { defineCatalogTools } from '../../core/catalog';

export const MAOYAN_TOOL_DEFINITIONS = defineCatalogTools(
  'maoyan',
  { field: 'movies', label: 'movies' },
  { field: 'cinemas', label: 'cinemas' },
);

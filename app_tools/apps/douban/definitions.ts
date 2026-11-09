import { defineCatalogTools } from '../../core/catalog';

export const DOUBAN_TOOL_DEFINITIONS = defineCatalogTools(
  'douban',
  { field: 'subjects', label: 'movies, books, and media' },
  { field: 'groups', label: 'groups' },
);

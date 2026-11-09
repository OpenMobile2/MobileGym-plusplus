import { useMaoyanStore } from '@/apps/Maoyan/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { MAOYAN_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'maoyan',
  () => useMaoyanStore.getState() as unknown as Record<string, unknown>,
  'movies',
  'cinemas',
);

export function executeMaoyanTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { MAOYAN_TOOL_DEFINITIONS } from './definitions';

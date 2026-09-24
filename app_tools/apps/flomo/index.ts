import { useFlomoStore } from '@/apps/Flomo/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { FLOMO_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'flomo',
  () => useFlomoStore.getState() as unknown as Record<string, unknown>,
  'memos',
  'tags',
);

export function executeFlomoTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { FLOMO_TOOL_DEFINITIONS } from './definitions';

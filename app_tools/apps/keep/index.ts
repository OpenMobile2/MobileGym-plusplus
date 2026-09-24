import { useKeepStore } from '@/apps/Keep/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { KEEP_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'keep',
  () => useKeepStore.getState() as unknown as Record<string, unknown>,
  'courses',
  'plans',
);

export function executeKeepTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { KEEP_TOOL_DEFINITIONS } from './definitions';

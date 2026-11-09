import { useDoubanStore } from '@/apps/Douban/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { DOUBAN_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'douban',
  () => useDoubanStore.getState() as unknown as Record<string, unknown>,
  'subjects',
  'groups',
);

export function executeDoubanTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { DOUBAN_TOOL_DEFINITIONS } from './definitions';

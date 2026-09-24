import { useXianyuStore } from '@/apps/Xianyu/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { XIANYU_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'xianyu',
  () => useXianyuStore.getState() as unknown as Record<string, unknown>,
  'items',
  'listings',
);

export function executeXianyuTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { XIANYU_TOOL_DEFINITIONS } from './definitions';

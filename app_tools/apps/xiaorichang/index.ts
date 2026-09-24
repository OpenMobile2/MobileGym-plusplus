import { useXiaorichangStore } from '@/apps/Xiaorichang/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { XIAORICHANG_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'xiaorichang',
  () => useXiaorichangStore.getState() as unknown as Record<string, unknown>,
  'habits',
  'todos',
);

export function executeXiaorichangTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { XIAORICHANG_TOOL_DEFINITIONS } from './definitions';

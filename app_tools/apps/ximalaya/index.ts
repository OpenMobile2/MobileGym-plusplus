import { useXimalayaStore } from '@/apps/Ximalaya/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { XIMALAYA_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'ximalaya',
  () => useXimalayaStore.getState() as unknown as Record<string, unknown>,
  'albums',
  'tracks',
);

export function executeXimalayaTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { XIMALAYA_TOOL_DEFINITIONS } from './definitions';

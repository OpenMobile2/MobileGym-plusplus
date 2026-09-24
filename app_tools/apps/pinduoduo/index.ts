import { usePinduoduoStore } from '@/apps/Pinduoduo/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { PINDUODUO_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'pinduoduo',
  () => usePinduoduoStore.getState() as unknown as Record<string, unknown>,
  'items',
  'orders',
);

export function executePinduoduoTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { PINDUODUO_TOOL_DEFINITIONS } from './definitions';

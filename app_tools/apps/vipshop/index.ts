import { useVipshopStore } from '@/apps/Vipshop/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { VIPSHOP_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'vipshop',
  () => useVipshopStore.getState() as unknown as Record<string, unknown>,
  'items',
  'brands',
);

export function executeVipshopTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { VIPSHOP_TOOL_DEFINITIONS } from './definitions';

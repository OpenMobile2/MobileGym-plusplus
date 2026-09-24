import { useMeituanStore } from '@/apps/Meituan/state';
import { MEITUAN_CONFIG } from '@/apps/Meituan/data';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { MEITUAN_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'meituan',
  () => ({ ...MEITUAN_CONFIG, ...useMeituanStore.getState() }) as unknown as Record<string, unknown>,
  'restaurants',
  'orders',
);

export function executeMeituanTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { MEITUAN_TOOL_DEFINITIONS } from './definitions';

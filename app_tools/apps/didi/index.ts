import { useDidiStore } from '@/apps/Didi/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { DIDI_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'didi',
  () => useDidiStore.getState() as unknown as Record<string, unknown>,
  'orders',
  'coupons',
);

export function executeDidiTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { DIDI_TOOL_DEFINITIONS } from './definitions';

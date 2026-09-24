import { useSuningStore } from '@/apps/Suning/state';
import { SUNING_CONFIG } from '@/apps/Suning/data';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { SUNING_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'suning',
  () => ({ ...SUNING_CONFIG, ...useSuningStore.getState() }) as unknown as Record<string, unknown>,
  'products',
  'orders',
);

export function executeSuningTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { SUNING_TOOL_DEFINITIONS } from './definitions';

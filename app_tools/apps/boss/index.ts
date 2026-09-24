import { useBossStore } from '@/apps/Boss/state';
import { BOSS_CONFIG } from '@/apps/Boss/data';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { BOSS_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'boss',
  () => ({ ...BOSS_CONFIG, ...useBossStore.getState() }) as unknown as Record<string, unknown>,
  'jobs',
  'companies',
);

export function executeBossTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { BOSS_TOOL_DEFINITIONS } from './definitions';

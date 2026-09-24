import { useCainiaoStore } from '@/apps/Cainiao/state';
import { CAINIAO_CONFIG } from '@/apps/Cainiao/data';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { CAINIAO_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'cainiao',
  () => ({ ...CAINIAO_CONFIG, ...useCainiaoStore.getState() }) as unknown as Record<string, unknown>,
  'packages',
  'stations',
);

export function executeCainiaoTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { CAINIAO_TOOL_DEFINITIONS } from './definitions';

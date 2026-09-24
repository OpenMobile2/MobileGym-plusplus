import { useYoukuStore } from '@/apps/Youku/state';
import { YOUKU_CONFIG } from '@/apps/Youku/data';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { YOUKU_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'youku',
  () => ({ ...YOUKU_CONFIG, ...useYoukuStore.getState() }) as unknown as Record<string, unknown>,
  'catalog',
  'ranks',
);

export function executeYoukuTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { YOUKU_TOOL_DEFINITIONS } from './definitions';

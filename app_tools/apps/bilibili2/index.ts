import { useBilibiliV2Store } from '@/apps/BilibiliV2/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { BILIBILI2_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'bilibili2',
  () => useBilibiliV2Store.getState() as unknown as Record<string, unknown>,
  'videos',
  'messages',
);

export function executeBilibiliV2Tool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { BILIBILI2_TOOL_DEFINITIONS } from './definitions';

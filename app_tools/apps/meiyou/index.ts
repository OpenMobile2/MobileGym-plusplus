import { useMeiyouStore } from '@/apps/Meiyou/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { MEIYOU_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'meiyou',
  () => useMeiyouStore.getState() as unknown as Record<string, unknown>,
  'posts',
  'circles',
);

export function executeMeiyouTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { MEIYOU_TOOL_DEFINITIONS } from './definitions';

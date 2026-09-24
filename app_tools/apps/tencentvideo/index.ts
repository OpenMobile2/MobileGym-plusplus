import { useTencentvideoStore } from '@/apps/Tencentvideo/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { TENCENTVIDEO_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'tencentvideo',
  () => useTencentvideoStore.getState() as unknown as Record<string, unknown>,
  'contents',
  'rankings',
);

export function executeTencentvideoTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { TENCENTVIDEO_TOOL_DEFINITIONS } from './definitions';

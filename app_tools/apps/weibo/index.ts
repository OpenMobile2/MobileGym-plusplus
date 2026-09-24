import { useWeiboStore } from '@/apps/Weibo/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { WEIBO_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'weibo',
  () => useWeiboStore.getState() as unknown as Record<string, unknown>,
  'statuses',
  'hotWords',
);

export function executeWeiboTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { WEIBO_TOOL_DEFINITIONS } from './definitions';

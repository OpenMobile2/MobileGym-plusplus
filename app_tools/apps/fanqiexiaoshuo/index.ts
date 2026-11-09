import { useFanqieStore } from '@/apps/FanqieXiaoshuo/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { FANQIEXIAOSHUO_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'fanqiexiaoshuo',
  () => useFanqieStore.getState() as unknown as Record<string, unknown>,
  'books',
  'authors',
);

export function executeFanqieXiaoshuoTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { FANQIEXIAOSHUO_TOOL_DEFINITIONS } from './definitions';

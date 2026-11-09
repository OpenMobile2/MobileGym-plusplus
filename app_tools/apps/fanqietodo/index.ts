import { useFanqieTodoStore } from '@/apps/FanqieTodo/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { FANQIETODO_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'fanqietodo',
  () => useFanqieTodoStore.getState() as unknown as Record<string, unknown>,
  'todos',
  'records',
);

export function executeFanqieTodoTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { FANQIETODO_TOOL_DEFINITIONS } from './definitions';

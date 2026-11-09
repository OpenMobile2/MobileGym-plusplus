import { useBaicizhanStore } from '@/apps/Baicizhan/state';
import { createCatalogToolExecutor } from '../../core/catalog';
import type { JsonObject } from '../../core/types';
import { BAICIZHAN_TOOL_DEFINITIONS } from './definitions';

const execute = createCatalogToolExecutor(
  'baicizhan',
  () => useBaicizhanStore.getState() as unknown as Record<string, unknown>,
  'words',
  'books',
);

export function executeBaicizhanTool(name: string, input: JsonObject) {
  return execute(name, input);
}

export { BAICIZHAN_TOOL_DEFINITIONS } from './definitions';

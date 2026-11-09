import { defineAppTools, LIMIT, STRING } from './define';
import { assertAllowedKeys } from './errors';
import { compactResult, getLimit, getQuery, includesQuery, requireFound } from './helpers';
import type { JsonObject, ToolDefinition, ToolHandler } from './types';

const PUBLIC_SCALAR_KEYS = new Set([
  'id', 'title', 'name', 'displayName', 'nickname', 'author', 'subject', 'senderName',
  'category', 'categoryName', 'type', 'status', 'price', 'originalPrice', 'rating',
  'douban',
  'score', 'salary', 'company', 'city', 'location', 'address', 'distance', 'duration',
  'date', 'time', 'createdAt', 'updatedAt', 'completed', 'progress', 'unread', 'text',
  'content', 'description', 'summary', 'word', 'meaning', 'level', 'count', 'quantity',
  'note', 'payee', 'amount',
  'priority', 'fare', 'kind', 'carType', 'from', 'to', 'likes', 'reward', 'channel',
  'source', 'modifiedAt',
]);

function rows(value: unknown): Array<[string, unknown]> {
  if (Array.isArray(value)) return value.map((row, index) => [String(index), row]);
  if (value && typeof value === 'object') return Object.entries(value as Record<string, unknown>);
  return [];
}

function publicRow(key: string, value: unknown): JsonObject {
  if (!value || typeof value !== 'object') return { id: key, value: String(value ?? '') };
  const source = value as Record<string, unknown>;
  const result: JsonObject = {};
  for (const [field, fieldValue] of Object.entries(source)) {
    if (!PUBLIC_SCALAR_KEYS.has(field)) continue;
    if (fieldValue == null || ['string', 'number', 'boolean'].includes(typeof fieldValue)) {
      result[field] = fieldValue as JsonObject[string];
    }
  }
  if (!('id' in result)) result.id = key;
  return result;
}

export function defineCatalogTools(
  appId: string,
  primary: { field: string; label: string },
  secondary: { field: string; label: string },
): ToolDefinition[] {
  return defineAppTools(appId, [
    {
      name: `search_${primary.field}`,
      description: `Search the app's ${primary.label} by visible public metadata. Returns compact candidates without changing the current page.`,
      properties: { query: STRING, limit: LIMIT },
      required: ['query'],
    },
    {
      name: `list_${secondary.field}`,
      description: `List compact public metadata for the app's current ${secondary.label} without changing the current page.`,
      properties: { limit: LIMIT },
    },
  ]);
}

export function createCatalogToolExecutor(
  appId: string,
  getState: () => Record<string, unknown>,
  primaryField: string,
  secondaryField: string,
) {
  const handlers: Record<string, ToolHandler> = {
    [`${appId}__search_${primaryField}`]: (input) => {
      assertAllowedKeys(input, ['query', 'limit']);
      const query = getQuery(input);
      const matches = rows(getState()[primaryField])
        .filter(([, row]) => includesQuery([JSON.stringify(row)], query))
        .map(([key, row]) => publicRow(key, row));
      return compactResult(matches, getLimit(input, 50));
    },
    [`${appId}__list_${secondaryField}`]: (input) => {
      assertAllowedKeys(input, ['limit']);
      const result = rows(getState()[secondaryField]).map(([key, row]) => publicRow(key, row));
      return compactResult(result, getLimit(input, 50));
    },
  };
  return (name: string, input: JsonObject) => requireFound(
    handlers[name], 'TOOL_NOT_FOUND', `Unknown ${appId} tool: ${name}`,
  )(input);
}

import { optionalInteger, requireString, ToolExecutionError } from './errors';
import type { JsonObject } from './types';

export function text(value: unknown): string {
  return String(value ?? '').trim();
}

export function normalized(value: unknown): string {
  return text(value).toLocaleLowerCase();
}

export function includesQuery(values: unknown[], query: string): boolean {
  const needle = normalized(query);
  return values.some((value) => normalized(value).includes(needle));
}

export function getQuery(input: JsonObject, key = 'query'): string {
  return requireString(input, key, { maxLength: 200 });
}

export function getLimit(input: JsonObject, maximum = 50): number {
  return optionalInteger(input, 'limit', { min: 1, max: maximum, defaultValue: 10 });
}

export function requireFound<T>(value: T | undefined | null, code: string, message: string): T {
  if (value === undefined || value === null) throw new ToolExecutionError(code, message);
  return value;
}

export function compactResult<T>(items: T[], limit: number) {
  return {
    items: items.slice(0, limit),
    total: items.length,
    truncated: items.length > limit,
  };
}

export function encodeRoute(path: string, params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  }
  const suffix = search.toString();
  return suffix ? `${path}?${suffix}` : path;
}

export function asArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

export function asRecord<T = unknown>(value: unknown): Record<string, T> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, T>
    : {};
}

export function finiteNumber(value: unknown): number | undefined {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

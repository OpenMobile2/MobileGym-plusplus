export class ToolExecutionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ToolExecutionError';
  }
}

export function requireObject(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new ToolExecutionError('INVALID_ARGUMENTS', 'Tool arguments must be a JSON object.');
  }
  return value as Record<string, unknown>;
}

export function assertAllowedKeys(input: Record<string, unknown>, allowedKeys: readonly string[]): void {
  const allowed = new Set(allowedKeys);
  const unexpected = Object.keys(input).filter((key) => !allowed.has(key));
  if (unexpected.length > 0) {
    throw new ToolExecutionError(
      'INVALID_ARGUMENT',
      `Unexpected argument${unexpected.length > 1 ? 's' : ''}: ${unexpected.join(', ')}.`,
    );
  }
}

export function requireString(
  input: Record<string, unknown>,
  key: string,
  options: { maxLength?: number } = {},
): string {
  const value = input[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must be a non-empty string.`);
  }
  const normalized = value.trim();
  if (options.maxLength !== undefined && normalized.length > options.maxLength) {
    throw new ToolExecutionError(
      'INVALID_ARGUMENT',
      `"${key}" must be at most ${options.maxLength} characters.`,
    );
  }
  return normalized;
}

export function optionalString(
  input: Record<string, unknown>,
  key: string,
  options: { maxLength?: number } = {},
): string | undefined {
  const value = input[key];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must be a string.`);
  }
  const normalized = value.trim();
  if (options.maxLength !== undefined && normalized.length > options.maxLength) {
    throw new ToolExecutionError(
      'INVALID_ARGUMENT',
      `"${key}" must be at most ${options.maxLength} characters.`,
    );
  }
  return normalized || undefined;
}

export function optionalInteger(
  input: Record<string, unknown>,
  key: string,
  options: { min: number; max: number; defaultValue: number },
): number {
  const value = input[key] ?? options.defaultValue;
  if (
    typeof value !== 'number'
    || !Number.isInteger(value)
    || value < options.min
    || value > options.max
  ) {
    throw new ToolExecutionError(
      'INVALID_ARGUMENT',
      `"${key}" must be an integer between ${options.min} and ${options.max}.`,
    );
  }
  return value;
}

export function optionalBoolean(
  input: Record<string, unknown>,
  key: string,
  defaultValue: boolean,
): boolean {
  const value = input[key] ?? defaultValue;
  if (typeof value !== 'boolean') {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must be a boolean.`);
  }
  return value;
}

export function requireBoolean(input: Record<string, unknown>, key: string): boolean {
  const value = input[key];
  if (typeof value !== 'boolean') {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" must be a boolean.`);
  }
  return value;
}

export function requireInteger(
  input: Record<string, unknown>,
  key: string,
  options: { min: number; max: number },
): number {
  const value = input[key];
  if (
    typeof value !== 'number'
    || !Number.isInteger(value)
    || value < options.min
    || value > options.max
  ) {
    throw new ToolExecutionError(
      'INVALID_ARGUMENT',
      `"${key}" must be an integer between ${options.min} and ${options.max}.`,
    );
  }
  return value;
}

export function optionalEnum<T extends string>(
  input: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  defaultValue: T,
): T {
  const value = input[key] ?? defaultValue;
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ToolExecutionError(
      'INVALID_ARGUMENT',
      `"${key}" must be one of: ${allowed.join(', ')}.`,
    );
  }
  return value as T;
}

export function requireEnum<T extends string>(
  input: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
): T {
  if (!(key in input)) {
    throw new ToolExecutionError('INVALID_ARGUMENT', `"${key}" is required.`);
  }
  return optionalEnum(input, key, allowed, allowed[0]);
}

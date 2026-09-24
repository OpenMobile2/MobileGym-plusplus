import type { JsonObject, ToolDefinition } from './types';

export type ToolKind = 'query' | 'navigation' | 'draft' | 'write';

export interface AppToolSpec {
  name: string;
  description: string;
  properties?: JsonObject;
  required?: string[];
  kind?: ToolKind;
  destructive?: boolean;
  idempotent?: boolean;
}

export const STRING = { type: 'string' } as const;
export const ID = { type: 'string', minLength: 1, maxLength: 256 } as const;
export const LIMIT = { type: 'integer', minimum: 1, maximum: 50, default: 10 } as const;

export function defineAppTools(app: string, specs: AppToolSpec[]): ToolDefinition[] {
  return specs.map((spec) => {
    const kind = spec.kind ?? 'query';
    return {
      name: `${app}__${spec.name}`,
      app,
      description: spec.description,
      inputSchema: {
        type: 'object',
        properties: spec.properties ?? {},
        required: spec.required ?? [],
        additionalProperties: false,
      },
      annotations: {
        readOnlyHint: kind === 'query' || kind === 'navigation',
        destructiveHint: spec.destructive ?? false,
        idempotentHint: spec.idempotent ?? kind !== 'write',
        uiEffect: kind === 'navigation' ? 'navigation' : kind === 'draft' ? 'draft' : 'none',
      },
    };
  });
}

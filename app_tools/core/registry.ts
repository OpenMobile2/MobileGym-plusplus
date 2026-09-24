import { requireObject, ToolExecutionError } from './errors';
import type { JsonObject, ToolCallResult, ToolDefinition, ToolHandler } from './types';

class ToolRegistry {
  private readonly entries = new Map<string, { definition: ToolDefinition; handler: ToolHandler }>();
  private callSequence = 0;

  register(definition: ToolDefinition, handler: ToolHandler): void {
    if (this.entries.has(definition.name)) {
      throw new Error(`Tool already registered: ${definition.name}`);
    }
    this.entries.set(definition.name, { definition, handler });
  }

  list(options?: { app?: string }): ToolDefinition[] {
    return [...this.entries.values()]
      .map((entry) => entry.definition)
      .filter((definition) => !options?.app || definition.app === options.app);
  }

  async call(name: string, arguments_: JsonObject = {}): Promise<ToolCallResult> {
    const callId = `tool_call_${++this.callSequence}`;
    const entry = this.entries.get(name);
    if (!entry) {
      return {
        callId,
        name,
        ok: false,
        error: { code: 'TOOL_NOT_FOUND', message: `Unknown tool: ${name}` },
      };
    }

    try {
      const output = await entry.handler(requireObject(arguments_));
      return { callId, name, ok: true, output };
    } catch (error) {
      if (error instanceof ToolExecutionError) {
        return {
          callId,
          name,
          ok: false,
          error: { code: error.code, message: error.message, details: error.details },
        };
      }
      const message = error instanceof Error ? error.message : String(error);
      return {
        callId,
        name,
        ok: false,
        error: { code: 'INTERNAL_ERROR', message },
      };
    }
  }
}

export const toolRegistry = new ToolRegistry();

export type JsonObject = Record<string, unknown>;

export interface ToolDefinition {
  name: string;
  app: string;
  description: string;
  inputSchema: JsonObject;
  outputSchema?: JsonObject;
  annotations: {
    readOnlyHint: boolean;
    destructiveHint: boolean;
    idempotentHint: boolean;
    uiEffect: 'none' | 'navigation' | 'draft';
  };
}

export interface ToolCallError {
  code: string;
  message: string;
  details?: unknown;
}

export type ToolCallResult =
  | {
      callId: string;
      name: string;
      ok: true;
      output: unknown;
    }
  | {
      callId: string;
      name: string;
      ok: false;
      error: ToolCallError;
    };

export type ToolHandler = (arguments_: JsonObject) => unknown | Promise<unknown>;

export interface BrowserToolApi {
  listTools(options?: { app?: string }): ToolDefinition[];
  callTool(name: string, arguments_?: JsonObject): Promise<ToolCallResult>;
}

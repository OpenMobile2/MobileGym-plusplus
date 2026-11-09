import { describe, expect, it } from 'vitest';
import type { ToolDefinition } from '../app_tools/core/types';
import { ALIPAY_TOOL_DEFINITIONS } from '../app_tools/apps/alipay/definitions';
import { BILIBILI_TOOL_DEFINITIONS } from '../app_tools/apps/bilibili/definitions';
import { EBAY_TOOL_DEFINITIONS } from '../app_tools/apps/ebay/definitions';
import { FILE_MANAGER_TOOL_DEFINITIONS } from '../app_tools/apps/file_manager/definitions';
import { MAP_TOOL_DEFINITIONS } from '../app_tools/apps/map/definitions';
import { RAILWAY12306_TOOL_DEFINITIONS } from '../app_tools/apps/railway12306/definitions';
import { REDBOOK_TOOL_DEFINITIONS } from '../app_tools/apps/redbook/definitions';
import { REDDIT_TOOL_DEFINITIONS } from '../app_tools/apps/reddit/definitions';
import { SPOTIFY_TOOL_DEFINITIONS } from '../app_tools/apps/spotify/definitions';
import { TAOBAO_TOOL_DEFINITIONS } from '../app_tools/apps/taobao/definitions';
import { TENCENT_MEETING_TOOL_DEFINITIONS } from '../app_tools/apps/tencent_meeting/definitions';
import { WEATHER_TOOL_DEFINITIONS } from '../app_tools/apps/weather/definitions';
import { WECHAT_READING_TOOL_DEFINITIONS } from '../app_tools/apps/wechat_reading/definitions';

const EXPECTED: Record<string, ToolDefinition[]> = {
  map: MAP_TOOL_DEFINITIONS,
  weather: WEATHER_TOOL_DEFINITIONS,
  railway12306: RAILWAY12306_TOOL_DEFINITIONS,
  alipay: ALIPAY_TOOL_DEFINITIONS,
  file_manager: FILE_MANAGER_TOOL_DEFINITIONS,
  tencent_meeting: TENCENT_MEETING_TOOL_DEFINITIONS,
  bilibili: BILIBILI_TOOL_DEFINITIONS,
  redbook: REDBOOK_TOOL_DEFINITIONS,
  wechat_reading: WECHAT_READING_TOOL_DEFINITIONS,
  spotify: SPOTIFY_TOOL_DEFINITIONS,
  ebay: EBAY_TOOL_DEFINITIONS,
  reddit: REDDIT_TOOL_DEFINITIONS,
  taobao: TAOBAO_TOOL_DEFINITIONS,
};

const COUNTS = {
  map: 14, weather: 10, railway12306: 14, alipay: 13, file_manager: 12,
  tencent_meeting: 11, bilibili: 12, redbook: 11, wechat_reading: 11,
  spotify: 12, ebay: 8, reddit: 9, taobao: 14,
};

function checkArraySchemas(value: unknown): void {
  if (!value || typeof value !== 'object') return;
  const schema = value as Record<string, unknown>;
  if (schema.type === 'array') expect(schema.items).toBeDefined();
  Object.values(schema).forEach(checkArraySchemas);
}

describe('expanded app tools contract', () => {
  it('defines exactly 151 unique tools under the intended app namespaces', () => {
    const all = Object.values(EXPECTED).flat();
    expect(all).toHaveLength(151);
    expect(new Set(all.map((tool) => tool.name)).size).toBe(151);
    for (const [app, definitions] of Object.entries(EXPECTED)) {
      expect(definitions).toHaveLength(COUNTS[app as keyof typeof COUNTS]);
      expect(definitions.every((tool) => tool.app === app && tool.name.startsWith(`${app}__`))).toBe(true);
    }
  });

  it('provides closed object schemas, descriptions, annotations, and valid array items', () => {
    for (const definition of Object.values(EXPECTED).flat()) {
      expect(definition.description.length).toBeGreaterThan(20);
      expect(definition.inputSchema).toMatchObject({ type: 'object', additionalProperties: false });
      expect(definition.annotations).toEqual(expect.objectContaining({
        readOnlyHint: expect.any(Boolean), destructiveHint: expect.any(Boolean),
        idempotentHint: expect.any(Boolean), uiEffect: expect.stringMatching(/^(none|navigation|draft)$/),
      }));
      checkArraySchemas(definition.inputSchema);
    }
  });

  it('keeps payment, purchase, refund, deletion, and public publishing out of direct write tools', () => {
    const writes = Object.values(EXPECTED).flat().filter((tool) => !tool.annotations.readOnlyHint);
    const forbidden = /(?:pay|purchase|buy_ticket|refund|delete|publish|create_order|transfer_money)$/;
    expect(writes.filter((tool) => forbidden.test(tool.name))).toEqual([]);
    for (const tool of writes.filter((item) => item.annotations.uiEffect === 'draft')) {
      expect(tool.description.toLowerCase()).toMatch(/gui|does not|remain|review|not create|not submit/);
    }
  });
});

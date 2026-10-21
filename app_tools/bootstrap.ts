import { CALENDAR_TOOL_DEFINITIONS } from './apps/calendar/definitions';
import { CLOCK_TOOL_DEFINITIONS } from './apps/clock/definitions';
import { DAYSMATTER_TOOL_DEFINITIONS } from './apps/daysmatter/definitions';
import { NOTES_TOOL_DEFINITIONS } from './apps/notes/definitions';
import { TBSG_TOOL_DEFINITIONS } from './apps/tbsg/definitions';
import { WECHAT_TOOL_DEFINITIONS } from './apps/wechat/definitions';
import { FILE_MANAGER_TOOL_DEFINITIONS } from './apps/file_manager/definitions';
import { MAP_TOOL_DEFINITIONS } from './apps/map/definitions';
import { RAILWAY12306_TOOL_DEFINITIONS } from './apps/railway12306/definitions';
import { TENCENT_MEETING_TOOL_DEFINITIONS } from './apps/tencent_meeting/definitions';
import { WEATHER_TOOL_DEFINITIONS } from './apps/weather/definitions';
import { BILIBILI_TOOL_DEFINITIONS } from './apps/bilibili/definitions';
import { REDBOOK_TOOL_DEFINITIONS } from './apps/redbook/definitions';
import { REDDIT_TOOL_DEFINITIONS } from './apps/reddit/definitions';
import { SPOTIFY_TOOL_DEFINITIONS } from './apps/spotify/definitions';
import { WECHAT_READING_TOOL_DEFINITIONS } from './apps/wechat_reading/definitions';
import { ALIPAY_TOOL_DEFINITIONS } from './apps/alipay/definitions';
import { EBAY_TOOL_DEFINITIONS } from './apps/ebay/definitions';
import { TAOBAO_TOOL_DEFINITIONS } from './apps/taobao/definitions';
import { BROADCAST_TOOL_DEFINITIONS } from './apps/broadcast/definitions';
import { CTRIP_TOOL_DEFINITIONS } from './apps/ctrip/definitions';
import { LUCKIN_TOOL_DEFINITIONS } from './apps/luckin/definitions';
import { JINGDONG_TOOL_DEFINITIONS } from './apps/jingdong/definitions';
import { DIANPING_TOOL_DEFINITIONS } from './apps/dianping/definitions';
import { KAPI_TOOL_DEFINITIONS } from './apps/kapi/definitions';
import { DIDA_TOOL_DEFINITIONS } from './apps/dida/definitions';
import { SLACK_TOOL_DEFINITIONS } from './apps/slack/definitions';
import { MAIL_TOOL_DEFINITIONS } from './apps/mail/definitions';
import { GOOGLEDRIVE_TOOL_DEFINITIONS } from './apps/googledrive/definitions';
import { CATALOG_EXPANSION } from './apps/catalog_expansion';
import { toolRegistry } from './core/registry';
import type { JsonObject, ToolDefinition } from './core/types';

function registerLazyTools(
  definitions: ToolDefinition[],
  execute: (name: string, input: JsonObject) => Promise<unknown>,
): void {
  definitions.forEach((definition) => {
    toolRegistry.register(definition, (input) => execute(definition.name, input));
  });
}

registerLazyTools(CALENDAR_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/calendar')).executeCalendarTool(name, input));
registerLazyTools(WECHAT_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/wechat')).executeWechatTool(name, input));
registerLazyTools(TBSG_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/tbsg')).executeTbsgTool(name, input));
registerLazyTools(DAYSMATTER_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/daysmatter')).executeDaysmatterTool(name, input));
registerLazyTools(CLOCK_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/clock')).executeClockTool(name, input));
registerLazyTools(NOTES_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/notes')).executeNotesTool(name, input));
registerLazyTools(MAP_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/map')).executeMapTool(name, input));
registerLazyTools(WEATHER_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/weather')).executeWeatherTool(name, input));
registerLazyTools(RAILWAY12306_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/railway12306')).executeRailway12306Tool(name, input));
registerLazyTools(FILE_MANAGER_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/file_manager')).executeFileManagerTool(name, input));
registerLazyTools(TENCENT_MEETING_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/tencent_meeting')).executeTencentMeetingTool(name, input));
registerLazyTools(BILIBILI_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/bilibili')).executeBilibiliTool(name, input));
registerLazyTools(REDBOOK_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/redbook')).executeRedbookTool(name, input));
registerLazyTools(WECHAT_READING_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/wechat_reading')).executeWechatReadingTool(name, input));
registerLazyTools(SPOTIFY_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/spotify')).executeSpotifyTool(name, input));
registerLazyTools(REDDIT_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/reddit')).executeRedditTool(name, input));
registerLazyTools(ALIPAY_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/alipay')).executeAlipayTool(name, input));
registerLazyTools(EBAY_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/ebay')).executeEbayTool(name, input));
registerLazyTools(TAOBAO_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/taobao')).executeTaobaoTool(name, input));
registerLazyTools(BROADCAST_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/broadcast')).executeBroadcastTool(name, input));
registerLazyTools(CTRIP_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/ctrip')).executeCtripTool(name, input));
registerLazyTools(LUCKIN_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/luckin')).executeLuckinTool(name, input));
registerLazyTools(JINGDONG_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/jingdong')).executeJingdongTool(name, input));
registerLazyTools(DIANPING_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/dianping')).executeDianpingTool(name, input));
registerLazyTools(KAPI_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/kapi')).executeKapiTool(name, input));
registerLazyTools(DIDA_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/dida')).executeDidaTool(name, input));
registerLazyTools(SLACK_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/slack')).executeSlackTool(name, input));
registerLazyTools(MAIL_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/mail')).executeMailTool(name, input));
registerLazyTools(GOOGLEDRIVE_TOOL_DEFINITIONS, async (name, input) =>
  (await import('./apps/googledrive')).executeGoogleDriveTool(name, input));
const explicitlyRegisteredCatalogNamespaces = new Set([
  'dianping', 'dida', 'googledrive', 'jingdong', 'kapi', 'mail',
]);
CATALOG_EXPANSION
  .filter(({ definitions }) => !explicitlyRegisteredCatalogNamespaces.has(definitions[0]?.name.split('__')[0] ?? ''))
  .forEach(({ definitions, execute }) => registerLazyTools(definitions, execute));

if (typeof window !== 'undefined') {
  window.__MOBILE_GYM_TOOLS__ = {
    listTools: (options) => toolRegistry.list(options),
    callTool: (name, arguments_ = {}) => toolRegistry.call(name, arguments_),
  };
}

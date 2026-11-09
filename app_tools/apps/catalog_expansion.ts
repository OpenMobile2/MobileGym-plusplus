import { BAICIZHAN_TOOL_DEFINITIONS } from './baicizhan/definitions';
import { BOSS_TOOL_DEFINITIONS } from './boss/definitions';
import { CAINIAO_TOOL_DEFINITIONS } from './cainiao/definitions';
import { DIANPING_TOOL_DEFINITIONS } from './dianping/definitions';
import { DIDA_TOOL_DEFINITIONS } from './dida/definitions';
import { DIDI_TOOL_DEFINITIONS } from './didi/definitions';
import { DOUBAN_TOOL_DEFINITIONS } from './douban/definitions';
import { FANQIETODO_TOOL_DEFINITIONS } from './fanqietodo/definitions';
import { FANQIEXIAOSHUO_TOOL_DEFINITIONS } from './fanqiexiaoshuo/definitions';
import { FLOMO_TOOL_DEFINITIONS } from './flomo/definitions';
import { GOOGLEDRIVE_TOOL_DEFINITIONS } from './googledrive/definitions';
import { JINGDONG_TOOL_DEFINITIONS } from './jingdong/definitions';
import { KAPI_TOOL_DEFINITIONS } from './kapi/definitions';
import { KEEP_TOOL_DEFINITIONS } from './keep/definitions';
import { MAIL_TOOL_DEFINITIONS } from './mail/definitions';
import { MAOYAN_TOOL_DEFINITIONS } from './maoyan/definitions';
import { MEITUAN_TOOL_DEFINITIONS } from './meituan/definitions';
import { MEIYOU_TOOL_DEFINITIONS } from './meiyou/definitions';
import { PINDUODUO_TOOL_DEFINITIONS } from './pinduoduo/definitions';
import { SUNING_TOOL_DEFINITIONS } from './suning/definitions';
import { TENCENTVIDEO_TOOL_DEFINITIONS } from './tencentvideo/definitions';
import { VIPSHOP_TOOL_DEFINITIONS } from './vipshop/definitions';
import { WEIBO_TOOL_DEFINITIONS } from './weibo/definitions';
import { XIANYU_TOOL_DEFINITIONS } from './xianyu/definitions';
import { XIAORICHANG_TOOL_DEFINITIONS } from './xiaorichang/definitions';
import { XIMALAYA_TOOL_DEFINITIONS } from './ximalaya/definitions';
import { YOUKU_TOOL_DEFINITIONS } from './youku/definitions';
import type { JsonObject, ToolDefinition } from '../core/types';

export const CATALOG_EXPANSION: Array<{
  definitions: ToolDefinition[];
  execute: (name: string, input: JsonObject) => Promise<unknown>;
}> = [
  { definitions: BAICIZHAN_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./baicizhan')).executeBaicizhanTool(name, input) },
  { definitions: BOSS_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./boss')).executeBossTool(name, input) },
  { definitions: CAINIAO_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./cainiao')).executeCainiaoTool(name, input) },
  { definitions: DIANPING_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./dianping')).executeDianpingTool(name, input) },
  { definitions: DIDA_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./dida')).executeDidaTool(name, input) },
  { definitions: DIDI_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./didi')).executeDidiTool(name, input) },
  { definitions: DOUBAN_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./douban')).executeDoubanTool(name, input) },
  { definitions: FANQIETODO_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./fanqietodo')).executeFanqieTodoTool(name, input) },
  { definitions: FANQIEXIAOSHUO_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./fanqiexiaoshuo')).executeFanqieXiaoshuoTool(name, input) },
  { definitions: FLOMO_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./flomo')).executeFlomoTool(name, input) },
  { definitions: GOOGLEDRIVE_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./googledrive')).executeGoogleDriveTool(name, input) },
  { definitions: JINGDONG_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./jingdong')).executeJingdongTool(name, input) },
  { definitions: KAPI_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./kapi')).executeKapiTool(name, input) },
  { definitions: KEEP_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./keep')).executeKeepTool(name, input) },
  { definitions: MAIL_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./mail')).executeMailTool(name, input) },
  { definitions: MAOYAN_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./maoyan')).executeMaoyanTool(name, input) },
  { definitions: MEITUAN_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./meituan')).executeMeituanTool(name, input) },
  { definitions: MEIYOU_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./meiyou')).executeMeiyouTool(name, input) },
  { definitions: PINDUODUO_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./pinduoduo')).executePinduoduoTool(name, input) },
  { definitions: SUNING_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./suning')).executeSuningTool(name, input) },
  { definitions: TENCENTVIDEO_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./tencentvideo')).executeTencentvideoTool(name, input) },
  { definitions: VIPSHOP_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./vipshop')).executeVipshopTool(name, input) },
  { definitions: WEIBO_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./weibo')).executeWeiboTool(name, input) },
  { definitions: XIANYU_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./xianyu')).executeXianyuTool(name, input) },
  { definitions: XIAORICHANG_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./xiaorichang')).executeXiaorichangTool(name, input) },
  { definitions: XIMALAYA_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./ximalaya')).executeXimalayaTool(name, input) },
  { definitions: YOUKU_TOOL_DEFINITIONS, execute: async (name: string, input: JsonObject) => (await import('./youku')).executeYoukuTool(name, input) },
];

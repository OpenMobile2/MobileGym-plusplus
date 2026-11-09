import defaultsJson from './defaults.json';
import { manifest } from '../manifest';
import type { SuningDefaults } from '../types';

/**
 * 数据入口:defaults.json 类型化导出(L1 数据层)。
 * JSON 字面量的字符串字段会被 TS 推宽为 string,故经 unknown 断言为 SuningDefaults
 * (形状由生成脚本保证,写入后已通过 json.load 与引用完整性校验)。
 */
export const SUNING_CONFIG = {
  ...(defaultsJson as unknown as SuningDefaults),
  appId: manifest.id,
} as SuningDefaults & { appId: string };

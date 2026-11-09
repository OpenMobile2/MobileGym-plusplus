import defaults from './defaults.json';
import type { CtripState } from '../types';

/** 数据入口:合并 defaults.json,导出 CTRIP_CONFIG(见 module-contract data-layering)。 */
export const CTRIP_CONFIG = defaults as unknown as CtripState;

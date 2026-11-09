import defaults from './defaults.json';
import { manifest } from '../manifest';

/** 数据入口:defaults.json(regen_defaults.py 生成) + appId */
export const YOUKU_CONFIG = {
  ...defaults,
  appId: manifest.id,
} as typeof defaults & { appId: string };

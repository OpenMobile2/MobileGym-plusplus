import defaults from './defaults.json';
import { manifest } from '../manifest';
import type { WangyiyunState } from '../types';

export const WANGYIYUN_CONFIG = {
  ...(defaults as unknown as WangyiyunState),
  appId: manifest.id,
};

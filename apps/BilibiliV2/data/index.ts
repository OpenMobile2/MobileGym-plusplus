import defaults from './defaults.json';
import { CHANNELS } from '../constants';
import { manifest } from '../manifest';

export const BILIBILI_V2_CONFIG = {
  ...defaults,
  appId: manifest.id,
  channels: CHANNELS,
};

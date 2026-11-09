import defaults from './defaults.json';
import { manifest } from '../manifest';

export const WEIBO_CONFIG = {
  ...defaults,
  appId: manifest.id,
};

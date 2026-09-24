import defaults from './defaults.json';
import { manifest } from '../manifest';

export const MEIYOU_CONFIG = {
  ...defaults,
  appId: manifest.id,
} as typeof defaults & { appId: string };

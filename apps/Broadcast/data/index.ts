import defaults from './defaults.json';
import { manifest } from '../manifest';

export const BROADCAST_CONFIG = {
  ...defaults,
  appId: manifest.id,
};

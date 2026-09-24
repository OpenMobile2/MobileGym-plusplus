import defaults from './defaults.json';
import { manifest } from '../manifest';

export const QUNAER_CONFIG = {
  ...defaults,
  appId: manifest.id,
};

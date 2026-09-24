import defaults from './defaults.json';
import { manifest } from '../manifest';

export const TBSG_CONFIG = {
  ...defaults,
  appId: manifest.id,
};

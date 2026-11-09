import defaults from './defaults.json';
import { manifest } from '../manifest';

export const GOOGLEDRIVE_CONFIG = {
  ...defaults,
  appId: manifest.id,
};

import defaults from './defaults.json';
import { manifest } from '../manifest';
import type { MaoyanState } from '../types';

export const MAOYAN_CONFIG = {
  ...(defaults as unknown as MaoyanState),
  appId: manifest.id,
};

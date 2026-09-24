import defaults from './defaults.json';
import { manifest } from '../manifest';
import { DATA_VERSION } from '../constants';
import type { Todo, FocusRecord, FutureCountdown, Settings, UserInfo, Stats } from '../types';

export const FANQIETODO_CONFIG = {
  appId: manifest.id,
  dataVersion: DATA_VERSION,
  user: defaults.user as UserInfo,
  todos: defaults.todos as Todo[],
  records: defaults.records as FocusRecord[],
  futures: defaults.futures as FutureCountdown[],
  settings: defaults.settings as Settings,
  stats: defaults.stats as Stats,
};

import defaults from './defaults.json';
import { manifest } from '../manifest';
import { DATA_VERSION } from '../constants';
import type { DMEvent, DMNotebook, DMSettings, HomeFilter, DMUser } from '../types';

export const DAYSMATTER_CONFIG = {
  appId: manifest.id,
  dataVersion: DATA_VERSION,
  user: defaults.user as DMUser,
  notebooks: defaults.notebooks as DMNotebook[],
  events: defaults.events as DMEvent[],
  settings: defaults.settings as DMSettings,
  filter: defaults.filter as HomeFilter,
  widgetEventId: defaults.widgetEventId as string | null,
};

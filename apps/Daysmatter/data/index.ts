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
  selectedIconId: defaults.selectedIconId as string,
  feedbackSubmissions: defaults.feedbackSubmissions as Array<{ id: string; email: string; type: string; text: string; createdAt: number }>,
  lastDateCalculation: defaults.lastDateCalculation as { rangeStart: number; rangeEnd: number; includeStart: boolean; resultDays: number } | null,
  detailDisplayModes: defaults.detailDisplayModes as Record<string, 'days' | 'date'>,
};

import defaults from './defaults.json';
import type { DidiState } from '../types';

export const DIDI_CONFIG = defaults as unknown as DidiState;
export * from './mapPlaces';

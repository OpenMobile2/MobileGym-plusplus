import defaults from './defaults.json';
import { manifest } from '../manifest';

export const MEITUAN_CONFIG = {
  ...defaults,
  appId: manifest.id,
};

export type Restaurant = (typeof MEITUAN_CONFIG.restaurants)[number];
export type Dish = (typeof MEITUAN_CONFIG.restaurants)[number]['dishes'][number];
export type Order = (typeof MEITUAN_CONFIG.orders)[number];

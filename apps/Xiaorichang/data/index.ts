import defaults from './defaults.json';
import { manifest } from '../manifest';
import { DATA_VERSION } from '../constants';
import type { Glow, Habit, HabitContext, HabitGroup, SavedCard, Settings, UserInfo, Wish } from '../types';

/** 种子数据里的时间用相对偏移表达,由 state.ts 经 TimeService 物化 */
export interface SeedLog {
  habitId: string; dayOffset: number; status: 'done' | 'failed' | 'pending';
  stamps: number[]; note?: string; quantity?: number;
}
export interface SeedNote {
  id: string; title?: string; body: string; color: string;
  dayOffset: number; minuteOfDay: number;
}
export interface SeedTodo {
  id: string; title: string; done: boolean; order: number;
  dueDayOffset?: number; doneDayOffset?: number;
}
export interface SeedRecord {
  id: string; habitId: string | null; dayOffset: number;
  startMinute: number; minutes: number; note?: string;
}

export const XIAORICHANG_CONFIG = {
  appId: manifest.id,
  dataVersion: DATA_VERSION,
  user: defaults.user as UserInfo,
  contexts: defaults.contexts as HabitContext[],
  habits: defaults.habits as unknown as Habit[],
  groups: defaults.groups as HabitGroup[],
  logs: defaults.logs as SeedLog[],
  glow: defaults.glow as Glow,
  wishes: defaults.wishes as Wish[],
  notes: defaults.notes as SeedNote[],
  todos: defaults.todos as SeedTodo[],
  records: defaults.records as SeedRecord[],
  cards: defaults.cards as SavedCard[],
  settings: defaults.settings as unknown as Settings,
};

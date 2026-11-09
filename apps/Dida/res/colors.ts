// 滴答清单(Dida) — 色值(取自真机截图,见 docs/dida-replication/design-tokens.md)
import type { AccentPref } from '../types';

export const ACCENT_DARK = '#F79A28';
export const ACCENT_LIGHT = '#4772F5';

export const ACCENT_HEX: Record<AccentPref, string> = {
  orange: '#F79A28',
  blue: '#4772F5',
  green: '#34C77B',
};

/** 优先级旗标/复选框色 */
export const PRIORITY_COLORS: Record<string, string> = {
  priorityHigh: '#E8594C',
  priorityMedium: '#F5B429',
  priorityLow: '#4E7EF3',
  priorityNone: '#8E8E93',
};

/** 四象限徽章色 */
export const QUADRANT_COLORS: Record<string, string> = {
  quadrant1: '#F0526D',
  quadrant2: '#F5A623',
  quadrant3: '#4772F5',
  quadrant4: '#34C77B',
};

/** 深色基底 */
export const DARK = {
  base: '#000000',
  card: '#1C1C1E',
  sheet: '#1A1A1C',
  drawer: '#0E0E0F',
  elevated: '#2A2A2C',
  dayCell: '#141414',
  chipOff: '#3A3A3C',
  rowSelected: '#2A210F',
  periodSelected: '#2A210F',
  textPrimary: '#FFFFFF',
  textSecondary: '#8E8E93',
  textTertiary: '#5A5A5E',
  divider: '#2C2C2E',
  border: '#3A3A3C',
};

/** 浅色基底 */
export const LIGHT = {
  base: '#F2F2F7',
  card: '#FFFFFF',
  sheet: '#FFFFFF',
  drawer: '#FFFFFF',
  elevated: '#E5E5EA',
  dayCell: '#FFFFFF',
  chipOff: '#D1D1D6',
  rowSelected: 'rgba(247,154,40,0.12)',
  periodSelected: 'rgba(247,154,40,0.14)',
  textPrimary: '#1C1C1E',
  textSecondary: '#8E8E93',
  textTertiary: '#AEAEB2',
  divider: '#E5E5EA',
  border: '#C7C7CC',
};

export function priorityColor(key: string): string {
  return PRIORITY_COLORS[key] ?? PRIORITY_COLORS.priorityNone;
}

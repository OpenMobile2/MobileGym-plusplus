export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 56,
} as const;

export const DATA_VERSION = 11;

export const MAIN_TABS = [
  { id: 'home', path: '/', labelKey: 'tabHome' },
  { id: 'trip', path: '/trip', labelKey: 'tabTrip' },
  { id: 'support', path: '/support', labelKey: 'tabSupport' },
  { id: 'world', path: '/world', labelKey: 'tabWorld' },
  { id: 'mine', path: '/me', labelKey: 'tabMine' },
] as const;

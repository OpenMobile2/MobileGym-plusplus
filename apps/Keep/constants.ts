// apps/Keep/constants.ts
/** OS 宿主约束 —— 来源:os/data/simulatorConfig.ts。OS 层更新时同步。 */
export const OS = {
  STATUS_BAR_H: 40,
  GESTURE_BAR_H: 16,
  VIEWPORT_W: 360,
  VIEWPORT_H: 800,
  TOP_BAR_H: 44,
  TAB_BAR_H: 52,
} as const;

/**
 * DATA_VERSION —— 每次修改 defaults.json 必须递增。
 * state.ts 的 persistName = `keep_v${DATA_VERSION}`,版本变化清空 localStorage。
 */
export const DATA_VERSION = 15;

/** 底部 TabBar(证据:s001/s054/s056/s063/s084)。label 走 strings。 */
export const TABS = [
  { id: 'course', route: '/', labelKey: 'tabCourse', icon: 'IcTabCourse' },
  { id: 'schedule', route: '/schedule', labelKey: 'tabSchedule', icon: 'IcTabSchedule' },
  { id: 'sport', route: '/sport', labelKey: 'tabSport', icon: 'IcTabSport' },
  { id: 'discover', route: '/discover', labelKey: 'tabDiscover', icon: 'IcTabDiscover' },
  { id: 'me', route: '/me', labelKey: 'tabMe', icon: 'IcTabMe' },
] as const;

/** 五 tab 根路由 */
export const TAB_ROUTES: string[] = TABS.map((t) => t.route);

/** 课程 tab 子页(计划/开练吧)：同属课程主 tab，需保留底部功能栏 */
export const COURSE_SUBTAB_ROUTES = ['/course/plan', '/course/buddies'] as const;
export const SEARCH_ROUTES = ['/search', '/search/results'] as const;

/**
 * 搜索取消落点候选（按栈内最近优先）。
 * 取消一次应回到进入搜索前的页面，而不是连按多层 /search*。
 */
export const SEARCH_EXIT_ORIGINS = [
  '/',
  '/course/plan',
  '/course/buddies',
  '/course/all',
  '/discover/mall',
  '/discover/community',
  '/discover',
  '/sport',
  '/schedule',
  '/me',
] as const;

/** 需要展示底部 TabBar 的路由（含课程子 tab） */
export const TAB_BAR_ROUTES: string[] = [...TAB_ROUTES, ...COURSE_SUBTAB_ROUTES, ...SEARCH_ROUTES];

export function isCourseTabPath(pathname: string): boolean {
  return pathname === '/'
    || (COURSE_SUBTAB_ROUTES as readonly string[]).includes(pathname)
    || (SEARCH_ROUTES as readonly string[]).includes(pathname);
}

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { SEARCH_EXIT_ORIGINS, SEARCH_ROUTES, TABS, TAB_ROUTES, isCourseTabPath } from '../constants';
import { IconRenderer } from '../res/icons';
import { C } from './ui';

export { TAB_ROUTES };

const TAB_TIDS: Record<string, string> = {
  course: 'tab.course',
  schedule: 'tab.schedule',
  sport: 'tab.sport',
  discover: 'tab.discover',
  me: 'tab.me',
};

/** 底部五 tab(证据 s001/s054/s056/s063/s084);发现、我的带红点。 */
export function TabBar() {
  const { pathname } = useLocation();
  const { bindTap, go } = useKeepGestures();
  const s = useKeepStrings();
  const onSearch = (SEARCH_ROUTES as readonly string[]).includes(pathname);
  const tabBind = (id: 'tab.course' | 'tab.schedule' | 'tab.sport' | 'tab.discover' | 'tab.me') =>
    bindTap(id, onSearch ? {
      onTrigger: () => go(id, {}, { popTo: SEARCH_EXIT_ORIGINS, popToInclusive: false }),
    } : undefined);
  return (
    <div
      className="flex items-stretch h-13 shrink-0 bg-app-surface border-t border-app-border"
      style={{ height: 52 }}
      data-hide-on-keyboard
    >
      {TABS.map((t) => {
        // 计划/开练吧同属课程 tab，需保持「课程」选中
        const active = t.id === 'course' ? isCourseTabPath(pathname) : pathname === t.route;
        const tid = TAB_TIDS[t.id];
        const hasDot = t.id === 'discover' || t.id === 'me';
        return (
          <button
            key={t.id}
            {...(t.id === 'course' ? tabBind('tab.course')
              : t.id === 'schedule' ? tabBind('tab.schedule')
              : t.id === 'sport' ? tabBind('tab.sport')
              : t.id === 'discover' ? tabBind('tab.discover')
              : tabBind('tab.me'))}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-transparent border-none relative px-1 py-1"
            style={{ touchAction: 'manipulation' }}
            aria-label={s[t.labelKey]}
            data-tab-id={tid}
          >
            {/* 子节点不拦截点击，保证点文案与点图标同走 tab bindTap */}
            <span className="pointer-events-none" style={{ color: active ? C.dark : C.sub }}>
              <IconRenderer name={t.icon} size={22} />
            </span>
            <span
              className="pointer-events-none text-[10px] leading-none"
              style={{ color: active ? C.dark : C.sub, fontWeight: active ? 600 : 400 }}
            >
              {s[t.labelKey]}
            </span>
            {hasDot && (
              <span className="pointer-events-none absolute top-1.5 right-[30%] w-1.5 h-1.5 rounded-full" style={{ background: C.red }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

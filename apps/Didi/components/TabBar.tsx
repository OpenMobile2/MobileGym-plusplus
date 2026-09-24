import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStrings } from '../hooks/useDidiStrings';
import { useDidiStore } from '../state';
import { IcTabHome, IcTabOrders, IcTabMessages, IcTabMe } from '../res/icons';

/** 底部 TabBar —— 4 tab(provisional)。data-hide-on-keyboard:键盘弹起时自动隐藏。 */
export function TabBar() {
  const { pathname } = useLocation();
  const { bindTap } = useDidiGestures();
  const s = useDidiStrings();
  const setTripsSection = useDidiStore((st) => st.setTripsSection);
  const unreadMessages = useDidiStore((st) => st.messageThreads.reduce((sum, thread) => sum + thread.unread, 0));
  // bindTap 必须用字面量 transitionId(静态分析要求),故逐 tab 显式绑定。
  // data-automation-label 固定中文基线，避免 locale 切换导致自动化文案匹配失败。
  const tabs = [
    { route: '/', label: s.tabHome, bind: bindTap('home.tab'), Icon: IcTabHome, autoLabel: '首页', testId: 'didi-tab-home', badge: false },
    { route: '/messages', label: s.tabMessages, bind: bindTap('messages.tab'), Icon: IcTabMessages, autoLabel: '消息', testId: 'didi-tab-messages', badge: unreadMessages > 0 },
    {
      route: '/trips',
      label: s.tabTrips,
      bind: bindTap('trips.tab', { beforeTrigger: () => setTripsSection('mine') }),
      Icon: IcTabOrders,
      autoLabel: '行程',
      testId: 'didi-tab-trips',
      badge: false,
    },
    { route: '/me', label: s.tabMe, bind: bindTap('me.tab'), Icon: IcTabMe, autoLabel: '我的', testId: 'didi-tab-me', badge: false },
  ];
  return (
    <div
      data-hide-on-keyboard
      className="flex h-[52px] shrink-0 border-t border-app-border bg-app-surface"
    >
      {tabs.map(({ route, label, bind, Icon, autoLabel, testId, badge }) => {
        const active = pathname === route;
        return (
          <button
            key={route}
            {...bind}
            data-testid={testId}
            data-tab={route === '/' ? 'home' : route.slice(1)}
            data-automation-label={autoLabel}
            aria-label={autoLabel}
            className="relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 bg-transparent border-none"
            style={{ color: active ? 'var(--app-primary, #FF7D41)' : '#9AA0A6' }}
          >
            <Icon size={22} />
            {badge && <span className="absolute right-[31%] top-1.5 h-2 w-2 rounded-full bg-red-500" aria-label="有未读消息" />}
            <span className="text-[11px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export const TAB_ROUTES = ['/', '/messages', '/trips', '/me'];

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { IcCheck, IcGrid, IcTomato, IcBars, IcUser } from '../res/icons';

/** 真机为悬浮胶囊式底栏(s151),选中项深色底白字形 */
const TabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useXiaorichangGestures();
  const s = useStrings();
  // bindTap 必须传字符串字面量(静态分析要求),故逐个显式绑定
  const items = [
    { path: '/', label: s.tabToday, Icon: IcCheck, bind: bindTap('tabbar.today') },
    { path: '/habits', label: s.tabHabits, Icon: IcGrid, bind: bindTap('tabbar.habits') },
    { path: '/focus', label: s.tabFocus, Icon: IcTomato, bind: bindTap('tabbar.focus') },
    { path: '/stats', label: s.tabStats, Icon: IcBars, bind: bindTap('tabbar.stats') },
    { path: '/me', label: s.tabProfile, Icon: IcUser, bind: bindTap('tabbar.profile') },
  ];
  return (
    <div data-hide-on-keyboard className="pointer-events-none absolute inset-x-0 bottom-2 z-40 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-app-surface px-3 py-1.5 shadow-[0_4px_18px_rgba(0,0,0,0.22)]">
        {items.map((it) => {
          const active = pathname === it.path;
          return (
            <button key={it.path} {...it.bind} aria-label={it.label}
              className="flex h-11 w-12 items-center justify-center rounded-full"
              style={active ? { background: 'var(--app-c-ink-strong)', color: 'var(--app-bg)' } : { color: 'var(--app-text-muted)' }}>
              <it.Icon size={21} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TabBar;

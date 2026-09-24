import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { IcTasks, IcCalendar, IcMatrix, IcFocus, IcMe } from '../res/icons';

const TabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useDidaGestures();
  const { t } = useI18n();
  const { accentHex } = useDidaTheme();
  void t;
  const items = [
    { path: '/', key: 'nav.tasks', Icon: IcTasks, bind: bindTap('tabbar.tasks') },
    { path: '/calendar', key: 'nav.calendar', Icon: IcCalendar, bind: bindTap('tabbar.calendar') },
    { path: '/matrix', key: 'nav.matrix', Icon: IcMatrix, bind: bindTap('tabbar.matrix') },
    { path: '/focus', key: 'nav.focus', Icon: IcFocus, bind: bindTap('tabbar.focus') },
    { path: '/me', key: 'nav.me', Icon: IcMe, bind: bindTap('tabbar.me') },
  ];
  return (
    <div
      data-hide-on-keyboard
      className="dida-card mx-3 mb-2 flex shrink-0 items-center justify-around rounded-full px-2 py-2"
    >
      {items.map((it) => {
        const active = pathname === it.path;
        return (
          <button
            key={it.path}
            {...it.bind}
            aria-label={it.key}
            className="flex flex-col items-center gap-0.5 border-none bg-transparent px-3 py-1"
            style={{ color: active ? accentHex : 'var(--dida-muted)' }}
          >
            <it.Icon size={22} />
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;

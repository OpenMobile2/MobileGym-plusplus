import React from 'react';
import { useLocation } from 'react-router-dom';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { IcTodo, IcLock, IcStats, IcTimeline, IcProfile } from '../res/icons';

const TabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useFanqieTodoGestures();
  const { t } = useI18n();
  // bindTap 必须传字符串字面量(静态分析要求),故逐个显式绑定
  const items = [
    { path: '/', key: 'nav.todo', Icon: IcTodo, bind: bindTap('tabbar.todo') },
    { path: '/lock', key: 'nav.lock', Icon: IcLock, bind: bindTap('tabbar.lock') },
    { path: '/stats', key: 'nav.stats', Icon: IcStats, bind: bindTap('tabbar.stats') },
    { path: '/timeline', key: 'nav.timeline', Icon: IcTimeline, bind: bindTap('tabbar.timeline') },
    { path: '/profile', key: 'nav.profile', Icon: IcProfile, bind: bindTap('tabbar.profile') },
  ];
  return (
    <div data-hide-on-keyboard className="flex shrink-0 items-center justify-around border-t border-app-border bg-white pb-1 pt-1.5">
      {items.map((it) => {
        const active = pathname === it.path;
        return (
          <button key={it.path} {...it.bind}
            className="flex w-1/5 flex-col items-center gap-0.5 border-none bg-transparent py-1"
            style={{ color: active ? '#4A90D9' : '#8A8F99' }}>
            <it.Icon size={22} />
            <span className="text-[11px]">{t(it.key)}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabBar;

import React from 'react';
import { useLocation } from 'react-router-dom';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { IcHome, IcBook, IcTrain, IcMall } from '../res/icons';
const TabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useBaicizhanGestures();
  const s = useStrings();
  const tabs = [
    { path: '/', bind: bindTap('tabbar.home'), icon: IcHome, label: s.tabHome },
    { path: '/course', bind: bindTap('tabbar.course'), icon: IcBook, label: s.tabCourse },
    { path: '/train', bind: bindTap('tabbar.train'), icon: IcTrain, label: s.tabTrain },
    { path: '/mall', bind: bindTap('tabbar.mall'), icon: IcMall, label: s.tabMall },
  ];
  return (
    <nav className="flex h-14 items-stretch border-t border-app-border bg-app-surface backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ path, bind, icon: Icon, label }) => {
        const active = pathname === path;
        const c = active ? 'var(--app-c-primary)' : 'var(--app-c-ink-sub)';
        return (
          <button key={path} {...bind}
            className="flex flex-1 flex-col items-center justify-center gap-1">
            <Icon size={22} color={c} />
            <span className="text-[10px]" style={{ color: c }}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default TabBar;

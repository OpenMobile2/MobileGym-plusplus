import React from 'react';
import { useLocation } from 'react-router-dom';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcHome, IcBook, IcTogether, IcUser } from '../res/icons';
const ReadTabBar: React.FC = () => {
  const { pathname } = useLocation();
  const { bindTap } = useBaicizhanGestures();
  const s = useStrings();
  const tabs = [
    { path: '/read', bind: bindTap('read.tabbar.home'), icon: IcHome, label: s.readTabHome },
    { path: '/read/mine', bind: bindTap('read.tabbar.mine'), icon: IcBook, label: s.readTabMine },
    { path: '/read/camp', bind: bindTap('read.tabbar.camp'), icon: IcTogether, label: s.readTabCamp },
    { path: '/read/profile', bind: bindTap('read.tabbar.profile'), icon: IcUser, label: s.readTabProfile },
  ];
  return (
    <nav className="flex h-14 items-stretch border-t border-[#EAEFEF] bg-white"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {tabs.map(({ path, bind, icon: Icon, label }) => {
        const active = pathname === path;
        const c = active ? colors.readTeal : colors.inkSub;
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

export default ReadTabBar;

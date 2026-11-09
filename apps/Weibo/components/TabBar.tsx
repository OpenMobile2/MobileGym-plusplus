import React from 'react';
import { useLocation } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings } from './ui';
import { IcHome, IcVideo, IcDiscover, IcMessage, IcMe, IcUp } from '../res/icons';

export function TabBar({ dark, scrolled, onScrollTop }: { dark?: boolean; scrolled?: boolean; onScrollTop?: () => void }) {
  const s = useStrings();
  const { bindTap } = useWeiboGestures();
  const location = useLocation();
  const unread = useWeiboStore((st) => st.unreadTotal);

  // ID 必须字符串字面量(AGENTS 合同),逐 tab 显式绑定
  const homeActive = location.pathname === '/';
  const homeBinding = homeActive && scrolled
    ? bindTap({ kind: 'action', id: 'tabbar.home.scrollTop' }, { onTrigger: () => onScrollTop?.() })
    : bindTap('tabbar.home-open');
  const tabs = [
    { route: '/', binding: homeBinding, label: s.tabHome, Icon: IcHome, showUp: homeActive && scrolled },
    { route: '/video', binding: bindTap('tabbar.video-open'), label: s.tabVideo, Icon: IcVideo },
    { route: '/discover', binding: bindTap('tabbar.discover-open'), label: s.tabDiscover, Icon: IcDiscover },
    { route: '/message', binding: bindTap('tabbar.message-open'), label: s.tabMessage, Icon: IcMessage },
    { route: '/me', binding: bindTap('tabbar.me-open'), label: s.tabMe, Icon: IcMe },
  ];

  return (
    <div className={`flex items-stretch h-12 border-t ${dark ? 'bg-black border-[#222]' : 'bg-white border-[#F2F2F2]'}`}>
      {tabs.map(({ route, binding, label, Icon, showUp }) => {
        const active = location.pathname === route;
        return (
          <button
            key={route}
            {...binding}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 border-none bg-transparent cursor-pointer relative ${
              active ? (dark ? 'text-white' : 'text-[#1A1A1A]') : 'text-[#9A9A9A]'
            }`}
          >
            {showUp ? <IcUp size={22} /> : <Icon size={22} fill={active ? 'currentColor' : 'none'} />}
            <span className="text-[10px] leading-none">{label}</span>
            {route === '/message' && unread > 0 && (
              <span className="absolute top-0.5 left-1/2 ml-1.5 min-w-[16px] h-4 px-1 rounded-full bg-[#FF3852] text-white text-[10px] leading-4 text-center">
                {unread}
              </span>
            )}
            {route === '/me' && <span className="absolute top-1 left-1/2 ml-2 w-2 h-2 rounded-full bg-[#FF3852]" />}
          </button>
        );
      })}
    </div>
  );
}

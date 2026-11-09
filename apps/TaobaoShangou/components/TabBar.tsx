import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { MAIN_TABS } from '../constants';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { IcChat, IcCart, IcHouse, IcTicket, IcUser } from '../res/icons';

const ICONS = { IcHouse, IcTicket, IcChat, IcCart, IcUser } as const;

export function TabBar() {
  const s = useAppStrings(strings, stringsEn);
  const { pathname } = useLocation();
  const { bindTap } = useTbsgGestures();
  const unread = useTbsgStore((st) => st.messages.reduce((a, m) => a + (m.unread ?? 0), 0));
  const cartCount = useTbsgStore((st) => st.cart.reduce((a, l) => a + l.qty, 0));

  return (
    <div className="flex bg-white border-t border-[#EEEEEE] h-14">
      {MAIN_TABS.map((tab) => {
        const active = pathname === tab.route;
        const Icon = ICONS[tab.icon as keyof typeof ICONS];
        const badge = tab.id === 'messages' ? unread : tab.id === 'cart' ? cartCount : 0;
        return (
          <button
            key={tab.id}
            {...(tab.id === 'home' ? bindTap<HTMLButtonElement>('tabbar.home-open')
              : tab.id === 'redpacket' ? bindTap<HTMLButtonElement>('tabbar.redpacket-open')
                : tab.id === 'messages' ? bindTap<HTMLButtonElement>('tabbar.message-open')
                  : tab.id === 'cart' ? bindTap<HTMLButtonElement>('tabbar.cart-open')
                    : bindTap<HTMLButtonElement>('tabbar.mine-open'))}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer relative"
          >
            <span className="relative">
              <Icon size={22} className={active ? 'text-[#ED6C2C]' : 'text-[#999999]'} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 rounded-full bg-[#F53F3F] text-white text-[10px] flex items-center justify-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span className={`text-[10px] ${active ? 'text-[#ED6C2C] font-medium' : 'text-[#999999]'}`}>
              {s[tab.labelKey as keyof typeof s] as string}
            </span>
          </button>
        );
      })}
    </div>
  );
}

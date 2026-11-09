import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { IcHome, IcDiscover, IcCoupon, IcMessage, IcUser } from '../res/icons';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useCainiaoGestures } from '../hooks/useCainiaoGestures';
import { useCainiaoStore } from '../state';

const TABS = [
  { path: '/', icon: IcHome, label: 'tabHome' as const },
  { path: '/discover', icon: IcDiscover, label: 'tabDiscover' as const },
  { path: '/coupons', icon: IcCoupon, label: 'tabCoupons' as const },
  { path: '/messages', icon: IcMessage, label: 'tabMessages' as const },
  { path: '/me', icon: IcUser, label: 'tabMe' as const },
] as const;

export default function TabBar() {
  const { pathname } = useLocation();
  const { bindTap } = useCainiaoGestures();
  const s = useAppStrings(strings, stringsEn);
  const unread = useCainiaoStore((st) => st.unread.wenwen + st.unread.package);

  const bindings = {
    '/': bindTap('tabbar.home', { nav: { mode: 'replace' } }),
    '/discover': bindTap('tabbar.discover', { nav: { mode: 'replace' } }),
    '/coupons': bindTap('tabbar.coupons', { nav: { mode: 'replace' } }),
    '/messages': bindTap('tabbar.messages', { nav: { mode: 'replace' } }),
    '/me': bindTap('tabbar.me', { nav: { mode: 'replace' } }),
  } as const;

  return (
    <div
      data-hide-on-keyboard
      className="flex h-14 shrink-0 items-stretch border-t border-(--app-c-border) bg-(--app-c-card-bg)"
    >
      {TABS.map(({ path, icon: Icon, label }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            {...bindings[path]}
            className="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent"
          >
            <div className="relative">
              <Icon
                size={22}
                className={active ? 'text-(--app-c-brand)' : 'text-(--app-c-text-muted)'}
                strokeWidth={active ? 2.4 : 2}
              />
              {path === '/messages' && unread > 0 && (
                <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-(--app-c-danger) px-1 text-center text-[10px] leading-4 text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] leading-3 ${active ? 'font-semibold text-(--app-c-brand)' : 'text-(--app-c-text-muted)'}`}
            >
              {s[label]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

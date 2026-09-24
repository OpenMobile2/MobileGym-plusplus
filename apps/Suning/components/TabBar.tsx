import React from 'react';
import { useLocation } from 'react-router-dom';
import { IcHome, IcDiscover, IcCart, IcUser } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';

/**
 * 底部主 Tab(s273):首页 / 发现 / 购物车(角标=Σqty,跨页联动) / 我的易购。
 * 走查 0729:选中时仍显示「发现」(覆盖原拍板#7「选中显示直播」)。
 */
export default function TabBar() {
  const { pathname } = useLocation();
  const { bindTap } = useSuningGestures();
  const S = useStrings();
  const cartItems = useSuningStore((s) => s.cartItems);
  const cartCount = cartItems.reduce((sum, i) => sum + i.qty, 0);

  const bindings = {
    '/': bindTap('tabbar.home.open', { nav: { mode: 'replace' } }),
    '/discover': bindTap('tabbar.discover.open', { nav: { mode: 'replace' } }),
    '/cart': bindTap('tabbar.cart.open', { nav: { mode: 'replace' } }),
    '/me': bindTap('tabbar.me.open', { nav: { mode: 'replace' } }),
  } as const;

  const tabs = [
    { path: '/' as const, Icon: IcHome, label: S.tabHome, badge: 0 },
    { path: '/discover' as const, Icon: IcDiscover, label: S.tabDiscover, badge: 0 },
    { path: '/cart' as const, Icon: IcCart, label: S.tabCart, badge: cartCount },
    { path: '/me' as const, Icon: IcUser, label: S.tabMe, badge: 0 },
  ];

  return (
    <div data-hide-on-keyboard className="flex h-14 shrink-0 items-stretch border-t border-[var(--app-border)] bg-[var(--app-tab-bar-bg)]">
      {tabs.map(({ path, Icon, label, badge }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            {...bindings[path]}
            className="relative flex flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent"
          >
            <span className="relative">
              <Icon size={22} className={active ? 'text-[var(--app-primary)]' : 'text-[var(--app-c-text_muted)]'} strokeWidth={active ? 2.4 : 2} />
              {badge > 0 && (
                <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-full bg-[var(--app-c-danger)] px-1 text-center text-[10px] leading-4 text-white">
                  {badge}
                </span>
              )}
            </span>
            <span className={`text-[10px] leading-3 ${active ? 'font-semibold text-[var(--app-primary)]' : 'text-[var(--app-c-text_muted)]'}`}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

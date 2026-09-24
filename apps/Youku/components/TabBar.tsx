import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { TABS } from '../constants';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

const TAB_LABEL: Record<(typeof TABS)[number]['path'], keyof typeof strings> = {
  '/': 'tabHome',
  '/shorts': 'tabShorts',
  '/vip': 'tabVip',
  '/taohaopian': 'tabTaohaopian',
  '/me': 'tabMe',
};

/**
 * 底部 5 tab:首页/短剧/会员/淘好片/我的。
 * 文案走 useAppStrings;底色/字色走 --app-c-* token(随 OS 深色)。
 */
export default function TabBar() {
  const { pathname } = useLocation();
  const { bindTap } = useYoukuGestures();
  const s = useAppStrings(strings, stringsEn);
  const msgUnread = useYoukuStore(
    (st) => st.unread.likes + st.unread.comments + st.unread.danmu + st.unread.fans + st.unread.vip + st.unread.system,
  );
  void msgUnread;

  const bindings = {
    '/': bindTap('chrome.tabbar.home.open'),
    '/shorts': bindTap('chrome.tabbar.shorts.open'),
    '/vip': bindTap('chrome.tabbar.vip.open'),
    '/taohaopian': bindTap('chrome.tabbar.taohaopian.open'),
    '/me': bindTap('chrome.tabbar.me.open'),
  } as const;

  return (
    <div
      data-hide-on-keyboard
      className="flex h-12 shrink-0 items-stretch border-t border-(--app-c-divider) bg-(--app-c-page-bg)"
    >
      {TABS.map(({ path }) => {
        const active =
          pathname === path ||
          (path === '/' && pathname.startsWith('/home/')) ||
          (path === '/shorts' && pathname.startsWith('/shorts/')) ||
          (path === '/taohaopian' && pathname.startsWith('/taohaopian/'));
        return (
          <button
            key={path}
            {...bindings[path]}
            className="flex flex-1 cursor-pointer items-center justify-center border-none bg-transparent"
          >
            <span
              className={
                active
                  ? 'text-[15px] font-bold text-(--app-c-text-primary)'
                  : 'text-[13px] font-normal text-(--app-c-text-muted)'
              }
            >
              {s[TAB_LABEL[path]]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

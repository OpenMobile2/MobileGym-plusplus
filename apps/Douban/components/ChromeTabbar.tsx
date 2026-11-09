import React from 'react';
import { useLocation } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStrings } from '../hooks/useDoubanStrings';
import { useDoubanStore } from '../state';
import { Avatar, C } from './ui';

// 底部 TabBar(chrome.tabbar,evidence IMG_0209/IMG_0390):
// 图标+文字两行(~56px 高);「我」= 用户头像(激活时 2px 绿圈)。
// 当前 Tab 再点为空操作(noop),避免 go() 抛 from 不匹配。
const noop = () => undefined;

const GREEN = '#00B51D';
const GREY = '#8A8F99';

/** 线性图标(1.8 描边,激活绿/未激活灰) */
function TabIcon({ name, active }: { name: 'home' | 'bm' | 'group' | 'market'; active: boolean }) {
  const stroke = active ? GREEN : GREY;
  const common = {
    width: 24,
    height: 24,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M4.5 10.5L12 4l7.5 6.5" />
          <path d="M6.5 9.2V19a1 1 0 001 1h9a1 1 0 001-1V9.2" />
        </svg>
      );
    case 'bm':
      return (
        <svg {...common}>
          <rect x="4" y="3.5" width="16" height="17" rx="3" />
          <path d="M12 8l1.15 2.3 2.5.37-1.8 1.76.42 2.5L12 13.75l-2.27 1.18.42-2.5-1.8-1.76 2.5-.37z" />
        </svg>
      );
    case 'group':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 12c-1.4-2.7-1-5.7.1-8.4" />
          <path d="M12 12c3 .8 5.5 2.6 7.2 4.5" />
          <path d="M12 12c-3 .8-5.6 2.5-7.3 4.4" />
        </svg>
      );
    case 'market':
      return (
        <svg {...common}>
          <path d="M5.6 4.5h12.8l1.9 4.6H3.7z" />
          <path d="M5 9.4V19a1 1 0 001 1h12a1 1 0 001-1V9.4" />
          <path d="M9.8 20v-5.4h4.4V20" />
        </svg>
      );
  }
}

/** 「我」= 头像;激活时 2px 绿圈(总占位恒定 28px,避免切换跳动) */
function MeAvatar({ active }: { active: boolean }) {
  const currentUser = useDoubanStore((s) => s.currentUser);
  return (
    <span
      className="rounded-full flex items-center justify-center shrink-0 box-border"
      style={{
        width: 28,
        height: 28,
        border: active ? `2px solid ${GREEN}` : '2px solid transparent',
        padding: 1,
      }}
    >
      <Avatar src={currentUser.avatar} size={22} />
    </span>
  );
}

export function ChromeTabbar() {
  const { bindTap } = useDoubanGestures();
  const s = useDoubanStrings();
  const { pathname } = useLocation();
  const tabCls =
    'flex-1 h-full flex flex-col items-center justify-center gap-1 bg-transparent border-none cursor-pointer';
  const labelCls = (active: boolean) =>
    `text-[10px] leading-none ${active ? 'font-semibold' : ''}`;
  const labelStyle = (active: boolean) => ({ color: active ? GREEN : GREY });
  return (
    <div
      className="h-[56px] shrink-0 flex border-t bg-app-surface"
      style={{ borderColor: C.border }}
      data-hide-on-keyboard="true"
    >
      <button {...bindTap('tabbar.home-open', pathname === '/' ? { onTrigger: noop } : undefined)} className={tabCls}>
        <TabIcon name="home" active={pathname === '/'} />
        <span className={labelCls(pathname === '/')} style={labelStyle(pathname === '/')}>{s.tabHome}</span>
      </button>
      <button {...bindTap('tabbar.bm-open', pathname.startsWith('/bm/') ? { onTrigger: noop } : undefined)} className={tabCls}>
        <TabIcon name="bm" active={pathname.startsWith('/bm/')} />
        <span className={labelCls(pathname.startsWith('/bm/'))} style={labelStyle(pathname.startsWith('/bm/'))}>{s.tabBookMovie}</span>
      </button>
      <button {...bindTap('tabbar.group-open', pathname === '/group' ? { onTrigger: noop } : undefined)} className={tabCls}>
        <TabIcon name="group" active={pathname === '/group'} />
        <span className={labelCls(pathname === '/group')} style={labelStyle(pathname === '/group')}>{s.tabGroup}</span>
      </button>
      <button {...bindTap('tabbar.market-open', pathname === '/market' ? { onTrigger: noop } : undefined)} className={tabCls}>
        <TabIcon name="market" active={pathname === '/market'} />
        <span className={labelCls(pathname === '/market')} style={labelStyle(pathname === '/market')}>{s.tabMarket}</span>
      </button>
      <button {...bindTap('tabbar.mine-open', pathname === '/mine' ? { onTrigger: noop } : undefined)} className={tabCls}>
        <MeAvatar active={pathname === '/mine'} />
        <span className={labelCls(pathname === '/mine')} style={labelStyle(pathname === '/mine')}>{s.tabMe}</span>
      </button>
    </div>
  );
}

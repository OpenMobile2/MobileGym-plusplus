import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C } from './ui';

// 左侧抽屉(chrome.drawer,evidence IMG_0230):
// ?drawer=open 时可见;左侧 ~65% 宽白面板压深色遮罩;遮罩点按/×/系统返回 = back() 弹栈。
// 结构:顶行(× 关闭 = bindBack + 扫码)/头部(头像+用户名 → mine.profile,名下「我的背包 [豆]N ›」描边小胶囊 → bag.mine)/
//   纵向条目(草稿箱·收藏/豆列·关注·历史·足迹)— 细分隔线 —(未成年·设置·帮助·社区),条目无右箭头/
//   底部 2×3 宫格浮起白圆角卡(订单·购物车·钱包·豆瓣时间·豆瓣阅读书架·每日福利,深灰线性图标)/
//   灰字页脚「豆 豆瓣 证照信息 ›」(纯展示)。
// 绑定 id 全部字面量,页面侧生成 —— gate 依赖这些 drawer.* 字面量。

/** 纵向条目行(左图标 + 文案,无右箭头,evidence IMG_0230) */
function DrawerRow({
  icon,
  label,
  bind,
}: {
  icon: React.ReactNode;
  label: string;
  bind: object;
}) {
  return (
    <button
      {...bind}
      className="w-full flex items-center gap-3.5 h-12 px-5 bg-transparent border-none cursor-pointer text-left"
    >
      <span className="w-5 h-5 flex items-center justify-center shrink-0" style={{ color: '#494F57' }}>
        {icon}
      </span>
      <span className="flex-1 text-[15px]" style={{ color: C.text }}>
        {label}
      </span>
    </button>
  );
}

/** 底部宫格格子(上图标 + 下文案,深灰线性图标) */
function GridCell({
  icon,
  label,
  bind,
}: {
  icon: React.ReactNode;
  label: string;
  bind: object;
}) {
  return (
    <button
      {...bind}
      className="flex flex-col items-center justify-center gap-1.5 py-3 bg-transparent border-none cursor-pointer"
    >
      <span className="w-6 h-6 flex items-center justify-center" style={{ color: '#494F57' }}>
        {icon}
      </span>
      <span className="text-[11px] whitespace-nowrap" style={{ color: C.text }}>
        {label}
      </span>
    </button>
  );
}

// 轻量线性图标(1.7 描边,继承 currentColor)
const Ico = {
  drafts: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6M8 13h8M8 17h6" />
    </svg>
  ),
  collect: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
    </svg>
  ),
  follow: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  history: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 106 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  footprint: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 21s-8-4.5-8-11a5 5 0 019.5-2A5 5 0 0120 10c0 6.5-8 11-8 11z" />
    </svg>
  ),
  minor: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.6a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  help: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  ),
  community: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  ),
  orders: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
      <path d="M3 6h18M16 10a4 4 0 01-8 0" />
    </svg>
  ),
  cart: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  ),
  wallet: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M21 12V7H5a2 2 0 010-4h14v4" />
      <path d="M3 5v14a2 2 0 002 2h16v-5" />
      <path d="M18 12a2 2 0 000 4h4v-4z" />
    </svg>
  ),
  time: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  ),
  book: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
    </svg>
  ),
  bonus: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 01-2 2H7a2 2 0 01-2-2v-7" />
      <path d="M12 8H7.5a2.5 2.5 0 010-5C11 3 12 8 12 8zM12 8h4.5a2.5 2.5 0 000-5C13 3 12 8 12 8z" />
    </svg>
  ),
};

/** 小豆(绿豆粒,背包胶囊内) */
const BeanIcon = (
  <svg width="12" height="12" viewBox="0 0 12 12" className="shrink-0">
    <ellipse cx="6" cy="6.4" rx="4.6" ry="4" fill="#6FBF4C" />
    <ellipse cx="4.6" cy="4.9" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.65" />
  </svg>
);

export function ChromeDrawer() {
  const [searchParams] = useSearchParams();
  const { bindTap, bindBack, back } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);

  if (searchParams.get('drawer') !== 'open') return null;

  const beans = currentUser.beans ?? 0;

  return (
    <div className="absolute inset-0 z-40 flex" data-status-bar-foreground="dark">
      {/* 左侧面板 ~65% */}
      <div
        className="h-full flex flex-col shrink-0 pt-10"
        style={{ width: '65%', background: C.surface, boxShadow: '2px 0 16px rgba(0,0,0,0.12)' }}
      >
        {/* 顶行:× 关闭(system.back,与遮罩同为弹栈)+ 扫码(右上,无白圈底) */}
        <div className="shrink-0 flex items-center justify-between px-2 pt-1">
          <button
            {...bindBack()}
            className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="关闭"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'drawer.scan.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="扫码"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.text} strokeWidth="1.8">
              <path d="M3 7V5a2 2 0 012-2h2M17 3h2a2 2 0 012 2v2M21 17v2a2 2 0 01-2 2h-2M7 21H5a2 2 0 01-2-2v-2" />
              <path d="M3 12h18" />
            </svg>
          </button>
        </div>

        {/* 头部:头像 + 用户名 → mine.profile;名下「我的背包」描边小胶囊 → bag.mine */}
        <div className="shrink-0 px-4 pt-1 pb-3">
          <button
            {...bindTap('drawer.profile-open')}
            className="w-full flex items-center gap-3 bg-transparent border-none cursor-pointer text-left p-0"
          >
            <Avatar src={currentUser.avatar} size={48} />
            <span className="block min-w-0 flex-1 text-[18px] font-bold truncate" style={{ color: C.text }}>
              {currentUser.name}
            </span>
          </button>
          <div style={{ paddingLeft: 60 }} className="mt-1.5">
            <button
              {...bindTap('drawer.bag-open')}
              className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-transparent cursor-pointer"
              style={{ border: '1px solid #E2E5E9' }}
            >
              <span className="text-[12px]" style={{ color: C.text }}>
                我的背包
              </span>
              {BeanIcon}
              <span className="text-[12px]" style={{ color: C.text }}>
                {beans}
              </span>
              <span className="text-[12px]" style={{ color: '#B9BEC6' }}>
                ›
              </span>
            </button>
          </div>
        </div>

        {/* 纵向条目 + 设置区(可滚动),组间细分隔线 */}
        <div
          className="flex-1 overflow-y-auto"
          data-scroll-container="drawer"
          data-scroll-direction="vertical"
        >
          <div className="py-1">
            <DrawerRow icon={Ico.drafts} label="草稿箱" bind={bindTap('drawer.drafts-open')} />
            <DrawerRow icon={Ico.collect} label="我的收藏/豆列" bind={bindTap('drawer.collect-open')} />
            <DrawerRow icon={Ico.follow} label="我的关注" bind={bindTap('drawer.follow-open')} />
            <DrawerRow icon={Ico.history} label="浏览历史" bind={bindTap('drawer.history-open')} />
            <DrawerRow icon={Ico.footprint} label="我的签到足迹" bind={bindTap('drawer.footprint-open')} />
          </div>

          <div className="mx-5 h-px" style={{ background: C.border }} />

          <div className="py-1">
            <DrawerRow icon={Ico.minor} label="未成年人模式" bind={bindTap('drawer.minor-open')} />
            <DrawerRow icon={Ico.settings} label="设置" bind={bindTap('drawer.settings-open')} />
            <DrawerRow icon={Ico.help} label="帮助与反馈" bind={bindTap('drawer.help-open')} />
            <DrawerRow icon={Ico.community} label="社区管理中心" bind={bindTap('drawer.community-open')} />
          </div>
        </div>

        {/* 底部 2×3 宫格:浮起白圆角卡(带外边距) */}
        <div
          className="shrink-0 grid grid-cols-3 mx-3 mb-2 rounded-2xl"
          style={{ background: C.surface, boxShadow: '0 1px 10px rgba(0,0,0,0.08)' }}
        >
          <GridCell icon={Ico.orders} label="订单" bind={bindTap('drawer.orders-open')} />
          <GridCell icon={Ico.cart} label="购物车" bind={bindTap('drawer.cart-open')} />
          <GridCell icon={Ico.wallet} label="钱包" bind={bindTap('drawer.wallet-open')} />
          <GridCell icon={Ico.time} label="豆瓣时间" bind={bindTap('drawer.time-open')} />
          <GridCell
            icon={Ico.book}
            label="豆瓣阅读书架"
            bind={bindTap({ kind: 'action', id: 'drawer.readingShelf.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          />
          <GridCell
            icon={Ico.bonus}
            label="每日福利"
            bind={bindTap({ kind: 'action', id: 'drawer.dailyBonus.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
          />
        </div>

        {/* 灰字页脚(纯展示,不导航):豆 豆瓣 证照信息 › */}
        <div className="shrink-0 flex items-center justify-center gap-1.5 pb-4">
          <span
            className="w-4 h-4 rounded-[3px] flex items-center justify-center text-[10px] leading-none"
            style={{ background: '#C9CDD3', color: '#FFFFFF' }}
          >
            豆
          </span>
          <span className="text-[12px]" style={{ color: '#A9AEB6' }}>
            豆瓣
          </span>
          <span className="text-[12px] ml-2" style={{ color: '#A9AEB6' }}>
            证照信息 ›
          </span>
        </div>
      </div>

      {/* 右侧深色遮罩:点按 = back() 弹栈关闭(drawer.panel.close) */}
      <button
        {...bindTap({ kind: 'action', id: 'drawer.panel.close' }, { onTrigger: () => back() })}
        className="flex-1 h-full border-none cursor-pointer"
        style={{ background: 'rgba(0,0,0,0.45)' }}
        aria-label="关闭抽屉"
      />
    </div>
  );
}

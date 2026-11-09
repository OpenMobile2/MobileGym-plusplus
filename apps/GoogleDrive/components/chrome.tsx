// apps/GoogleDrive/components/chrome.tsx — 顶栏 / 底部 Tab 栏 / 双 FAB
import React from 'react';
import { useLocation } from 'react-router-dom';
import { AsyncFsImage } from '@/os/components/AsyncFsImage';
import { GD } from '../res/colors';
import { DIM } from '../res/dimens';
import { TABS } from '../constants';
import { IcMenu, IcGemini, IcScan } from '../res/icons';
import { useGoogleDriveGestures } from '../hooks/useGoogleDriveGestures';
import { useGoogleDriveStrings } from '../hooks/useGoogleDriveStrings';
import { useGoogleDriveStore } from '../state';
import { showToast, type BindProps } from './common';

/**
 * 顶部搜索栏（IMG_2219）：胶囊形，左汉堡、中占位文字、右 ✦ 与头像。
 * 汉堡与头像的 transitionId 逐宿主不同（同路由浮层），由调用页绑定好传进来；
 * 搜索与 Gemini 是跨路由的单一 id，在这里直接绑字面量。
 */
export const TopSearchBar: React.FC<{
  drawerProps: BindProps;
  accountProps: BindProps;
}> = ({ drawerProps, accountProps }) => {
  const s = useGoogleDriveStrings();
  const { bindTap } = useGoogleDriveGestures();
  const user = useGoogleDriveStore(st => st.user);
  return (
    <div className="shrink-0 flex items-center" style={{ height: DIM.topBarH, paddingLeft: DIM.pagePadding, paddingRight: DIM.pagePadding }}>
      <div
        className="flex-1 flex items-center rounded-full h-11 pl-1 pr-1.5"
        style={{ background: GD.searchBg }}
      >
        <button {...drawerProps} className="w-10 h-10 flex items-center justify-center shrink-0" aria-label={s.a11y_menu}>
          <IcMenu size={20} color={GD.textSecondary} />
        </button>
        <button
          {...bindTap('googledrive.search.open')}
          className="flex-1 h-10 text-left text-[15px] truncate"
          style={{ color: GD.textPlaceholder }}
        >
          {s.search_placeholder}
        </button>
        <button {...bindTap('googledrive.gemini.open')} className="w-9 h-9 flex items-center justify-center shrink-0" aria-label={s.a11y_gemini}>
          <IcGemini size={19} color={GD.textSecondary} />
        </button>
        <button {...accountProps} className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 ml-0.5 overflow-hidden" aria-label={s.a11y_account}>
          {user.avatar ? (
            <AsyncFsImage path={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] text-white"
              style={{ background: user.avatarColor }}
            >
              {user.name.slice(0, 1)}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

/** 底部四个主 Tab（选中项图标外套蓝色药丸） */
export const TabBar: React.FC = () => {
  const s = useGoogleDriveStrings();
  const location = useLocation();
  const { bindTap } = useGoogleDriveGestures();
  /**
   * 点当前已选中的 Tab 要安静地什么都不做。
   *
   * 平台有两条规则在这里对撞：Tab 的 transition.from 不许包含自身目标（否则生成自环边），
   * 但 Tab 按钮又必须无条件打 data-trigger（否则静态扫描看不到入口、回放会断）。
   * 结果是点当前 Tab 时 go() 找不到合法来源、直接抛异常。
   * onTrigger 是「替换导航」语义，给个空实现即可 —— 打标保留，不再抛。
   */
  const noop = () => undefined;
  const isOn = (route: string) => location.pathname === route;
  const tapById = {
    home: bindTap('googledrive.tab.home', isOn('/') ? { onTrigger: noop } : undefined),
    starred: bindTap('googledrive.tab.starred', isOn('/starred') ? { onTrigger: noop } : undefined),
    shared: bindTap('googledrive.tab.shared', isOn('/shared') ? { onTrigger: noop } : undefined),
    files: bindTap('googledrive.tab.files', isOn('/files') ? { onTrigger: noop } : undefined),
  } as const;
  return (
    <div
      data-hide-on-keyboard
      className="shrink-0 flex items-stretch justify-around"
      style={{ height: DIM.tabBarH, background: GD.navbarBg }}
    >
      {TABS.map(tab => {
        const active = location.pathname === tab.route;
        const Icon = tab.icon;
        return (
          <button key={tab.id} {...tapById[tab.id]} className="flex flex-col items-center justify-center gap-1 w-16">
            <span
              className="flex items-center justify-center rounded-full"
              style={{ width: 56, height: 28, background: active ? GD.blueContainer : 'transparent' }}
            >
              <Icon
                size={20}
                color={active ? GD.text : GD.textSecondary}
                fill={active ? GD.text : 'none'}
                strokeWidth={active ? 1.5 : 2}
              />
            </span>
            <span className="text-[11px]" style={{ color: active ? GD.text : GD.textSecondary, fontWeight: active ? 600 : 400 }}>
              {s[tab.labelKey]}
            </span>
          </button>
        );
      })}
    </div>
  );
};

/** 右下双悬浮按钮：上=扫描（暂未开放），下=新建。同组一致，两个都必须可点。 */
export const Fabs: React.FC<{ createProps: BindProps }> = ({ createProps }) => {
  const s = useGoogleDriveStrings();

  return (
    <div className="absolute right-4 bottom-4 flex flex-col gap-3 z-[80]" data-hide-on-keyboard>
      <button
        data-action="googledrive.fab.scan.unavailable"
        onClick={() => showToast(s.toast_feature_unavailable)}
        className="rounded-2xl bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
        style={{ width: DIM.fab, height: DIM.fab }}
        aria-label={s.a11y_scan_fab}
      >
        <IcScan size={24} color={GD.blue} />
      </button>
      <button
        {...createProps}
        className="rounded-2xl bg-white flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.18)]"
        style={{ width: DIM.fab, height: DIM.fab }}
        aria-label={s.a11y_create_fab}
      >
        {/* ＋ 的四色十字（Google 品牌四色） */}
        <span className="relative" style={{ width: 24, height: 24 }}>
          <span className="absolute left-1/2 top-0 -translate-x-1/2" style={{ width: 3, height: 10, background: GD.brandRed }} />
          <span className="absolute left-1/2 bottom-0 -translate-x-1/2" style={{ width: 3, height: 10, background: GD.brandGreen }} />
          <span className="absolute top-1/2 left-0 -translate-y-1/2" style={{ height: 3, width: 10, background: GD.brandBlue }} />
          <span className="absolute top-1/2 right-0 -translate-y-1/2" style={{ height: 3, width: 10, background: GD.brandYellow }} />
        </span>
      </button>
    </div>
  );
};

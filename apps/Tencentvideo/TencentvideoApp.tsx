import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '@/os/utils/themeToCssVars';
import { applySkinToThemeColors } from '@/os/SkinService';
import { manifest } from './manifest';
import { ROUTES } from './pages/routes.generated';
import HomeFeedPage from './pages/HomeFeedPage';
import { TabBar, TABBAR_VISIBLE_ROUTES } from './components/TabBar';
import { Toast } from './components/ui';
import { Dialog } from './components/Sheet';
import { useTencentvideoGestures } from './hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from './hooks/useTencentvideoStrings';
import { CHROME_TOP_COLOR_KEY, TV_COLORS as C } from './constants';
import { useTencentvideoStore } from './state';
import { colors, colorsDark } from './res/colors';

/** 微信支付成功会发 tencentvideo.PAY_RESULT；与收银台回调并行，入账函数自身去重。 */
function TencentvideoPayResultListener() {
  const cashierPayMock = useTencentvideoStore((st) => st.cashierPayMock);
  useEffect(() => {
    const unregister = window.__OS__?.broadcast.registerReceiver(
      'tencentvideo.PAY_RESULT',
      (intent) => {
        if (intent.data?.resultCode !== 'OK') return;
        if (!useTencentvideoStore.getState().cashier.pendingOrder) return;
        cashierPayMock();
      },
    );
    return () => unregister?.();
  }, [cashierPayMock]);
  return null;
}

/** 注册 OS 返回键 + navigator。栈底交还 OS 退到桌面。 */
function TencentvideoNavigationHandler() {
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);
  const navRef = useRef(navigator as { index?: number; go?: (d: number) => void });
  const featureNotice = useTencentvideoStore((st) => st.featureNotice);
  const dismissFeatureNotice = useTencentvideoStore((st) => st.dismissFeatureNotice);
  navRef.current = navigator as { index?: number; go?: (d: number) => void };

  useEffect(() => {
    const mem = navigator as { index?: number };
    if (typeof mem.index === 'number') historyIndexRef.current = mem.index;
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    if (featureNotice) {
      dismissFeatureNotice();
      return true;
    }
    const mem = navRef.current;
    const idx = typeof mem.index === 'number' ? mem.index : historyIndexRef.current;
    if (idx > 0) {
      mem.go?.(-1);
      return true;
    }
    return false;
  }, [dismissFeatureNotice, featureNotice]);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      if (typeof path !== 'string') return;
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

/** 所有未实现入口共用的阻断式说明；确认和系统返回都只关闭弹窗。 */
function FeatureNoticeDialog() {
  const notice = useTencentvideoStore((st) => st.featureNotice);
  const { bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  if (!notice) return null;
  return (
    <Dialog
      title={notice}
      dismissOnBackdrop={false}
      footer={(
        <button
          {...bindBack()}
          className="w-full h-10 rounded-full border-none text-[14px] font-medium text-white"
          style={{ background: C.primary }}
        >
          {s.confirm}
        </button>
      )}
    >
      {s.notOpenDetail}
    </Dialog>
  );
}

/** 深色页集合(好片 tab / 年度活动 / 竖屏流 / 全屏播放器;design-tokens §四,保真 A2)。
 * 整页黑底 + 浅色状态栏 + 浅色手势条。 */
const DARK_ROUTES = new Set([
  '/haopian', '/activity/yearly', '/home/short-video',
  '/shortdrama/player', '/player/fullscreen',
  // 播放器弹层组:横屏是全黑舞台,竖屏是压暗的播放页 —— 两种都要浅色状态栏(证据 820/854)
  '/player/sheets',
  // SVIP 权益墙只从播放器/下载的深色面板弹出,底衬同为黑
  '/vip/wall',
]);

/**
 * 黑顶沉浸但下半页仍是白底的路由:只切浅色状态栏图标,不染整页黑底
 * (证据 824/825 详情黑播放器顶;若进 DARK_ROUTES 会把白底内容区染黑)。
 */
const LIGHT_STATUS_ROUTES = new Set([
  '/detail/series',
  '/detail/movie',
  '/detail/special',
  '/detail/sports',
  '/player/portrait',
]);

function AppShell() {
  const { pathname } = useLocation();
  const { isDark } = useDarkMode();
  const [focusModality, setFocusModality] = useState<'pointer' | 'keyboard'>('pointer');
  const isTab = TABBAR_VISIBLE_ROUTES.includes(pathname);
  const dark = DARK_ROUTES.has(pathname);
  // 沉浸态页面(首页/频道页未滚动)把 banner 取色写进 store,状态栏占位跟着上色。
  const topColor = useTencentvideoStore((st) => st.ui[CHROME_TOP_COLOR_KEY]);
  const immersive = typeof topColor === 'string' && topColor !== '';
  const lightFg = dark || immersive || LIGHT_STATUS_ROUTES.has(pathname) || (isDark && !dark);
  const pageBg = dark ? C.darkBg : 'var(--app-bg, #FFFFFF)';
  return (
    <div
      className="flex flex-col h-full"
      style={{ background: pageBg }}
      data-app-surface="tencentvideo"
      data-focus-modality={focusModality}
      onPointerDownCapture={() => setFocusModality('pointer')}
      onKeyDownCapture={(event) => {
        if (event.key === 'Tab') setFocusModality('keyboard');
      }}
      data-status-bar-foreground={lightFg ? 'light' : 'dark'}
      data-navigation-bar-foreground={dark || isDark ? 'light' : 'dark'}
    >
      <div className="h-10 shrink-0" style={immersive ? { background: topColor as string } : undefined} />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<HomeFeedPage />} />
        </Routes>
        <Toast />
        <FeatureNoticeDialog />
      </div>
      {isTab && <TabBar />}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function TencentvideoApp() {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(applySkinToThemeColors(themeColors)),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };
  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <TencentvideoNavigationHandler />
        <TencentvideoPayResultListener />
        <AppShell />
      </MemoryRouter>
    </div>
  );
}

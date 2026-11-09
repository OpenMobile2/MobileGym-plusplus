import React, { useContext, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, useNavigate, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { dimensToCssVars, themeToCssVars } from '@/os/utils/themeToCssVars';
import { applySkinToThemeColors } from '@/os/SkinService';
import { manifest } from './manifest';
import { MAIN_TABS, HOME_SEGMENTS } from './constants';
import { useXianyuStore } from './state';
import { useAppNavigate } from './navigation';
import { backSkippingOverlays } from './navigationBack';
import { useXianyuGestures } from './hooks/useXianyuGestures';
import { useXianyuStrings } from './hooks/useXianyuStrings';
import { colors, colorsDark } from './res/colors';
import { IcTabHome, IcTabNearby, IcTabMessage, IcTabMine, IcTabPublish } from './res/icons';

import HomePage from './pages/HomePage';
import MinePage from './pages/MinePage';
import MessageListPage from './pages/MessageListPage';
import NearbyPage from './pages/NearbyPage';
import MarketPage from './pages/MarketPage';
import CircleSquarePage from './pages/CircleSquarePage';
import CircleDiscoverPage from './pages/CircleDiscoverPage';
import CircleDetailPage from './pages/CircleDetailPage';
import RecyclePage from './pages/RecyclePage';
import RecycleEstimatePage from './pages/RecycleEstimatePage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ChatPage from './pages/ChatPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import PayPage from './pages/PayPage';
import PaySuccessPage from './pages/PaySuccessPage';
import PublishEntryPage from './pages/PublishEntryPage';
import PublishEditPage from './pages/PublishEditPage';
import FavoritesPage from './pages/FavoritesPage';
import FootprintsPage from './pages/FootprintsPage';
import OrdersBoughtPage from './pages/OrdersBoughtPage';
import OrdersSoldPage from './pages/OrdersSoldPage';
import OrderDetailPage from './pages/OrderDetailPage';
import PublishedPage from './pages/PublishedPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import ReviewWritePage from './pages/ReviewWritePage';
import CouponsPage from './pages/CouponsPage';
import AddressEntryPage from './pages/AddressEntryPage';
import AddressListPage from './pages/AddressListPage';
import AddressEditPage from './pages/AddressEditPage';
import ReturnAddressListPage from './pages/ReturnAddressListPage';
import ReturnAddressEditPage from './pages/ReturnAddressEditPage';
import SettingsPage from './pages/SettingsPage';
import ServiceCenterPage from './pages/ServiceCenterPage';
import MessageSystemPage from './pages/MessageSystemPage';
import FollowPage from './pages/FollowPage';

const TAB_PATHS: string[] = MAIN_TABS.map((t) => t.path);
// 首页顶层面(同城/消息/我的 Tab + 集市/圈子/回收 分段):按返回先回首页,首页再退桌面。
// 不含 '/'(首页自身)和 '/publish'(＋压出来的整屏页,返回应 pop)。
const HOME_SURFACE = new Set<string>([
  ...MAIN_TABS.filter((t) => t.id !== 'publish' && t.path !== '/').map((t) => t.path),
  ...HOME_SEGMENTS.filter((s) => s.path !== '/').map((s) => s.path),
]);
const TAB_ICONS = {
  home: IcTabHome, nearby: IcTabNearby, publish: IcTabPublish, message: IcTabMessage, mine: IcTabMine,
} as const;

function XianyuNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const { go } = useAppNavigate();
  // 用 ref 持有最新 location,避免 onBack 闭包捕获旧值(否则连续返回会用过期 pathname 判断)
  const locRef = useRef(location);
  locRef.current = location;

  useAppNavigationHandler(manifest.id, {
    onBack: (): boolean => {
      const loc = locRef.current;
      const params = new URLSearchParams(loc.search);

      // URL 弹层优先关闭(筛选/留言/分享等),不 pop 整页
      if (params.has('panel')) {
        params.delete('panel');
        const qs = params.toString();
        navigate({ pathname: loc.pathname, search: qs ? `?${qs}` : '' }, { replace: true });
        return true;
      }

      // 搜索结果页返回 → 搜索前置页(非历史上一页)
      if (loc.pathname === '/search/result') {
        navigate('/search');
        return true;
      }

      // 搜索前置页返回 → 首页
      if (loc.pathname === '/search') {
        go('tabbar.home-open');
        return true;
      }

      // 首页且无弹层:交还 OS 退到桌面
      if (loc.pathname === '/' && !loc.search) return false;
      // 顶层面(同城/消息/我的/集市/圈子/回收)且无弹层:先回首页,而不是直接退出
      if (HOME_SURFACE.has(loc.pathname) && !loc.search) {
        go('tabbar.home-open');
        return true;
      }
      // 其余子页:pop 并跳过历史栈中带 panel 的弹层态
      backSkippingOverlays(navigator as object);
      return true;
    },
    onNavigate: (path, navigateToPath) => {
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function TabBar() {
  const location = useLocation();
  const { bindTap } = useXianyuGestures();
  const s = useXianyuStrings();
  const unread = useXianyuStore((st) => st.chats.reduce((n, c) => n + c.unread, 0));

  if (!TAB_PATHS.includes(location.pathname)) return null;

  // 绑定点必须是字符串字面量(DOM Tagging 规则)
  const TAB_BINDINGS: Record<string, object> = {
    home: bindTap('tabbar.home-open'),
    nearby: bindTap('tabbar.nearby-open'),
    publish: bindTap('tabbar.publish-open'),
    message: bindTap('tabbar.message-open'),
    mine: bindTap('tabbar.mine-open'),
  };
  const TAB_LABEL: Record<string, string> = {
    home: s.tabHome,
    nearby: s.tabNearby,
    publish: s.tabSell,
    message: s.tabMessage,
    mine: s.tabMine,
  };

  return (
    <div data-hide-on-keyboard className="shrink-0 bg-app-surface border-t border-(--app-border) flex items-end">
      {MAIN_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS];
        const active = location.pathname === tab.path;
        const badge = tab.id === 'message' ? unread : 0;

        if (tab.id === 'publish') {
          // 凸起的发布相机键
          return (
            <button
              key={tab.id}
              {...TAB_BINDINGS[tab.id]}
              aria-label={s.tabSell}
              className="flex-1 flex flex-col items-center bg-transparent border-none cursor-pointer relative pb-1"
            >
              <span className="-mt-4 w-12 h-12 rounded-full bg-app-primary flex items-center justify-center shadow-md">
                <Icon size={28} className="text-app-text" strokeWidth={2.6} />
              </span>
              <span className="text-[10px] text-app-text-muted mt-0.5">{s.tabSell}</span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            {...TAB_BINDINGS[tab.id]}
            className="flex-1 flex flex-col items-center pt-1.5 pb-1 gap-0.5 bg-transparent border-none cursor-pointer relative"
          >
            <span className="relative">
              <Icon size={22} className={active ? 'text-app-text' : 'text-app-text-muted'} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 rounded-full bg-(--app-c-price-red) text-white text-[10px] leading-4 text-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span className={`text-[10px] ${active ? 'text-app-text font-semibold' : 'text-app-text-muted'}`}>
              {TAB_LABEL[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AppShell() {
  const { isDark } = useDarkMode();
  const localDark = useXianyuStore((st) => st.settings.darkMode);
  const effectiveDark = isDark || localDark;
  const theme = effectiveDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;

  return (
    <div
      className="flex flex-col h-full bg-app-bg"
      data-status-bar-foreground={theme.statusBarForeground ?? 'dark'}
    >
      {/* OS 状态栏安全区 */}
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/nearby" element={<NearbyPage />} />
          <Route path="/market" element={<MarketPage />} />
          <Route path="/circle" element={<CircleSquarePage />} />
          <Route path="/circle/discover" element={<CircleDiscoverPage />} />
          <Route path="/circle/:circleId" element={<CircleDetailPage />} />
          <Route path="/recycle" element={<RecyclePage />} />
          <Route path="/recycle/estimate" element={<RecycleEstimatePage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/item/:itemId" element={<ItemDetailPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/order/confirm" element={<OrderConfirmPage />} />
          <Route path="/order/pay" element={<PayPage />} />
          <Route path="/order/success/:orderId" element={<PaySuccessPage />} />
          <Route path="/publish" element={<PublishEntryPage />} />
          <Route path="/publish/edit" element={<PublishEditPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/me/favorites" element={<FavoritesPage />} />
          <Route path="/me/footprints" element={<FootprintsPage />} />
          <Route path="/orders/bought" element={<OrdersBoughtPage />} />
          <Route path="/orders/sold" element={<OrdersSoldPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/me/published" element={<PublishedPage />} />
          <Route path="/review/write/:orderId" element={<ReviewWritePage />} />
          <Route path="/review/:orderId" element={<ReviewDetailPage />} />
          <Route path="/me/coupons" element={<CouponsPage />} />
          <Route path="/me/address" element={<AddressEntryPage />} />
          <Route path="/me/address/list" element={<AddressListPage />} />
          <Route path="/me/address/edit" element={<AddressEditPage />} />
          <Route path="/me/address/return" element={<ReturnAddressListPage />} />
          <Route path="/me/address/return/edit" element={<ReturnAddressEditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/service" element={<ServiceCenterPage />} />
          <Route path="/messages" element={<MessageListPage />} />
          <Route path="/messages/system" element={<MessageSystemPage />} />
          <Route path="/me/follow" element={<FollowPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <TabBar />
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function XianyuApp() {
  const { isDark } = useDarkMode();
  const localDark = useXianyuStore((st) => st.settings.darkMode);
  const effectiveDark = isDark || localDark;
  const themeColors = effectiveDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = effectiveDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(applySkinToThemeColors(themeColors)),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };

  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <XianyuNavigationHandler />
        <AppShell />
      </MemoryRouter>
    </div>
  );
}

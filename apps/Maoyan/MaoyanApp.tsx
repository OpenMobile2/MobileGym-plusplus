import React from 'react';
import { MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useAppStrings } from '@/os/useAppStrings';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '@/os/utils/themeToCssVars';
import { colors, colorsDark } from './res/colors';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import { useMaoyanGestures } from './hooks/useMaoyanGestures';
import { useMaoyanStore } from './state';
import { strings } from './res/strings';
import { stringsEn } from './res/strings.en';
import {
  IcTabHome, IcTabMovie, IcTabFun, IcTabMine,
} from './res/icons';
import { MY } from './components/ui';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SmsCodePage from './pages/SmsCodePage';
import CityPickerPage from './pages/CityPickerPage';
import MovieChannelPage from './pages/MovieChannelPage';
import HotAllPage from './pages/HotAllPage';
import MovieDetailPage from './pages/MovieDetailPage';
import ReviewsPage from './pages/ReviewsPage';
import WriteReviewPage from './pages/WriteReviewPage';
import ShowtimesPage from './pages/ShowtimesPage';
import CinemaDetailPage from './pages/CinemaDetailPage';
import SeatSelectPage from './pages/SeatSelectPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import CashierPage from './pages/CashierPage';
import PaySuccessPage from './pages/PaySuccessPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import ShowChannelPage from './pages/ShowChannelPage';
import ShowCategoryPage from './pages/ShowCategoryPage';
import ShowDetailPage from './pages/ShowDetailPage';
import ShowTicketPage from './pages/ShowTicketPage';
import ShowOrderConfirmPage from './pages/ShowOrderConfirmPage';
import FunPage from './pages/FunPage';
import MinePage from './pages/MinePage';
import FilmLogPage from './pages/FilmLogPage';
import ProfilesPage from './pages/ProfilesPage';
import CardsPage from './pages/CardsPage';
import TicketFolderPage from './pages/TicketFolderPage';
import CouponsPage from './pages/CouponsPage';
import CouponsExpiredPage from './pages/CouponsExpiredPage';
import SettingsPage from './pages/SettingsPage';

const TAB_ROUTES = ['/', '/movie', '/show', '/fun', '/me'];

function AppNavigationHandler() {
  const location = useLocation();
  const { navigator } = React.useContext(UNSAFE_NavigationContext);
  const { back } = useAppNavigate();

  useAppNavigationHandler(manifest.id, {
    onBack: (): boolean => {
      // 以 MemoryRouter 栈位判断能否回退:栈底一律 return false 交还 OS(回桌面),
      // 否则 navigate(-1) 是空操作却对 OS 报告"已处理",表现为点返回没反应。
      const mem = navigator as { index?: number };
      const atRoot = typeof mem.index === 'number'
        ? mem.index <= 0
        : location.pathname === '/' && !location.search;
      if (atRoot) return false;
      back();
      return true;
    },
  });

  return null;
}

function TabBar() {
  const location = useLocation();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const active = (p: string) => location.pathname === p;
  const item = (path: string) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 bg-transparent border-none cursor-pointer ${
      active(path) ? 'text-(--app-c-primary)' : 'text-(--app-c-text-3)'
    }`;
  return (
    <div className="flex items-stretch h-14 bg-app-surface border-t border-app-border">
      <button {...bindTap('tabbar.home-open')} className={item('/')}>
        <IcTabHome size={22} />
        <span className="text-[10px]">{s.tabHome}</span>
      </button>
      <button {...bindTap('tabbar.movie-open')} className={item('/movie')}>
        <IcTabMovie size={22} />
        <span className="text-[10px]">{s.tabMovie}</span>
      </button>
      {/* 中间特型:演唱会·演出(anchor_mine.jpg 底栏) */}
      <button {...bindTap('tabbar.show-open')} className={item('/show')}>
        <span className={`text-[15px] font-bold leading-tight ${active('/show') ? '' : 'text-app-text'}`}
          style={active('/show') ? { color: MY.primary } : undefined}>
          {s.tabShowBig}
        </span>
        <span className="text-[10px]">{s.tabShow}</span>
      </button>
      <button {...bindTap('tabbar.fun-open')} className={item('/fun')}>
        <IcTabFun size={22} />
        <span className="text-[10px]">{s.tabFun}</span>
      </button>
      <button {...bindTap('tabbar.mine-open')} className={item('/me')}>
        <IcTabMine size={22} />
        <span className="text-[10px]">{s.tabMine}</span>
      </button>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const isMainTab = TAB_ROUTES.includes(location.pathname);
  // 深色跟随 OS:Tier-1 语义色走 --app-*,Tier-2 应用色走 --app-c-*
  const { isDark } = useDarkMode();
  const cssVars = React.useMemo(() => {
    const themeColors = isDark
      ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
      : manifest.theme.colors;
    const appColors = isDark ? { ...colors, ...colorsDark } : colors;
    return { ...themeToCssVars(themeColors), ...dimensToCssVars(appColors, { prefix: '--app-c-' }) };
  }, [isDark]);
  // 深色沉浸页自行声明 data-status-bar-foreground
  return (
    <div className="flex flex-col h-full bg-app-bg" style={cssVars as React.CSSProperties}>
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/sms" element={<SmsCodePage />} />
          <Route path="/city" element={<CityPickerPage />} />
          <Route path="/movie" element={<MovieChannelPage />} />
          <Route path="/hot-all" element={<HotAllPage />} />
          <Route path="/detail/:id" element={<MovieDetailPage />} />
          <Route path="/reviews/:id" element={<ReviewsPage />} />
          <Route path="/write-review/:id" element={<WriteReviewPage />} />
          <Route path="/showtimes/:id" element={<ShowtimesPage />} />
          <Route path="/cinema/:id" element={<CinemaDetailPage />} />
          <Route path="/seat/:sessionId" element={<SeatSelectPage />} />
          <Route path="/order/confirm" element={<OrderConfirmPage />} />
          <Route path="/pay" element={<CashierPage />} />
          <Route path="/pay/success" element={<PaySuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order/:id" element={<OrderDetailPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/show" element={<ShowChannelPage />} />
          <Route path="/show/category" element={<ShowCategoryPage />} />
          <Route path="/show/order/confirm" element={<ShowOrderConfirmPage />} />
          <Route path="/show/:id" element={<ShowDetailPage />} />
          <Route path="/show/:id/tickets" element={<ShowTicketPage />} />
          <Route path="/fun" element={<FunPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/me/filmlog" element={<FilmLogPage />} />
          <Route path="/me/profiles" element={<ProfilesPage />} />
          <Route path="/me/cards" element={<CardsPage />} />
          <Route path="/me/ticket-folder" element={<TicketFolderPage />} />
          <Route path="/me/coupons" element={<CouponsPage />} />
          <Route path="/me/coupons/expired" element={<CouponsExpiredPage />} />
          <Route path="/me/settings" element={<SettingsPage />} />
        </Routes>
      </div>
      {isMainTab && (
        <div data-hide-on-keyboard className="shrink-0">
          <TabBar />
        </div>
      )}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function MaoyanApp() {
  // 触发 store 初始化
  useMaoyanStore((st) => st.city);
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

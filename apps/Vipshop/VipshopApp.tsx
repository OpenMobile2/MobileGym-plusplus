import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { MAIN_TABS } from './constants';
import { useVipshopStore } from './state';
import { useVipshopGestures } from './hooks/useVipshopGestures';
import {
  IcTabHome, IcTabFavorites, IcTabDiscover, IcTabCart, IcTabMine,
} from './res/icons';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SmsCodePage from './pages/SmsCodePage';
import OauthPage from './pages/OauthPage';
import PwdLoginPage from './pages/PwdLoginPage';
import DiscoverPage from './pages/DiscoverPage';
import BrandEventPage from './pages/BrandEventPage';
import BrandListPage from './pages/BrandListPage';
import FlashPage from './pages/FlashPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchSuggestPage from './pages/SearchSuggestPage';
import SearchResultPage from './pages/SearchResultPage';
import SearchFilterPage from './pages/SearchFilterPage';
import DetailPage from './pages/DetailPage';
import CartPage from './pages/CartPage';
import CartAddonPage from './pages/CartAddonPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import PaySuccessPage from './pages/PaySuccessPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import RefundPage from './pages/RefundPage';
import RefundExchangePage from './pages/RefundExchangePage';
import RefundReturnPage from './pages/RefundReturnPage';
import RefundProgressPage from './pages/RefundProgressPage';
import CategoryPage from './pages/CategoryPage';
import LogisticsPage from './pages/LogisticsPage';
import TracePage from './pages/TracePage';
import ReviewWritePage from './pages/ReviewWritePage';
import MinePage from './pages/MinePage';
import FavoritesPage from './pages/FavoritesPage';
import FootprintsPage from './pages/FootprintsPage';
import CouponsPage from './pages/CouponsPage';
import VipCoinPage from './pages/VipCoinPage';
import VipFloatPage from './pages/VipFloatPage';
import AddressListPage from './pages/AddressListPage';
import AddressEditPage from './pages/AddressEditPage';
import SettingsPage from './pages/SettingsPage';
import MessageListPage from './pages/MessageListPage';
import ChatPage from './pages/ChatPage';
import PriceDropPage from './pages/PriceDropPage';

const TAB_PATHS: string[] = MAIN_TABS.map((t) => t.path);
const TAB_ICONS = {
  home: IcTabHome, favorites: IcTabFavorites, discover: IcTabDiscover, cart: IcTabCart, mine: IcTabMine,
} as const;

function VipshopNavigationHandler() {
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);
  const navRef = useRef(navigator as { index?: number; go?: (d: number) => void });
  navRef.current = navigator as { index?: number; go?: (d: number) => void };

  useEffect(() => {
    const mem = navigator as { index?: number };
    if (typeof mem.index === 'number') historyIndexRef.current = mem.index;
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const mem = navRef.current;
    const idx = typeof mem.index === 'number' ? mem.index : historyIndexRef.current;
    if (idx > 0) {
      mem.go?.(-1);
      return true;
    }
    return false; // 栈底:交还 OS 退到桌面
  }, []);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function TabBar() {
  const location = useLocation();
  const { bindTap } = useVipshopGestures();
  const cartCount = useVipshopStore((s) => s.cart.length);

  if (!TAB_PATHS.includes(location.pathname)) return null;

  // 绑定点必须是字符串字面量(AGENTS DOM Tagging 规则)
  const TAB_BINDINGS: Record<string, object> = {
    home: bindTap('tabbar.home-open'),
    favorites: bindTap('tabbar.favorites-open'),
    discover: bindTap('tabbar.discover-open'),
    cart: bindTap('tabbar.cart-open'),
    mine: bindTap('tabbar.mine-open'),
  };

  return (
    <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex">
      {MAIN_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS];
        const active = location.pathname === tab.path;
        const badge = tab.id === 'cart' ? cartCount : 0;
        const center = tab.id === 'discover';
        return (
          <button
            key={tab.id}
            {...TAB_BINDINGS[tab.id]}
            className="flex-1 flex flex-col items-center pt-1.5 pb-1 gap-0.5 bg-transparent border-none cursor-pointer relative"
          >
            <span className="relative">
              {center ? (
                <span
                  className="w-8 h-8 -mt-1 rounded-full flex items-center justify-center"
                  style={{ background: active ? '#E4007F' : '#FDECF5' }}
                >
                  <Icon size={20} className={active ? 'text-white' : 'text-[#E4007F]'} />
                </span>
              ) : (
                <Icon size={22} className={active ? 'text-[#E4007F]' : 'text-[#999999]'} />
              )}
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 rounded-full bg-[#FF2D2D] text-white text-[10px] leading-4 text-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span className={`text-[10px] ${active ? 'text-[#E4007F] font-semibold' : 'text-[#999999]'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AppShell() {
  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* OS 状态栏安全区 */}
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/sms" element={<SmsCodePage />} />
          <Route path="/login/oauth" element={<OauthPage />} />
          <Route path="/login/pwd" element={<PwdLoginPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/brand/:id" element={<BrandEventPage />} />
          <Route path="/brands" element={<BrandListPage />} />
          <Route path="/flash" element={<FlashPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/suggest" element={<SearchSuggestPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/search/filter" element={<SearchFilterPage />} />
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/detail/:id" element={<DetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/cart/addon" element={<CartAddonPage />} />
          <Route path="/order/confirm" element={<OrderConfirmPage />} />
          <Route path="/order/success" element={<PaySuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/orders/:id/refund" element={<RefundPage />} />
          <Route path="/orders/:id/refund/exchange" element={<RefundExchangePage />} />
          <Route path="/orders/:id/refund/return" element={<RefundReturnPage />} />
          <Route path="/orders/:id/refund/progress" element={<RefundProgressPage />} />
          <Route path="/orders/:id/logistics" element={<LogisticsPage />} />
          <Route path="/orders/:id/trace" element={<TracePage />} />
          <Route path="/orders/:id/review" element={<ReviewWritePage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/footprints" element={<FootprintsPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/vipcoin" element={<VipCoinPage />} />
          <Route path="/vipfloat" element={<VipFloatPage />} />
          <Route path="/address" element={<AddressListPage />} />
          <Route path="/address/edit" element={<AddressEditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/messages" element={<MessageListPage />} />
          <Route path="/messages/chat" element={<ChatPage />} />
          <Route path="/messages/pricedrop" element={<PriceDropPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <TabBar />
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function VipshopApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <VipshopNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

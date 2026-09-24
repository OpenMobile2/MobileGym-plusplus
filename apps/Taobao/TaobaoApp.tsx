import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { MAIN_TABS } from './constants';
import { useTaobaoStore } from './state';
import { useTaobaoGestures } from './hooks/useTaobaoGestures';
import {
  IcTabHome, IcTabVideo, IcTabMessage, IcTabCart, IcTabMine,
} from './res/icons';

import HomePage from './pages/HomePage';
import HeyboxPage from './pages/HeyboxPage';
import VideoStubPage from './pages/VideoStubPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import ItemDetailPage from './pages/ItemDetailPage';
import ShopPage from './pages/ShopPage';
import CartPage from './pages/CartPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import PaySuccessPage from './pages/PaySuccessPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import LogisticsPage from './pages/LogisticsPage';
import RefundFormPage from './pages/RefundFormPage';
import ReviewCenterPage from './pages/ReviewCenterPage';
import ReviewWritePage from './pages/ReviewWritePage';
import MinePage from './pages/MinePage';
import CouponsPage from './pages/CouponsPage';
import FavoritesPage from './pages/FavoritesPage';
import FootprintsPage from './pages/FootprintsPage';
import FollowedShopsPage from './pages/FollowedShopsPage';
import AddressListPage from './pages/AddressListPage';
import AddressEditPage from './pages/AddressEditPage';
import MessageListPage from './pages/MessageListPage';
import ChatPage from './pages/ChatPage';
import ActivityFeedPage from './pages/ActivityFeedPage';
import MessageSearchPage from './pages/MessageSearchPage';
import ContactsPage from './pages/ContactsPage';
import MessageSettingsPage from './pages/MessageSettingsPage';
import SettingsPage from './pages/SettingsPage';

const TAB_PATHS: string[] = MAIN_TABS.map((t) => t.path);
const TAB_ICONS = {
  home: IcTabHome, video: IcTabVideo, message: IcTabMessage, cart: IcTabCart, mine: IcTabMine,
} as const;

function TaobaoNavigationHandler() {
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
  const { bindTap } = useTaobaoGestures();
  const unread = useTaobaoStore((s) => s.chats.reduce((n, c) => n + c.unread, 0));
  const cartCount = useTaobaoStore((s) => s.cart.length);

  if (!TAB_PATHS.includes(location.pathname)) return null;

  // 绑定点必须是字符串字面量(AGENTS DOM Tagging 规则),不能用 tab.transitionId 变量
  const TAB_BINDINGS: Record<string, object> = {
    home: bindTap('tabbar.home-open'),
    video: bindTap('tabbar.video-open'),
    message: bindTap('tabbar.message-open'),
    cart: bindTap('tabbar.cart-open'),
    mine: bindTap('tabbar.mine-open'),
  };

  return (
    <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex">
      {MAIN_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS];
        const active = location.pathname === tab.path;
        const badge = tab.id === 'message' ? unread : tab.id === 'cart' ? cartCount : 0;
        return (
          <button
            key={tab.id}
            {...TAB_BINDINGS[tab.id]}
            className="flex-1 flex flex-col items-center pt-1.5 pb-1 gap-0.5 bg-transparent border-none cursor-pointer relative"
          >
            <span className="relative">
              <Icon size={22} className={active ? 'text-[#FF5000]' : 'text-[#999999]'} />
              {badge > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-0.5 rounded-full bg-[#FF0036] text-white text-[10px] leading-4 text-center">
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </span>
            <span className={`text-[10px] ${active ? 'text-[#FF5000] font-semibold' : 'text-[#999999]'}`}>
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
    <div className="flex flex-col h-full bg-[#F5F6F7]" data-status-bar-foreground="dark">
      {/* OS 状态栏安全区 */}
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/heybox" element={<HeyboxPage />} />
          <Route path="/video" element={<VideoStubPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/item/:itemId" element={<ItemDetailPage />} />
          <Route path="/shop/:shopId" element={<ShopPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/order/confirm" element={<OrderConfirmPage />} />
          <Route path="/order/success/:orderId" element={<PaySuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/orders/:orderId/logistics" element={<LogisticsPage />} />
          <Route path="/orders/:orderId/refund" element={<RefundFormPage />} />
          <Route path="/review-center" element={<ReviewCenterPage />} />
          <Route path="/review/write/:orderId" element={<ReviewWritePage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/me/coupons" element={<CouponsPage />} />
          <Route path="/me/favorites" element={<FavoritesPage />} />
          <Route path="/me/footprints" element={<FootprintsPage />} />
          <Route path="/me/shops" element={<FollowedShopsPage />} />
          <Route path="/me/address" element={<AddressListPage />} />
          <Route path="/me/address/edit" element={<AddressEditPage />} />
          <Route path="/messages" element={<MessageListPage />} />
          <Route path="/messages/chat/:chatId" element={<ChatPage />} />
          <Route path="/messages/activity" element={<ActivityFeedPage />} />
          <Route path="/messages/search" element={<MessageSearchPage />} />
          <Route path="/messages/contacts" element={<ContactsPage />} />
          <Route path="/messages/settings" element={<MessageSettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <TabBar />
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function TaobaoApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <TaobaoNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

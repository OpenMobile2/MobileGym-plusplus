import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  MemoryRouter, Route, Routes, UNSAFE_NavigationContext, useLocation,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import { MAIN_TAB_ROUTES } from './constants';
import { useTbsgStore } from './state';
import { TabBar } from './components/TabBar';
import { ToastHost } from './components/common';
import { StatusBarBgContext, DEFAULT_STATUS_BG } from './statusbar';

import HomePage from './pages/HomePage';
import HotdealsPage from './pages/HotdealsPage';
import DailyRedpacketPage from './pages/DailyRedpacketPage';
import MessageCenterPage from './pages/MessageCenterPage';
import CartPage from './pages/CartPage';
import MinePage from './pages/MinePage';
import ChannelFoodPage from './pages/ChannelFoodPage';
import ChannelMarketPage from './pages/ChannelMarketPage';
import ChannelFruitPage from './pages/ChannelFruitPage';
import ChannelMedicinePage from './pages/ChannelMedicinePage';
import MedicineCategoryPage from './pages/MedicineCategoryPage';
import MedicineSearchPage from './pages/MedicineSearchPage';
import DrugDetailPage from './pages/DrugDetailPage';
import SearchEntryPage from './pages/SearchEntryPage';
import SearchResultPage from './pages/SearchResultPage';
import ShopPage from './pages/ShopPage';
import RetailShopPage from './pages/RetailShopPage';
import GroupOrderPage from './pages/GroupOrderPage';
import ShopChatPage from './pages/ShopChatPage';
import RiderChatPage from './pages/RiderChatPage';
import CheckoutPage from './pages/CheckoutPage';
import CheckoutCouponPage from './pages/CheckoutCouponPage';
import RemarkPage from './pages/RemarkPage';
import PaySuccessPage from './pages/PaySuccessPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CancelSurveyPage from './pages/CancelSurveyPage';
import RefundFormPage from './pages/RefundFormPage';
import RefundProgressPage from './pages/RefundProgressPage';
import ReviewWritePage from './pages/ReviewWritePage';
import ReviewCenterPage from './pages/ReviewCenterPage';
import ServiceAgentPage from './pages/ServiceAgentPage';
import CouponWalletPage from './pages/CouponWalletPage';
import AddressSelectPage from './pages/AddressSelectPage';
import AddressListPage from './pages/AddressListPage';
import AddressEditPage from './pages/AddressEditPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import GeneralSettingsPage from './pages/GeneralSettingsPage';
import SecurityPage from './pages/SecurityPage';
import PaymentSettingsPage from './pages/PaymentSettingsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';

function TbsgNavigationHandler() {
  const location = useLocation();
  const { back, go } = useAppNavigate();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);
  const setRoute = useTbsgStore((s) => s.setRoute);

  // 把 app 内当前路由(pathname+search)镜像进 store,供 __SIM__ 状态可观测(judge/导航类任务)
  useEffect(() => {
    setRoute(location.pathname + location.search);
  }, [location.pathname, location.search, setRoute]);

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') {
      historyIndexRef.current = memoryNavigator.index;
    }
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const memoryNavigator = navigator as { index?: number };
    const currentIndex =
      typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (currentIndex > 0) {
      back();
      return true;
    }
    if (location.pathname !== '/') {
      go('tabbar.home-open', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

/** 订单状态自动推进(qa:Q2/Q11):挂在 Shell 层,10s 一拍 + 每次路由变化即时拍 */
function OrderTicker() {
  const location = useLocation();
  const tickOrders = useTbsgStore((s) => s.tickOrders);
  useEffect(() => {
    tickOrders();
    const t = setInterval(tickOrders, 10_000);
    return () => clearInterval(t);
  }, [tickOrders, location.pathname]);
  return null;
}

function AppShell() {
  const location = useLocation();
  const isMainTab = MAIN_TAB_ROUTES.includes(location.pathname);
  const [statusBg, setStatusBg] = useState<string | null>(null);

  return (
    <StatusBarBgContext.Provider value={setStatusBg}>
    <div className="flex flex-col h-full bg-[#F3F6F8] relative" data-status-bar-foreground="dark">
      {/* 状态栏安全区(颜色随当前页面顶部,消除接缝) */}
      <div className="h-10 shrink-0" style={{ backgroundColor: statusBg ?? DEFAULT_STATUS_BG }} />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hotdeals" element={<HotdealsPage />} />
          <Route path="/daily-redpacket" element={<DailyRedpacketPage />} />
          <Route path="/messages" element={<MessageCenterPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/mine" element={<MinePage />} />
          <Route path="/channel/food" element={<ChannelFoodPage />} />
          <Route path="/channel/market" element={<ChannelMarketPage />} />
          <Route path="/channel/fruit" element={<ChannelFruitPage />} />
          <Route path="/channel/medicine" element={<ChannelMedicinePage />} />
          <Route path="/channel/medicine/cat" element={<MedicineCategoryPage />} />
          <Route path="/channel/medicine/search" element={<MedicineSearchPage />} />
          <Route path="/drug/:drugId" element={<DrugDetailPage />} />
          <Route path="/search" element={<SearchEntryPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/shop/:shopId" element={<ShopPage />} />
          <Route path="/retail/:shopId" element={<RetailShopPage />} />
          <Route path="/shop/:shopId/group" element={<GroupOrderPage />} />
          <Route path="/chat/shop/:shopId" element={<ShopChatPage />} />
          <Route path="/chat/rider/:orderId" element={<RiderChatPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/coupons" element={<CheckoutCouponPage />} />
          <Route path="/checkout/remark" element={<RemarkPage />} />
          <Route path="/order/:orderId/success" element={<PaySuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order/:orderId" element={<OrderDetailPage />} />
          <Route path="/order/:orderId/cancel-survey" element={<CancelSurveyPage />} />
          <Route path="/order/:orderId/refund/apply" element={<RefundFormPage />} />
          <Route path="/order/:orderId/refund" element={<RefundProgressPage />} />
          <Route path="/order/:orderId/review" element={<ReviewWritePage />} />
          <Route path="/review-center" element={<ReviewCenterPage />} />
          <Route path="/service" element={<ServiceAgentPage />} />
          <Route path="/coupons" element={<CouponWalletPage />} />
          <Route path="/address/select" element={<AddressSelectPage />} />
          <Route path="/settings/address" element={<AddressListPage />} />
          <Route path="/address/edit" element={<AddressEditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/general" element={<GeneralSettingsPage />} />
          <Route path="/settings/security" element={<SecurityPage />} />
          <Route path="/settings/payment" element={<PaymentSettingsPage />} />
          <Route path="/settings/notifications" element={<NotificationSettingsPage />} />
        </Routes>
        <ToastHost />
      </div>
      {isMainTab && (
        <div data-hide-on-keyboard className="shrink-0">
          <TabBar />
        </div>
      )}
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0 bg-white" />
    </div>
    </StatusBarBgContext.Provider>
  );
}

export default function TbsgApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <TbsgNavigationHandler />
      <OrderTicker />
      <AppShell />
    </MemoryRouter>
  );
}

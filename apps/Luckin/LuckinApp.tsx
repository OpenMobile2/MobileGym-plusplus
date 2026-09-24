import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { MemoryRouter, Route, Routes, UNSAFE_NavigationContext, useLocation } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { useLuckinStore } from './state';
import { TabBar, ToastHost } from './components/ui';
import { HomeMainPage, MenuMainPage, ProductCustomizePage, SearchMainPage } from './pages/MainPages';
import { OrderConfirmPage, OrderDetailPage, OrdersListPage, OrderSuccessPage } from './pages/OrderPages';
import { AddressEditPage, AddressListPage, InvoiceMainPage, MessagesListPage, MineMainPage, MineProfilePage, SettingsMainPage, StorePickerPage, WalletMainPage } from './pages/ProfilePages';
import { AllianceMainPage, CalendarMainPage, CardCoffeePage, CardGiftPage, CouponsCenterPage, CouponsMinePage, MemberBeansPage, MemberCardPage, MemberLevelPage } from './pages/MemberPages';
import { InstantCartPage, InstantDetailPage, InstantHomePage, InstantPurchasesPage, InstantServicePage } from './pages/InstantPages';

function LuckinNavigationHandler() {
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const navRef = useRef(navigator as { index?: number; go?: (delta: number) => void });
  navRef.current = navigator as { index?: number; go?: (delta: number) => void };

  const handleBack = useCallback((): boolean => {
    const index = navRef.current.index ?? 0;
    if (index > 0) {
      navRef.current.go?.(-1);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {}, [location]);
  useAppNavigationHandler(manifest.id, {
    onBack: handleBack,
    onNavigate: (path, navigateToPath) => navigateToPath(path.startsWith('/') ? path : `/${path}`),
  });
  return null;
}

function AppShell() {
  return (
    <div data-app-root="luckin" data-status-bar-foreground="dark" className="h-full w-full flex flex-col overflow-hidden bg-[#F4F5F7] font-sans">
      <div className="h-10 shrink-0 bg-[#F4F5F7]" />
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <Routes>
          <Route path="/" element={<MenuMainPage />} />
          <Route path="/home" element={<HomeMainPage />} />
          <Route path="/search" element={<SearchMainPage />} />
          <Route path="/product/:itemId" element={<ProductCustomizePage />} />
          <Route path="/order/confirm" element={<OrderConfirmPage />} />
          <Route path="/order/:orderId/success" element={<OrderSuccessPage />} />
          <Route path="/order/:orderId" element={<OrderDetailPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/store/picker" element={<StorePickerPage />} />
          <Route path="/address" element={<AddressListPage />} />
          <Route path="/address/edit" element={<AddressEditPage />} />
          <Route path="/member" element={<MemberCardPage />} />
          <Route path="/member/level" element={<MemberLevelPage />} />
          <Route path="/member/beans" element={<MemberBeansPage />} />
          <Route path="/coupons" element={<CouponsMinePage />} />
          <Route path="/coupons/center" element={<CouponsCenterPage />} />
          <Route path="/card/coffee" element={<CardCoffeePage />} />
          <Route path="/card/gift" element={<CardGiftPage />} />
          <Route path="/alliance" element={<AllianceMainPage />} />
          <Route path="/calendar" element={<CalendarMainPage />} />
          <Route path="/instant" element={<InstantHomePage />} />
          <Route path="/instant/cart" element={<InstantCartPage />} />
          <Route path="/instant/service" element={<InstantServicePage />} />
          <Route path="/instant/purchases" element={<InstantPurchasesPage />} />
          <Route path="/instant/:itemId" element={<InstantDetailPage />} />
          <Route path="/mine" element={<MineMainPage />} />
          <Route path="/mine/profile" element={<MineProfilePage />} />
          <Route path="/messages" element={<MessagesListPage />} />
          <Route path="/wallet" element={<WalletMainPage />} />
          <Route path="/invoice" element={<InvoiceMainPage />} />
          <Route path="/settings" element={<SettingsMainPage />} />
          <Route path="*" element={<MenuMainPage />} />
        </Routes>
        <ToastHost />
      </div>
      <TabBar />
      <div className="h-4 shrink-0 bg-white" />
    </div>
  );
}

export default function LuckinApp() {
  useLuckinStore;
  return <MemoryRouter initialEntries={['/']}><LuckinNavigationHandler /><AppShell /></MemoryRouter>;
}

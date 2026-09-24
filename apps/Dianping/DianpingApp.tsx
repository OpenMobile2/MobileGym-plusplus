import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '../../os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '../../os/utils/themeToCssVars';
import { colors, colorsDark } from './res/colors';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import { TAB_PATHS } from './constants';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import FoodChannelPage from './pages/FoodChannelPage';
import ShopDetailPage from './pages/ShopDetailPage';
import DishesPage from './pages/DishesPage';
import MinePage from './pages/MinePage';
import FavListPage from './pages/FavListPage';
import HistoryPage from './pages/HistoryPage';
import CityPickerPage from './pages/CityPickerPage';
import MapPage from './pages/MapPage';
import CheckinPage from './pages/CheckinPage';
import MsgPage from './pages/MsgPage';
import MsgActivityPage from './pages/MsgActivityPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import ReviewsPage from './pages/ReviewsPage';
import WriteReviewPage from './pages/WriteReviewPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import OrderPayPage from './pages/OrderPayPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import RefundApplyPage from './pages/RefundApplyPage';
import VoucherDetailPage from './pages/VoucherDetailPage';
import RankPage from './pages/RankPage';
import NoteDetailPage from './pages/NoteDetailPage';
import MsgInteractPage from './pages/MsgInteractPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import ProfileEditPage from './pages/ProfileEditPage';
import PendingReviewsPage from './pages/PendingReviewsPage';
import DraftsPage from './pages/DraftsPage';
import CouponsPage from './pages/CouponsPage';
import ShopSearchPage from './pages/ShopSearchPage';
import ReviewDetailPage from './pages/ReviewDetailPage';
import FreeTrialPage from './pages/FreeTrialPage';
import CheckinsPage from './pages/CheckinsPage';

function AppNavigationHandler() {
  const location = useLocation();
  const { back } = useAppNavigate();

  useAppNavigationHandler(manifest.id, {
    onBack: (): boolean => {
      if (location.pathname === '/' && !location.search) return false;
      back();
      return true;
    },
  });

  return null;
}

function AppShell() {
  const location = useLocation();
  const isTab = (TAB_PATHS as readonly string[]).includes(location.pathname);

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-(--app-c-page-bg)">
      <div className="h-10 shrink-0" />
      <div className="relative min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/checkin" element={<CheckinPage />} />
          <Route path="/msg" element={<MsgPage />} />
          <Route path="/msg/activity" element={<MsgActivityPage />} />
          <Route path="/msg/list/:kind" element={<MsgInteractPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/city" element={<CityPickerPage />} />
          <Route path="/food" element={<FoodChannelPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/shop/:shopId" element={<ShopDetailPage />} />
          <Route path="/shop/:shopId/dishes" element={<DishesPage />} />
          <Route path="/shop/:shopId/reviews" element={<ReviewsPage />} />
          <Route path="/shop/:shopId/search" element={<ShopSearchPage />} />
          <Route path="/review/:shopId/:reviewId" element={<ReviewDetailPage />} />
          <Route path="/review/write/:shopId" element={<WriteReviewPage />} />
          <Route path="/order/confirm" element={<OrderConfirmPage />} />
          <Route path="/order/pay" element={<OrderPayPage />} />
          <Route path="/order/success" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/order/:orderId" element={<OrderDetailPage />} />
          <Route path="/refund/:orderId" element={<RefundApplyPage />} />
          <Route path="/voucher/:shopId/:dealId" element={<VoucherDetailPage />} />
          <Route path="/fav" element={<FavListPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/note/:noteId" element={<NoteDetailPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/edit" element={<ProfileEditPage />} />
          <Route path="/reviews/pending" element={<PendingReviewsPage />} />
          <Route path="/reviews/drafts" element={<DraftsPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/free-trial" element={<FreeTrialPage />} />
          <Route path="/me/checkins" element={<CheckinsPage />} />
        </Routes>
        <Toast />
      </div>
      {isTab ? <TabBar /> : null}
    </div>
  );
}

export default function DianpingApp() {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(themeColors),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };
  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter>
        <AppNavigationHandler />
        <AppShell />
      </MemoryRouter>
    </div>
  );
}

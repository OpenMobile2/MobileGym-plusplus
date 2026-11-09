import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter,
  Routes,
  Route,
  Outlet,
  useLocation,
  useNavigate,
  UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '../../os/hooks/useAppNavigationHandler';
import { AppNavigatorRegistry } from '../../os/AppNavigatorRegistry';
import { useActivityContext } from '../../os/ActivityContext';
import { getTracker } from '../../os/utils/memoryHistoryTracker';
import { useDarkMode } from '../../os/hooks/useDarkMode';
import { dimensToCssVars, themeToCssVars } from '../../os/utils/themeToCssVars';
import { applySkinToThemeColors } from '../../os/SkinService';
import { manifest } from './manifest';
import { colors, colorsDark } from './res/colors';
import { useAppNavigate } from './navigation';
import { TAB_PATHS } from './constants';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import DiscoverPage from './pages/DiscoverPage';
import CartPage from './pages/CartPage';
import ComparePage from './pages/ComparePage';
import MePage from './pages/MePage';
import SearchEntryPage from './pages/SearchEntryPage';
import SearchResultsPage from './pages/SearchResultsPage';
import SimilarPage from './pages/SimilarPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ProductReviewsPage from './pages/ProductReviewsPage';
import ShopPage from './pages/ShopPage';
import ChatServicePage from './pages/ChatServicePage';
import CheckoutPage from './pages/CheckoutPage';
import PaySuccessPage from './pages/PaySuccessPage';
import OrdersListPage from './pages/OrdersListPage';
import OrderDetailPage from './pages/OrderDetailPage';
import OrdersSearchPage from './pages/OrdersSearchPage';
import OrderModifyPage from './pages/OrderModifyPage';
import RefundApplyPage from './pages/RefundApplyPage';
import RefundDetailPage from './pages/RefundDetailPage';
import LogisticsPage from './pages/LogisticsPage';
import AftersalePage from './pages/AftersalePage';
import InvoicePage from './pages/InvoicePage';
import AddressListPage from './pages/AddressListPage';
import AddressEditPage from './pages/AddressEditPage';
import FollowPage from './pages/FollowPage';
import MsgCenterPage from './pages/MsgCenterPage';
import MsgChannelPage from './pages/MsgChannelPage';
import MsgSettingsPage from './pages/MsgSettingsPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import HistoryPage from './pages/HistoryPage';
import CouponsPage from './pages/CouponsPage';
import BaibuPage from './pages/BaibuPage';
import RankHubPage from './pages/RankHubPage';
import RankDetailPage from './pages/RankDetailPage';

function SuningNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { back, go } = useAppNavigate();
  const { activityId } = useActivityContext();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') {
      historyIndexRef.current = memoryNavigator.index;
    }
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    // 搜索入口返回:跳出整段 /search* 栈,落到「点进搜索前」的页面(走查 0729-3)
    if (
      location.pathname === '/search' &&
      !new URLSearchParams(location.search).has('dialog')
    ) {
      const tracker = getTracker(navigator as object);
      let steps = 1;
      if (tracker) {
        steps = 0;
        for (let i = tracker.index; i >= 0; i--) {
          const p = tracker.stack[i]?.pathname ?? '';
          if (p === '/search' || p.startsWith('/search/')) steps += 1;
          else break;
        }
        steps = Math.max(1, steps);
      }
      const memoryNavigator = navigator as { index?: number };
      const currentIndex =
        typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
      if (currentIndex >= steps) {
        back(steps);
        return true;
      }
    }
    const memoryNavigator = navigator as { index?: number };
    const currentIndex =
      typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (currentIndex > 0) {
      back();
      return true;
    }
    if (location.pathname !== '/') {
      go('tabbar.home.open', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, location.search, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'suning');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('suning', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = (TAB_PATHS as readonly string[]).includes(pathname);
  return (
    <div className="relative h-full w-full overflow-hidden bg-[var(--app-bg)]">
      <div className="flex h-full w-full flex-col">
        <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
        {isTab && <TabBar />}
      </div>
      <Toast />
    </div>
  );
}

function SuningRoot() {
  return (
    <MemoryRouter>
      <SuningNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/cart/compare" element={<ComparePage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/search" element={<SearchEntryPage />} />
          <Route path="/search/results" element={<SearchResultsPage />} />
          <Route path="/search/similar" element={<SimilarPage />} />
          <Route path="/product/detail" element={<ProductDetailPage />} />
          <Route path="/product/reviews" element={<ProductReviewsPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/chat" element={<ChatServicePage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pay/success" element={<PaySuccessPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/order/detail" element={<OrderDetailPage />} />
          <Route path="/orders/search" element={<OrdersSearchPage />} />
          <Route path="/order/modify" element={<OrderModifyPage />} />
          <Route path="/refund/apply" element={<RefundApplyPage />} />
          <Route path="/refund/detail" element={<RefundDetailPage />} />
          <Route path="/logistics" element={<LogisticsPage />} />
          <Route path="/aftersale" element={<AftersalePage />} />
          <Route path="/me/invoices" element={<InvoicePage />} />
          <Route path="/me/addresses" element={<AddressListPage />} />
          <Route path="/me/addresses/edit" element={<AddressEditPage />} />
          <Route path="/me/follow" element={<FollowPage />} />
          <Route path="/me/settings" element={<SettingsPage />} />
          <Route path="/me/profile" element={<ProfilePage />} />
          <Route path="/me/history" element={<HistoryPage />} />
          <Route path="/me/coupons" element={<CouponsPage />} />
          <Route path="/messages" element={<MsgCenterPage />} />
          <Route path="/messages/channel" element={<MsgChannelPage />} />
          <Route path="/messages/settings" element={<MsgSettingsPage />} />
          <Route path="/promo/baibu" element={<BaibuPage />} />
          <Route path="/rank" element={<RankHubPage />} />
          <Route path="/rank/detail" element={<RankDetailPage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const SuningApp: React.FC = () => {
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
      <SuningRoot />
    </div>
  );
};

export default SuningApp;

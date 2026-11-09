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
import { useDarkMode } from '../../os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '../../os/utils/themeToCssVars';
import { colors, colorsDark } from './res/colors';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import { TAB_PATHS } from './constants';
import TabBar from './components/TabBar';
import Toast from './components/Toast';
import HomePage from './pages/HomePage';
import HomeSearchPage from './pages/HomeSearchPage';
import ImportSettingsPage from './pages/ImportSettingsPage';
import PackageListPage from './pages/PackageListPage';
import PackageDetailPage from './pages/PackageDetailPage';
import PickupPage from './pages/PickupPage';
import ShipPage from './pages/ShipPage';
import AddressBookPage from './pages/AddressBookPage';
import AddressEditPage from './pages/AddressEditPage';
import LockersPage from './pages/LockersPage';
import PricingPage from './pages/PricingPage';
import PricingRulesPage from './pages/PricingRulesPage';
import ProhibitedPage from './pages/ProhibitedPage';
import ShipOrdersPage from './pages/ShipOrdersPage';
import ShipOrderDetailPage from './pages/ShipOrderDetailPage';
import ShipCancelPage from './pages/ShipCancelPage';
import DiscoverPage from './pages/DiscoverPage';
import CouponsPage from './pages/CouponsPage';
import MessagesPage from './pages/MessagesPage';
import MessagesPackagePage from './pages/MessagesPackagePage';
import MessagesWenwenPage from './pages/MessagesWenwenPage';
import MessagesChannelPage from './pages/MessagesChannelPage';
import MePage from './pages/MePage';
import IdCodePage from './pages/IdCodePage';
import BenefitsPage from './pages/BenefitsPage';
import PhonePage from './pages/PhonePage';
import PhoneAddPage from './pages/PhoneAddPage';
import PhoneVerifyPage from './pages/PhoneVerifyPage';
import ShopOrdersPage from './pages/ShopOrdersPage';
import SettingsPage from './pages/SettingsPage';
import ServicePage from './pages/ServicePage';

function CainiaoNavigationHandler() {
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
    const memoryNavigator = navigator as { index?: number };
    const currentIndex =
      typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (currentIndex > 0) {
      back();
      return true;
    }
    if (location.pathname !== '/') {
      go('tabbar.home', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'cainiao');
    return () => {
      AppNavigatorRegistry.unregisterActivity(activityId);
    };
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('cainiao', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = (TAB_PATHS as readonly string[]).includes(pathname);
  return (
    <div className="relative h-full w-full overflow-hidden bg-(--app-c-page-bg)">
      <div className="flex h-full w-full flex-col">
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
        {isTab && <TabBar />}
      </div>
      <Toast />
    </div>
  );
}

function CainiaoRoot() {
  return (
    <MemoryRouter>
      <CainiaoNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/home/search" element={<HomeSearchPage />} />
          <Route path="/home/import-settings" element={<ImportSettingsPage />} />
          <Route path="/package/list" element={<PackageListPage />} />
          <Route path="/package/detail" element={<PackageDetailPage />} />
          <Route path="/pickup" element={<PickupPage />} />
          <Route path="/ship" element={<ShipPage />} />
          <Route path="/ship/addressbook" element={<AddressBookPage />} />
          <Route path="/ship/address/edit" element={<AddressEditPage />} />
          <Route path="/ship/lockers" element={<LockersPage />} />
          <Route path="/ship/pricing" element={<PricingPage />} />
          <Route path="/ship/pricing/rules" element={<PricingRulesPage />} />
          <Route path="/ship/prohibited" element={<ProhibitedPage />} />
          <Route path="/ship/orders" element={<ShipOrdersPage />} />
          <Route path="/ship/order/detail" element={<ShipOrderDetailPage />} />
          <Route path="/ship/cancel" element={<ShipCancelPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/messages/package" element={<MessagesPackagePage />} />
          <Route path="/messages/wenwen" element={<MessagesWenwenPage />} />
          <Route path="/messages/channel" element={<MessagesChannelPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/me/idcode" element={<IdCodePage />} />
          <Route path="/me/benefits" element={<BenefitsPage />} />
          <Route path="/me/phone" element={<PhonePage />} />
          <Route path="/me/phone/add" element={<PhoneAddPage />} />
          <Route path="/me/phone/verify" element={<PhoneVerifyPage />} />
          <Route path="/me/shoporders" element={<ShopOrdersPage />} />
          <Route path="/me/settings" element={<SettingsPage />} />
          <Route path="/me/service" element={<ServicePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const CainiaoApp: React.FC = () => {
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
      <CainiaoRoot />
    </div>
  );
};

export default CainiaoApp;

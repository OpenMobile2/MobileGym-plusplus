import React, { useCallback, useEffect, useRef } from 'react';
import { Routes, Route, MemoryRouter, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '../../os/hooks/useAppNavigationHandler';
import { useAppNavigate } from './navigation';
import { useMapStore } from './state';
import { useLocale } from './locale';
import { BottomNav } from './components/BottomNav';
import { ExplorePage } from './pages/ExplorePage';
import { MePage } from './pages/MePage';
import { ContributePage } from './pages/ContributePage';
import { SearchPage } from './pages/SearchPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';
import { AppDisplayPage } from './pages/AppDisplayPage';
import { LanguagePage } from './pages/LanguagePage';
import { NavSettingsPage } from './pages/NavSettingsPage';
import { GettingAroundPage } from './pages/GettingAroundPage';
import { LocationPrivacyPage } from './pages/LocationPrivacyPage';
import { OfflineMapsSettingsPage } from './pages/OfflineMapsSettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { TrafficInfoPage } from './pages/TrafficInfoPage';
import { TrafficSubPage } from './pages/TrafficSubPage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { RecommendationSubPage } from './pages/RecommendationSubPage';
import { dimensToCssVars, themeToCssVars } from '../../os/utils/themeToCssVars';
import { applySkinToThemeColors } from '../../os/SkinService';
import { useDarkMode } from '../../os/hooks/useDarkMode';
import { manifest } from './manifest';
import { colors, colorsDark } from './res/colors';
import { colorStates, colorStatesDark } from './res/colors.states';
import { dimens } from './res/dimens';
import { anim } from './res/anim';
import { dispatchMapBackHandlers } from './hooks/useMapBackHandler';
import { ensureGoogleMapsRuntime } from './utils/googleMapsRuntime';

// 标准 App 桥接：系统返回/路由观测/（可选）外部导航
const MapNavigationHandler: React.FC = () => {
  const { back, go } = useAppNavigate();
  const location = useLocation();
  const { navigator } = React.useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const memoryNavigator = navigator as any;
    if (typeof memoryNavigator?.index === 'number') {
      historyIndexRef.current = memoryNavigator.index;
    }
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    if (dispatchMapBackHandlers()) {
      return true;
    }

    // 「我 / 贡献」更接近顶层 panel，而不是普通可逐层回退页面；
    // 系统返回应优先回到探索主页，而不是依赖历史栈。
    if (location.pathname === '/me' || location.pathname === '/contribute') {
      go('tab.explore');
      return true;
    }

    const memoryNavigator = navigator as any;
    const currentIndex =
      typeof memoryNavigator?.index === 'number' ? memoryNavigator.index : historyIndexRef.current;

    if (currentIndex > 0) {
      back();
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useAppNavigationHandler('map', { onBack: handleBackPress });

  return null;
};

/** 父级为 pointer-events-none 时，全屏子页需恢复点击命中 */
const FullScreenRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="pointer-events-auto h-full min-h-0 w-full min-w-0">{children}</div>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const hasActivePoi = useMapStore((s) => s.currentView.poi !== null);
  const placeResultsSheetOpen = useMapStore((s) => s.currentView.placeResultsSheetOpen);
  const routeSheetOpen = useMapStore((s) => s.currentView.routeSheetOpen);
  const routeSetupOpen = useMapStore((s) => s.currentView.routeSetupOpen);
  const showBottomNav =
    ['/', '/me', '/contribute'].includes(location.pathname)
    && !hasActivePoi
    && !placeResultsSheetOpen
    && !routeSheetOpen
    && !routeSetupOpen;

  /** 探索 / 我 / 贡献 共用底层地图，避免 Tab 切换后只剩灰底 */
  const showSharedMapLayer = ['/', '/me', '/contribute'].includes(location.pathname);

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <div className="flex-1 relative overflow-hidden">
        {showSharedMapLayer && (
          <div className="absolute inset-0 z-0">
            <ExplorePage />
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 z-10 flex min-h-0 min-w-0 flex-col">
          <Routes>
          <Route path="/" element={null} />
          <Route path="/me" element={<MePage />} />
          <Route path="/contribute" element={<ContributePage />} />
          <Route
            path="/search"
            element={
              <FullScreenRoute>
                <SearchPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <FullScreenRoute>
                <ProfilePage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <FullScreenRoute>
                <SettingsPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/app-display"
            element={
              <FullScreenRoute>
                <AppDisplayPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/app-display/language"
            element={
              <FullScreenRoute>
                <LanguagePage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/nav"
            element={
              <FullScreenRoute>
                <NavSettingsPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/getting-around"
            element={
              <FullScreenRoute>
                <GettingAroundPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/location-privacy"
            element={
              <FullScreenRoute>
                <LocationPrivacyPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/offline-maps"
            element={
              <FullScreenRoute>
                <OfflineMapsSettingsPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/notifications"
            element={
              <FullScreenRoute>
                <NotificationsPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/notifications/traffic"
            element={
              <FullScreenRoute>
                <TrafficInfoPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/notifications/traffic/:subId"
            element={
              <FullScreenRoute>
                <TrafficSubPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/notifications/recommendations"
            element={
              <FullScreenRoute>
                <RecommendationsPage />
              </FullScreenRoute>
            }
          />
          <Route
            path="/settings/notifications/recommendations/:subId"
            element={
              <FullScreenRoute>
                <RecommendationSubPage />
              </FullScreenRoute>
            }
          />
          </Routes>
        </div>
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
};


export const MapApp: React.FC = () => {
  const locale = useLocale();
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const appColorStates = isDark ? { ...colorStates, ...colorStatesDark } : colorStates;
  const cssVars = {
    ...themeToCssVars(applySkinToThemeColors(themeColors)),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
    ...dimensToCssVars(appColorStates, { prefix: '--app-cs-' }),
    ...dimensToCssVars(dimens),
    ...dimensToCssVars(anim, { prefix: '--app-' }),
  };

  // Fetch location on mount
  useEffect(() => {
    useMapStore.getState().refreshLocation();
  }, []);

  // Load Google Maps API using @googlemaps/js-api-loader
  // 没真 key 时也尝试加载：Service Worker 会用 placeholder key 命中 canonical 缓存。
  // 既无 key 又无缓存又无网络时，loader 会失败，落到 catch 显示 placeholder。
  //
  // 关键：在 initGoogleMaps 之前 await SW 接管完成，避免首次访问时 SDK 请求绕过 SW
  // 直接打 Google → 用 placeholder key 被拒 → 拿回 HTML 错误页 → JS 解析失败。
  useEffect(() => {
    let cancelled = false;
    void ensureGoogleMapsRuntime(locale)
        .then((g) => {
          if (cancelled) return;
          console.log('[Map] Google Maps JS SDK 加载成功');
          useMapStore.getState().setGoogleLoaded(g);
        })
        .catch((e) => {
          console.error('[Map] Google Maps JS SDK 加载失败', e);
          useMapStore.getState().setGoogleLoadError(e instanceof Error ? e : new Error(String(e)));
        });
    return () => { cancelled = true; };
  }, [locale]);

  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
    <MemoryRouter>
        <MapNavigationHandler />
        <AppContent />
    </MemoryRouter>
    </div>
  );
};

export default MapApp;

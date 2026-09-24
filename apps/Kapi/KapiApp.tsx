import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { SheetHost } from './components/SheetHost';
import { ToastHost } from './components/ui';

import HomePage from './pages/HomePage';
import AiChatPage from './pages/AiChatPage';
import StatsPage from './pages/StatsPage';
import CalendarPage from './pages/CalendarPage';
import CategoryDetailPage from './pages/CategoryDetailPage';
import BillDetailPage from './pages/BillDetailPage';
import SharePage from './pages/SharePage';
import BudgetPage from './pages/BudgetPage';
import AssetMainPage from './pages/AssetMainPage';
import AssetAddAccountPage from './pages/AssetAddAccountPage';
import AssetAccountFormPage from './pages/AssetAccountFormPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

function KapiNavigationHandler() {
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const navRef = useRef(navigator as { index?: number; go?: (d: number) => void });
  navRef.current = navigator as { index?: number; go?: (d: number) => void };

  const handleBackPress = useCallback((): boolean => {
    const mem = navRef.current;
    const idx = typeof mem.index === 'number' ? mem.index : 0;
    if (idx > 0) {
      mem.go?.(-1);
      return true;
    }
    return false; // 栈底:交还 OS 退到桌面
  }, []);

  useEffect(() => {}, [location]);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function AppShell() {
  return (
    <div className="relative flex flex-col h-full bg-[#EEF1F9] overflow-hidden" data-status-bar-foreground="dark">
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/ai" element={<AiChatPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="/all" element={<CalendarPage />} />
          <Route path="/category/:id" element={<CategoryDetailPage />} />
          <Route path="/bill/share" element={<SharePage />} />
          <Route path="/bill/:id" element={<BillDetailPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/asset" element={<AssetMainPage />} />
          <Route path="/asset/add" element={<AssetAddAccountPage />} />
          <Route path="/asset/form" element={<AssetAccountFormPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <div className="h-4 shrink-0" />
      <SheetHost />
      <ToastHost />
    </div>
  );
}

export default function KapiApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <KapiNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

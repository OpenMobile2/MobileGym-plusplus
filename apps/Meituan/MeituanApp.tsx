import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { MemoryRouter, Routes, Route, useLocation, useNavigate, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { IcTabHome, IcTabOrders, IcTabMe } from './res/icons';
import { HomePage } from './pages/HomePage';
import { RestaurantPage } from './pages/RestaurantPage';
import { OrderConfirmPage } from './pages/OrderConfirmPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { OrdersPage } from './pages/OrdersPage';
import { MePage } from './pages/MePage';

const TAB_ROUTES = ['/', '/orders', '/me'];

function MeituanNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const mem = navigator as { index?: number };
    if (typeof mem.index === 'number') historyIndexRef.current = mem.index;
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const mem = navigator as { index?: number };
    const idx = typeof mem.index === 'number' ? mem.index : historyIndexRef.current;
    if (idx > 0) { navigate(-1); return true; }
    if (!TAB_ROUTES.includes(location.pathname)) { navigate('/'); return true; }
    return false;
  }, [navigate, location.pathname, navigator]);

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
  const navigate = useNavigate();

  const tabs = [
    { path: '/', icon: IcTabHome, label: '首页' },
    { path: '/orders', icon: IcTabOrders, label: '订单' },
    { path: '/me', icon: IcTabMe, label: '我的' },
  ];

  const isTabActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const showTabBar = TAB_ROUTES.some(r =>
    r === '/' ? location.pathname === '/' : location.pathname === r
  );

  if (!showTabBar) return null;

  return (
    <div className="flex-shrink-0 bg-white border-t border-gray-100 flex">
      {tabs.map(tab => {
        const active = isTabActive(tab.path);
        return (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path, { replace: true })}
            className="flex-1 flex flex-col items-center py-2 gap-0.5"
          >
            <tab.icon size={22} className={active ? 'text-[#FF6000]' : 'text-gray-400'} />
            <span className={`text-[10px] ${active ? 'text-[#FF6000] font-semibold' : 'text-gray-400'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function MeituanAppInner() {
  return (
    <div className="flex flex-col h-full">
      <MeituanNavigationHandler />
      <div className="flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/restaurant/:rid" element={<RestaurantPage />} />
          <Route path="/order-confirm" element={<OrderConfirmPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/me" element={<MePage />} />
        </Routes>
      </div>
      <TabBar />
    </div>
  );
}

export default function MeituanApp() {
  return (
    <MemoryRouter>
      <MeituanAppInner />
    </MemoryRouter>
  );
}

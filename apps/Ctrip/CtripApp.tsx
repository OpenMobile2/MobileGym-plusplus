import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { MAIN_TABS } from './constants';
import { useCtripStore } from './state';
import { useCtripGestures } from './hooks/useCtripGestures';
import { IcTabHome, IcTabMessage, IcTabTrip, IcTabMine } from './res/icons';

import HomeMainPage from './pages/HomeMainPage';
import SearchResultPage from './pages/SearchResultPage';
import DestCityPage from './pages/DestCityPage';
import HotelSearchPage from './pages/HotelSearchPage';
import HotelCityPickerPage from './pages/HotelCityPickerPage';
import HotelListPage from './pages/HotelListPage';
import HotelMapPage from './pages/HotelMapPage';
import HotelDetailPage from './pages/HotelDetailPage';
import HotelFacilitiesPage from './pages/HotelFacilitiesPage';
import HotelReviewPage from './pages/HotelReviewPage';
import HotelRoomPage from './pages/HotelRoomPage';
import HotelBookingPage from './pages/HotelBookingPage';
import HotelCsPage from './pages/HotelCsPage';
import HotelCsInfoPage from './pages/HotelCsInfoPage';
import TrainSearchPage from './pages/TrainSearchPage';
import TrainListPage from './pages/TrainListPage';
import TrainDetailPage from './pages/TrainDetailPage';
import TrainBookingPage from './pages/TrainBookingPage';
import FlightSearchPage from './pages/FlightSearchPage';
import FlightCalendarPage from './pages/FlightCalendarPage';
import FlightListPage from './pages/FlightListPage';
import FlightDetailPage from './pages/FlightDetailPage';
import FlightBookingPage from './pages/FlightBookingPage';
import FlightPriceAlertPage from './pages/FlightPriceAlertPage';
import TicketListPage from './pages/TicketListPage';
import TicketDetailPage from './pages/TicketDetailPage';
import TicketBookingPage from './pages/TicketBookingPage';
import CashierMainPage from './pages/CashierMainPage';
import CashierSuccessPage from './pages/CashierSuccessPage';
import CarHomePage from './pages/CarHomePage';
import CarPickupPage from './pages/CarPickupPage';
import CarLocationPickerPage from './pages/CarLocationPickerPage';
import CarListPage from './pages/CarListPage';
import CarDetailPage from './pages/CarDetailPage';
import CarBookingPage from './pages/CarBookingPage';
import TripMainPage from './pages/TripMainPage';
import TripSyncPage from './pages/TripSyncPage';
import MessageCenterPage from './pages/MessageCenterPage';
import MessageSubListPage from './pages/MessageSubListPage';
import CsMainPage from './pages/CsMainPage';
import OrdersListPage from './pages/OrdersListPage';
import OrdersDetailPage from './pages/OrdersDetailPage';
import OrdersCancelPage from './pages/OrdersCancelPage';
import OrdersRebookPage from './pages/OrdersRebookPage';
import OrdersInvoicePage from './pages/OrdersInvoicePage';
import MineMainPage from './pages/MineMainPage';
import MineWalletPage from './pages/MineWalletPage';
import MineTravelersPage from './pages/MineTravelersPage';
import MemberBenefitsPage from './pages/MemberBenefitsPage';
import SettingsMainPage from './pages/SettingsMainPage';
import SettingsSubPage from './pages/SettingsSubPage';

const TAB_PATHS: string[] = MAIN_TABS.map((t) => t.path);
const TAB_ICONS = {
  home: IcTabHome, message: IcTabMessage, trip: IcTabTrip, mine: IcTabMine,
} as const;

function CtripNavigationHandler() {
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
  const { bindTap } = useCtripGestures();
  if (!TAB_PATHS.includes(location.pathname)) return null;

  // 绑定点用字符串字面量(DOM Tagging 规则),不用变量
  const BINDINGS: Record<string, object> = {
    home: bindTap('tabbar.home-open'),
    message: bindTap('tabbar.message-open'),
    trip: bindTap('tabbar.trip-open'),
    mine: bindTap('tabbar.mine-open'),
  };

  return (
    <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex">
      {MAIN_TABS.map((tab) => {
        const Icon = TAB_ICONS[tab.id as keyof typeof TAB_ICONS];
        const active = location.pathname === tab.path;
        return (
          <button
            key={tab.id}
            {...BINDINGS[tab.id]}
            className="flex-1 flex flex-col items-center pt-1.5 pb-1 gap-0.5 bg-transparent border-none cursor-pointer"
          >
            <Icon size={22} className={active ? 'text-[#0086F6]' : 'text-[#999999]'} />
            <span className={`text-[10px] ${active ? 'text-[#0086F6] font-semibold' : 'text-[#999999]'}`}>
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
    <div
      className="flex flex-col h-full bg-[#F5F6F8]"
      data-app-root="ctrip"
      data-status-bar-foreground="dark"
    >
      {/* OS 状态栏安全区 */}
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomeMainPage />} />
          <Route path="/search" element={<SearchResultPage />} />
          <Route path="/dest/:city" element={<DestCityPage />} />
          <Route path="/hotel/search" element={<HotelSearchPage />} />
          <Route path="/hotel/city" element={<HotelCityPickerPage />} />
          <Route path="/hotel/list" element={<HotelListPage />} />
          <Route path="/hotel/map" element={<HotelMapPage />} />
          <Route path="/hotel/:id" element={<HotelDetailPage />} />
          <Route path="/hotel/:id/facilities" element={<HotelFacilitiesPage />} />
          <Route path="/hotel/:id/review" element={<HotelReviewPage />} />
          <Route path="/hotel/:id/rooms" element={<HotelRoomPage />} />
          <Route path="/hotel/:id/booking" element={<HotelBookingPage />} />
          <Route path="/hotel/:id/cs" element={<HotelCsPage />} />
          <Route path="/hotel/:id/cs/info" element={<HotelCsInfoPage />} />
          <Route path="/train/search" element={<TrainSearchPage />} />
          <Route path="/train/list" element={<TrainListPage />} />
          <Route path="/train/:no" element={<TrainDetailPage />} />
          <Route path="/train/:no/booking" element={<TrainBookingPage />} />
          <Route path="/flight/search" element={<FlightSearchPage />} />
          <Route path="/flight/calendar" element={<FlightCalendarPage />} />
          <Route path="/flight/list" element={<FlightListPage />} />
          <Route path="/flight/:no" element={<FlightDetailPage />} />
          <Route path="/flight/:no/booking" element={<FlightBookingPage />} />
          <Route path="/flight/alert" element={<FlightPriceAlertPage />} />
          <Route path="/ticket/list" element={<TicketListPage />} />
          <Route path="/ticket/:id" element={<TicketDetailPage />} />
          <Route path="/ticket/:id/booking" element={<TicketBookingPage />} />
          <Route path="/cashier" element={<CashierMainPage />} />
          <Route path="/cashier/success" element={<CashierSuccessPage />} />
          <Route path="/car/home" element={<CarHomePage />} />
          <Route path="/car/pickup" element={<CarPickupPage />} />
          <Route path="/car/location" element={<CarLocationPickerPage />} />
          <Route path="/car/list" element={<CarListPage />} />
          <Route path="/car/:id" element={<CarDetailPage />} />
          <Route path="/car/:id/booking" element={<CarBookingPage />} />
          <Route path="/trip" element={<TripMainPage />} />
          <Route path="/trip/sync" element={<TripSyncPage />} />
          <Route path="/message" element={<MessageCenterPage />} />
          <Route path="/message/sub" element={<MessageSubListPage />} />
          <Route path="/cs" element={<CsMainPage />} />
          <Route path="/orders" element={<OrdersListPage />} />
          <Route path="/orders/invoice" element={<OrdersInvoicePage />} />
          <Route path="/orders/:id" element={<OrdersDetailPage />} />
          <Route path="/orders/:id/cancel" element={<OrdersCancelPage />} />
          <Route path="/orders/:id/rebook" element={<OrdersRebookPage />} />
          <Route path="/mine" element={<MineMainPage />} />
          <Route path="/mine/wallet" element={<MineWalletPage />} />
          <Route path="/mine/travelers" element={<MineTravelersPage />} />
          <Route path="/member" element={<MemberBenefitsPage />} />
          <Route path="/settings" element={<SettingsMainPage />} />
          <Route path="/settings/sub" element={<SettingsSubPage />} />
          <Route path="*" element={<HomeMainPage />} />
        </Routes>
      </div>
      <TabBar />
      {/* 底部手势条安全区 */}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function CtripApp() {
  // 触碰 store 触发注册(与 Taobao 一致);实际读取在页面内。
  useCtripStore;
  return (
    <MemoryRouter initialEntries={['/']}>
      <CtripNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

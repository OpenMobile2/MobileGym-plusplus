import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { MAIN_TABS, TAB_PATHS } from './constants';
import { usePinduoduoGestures } from './hooks/usePinduoduoGestures';
import { usePinduoduoStrings } from './hooks/usePinduoduoStrings';
import { usePinduoduoStore } from './state';
import { ToastHost } from './components/ui';
import {
  IcTabHome, IcTabVideo, IcTabSubsidy, IcTabChat, IcTabMine,
} from './res/icons';

import { HomePage } from './pages/HomePage';
import { VideoStubPage } from './pages/VideoStubPage';
import { SubsidyPage } from './pages/SubsidyPage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { SearchResultPage } from './pages/SearchResultPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ReviewListPage } from './pages/ReviewListPage';
import { GroupWaitingPage } from './pages/GroupWaitingPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { PaySuccessPage } from './pages/PaySuccessPage';
import { ShopPage } from './pages/ShopPage';
import { MinePage } from './pages/MinePage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { LogisticsPage } from './pages/LogisticsPage';
import { InvoicePage } from './pages/InvoicePage';
import { WriteReviewPage } from './pages/WriteReviewPage';
import { AftersaleListPage } from './pages/AftersaleListPage';
import { RefundFormPage } from './pages/RefundFormPage';
import { AddressListPage } from './pages/AddressListPage';
import { AddressEditPage } from './pages/AddressEditPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { FootprintPage } from './pages/FootprintPage';
import { CouponsPage } from './pages/CouponsPage';
import { CouponCenterPage } from './pages/CouponCenterPage';
import { WalletPage } from './pages/WalletPage';
import { WalletTxnsPage } from './pages/WalletTxnsPage';
import { SettingsPage } from './pages/SettingsPage';
import { FufeiSettingsPage } from './pages/FufeiSettingsPage';
import { AppearanceSettingsPage } from './pages/AppearanceSettingsPage';
import { ChatListPage } from './pages/ChatListPage';
import { ConversationPage } from './pages/ConversationPage';
import { NotificationPage } from './pages/NotificationPage';
import { CsWorkbenchPage } from './pages/CsWorkbenchPage';

function PddNavigationHandler() {
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
    return false;
  }, []);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => navigateToPath(path.startsWith('/') ? path : `/${path}`),
  });
  return null;
}

const TAB_ICONS: Record<string, typeof IcTabHome> = {
  home: IcTabHome, video: IcTabVideo, subsidy: IcTabSubsidy, chat: IcTabChat, mine: IcTabMine,
};

function TabBar() {
  const location = useLocation();
  const { bindTap } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const chatUnread = usePinduoduoStore((st) => st.chats.reduce((n, c) => n + (c.unread > 0 ? 1 : 0), 0));
  if (!TAB_PATHS.includes(location.pathname)) return null;

  const BIND: Record<string, React.HTMLAttributes<HTMLElement>> = {
    home: bindTap('tabbar.home-open'),
    video: bindTap('tabbar.video-open'),
    subsidy: bindTap('tabbar.subsidy-open'),
    chat: bindTap('tabbar.chat-open'),
    mine: bindTap('tabbar.mine-open'),
  };
  const LABEL: Record<string, string> = {
    home: s.tab_home, video: s.tab_video, subsidy: s.tab_subsidy, chat: s.tab_chat, mine: s.tab_mine,
  };

  return (
    <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex" data-navigation-bar-foreground="dark">
      {MAIN_TABS.map((tab) => {
        const active = location.pathname === tab.path;
        const Icon = TAB_ICONS[tab.id];
        return (
          <button
            key={tab.id}
            {...BIND[tab.id]}
            className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 relative"
          >
            <div className="relative">
              <Icon size={22} className={active ? 'text-[#E22E1F]' : 'text-[#999]'} />
              {tab.id === 'chat' && chatUnread > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#E22E1F] text-white text-[10px] leading-4 text-center">
                  {chatUnread}
                </span>
              )}
            </div>
            <span className={`text-[10px] ${active ? 'text-[#E22E1F] font-medium' : 'text-[#999]'}`}>
              {LABEL[tab.id]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function AppShell() {
  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/video" element={<VideoStubPage />} />
          <Route path="/subsidy" element={<SubsidyPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search-result" element={<SearchResultPage />} />
          <Route path="/item/:itemId/reviews" element={<ReviewListPage />} />
          <Route path="/item/:itemId" element={<ItemDetailPage />} />
          <Route path="/group" element={<GroupWaitingPage />} />
          <Route path="/order-success" element={<OrderSuccessPage />} />
          <Route path="/pay-success" element={<PaySuccessPage />} />
          <Route path="/shop/:shopId" element={<ShopPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/orders/:orderId/logistics" element={<LogisticsPage />} />
          <Route path="/orders/:orderId/invoice" element={<InvoicePage />} />
          <Route path="/orders/:orderId/review" element={<WriteReviewPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/aftersale/apply" element={<RefundFormPage />} />
          <Route path="/aftersale" element={<AftersaleListPage />} />
          <Route path="/address/edit" element={<AddressEditPage />} />
          <Route path="/address" element={<AddressListPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/footprint" element={<FootprintPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/coupon-center" element={<CouponCenterPage />} />
          <Route path="/wallet/transactions" element={<WalletTxnsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/settings/fufei" element={<FufeiSettingsPage />} />
          <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/chat/notification" element={<NotificationPage />} />
          <Route path="/chat/:chatId" element={<ConversationPage />} />
          <Route path="/chat" element={<ChatListPage />} />
          <Route path="/cs" element={<CsWorkbenchPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <TabBar />
      <ToastHost />
    </div>
  );
}

export default function PinduoduoApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <PddNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

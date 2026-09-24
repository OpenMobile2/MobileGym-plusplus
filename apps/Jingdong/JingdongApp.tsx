import { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { MAIN_TABS, TAB_PATHS } from './constants';
import { useJingdongGestures } from './hooks/useJingdongGestures';
import { useJingdongStrings } from './hooks/useJingdongStrings';
import { useJingdongStore } from './state';
import { ToastHost } from './components/ui';
import {
  IcTabHome, IcTabDiscover, IcTabChat, IcTabCart, IcTabMine,
} from './res/icons';

import { HomePage } from './pages/HomePage';
import { SeckillPage } from './pages/SeckillPage';
import { GuobuPage } from './pages/GuobuPage';
import { CategoryPage } from './pages/CategoryPage';
import { SearchPage } from './pages/SearchPage';
import { SearchResultPage } from './pages/SearchResultPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { ReviewListPage } from './pages/ReviewListPage';
import { CartPage } from './pages/CartPage';
import { OrderConfirmPage } from './pages/OrderConfirmPage';
import { PaySuccessPage } from './pages/PaySuccessPage';
import { ShopPage } from './pages/ShopPage';
import { MinePage } from './pages/MinePage';
import { OrdersPage } from './pages/OrdersPage';
import { OrderDetailPage } from './pages/OrderDetailPage';
import { CancelOrderPage } from './pages/CancelOrderPage';
import { LogisticsPage } from './pages/LogisticsPage';
import { WriteReviewPage } from './pages/WriteReviewPage';
import { RefundFormPage } from './pages/RefundFormPage';
import { AddressListPage } from './pages/AddressListPage';
import { AddressEditPage } from './pages/AddressEditPage';
import { FootprintPage } from './pages/FootprintPage';
import { FavoritesPage } from './pages/FavoritesPage';
import { CouponsPage } from './pages/CouponsPage';
import { CouponCenterPage } from './pages/CouponCenterPage';
import { JingdouPage } from './pages/JingdouPage';
import { CampusPage } from './pages/CampusPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppearanceSettingsPage } from './pages/AppearanceSettingsPage';
import { MessagePage } from './pages/MessagePage';
import { ConversationPage } from './pages/ConversationPage';
import { InteractivePage } from './pages/InteractivePage';
import { MiaosongPage } from './pages/MiaosongPage';
import { WaimaiPage } from './pages/WaimaiPage';
import { SuperShopPage } from './pages/SuperShopPage';
import { RestaurantPage } from './pages/RestaurantPage';
import { WaimaiConfirmPage } from './pages/WaimaiConfirmPage';
import { WaimaiSuccessPage } from './pages/WaimaiSuccessPage';
import { WaimaiReviewPage } from './pages/WaimaiReviewPage';
import { TravelPage } from './pages/TravelPage';
import { LifeServicePage } from './pages/LifeServicePage';
import { DiscoverPage } from './pages/DiscoverPage';

function JdNavigationHandler() {
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
    if (idx > 0) { mem.go?.(-1); return true; }
    return false;
  }, []);
  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => navigateToPath(path.startsWith('/') ? path : `/${path}`),
  });
  return null;
}

const TAB_ICONS: Record<string, typeof IcTabHome> = {
  home: IcTabHome, discover: IcTabDiscover, message: IcTabChat, cart: IcTabCart, mine: IcTabMine,
};

function TabBar() {
  const location = useLocation();
  const { bindTap } = useJingdongGestures();
  const s = useJingdongStrings();
  const cartCount = useJingdongStore((st) => st.cart?.reduce((n: number, c: { qty: number }) => n + c.qty, 0) ?? 0);
  const msgUnread = useJingdongStore((st) => st.chats?.reduce((n: number, c: { unread: number }) => n + (c.unread > 0 ? 1 : 0), 0) ?? 0);
  if (!TAB_PATHS.includes(location.pathname)) return null;
  const BIND: Record<string, React.HTMLAttributes<HTMLElement>> = {
    home: bindTap('tabbar.home-open'),
    discover: bindTap('tabbar.discover-open'),
    message: bindTap('tabbar.message-open'),
    cart: bindTap('tabbar.cart-open'),
    mine: bindTap('tabbar.mine-open'),
  };
  const LABEL: Record<string, string> = {
    home: s.tab_home, discover: s.tab_discover, message: s.tab_message, cart: s.tab_cart, mine: s.tab_mine,
  };
  const BADGE: Record<string, number> = { message: msgUnread, cart: cartCount };
  return (
    <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex" data-navigation-bar-foreground="dark">
      {MAIN_TABS.map((tab) => {
        const active = location.pathname === tab.path;
        const Icon = TAB_ICONS[tab.id];
        const badge = BADGE[tab.id] ?? 0;
        return (
          <button key={tab.id} {...BIND[tab.id]} className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5 relative">
            <div className="relative">
              <Icon size={22} className={active ? 'text-[#E1251B]' : 'text-[#999]'} />
              {badge > 0 && (
                <span className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full bg-[#E1251B] text-white text-[10px] leading-4 text-center">{badge}</span>
              )}
            </div>
            <span className={`text-[10px] ${active ? 'text-[#E1251B] font-medium' : 'text-[#999]'}`}>{LABEL[tab.id]}</span>
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
          <Route path="/messages/interactive" element={<InteractivePage />} />
          <Route path="/settings/appearance" element={<AppearanceSettingsPage />} />
          <Route path="/aftersale/apply" element={<RefundFormPage />} />
          <Route path="/waimai/confirm" element={<WaimaiConfirmPage />} />
          <Route path="/waimai/success" element={<WaimaiSuccessPage />} />
          <Route path="/waimai/review" element={<WaimaiReviewPage />} />
          <Route path="/address/edit" element={<AddressEditPage />} />
          <Route path="/search-result" element={<SearchResultPage />} />
          <Route path="/order-confirm" element={<OrderConfirmPage />} />
          <Route path="/coupon-center" element={<CouponCenterPage />} />
          <Route path="/pay-success" element={<PaySuccessPage />} />
          <Route path="/lifeservice" element={<LifeServicePage />} />
          <Route path="/footprint" element={<FootprintPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/messages" element={<MessagePage />} />
          <Route path="/miaosong" element={<MiaosongPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/seckill" element={<SeckillPage />} />
          <Route path="/address" element={<AddressListPage />} />
          <Route path="/coupons" element={<CouponsPage />} />
          <Route path="/jingdou" element={<JingdouPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/campus" element={<CampusPage />} />
          <Route path="/waimai" element={<WaimaiPage />} />
          <Route path="/travel" element={<TravelPage />} />
          <Route path="/guobu" element={<GuobuPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/orders/:orderId/logistics" element={<LogisticsPage />} />
          <Route path="/orders/:orderId/review" element={<WriteReviewPage />} />
          <Route path="/orders/:orderId/cancel" element={<CancelOrderPage />} />
          <Route path="/messages/chat/:chatId" element={<ConversationPage />} />
          <Route path="/miaosong/shop/:shopId" element={<SuperShopPage />} />
          <Route path="/item/:itemId/reviews" element={<ReviewListPage />} />
          <Route path="/waimai/shop/:shopId" element={<RestaurantPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/item/:itemId" element={<ItemDetailPage />} />
          <Route path="/shop/:shopId" element={<ShopPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <TabBar />
      <ToastHost />
    </div>
  );
}

export default function JingdongApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <JdNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

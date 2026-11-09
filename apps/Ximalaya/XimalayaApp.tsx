import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { MemoryRouter, Routes, Route, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { MAIN_TABS, TAB_PATHS } from './constants';
import { useXimalayaGestures } from './hooks/useXimalayaGestures';
import { useXimalayaStrings } from './hooks/useXimalayaStrings';
import { useXimalayaStore } from './state';
import { ToastHost, Img } from './components/ui';
import { IcTabHome, IcTabQuick, IcTabMember, IcTabMine, IcPlay, IcPause } from './res/icons';

import { HomePage } from './pages/HomePage';
import { HomeCategoryPage } from './pages/HomeCategoryPage';
import { QuickListenPage } from './pages/QuickListenPage';
import { PlayerPage } from './pages/PlayerPage';
import { SkinPage } from './pages/SkinPage';
import { CommentPage } from './pages/CommentPage';
import { SoundDetailPage } from './pages/SoundDetailPage';
import { AlbumPage } from './pages/AlbumPage';
import { SimilarPage } from './pages/SimilarPage';
import { AnchorPage } from './pages/AnchorPage';
import { CategoryPage } from './pages/CategoryPage';
import { RankPage } from './pages/RankPage';
import { SearchPage } from './pages/SearchPage';
import { SearchResultPage } from './pages/SearchResultPage';
import { MinePage } from './pages/MinePage';
import { SubscribePage } from './pages/SubscribePage';
import { SubscribeManagePage } from './pages/SubscribeManagePage';
import { HistoryPage } from './pages/HistoryPage';
import { HistoryManagePage } from './pages/HistoryManagePage';
import { LocalPage } from './pages/LocalPage';
import { PurchasedPage } from './pages/PurchasedPage';
import { MessagesPage } from './pages/MessagesPage';
import { MessageDetailPage } from './pages/MessageDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProfileEditPage } from './pages/ProfileEditPage';
import { BadgesPage } from './pages/BadgesPage';
import { ListenListPage } from './pages/ListenListPage';
import { MemberCenterPage } from './pages/MemberCenterPage';
import { MemberPurchasePage } from './pages/MemberPurchasePage';
import { PaySuccessPage } from './pages/PaySuccessPage';
import { ChildMemberPage } from './pages/ChildMemberPage';
import { DrivingPage } from './pages/DrivingPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ReportPage } from './pages/ReportPage';
import { CopyrightPage } from './pages/CopyrightPage';
import { StubPage } from './pages/StubPage';
import { RelationsPage } from './pages/RelationsPage';

function XmlyNavigationHandler() {
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
  home: IcTabHome, quicklisten: IcTabQuick, member: IcTabMember, mine: IcTabMine,
};

function CenterPlayButton() {
  const { bindTap } = useXimalayaGestures();
  const albums = useXimalayaStore((s) => s.albums);
  const player = useXimalayaStore((s) => s.player);
  const togglePlay = useXimalayaStore((s) => s.togglePlay);
  const album = albums.find((a) => a.id === player.currentAlbumId);
  return (
    // 绝对水平居中 + 上抬凸出
    <div className="absolute left-1/2 -translate-x-1/2 -top-3 z-10 w-14 h-14">
      {/* 封面缩图整块 → 展开播放页 */}
      <div {...bindTap('tabbar.player-open')} className="w-14 h-14 rounded-full p-[3px] bg-[#FE4543] shadow-lg">
        <div className="w-full h-full rounded-full overflow-hidden bg-white">
          {album && <Img src={album.cover} className="w-full h-full object-cover" />}
        </div>
      </div>
      {/* 中心播放/暂停按钮:覆盖封面正中心,半透明遮罩 */}
      <button
        {...bindTap({ kind: 'action', id: 'tabbar.player.toggle' }, { stopPropagation: true, onTrigger: togglePlay })}
        className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-black/40 flex items-center justify-center text-white"
        aria-label="播放/暂停"
      >
        {player.playing ? <IcPause size={16} fill="currentColor" /> : <IcPlay size={16} fill="currentColor" />}
      </button>
    </div>
  );
}

function TabBar() {
  const location = useLocation();
  const { bindTap } = useXimalayaGestures();
  const s = useXimalayaStrings();
  if (!TAB_PATHS.includes(location.pathname)) return null;

  const BIND: Record<string, React.HTMLAttributes<HTMLElement>> = {
    home: bindTap('tabbar.home-open'),
    quicklisten: bindTap('tabbar.quicklisten-open'),
    member: bindTap('tabbar.member-open'),
    mine: bindTap('tabbar.mine-open'),
  };
  const LABEL: Record<string, string> = {
    home: s.tab_home, quicklisten: s.tab_quick, member: s.tab_member, mine: s.tab_mine,
  };

  // 4 tab + 中央播放按钮(绝对居中,插在 quicklisten 与 member 之间的空位)
  const left = MAIN_TABS.slice(0, 2);
  const right = MAIN_TABS.slice(2);

  const renderTab = (tab: (typeof MAIN_TABS)[number]) => {
    const active = location.pathname === tab.path;
    const Icon = TAB_ICONS[tab.id];
    return (
      <button key={tab.id} {...BIND[tab.id]} className="flex-1 flex flex-col items-center justify-center py-1.5 gap-0.5">
        <Icon size={22} className={active ? 'text-[#FE4543]' : 'text-[#999]'} />
        <span className={`text-[10px] ${active ? 'text-[#FE4543] font-medium' : 'text-[#999]'}`}>{LABEL[tab.id]}</span>
      </button>
    );
  };

  return (
    <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-end relative" data-navigation-bar-foreground="dark">
      {left.map(renderTab)}
      <div className="w-14 shrink-0" />
      {right.map(renderTab)}
      <CenterPlayButton />
    </div>
  );
}

function AppShell() {
  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] relative" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category-sub" element={<HomeCategoryPage />} />
          <Route path="/quicklisten" element={<QuickListenPage />} />
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/skin" element={<SkinPage />} />
          <Route path="/comment" element={<CommentPage />} />
          <Route path="/sound/:id" element={<SoundDetailPage />} />
          <Route path="/album/:id" element={<AlbumPage />} />
          <Route path="/similar/:id" element={<SimilarPage />} />
          <Route path="/anchor/:id" element={<AnchorPage />} />
          <Route path="/category" element={<CategoryPage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search-result" element={<SearchResultPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/subscribe" element={<SubscribePage />} />
          <Route path="/subscribe-manage" element={<SubscribeManagePage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/history-manage" element={<HistoryManagePage />} />
          <Route path="/local" element={<LocalPage />} />
          <Route path="/purchased" element={<PurchasedPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/message/:id" element={<MessageDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile-edit" element={<ProfileEditPage />} />
          <Route path="/badges" element={<BadgesPage />} />
          <Route path="/listenlist/:id" element={<ListenListPage />} />
          <Route path="/member" element={<MemberCenterPage />} />
          <Route path="/member-purchase" element={<MemberPurchasePage />} />
          <Route path="/pay-success" element={<PaySuccessPage />} />
          <Route path="/child-member" element={<ChildMemberPage />} />
          <Route path="/driving" element={<DrivingPage />} />
          <Route path="/feedback" element={<FeedbackPage />} />
          <Route path="/report" element={<ReportPage />} />
          <Route path="/copyright" element={<CopyrightPage />} />
          <Route path="/relations" element={<RelationsPage />} />
          <Route path="/stub" element={<StubPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </div>
      <TabBar />
      <ToastHost />
    </div>
  );
}

export default function XimalayaApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <XmlyNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

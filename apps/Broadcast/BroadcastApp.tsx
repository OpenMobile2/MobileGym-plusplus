import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { MemoryRouter, Routes, Route, Outlet, useLocation, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { themeToCssVars } from '@/os/utils/themeToCssVars';
import { manifest } from './manifest';
import { TABS, MAIN_TAB_ROUTES } from './constants';
import { useBroadcastGestures } from './hooks/useBroadcastGestures';
import { useBroadcastStore } from './state';
import { Artwork } from './components/common';
import { EpisodeMenuSheet } from './components/EpisodeMenuSheet';
import { IcPlay, IcPause, IcReplay } from './res/icons';
import { useBroadcastStrings } from './hooks/useBroadcastStrings';
import { HomePage } from './pages/HomePage';
import { UpNextPage } from './pages/UpNextPage';
import { ShowPage } from './pages/ShowPage';
import { EpisodePage } from './pages/EpisodePage';
import { NowPlayingPage } from './pages/NowPlayingPage';
import {
  BrowsePage, LibraryPage, SearchPage, TopShowsPage, CategoryPage,
  ShowEpisodesPage, ReviewsPage, WriteReviewPage,
  LibraryShowsPage, LibraryChannelsPage, ChannelPage, LibraryCategoriesPage, SavedPage,
  DownloadedPage, LatestPage, SearchResultsPage, AccountPage, NotificationsPage, ManageCategoriesPage,
} from './pages/stubs';

const NavigationHandler: React.FC = () => {
  const location = useLocation();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);
  const navRef = useRef(navigator as { index?: number; go?: (delta: number) => void });
  navRef.current = navigator as { index?: number; go?: (delta: number) => void };

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') historyIndexRef.current = memoryNavigator.index;
  }, [location, navigator]);

  const handleBack = useCallback((): boolean => {
    const memoryNavigator = navRef.current;
    const index = typeof memoryNavigator.index === 'number'
      ? memoryNavigator.index
      : historyIndexRef.current;
    if (index > 0) {
      memoryNavigator.go?.(-1);
      return true;
    }
    return false;
  }, []);
  useAppNavigationHandler('broadcast', { onBack: handleBack });
  return null;
};

const PlayerProgressClock: React.FC = () => {
  const isPlaying = useBroadcastStore(s => s.player.isPlaying);
  const currentEpisodeId = useBroadcastStore(s => s.player.currentEpisodeId);
  const speed = useBroadcastStore(s => s.player.speed);
  const skip = useBroadcastStore(s => s.skip);

  useEffect(() => {
    if (!isPlaying || !currentEpisodeId) return;
    const timer = window.setInterval(() => skip(speed), 1000);
    return () => window.clearInterval(timer);
  }, [currentEpisodeId, isPlaying, skip, speed]);

  return null;
};

const MiniPlayer: React.FC = () => {
  const s = useBroadcastStrings();
  const { bindTap } = useBroadcastGestures();
  const player = useBroadcastStore(s => s.player);
  const episodes = useBroadcastStore(s => s.episodes);
  const shows = useBroadcastStore(s => s.shows);
  const togglePlay = useBroadcastStore(s => s.togglePlay);
  const skip = useBroadcastStore(s => s.skip);
  const ep = player.currentEpisodeId ? episodes[player.currentEpisodeId] : null;
  if (!ep) return null;
  const show = shows[ep.showId];
  return (
    <div className="mx-2 mb-1 px-2 h-14 rounded-[26px] bg-app-surface shadow-[0_2px_12px_rgba(0,0,0,0.12)] border border-app-border flex items-center gap-2 shrink-0">
      <div {...bindTap('broadcast.nowplaying-open')} className="flex items-center gap-2 flex-1 min-w-0 h-full">
        <Artwork showId={show?.id} color={show?.artworkColor || '#888'} text={show?.artworkText} size={40} radius={8} />
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-medium text-app-text truncate">{ep.title}</div>
          <div className="text-[11px] text-app-text-muted truncate">{show?.author}</div>
        </div>
      </div>
      <button
        data-action="broadcast.player.playpause.toggle"
        onClick={(e) => { e.stopPropagation(); togglePlay(); }}
        className="w-9 h-9 flex items-center justify-center"
        aria-label={player.isPlaying ? s.pause : s.play}
      >
        {player.isPlaying ? <IcPause size={24} className="text-app-text" fill="currentColor" /> : <IcPlay size={24} className="text-app-text" fill="currentColor" />}
      </button>
      <button
        data-action="broadcast.player.skip.forward"
        onClick={(e) => { e.stopPropagation(); skip(30); }}
        className="w-9 h-9 flex items-center justify-center"
        aria-label={s.skip_forward_30}
      >
        <IcReplay size={22} className="text-app-text -scale-x-100" />
      </button>
    </div>
  );
};

const TabBar: React.FC = () => {
  const s = useBroadcastStrings();
  const location = useLocation();
  const { bindTap } = useBroadcastGestures();
  const tabTransition = {
    home: 'broadcast.home-open', browse: 'broadcast.browse-open',
    library: 'broadcast.library-open', search: 'broadcast.search-open',
  } as const;
  return (
    <div data-hide-on-keyboard className="flex items-stretch justify-around bg-app-bg/95 backdrop-blur border-t border-app-border pt-2 pb-1 shrink-0">
      {TABS.map(tab => {
        const active = location.pathname === tab.route;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            {...bindTap(tabTransition[tab.id])}
            className="flex flex-col items-center gap-1 w-16"
          >
            <Icon size={24} className={active ? 'text-app-primary' : 'text-app-text-muted'} strokeWidth={active ? 2.4 : 2} />
            <span className={`text-[11px] ${active ? 'text-app-primary font-semibold' : 'text-app-text-muted'}`}>{s[tab.labelKey]}</span>
          </button>
        );
      })}
    </div>
  );
};

const Layout: React.FC = () => {
  const location = useLocation();
  const shows = useBroadcastStore(s => s.shows);
  const player = useBroadcastStore(s => s.player);
  const episodes = useBroadcastStore(s => s.episodes);
  const path = location.pathname;
  const isMainTab = MAIN_TAB_ROUTES.includes(path as never);
  const isFullscreen = path === '/now-playing' || path.startsWith('/account');
  const showChrome = !isFullscreen;
  const showTab = (route: string) => path === route;
  const showPageId = path.match(/^\/show\/([^/]+)$/)?.[1];
  const playerEpisode = player.currentEpisodeId ? episodes[player.currentEpisodeId] : undefined;
  const statusColor = showPageId
    ? shows[showPageId]?.artworkColor
    : path === '/now-playing' && playerEpisode
      ? shows[playerEpisode.showId]?.artworkColor
      : undefined;

  return (
    <div data-app-root="broadcast" className="flex flex-col h-full bg-app-bg relative overflow-hidden font-sans">
      <div className="h-10 shrink-0" style={statusColor ? { backgroundColor: statusColor } : undefined} />
      <div className="flex-1 relative overflow-hidden">
        <div style={{ display: showTab('/') ? 'block' : 'none', height: '100%' }}><HomePage /></div>
        <div style={{ display: showTab('/browse') ? 'block' : 'none', height: '100%' }}><BrowsePage /></div>
        <div style={{ display: showTab('/library') ? 'block' : 'none', height: '100%' }}><LibraryPage /></div>
        <div style={{ display: showTab('/search') ? 'block' : 'none', height: '100%' }}><SearchPage /></div>
        {!isMainTab && (
          <div className="absolute inset-0 bg-app-bg overflow-hidden"><Outlet /></div>
        )}
      </div>
      {showChrome && <MiniPlayer />}
      {showChrome && <TabBar />}
      <div className="h-4 shrink-0" />
      <EpisodeMenuSheet />
    </div>
  );
};

export const BroadcastApp: React.FC = () => {
  const cssVars = themeToCssVars(manifest.theme.colors);
  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <NavigationHandler />
        <PlayerProgressClock />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="browse" element={<BrowsePage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="up-next" element={<UpNextPage />} />
            <Route path="browse/top-shows" element={<TopShowsPage />} />
            <Route path="category/:id" element={<CategoryPage />} />
            <Route path="show/:id" element={<ShowPage />} />
            <Route path="show/:id/episodes" element={<ShowEpisodesPage />} />
            <Route path="show/:id/reviews" element={<ReviewsPage />} />
            <Route path="show/:id/write-review" element={<WriteReviewPage />} />
            <Route path="episode/:id" element={<EpisodePage />} />
            <Route path="now-playing" element={<NowPlayingPage />} />
            <Route path="library/shows" element={<LibraryShowsPage />} />
            <Route path="library/channels" element={<LibraryChannelsPage />} />
            <Route path="channel/:id" element={<ChannelPage />} />
            <Route path="library/categories" element={<LibraryCategoriesPage />} />
            <Route path="library/saved" element={<SavedPage />} />
            <Route path="library/downloaded" element={<DownloadedPage />} />
            <Route path="library/latest" element={<LatestPage />} />
            <Route path="search/results" element={<SearchResultsPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="account/notifications" element={<NotificationsPage />} />
            <Route path="account/categories" element={<ManageCategoriesPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>
  );
};

export default BroadcastApp;

import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useAppStrings } from '@/os/useAppStrings';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import { useWangyiyunGestures } from './hooks/useWangyiyunGestures';
import { useWangyiyunStore } from './state';
import { strings } from './res/strings';
import { stringsEn } from './res/strings.en';
import { WY } from './res/colors';
import { MiniPlayer, coverBg } from './components/ui';
import { GlobalSheets } from './components/sheets';
import { IcHomeTab, IcSearch, IcMineTab } from './res/icons';
import { TAB_ROUTES } from './constants';

import HomeRecPage from './pages/HomeRecPage';
import HeartModePage from './pages/HeartModePage';
import HomeMusicPage from './pages/HomeMusicPage';
import AudiobookPage from './pages/AudiobookPage';
import LoginPage from './pages/LoginPage';
import DailyRecPage from './pages/DailyRecPage';
import DailyHistoryPage from './pages/DailyHistoryPage';
import PlaylistDetailPage from './pages/PlaylistDetailPage';
import PlaylistSquarePage from './pages/PlaylistSquarePage';
import AddSongsPage from './pages/AddSongsPage';
import RankMainPage from './pages/RankMainPage';
import RankDetailPage from './pages/RankDetailPage';
import AlbumDetailPage from './pages/AlbumDetailPage';
import ArtistDetailPage from './pages/ArtistDetailPage';
import PlayerPage from './pages/PlayerPage';
import CommentPage from './pages/CommentPage';
import SongNotesPage from './pages/SongNotesPage';
import SongWikiPage from './pages/SongWikiPage';
import SheetMusicPage from './pages/SheetMusicPage';
import MvPage from './pages/MvPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import BrowseArtistsPage from './pages/BrowseArtistsPage';
import BrowseStylesPage from './pages/BrowseStylesPage';
import BrowseZonesPage from './pages/BrowseZonesPage';
import RecognizePage from './pages/RecognizePage';
import NotesFeedPage from './pages/NotesFeedPage';
import NoteDetailPage from './pages/NoteDetailPage';
import NoteComposePage from './pages/NoteComposePage';
import MinePage from './pages/MinePage';
import LikedPage from './pages/LikedPage';
import RankStatPage from './pages/RankStatPage';
import PrivacyPage from './pages/PrivacyPage';
import RecentPage from './pages/RecentPage';
import ProfileOtherPage from './pages/ProfileOtherPage';
import MessageCenterPage from './pages/MessageCenterPage';
import ArtistNewsPage from './pages/ArtistNewsPage';
import NoticeListPage from './pages/NoticeListPage';
import ChatPage from './pages/ChatPage';
import SettingsPage from './pages/SettingsPage';
import SettingsSubPage from './pages/SettingsSubPage';
import PodcastHomePage from './pages/PodcastHomePage';
import PodcastMorePage from './pages/PodcastMorePage';
import PodcastShowPage from './pages/PodcastShowPage';
import EpisodePage from './pages/EpisodePage';
import MySubsPage from './pages/MySubsPage';

/** 不显示迷你条的路由前缀(播放页/登录/识曲/发笔记等沉浸态) */
const NO_MINI = ['/player', '/login', '/recognize', '/notes/compose'];

/** 首页级页面(推荐/心动/音乐/听书/播客首页):底部 Tab 固定显示,「首页」保持高亮 */
const HOME_LEVEL_ROUTES = ['/', '/home/heart', '/home/music', '/home/audiobook', '/podcast'];

function AppNavigationHandler() {
  const location = useLocation();
  const { back } = useAppNavigate();
  useAppNavigationHandler(manifest.id, {
    onBack: (): boolean => {
      if (location.pathname === '/' && !location.search) return false;
      back();
      return true;
    },
  });
  return null;
}

function TabBar() {
  const location = useLocation();
  const { bindTap } = useWangyiyunGestures();
  const s = useAppStrings(strings, stringsEn);
  const meSeed = useWangyiyunStore((st) => st.session.seed);
  const homeActive = HOME_LEVEL_ROUTES.includes(location.pathname);
  const active = (p: string) => (p === '/' ? homeActive : location.pathname === p);
  const item = () => 'flex flex-col items-center justify-center gap-0.5 flex-1 bg-transparent border-none cursor-pointer';
  const col = (p: string) => (active(p) ? WY.primary : WY.textSecondary);
  return (
    <div className="flex items-stretch h-14 bg-white border-t" style={{ borderColor: WY.divider }}>
      <button {...bindTap('tabbar.home-open')} className={item()} style={{ color: col('/') }}>
        <IcHomeTab size={22} /><span className="text-[10px]">{s.tabHome}</span>
      </button>
      <button {...bindTap('tabbar.search-open')} className={item()} style={{ color: col('/search') }}>
        <IcSearch size={22} /><span className="text-[10px]">{s.tabSearch}</span>
      </button>
      <button {...bindTap('tabbar.moments-open')} className={item()} style={{ color: col('/notes') }}>
        <span className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: col('/notes'), background: active('/notes') ? undefined : coverBg(meSeed) }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: col('/notes') }} />
        </span>
        <span className="text-[10px]">{s.tabNotes}</span>
      </button>
      <button {...bindTap('tabbar.mine-open')} className={item()} style={{ color: col('/me') }}>
        <IcMineTab size={22} /><span className="text-[10px]">{s.tabMine}</span>
      </button>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const isMainTab = (TAB_ROUTES as readonly string[]).includes(location.pathname)
    || HOME_LEVEL_ROUTES.includes(location.pathname);
  const showMini = !NO_MINI.some((p) => location.pathname.startsWith(p));
  return (
    <div className="flex flex-col h-full" style={{ background: WY.pageBg }}>
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomeRecPage />} />
          <Route path="/home/heart" element={<HeartModePage />} />
          <Route path="/home/music" element={<HomeMusicPage />} />
          <Route path="/home/audiobook" element={<AudiobookPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/daily" element={<DailyRecPage />} />
          <Route path="/daily/history" element={<DailyHistoryPage />} />
          <Route path="/playlist-square" element={<PlaylistSquarePage />} />
          <Route path="/playlist/:id/add" element={<AddSongsPage />} />
          <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
          <Route path="/rank" element={<RankMainPage />} />
          <Route path="/rank/:id" element={<RankDetailPage />} />
          <Route path="/album/:id" element={<AlbumDetailPage />} />
          <Route path="/artist/:id" element={<ArtistDetailPage />} />
          <Route path="/player" element={<PlayerPage />} />
          <Route path="/song/:id/comments" element={<CommentPage />} />
          <Route path="/song/:id/notes" element={<SongNotesPage />} />
          <Route path="/song/:id/wiki" element={<SongWikiPage />} />
          <Route path="/song/:id/sheets" element={<SheetMusicPage />} />
          <Route path="/mv/:id" element={<MvPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/browse/artists" element={<BrowseArtistsPage />} />
          <Route path="/browse/styles" element={<BrowseStylesPage />} />
          <Route path="/browse/zones" element={<BrowseZonesPage />} />
          <Route path="/recognize" element={<RecognizePage />} />
          <Route path="/notes" element={<NotesFeedPage />} />
          <Route path="/notes/compose" element={<NoteComposePage />} />
          <Route path="/notes/:id" element={<NoteDetailPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/me/liked" element={<LikedPage />} />
          <Route path="/me/rankstat" element={<RankStatPage />} />
          <Route path="/me/privacy" element={<PrivacyPage />} />
          <Route path="/recent" element={<RecentPage />} />
          <Route path="/user/:id" element={<ProfileOtherPage />} />
          <Route path="/messages" element={<MessageCenterPage />} />
          <Route path="/messages/artistnews" element={<ArtistNewsPage />} />
          <Route path="/messages/notices/:kind" element={<NoticeListPage />} />
          <Route path="/messages/chat/:id" element={<ChatPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/:section" element={<SettingsSubPage />} />
          <Route path="/podcast" element={<PodcastHomePage />} />
          <Route path="/podcast/more" element={<PodcastMorePage />} />
          <Route path="/podcast/show/:id" element={<PodcastShowPage />} />
          <Route path="/podcast/episode/:id" element={<EpisodePage />} />
          <Route path="/podcast/mine" element={<MySubsPage />} />
        </Routes>
        <GlobalSheets />
      </div>
      {showMini && <div data-hide-on-keyboard className="shrink-0"><MiniPlayer /></div>}
      {isMainTab && <div data-hide-on-keyboard className="shrink-0"><TabBar /></div>}
      <div className="h-3 shrink-0" style={{ background: isMainTab ? '#fff' : 'transparent' }} />
    </div>
  );
}

export default function WangyiyunApp() {
  useWangyiyunStore((st) => st.appId);
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

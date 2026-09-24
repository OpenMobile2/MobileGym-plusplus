import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import { TabBar } from './components/TabBar';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import LoginSmsPage from './pages/LoginSmsPage';
import VideoPage from './pages/VideoPage';
import DiscoverPage from './pages/DiscoverPage';
import HotFullPage from './pages/HotFullPage';
import SearchLandingPage from './pages/SearchLandingPage';
import SearchResultPage from './pages/SearchResultPage';
import StatusDetailPage from './pages/StatusDetailPage';
import ReplyDetailPage from './pages/ReplyDetailPage';
import RepostComposePage from './pages/RepostComposePage';
import ImageViewerPage from './pages/ImageViewerPage';
import ComposePage from './pages/ComposePage';
import TopicPickerPage from './pages/TopicPickerPage';
import MentionPickerPage from './pages/MentionPickerPage';
import SupertopicPickerPage from './pages/SupertopicPickerPage';
import ImagePickerPage from './pages/ImagePickerPage';
import VisibilityPage from './pages/VisibilityPage';
import SupertopicSquarePage from './pages/SupertopicSquarePage';
import SupertopicDetailPage from './pages/SupertopicDetailPage';
import SupertopicComposePage from './pages/SupertopicComposePage';
import MessagePage from './pages/MessagePage';
import NoticePage from './pages/NoticePage';
import ChatPage from './pages/ChatPage';
import MessageSettingsPage from './pages/MessageSettingsPage';
import NewChatPage from './pages/NewChatPage';
import ProfileOtherPage from './pages/ProfileOtherPage';
import ProfileSelfPage from './pages/ProfileSelfPage';
import FollowsPage from './pages/FollowsPage';
import FansPage from './pages/FansPage';
import MinePage from './pages/MinePage';
import MyPostsPage from './pages/MyPostsPage';
import MyLikesPage from './pages/MyLikesPage';
import HistoryPage from './pages/HistoryPage';
import DraftsPage from './pages/DraftsPage';
import SettingsPage from './pages/SettingsPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import BlockSettingsPage from './pages/BlockSettingsPage';
import GeneralSettingsPage from './pages/GeneralSettingsPage';
import AccountSettingsPage from './pages/AccountSettingsPage';
import SecuritySettingsPage from './pages/SecuritySettingsPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import NavBarSettingsPage from './pages/NavBarSettingsPage';
import TeenModePage from './pages/TeenModePage';
import CareModePage from './pages/CareModePage';
import HelpCenterPage from './pages/HelpCenterPage';
import AboutSettingsPage from './pages/AboutSettingsPage';
import StorageSettingsPage from './pages/StorageSettingsPage';
import MemberPage from './pages/MemberPage';

const TAB_ROUTES = ['/', '/video', '/discover', '/message', '/me'];

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

function AppShell() {
  const location = useLocation();
  const isMainTab = TAB_ROUTES.includes(location.pathname);
  const darkTab = location.pathname === '/video';

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]" data-status-bar-foreground={darkTab ? 'light' : 'dark'}>
      <div className={`h-10 shrink-0 ${darkTab ? 'bg-black' : ''}`} />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/sms" element={<LoginSmsPage />} />
          <Route path="/video" element={<VideoPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
          <Route path="/discover/hot" element={<HotFullPage />} />
          <Route path="/search" element={<SearchLandingPage />} />
          <Route path="/search/result" element={<SearchResultPage />} />
          <Route path="/status/:id" element={<StatusDetailPage />} />
          <Route path="/status/:id/replies/:cid" element={<ReplyDetailPage />} />
          <Route path="/status/:id/image/:idx" element={<ImageViewerPage />} />
          <Route path="/repost/:id" element={<RepostComposePage />} />
          <Route path="/compose" element={<ComposePage />} />
          <Route path="/compose/topic" element={<TopicPickerPage />} />
          <Route path="/compose/mention" element={<MentionPickerPage />} />
          <Route path="/compose/supertopic" element={<SupertopicPickerPage />} />
          <Route path="/compose/images" element={<ImagePickerPage />} />
          <Route path="/compose/visibility" element={<VisibilityPage />} />
          <Route path="/supertopic/square" element={<SupertopicSquarePage />} />
          <Route path="/supertopic/:id" element={<SupertopicDetailPage />} />
          <Route path="/supertopic/:id/compose" element={<SupertopicComposePage />} />
          <Route path="/message" element={<MessagePage />} />
          <Route path="/message/notice/:type" element={<NoticePage />} />
          <Route path="/message/chat/:id" element={<ChatPage />} />
          <Route path="/message/settings" element={<MessageSettingsPage />} />
          <Route path="/message/new" element={<NewChatPage />} />
          <Route path="/user/:id" element={<ProfileOtherPage />} />
          <Route path="/me" element={<MinePage />} />
          <Route path="/me/profile" element={<ProfileSelfPage />} />
          <Route path="/me/follows" element={<FollowsPage />} />
          <Route path="/me/fans" element={<FansPage />} />
          <Route path="/me/posts" element={<MyPostsPage />} />
          <Route path="/me/likes" element={<MyLikesPage />} />
          <Route path="/me/history" element={<HistoryPage />} />
          <Route path="/me/drafts" element={<DraftsPage />} />
          <Route path="/me/settings" element={<SettingsPage />} />
          <Route path="/me/settings/privacy" element={<PrivacySettingsPage />} />
          <Route path="/me/settings/block" element={<BlockSettingsPage />} />
          <Route path="/me/settings/general" element={<GeneralSettingsPage />} />
          <Route path="/me/settings/account" element={<AccountSettingsPage />} />
          <Route path="/me/settings/security" element={<SecuritySettingsPage />} />
          <Route path="/me/settings/notification" element={<NotificationSettingsPage />} />
          <Route path="/me/settings/navbar" element={<NavBarSettingsPage />} />
          <Route path="/me/settings/teen" element={<TeenModePage />} />
          <Route path="/me/settings/care" element={<CareModePage />} />
          <Route path="/me/settings/help" element={<HelpCenterPage />} />
          <Route path="/me/settings/about" element={<AboutSettingsPage />} />
          <Route path="/me/settings/storage" element={<StorageSettingsPage />} />
          <Route path="/member" element={<MemberPage />} />
        </Routes>
      </div>
      {isMainTab && (
        <div data-hide-on-keyboard className="shrink-0">
          <TabBar dark={darkTab} />
        </div>
      )}
      <div className={`h-4 shrink-0 ${darkTab ? 'bg-black' : ''}`} data-navigation-bar-foreground={darkTab ? 'light' : 'dark'} />
    </div>
  );
}

export default function WeiboApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

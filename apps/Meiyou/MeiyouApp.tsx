import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useAppStrings } from '@/os/useAppStrings';
import { manifest } from './manifest';
import { useAppNavigate } from './navigation';
import { useMeiyouGestures } from './hooks/useMeiyouGestures';
import { useMeiyouStore } from './state';
import { strings } from './res/strings';
import { stringsEn } from './res/strings.en';
import { TABS } from './constants';
import { MY } from './components/ui';
import { IcHeart, IcCalendar, IcComment, IcUser } from './res/icons';

import HomePage from './pages/HomePage';
import DailyReportPage from './pages/DailyReportPage';
import SearchPage from './pages/SearchPage';
import RecordPage from './pages/RecordPage';
import YearViewPage from './pages/YearViewPage';
import PeriodFormPage from './pages/PeriodFormPage';
import AnalysisPage from './pages/AnalysisPage';
import CirclePage from './pages/CirclePage';
import PostDetailPage from './pages/PostDetailPage';
import PublishPage from './pages/PublishPage';
import ProfilePage from './pages/ProfilePage';
import MessagePage from './pages/MessagePage';
import InteractPage from './pages/InteractPage';
import SystemChatPage from './pages/SystemChatPage';
import AiChatPage from './pages/AiChatPage';
import MePage from './pages/MePage';
import PrepIntroPage from './pages/PrepIntroPage';
import PrepSetupPage from './pages/PrepSetupPage';
import SettingsPage from './pages/SettingsPage';
import CycleSettingsPage from './pages/CycleSettingsPage';
import NotifSettingsPage from './pages/NotifSettingsPage';
import LoginPage from './pages/LoginPage';
import RestorePage from './pages/RestorePage';

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

const TAB_ICONS = { home: IcHeart, record: IcCalendar, message: IcComment, me: IcUser } as const;
const TAB_TRANSITIONS = {
  home: 'meiyou.tab.home', record: 'meiyou.tab.record', message: 'meiyou.tab.message', me: 'meiyou.tab.me',
} as const;

function TabBar() {
  const location = useLocation();
  const { bindTap } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const unread = useMeiyouStore((st) => st.unread);
  const noticeCount = unread.interact + unread.sysChat + unread.aiChat;
  return (
    <div className="flex bg-[#F4F4F4] border-t border-[#E5E5E5] h-14">
      {TABS.map((t) => {
        const active = location.pathname === t.route;
        const Icon = TAB_ICONS[t.id];
        return (
          <button
            key={t.id}
            {...bindTap(TAB_TRANSITIONS[t.id])}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer relative"
          >
            <Icon size={22} style={{ color: active ? MY.primary : '#999999' }} fill={active ? MY.primary : 'none'} />
            <span className="text-[10px]" style={{ color: active ? MY.primary : '#999999' }}>{s[t.label]}</span>
            {t.id === 'message' && noticeCount > 0 && (
              <span className="absolute top-1 right-[26%] min-w-4 h-4 px-1 rounded-full bg-[#FF2D2D] text-white text-[9px] flex items-center justify-center">
                {noticeCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const isMainTab = TABS.some((t) => t.route === location.pathname);

  return (
    <div className="flex flex-col h-full" style={{ background: MY.bg }} data-status-bar-foreground="dark">
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/daily-report" element={<DailyReportPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/record" element={<RecordPage />} />
          <Route path="/record/year" element={<YearViewPage />} />
          <Route path="/record/period-form" element={<PeriodFormPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/circle/:id" element={<CirclePage />} />
          <Route path="/post/:id" element={<PostDetailPage />} />
          <Route path="/publish" element={<PublishPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/message" element={<MessagePage />} />
          <Route path="/message/interact" element={<InteractPage />} />
          <Route path="/message/system" element={<SystemChatPage />} />
          <Route path="/message/ai" element={<AiChatPage />} />
          <Route path="/me" element={<MePage />} />
          <Route path="/mode/prep-intro" element={<PrepIntroPage />} />
          <Route path="/mode/prep-setup" element={<PrepSetupPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/cycle" element={<CycleSettingsPage />} />
          <Route path="/settings/notification" element={<NotifSettingsPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/restore" element={<RestorePage />} />
        </Routes>
      </div>
      {isMainTab && (
        <div data-hide-on-keyboard className="shrink-0">
          <TabBar />
        </div>
      )}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function MeiyouApp() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

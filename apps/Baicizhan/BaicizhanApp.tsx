import React, { useCallback, useContext, useEffect, useRef } from 'react';
import {
  MemoryRouter, Routes, Route, Outlet,
  useLocation, useNavigate, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '../../os/hooks/useAppNavigationHandler';
import { useDarkMode } from '../../os/hooks/useDarkMode';
import { dimensToCssVars, themeToCssVars } from '../../os/utils/themeToCssVars';
import { AppNavigatorRegistry } from '../../os/AppNavigatorRegistry';
import { useActivityContext } from '../../os/ActivityContext';
import { manifest } from './manifest';
import { colors, colorsDark } from './res/colors';
import { useAppNavigate } from './navigation';
import TabBar from './components/TabBar';
import ReadTabBar from './components/ReadTabBar';
import Toast from './components/Toast';

import HomePage from './pages/HomePage';
import CoursePage from './pages/CoursePage';
import TrainPage from './pages/TrainPage';
import MallPage from './pages/MallPage';
import StudyPage from './pages/StudyPage';
import WordDetailPage from './pages/WordDetailPage';
import ReviewPage from './pages/ReviewPage';
import SettlePage from './pages/SettlePage';
import SummaryPage from './pages/SummaryPage';
import TaskPage from './pages/TaskPage';
import RankPage from './pages/RankPage';
import DictPage from './pages/DictPage';
import DictResultPage from './pages/DictResultPage';
import WordbookListPage from './pages/WordbookListPage';
import WordbookDetailPage from './pages/WordbookDetailPage';
import WordbookEditPage from './pages/WordbookEditPage';
import WordbookAddPage from './pages/WordbookAddPage';
import BookPlanPage from './pages/BookPlanPage';
import BookAdjustPage from './pages/BookAdjustPage';
import BookManagePage from './pages/BookManagePage';
import BookStorePage from './pages/BookStorePage';
import BookWordsPage from './pages/BookWordsPage';
import WordBrowsePage from './pages/WordBrowsePage';
import MemberPage from './pages/MemberPage';
import CoinPage from './pages/CoinPage';
import StreakPage from './pages/StreakPage';
import SharePage from './pages/SharePage';
import ReviewStatsPage from './pages/ReviewStatsPage';
import TrainChoicePage from './pages/TrainChoicePage';
import TrainSpellPage from './pages/TrainSpellPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import AccountPage from './pages/AccountPage';
import SoundSettingsPage from './pages/SoundSettingsPage';
import PushSettingsPage from './pages/PushSettingsPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import CacheSettingsPage from './pages/CacheSettingsPage';
import CollectPage from './pages/CollectPage';
import VocabTestPage from './pages/VocabTestPage';
import IdentityPage from './pages/IdentityPage';
import MallSearchPage from './pages/MallSearchPage';
import MallDetailPage from './pages/MallDetailPage';
import MallReviewsPage from './pages/MallReviewsPage';
import CartPage from './pages/CartPage';
import OrderConfirmPage from './pages/OrderConfirmPage';
import AddressAddPage from './pages/AddressAddPage';
import ReadHomePage from './pages/ReadHomePage';
import ReadArticlePage from './pages/ReadArticlePage';
import ReadTocPage from './pages/ReadTocPage';
import ReadPlanPage from './pages/ReadPlanPage';
import ReadMinePage from './pages/ReadMinePage';
import ReadCampPage from './pages/ReadCampPage';
import ReadProfilePage from './pages/ReadProfilePage';
import TrainCnChoicePage from './pages/TrainCnChoicePage';
import TrainFillblankPage from './pages/TrainFillblankPage';
import TrainAssemblePage from './pages/TrainAssemblePage';
import TrainSelfCheckPage from './pages/TrainSelfCheckPage';
import CourseTopicPage from './pages/CourseTopicPage';
import CourseLessonPage from './pages/CourseLessonPage';
import MallCategoryPage from './pages/MallCategoryPage';
import MallMinePage from './pages/MallMinePage';
import WalletPage from './pages/WalletPage';
import MyBooksPage from './pages/MyBooksPage';
import HelpPage from './pages/HelpPage';
import UnavailablePage from './pages/UnavailablePage';

const TAB_PATHS = ['/', '/course', '/train', '/mall'];
const READ_TAB_PATHS = ['/read', '/read/mine', '/read/camp', '/read/profile'];

function BaicizhanNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { back, go } = useAppNavigate();
  const { activityId } = useActivityContext();
  const { navigator } = useContext(UNSAFE_NavigationContext);
  const historyIndexRef = useRef(0);

  useEffect(() => {
    const memoryNavigator = navigator as { index?: number };
    if (typeof memoryNavigator.index === 'number') historyIndexRef.current = memoryNavigator.index;
  }, [location, navigator]);

  const handleBackPress = useCallback((): boolean => {
    const memoryNavigator = navigator as { index?: number };
    const currentIndex = typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (currentIndex > 0) {
      back();
      return true;
    }
    if (location.pathname !== '/') {
      go('tabbar.home', {}, { mode: 'replace' });
      return true;
    }
    return false;
  }, [back, go, location.pathname, navigator]);

  useEffect(() => {
    const navFn = (path: string, opts?: { replace?: boolean }) => {
      navigate(path, { replace: opts?.replace ?? true });
    };
    AppNavigatorRegistry.registerActivity(activityId, { navigate: navFn, back: handleBackPress }, 'baicizhan');
    return () => AppNavigatorRegistry.unregisterActivity(activityId);
  }, [activityId, handleBackPress, navigate]);

  useAppNavigationHandler('baicizhan', { onBack: handleBackPress });
  return null;
}

function Layout() {
  const { pathname } = useLocation();
  const isTab = TAB_PATHS.includes(pathname);
  const isReadTab = READ_TAB_PATHS.includes(pathname);
  return (
    <div className="relative h-full w-full overflow-hidden bg-app-bg text-app-text">
      <div className="flex h-full w-full flex-col">
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
        {isTab && <TabBar />}
        {isReadTab && <ReadTabBar />}
      </div>
      <Toast />
    </div>
  );
}

function BaicizhanRoot() {
  return (
    <MemoryRouter>
      <BaicizhanNavigationHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/course" element={<CoursePage />} />
          <Route path="/course/topic" element={<CourseTopicPage />} />
          <Route path="/course/lesson" element={<CourseLessonPage />} />
          <Route path="/train" element={<TrainPage />} />
          <Route path="/train/choice" element={<TrainChoicePage />} />
          <Route path="/train/spell" element={<TrainSpellPage />} />
          <Route path="/train/cnchoice" element={<TrainCnChoicePage />} />
          <Route path="/train/fillblank" element={<TrainFillblankPage />} />
          <Route path="/train/assemble" element={<TrainAssemblePage />} />
          <Route path="/train/selfcheck" element={<TrainSelfCheckPage />} />
          <Route path="/mall" element={<MallPage />} />
          <Route path="/mall/search" element={<MallSearchPage />} />
          <Route path="/mall/detail" element={<MallDetailPage />} />
          <Route path="/mall/reviews" element={<MallReviewsPage />} />
          <Route path="/mall/cart" element={<CartPage />} />
          <Route path="/mall/order" element={<OrderConfirmPage />} />
          <Route path="/mall/address" element={<AddressAddPage />} />
          <Route path="/mall/category" element={<MallCategoryPage />} />
          <Route path="/mall/mine" element={<MallMinePage />} />
          <Route path="/study" element={<StudyPage />} />
          <Route path="/study/detail" element={<WordDetailPage />} />
          <Route path="/study/settle" element={<SettlePage />} />
          <Route path="/study/summary" element={<SummaryPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/task" element={<TaskPage />} />
          <Route path="/rank" element={<RankPage />} />
          <Route path="/dict" element={<DictPage />} />
          <Route path="/dict/result" element={<DictResultPage />} />
          <Route path="/wordbook" element={<WordbookListPage />} />
          <Route path="/wordbook/detail" element={<WordbookDetailPage />} />
          <Route path="/wordbook/edit" element={<WordbookEditPage />} />
          <Route path="/wordbook/add" element={<WordbookAddPage />} />
          <Route path="/book/plan" element={<BookPlanPage />} />
          <Route path="/book/adjust" element={<BookAdjustPage />} />
          <Route path="/book/manage" element={<BookManagePage />} />
          <Route path="/book/store" element={<BookStorePage />} />
          <Route path="/book/words" element={<BookWordsPage />} />
          <Route path="/word/browse" element={<WordBrowsePage />} />
          <Route path="/member" element={<MemberPage />} />
          <Route path="/coin" element={<CoinPage />} />
          <Route path="/streak" element={<StreakPage />} />
          <Route path="/share" element={<SharePage />} />
          <Route path="/stats/review" element={<ReviewStatsPage />} />
          <Route path="/me" element={<ProfilePage />} />
          <Route path="/me/wallet" element={<WalletPage />} />
          <Route path="/me/books" element={<MyBooksPage />} />
          <Route path="/me/help" element={<HelpPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/account" element={<AccountPage />} />
          <Route path="/settings/sound" element={<SoundSettingsPage />} />
          <Route path="/settings/push" element={<PushSettingsPage />} />
          <Route path="/settings/privacy" element={<PrivacySettingsPage />} />
          <Route path="/settings/cache" element={<CacheSettingsPage />} />
          <Route path="/collect" element={<CollectPage />} />
          <Route path="/vocab-test" element={<VocabTestPage />} />
          <Route path="/identity" element={<IdentityPage />} />
          <Route path="/read" element={<ReadHomePage />} />
          <Route path="/read/article" element={<ReadArticlePage />} />
          <Route path="/read/toc" element={<ReadTocPage />} />
          <Route path="/read/plan" element={<ReadPlanPage />} />
          <Route path="/read/mine" element={<ReadMinePage />} />
          <Route path="/read/camp" element={<ReadCampPage />} />
          <Route path="/read/profile" element={<ReadProfilePage />} />
          <Route path="/unavailable" element={<UnavailablePage />} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

export const BaicizhanApp: React.FC = () => {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(themeColors),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };
  return (
    <div
      className="h-full w-full bg-app-bg text-app-text"
      data-app-dark={isDark ? 'true' : 'false'}
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      data-navigation-bar-foreground={isDark ? 'light' : 'dark'}
      style={cssVars as React.CSSProperties}
    >
      <BaicizhanRoot />
    </div>
  );
};

export default BaicizhanApp;

// apps/GoogleDrive/GoogleDriveApp.tsx — Google 云端硬盘入口
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { MemoryRouter, Routes, Route, Outlet, matchPath, useLocation, useSearchParams, UNSAFE_NavigationContext } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { themeToCssVars } from '@/os/utils/themeToCssVars';
import { manifest } from './manifest';
import { MAIN_TAB_ROUTES, SELECTABLE_ROUTES } from './constants';
import { GD } from './res/colors';
import { useGoogleDriveGestures } from './hooks/useGoogleDriveGestures';
import { useGoogleDriveStore } from './state';
import { TopSearchBar, TabBar, Fabs } from './components/chrome';
import { Overlays } from './components/overlays';
import { HomePage } from './pages/HomePage';
import { StarredPage } from './pages/StarredPage';
import { SharedPage } from './pages/SharedPage';
import { FilesPage } from './pages/FilesPage';
import { FolderPage } from './pages/FolderPage';
import { RecentPage } from './pages/RecentPage';
import { OfflinePage } from './pages/OfflinePage';
import { UploadsPage } from './pages/UploadsPage';
import { SpamPage } from './pages/SpamPage';
import { TrashPage } from './pages/TrashPage';
import { SearchEntryPage } from './pages/SearchEntryPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { PreviewPage } from './pages/PreviewPage';
import { GeminiPage } from './pages/GeminiPage';
import { MoveDestPage } from './pages/MoveDestPage';
import { DetailsPage } from './pages/DetailsPage';
import { AccessPage } from './pages/AccessPage';
import { UploadPickPage } from './pages/UploadPickPage';
import { UploadConfirmPage } from './pages/UploadConfirmPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { HelpPage } from './pages/HelpPage';

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
    const index = typeof memoryNavigator.index === 'number' ? memoryNavigator.index : historyIndexRef.current;
    if (index > 0) {
      memoryNavigator.go?.(-1);
      return true;
    }
    return false;
  }, []);

  useAppNavigationHandler('googledrive', { onBack: handleBack });
  return null;
};

/**
 * 四个主 Tab 常驻挂载（display:none 切换，保住滚动位置与 React 状态），
 * 子页面走 Outlet 覆盖在上层。浮层统一挂在最外层 —— 这样遮罩后面看得见原页面。
 */
const Layout: React.FC = () => {
  const location = useLocation();
  const [sp] = useSearchParams();
  const { bindTap } = useGoogleDriveGestures();
  const path = location.pathname;
  const isMainTab = MAIN_TAB_ROUTES.includes(path);
  const selectMode = sp.get('select') === '1';
  const showTab = (route: string) => path === route;

  /**
   * 退出多选态时清掉选中项：否则残留会带到下一次进多选态，
   * 「已选择 N 项」从一开始就是脏的。
   *
   * 只在「回到可多选的列表页、且 URL 里没有 select=1」时清 ——
   * 不能一看到没有 select 参数就清，因为多选态里点「移动」会跳到 /move/:id
   * （那条 URL 本身不带 select），一清就丢了要移动的那批。
   */
  const clearSelection = useGoogleDriveStore(st => st.clearSelection);
  const onSelectableList = SELECTABLE_ROUTES.some(p => matchPath({ path: p, end: true }, path));
  useEffect(() => {
    if (onSelectableList && !selectMode) clearSelection();
  }, [onSelectableList, selectMode, clearSelection]);

  // 顶栏与 FAB 的 transitionId 逐宿主不同，在这里按当前主 Tab 以字面量绑好再传下去
  const chromeFor = {
    '/': {
      drawer: bindTap('googledrive.home.drawer.open'),
      account: bindTap('googledrive.home.account.open'),
      create: bindTap('googledrive.home.create.open'),
    },
    '/starred': {
      drawer: bindTap('googledrive.starred.drawer.open'),
      account: bindTap('googledrive.starred.account.open'),
      create: bindTap('googledrive.starred.create.open'),
    },
    '/shared': {
      drawer: bindTap('googledrive.shared.drawer.open'),
      account: bindTap('googledrive.shared.account.open'),
      create: undefined,
    },
    '/files': {
      drawer: bindTap('googledrive.files.drawer.open'),
      account: bindTap('googledrive.files.account.open'),
      create: bindTap('googledrive.files.create.open'),
    },
  } as const;
  const chrome = isMainTab ? chromeFor[path as keyof typeof chromeFor] : undefined;
  // 文件夹页不属于主 Tab，但同样有右下双 FAB（截图确认）。
  // 目标就是当前的 /folder/:id，必须把路径参数一起传给 go()，否则拼不出 URL。
  const folderId = matchPath({ path: '/folder/:id', end: true }, path)?.params.id;
  const folderCreate = folderId
    ? bindTap('googledrive.folder.create.open', { params: { id: folderId } })
    : undefined;

  return (
    <div
      data-app-root="googledrive"
      className="flex flex-col h-full relative overflow-hidden font-sans"
      style={{ background: GD.surface }}
      data-status-bar-foreground="dark"
    >
      <div className="h-10 shrink-0" />
      {chrome && !selectMode && (
        <TopSearchBar drawerProps={chrome.drawer} accountProps={chrome.account} />
      )}

      <div className="flex-1 relative overflow-hidden">
        <div style={{ display: showTab('/') ? 'block' : 'none', height: '100%' }}><HomePage /></div>
        <div style={{ display: showTab('/starred') ? 'block' : 'none', height: '100%' }}><StarredPage /></div>
        <div style={{ display: showTab('/shared') ? 'block' : 'none', height: '100%' }}><SharedPage /></div>
        <div style={{ display: showTab('/files') ? 'block' : 'none', height: '100%' }}><FilesPage /></div>
        {!isMainTab && (
          <div className="absolute inset-0 overflow-hidden" style={{ background: GD.surface }}><Outlet /></div>
        )}
        {chrome?.create && !selectMode && <Fabs createProps={chrome.create} />}
        {folderCreate && !selectMode && <Fabs createProps={folderCreate} />}
      </div>

      {isMainTab && !selectMode && <TabBar />}
      <div className="h-4 shrink-0" />
      <Overlays />
    </div>
  );
};

export const GoogleDriveApp: React.FC = () => {
  const cssVars = themeToCssVars(manifest.theme.colors);
  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <NavigationHandler />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="starred" element={<StarredPage />} />
            <Route path="shared" element={<SharedPage />} />
            <Route path="files" element={<FilesPage />} />
            <Route path="folder/:id" element={<FolderPage />} />
            <Route path="recent" element={<RecentPage />} />
            <Route path="offline" element={<OfflinePage />} />
            <Route path="uploads" element={<UploadsPage />} />
            <Route path="spam" element={<SpamPage />} />
            <Route path="trash" element={<TrashPage />} />
            <Route path="search" element={<SearchEntryPage />} />
            <Route path="search/results" element={<SearchResultsPage />} />
            <Route path="preview/:id" element={<PreviewPage />} />
            <Route path="gemini" element={<GeminiPage />} />
            <Route path="move/:id" element={<MoveDestPage />} />
            <Route path="details/:id" element={<DetailsPage />} />
            <Route path="access/:id" element={<AccessPage />} />
            <Route path="upload/pick" element={<UploadPickPage />} />
            <Route path="upload/confirm" element={<UploadConfirmPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/notifications" element={<NotificationsPage />} />
            <Route path="help" element={<HelpPage />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </div>
  );
};

export default GoogleDriveApp;

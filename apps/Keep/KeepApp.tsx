import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  MemoryRouter, Routes, Route, useLocation, useNavigate, UNSAFE_NavigationContext,
} from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { themeToCssVars, dimensToCssVars } from '@/os/utils/themeToCssVars';
import { applySkinToThemeColors } from '@/os/SkinService';
import { manifest } from './manifest';
import { ROUTES } from './pages/routes.generated';
import CourseHomePage from './pages/CourseHomePage';
import { TabBar } from './components/TabBar';
import { SEARCH_ROUTES, TAB_BAR_ROUTES } from './constants';
import { Toast } from './components/ui';
import { exitSearchStack } from './navigation';
import { useKeepStore } from './state';
import { colors, colorsDark } from './res/colors';
import { memoryHistoryPopTo } from '../../os/utils/memoryHistoryPopTo';

/** 注册 OS 返回键 + navigator。栈底交还 OS 退到桌面。 */
function KeepNavigationHandler() {
  const location = useLocation();
  const navigate = useNavigate();
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
    const path = location.pathname;
    const search = location.search;

    // 课程跟练：系统返回同 X → 暂停并打开挽留弹窗
    if (path === '/course/training') {
      useKeepStore.getState().trainingPause();
      navigate('/training/quit');
      return true;
    }

    // 训练完成：顶栏/系统返回同「完成」→ 跳过空会话播放器，回到课程详情
    if (path === '/course/complete') {
      if (idx >= 2) {
        navigate(-2);
        return true;
      }
      navigate('/course/detail', { replace: true });
      return true;
    }

    // 单动作训练：系统返回同停止 → 清会话并回到动作详情（跳过目标页）
    if (path === '/action/training') {
      useKeepStore.getState().actionTrainStop();
      if (idx >= 2) {
        navigate(-2);
        return true;
      }
      navigate('/action/detail', { replace: true });
      return true;
    }

    // 跑步进行中：短距确认弹窗可关；否则拦截系统返回，避免静默退出留下僵尸会话
    if (path === '/sport/active') {
      const params = new URLSearchParams(search);
      if (params.get('dlg') === 'short') {
        params.delete('dlg');
        const q = params.toString();
        navigate(`${path}${q ? `?${q}` : ''}`, { replace: true });
        return true;
      }
      useKeepStore.getState().toast('长按停止按钮结束运动');
      return true;
    }

    // 跑步结算：同「完成」→ 清会话并收敛历史栈，避免返回复活 active。
    if (path === '/sport/summary') {
      useKeepStore.getState().abandonRun();
      memoryHistoryPopTo(navigator, '/sport');
      navigate('/sport', { replace: true });
      return true;
    }

    // 搜索：取消/系统返回一次退出全部搜索层，回到进入前的页面
    if ((SEARCH_ROUTES as readonly string[]).includes(path)) {
      exitSearchStack(navigator, navigate);
      return true;
    }

    // 帖子更多菜单：系统返回关菜单，不退出详情
    if (path === '/discover/post' || path === '/discover') {
      const params = new URLSearchParams(search);
      if (params.get('more')) {
        params.delete('more');
        const q = params.toString();
        navigate(`${path}${q ? `?${q}` : ''}`, { replace: true });
        return true;
      }
    }

    // 确认订单：系统返回同顶栏 → 先出挽留；挽留层再返回则关闭挽留
    if (path === '/mall/order/confirm') {
      // 草稿已失效时没有可挽留的订单，直接正常返回，避免 retain 参数来回切换形成死环。
      if (!useKeepStore.getState().orderDraft) {
        if (idx > 0) {
          mem.go?.(-1);
          return true;
        }
        return false;
      }
      const params = new URLSearchParams(search);
      if (params.get('retain') === '1') {
        params.delete('retain');
        const q = params.toString();
        navigate(`${path}${q ? `?${q}` : ''}`, { replace: true });
        return true;
      }
      params.set('retain', '1');
      navigate(`${path}?${params.toString()}`, { replace: true });
      return true;
    }

    if (idx > 0) {
      mem.go?.(-1);
      return true;
    }
    return false;
  }, [location.pathname, location.search, navigate]);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      if (typeof path !== 'string') return;
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function AppShell() {
  const { pathname } = useLocation();
  const { isDark } = useDarkMode();
  const [focusModality, setFocusModality] = useState<'pointer' | 'keyboard'>('pointer');
  const isTab = TAB_BAR_ROUTES.includes(pathname);
  return (
    <div
      className="flex flex-col h-full bg-app-bg"
      data-app-surface="keep"
      data-focus-modality={focusModality}
      onPointerDownCapture={() => setFocusModality('pointer')}
      onKeyDownCapture={(event) => {
        if (event.key === 'Tab') setFocusModality('keyboard');
      }}
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      data-navigation-bar-foreground={isDark ? 'light' : 'dark'}
    >
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <Routes>
          {ROUTES.map((r) => (
            <Route key={r.path} path={r.path} element={r.element} />
          ))}
          <Route path="*" element={<CourseHomePage />} />
        </Routes>
        <Toast />
      </div>
      {isTab && <TabBar />}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function KeepApp() {
  const { isDark } = useDarkMode();
  const themeColors = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  const appColors = isDark ? { ...colors, ...colorsDark } : colors;
  const cssVars = {
    ...themeToCssVars(applySkinToThemeColors(themeColors)),
    ...dimensToCssVars(appColors, { prefix: '--app-c-' }),
  };
  return (
    <div className="h-full w-full" style={cssVars as React.CSSProperties}>
      <MemoryRouter initialEntries={['/']}>
        <KeepNavigationHandler />
        <AppShell />
      </MemoryRouter>
    </div>
  );
}

import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { useAppStrings } from '@/os/useAppStrings';
import { GeneratedRoutes } from './components/GeneratedRoutes';
import { useQunaerGestures } from './hooks/useQunaerGestures';
import { useAppNavigate } from './navigation';
import { manifest } from './manifest';
import { strings } from './res/strings';
import { stringsEn } from './res/strings.en';
import { IcHome, IcMine, IcSupport, IcTrip, IcWorld } from './res/icons';
import { useQunaerStore } from './state';

const TAB_ROUTES = ['/', '/trip', '/support', '/world', '/me'];

function NavigationHandler() {
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
  const { bindTap } = useQunaerGestures();
  const s = useAppStrings(strings, stringsEn);
  const tabs = [
    { path: '/', label: s.tabHome, Icon: IcHome, binding: bindTap('chrome.tabbar.0.open') },
    { path: '/trip', label: s.tabTrip, Icon: IcTrip, binding: bindTap('chrome.tabbar.1.open') },
    { path: '/support', label: s.tabSupport, Icon: IcSupport, binding: bindTap('chrome.tabbar.2.open') },
    { path: '/world', label: s.tabWorld, Icon: IcWorld, binding: bindTap('chrome.tabbar.3.open') },
    { path: '/me', label: s.tabMine, Icon: IcMine, binding: bindTap('chrome.tabbar.4.open') },
  ];
  return (
    <div className="h-14 flex items-stretch bg-white border-t border-[#E8EDEF]">
      {tabs.map(({ path, label, Icon, binding }) => {
        const active = location.pathname === path;
        return (
          <button
            key={path}
            {...binding}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer ${active ? 'text-[#13BCC0]' : 'text-[#77858B]'}`}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} />
            <span className="text-[10px]">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const showTabs = TAB_ROUTES.includes(location.pathname);
  return (
    <div className="h-full flex flex-col bg-[#F3F6F7]">
      <div className="h-10 shrink-0" />
      <div className="flex-1 overflow-hidden relative">
        <GeneratedRoutes />
      </div>
      {showTabs && (
        <div data-hide-on-keyboard className="shrink-0">
          <TabBar />
        </div>
      )}
      <div className="h-4 shrink-0" />
    </div>
  );
}

export default function QunaerApp() {
  useQunaerStore((state) => state.session.loggedIn);
  return (
    <MemoryRouter initialEntries={['/']}>
      <NavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

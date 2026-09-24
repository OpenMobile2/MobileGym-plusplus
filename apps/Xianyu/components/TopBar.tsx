import React from 'react';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { IcNavBack } from '../res/icons';
import { manifest } from '../manifest';

interface TopBarProps {
  title?: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  transparent?: boolean;
}

/** 通用顶栏。返回用 bindBack()(system.back / pop),不用前进跳转。 */
export function TopBar({ title = '', showBack = true, rightContent, transparent = false }: TopBarProps) {
  const { bindBack } = useXianyuGestures();
  const { isDark } = useDarkMode();
  const theme = isDark
    ? { ...manifest.theme.colors, ...(manifest.theme.colorsDark ?? {}) }
    : manifest.theme.colors;
  return (
    <div
      data-status-bar-foreground={theme.statusBarForeground ?? 'dark'}
      className={`flex items-center h-11 shrink-0 px-2 ${transparent ? '' : 'bg-app-surface border-b border-(--app-border)'}`}
    >
      <div className="w-12 flex items-center">
        {showBack && (
          <button
            {...bindBack()}
            aria-label="返回"
            className="flex items-center justify-center w-9 h-9 bg-transparent border-none cursor-pointer text-app-text"
          >
            <IcNavBack size={26} />
          </button>
        )}
      </div>
      <div className="flex-1 text-center font-semibold text-[16px] text-app-text truncate">{title}</div>
      <div className="w-12 flex justify-end items-center pr-1">{rightContent}</div>
    </div>
  );
}

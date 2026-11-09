import { createContext, useContext, useEffect } from 'react';

/**
 * 状态栏安全区配色:各页面通过 useStatusBarBg 声明自己顶部的颜色,
 * AppShell 据此给状态栏占位条着色,消除"顶部一条与页面顶不同色"的接缝。
 * 不改变任何布局(占位条仍在 shell 层),仅改颜色,回归风险最低。
 */
export const StatusBarBgContext = createContext<(color: string | null) => void>(() => {});

/** 默认状态栏底色(与 app 主背景一致) */
export const DEFAULT_STATUS_BG = '#F3F6F8';

/** 声明当前页面顶部颜色;卸载时复位为默认 */
export function useStatusBarBg(color: string) {
  const set = useContext(StatusBarBgContext);
  useEffect(() => {
    set(color);
    return () => set(null);
  }, [color, set]);
}

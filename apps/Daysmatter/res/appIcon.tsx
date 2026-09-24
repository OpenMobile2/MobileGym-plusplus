import { useSyncExternalStore } from 'react';
import type { IconProps } from '@/os/types/res';

/**
 * 主屏幕图标变体 —— 设置页「更换主屏幕图标」与桌面 launcher 图标共用同一份数据,
 * 在设置页选择后通过一个极简的模块级外部 store 通知 launcher 图标实时切换。
 */
export interface AppIconVariant {
  id: string;
  /** 整块底色 */
  bg: string;
  /** 头部色带 / 强调色 */
  accent: string;
  /** 主数字颜色 */
  num: string;
  /** 头部文字颜色 */
  labelColor: string;
  label: string;
  kind: 'cal' | 'mark' | 'book';
}

export const APP_ICON_VARIANTS: AppIconVariant[] = [
  { id: 'green', bg: '#FFFFFF', accent: '#4CAF50', num: '#2B2B2B', labelColor: '#FFFFFF', label: '倒数日', kind: 'cal' },
  { id: 'red', bg: '#FFFFFF', accent: '#E0524D', num: '#E0524D', labelColor: '#FFFFFF', label: '倒数日', kind: 'cal' },
  { id: 'dark', bg: '#1C2530', accent: '#2A3645', num: '#5B9BD5', labelColor: '#C9D3DF', label: '倒数日', kind: 'cal' },
  { id: 'forest', bg: '#2F4A3C', accent: '#2F4A3C', num: '#FFFFFF', labelColor: '#E8F0EA', label: 'Days Matter', kind: 'mark' },
  { id: 'blue', bg: '#3E7CB1', accent: '#3E7CB1', num: '#FFFFFF', labelColor: '#FFFFFF', label: 'D', kind: 'book' },
  { id: 'gold', bg: '#FFFFFF', accent: '#C79A4B', num: '#C79A4B', labelColor: '#FFFFFF', label: '倒数日', kind: 'cal' },
];

const STORAGE_KEY = 'daysmatter.appIcon';

function readInitial(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && APP_ICON_VARIANTS.some((x) => x.id === v)) return v;
  } catch {
    /* ignore */
  }
  return 'green';
}

let current = readInitial();
const listeners = new Set<() => void>();

export function getSelectedIconId(): string {
  return current;
}

export function setSelectedIconId(id: string): void {
  if (id === current || !APP_ICON_VARIANTS.some((x) => x.id === id)) return;
  current = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function useSelectedIconId(): string {
  return useSyncExternalStore(subscribe, getSelectedIconId, getSelectedIconId);
}

/** 渲染单个图标贴片。fill=true 时铺满父容器(供 launcher 经 AppIcon 居中裁切使用)。 */
export function IconTile({ variant, side, fill }: { variant: AppIconVariant; side: number; fill?: boolean }) {
  const box: React.CSSProperties = fill
    ? { width: '100%', height: '100%' }
    : { width: side, height: side, borderRadius: Math.round(side * 0.24) };

  if (variant.kind === 'book') {
    return (
      <div style={{ ...box, background: variant.bg, position: 'relative', overflow: 'hidden' }} className="flex items-center justify-center">
        <span style={{ fontSize: side * 0.5, fontWeight: 800, color: variant.num, lineHeight: 1 }}>D</span>
        <span style={{ position: 'absolute', top: side * 0.16, right: side * 0.22, fontSize: side * 0.16, color: '#FFE08A' }}>✦</span>
        <span style={{ position: 'absolute', top: side * 0.3, right: side * 0.14, fontSize: side * 0.11, color: '#FFE08A' }}>✦</span>
      </div>
    );
  }

  if (variant.kind === 'mark') {
    return (
      <div style={{ ...box, background: variant.bg }} className="flex flex-col items-center justify-center">
        <span style={{ fontSize: side * 0.15, fontWeight: 700, color: variant.labelColor, lineHeight: 1 }}>{variant.label}</span>
        <span style={{ fontSize: side * 0.42, fontWeight: 800, color: variant.num, lineHeight: 1, marginTop: side * 0.06 }}>23</span>
      </div>
    );
  }

  // cal:顶部色带 + 大数字
  return (
    <div style={{ ...box, background: variant.bg, overflow: 'hidden' }} className="flex flex-col">
      <div
        style={{ height: side * 0.32, background: variant.accent, color: variant.labelColor, fontSize: side * 0.15, fontWeight: 700 }}
        className="flex items-center justify-center"
      >
        {variant.label}
      </div>
      <div className="flex flex-1 items-center justify-center">
        <span style={{ fontSize: side * 0.46, fontWeight: 800, color: variant.num, lineHeight: 1 }}>23</span>
      </div>
    </div>
  );
}

/** 桌面 launcher 图标(manifest.icon)。随设置页选择实时切换。 */
export function LauncherIcon({ size = 48 }: IconProps) {
  const id = useSelectedIconId();
  const variant = APP_ICON_VARIANTS.find((v) => v.id === id) ?? APP_ICON_VARIANTS[0];
  // AppIcon 把组件按容器 0.55 倍居中渲染;反推容器边长以铺满整块图标位。
  const numSize = typeof size === 'number' ? size : 48;
  const tileSide = numSize / 0.55;
  return <IconTile variant={variant} side={tileSide} fill />;
}

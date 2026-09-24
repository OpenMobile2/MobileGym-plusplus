import { useRef } from 'react';
import type React from 'react';

/**
 * 首页模块通用「左右滑」手势(PointerEvent 合同,禁 touch/mouse 双轨)。
 * - respectHScroll(默认 true):起手点落在 [data-hscroll] 内(横向子滚动区/轮播)时忽略,
 *   避免整页切频道手势与楼层横滑/轮播冲突;轮播自身使用时传 false。
 */
export function useHorizontalSwipe(opts: {
  onLeft?: () => void;
  onRight?: () => void;
  minDx?: number;
  respectHScroll?: boolean;
}) {
  const startRef = useRef<{ x: number; y: number; skip: boolean } | null>(null);
  const { onLeft, onRight, minDx = 60, respectHScroll = true } = opts;

  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    const skip =
      respectHScroll && !!(e.target as HTMLElement | null)?.closest?.('[data-hscroll]');
    startRef.current = { x: e.clientX, y: e.clientY, skip };
  };

  const onPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    const s = startRef.current;
    startRef.current = null;
    if (!s || s.skip) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) < minDx || Math.abs(dx) < Math.abs(dy) * 1.8) return;
    if (dx < 0) onLeft?.();
    else onRight?.();
  };

  const onPointerCancel = () => {
    startRef.current = null;
  };

  return { onPointerDown, onPointerUp, onPointerCancel };
}

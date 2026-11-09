import { useRef, useState } from 'react';

/** 刷新旋转数组:前 k 项移到末尾,内容不变、顺序变,视觉上"刷新出新内容"。 */
export function rotate<T>(arr: T[], k: number): T[] {
  if (arr.length < 2) return arr;
  const s = ((k % arr.length) + arr.length) % arr.length;
  return s === 0 ? arr : [...arr.slice(s), ...arr.slice(0, s)];
}

/**
 * 下拉刷新通用 hook(纯手势,不打 data-action)。
 * 用法:把 listRef 绑到滚动容器、把 pullHandlers 展开到同一容器,
 * 渲染 refreshMsg 胶囊,用 seed 旋转列表让"刷新"看到内容变化。
 */
export function usePullRefresh(message = '为你更新了内容') {
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);
  const [seed, setSeed] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const pull = useRef({ startY: 0, fired: false, active: false });
  const timer = useRef<number | null>(null);

  const refresh = () => {
    setSeed((s) => s + 1);
    setRefreshMsg(message);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setRefreshMsg(null), 1600);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pull.current = { startY: e.clientY, fired: false, active: true };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = pull.current;
    if (!p.active || p.fired) return;
    if ((listRef.current?.scrollTop ?? 0) <= 0 && e.clientY - p.startY > 60) {
      p.fired = true;
      refresh();
    }
  };
  const onPointerEnd = () => {
    pull.current.active = false;
  };

  return {
    refreshMsg,
    seed,
    listRef,
    refresh,
    pullHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: onPointerEnd,
      onPointerCancel: onPointerEnd,
    },
  };
}

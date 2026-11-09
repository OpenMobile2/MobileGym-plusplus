// apps/Tencentvideo/components/SwipeVerticalFeed.tsx —— 竖屏流上下滑切换容器
// (短剧播放器/短视频频道)。PointerEvent 单轨实现;遵守硬规则9:
// pointerdown 不立即 setPointerCapture,位移 >10px 确认拖动意图后才捕获,
// 避免吞掉右栏点赞/关注等子控件 click。
import type { BindProps } from './ui';
import React, { useRef, useState } from 'react';

const DRAG_THRESHOLD = 10; // px:确认拖动意图
const SWIPE_TRIGGER = 60; // px:触发翻页

export interface SwipeVerticalFeedProps {
  /** 当前索引(受控;由页面写 store / URL) */
  index: number;
  count: number;
  /** 上滑切下一条(页面内绑定 store action + data-action 打点) */
  onNext: () => void;
  /** 下滑回上一条(可选;不传 = 到顶不动) */
  onPrev?: () => void;
  /** renderItem(i) 渲染第 i 条(仅渲染 index-1/index/index+1 三条) */
  renderItem: (index: number) => React.ReactNode;
  className?: string;
  /** data-action 等打点属性(页面传入,标在容器上) */
  dataProps?: BindProps;
}

export function SwipeVerticalFeed({
  index,
  count,
  onNext,
  onPrev,
  renderItem,
  className,
  dataProps,
}: SwipeVerticalFeedProps) {
  const [dragY, setDragY] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startRef = useRef<{ id: number; y: number; captured: boolean } | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // 不在此处 capture(硬规则9)
    startRef.current = { id: e.pointerId, y: e.clientY, captured: false };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = startRef.current;
    if (!st || st.id !== e.pointerId) return;
    const dy = e.clientY - st.y;
    if (!st.captured) {
      if (Math.abs(dy) < DRAG_THRESHOLD) return;
      st.captured = true;
      rootRef.current?.setPointerCapture(e.pointerId);
    }
    // 端点阻尼:第一条向下 / 最后一条向上 减半
    const atFirst = index <= 0 && dy > 0;
    const atLast = index >= count - 1 && dy < 0;
    setDragY(atFirst || atLast ? dy / 2 : dy);
  };

  const finish = (e: React.PointerEvent<HTMLDivElement>) => {
    const st = startRef.current;
    if (!st || st.id !== e.pointerId) return;
    startRef.current = null;
    if (!st.captured) return;
    const dy = e.clientY - st.y;
    setAnimating(true);
    setDragY(0);
    window.setTimeout(() => setAnimating(false), 220);
    if (dy < -SWIPE_TRIGGER && index < count - 1) onNext();
    else if (dy > SWIPE_TRIGGER && index > 0) onPrev?.();
  };

  const h = rootRef.current?.clientHeight ?? 0;

  return (
    <div
      ref={rootRef}
      className={`relative h-full overflow-hidden touch-none ${className ?? ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
      data-scroll-container="feed"
      data-scroll-direction="vertical"
      {...(dataProps ?? {})}
    >
      {[index - 1, index, index + 1]
        .filter((i) => i >= 0 && i < count)
        .map((i) => (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              transform: `translateY(${(i - index) * h + dragY}px)`,
              transition: animating ? 'transform 0.2s ease-out' : 'none',
            }}
          >
            {renderItem(i)}
          </div>
        ))}
    </div>
  );
}

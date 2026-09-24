import React, { useRef } from 'react';

/**
 * 横向滚动条:pointer 自管 scrollLeft,避免人手势被父级抢走。
 * 仍打 data-scroll-* 供 __SIM_INPUT__ 识别。
 *
 * App 侧约定(不改 os/simInput):包裹本组件的竖向滚动父级须同时加 overflow-x-hidden,
 * 否则计算样式 overflow-x:auto 会被判成可横滚容器抢走 swipe。
 */
export default function HScroll({
  id,
  className = '',
  children,
}: {
  id: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pid: number;
    x: number;
    y: number;
    left: number;
    axis: 'h' | 'v' | null;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  return (
    <div
      ref={ref}
      data-scroll-container={id}
      data-scroll-direction="horizontal"
      data-hscroll=""
      className={`flex min-w-0 overflow-x-scroll overscroll-x-contain ${className}`}
      style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      onPointerDown={(e) => {
        const el = ref.current;
        if (!el || el.scrollWidth <= el.clientWidth + 2) return;
        suppressClick.current = false;
        drag.current = {
          pid: e.pointerId,
          x: e.clientX,
          y: e.clientY,
          left: el.scrollLeft,
          axis: null,
          moved: false,
        };
        // 确认横向拖动后再 capture,避免纯点击被容器抢走(按钮「立即购买」等无反应)
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        const el = ref.current;
        if (!d || !el || d.pid !== e.pointerId) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (d.axis == null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          d.axis = Math.abs(dx) >= Math.abs(dy) ? 'h' : 'v';
        }
        if (d.axis !== 'h') return;
        if (!d.moved) {
          d.moved = true;
          suppressClick.current = true;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }
        el.scrollLeft = d.left - dx;
        e.preventDefault();
        e.stopPropagation();
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
      onPointerCancel={() => {
        drag.current = null;
      }}
      onClickCapture={(e) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

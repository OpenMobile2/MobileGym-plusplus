import React, { useRef } from 'react';

/**
 * 横向滚动条:pointer 自管 scrollLeft,桌面鼠标拖拽也能滑(模拟手机横滑)。
 * 打 data-hscroll 供整页左右滑手势避让;可选 data-scroll-* 供走查识别。
 */
export default function HScroll({
  id,
  className = '',
  children,
}: {
  id?: string;
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
      data-hscroll=""
      {...(id ? { 'data-scroll-container': id, 'data-scroll-direction': 'horizontal' as const } : {})}
      className={`scrollbar-none flex min-w-0 overflow-x-auto overscroll-x-contain ${className}`}
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

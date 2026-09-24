import React, { useRef } from 'react';

/** 横向滚动区：确认水平拖动后接管 scrollLeft，避免被外层纵向滚动抢走。 */
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
    pointerId: number;
    x: number;
    y: number;
    scrollLeft: number;
    axis: 'horizontal' | 'vertical' | null;
    moved: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  return (
    <div
      ref={ref}
      data-scroll-container={id}
      data-scroll-direction="horizontal"
      className={`flex min-w-0 overflow-x-scroll overscroll-x-contain ${className}`}
      style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
      onPointerDown={(event) => {
        const element = ref.current;
        if (!element || element.scrollWidth <= element.clientWidth + 2) return;
        suppressClick.current = false;
        drag.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          scrollLeft: element.scrollLeft,
          axis: null,
          moved: false,
        };
      }}
      onPointerMove={(event) => {
        const current = drag.current;
        const element = ref.current;
        if (!current || !element || current.pointerId !== event.pointerId) return;
        const dx = event.clientX - current.x;
        const dy = event.clientY - current.y;
        if (current.axis === null && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
          current.axis = Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
        }
        if (current.axis !== 'horizontal') return;
        if (!current.moved) {
          current.moved = true;
          suppressClick.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
        element.scrollLeft = current.scrollLeft - dx;
        event.preventDefault();
        event.stopPropagation();
      }}
      onPointerUp={() => { drag.current = null; }}
      onPointerCancel={() => { drag.current = null; }}
      onClickCapture={(event) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {children}
    </div>
  );
}

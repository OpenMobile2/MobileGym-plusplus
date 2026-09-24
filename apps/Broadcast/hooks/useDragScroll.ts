// apps/Broadcast/hooks/useDragScroll.ts
// 横向卡片轮播的鼠标/指针拖动滚动。
// 用 >8px 水平位移确认拖动意图后再 setPointerCapture(避免吞掉卡片点击,
// 沿用仓库 SwipeRow 教训);拖动结束抑制一次 click,防止松手时误触发卡片跳转。
import { useRef, type PointerEvent as RPE } from 'react';

export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  const st = useRef({ down: false, drag: false, startX: 0, startLeft: 0, pid: -1 });

  const onPointerDown = (e: React.PointerEvent<T>) => {
    const el = ref.current;
    if (!el) return;
    st.current = { down: true, drag: false, startX: e.clientX, startLeft: el.scrollLeft, pid: e.pointerId };
  };

  const onPointerMove = (e: React.PointerEvent<T>) => {
    const s = st.current;
    const el = ref.current;
    if (!s.down || !el) return;
    const dx = e.clientX - s.startX;
    if (!s.drag && Math.abs(dx) > 8) {
      s.drag = true;
      try { el.setPointerCapture(s.pid); } catch { /* noop */ }
    }
    if (s.drag) el.scrollLeft = s.startLeft - dx;
  };

  const end = () => {
    const s = st.current;
    const el = ref.current;
    if (s.drag && el) {
      try { el.releasePointerCapture(s.pid); } catch { /* noop */ }
      const suppress = (ev: Event) => { ev.stopPropagation(); ev.preventDefault(); el.removeEventListener('click', suppress, true); };
      el.addEventListener('click', suppress, true);
    }
    s.down = false;
    s.drag = false;
  };

  return {
    ref,
    onPointerDown,
    onPointerMove,
    onPointerUp: end,
    onPointerCancel: end,
    style: { touchAction: 'pan-x' as const },
  };
}

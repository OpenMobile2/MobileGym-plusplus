import { useCallback, useRef } from 'react';

/**
 * 让横滑容器支持鼠标按住拖动滚动(模拟器无原生鼠标拖动滚动,只有滚轮=纵向)。
 * 触摸设备用系统原生滚动,这里只接管鼠标;拖动后抑制误触点击,并阻止图片被拖成「幽灵」。
 *
 * 返回一个 callback ref:元素挂载(含条件渲染后才出现的)时才绑定,卸载时解绑,
 * 因此对「最近浏览」「店内搜索结果」这类延迟出现的容器也生效。
 */
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const cleanupRef = useRef<(() => void) | null>(null);

  return useCallback((el: T | null) => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    if (!el) return;

    let down = false;
    let startX = 0;
    let startLeft = 0;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) > 4) moved = true;
      if (moved) el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      down = false;
    };
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.stopPropagation();
        e.preventDefault();
        moved = false;
      }
    };
    // 阻止浏览器把图片/文字拖成半透明「幽灵」跟着鼠标飞
    const onDragStart = (e: DragEvent) => e.preventDefault();

    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    el.addEventListener('click', onClick, true);
    el.addEventListener('dragstart', onDragStart);

    cleanupRef.current = () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      el.removeEventListener('click', onClick, true);
      el.removeEventListener('dragstart', onDragStart);
    };
  }, []);
}

export type SwipeDirection = 'horizontal' | 'vertical' | 'both';

export function shouldSuspendHorizontalScrollSnap(
  direction: SwipeDirection,
  canScrollX: boolean,
  scrollSnapType: string,
): boolean {
  const axis = scrollSnapType.trim().toLowerCase().split(/\s+/, 1)[0];
  return direction === 'horizontal' && canScrollX && axis === 'x';
}

export function suspendHorizontalScrollSnap(
  element: HTMLElement,
  direction: SwipeDirection,
  canScrollX: boolean,
): () => void {
  if (!shouldSuspendHorizontalScrollSnap(direction, canScrollX, getComputedStyle(element).scrollSnapType)) {
    return () => {};
  }

  const previousInlineValue = element.style.scrollSnapType;
  element.style.scrollSnapType = 'none';

  return () => {
    if (previousInlineValue) {
      element.style.scrollSnapType = previousInlineValue;
    } else {
      element.style.removeProperty('scroll-snap-type');
    }
  };
}

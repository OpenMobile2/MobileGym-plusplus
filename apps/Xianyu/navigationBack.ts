import { getTracker } from '../../os/utils/memoryHistoryTracker';

/** URL 驱动的 overlay 参数(弹层),返回时不应落在此类历史上 */
const OVERLAY_SEARCH_KEYS = ['panel'] as const;

export function hasOverlaySearch(search: string): boolean {
  const sp = new URLSearchParams(search.replace(/^\?/, ''));
  return OVERLAY_SEARCH_KEYS.some((k) => sp.has(k));
}

/** 向后查找第一个不含 overlay 参数的历史条目,返回应 go(-delta) 的步数 */
export function findBackDeltaSkippingOverlays(navigator: object): number {
  const tracker = getTracker(navigator);
  if (!tracker) return 1;

  for (let i = tracker.index - 1; i >= 0; i--) {
    const entry = tracker.stack[i];
    if (!entry?.pathname) continue;
    if (hasOverlaySearch(entry.search)) continue;
    return tracker.index - i;
  }
  return 1;
}

/** pop 历史栈,跳过中间带弹层参数的条目 */
export function backSkippingOverlays(navigator: object): void {
  const mem = navigator as { go?: (delta: number) => void };
  const delta = findBackDeltaSkippingOverlays(navigator);
  if (!mem.go || delta <= 0) return;

  mem.go(-delta);
  const tracker = getTracker(navigator);
  if (tracker) {
    tracker.index = Math.max(0, tracker.index - delta);
    tracker.stack.length = tracker.index + 1;
  }
}

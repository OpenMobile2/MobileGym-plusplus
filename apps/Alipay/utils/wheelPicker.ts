export const WHEEL_ITEM_HEIGHT = 36;

export function wheelValueAtScroll<T>(
  options: readonly T[],
  scrollTop: number,
  fallback: T,
): T {
  if (!options.length || !Number.isFinite(scrollTop)) return fallback;
  const index = Math.max(
    0,
    Math.min(options.length - 1, Math.round(scrollTop / WHEEL_ITEM_HEIGHT)),
  );
  return options[index] ?? fallback;
}

export function wheelScrollTop<T>(options: readonly T[], value: T): number {
  return Math.max(0, options.indexOf(value)) * WHEEL_ITEM_HEIGHT;
}

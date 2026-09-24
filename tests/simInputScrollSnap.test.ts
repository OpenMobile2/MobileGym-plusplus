import { describe, expect, it } from 'vitest';
import { shouldSuspendHorizontalScrollSnap } from '../os/scrollSnapGesture';

describe('simulated horizontal swipe scroll snap arbitration', () => {
  it('suspends only horizontal x-axis snap containers', () => {
    expect(shouldSuspendHorizontalScrollSnap('horizontal', true, 'x mandatory')).toBe(true);
    expect(shouldSuspendHorizontalScrollSnap('horizontal', true, 'x proximity')).toBe(true);

    expect(shouldSuspendHorizontalScrollSnap('vertical', true, 'x mandatory')).toBe(false);
    expect(shouldSuspendHorizontalScrollSnap('both', true, 'x mandatory')).toBe(false);
    expect(shouldSuspendHorizontalScrollSnap('horizontal', false, 'x mandatory')).toBe(false);
    expect(shouldSuspendHorizontalScrollSnap('horizontal', true, 'y mandatory')).toBe(false);
    expect(shouldSuspendHorizontalScrollSnap('horizontal', true, 'none')).toBe(false);
  });
});

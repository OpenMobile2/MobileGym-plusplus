/**
 * Deterministic Random Number Service
 *
 * Provides a seedable pseudo-random generator to replace `Math.random()`
 * across the platform. The purpose is **reproducibility for benchmark and
 * RL rollouts**: `reset(seed) → same initial state`.
 *
 * Design (follows Gymnasium's `env.reset(seed)` convention):
 * - Internal PRNG: mulberry32 (32-bit, tiny state, good enough for mocks).
 * - `seed(n)` sets/replaces the internal state; subsequent `random()` calls
 *   produce a deterministic stream.
 * - `random()` returns a float in [0, 1) — drop-in for `Math.random()`.
 * - `randomInt(min, maxExclusive)` — convenience.
 * - Also exposed as `window.__SIM_RNG__` so benchmark harnesses and
 *   trajectory replays can pin the seed before scenario setup.
 *
 * When to migrate an existing `Math.random()`:
 * - Any id generation for a user-navigable entity (chatId, itemId, orderId)
 *   → MUST migrate (see docs/common-pitfalls-from-8-apps.md · 坑四).
 * - Seed data / default data construction → MUST migrate.
 * - Cosmetic-only jitter (e.g. wave heights in decorative canvas) → optional.
 *
 * NOTE (2026-07-09): This service is intentionally a small standalone module.
 * The full migration of 94 in-tree `Math.random()` callsites and an ESLint
 * rule to forbid direct `Math.random` in `apps/` are tracked as separate
 * project items — see docs/roadmap/rng-migration.md.
 */

const DEFAULT_SEED = 0x1a2b3c4d;

let state = DEFAULT_SEED >>> 0;

function mulberry32(): number {
  state = (state + 0x6D2B79F5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function seed(n: number): void {
  state = (n >>> 0) || DEFAULT_SEED;
}

export function random(): number {
  return mulberry32();
}

export function randomInt(min: number, maxExclusive: number): number {
  return Math.floor(mulberry32() * (maxExclusive - min)) + min;
}

/** Namespace token derived from the PRNG stream (replaces `Math.random().toString(36).slice(2, 10)`). */
export function randomToken(len = 8): string {
  let out = '';
  while (out.length < len) {
    out += mulberry32().toString(36).slice(2);
  }
  return out.slice(0, len);
}

if (typeof window !== 'undefined') {
  (window as unknown as { __SIM_RNG__: unknown }).__SIM_RNG__ = {
    seed,
    random,
    randomInt,
    randomToken,
  };
}

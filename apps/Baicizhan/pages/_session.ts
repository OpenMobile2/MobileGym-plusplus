import type { Word } from '../types';

/** 确定性打乱(不用 Math.random,避免平台 RNG 约束):按 seed 做 Fisher-Yates。 */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** 四选一:正确释义 + 3 干扰项。正确项位置按 hash%4 均匀分布(修 Gate4:此前几乎都落在右下角)。 */
export function buildOptions(word: Word): { options: string[]; correctIndex: number } {
  const distract = word.options.slice(0, 3);
  const correctIndex = hash(word.id) % 4;
  const options: string[] = [];
  let di = 0;
  for (let i = 0; i < 4; i += 1) {
    options.push(i === correctIndex ? word.meaning : (distract[di++] ?? word.meaning + ' '));
  }
  return { options, correctIndex };
}

/** 一组新学词(status=new,最多 n 个);不足则用 learning 词补齐,保证能跑通。 */
export function pickNewGroup(words: Word[], learn: Record<string, { status: string }>, n = 10): Word[] {
  const news = words.filter((w) => (learn[w.id]?.status ?? 'new') === 'new');
  const pool = news.length >= 3 ? news : words;
  return pool.slice(0, n);
}

/** 一组复习词(nextReviewDay<=0 且已学);不足用已学词补齐。 */
export function pickReviewGroup(
  words: Word[], learn: Record<string, { status: string; nextReviewDay: number }>, n = 10,
): Word[] {
  const due = words.filter((w) => {
    const l = learn[w.id];
    return l && l.status !== 'new' && l.status !== 'zhan' && l.nextReviewDay <= 1;
  });
  const pool = due.length >= 3 ? due : words.filter((w) => (learn[w.id]?.status ?? 'new') !== 'new');
  return (pool.length >= 3 ? pool : words).slice(0, n);
}

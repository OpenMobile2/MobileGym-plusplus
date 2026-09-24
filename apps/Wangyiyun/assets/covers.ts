/**
 * 生成封面解析:assets/gen/<seed>.png 存在时用真实图,否则回落 seed 渐变。
 * 生图脚本:assets/gen_covers.py(读 data/defaults.json 批量生成)。
 */
const modules = import.meta.glob('./gen/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export const COVERS: Record<string, string> = Object.fromEntries(
  Object.entries(modules).map(([path, url]) => {
    const name = path.split('/').pop()!.replace(/\.png$/, '');
    return [name, url];
  }),
);

/** 全部可用封面 seed(笔记素材库等) */
export const MEDIA_SEEDS = Object.keys(COVERS).sort();

export function coverUrl(seed: string): string | undefined {
  return COVERS[seed];
}

/** seed 无图时回落到稳定封面,避免色块 */
export function resolveCoverSeed(seed: string | undefined | null): string {
  if (seed && COVERS[seed]) return seed;
  if (!MEDIA_SEEDS.length) return seed || 'cover1';
  let h = 0;
  for (const ch of (seed || 'x')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return MEDIA_SEEDS[h % MEDIA_SEEDS.length];
}

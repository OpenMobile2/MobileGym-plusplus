/**
 * 装饰位图注册表(Vite glob 动态加载)。
 * 由 gen_assets.py 批量生成;缺图时返回 undefined,组件回落纯色。
 */
type Mod = { default: string };

function buildMap(mods: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, mod] of Object.entries(mods)) {
    const name = path.split('/').pop()?.replace(/\.png$/, '');
    if (name) out[name] = (mod as Mod).default;
  }
  return out;
}

const covers = buildMap(import.meta.glob('./covers/*.png', { eager: true }));
const bg = buildMap(import.meta.glob('./bg/*.png', { eager: true }));
const misc = buildMap(import.meta.glob('./misc/*.png', { eager: true }));

export function coverUrl(key: string): string | undefined {
  return covers[key];
}
export function bgUrl(key: string): string | undefined {
  return bg[key];
}
export function miscUrl(key: string): string | undefined {
  return misc[key];
}

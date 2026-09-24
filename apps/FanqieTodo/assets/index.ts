// 生成的 PNG 用 Vite glob 建映射;缺失时 xUrl(key) 返回 undefined,组件回落纯色/CSS。
// PNG 由 assets/gen_assets.py 批量生成(§5.3);无 key 时保持缺失,不阻塞功能。
const cardBg = import.meta.glob('./cardbg/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const checkinBg = import.meta.glob('./checkinbg/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const avatars = import.meta.glob('./avatars/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function pick(map: Record<string, string>, dir: string, key: string): string | undefined {
  return map[`./${dir}/${key}.png`];
}

export const cardBgUrl = (key: string): string | undefined => pick(cardBg, 'cardbg', key);
export const checkinBgUrl = (key: string): string | undefined => pick(checkinBg, 'checkinbg', key);
export const avatarUrl = (key: string): string | undefined => pick(avatars, 'avatars', key);

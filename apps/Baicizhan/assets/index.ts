// App 自有位图,经 Vite import.meta.glob 引入(禁止走 public/ URL)。
// PNG 由 assets/gen_assets.py 生成(§5.3)。缺失时 resolver 返回 null,
// 组件回落到 CSS 占位(色块 + 首字母),功能不受影响(§5.3:有 PNG 用 PNG,缺失回落)。

const wordImgs = import.meta.glob('./words/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const productImgs = import.meta.glob('./products/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const articleImgs = import.meta.glob('./articles/*.png', { eager: true, import: 'default' }) as Record<string, string>;
const avatarImgs = import.meta.glob('./avatars/*.png', { eager: true, import: 'default' }) as Record<string, string>;

function pick(map: Record<string, string>, folder: string, key: string): string | null {
  // key 形如 "words/prudent.png" 或 "prudent"
  const base = key.includes('/') ? key.split('/').pop()! : `${key}.png`;
  return map[`./${folder}/${base}`] ?? null;
}

export const wordImage = (key: string): string | null => pick(wordImgs, 'words', key);
export const productImage = (key: string): string | null => pick(productImgs, 'products', key);
export const articleImage = (key: string): string | null => pick(articleImgs, 'articles', key);
export const avatarImage = (key: string): string | null => pick(avatarImgs, 'avatars', key);

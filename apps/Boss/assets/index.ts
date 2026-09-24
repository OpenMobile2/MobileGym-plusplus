// 生成位图统一入口(Vite import;缺图时组件回落 CSS 色块)。
const avatarModules = import.meta.glob('./avatars/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const logoModules = import.meta.glob('./logos/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const feedModules = import.meta.glob('./feed/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const companyModules = import.meta.glob('./company/*.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

function byName(mods: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [path, url] of Object.entries(mods)) {
    const name = path.split('/').pop()!.replace('.png', '');
    out[name] = url;
  }
  return out;
}

export const AVATARS = byName(avatarModules);
export const LOGOS = byName(logoModules);
export const FEED_IMGS = byName(feedModules);
export const COMPANY_IMGS = byName(companyModules);

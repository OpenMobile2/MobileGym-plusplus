const shopModules = import.meta.glob('./shops/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>;
const dishModules = import.meta.glob('./dishes/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>;
const avatarModules = import.meta.glob('./avatars/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>;
const avatar2Modules = import.meta.glob('./avatars2/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>;
const iconModules = import.meta.glob('./icons/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>;
const noteModules = import.meta.glob('./notes/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>;
const svcModules = import.meta.glob('./icons2/*.png', { eager: true, import: 'default' }) as Record<
  string,
  string
>;

function pick(map: Record<string, string>, file: string): string | undefined {
  const key = Object.keys(map).find((k) => k.endsWith(`/${file}`) || k.endsWith(`\\${file}`));
  return key ? map[key] : undefined;
}

export function shopCoverUrl(shopId: string): string | undefined {
  return pick(shopModules, `${shopId}.png`);
}

/** 店铺顶图图集:封面 + 生成的门店/招牌图(g1..g3),缺图自动跳过 */
export function shopGalleryUrls(shopId: string): string[] {
  const urls: string[] = [];
  const cover = shopCoverUrl(shopId);
  if (cover) urls.push(cover);
  for (const g of ['g1', 'g2', 'g3']) {
    const u = pick(shopModules, `${shopId}_${g}.png`);
    if (u) urls.push(u);
  }
  return urls;
}

export function dishImageUrl(shopId: string, dishId: string): string | undefined {
  return pick(dishModules, `${shopId}_${dishId}.png`);
}

export function avatarUrl(index: number): string | undefined {
  const n = ((Math.abs(index) % 8) + 8) % 8;
  return pick(avatarModules, `u${n === 0 ? 8 : n}.png`);
}

/** 生成的卡通美食头像 av1..av9(替代半身像) */
export const AVATAR2_COUNT = 9;
export function avatar2Url(index: number): string | undefined {
  const n = (((Math.abs(index) % AVATAR2_COUNT) + AVATAR2_COUNT) % AVATAR2_COUNT) + 1;
  return pick(avatar2Modules, `av${n}.png`);
}

export function diamondIconUrl(id: string): string | undefined {
  return pick(iconModules, `${id}.png`);
}

export function newbieGiftUrl(): string | undefined {
  return pick(iconModules, 'newbie_gift.png');
}

export function noteCoverUrl(noteId: string): string | undefined {
  return pick(noteModules, `${noteId}.png`);
}

/** 我的页服务图标(生成图):svc1..svc8 */
export function serviceIconUrl(n: number): string | undefined {
  return pick(svcModules, `svc${n}.png`);
}

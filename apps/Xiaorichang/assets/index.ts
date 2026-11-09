// App 自有二进制资产,经 Vite import 引入(禁止走 public/<appName>/... URL)。
// PNG 由 assets/gen_assets.py 生成(pipeline v3 §5.3),已压到 256×256。
import userAvatar from './avatars/user.png';
import alt1Avatar from './avatars/alt1.png';
import alt2Avatar from './avatars/alt2.png';
import cardCity from './cards/card_city.png';
import cardSea from './cards/card_sea.png';
import cardForest from './cards/card_forest.png';

export const AVATARS: Record<string, string> = {
  user: userAvatar,
  alt1: alt1Avatar,
  alt2: alt2Avatar,
};

/** defaults.json 里存的是 key,不是路径 */
export function avatarOf(key: string): string {
  if (key.startsWith('/') || /^(blob:|data:|content:|https?:)/.test(key)) return key;
  return AVATARS[key] ?? AVATARS.user;
}

/** 今日卡片的竖版风景图(s213/s242)。按日期取,同一天恒定。 */
export const CARD_PHOTOS = [cardCity, cardSea, cardForest];

export function cardPhotoOf(dayOfYear: number): string {
  return CARD_PHOTOS[dayOfYear % CARD_PHOTOS.length];
}

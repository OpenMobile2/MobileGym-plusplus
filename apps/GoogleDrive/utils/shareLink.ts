/** 每个条目一条稳定、互不相同的分享链接（由 id 派生，不依赖随机数） */
export function buildShareLink(itemId: string): string {
  return `https://drive.google.com/file/d/${encodeURIComponent(itemId)}/view?usp=sharing`;
}

export function driveShareText(name: string, itemId: string): string {
  return `【Google 云端硬盘】${name}\n${buildShareLink(itemId)}`;
}

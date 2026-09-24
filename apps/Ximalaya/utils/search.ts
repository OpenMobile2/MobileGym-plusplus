import { pinyinInitials } from '../res/pinyin';

// ============ 类型(泛型约束,不限制完整 Album/Anchor/Track 类型) ============
interface SearchableAlbum {
  id: string;
  title: string;
  tags: string[];
  category: string;
  anchorName: string;
  intro: string;
}

interface SearchableAnchor {
  id: string;
  name: string;
  desc: string;
}

interface SearchableTrack {
  id: string;
  title: string;
  albumId: string;
}

// ============ 核心匹配函数 ============

/**
 * 判断单个关键词是否匹配文本(中文原文 or 拼音首字母)
 */
function matchKeyword(text: string, kw: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes(kw)) return true;
  // 拼音首字母匹配(仅当关键词是纯英文)
  if (/^[a-z]+$/.test(kw)) {
    const initials = pinyinInitials(text);
    if (initials.includes(kw)) return true;
  }
  return false;
}

/**
 * 多关键词匹配(空格分隔,AND 逻辑)
 * 每个关键词都必须匹配至少一个字段
 */
export function matchAlbumByKeyword<T extends SearchableAlbum>(album: T, keyword: string): boolean {
  const kws = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (kws.length === 0) return true;
  return kws.every((kw) =>
    matchKeyword(album.title, kw) ||
    album.tags.some((t) => matchKeyword(t, kw)) ||
    matchKeyword(album.category, kw) ||
    matchKeyword(album.anchorName, kw) ||
    matchKeyword(album.intro, kw),
  );
}

export function matchAnchorByKeyword<T extends SearchableAnchor>(anchor: T, keyword: string): boolean {
  const kws = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (kws.length === 0) return true;
  return kws.every((kw) =>
    matchKeyword(anchor.name, kw) ||
    matchKeyword(anchor.desc, kw),
  );
}

export function matchTrackByKeyword<T extends SearchableTrack>(track: T, albums: SearchableAlbum[], keyword: string): boolean {
  const kws = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (kws.length === 0) return true;
  const album = albums.find((a) => a.id === track.albumId);
  return kws.every((kw) =>
    matchKeyword(track.title, kw) ||
    (album ? matchAlbumByKeyword(album, kw) : false),
  );
}

// ============ 相关度排序 ============

/**
 * 计算专辑与关键词的相关度分数
 * 标题匹配(100) > 标签匹配(50) > 品类匹配(30) > 主播名(20) > 简介(10)
 * 拼音匹配分数减半(因为不是精确匹配)
 */
function albumRelevance(album: SearchableAlbum, keyword: string): number {
  const kws = keyword.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (kws.length === 0) return 0;
  let score = 0;
  for (const kw of kws) {
    // 标题精确匹配(最高分)
    if (album.title.toLowerCase().includes(kw)) score += 100;
    // 标题拼音首字母匹配
    else if (/^[a-z]+$/.test(kw) && pinyinInitials(album.title).includes(kw)) score += 50;
    // 标签匹配
    else if (album.tags.some((t) => matchKeyword(t, kw))) score += 50;
    // 品类匹配
    else if (matchKeyword(album.category, kw)) score += 30;
    // 主播名匹配
    else if (matchKeyword(album.anchorName, kw)) score += 20;
    // 简介匹配
    else if (matchKeyword(album.intro, kw)) score += 10;
  }
  return score;
}

/**
 * 按相关度排序专辑(综合排序)
 */
export function sortAlbumsByRelevance<T extends SearchableAlbum>(albums: T[], keyword: string): T[] {
  if (!keyword.trim()) return albums;
  return [...albums]
    .map((a) => ({ album: a, score: albumRelevance(a, keyword) }))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.album);
}

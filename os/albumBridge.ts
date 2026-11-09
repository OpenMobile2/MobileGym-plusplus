/**
 * App → 系统相册桥接（选图 / 存图）。
 * 业务侧优先用本模块，避免只 toast 或本地假素材。
 */
import ContentResolver from './ContentResolver';
import * as MediaService from './MediaService';
import type { MediaItem, MediaPickerResult } from './types';

export async function pickImages(options?: {
  multiple?: boolean;
  maxSelect?: number;
}): Promise<MediaPickerResult> {
  try {
    ContentResolver.query('content://media/images');
  } catch {
    /* ContentResolver 不可用时仍走 MediaService */
  }
  const multiple = options?.multiple ?? false;
  return MediaService.pickMedia({
    type: 'image',
    multiple,
    maxSelect: options?.maxSelect ?? (multiple ? 9 : 1),
  });
}

export async function saveImageToAlbum(
  content: Blob | string,
  options?: {
    album?: string;
    fileName?: string;
    mimeType?: string;
    width?: number;
    height?: number;
  },
): Promise<MediaItem | null> {
  const mimeType = options?.mimeType || (typeof content === 'string' && content.includes('png') ? 'image/png' : 'image/jpeg');
  const fileName = options?.fileName;
  const saved = await MediaService.saveToGallery(content, {
    album: options?.album || 'Saved',
    fileName,
    mimeType,
  });
  if (!saved) return null;
  try {
    ContentResolver.insert('content://media/images', {
      fileName: fileName || saved.name,
      mimeType: mimeType || saved.mimeType || 'image/jpeg',
      uri: saved.uri,
      path: saved.path,
      width: options?.width ?? saved.width ?? 0,
      height: options?.height ?? saved.height ?? 0,
    });
  } catch {
    /* insert 失败不阻断已写入 FS 的图片 */
  }
  return saved;
}

/** 无真实海报渲染时，用简易 SVG 落一张可验的系统相册图 */
export function makeTextPosterDataUrl(lines: string[], opts?: { width?: number; height?: number; title?: string }): string {
  const w = opts?.width ?? 720;
  const h = opts?.height ?? 1280;
  const title = opts?.title ?? '';
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = lines
    .slice(0, 12)
    .map((line, i) => `<text x="48" y="${160 + i * 40}" font-size="28" fill="#222">${esc(line.slice(0, 36))}</text>`)
    .join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
  <rect width="100%" height="100%" fill="#F7F7F7"/>
  <text x="48" y="96" font-size="36" font-weight="700" fill="#111">${esc(title)}</text>
  ${body}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

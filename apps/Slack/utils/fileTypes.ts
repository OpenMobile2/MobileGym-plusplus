import type { Attachment } from '../types';

/** 把附件映射到文件类型筛选 id（IMG_2389） */
export function attachmentFileType(a: Attachment): string {
  if (a.kind === 'image') return 'image';
  if (a.kind === 'link') return 'email';
  const ext = (a.ext ?? '').toUpperCase();
  const name = (a.name ?? '').toLowerCase();
  if (ext === 'PDF' || name.endsWith('.pdf')) return 'pdf';
  if (name.includes('list')) return 'lists';
  if (name.includes('canvas') || name.includes('画板')) return 'canvas';
  if (ext.includes('XLS') || name.includes('sheet')) return 'spreadsheet';
  if (ext.includes('PPT') || name.includes('slide')) return 'presentation';
  if (name.match(/\.(mp3|wav|m4a)/)) return 'audio';
  if (name.match(/\.(mp4|mov)/)) return 'video';
  if (name.includes('snippet')) return 'snippet';
  return 'pdf';
}

// apps/Tencentvideo/components/Img.tsx —— 图片引用解析 + 统一 <TvImg> 组件。
// defaults.json 的图片字段存引用 id(poster_x / still_x / avatar_x / actor_x / goods_x / banner_x,
// regen_defaults.py 跑过后可能带 .png/.svg 后缀)。
// 解析规则(与 data/regen_defaults.py 约定一致):res/img/<id>.png 存在则用 PNG,
// 否则回落 res/img/<id>.svg 占位;两者皆缺给渐变色块兜底(生图后台跑完后自动切 PNG)。
import React from 'react';
import { TV_COLORS } from '../constants';

const pngModules = import.meta.glob('../res/img/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const svgModules = import.meta.glob('../res/img/*.svg', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

const PNG_BY_ID: Record<string, string> = {};
for (const [path, url] of Object.entries(pngModules)) {
  const m = path.match(/\/([^/]+)\.png$/);
  if (m) PNG_BY_ID[m[1]] = url;
}
const SVG_BY_ID: Record<string, string> = {};
for (const [path, url] of Object.entries(svgModules)) {
  const m = path.match(/\/([^/]+)\.svg$/);
  if (m) SVG_BY_ID[m[1]] = url;
}

/** 图片引用(可带 .png/.svg 后缀)→ 打包后 URL;PNG 优先,SVG 兜底;缺图返回 null。 */
export function imgSrc(ref: string | undefined | null): string | null {
  if (!ref) return null;
  const id = ref.replace(/\.(png|svg)$/, '');
  return PNG_BY_ID[id] ?? SVG_BY_ID[id] ?? null;
}

/* ---------- 缺图占位:品牌色渐变 + 首字 ---------- */

const GRADIENTS = [
  `linear-gradient(135deg, ${TV_COLORS.primary}, #0a4a52)`,
  `linear-gradient(135deg, ${TV_COLORS.vipBadgeBg}, ${TV_COLORS.badgeOrange})`,
  `linear-gradient(135deg, #0a4a52, ${TV_COLORS.darkBg})`,
  `linear-gradient(135deg, ${TV_COLORS.badgeOrange}, #7a2400)`,
] as const;

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export interface TvImgProps {
  /** 图片引用 id(defaults.json 中的值,可带扩展名) */
  id: string | undefined | null;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

/** 统一图片组件:PNG → SVG 占位 → 渐变兜底(按 id 哈希稳定取色)。 */
export function TvImg({ id, className, alt, style }: TvImgProps): React.ReactElement {
  const url = imgSrc(id);
  const label = alt ?? '';
  if (url) {
    return (
      <img src={url} className={className} style={style} alt={label} draggable={false} />
    );
  }
  const key = (id ?? '').replace(/\.(png|svg)$/, '');
  return (
    <div
      className={`flex items-center justify-center overflow-hidden ${className ?? ''}`}
      style={{ background: GRADIENTS[hashId(key) % GRADIENTS.length], ...style }}
      role="img"
      aria-label={label}
    >
      <span className="text-white/80 text-xs px-1 truncate">{label || key.split('_').pop()}</span>
    </div>
  );
}

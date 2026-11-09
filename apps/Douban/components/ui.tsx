// apps/Douban/components/ui.tsx —— 共享 UI 基件(FOUNDATION)。
// 约定:所有可点交互的绑定(bindTap/bindBack)一律在【页面侧】用字面量 id 生成,
// 以已绑定 props(object)传进来 spread —— 组件内部不出现 transition/action id。
import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';

/** 豆瓣视觉常量。浅色语义色走 CSS 变量，由 DoubanApp 按 OS 深色注入。 */
export const C = {
  green: '#00B51D',
  greenSoft: 'var(--db-green-soft, #E6F7E9)',
  bg: 'var(--db-bg, #F7F7F7)',
  surface: 'var(--db-surface, #FFFFFF)',
  text: 'var(--db-text, #1A1A1A)',
  sub: 'var(--db-sub, #8A8F99)',
  border: 'var(--db-border, #EDEDED)',
  /** 星级/「确定」金色(markSheet 确定钮、标签选中描边) */
  gold: '#F5A623',
  /** 评分/标记橙(星星、分数、♡想看)—— 采样自 evidence IMG_0363 星星实心填充 */
  orange: '#FF9900',
  /** 链接绿(正文话题/条目绿链) */
  link: '#00A31A',
  danger: '#E5484D',
  /** 条目详情深色皮肤(电影页深色头图区) */
  dark: '#3A3F45',
  darkText: '#F2F3F5',
} as const;

/** 小组 per-group 主题色(seed 里 group.themeColor 存 key 或直接存色值均可) */
export const GROUP_THEMES: Record<string, string> = {
  orange: '#E8702A', // 标记/评分橙
  brown: '#8A6244', // 谜案拼图社主题棕
  red: '#C93B3B', // 韩剧
  pink: '#E0608A', // 豆瓣奶茶
  violet: '#7A6BD6', // 阅后即焚
  blue: '#3E7BF2', // 小宇宙播客
  teal: '#2FA39A', // C组主题色
  deepblue: '#3F5E9E', // 正视我们的身体(申请制)
};

export const IMG_FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 140'><rect width='100' height='140' fill='%23EDEFF2'/><text x='50' y='75' text-anchor='middle' font-size='40' fill='%23C3C9D1'>豆</text></svg>";

/** 图片:统一 onError 兜底 */
export function Img({
  src,
  alt = '',
  className,
  style,
}: {
  src: string;
  alt?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={src || IMG_FALLBACK}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        (e.target as HTMLImageElement).src = IMG_FALLBACK;
      }}
    />
  );
}

export function Avatar({ src, size = 36, className = '' }: { src: string; size?: number; className?: string }) {
  return (
    <Img
      src={src}
      className={`rounded-full object-cover shrink-0 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

/**
 * 顶栏。left 缺省 = bindBack 的「‹」返回键。dark=true 时用深色皮肤(条目详情页)。
 */
export function TopBar({
  title,
  left,
  right,
  dark,
  bg,
  borderless,
}: {
  title?: React.ReactNode;
  left?: React.ReactNode;
  right?: React.ReactNode;
  dark?: boolean;
  /** 自定义背景色(如小组主题色) */
  bg?: string;
  borderless?: boolean;
}) {
  const { bindBack } = useDoubanGestures();
  const fg = dark ? C.darkText : C.text;
  return (
    <div
      className={`flex items-center h-11 px-1 shrink-0 ${borderless ? '' : 'border-b'}`}
      style={{ borderColor: dark ? 'transparent' : C.border, background: bg ?? (dark ? C.dark : C.surface) }}
    >
      <div className="w-16 flex items-center">
        {left ?? (
          <button
            {...bindBack()}
            className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer"
            style={{ color: fg }}
          >
            ‹
          </button>
        )}
      </div>
      <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: fg }}>
        {title}
      </div>
      <div className="w-16 flex items-center justify-end pr-1">{right}</div>
    </div>
  );
}

/** 星级实时文案(markSheet/评分处通用) */
export const RATING_LABELS = ['', '很差', '较差', '还行', '推荐', '力荐'] as const;

const STAR_PATH =
  'M10 1.5l2.47 5.36 5.86.63-4.36 3.96 1.2 5.77L10 14.3l-5.17 2.92 1.2-5.77-4.36-3.96 5.86-.63L10 1.5z';

function StarIcon({ fill, size, frac = 1 }: { fill: string; size: number; frac?: number }) {
  const id = React.useId();
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" className="shrink-0">
      {frac < 1 && (
        <defs>
          <clipPath id={id}>
            <rect x="0" y="0" width={20 * frac} height="20" />
          </clipPath>
        </defs>
      )}
      <path d={STAR_PATH} fill="#D8DCE1" />
      <path d={STAR_PATH} fill={fill} clipPath={frac < 1 ? `url(#${id})` : undefined} />
    </svg>
  );
}

/**
 * 星级展示(半星):value 为 0-10 分制(豆瓣分,如 8.4 → 4.2 颗星)或 0-5 星制。
 * scale='score' (默认,0-10) / 'star' (0-5)。真实豆瓣星星全站金橙色。
 */
export function Stars({
  value,
  size = 12,
  color = C.orange,
  scale = 'score',
}: {
  value: number | null;
  size?: number;
  color?: string;
  scale?: 'score' | 'star';
}) {
  const stars = value == null ? 0 : scale === 'score' ? value / 2 : value;
  return (
    <span className="inline-flex items-center gap-px align-middle">
      {[0, 1, 2, 3, 4].map((i) => {
        const frac = Math.max(0, Math.min(1, stars - i));
        return <StarIcon key={i} fill={color} size={size} frac={frac} />;
      })}
    </span>
  );
}

/** 评分行:星 + 分数;rating=null → 「暂无评分」 */
export function RatingLine({
  rating,
  count,
  size = 12,
  className = '',
}: {
  rating: number | null;
  count?: number;
  size?: number;
  className?: string;
}) {
  if (rating == null) {
    return <span className={`text-xs ${className}`} style={{ color: C.sub }}>暂无评分</span>;
  }
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <Stars value={rating} size={size} />
      <span className="text-xs font-semibold" style={{ color: C.orange }}>{rating.toFixed(1)}</span>
      {count != null && <span className="text-[10px]" style={{ color: C.sub }}>({fmtCount(count)}人)</span>}
    </span>
  );
}

/** 计数格式化:万级保留一位小数 —— 10000 → 「1.0万」,4012000 → 「401.2万」;<1万 原样数字 */
export function fmtCount(n: number): string {
  if (n >= 10000) {
    return `${(n / 10000).toFixed(1)}万`;
  }
  return String(n);
}

/** fmtCount + '+':「1.0万+篇内容」等场景 */
export function fmtCountPlus(n: number): string {
  return `${fmtCount(n)}+`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 绝对时间:ts → 「2026-06-17 08:33」(经 TimeService,禁 new Date) */
export function fmtAbsDateTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** 短日期:ts → 「06-18」(MM-DD) */
export function fmtShortDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/**
 * 条目行卡(书影音通用):封面 + 标题 + 星级评分 + 副信息。
 * tapProps:页面侧 bindTap('xxx-open', {params}) 的返回值。action:右侧槽(想看按钮等)。
 */
export function SubjectCard({
  cover,
  title,
  rating,
  ratingCount,
  info,
  badge,
  tapProps,
  action,
  coverW = 64,
  coverH = 90,
}: {
  cover: string;
  title: string;
  rating: number | null;
  ratingCount?: number;
  info?: string;
  /** 左上角标(如 Top250 / NO.1热门) */
  badge?: string;
  tapProps?: object;
  action?: React.ReactNode;
  coverW?: number;
  coverH?: number;
}) {
  return (
    <div
      {...(tapProps ?? {})}
      className={`flex gap-3 items-start bg-white rounded-lg p-3 ${tapProps ? 'cursor-pointer' : ''}`}
    >
      <div className="relative shrink-0">
        <Img src={cover} className="rounded object-cover" style={{ width: coverW, height: coverH }} />
        {badge && (
          <span
            className="absolute -top-1 -left-1 px-1 rounded text-[9px] text-white"
            style={{ background: C.gold }}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{title}</div>
        <div className="mt-1"><RatingLine rating={rating} count={ratingCount} /></div>
        {info && <div className="mt-1 text-xs truncate" style={{ color: C.sub }}>{info}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

/** 区块标题:标题 + 可选「更多 ›」(moreProps 页面侧绑定) */
export function SectionHeader({
  title,
  extra,
  moreProps,
  moreText = '更多',
}: {
  title: React.ReactNode;
  extra?: React.ReactNode;
  moreProps?: object;
  moreText?: string;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <div className="text-base font-bold" style={{ color: C.text }}>{title}</div>
      {extra}
      {moreProps && (
        <button {...moreProps} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
          {moreText} ›
        </button>
      )}
    </div>
  );
}

/**
 * 排序/筛选 chip(热门/最新/作者/默认…)。默认选中态绿字浅绿底;
 * variant='seg' → 白底描边胶囊选中态(灰轨道分段样式,配合 SegRow 或单独用)。
 */
export function Chip({
  label,
  active,
  bind,
  size = 'md',
  variant = 'default',
}: {
  label: string;
  active?: boolean;
  bind?: object;
  size?: 'sm' | 'md';
  variant?: 'default' | 'seg';
}) {
  const style: React.CSSProperties =
    variant === 'seg'
      ? active
        ? { background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontWeight: 600 }
        : { background: '#F2F3F5', border: '1px solid transparent', color: C.sub, fontWeight: 400 }
      : {
          background: active ? C.greenSoft : '#F2F3F5',
          color: active ? C.green : C.sub,
          fontWeight: active ? 600 : 400,
          border: 'none',
        };
  return (
    <button
      {...(bind ?? {})}
      className={`${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs'} rounded-full cursor-pointer shrink-0`}
      style={style}
    >
      {label}
    </button>
  );
}

/** 主/次按钮(关注/加入/想看…) */
export function PrimaryBtn({
  label,
  bind,
  ghost,
  color = C.green,
  className = '',
}: {
  label: React.ReactNode;
  bind?: object;
  /** ghost=true → 描边空心(已关注/已加入态) */
  ghost?: boolean;
  color?: string;
  className?: string;
}) {
  return (
    <button
      {...(bind ?? {})}
      className={`px-4 h-8 rounded-full text-sm cursor-pointer ${className}`}
      style={
        ghost
          ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }
          : { background: color, color: '#fff', border: 'none' }
      }
    >
      {label}
    </button>
  );
}

/** 黑猫插画空态(豆瓣礼物盒/黑猫风简笔画) */
export function EmptyState({
  text,
  sub,
  icon = 'cat',
  action,
}: {
  text: string;
  sub?: string;
  icon?: 'cat' | 'gift' | 'box';
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-6">
      <svg width="88" height="72" viewBox="0 0 88 72" fill="none">
        {icon === 'cat' && (
          <g stroke={C.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M28 30 L24 14 L36 24" fill="none" />
            <path d="M60 30 L64 14 L52 24" fill="none" />
            <ellipse cx="44" cy="42" rx="22" ry="19" fill="none" />
            <circle cx="36" cy="40" r="1.5" fill={C.text} />
            <circle cx="52" cy="40" r="1.5" fill={C.text} />
            <path d="M40 48 Q44 51 48 48" fill="none" />
            <path d="M66 46 Q80 44 78 58" fill="none" />
          </g>
        )}
        {icon === 'gift' && (
          <g stroke={C.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="26" y="30" width="36" height="30" rx="2" fill="none" />
            <path d="M26 40 h36 M44 30 v30" />
            <path d="M44 30 Q34 26 36 18 Q42 16 44 28 Q46 16 52 18 Q54 26 44 30 Z" fill="none" />
            <path d="M20 24 l-4 -4 M68 24 l4 -4 M44 12 v-5" />
          </g>
        )}
        {icon === 'box' && (
          <g stroke={C.text} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 34 L44 24 L66 34 L66 56 L44 66 L22 56 Z" fill="none" />
            <path d="M22 34 L44 44 L66 34 M44 44 V66" />
          </g>
        )}
      </svg>
      <div className="mt-4 text-sm" style={{ color: C.sub }}>{text}</div>
      {sub && <div className="mt-1 text-xs" style={{ color: '#B9BEC6' }}>{sub}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** 列表尾部「THE END」 */
export function TheEnd() {
  return (
    <div className="flex items-center gap-3 py-5 px-10">
      <div className="flex-1 h-px" style={{ background: C.border }} />
      <span className="text-[10px] tracking-widest" style={{ color: '#C3C9D1' }}>THE END</span>
      <div className="flex-1 h-px" style={{ background: C.border }} />
    </div>
  );
}

/**
 * 时间 + 属地的一行灰字。
 * 默认(相对)模式:「4天前 · 辽宁」(裸地名,无「IP属地」前缀);
 * absolute=true:「2026-06-17 08:33 辽宁」(绝对时间 + 空格 + 裸地名,无「·」)。
 */
export function MetaLine({
  time,
  ip,
  extra,
  absolute,
}: {
  time?: string;
  ip?: string;
  extra?: string;
  /** true → 绝对时间模式:time 与 ip 以空格拼接(time 传 fmtAbsDateTime(ts) 结果) */
  absolute?: boolean;
}) {
  const main = absolute ? [time, ip].filter(Boolean).join(' ') : undefined;
  const parts = absolute ? [main, extra] : [time, ip, extra];
  return (
    <span className="text-[11px]" style={{ color: '#B9BEC6' }}>
      {parts.filter(Boolean).join(' · ')}
    </span>
  );
}

/**
 * 标记按钮(想看/想读/想听):竖排 —— 橙色 ♡+ 图标叠橙色文字;
 * marked=true → 灰色 ✓ 叠灰色已标记文案(markedLabel,如「已想看」)。
 * bind 为页面侧已绑定 props,整体 spread 到 button。
 */
export function MarkBtn({
  label,
  marked,
  markedLabel,
  bind,
  size = 'md',
}: {
  label: string;
  marked?: boolean;
  markedLabel?: string;
  bind?: object;
  size?: 'sm' | 'md';
}) {
  const iconSize = size === 'sm' ? 18 : 22;
  const fg = marked ? C.sub : C.orange;
  return (
    <button
      {...(bind ?? {})}
      className="flex flex-col items-center justify-center gap-0.5 bg-transparent border-none cursor-pointer px-1 shrink-0"
      style={{ color: fg }}
    >
      {marked ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path d="M5 12.5 L10 17.5 L19 7.5" stroke={fg} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" className="shrink-0">
          <path
            d="M12 20.5 C7.5 17 4 13.8 4 10.2 C4 7.6 6 5.7 8.4 5.7 C10 5.7 11.3 6.6 12 7.9 C12.7 6.6 14 5.7 15.6 5.7 C16.1 5.7 16.6 5.8 17 6"
            stroke={fg}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19 3 v6 M16 6 h6" stroke={fg} strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      )}
      <span className={size === 'sm' ? 'text-[10px]' : 'text-[11px]'}>
        {marked ? (markedLabel ?? label) : label}
      </span>
    </button>
  );
}

/**
 * 分段控件(真实豆瓣 热门|最新|友邻 样式):灰轨道容器,选中项 = 白底描边胶囊。
 * onChange 或 bindFor(页面侧按值生成已绑定 props)二选一;bindFor 优先。
 */
export function SegRow({
  options,
  value,
  onChange,
  bindFor,
  size = 'md',
  className = '',
}: {
  options: readonly string[];
  value: string;
  onChange?: (v: string) => void;
  bindFor?: (v: string) => object;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <div
      className={`inline-flex items-center rounded-lg p-0.5 ${className}`}
      style={{ background: '#F2F3F5' }}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            onClick={!bindFor && onChange ? () => onChange(opt) : undefined}
            {...(bindFor ? bindFor(opt) : {})}
            className={`${size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'} rounded-md cursor-pointer shrink-0`}
            style={
              active
                ? { background: C.surface, border: `1px solid ${C.border}`, color: C.text, fontWeight: 600 }
                : { background: 'transparent', border: '1px solid transparent', color: C.sub }
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

import React, { useCallback, useRef, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcVerified } from '../res/icons';

export function useStrings() {
  return useAppStrings(strings, stringsEn);
}

/* ---------------- Toast ---------------- */
export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMsg(null), 1600);
  }, []);
  const node = msg ? (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/80 text-white text-[14px] px-5 py-3 rounded-lg pointer-events-none whitespace-nowrap max-w-[80%] text-center ring-1 ring-white/25 shadow-lg">
      {msg}
    </div>
  ) : null;
  return [node, show];
}

/* ---------------- 图片(SVG占位回落) ---------------- */
const FALLBACK = (label: string, hue: number) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="hsl(${hue},45%,88%)"/><ellipse cx="42" cy="58" rx="20" ry="15" fill="none" stroke="hsl(${hue},55%,60%)" stroke-width="4"/><circle cx="42" cy="58" r="6" fill="hsl(${hue},55%,60%)"/><text x="50" y="30" font-size="16" text-anchor="middle" fill="hsl(${hue},45%,45%)">${label}</text></svg>`,
  )}`;

export function Img({
  src, alt = '', className = '', label = '微博', style,
}: {
  src?: string;
  alt?: string;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
}) {
  const hue = (label.charCodeAt(0) * 37) % 360;
  return (
    <img
      src={src || FALLBACK(label, hue)}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      onError={(e) => {
        (e.target as HTMLImageElement).src = FALLBACK(label, hue);
      }}
    />
  );
}

/* ---------------- 认证/会员标 ---------------- */
export function VBadge({ type }: { type?: 'person' | 'org' }) {
  if (!type) return null;
  return (
    <IcVerified
      size={14}
      className={type === 'person' ? 'text-[#FF8200] shrink-0' : 'text-[#4B9DE5] shrink-0'}
      fill={type === 'person' ? '#FF8200' : '#4B9DE5'}
      stroke="#fff"
    />
  );
}

export function VipCrown({ level }: { level?: number }) {
  if (!level) return null;
  return (
    <span className="inline-flex items-center gap-0.5 bg-gradient-to-r from-[#FFD766] to-[#FFB300] text-[#7A4A00] text-[9px] font-bold rounded px-1 leading-[14px] shrink-0">
      👑{'ⅠⅡⅢⅣⅤⅥ'[Math.min(level, 6) - 1]}
    </span>
  );
}

/* ---------------- 数字格式 ---------------- */
export function fmtCount(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1).replace(/\.0$/, '')}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万`;
  return String(n);
}

/* ---------------- 空态 ---------------- */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div className="w-20 h-20 rounded-full opacity-60 bg-gradient-to-br from-[#FFE3C2] to-[#FF9E4D]" />
      <div className="text-[14px] text-[#7F7F7F]">{text}</div>
      {hint && <div className="text-[12px] text-[#BBBBBB]">{hint}</div>}
    </div>
  );
}

/* ---------------- TopBar ---------------- */
export function TopBar({
  title, backBinding, right, center, transparent,
}: {
  title?: React.ReactNode;
  backBinding?: object;
  right?: React.ReactNode;
  center?: React.ReactNode;
  transparent?: boolean;
}) {
  return (
    <div
      className={`flex items-center h-11 shrink-0 px-2 ${transparent ? '' : 'bg-white border-b border-[#F2F2F2]'}`}
    >
      <div className="w-12 flex items-center">
        {backBinding && (
          <button
            {...backBinding}
            className="p-1 -ml-1 border-none bg-transparent cursor-pointer text-[#1A1A1A]"
          >
            <IcBack size={24} />
          </button>
        )}
      </div>
      <div className="flex-1 text-center font-semibold text-[16px] text-[#1A1A1A] truncate">
        {center ?? title}
      </div>
      <div className="w-12 flex justify-end items-center gap-2">{right}</div>
    </div>
  );
}

/* ---------------- 底部弹层容器 ---------------- */
export function BottomSheet({
  onClose, children, closeBinding,
}: {
  onClose: () => void;
  children: React.ReactNode;
  closeBinding?: object;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        {...(closeBinding ?? { onClick: onClose })}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative bg-white rounded-t-2xl overflow-hidden">
        <div className="w-9 h-1 rounded bg-[#E5E5E5] mx-auto mt-2" />
        {children}
      </div>
    </div>
  );
}

/* ---------------- 居中确认弹窗 ---------------- */
export function CenterDialog({
  text, subText, leftLabel, rightLabel, leftBinding, rightBinding, onLeft, onRight,
}: {
  text: string;
  subText?: string;
  leftLabel: string;
  rightLabel: string;
  leftBinding?: object;
  rightBinding?: object;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-xl w-[280px] overflow-hidden">
        <div className="px-6 pt-6 pb-5 text-center">
          <div className="text-[16px] text-[#1A1A1A]">{text}</div>
          {subText && <div className="text-[13px] text-[#7F7F7F] mt-2 leading-relaxed">{subText}</div>}
        </div>
        <div className="flex border-t border-[#F2F2F2]">
          <button
            {...(leftBinding ?? { onClick: onLeft })}
            className="flex-1 h-11 text-[15px] text-[#7F7F7F] bg-transparent border-none border-r border-[#F2F2F2] cursor-pointer"
          >
            {leftLabel}
          </button>
          <button
            {...(rightBinding ?? { onClick: onRight })}
            className="flex-1 h-11 text-[15px] text-[#FF8200] font-semibold bg-transparent border-none cursor-pointer"
          >
            {rightLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 关注按钮态 ---------------- */
export function FollowBtn({
  followed, mutual, refollow, binding, onClick, size = 'md',
}: {
  followed?: boolean;
  mutual?: boolean;
  refollow?: boolean;
  binding?: object;
  onClick?: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
}) {
  const s = useStrings();
  const cls = size === 'sm' ? 'h-6 px-2 text-[11px]' : 'h-7 px-3 text-[12px]';
  let label = `+ ${s.follow.replace('+', '').trim() || '关注'}`;
  let style = 'text-[#FF8200] border border-[#FF8200] bg-white';
  if (mutual) { label = `⇄ ${s.mutual}`; style = 'text-[#7F7F7F] border border-[#DDDDDD] bg-white'; }
  else if (refollow) { label = `✓ ${s.refollow}`; style = 'text-[#FF8200] border border-[#FF8200] bg-white'; }
  else if (followed) { label = `✓ ${s.followed}`; style = 'text-[#7F7F7F] border border-[#DDDDDD] bg-white'; }
  return (
    <button
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      className={`${cls} ${style} rounded-full cursor-pointer shrink-0 leading-none`}
    >
      {label}
    </button>
  );
}

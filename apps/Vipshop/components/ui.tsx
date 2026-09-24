/**
 * 唯品会共享 UI 组件(形态规范见 docs/vipshop-replication/design-tokens.md)
 * 品牌玫红 #E4007F,价格 #F0148C。
 */
import React, { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack } from '../res/icons';
import { splitPrice, formatCountdown } from '../utils/format';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import * as TimeService from '@/os/TimeService';

export const VIP = {
  primary: '#E4007F',
  price: '#F0148C',
  red: '#FF2D2D',
  orange: '#FF7A00',
  gold: '#C9A063',
  ctaBlack: '#141414',
  ctaYellow: '#FFE100',
} as const;

/* ---------------- TopBar ---------------- */
export function TopBar({
  title, rightContent, transparent = false, onBack,
}: {
  title: React.ReactNode;
  rightContent?: React.ReactNode;
  transparent?: boolean;
  onBack?: () => void;
}) {
  const { bindBack } = useVipshopGestures();
  return (
    <div
      className={`flex items-center h-11 shrink-0 px-1 ${
        transparent ? '' : 'bg-white border-b border-[#EEEEEE]'
      }`}
    >
      <button
        {...bindBack(onBack ? { onTrigger: onBack } : undefined)}
        className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
        aria-label="返回"
      >
        <IcNavBack size={24} className="text-[#222222]" />
      </button>
      <div className="flex-1 text-center font-semibold text-[16px] text-[#222222] truncate">{title}</div>
      <div className="w-10 flex justify-end items-center pr-1">{rightContent}</div>
    </div>
  );
}

/* ---------------- 价格 ---------------- */
export function Price({
  value, size = 'm', className = '', label,
}: { value: number; size?: 's' | 'm' | 'l'; className?: string; label?: boolean }) {
  const { int, dec } = splitPrice(value);
  const dims = size === 'l'
    ? { sym: 'text-[13px]', int: 'text-[22px]' }
    : size === 'm'
      ? { sym: 'text-[11px]', int: 'text-[16px]' }
      : { sym: 'text-[10px]', int: 'text-[13px]' };
  return (
    <span className={`font-bold leading-none ${className}`} style={{ color: VIP.price }}>
      {label && (
        <span className="text-[9px] text-white rounded-sm px-1 py-0.5 mr-1 align-middle" style={{ background: VIP.price }}>
          特卖价
        </span>
      )}
      <span className={dims.sym}>¥</span>
      <span className={dims.int}>{int}</span>
      <span className={dims.sym}>{dec}</span>
    </span>
  );
}

/* ---------------- 折扣标签 ---------------- */
export function DiscountTag({ text }: { text: string }) {
  return (
    <span
      className="inline-block text-[10px] rounded-full px-1.5 leading-4 border"
      style={{ color: VIP.price, borderColor: VIP.price }}
    >
      {text}
    </span>
  );
}

/* ---------------- 图片(带 fallback) ---------------- */
const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FBDCEC"/><text x="50%25" y="55%25" text-anchor="middle" font-size="26" fill="%23E4007F">VIP</text></svg>';

export function Img({ src, className, alt = '', style }: { src: string; className?: string; alt?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (t.src !== FALLBACK) t.src = FALLBACK;
      }}
    />
  );
}

/* ---------------- 倒计时(时:分:秒) ---------------- */
export function Countdown({ endsAt, dark = true }: { endsAt: number; dark?: boolean }) {
  const [, force] = useState(0);
  const left = Math.max(0, endsAt - TimeService.now());
  React.useEffect(() => {
    const t = window.setInterval(() => force((n) => n + 1), 1000);
    return () => window.clearInterval(t);
  }, []);
  const parts = formatCountdown(left).split(':');
  const box = dark ? 'bg-[#141414] text-white' : 'bg-white text-[#141414]';
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px]">
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <span className={`${box} rounded px-1 py-0.5 font-mono font-semibold`}>{p}</span>
          {i < 2 && <span className={dark ? 'text-white' : 'text-[#141414]'}>:</span>}
        </React.Fragment>
      ))}
    </span>
  );
}

/* ---------------- searchParams 弹层 ---------------- */
export function usePanel(key: string = 'panel') {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key);
  const open = useCallback(
    (v: string, extra?: Record<string, string>) => {
      setSearchParams((p) => {
        p.set(key, v);
        if (extra) for (const [k2, v2] of Object.entries(extra)) p.set(k2, v2);
        return p;
      });
    },
    [key, setSearchParams],
  );
  return { value, open, searchParams };
}

/* ---------------- 底部弹层容器(遮罩点击 = 返回键关闭) ---------------- */
export function BottomSheet({
  children, onClose, title, closeBinding, heightClass = 'max-h-[82%]',
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  closeBinding?: object;
  heightClass?: string;
}) {
  return (
    <div className="absolute inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl ${heightClass} flex flex-col`}>
        {title !== undefined && (
          <div className="flex items-center justify-center relative h-12 shrink-0 border-b border-[#F5F5F5]">
            <span className="font-semibold text-[15px] text-[#222222]">{title}</span>
            <button
              {...(closeBinding ?? {})}
              onClick={onClose}
              className="absolute right-3 top-2.5 w-7 h-7 rounded-full bg-[#F5F5F5] text-[#999999] border-none cursor-pointer text-[14px]"
            >
              ✕
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto" data-scroll-container="sheet" data-scroll-direction="vertical">
          {children}
        </div>
        <div className="h-4 shrink-0" />
      </div>
    </div>
  );
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
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/70 text-white text-[14px] px-5 py-3 rounded-lg pointer-events-none whitespace-nowrap max-w-[80%] text-center">
      {msg}
    </div>
  ) : null;
  return [node, show];
}

/** 便捷:该功能暂未开放 toast 文案 */
export const NOT_OPEN = '该功能暂未开放';

/* ---------------- 空态 ---------------- */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div className="w-20 h-20 rounded-full opacity-60" style={{ background: 'linear-gradient(135deg,#FBDCEC,#FF6FA5)' }} />
      <div className="text-[14px] text-[#888888]">{text}</div>
      {hint && <div className="text-[12px] text-[#BBBBBB]">{hint}</div>}
    </div>
  );
}

/* ---------------- 数量步进器 ---------------- */
export function Stepper({
  value, onChange, max, binding,
}: {
  value: number;
  onChange: (delta: number) => void;
  max?: number;
  binding?: object;
}) {
  return (
    <span {...(binding ?? {})} className="inline-flex items-center border border-[#EEEEEE] rounded">
      <button
        className="w-7 h-6 text-[14px] text-[#666666] bg-[#FAFAFA] border-none cursor-pointer disabled:text-[#CCCCCC]"
        disabled={value <= 1}
        onClick={(e) => { e.stopPropagation(); onChange(-1); }}
      >
        −
      </button>
      <span className="w-8 text-center text-[13px] border-x border-[#EEEEEE]">{value}</span>
      <button
        className="w-7 h-6 text-[14px] text-[#666666] bg-[#FAFAFA] border-none cursor-pointer disabled:text-[#CCCCCC]"
        disabled={max !== undefined && value >= max}
        onClick={(e) => { e.stopPropagation(); onChange(1); }}
      >
        +
      </button>
    </span>
  );
}

/* ---------------- 主按钮 ---------------- */
export function PrimaryBtn({
  children, onClick, className = '', binding, variant = 'primary', disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  binding?: object;
  variant?: 'primary' | 'black' | 'yellow' | 'outline';
  disabled?: boolean;
}) {
  const style =
    variant === 'primary'
      ? { background: 'linear-gradient(90deg,#FF1F91,#E4007F)', color: '#fff' }
      : variant === 'black'
        ? { background: VIP.ctaBlack, color: '#fff' }
        : variant === 'yellow'
          ? { background: VIP.ctaYellow, color: '#222' }
          : { background: '#fff', color: VIP.primary, border: `1px solid ${VIP.primary}` };
  return (
    <button
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      disabled={disabled}
      style={style}
      className={`rounded-full text-[15px] font-medium px-4 py-2 cursor-pointer border-none disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- 顶部粉渐变安全区(首页/会员页) ---------------- */
export function PinkHeaderBg({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <div className={className} style={{ background: 'linear-gradient(180deg,#FBDCEC,#FFFFFF)' }}>
      {children}
    </div>
  );
}

/**
 * Taobao 共享 UI 组件(形态规范见 docs/taobao-replication/design-tokens.md)
 */
import React, { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack } from '../res/icons';
import { splitPrice } from '../utils/format';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';

/* ---------------- TopBar ---------------- */
export function TopBar({
  title, rightContent, transparent = false,
}: {
  title: React.ReactNode;
  rightContent?: React.ReactNode;
  transparent?: boolean;
}) {
  const { bindBack } = useTaobaoGestures();
  return (
    <div
      className={`flex items-center h-11 shrink-0 px-1 ${
        transparent ? '' : 'bg-white border-b border-[#EEEEEE]'
      }`}
    >
      <button
        {...bindBack()}
        className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
        aria-label="返回"
      >
        <IcNavBack size={24} className="text-[#111111]" />
      </button>
      <div className="flex-1 text-center font-semibold text-[17px] text-[#111111] truncate">
        {title}
      </div>
      <div className="w-10 flex justify-end items-center pr-1">{rightContent}</div>
    </div>
  );
}

/* ---------------- 价格 ---------------- */
export function Price({
  value, size = 'm', className = '',
}: { value: number; size?: 's' | 'm' | 'l'; className?: string }) {
  const { int, dec } = splitPrice(value);
  const dims = size === 'l'
    ? { sym: 'text-[14px]', int: 'text-[22px]' }
    : size === 'm'
      ? { sym: 'text-[11px]', int: 'text-[16px]' }
      : { sym: 'text-[10px]', int: 'text-[13px]' };
  return (
    <span className={`text-[#FF0036] font-bold leading-none ${className}`}>
      <span className={dims.sym}>¥</span>
      <span className={dims.int}>{int}</span>
      <span className={dims.sym}>{dec}</span>
    </span>
  );
}

/* ---------------- 店铺角标 ---------------- */
export function ShopBadge({ badge }: { badge: 'tmall' | 'taobao' }) {
  return badge === 'tmall' ? (
    <span className="inline-block text-[10px] text-white bg-[#FF0036] rounded px-1 leading-4 mr-1 shrink-0">天猫</span>
  ) : (
    <span className="inline-block text-[10px] text-white bg-[#FF5000] rounded px-1 leading-4 mr-1 shrink-0">淘宝</span>
  );
}

/* ---------------- 图片(带 fallback) ---------------- */
const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ECEFF1"/><text x="50%25" y="55%25" text-anchor="middle" font-size="30" fill="%23999">图</text></svg>';

export function Img({ src, className, alt = '' }: { src: string; className?: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        (e.target as HTMLImageElement).src = FALLBACK;
      }}
    />
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

/** 底部弹层容器(遮罩点击 = 返回键关闭) */
export function BottomSheet({
  children, onClose, title, closeBinding,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  /** 关闭按钮的 data-action 绑定(由调用方用 bindTap 生成) */
  closeBinding?: object;
}) {
  return (
    <div className="absolute inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl max-h-[82%] flex flex-col">
        {title !== undefined && (
          <div className="flex items-center justify-center relative h-12 shrink-0">
            <span className="font-semibold text-[15px]">{title}</span>
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
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/70 text-white text-[14px] px-5 py-3 rounded-lg pointer-events-none whitespace-nowrap">
      {msg}
    </div>
  ) : null;
  return [node, show];
}

/* ---------------- 空态 ---------------- */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD9C7] to-[#FF8A4C] opacity-60" />
      <div className="text-[14px] text-[#666666]">{text}</div>
      {hint && <div className="text-[12px] text-[#999999]">{hint}</div>}
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
  /** data-action 绑定属性,贴在容器上 */
  binding?: object;
}) {
  return (
    <span {...(binding ?? {})} className="inline-flex items-center border border-[#EEEEEE] rounded">
      <button
        className="w-6 h-6 text-[14px] text-[#666666] bg-[#FAFAFA] border-none cursor-pointer disabled:text-[#CCCCCC]"
        disabled={value <= 1}
        onClick={(e) => { e.stopPropagation(); onChange(-1); }}
      >
        −
      </button>
      <span className="w-8 text-center text-[13px] border-x border-[#EEEEEE]">{value}</span>
      <button
        className="w-6 h-6 text-[14px] text-[#666666] bg-[#FAFAFA] border-none cursor-pointer disabled:text-[#CCCCCC]"
        disabled={max !== undefined && value >= max}
        onClick={(e) => { e.stopPropagation(); onChange(1); }}
      >
        +
      </button>
    </span>
  );
}

/* ---------------- 左滑操作行(PointerEvent,符合 module-contract) ---------------- */
export function SwipeRow({
  children, actions, actionsWidth, swipeBinding,
}: {
  children: React.ReactNode;
  /** 右侧露出的按钮组 */
  actions: React.ReactNode;
  actionsWidth: number;
  /** 左滑手势的 data-action 绑定(贴容器) */
  swipeBinding?: object;
}) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const pressed = useRef(false);
  const dragging = useRef(false);

  return (
    <div {...(swipeBinding ?? {})} className="relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 flex" style={{ width: actionsWidth }}>
        {actions}
      </div>
      <div
        className="relative bg-white"
        style={{ transform: `translateX(${offset}px)`, transition: dragging.current ? 'none' : 'transform .18s' }}
        onPointerDown={(e) => {
          // 不能在这里就 setPointerCapture:立即捕获会把行内子控件
          // (勾选框/步进器/明细)的 click 全部吞掉。先记录起点,
          // 等 onPointerMove 确认水平拖动意图(>10px)再捕获。
          pressed.current = true;
          dragging.current = false;
          startX.current = e.clientX;
          startOffset.current = offset;
        }}
        onPointerMove={(e) => {
          if (!pressed.current) return;
          const dx = e.clientX - startX.current;
          if (!dragging.current) {
            if (Math.abs(dx) < 10) return;
            dragging.current = true;
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }
          setOffset(Math.min(0, Math.max(-actionsWidth, startOffset.current + dx)));
        }}
        onPointerUp={() => {
          pressed.current = false;
          if (!dragging.current) return;
          dragging.current = false;
          setOffset((o) => (o < -actionsWidth / 2 ? -actionsWidth : 0));
        }}
        onPointerCancel={() => {
          pressed.current = false;
          dragging.current = false;
          setOffset(0);
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- 主按钮 ---------------- */
export function PrimaryBtn({
  children, onClick, className = '', binding, variant = 'red', disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  binding?: object;
  variant?: 'red' | 'orange' | 'outline';
  disabled?: boolean;
}) {
  const style =
    variant === 'red'
      ? 'text-white bg-gradient-to-r from-[#FF7A00] to-[#FF4800]'
      : variant === 'orange'
        ? 'text-white bg-gradient-to-r from-[#FFB800] to-[#FF8C00]'
        : 'text-[#333333] bg-white border border-[#DDDDDD]';
  return (
    <button
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      disabled={disabled}
      className={`rounded-full text-[15px] font-medium px-4 py-2 cursor-pointer disabled:opacity-50 ${
        variant === 'outline' ? '' : 'border-none'
      } ${style} ${className}`}
    >
      {children}
    </button>
  );
}

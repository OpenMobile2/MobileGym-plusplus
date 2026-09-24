/**
 * Ctrip 共享 UI 组件。主题色携程蓝 #0086F6。
 * - 弹层态走 searchParams(usePanel),不用 useState(返回键可关,符合 module-contract)。
 * - 图片一律 Img(onError fallback);禁 emoji 占位。
 */
import React, { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { IcBack } from '../res/icons';

export const BLUE = '#0086F6';

/* ---------------- TopBar ---------------- */
export function TopBar({
  title, rightContent, transparent = false, onBack, showBack = true,
}: {
  title?: React.ReactNode;
  rightContent?: React.ReactNode;
  transparent?: boolean;
  /** 自定义返回(默认 system.back) */
  onBack?: () => void;
  /** tab 根页设 false 隐藏返回箭头 */
  showBack?: boolean;
}) {
  const { bindBack } = useCtripGestures();
  return (
    <div
      data-status-bar-foreground="dark"
      className={`flex items-center h-11 shrink-0 px-1 ${
        transparent ? '' : 'bg-white border-b border-[#EEEEEE]'
      }`}
    >
      {showBack ? (
        <button
          {...(onBack ? { onClick: onBack, 'data-trigger-type': 'back' } : bindBack())}
          className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="返回"
        >
          <IcBack size={24} className="text-[#111111]" />
        </button>
      ) : (
        <div className="w-10" />
      )}
      <div className="flex-1 text-center font-semibold text-[17px] text-[#111111] truncate">
        {title}
      </div>
      <div className="min-w-10 flex justify-end items-center pr-1 gap-2">{rightContent}</div>
    </div>
  );
}

/* ---------------- 价格 ---------------- */
export function Price({
  value, size = 'm', className = '', symbol = true,
}: { value: number; size?: 's' | 'm' | 'l'; className?: string; symbol?: boolean }) {
  const dims = size === 'l'
    ? { sym: 'text-[13px]', int: 'text-[22px]' }
    : size === 'm'
      ? { sym: 'text-[11px]', int: 'text-[17px]' }
      : { sym: 'text-[10px]', int: 'text-[13px]' };
  return (
    <span className={`text-[#FF5A2C] font-bold leading-none ${className}`}>
      {symbol && <span className={dims.sym}>¥</span>}
      <span className={dims.int}>{value}</span>
    </span>
  );
}

/* ---------------- 图片(带 fallback) ---------------- */
const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23E8EEF5"/><path d="M28 66l16-20 12 14 8-9 12 15z" fill="%23B7C7D9"/><circle cx="38" cy="36" r="7" fill="%23B7C7D9"/></svg>';

export function Img({ src, className, alt = '', style }: { src: string; className?: string; alt?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
    />
  );
}

/* ---------------- searchParams 弹层控制 ---------------- */
export function usePanel(key: string = 'panel') {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key);
  const open = useCallback(
    (v: string, extra?: Record<string, string>) => {
      setSearchParams((p) => {
        p.set(key, v);
        if (extra) for (const [k2, v2] of Object.entries(extra)) p.set(k2, v2);
        return p;
      }, { replace: false });
    },
    [key, setSearchParams],
  );
  const close = useCallback(() => {
    setSearchParams((p) => { p.delete(key); return p; }, { replace: true });
  }, [key, setSearchParams]);
  return { value, open, close, searchParams };
}

/** 读 ?state=xxx 离散态(酒店/机票/订单等多态页用) */
export function useUiState(fallback = '') {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = searchParams.get('state') ?? fallback;
  const setState = useCallback((v: string) => {
    setSearchParams((p) => {
      if (!v || v === fallback) p.delete('state'); else p.set('state', v);
      return p;
    }, { replace: true });
  }, [fallback, setSearchParams]);
  return [state, setState] as const;
}

/* ---------------- 底部弹层(遮罩点击=关闭) ---------------- */
export function BottomSheet({
  children, onClose, title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-40">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl max-h-[85%] flex flex-col">
        {title !== undefined && (
          <div className="flex items-center justify-center relative h-12 shrink-0 border-b border-[#F2F2F2]">
            <span className="font-semibold text-[15px]">{title}</span>
            <button
              onClick={onClose}
              className="absolute right-3 top-3 w-6 h-6 rounded-full bg-[#F2F4F7] text-[#999999] border-none cursor-pointer text-[13px]"
            >✕</button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto" data-scroll-container="sheet" data-scroll-direction="vertical">
          {children}
        </div>
        <div className="h-2 shrink-0" />
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
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/75 text-white text-[14px] px-5 py-3 rounded-lg pointer-events-none whitespace-nowrap max-w-[80%] text-center">
      {msg}
    </div>
  ) : null;
  return [node, show];
}

/* ---------------- 空态 ---------------- */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#CFE6FF] to-[#7FB6F0] opacity-60" />
      <div className="text-[14px] text-[#666666]">{text}</div>
      {hint && <div className="text-[12px] text-[#999999]">{hint}</div>}
    </div>
  );
}

/* ---------------- 数量步进器 ----------------
 * 传 actionId(而非 bindTap 绑定):data-action 直接贴在「+」按钮,onClick 产生 onChange(+1) 效果。
 * 这样被标记元素本身可点即变,且不出现「binding onClick 被覆盖」。 */
export function Stepper({
  value, onChange, min = 0, max, actionId,
}: {
  value: number;
  onChange: (delta: number) => void;
  min?: number;
  max?: number;
  actionId?: string;
}) {
  const atMax = max !== undefined && value >= max;
  const tag = actionId ? { 'data-action': actionId, 'data-action-type': 'tap' } : {};
  return (
    <span className="inline-flex items-center">
      <button
        className="w-6 h-6 rounded-full text-[16px] text-[#666666] bg-[#F2F4F7] border-none cursor-pointer disabled:opacity-40 leading-none"
        disabled={value <= min}
        onClick={(e) => { e.stopPropagation(); onChange(-1); }}
      >−</button>
      <span className="w-8 text-center text-[14px]">{value}</span>
      <button
        {...tag}
        className="w-6 h-6 rounded-full text-[16px] text-white bg-[#0086F6] border-none cursor-pointer disabled:opacity-40 leading-none"
        disabled={atMax}
        onClick={(e) => { e.stopPropagation(); onChange(1); }}
      >+</button>
    </span>
  );
}

/* ---------------- 主按钮 ---------------- */
export function PrimaryBtn({
  children, onClick, className = '', binding, disabled, variant = 'blue',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  binding?: object;
  disabled?: boolean;
  variant?: 'blue' | 'orange' | 'outline';
}) {
  const style = variant === 'orange'
    ? 'text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] border-none'
    : variant === 'outline'
      ? 'text-[#0086F6] bg-white border border-[#0086F6]'
      : 'text-white bg-gradient-to-r from-[#33A5FF] to-[#0086F6] border-none';
  return (
    <button
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      disabled={disabled}
      className={`rounded-full text-[15px] font-medium px-5 py-2.5 cursor-pointer disabled:opacity-50 ${style} ${className}`}
    >
      {children}
    </button>
  );
}

/* ---------------- 分段 Tab(横向,当前项蓝色下划线) ---------------- */
export function SegTabs<T extends string>({
  tabs, active, onChange, className = '', size = 'm',
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
  size?: 's' | 'm';
}) {
  const txt = size === 's' ? 'text-[13px]' : 'text-[15px]';
  return (
    <div className={`flex ${className}`}>
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative px-3 py-2 bg-transparent border-none cursor-pointer ${txt} ${on ? 'text-[#111111] font-semibold' : 'text-[#666666]'}`}
          >
            {t.label}
            {on && <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-5 h-[3px] rounded-full bg-[#0086F6]" />}
          </button>
        );
      })}
    </div>
  );
}

/* ---------------- 开关 ----------------
 * 有 binding:onClick 已由 binding 的 onTrigger 承接(勿再写显式 onClick,否则覆盖绑定);
 * 无 binding:回退显式 onClick。 */
export function Switch({ on, onToggle, binding }: { on: boolean; onToggle: () => void; binding?: object }) {
  return (
    <button
      {...(binding ?? { onClick: onToggle })}
      className={`w-11 h-6 rounded-full relative transition-colors border-none cursor-pointer ${on ? 'bg-[#0086F6]' : 'bg-[#D8DCE3]'}`}
    >
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

/* ---------------- 列表行(左标题 右值 + 箭头) ---------------- */
export function ListRow({
  label, value, right, onClick, binding, icon,
}: {
  label: React.ReactNode;
  value?: React.ReactNode;
  right?: React.ReactNode;
  onClick?: () => void;
  binding?: object;
  icon?: React.ReactNode;
}) {
  return (
    <div
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      className={`flex items-center px-4 py-3.5 bg-white border-b border-[#F2F2F2] ${onClick || binding ? 'cursor-pointer active:bg-[#FAFAFA]' : ''}`}
    >
      {icon && <span className="mr-2.5 text-[#0086F6]">{icon}</span>}
      <span className="text-[15px] text-[#222222] flex-1">{label}</span>
      {value !== undefined && <span className="text-[13px] text-[#999999] mr-1">{value}</span>}
      {right ?? ((onClick || binding) && <span className="text-[#CCCCCC] text-[16px]">›</span>)}
    </div>
  );
}

/* ---------------- 评分星星色块(钻级) ---------------- */
export function StarLabel({ star }: { star: number }) {
  return <span className="text-[11px] text-[#FF9F45]">{'◆'.repeat(star)}</span>;
}

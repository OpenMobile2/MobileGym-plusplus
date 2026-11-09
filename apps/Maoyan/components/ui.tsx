/**
 * 猫眼共享 UI 组件(形态规范见 docs/maoyan-replication/design-tokens.md)
 * 主红 #DC4038,CTA 红 #F53E3E,想看橙 #FFA820,预售蓝 #4B9EF8。
 */
import React, { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDarkMode } from '@/os/hooks/useDarkMode';
import { IcNavBack } from '../res/icons';
import { splitPrice } from '../utils/format';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 行内 style 用的颜色 token(值走 CSS 变量,深浅由 MaoyanApp 注入,自动跟随 OS) */
export const MY = {
  primary: 'var(--app-c-primary)',
  cta: 'var(--app-c-cta)',
  ctaGradient: 'var(--app-c-cta-gradient)',
  wishOrange: 'var(--app-c-wish-orange)',
  presaleBlue: 'var(--app-c-presale-blue)',
  scoreOrange: 'var(--app-c-score-orange)',
  seatPicked: 'var(--app-c-seat-picked)',
  bg: 'var(--app-bg)',
  surface: 'var(--app-surface)',
  text: 'var(--app-text)',
  textMuted: 'var(--app-text-muted)',
  border: 'var(--app-border)',
  fill: 'var(--app-c-fill)',
  brandTint: 'var(--app-c-brand-tint)',
} as const;

/**
 * 浅底页面的状态栏前景:深色模式下页面变深底,前景必须翻成 light。
 * 沉浸页(详情/订单/票夹)本就深底,固定 "light",不用此 hook。
 */
export function useStatusBarFg(): 'dark' | 'light' {
  const { isDark } = useDarkMode();
  return isDark ? 'light' : 'dark';
}

const FALLBACK = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 96 128'><rect width='96' height='128' fill='#E8E8EA'/><ellipse cx='48' cy='64' rx='20' ry='26' fill='none' stroke='#C9C9CD' stroke-width='5'/><ellipse cx='48' cy='64' rx='7' ry='11' fill='#C9C9CD'/></svg>",
);

/* ---------------- TopBar ---------------- */
export function TopBar({
  title, rightContent, variant = 'light', bg, onBack,
}: {
  title: React.ReactNode;
  rightContent?: React.ReactNode;
  /** light=白底黑字;red=品牌红底白字;dark=沉浸深色(配 bg) */
  variant?: 'light' | 'red' | 'dark';
  bg?: string;
  onBack?: () => void;
}) {
  const { bindBack } = useMaoyanGestures();
  const cls = variant === 'light'
    ? 'bg-app-surface text-app-text border-b border-app-border'
    : variant === 'red'
      ? 'text-white'
      : 'text-white';
  const style = variant === 'red' ? { background: MY.primary } : bg ? { background: bg } : undefined;
  return (
    <div className={`flex items-center h-11 shrink-0 px-1 ${cls}`} style={style}>
      <button
        {...bindBack(onBack ? { onTrigger: onBack } : undefined)}
        className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-inherit"
        aria-label="返回"
      >
        <IcNavBack size={24} />
      </button>
      <div className="flex-1 text-center font-semibold text-[16px] truncate">{title}</div>
      <div className="w-14 flex justify-end items-center pr-1">{rightContent}</div>
    </div>
  );
}

/* ---------------- 图片(带占位回落) ---------------- */
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

/* ---------------- 评分/想看数 ---------------- */
export function Score({ value, size = 'm' }: { value: number; size?: 's' | 'm' | 'l' }) {
  const cls = size === 'l' ? 'text-[22px]' : size === 'm' ? 'text-[16px]' : 'text-[13px]';
  return <span className={`font-bold ${cls}`} style={{ color: MY.scoreOrange }}>{value.toFixed(1)}</span>;
}

export function WishCount({ value }: { value: number }) {
  const text = value >= 10000 ? `${(value / 10000).toFixed(1)}万` : String(value);
  return <span className="font-bold text-[15px]" style={{ color: MY.wishOrange }}>{text}</span>;
}

/* ---------------- 价格 ---------------- */
export function Price({ value, size = 'm', suffix }: { value: number; size?: 's' | 'm' | 'l'; suffix?: string }) {
  const { int, dec } = splitPrice(value);
  const dims = size === 'l' ? ['text-[14px]', 'text-[24px]'] : size === 'm' ? ['text-[11px]', 'text-[17px]'] : ['text-[10px]', 'text-[13px]'];
  return (
    <span className="font-semibold" style={{ color: MY.cta }}>
      <span className={dims[0]}>¥</span>
      <span className={dims[1]}>{int}{dec}</span>
      {suffix && <span className={dims[0]}>{suffix}</span>}
    </span>
  );
}

/* ---------------- chips ---------------- */
export function Chip({ text, active, onClick, binding, color = 'grey' }: {
  text: string; active?: boolean; onClick?: () => void; binding?: object;
  color?: 'grey' | 'red' | 'outline';
}) {
  const cls = active
    ? 'bg-(--app-c-brand-tint) text-[#DC4038] font-medium'
    : color === 'outline'
      ? 'bg-app-surface text-app-text-muted border border-(--app-c-border-strong)'
      : 'bg-(--app-c-fill) text-app-text-muted';
  return (
    <button
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      className={`shrink-0 rounded-md px-2.5 py-1 text-[12px] border-none cursor-pointer ${cls}`}
    >
      {text}
    </button>
  );
}

/** 服务小标签(可退票/可改签) */
export function ServiceTag({ text }: { text: string }) {
  return (
    <span className="shrink-0 text-[10px] px-1 py-px rounded border border-[#F2C7C4] text-(--app-c-brand-tint-text) bg-[#FEF7F6]">
      {text}
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
  return { value, open, searchParams, setSearchParams };
}

/* ---------------- 底部弹层(遮罩点击 = 返回关闭) ---------------- */
export function BottomSheet({
  children, onClose, title, heightClass = 'max-h-[78%]',
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  heightClass?: string;
}) {
  return (
    <div className="absolute inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute left-0 right-0 bottom-0 bg-app-surface rounded-t-2xl ${heightClass} flex flex-col`}>
        {title !== undefined && (
          <div className="flex items-center justify-center relative h-12 shrink-0 border-b border-app-border">
            <span className="font-semibold text-[15px] text-app-text">{title}</span>
            <button
              onClick={onClose}
              className="absolute right-3 top-2.5 w-7 h-7 rounded-full bg-(--app-c-fill) text-(--app-c-text-3) border-none cursor-pointer text-[14px]"
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
    <div className="absolute left-1/2 top-[62%] -translate-x-1/2 -translate-y-1/2 z-[60] bg-black/75 text-white text-[14px] px-5 py-3 rounded-lg pointer-events-none whitespace-nowrap max-w-[80%] text-center">
      {msg}
    </div>
  ) : null;
  return [node, show];
}

export const NOT_OPEN = '该功能暂未开放';

/* ---------------- 空态(Nothing 猫) ---------------- */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: MY.brandTint }}>
        <span className="text-[34px]">🐱</span>
      </div>
      <div className="text-[14px] text-app-text-muted">{text}</div>
      {hint && <div className="text-[12px] text-(--app-c-text-4)">{hint}</div>}
    </div>
  );
}

/* ---------------- 兜底页(数据缺失时也要留返回/回首页出口,禁止死页) ---------------- */
export function RecoverPage({
  title, text, hint, actionText, actionBinding,
}: {
  title: string;
  text: string;
  hint?: string;
  /** 可选的一条业务出口(如"重新选座"),没有则只给"回首页" */
  actionText?: string;
  actionBinding?: object;
}) {
  const { bindTap, bindBack } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title={title} />
      <div className="flex-1 flex flex-col items-center justify-center px-8">
        <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: MY.brandTint }}>
          <span className="text-[34px]">🐱</span>
        </div>
        <div className="text-[15px] text-app-text-muted mt-3 text-center">{text}</div>
        {hint && <div className="text-[12px] text-(--app-c-text-4) mt-1 text-center">{hint}</div>}
        <div className="flex flex-col gap-2.5 mt-6 w-full items-center">
          {actionText && (
            <button
              {...(actionBinding ?? {})}
              className="w-[70%] h-11 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
              style={{ background: MY.ctaGradient }}
            >
              {actionText}
            </button>
          )}
          <button
            {...bindBack()}
            className="w-[70%] h-11 rounded-full text-[15px] font-medium bg-app-surface border cursor-pointer"
            style={{ borderColor: MY.cta, color: MY.cta }}
          >
            {s.backPrev}
          </button>
          <button
            {...bindTap('tabbar.home-open')}
            className="w-[70%] h-10 rounded-full text-[14px] text-app-text-muted bg-transparent border-none cursor-pointer"
          >
            {s.goHome}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- 主按钮(红渐变) ---------------- */
export function PrimaryBtn({
  children, onClick, className = '', binding, variant = 'primary', disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  binding?: object;
  variant?: 'primary' | 'flat' | 'outline' | 'orange' | 'blue';
  disabled?: boolean;
}) {
  const style =
    variant === 'primary'
      ? { background: MY.ctaGradient, color: '#fff' }
      : variant === 'flat'
        ? { background: MY.cta, color: '#fff' }
        : variant === 'orange'
          ? { background: MY.wishOrange, color: '#fff' }
          : variant === 'blue'
            ? { background: MY.presaleBlue, color: '#fff' }
            : { background: '#fff', color: MY.cta, border: `1px solid ${MY.cta}` };
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

/** 列表右侧小 pill 按钮(购票/预售/想看)。
 *  用 span+role 实现:该组件常嵌在整行 button 内,button 嵌套违反 HTML 规范(走查抓获)。 */
export function PillBtn({ children, kind, binding, onClick }: {
  children: React.ReactNode; kind: 'buy' | 'presale' | 'wish' | 'wished'; binding?: object; onClick?: () => void;
}) {
  const style = kind === 'buy'
    ? { background: MY.cta, color: '#fff' }
    : kind === 'presale'
      ? { background: MY.presaleBlue, color: '#fff' }
      : kind === 'wish'
        ? { background: MY.wishOrange, color: '#fff' }
        : { background: '#F4F4F5', color: '#999999' };
  return (
    <span
      role="button"
      {...(binding ?? {})}
      {...(onClick ? { onClick } : {})}
      style={style}
      className="shrink-0 inline-block text-center rounded-full text-[13px] px-3.5 py-1 cursor-pointer font-medium select-none"
    >
      {children}
    </span>
  );
}

/* ---------------- 五星(展示 1-10 分) ---------------- */
export function Stars({ score10, size = 12 }: { score10: number; size?: number }) {
  const full = Math.round(score10 / 2);
  return (
    <span className="inline-flex" style={{ fontSize: size, lineHeight: 1 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ color: i <= full ? MY.scoreOrange : 'var(--app-c-border-strong)' }}>★</span>
      ))}
    </span>
  );
}

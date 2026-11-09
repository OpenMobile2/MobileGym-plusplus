import React, { useEffect, useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { IcNavBack } from '../res/icons';

// —— 图片带 onError 兜底 ——
const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F2F2F2"/><text x="50%25" y="55%25" text-anchor="middle" font-size="26" fill="%23BBB">图</text></svg>';

export function Img({ src, className, alt = '' }: { src: string; className?: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (t.src !== FALLBACK) t.src = FALLBACK;
      }}
    />
  );
}

// —— 顶部标题栏(返回 + 居中标题) ——
export function TopBar({
  title,
  right,
  className = '',
  foreground = 'dark',
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  foreground?: 'dark' | 'light';
}) {
  const { bindBack } = useJingdongGestures();
  const color = foreground === 'light' ? 'text-white' : 'text-[#333]';
  // 状态栏预留(pt-10)由「页面」负责一次,TopBar 自身不再加 pt-10,避免与页面的 pt-10 叠加成两倍高、
  // 头部被顶得太靠下。若页面把 pt-10 通过 className 传进来(如 InteractivePage),它落在外层 div,
  // 与内层 h-11 分层,不会触发 border-box 塌缩。
  return (
    <div className={`shrink-0 ${className}`}>
      <div className={`h-11 flex items-center px-2 ${color}`}>
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center -ml-1">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 text-center text-[17px] font-medium truncate px-1">{title}</div>
        <div className="min-w-9 flex items-center justify-end">{right}</div>
      </div>
    </div>
  );
}

// —— 价格(¥ 小号 + 主体) ——
export function PriceYuan({
  value,
  className = '',
  symbolClass = 'text-[13px]',
  strike = false,
}: {
  value: number;
  className?: string;
  symbolClass?: string;
  strike?: boolean;
}) {
  const [int, dec] = value.toFixed(2).split('.');
  if (strike) {
    return <span className={`text-[#BBB] line-through ${className}`}>¥{value % 1 === 0 ? int : value}</span>;
  }
  return (
    <span className={className}>
      <span className={symbolClass}>¥</span>
      <span className="font-bold">{int}</span>
      <span className="text-[0.8em] font-bold">.{dec}</span>
    </span>
  );
}

export function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block text-[10px] leading-[15px] px-1 rounded-sm ${className}`}>{children}</span>
  );
}

export function FufeiTag({ label = '先用后付' }: { label?: string }) {
  return (
    <span className="inline-flex items-center text-[10px] leading-[15px] px-1 rounded-sm text-[#20B010] border border-[#20B010]/40 bg-[#20B010]/5">
      {label}
    </span>
  );
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#BBB] text-sm gap-2">
      <div className="w-16 h-16 rounded-full bg-[#F0F0F0]" />
      <div>{text}</div>
    </div>
  );
}

// —— 轻量 Toast(跨页,事件驱动) ——
export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent('pdd-toast', { detail: message }));
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const handler = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 1600);
    };
    window.addEventListener('pdd-toast', handler);
    return () => {
      window.removeEventListener('pdd-toast', handler);
      if (timer) clearTimeout(timer);
    };
  }, []);
  if (!msg) return null;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      <div className="max-w-[70%] bg-black/75 text-white text-sm rounded-lg px-4 py-2.5 text-center leading-snug">
        {msg}
      </div>
    </div>
  );
}

export const wontfix = () => showToast('该功能暂未开放');

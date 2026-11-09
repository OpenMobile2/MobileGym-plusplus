import React, { useEffect, useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { IcNavBack } from '../res/icons';

// —— 图片带 onError 兜底 ——
const FALLBACK =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F0F0F0"/><text x="50%25" y="56%25" text-anchor="middle" font-size="30" fill="%23CCC">听</text></svg>';

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
  transparent = false,
}: {
  title?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  foreground?: 'dark' | 'light';
  transparent?: boolean;
}) {
  const { bindBack } = useXimalayaGestures();
  const color = foreground === 'light' ? 'text-white' : 'text-[#333]';
  const bg = transparent ? '' : 'bg-white';
  return (
    <div className={`shrink-0 h-11 flex items-center px-1 ${color} ${bg} ${className}`}>
      <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center">
        <IcNavBack size={26} />
      </button>
      <div className="flex-1 text-center text-[17px] font-medium truncate px-1">{title}</div>
      <div className="min-w-9 flex items-center justify-end pr-1">{right}</div>
    </div>
  );
}

// —— 底部弹层容器(URL 驱动:打开=push ?panel=,关闭=bindBack) ——
export function Sheet({
  children,
  title,
  onCloseNode,
  maxH = '75%',
}: {
  children: React.ReactNode;
  title?: React.ReactNode;
  onCloseNode?: React.ReactNode;
  maxH?: string;
}) {
  const { bindBack } = useXimalayaGestures();
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" {...bindBack()} />
      <div className="relative bg-white rounded-t-2xl flex flex-col" style={{ maxHeight: maxH }}>
        {title !== undefined && (
          <div className="shrink-0 flex items-center justify-center h-12 border-b border-[#F2F2F2] relative">
            <span className="text-[15px] font-medium text-[#333]">{title}</span>
            {onCloseNode}
          </div>
        )}
        <div className="overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
          {children}
        </div>
      </div>
    </div>
  );
}

// —— 圆角标签 ——
export function Tag({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-block text-[10px] leading-[15px] px-1 rounded-sm ${className}`}>{children}</span>
  );
}

// —— VIP 金标 ——
export function VipTag({ label = 'VIP' }: { label?: string }) {
  return (
    <span className="inline-flex items-center text-[10px] leading-[14px] px-1 rounded-sm text-[#7A5B2E] bg-[#F5C36B] font-medium">
      {label}
    </span>
  );
}

// —— 空态 ——
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-[#BBB] text-sm gap-3">
      <div className="w-16 h-16 rounded-full bg-[#F0F0F0]" />
      <div>{text}</div>
    </div>
  );
}

// —— 播放量/时长格式化 ——
export function formatCount(n: number): string {
  if (n >= 100000000) return `${(n / 100000000).toFixed(1)}亿`;
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`;
  return String(n);
}
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// —— 轻量 Toast(跨页,事件驱动) ——
export function showToast(message: string) {
  window.dispatchEvent(new CustomEvent('xmly-toast', { detail: message }));
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
    window.addEventListener('xmly-toast', handler);
    return () => {
      window.removeEventListener('xmly-toast', handler);
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

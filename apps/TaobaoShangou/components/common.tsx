import React, { useEffect, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { IcBack, IcStar } from '../res/icons';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useStatusBarBg, DEFAULT_STATUS_BG } from '../statusbar';

/* ---------------- Toast(铁律①:wontfix 必须给反馈) ---------------- */
const TOAST_EVENT = 'tbsg-toast';

export function showToast(msg: string) {
  window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: msg }));
}

export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onToast = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 1800);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => {
      window.removeEventListener(TOAST_EVENT, onToast);
      if (timer) clearTimeout(timer);
    };
  }, []);
  if (!msg) return null;
  return (
    <div className="absolute inset-x-0 top-1/2 flex justify-center z-50 pointer-events-none">
      <div className="bg-black/75 text-white text-sm px-4 py-2.5 rounded-lg max-w-[80%] text-center">
        {msg}
      </div>
    </div>
  );
}

/* ---------------- 图片(onError 回落 SVG 占位) ---------------- */
const FALLBACK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23F3F4F6"/><circle cx="50" cy="42" r="16" fill="%23E5E7EB"/><rect x="26" y="64" width="48" height="8" rx="4" fill="%23E5E7EB"/></svg>`;

export function AppImg({ src, className, alt }: { src: string; className?: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt ?? ''}
      loading="lazy"
      className={className}
      onError={(e) => {
        const t = e.target as HTMLImageElement;
        if (t.src !== FALLBACK) t.src = FALLBACK;
      }}
    />
  );
}

/* ---------------- 顶栏 ---------------- */
export function TopBar({
  title, right, transparent, titleLeft,
}: {
  title?: React.ReactNode; right?: React.ReactNode; transparent?: boolean; titleLeft?: boolean;
}) {
  const { bindBack } = useTbsgGestures();
  // 白色顶栏页:状态栏同步为白色,消除"灰条压白栏"的接缝(透明顶栏交由页面自定)
  useStatusBarBg(transparent ? DEFAULT_STATUS_BG : '#ffffff');
  return (
    <div className={`flex items-center h-11 px-2 shrink-0 ${transparent ? '' : 'bg-white'}`}>
      <button
        {...bindBack<HTMLButtonElement>()}
        className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
        aria-label="返回"
      >
        <IcBack size={22} className="text-[#1A1A1A]" />
      </button>
      <div className={`flex-1 ${titleLeft ? 'text-left pl-1' : 'text-center'} font-semibold text-[16px] text-[#1A1A1A] truncate`}>
        {title}
      </div>
      <div className="min-w-9 flex justify-end items-center gap-1 pr-1">{right}</div>
    </div>
  );
}

/* ---------------- 底部弹层(bottom sheet;蒙层点击=back) ---------------- */
export function Sheet({ children, maxH = '82%' }: { children: React.ReactNode; maxH?: string }) {
  const { bindBack } = useTbsgGestures();
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div {...bindBack<HTMLDivElement>()} className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-t-[20px] overflow-hidden flex flex-col"
        style={{ maxHeight: maxH }}
      >
        {children}
      </div>
    </div>
  );
}

/* ---------------- 居中确认弹窗 ---------------- */
export function CenterDialog({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl w-[76%] p-5">{children}</div>
    </div>
  );
}

/* ---------------- 星级 ---------------- */
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-[1px]">
      {[1, 2, 3, 4, 5].map((i) => (
        <IcStar
          key={i}
          size={size}
          className={i <= Math.round(value) ? 'text-[#ED6C2C]' : 'text-gray-300'}
          fill={i <= Math.round(value) ? '#ED6C2C' : 'none'}
        />
      ))}
    </span>
  );
}

/* ---------------- 价格 ---------------- */
export function Price({ value, size = 18, orig }: { value: number; size?: number; orig?: number | null }) {
  const s = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0$/, '');
  return (
    <span className="inline-flex items-baseline gap-1">
      <span className="text-[#F53F3F] font-bold">
        <span style={{ fontSize: size * 0.62 }}>¥</span>
        <span style={{ fontSize: size }}>{s}</span>
      </span>
      {orig != null && orig > value && (
        <span className="text-[#999999] line-through" style={{ fontSize: size * 0.62 }}>¥{orig}</span>
      )}
    </span>
  );
}

/* ---------------- 空状态 ---------------- */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#999999]">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🍱</div>
      <div className="mt-3 text-sm">{text}</div>
    </div>
  );
}

/* ---------------- 时间格式化 ---------------- */
export function fmtTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const now = TimeService.getDate();
  const pad = (n: number) => String(n).padStart(2, '0');
  const hm = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return hm;
  return `${d.getMonth() + 1}-${pad(d.getDate())} ${hm}`;
}

export function fmtDate(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

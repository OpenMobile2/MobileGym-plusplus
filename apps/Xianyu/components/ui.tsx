import React, { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

/** URL 驱动的面板状态(searchParams,系统返回键可关闭) */
export function usePanel(key: string = 'panel') {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key);
  const open = useCallback(
    (v: string, extra?: Record<string, string>) => {
      setSearchParams((p) => {
        p.set(key, v);
        if (extra) for (const [k2, v2] of Object.entries(extra)) p.set(k2, v2);
        return p;
      }, { replace: true });
    },
    [key, setSearchParams],
  );
  const close = useCallback(() => {
    setSearchParams((p) => { p.delete(key); return p; });
  }, [key, setSearchParams]);
  return { value, open, close, searchParams };
}

/** 底部弹层容器(遮罩点击关闭) */
export function BottomSheet({
  children, onClose, title, closeBinding,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  closeBinding?: object;
}) {
  return (
    <div className="absolute inset-0 z-40">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute left-0 right-0 bottom-0 bg-white rounded-t-2xl max-h-[82%] flex flex-col">
        {title !== undefined && (
          <div className="flex items-center justify-center relative h-12 shrink-0 border-b border-[#F2F2F2]">
            <span className="font-semibold text-[15px]">{title}</span>
            <button
              {...(closeBinding ?? {})}
              onClick={onClose}
              aria-label="关闭"
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

/** 居中 Toast */
export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMsg(null), 1600);
  }, []);
  const node = msg ? (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/75 text-white text-[14px] px-5 py-3 rounded-lg pointer-events-none whitespace-nowrap">
      {msg}
    </div>
  ) : null;
  return [node, show];
}

/** 空态 */
export function EmptyState({ text, hint }: { text: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <div className="w-20 h-20 rounded-full bg-app-primary opacity-70" />
      <div className="text-[14px] text-app-text-muted">{text}</div>
      {hint && <div className="text-[12px] text-app-text-muted">{hint}</div>}
    </div>
  );
}

/** 价格(红,¥ 小号) */
export function Price({ value, size = 15 }: { value: number; size?: number }) {
  return (
    <span className="text-(--app-c-price-red) font-bold" style={{ fontSize: size }}>
      <span style={{ fontSize: size * 0.72 }}>¥</span>{value}
    </span>
  );
}

/**
 * 美柚共享 UI 组件(取色见 docs/meiyou-replication/design-tokens.md)。
 */
import React, { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack, IcCheck } from '../res/icons';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';

/** URL 驱动的弹层开关(module-contract:对话框走 searchParams,返回键可关) */
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

export const MY = {
  primary: '#FA4B85',
  primaryDeep: '#FF548C',
  cardGradFrom: '#FE6697',
  cardGradTo: '#FF548C',
  bg: '#F2F2F4',
  periodBlock: '#FF2D6E',
  periodPredict: '#FFC9DB',
  fertile: '#E6D9FB',
  ovulation: '#9B6BF2',
  memberFrom: '#D14DDE',
  memberTo: '#302825',
  accentYellow: '#F0B000',
} as const;

export const NOT_OPEN = '该功能暂未开放';
export const MODE_NOT_OPEN = '该模式暂未开放';

/* ---------------- TopBar ---------------- */
export function TopBar({
  title, rightContent, transparent = false, onBack, showBack = true,
}: {
  title?: React.ReactNode;
  rightContent?: React.ReactNode;
  transparent?: boolean;
  onBack?: () => void;
  showBack?: boolean;
}) {
  const { bindBack } = useMeiyouGestures();
  return (
    <div className={`flex items-center h-11 shrink-0 px-1 ${transparent ? '' : 'bg-white border-b border-[#EEEEEE]'}`}>
      <div className="w-10">
        {showBack && (
          <button
            {...bindBack(onBack ? { onTrigger: onBack } : undefined)}
            className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="返回"
          >
            <IcNavBack size={24} className="text-[#1A1A1A]" />
          </button>
        )}
      </div>
      <div className="flex-1 text-center font-semibold text-[16px] text-[#1A1A1A] truncate">{title}</div>
      <div className="min-w-10 flex justify-end items-center pr-2">{rightContent}</div>
    </div>
  );
}

/* ---------------- Toast ---------------- */
export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1600);
  }, []);
  const node = msg ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-black/70 text-white text-[13px] px-4 py-2.5 rounded-lg max-w-[70%] text-center">{msg}</div>
    </div>
  ) : null;
  return [node, show];
}

/** 花朵打勾 toast(记录保存后「分析已更新」) */
export function useFlowerToast(): [React.ReactNode, (msg?: string) => void] {
  const [msg, setMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((m = '分析已更新') => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1500);
  }, []);
  const node = msg ? (
    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="flex flex-col items-center bg-white/95 rounded-2xl px-6 py-4 shadow-lg">
        <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: MY.primary }}>
          <IcCheck size={28} className="text-white" />
        </div>
        <div className="mt-2 text-[13px] text-[#1A1A1A]">{msg}</div>
      </div>
    </div>
  ) : null;
  return [node, show];
}

/* ---------------- 图片(onError 兜底) ---------------- */
const FALLBACK = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23FFD9E6"/><circle cx="50" cy="50" r="24" fill="%23FA4B85"/></svg>`;

export function Img({ src, className = '', alt = '' }: { src: string; className?: string; alt?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK; }}
    />
  );
}

export function Avatar({ src, size = 40, className = '' }: { src: string; size?: number; className?: string }) {
  return (
    <Img src={src} className={`rounded-full object-cover shrink-0 ${className}`} alt="" />
  );
}

/* ---------------- 开关 ---------------- */
export function Switch({ on, bind }: { on: boolean; bind: object }) {
  return (
    <button
      {...bind}
      className="w-11 h-6.5 min-h-6 rounded-full relative border-none cursor-pointer transition-colors shrink-0"
      style={{ background: on ? MY.primary : '#DDDDDD', height: 26 }}
      aria-pressed={on}
    >
      <span
        className="absolute top-0.5 w-5.5 h-5.5 rounded-full bg-white shadow transition-all"
        style={{ width: 22, height: 22, left: on ? 20 : 2 }}
      />
    </button>
  );
}

/* ---------------- 底部弹层容器 ---------------- */
export function BottomSheet({
  title, onCancel, onConfirm, children, cancelBind, confirmBind,
}: {
  title: string;
  onCancel?: () => void;
  onConfirm?: () => void;
  children: React.ReactNode;
  cancelBind: object;
  confirmBind: object;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-t-2xl max-h-[75%] flex flex-col">
        <div className="flex items-center justify-between px-4 h-12 shrink-0">
          <button {...cancelBind} className="text-[14px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
          <div className="text-[15px] font-semibold text-[#1A1A1A]">{title}</div>
          <button {...confirmBind} className="text-[14px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: MY.primary }}>确定</button>
        </div>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </div>
    </div>
  );
}

/** 天数/日期滚轮(简化:上下点选列表,选中高亮) */
export function WheelPicker({
  options, value, onPick, bindFor,
}: {
  options: string[];
  value: string;
  onPick?: (v: string) => void;
  bindFor: (v: string) => object;
}) {
  return (
    <div className="flex flex-col items-center py-2 max-h-56 overflow-y-auto" data-scroll-container="wheel" data-scroll-direction="vertical">
      {options.map((o) => (
        <button
          key={o}
          {...bindFor(o)}
          className={`w-full py-2.5 text-center border-none cursor-pointer rounded-lg ${
            o === value ? 'bg-[#F7F7F9] text-[20px] font-semibold text-[#1A1A1A]' : 'bg-transparent text-[15px] text-[#999]'
          }`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

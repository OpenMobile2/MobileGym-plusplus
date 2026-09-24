import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { IcBack, IcStar } from '../res/icons';
import type { FanqieBook } from '../types';

export function useFanqieStrings() {
  return useAppStrings(strings, stringsEn);
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
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const node = msg ? (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      <div className="bg-black/75 text-white text-[13px] px-4 py-2 rounded-lg max-w-60 text-center">{msg}</div>
    </div>
  ) : null;
  return [node, show];
}

/** 铁律①:wontfix 元素点击统一 toast「该功能暂未开放」 */
export function useNotOpenToast(): [React.ReactNode, () => void] {
  const s = useFanqieStrings();
  const [node, show] = useToast();
  const showNotOpen = useCallback(() => show(s.notOpen), [show, s.notOpen]);
  return [node, showNotOpen];
}

/* ---------------- TopBar ---------------- */
export function TopBar({ title, right, transparent }: { title?: React.ReactNode; right?: React.ReactNode; transparent?: boolean }) {
  const { bindBack } = useFanqieGestures();
  return (
    <div className={`flex items-center h-11 px-1 shrink-0 ${transparent ? '' : 'bg-(--app-c-bg-card) border-b border-(--app-c-divider)'}`}>
      <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
        <IcBack size={22} className="text-(--app-c-text-primary)" />
      </button>
      <div className="flex-1 text-center text-[16px] font-semibold text-(--app-c-text-primary) truncate">{title}</div>
      <div className="w-10 flex items-center justify-center">{right}</div>
    </div>
  );
}

/* ---------------- 书封 ---------------- */
export function BookCover({ book, className }: { book: FanqieBook; className?: string }) {
  return (
    <img
      src={book.cover.startsWith('/@app-assets') ? book.cover : book.cover}
      alt={book.title}
      className={`object-cover rounded-md bg-(--app-c-bg-fill) ${className ?? ''}`}
      onError={(e) => {
        (e.target as HTMLImageElement).src =
          'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160"%3E%3Crect width="120" height="160" fill="%23D8D8D8"/%3E%3C/svg%3E';
      }}
    />
  );
}

/* ---------------- 头像(带 onError 回落) ---------------- */
const AVATAR_FALLBACK =
  'data:image/svg+xml;utf8,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"%3E%3Crect width="48" height="48" fill="%23E3E3E3"/%3E%3Ccircle cx="24" cy="19" r="8" fill="%23BFBFBF"/%3E%3Cpath d="M8 44c0-9 8-14 16-14s16 5 16 14z" fill="%23BFBFBF"/%3E%3C/svg%3E';
export function Avatar({ src, className }: { src?: string; className?: string }) {
  return (
    <img
      src={src || AVATAR_FALLBACK}
      alt=""
      className={`rounded-full bg-(--app-c-bg-fill) object-cover ${className ?? ''}`}
      onError={(e) => { (e.target as HTMLImageElement).src = AVATAR_FALLBACK; }}
    />
  );
}

/* ---------------- 星级 ---------------- */
export function Stars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <IcStar key={i} size={size} className={i <= value ? 'text-(--app-c-brand) fill-[#FA6E3D]' : 'text-(--app-c-text-disabled)'} />
      ))}
    </span>
  );
}

/* ---------------- 徽章 ---------------- */
export function Badge({ text }: { text: string }) {
  if (!text) return null;
  const gold = text === '巅峰榜' || text === '出版';
  return (
    <span className={`text-[9px] px-1 py-px rounded-sm mr-1 align-middle ${gold ? 'bg-[#FFF3E0] text-[#B7770D] border border-[#EFD9A7]' : 'bg-(--app-c-brand-soft) text-(--app-c-brand)'}`}>
      {text === '细糠' ? '“细糠”' : text}
    </span>
  );
}

/* ---------------- 相对时间 ---------------- */
export function fmtTime(ts: number): string {
  const diff = TimeService.now() - ts;
  if (diff < 90_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`;
  if (diff < 30 * 86400_000) return `${Math.floor(diff / 86400_000)}天前`;
  const d = TimeService.fromTimestamp(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/* ---------------- 确认弹窗 ---------------- */
export function ConfirmDialog({
  title, body, cancelText, confirmText, confirmDanger, onCancel, onConfirm, cancelBinding, confirmBinding,
}: {
  title: string; body?: string; cancelText: string; confirmText: string; confirmDanger?: boolean;
  onCancel: () => void; onConfirm: () => void;
  cancelBinding?: object; confirmBinding?: object;
}) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/45" onClick={onCancel} />
      <div className="relative bg-(--app-c-bg-card) rounded-2xl w-72 px-5 pt-5 pb-2 z-10">
        <div className="text-[16px] font-semibold text-center text-(--app-c-text-primary)">{title}</div>
        {body && <div className="text-[12px] text-(--app-c-text-secondary) mt-2 text-center leading-5">{body}</div>}
        <div className="flex mt-4 border-t border-(--app-c-divider)">
          <button {...(cancelBinding ?? {})} onClick={onCancel} className="flex-1 h-11 bg-transparent border-none text-[15px] text-(--app-c-text-secondary) cursor-pointer">
            {cancelText}
          </button>
          <div className="w-px bg-(--app-c-divider)" />
          <button {...(confirmBinding ?? {})} onClick={onConfirm} className={`flex-1 h-11 bg-transparent border-none text-[15px] font-semibold cursor-pointer ${confirmDanger ? 'text-(--app-c-badge-red)' : 'text-(--app-c-brand)'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

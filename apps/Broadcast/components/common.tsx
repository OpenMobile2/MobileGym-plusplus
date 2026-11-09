// apps/Broadcast/components/common.tsx — 共享 UI 与格式化
import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useBroadcastGestures } from '../hooks/useBroadcastGestures';
import { IcBack } from '../res/icons';
import { SHOW_ARTWORK } from '../assets/artwork';
import { useBroadcastStrings, type BroadcastStrings } from '../hooks/useBroadcastStrings';
import { formatString } from '../res/localize';

// ---------- 格式化 ----------
export function fmtDuration(sec: number, s: BroadcastStrings): string {
  const m = Math.round(sec / 60);
  if (m < 60) return formatString(s.duration_minutes, { count: m });
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm
    ? formatString(s.duration_hours_minutes, { hours: h, minutes: mm })
    : formatString(s.duration_hours, { count: h });
}

export function fmtRemain(sec: number, s: BroadcastStrings): string {
  return formatString(s.remaining, { duration: fmtDuration(sec, s) });
}

export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${pad(m)}:${pad(ss)}` : `${m}:${pad(ss)}`;
}

export function fmtDate(ts: number, s: BroadcastStrings): string {
  const now = TimeService.now();
  const diff = now - ts;
  const hour = 3600_000, day = 24 * hour;
  if (diff >= 0 && diff < hour) return formatString(s.minutes_ago, { count: Math.max(1, Math.floor(diff / 60_000)) });
  if (diff >= 0 && diff < day) return formatString(s.hours_ago, { count: Math.floor(diff / hour) });
  if (diff >= 0 && diff < 3 * day) return formatString(s.days_ago, { count: Math.floor(diff / day) });
  const d = TimeService.fromTimestamp(ts);
  return formatString(s.calendar_date, { month: d.getMonth() + 1, day: d.getDate() });
}

// ---------- 节目封面(图像优先,颜色+文字作为数据回退) ----------
export const Artwork: React.FC<{ showId?: string; color: string; text?: string; size?: number; radius?: number; className?: string }> = ({
  showId, color, text, size = 56, radius = 10, className = '',
}) => {
  const src = showId ? SHOW_ARTWORK[showId] : undefined;
  const short = (text || '').slice(0, 4);
  const fontSize = Math.max(10, Math.floor(size / (short.length > 2 ? 4.2 : 2.6)));
  return (
    <div
      className={`flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{ width: size, height: size, background: color, borderRadius: radius }}
    >
      {src ? (
        <img src={src} alt="" className="h-full w-full object-cover" draggable={false} />
      ) : (
        <span className="font-bold text-white text-center leading-tight px-1" style={{ fontSize }}>{short}</span>
      )}
    </div>
  );
};

// ---------- 顶栏 ----------
export const TopBar: React.FC<{
  title?: string;
  showBack?: boolean;
  right?: React.ReactNode;
  transparent?: boolean;
}> = ({ title, showBack = true, right, transparent }) => {
  const { bindBack } = useBroadcastGestures();
  const s = useBroadcastStrings();
  return (
    <div className={`flex items-center h-11 px-2 shrink-0 ${transparent ? '' : 'bg-app-bg border-b border-app-border'}`}>
      <div className="w-20 flex items-center">
        {showBack && (
          <button
            {...bindBack()}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-black/5 active:bg-black/10"
            aria-label={s.nav_back}
          >
            <IcBack size={22} className="text-app-text" />
          </button>
        )}
      </div>
      <div className="flex-1 text-center font-semibold text-base text-app-text truncate">{title}</div>
      <div className="w-20 flex justify-end items-center gap-1">{right}</div>
    </div>
  );
};

// ---------- 大标题(主页/资料库等 Tab 顶部) ----------
export const BigTitle: React.FC<{ title: string; right?: React.ReactNode }> = ({ title, right }) => (
  <div className="flex items-end justify-between px-4 pt-3 pb-2">
    <h1 className="text-[30px] font-extrabold text-app-text leading-none">{title}</h1>
    <div className="flex items-center gap-2">{right}</div>
  </div>
);

// ---------- 区块标题(带 chevron) ----------
export const SectionHeader: React.FC<{ title: string; onMore?: React.HTMLAttributes<HTMLButtonElement> }> = ({ title, onMore }) => (
  <button {...(onMore || {})} className="flex items-center gap-1 px-4 pt-4 pb-2 w-full text-left">
    <span className="text-[21px] font-bold text-app-text">{title}</span>
    {onMore && <span className="text-app-text text-xl">›</span>}
  </button>
);

// ---------- toast(wontfix 反馈,铁律①) ----------
let toastTimer: ReturnType<typeof setTimeout> | null = null;
export function showToast(msg: string) {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('bc-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'bc-toast';
    el.style.cssText =
      'position:absolute;left:50%;bottom:140px;transform:translateX(-50%);z-index:200;' +
      'background:rgba(0,0,0,.82);color:#fff;padding:10px 16px;border-radius:14px;font-size:13px;' +
      'max-width:78%;text-align:center;pointer-events:none;transition:opacity .2s;opacity:0';
    const root = document.querySelector('[data-app-root="broadcast"]') || document.body;
    root.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { if (el) el.style.opacity = '0'; }, 1600);
}

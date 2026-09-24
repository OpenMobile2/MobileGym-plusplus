/**
 * 网易云共享 UI(形态规范见 docs/wangyiyun-replication/design-tokens.md)
 */
import React from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { WY } from '../res/colors';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { IcBack, IcPlay, IcPause, IcQueue, IcMore, IcHeart } from '../res/icons';
import { coverUrl, resolveCoverSeed } from '../assets/covers';
import type { Song } from '../types';

export { WY };

/** 封面:按 seed 生成稳定渐变占位(仅作最终回落) */
export function coverBg(seed: string): string {
  let h = 7;
  for (const ch of (seed || 'x')) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(135deg, hsl(${h},55%,58%), hsl(${(h + 40) % 360},52%,42%))`;
}

/** 封面样式:优先真实生成图,缺图时按 seed 映射到已有封面 */
export function coverStyle(seed: string): React.CSSProperties {
  const resolved = resolveCoverSeed(seed);
  const url = coverUrl(resolved);
  if (url) return { backgroundImage: `url(${url})`, backgroundSize: 'cover', backgroundPosition: 'center' };
  return { background: coverBg(seed) };
}

export function Cover({ seed, className, style, rounded = 8, children }: {
  seed: string; className?: string; style?: React.CSSProperties; rounded?: number; children?: React.ReactNode;
}) {
  return (
    <div className={className} style={{ ...coverStyle(seed), borderRadius: rounded, ...style }}>
      {children}
    </div>
  );
}

export function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/** 页面外壳:状态栏留白 + 前景色声明 */
export function Screen({ dark = false, bg, children, className }: {
  dark?: boolean; bg?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`flex flex-col h-full pt-10 ${className || ''}`} style={{ background: bg ?? WY.pageBg }}
      data-status-bar-foreground={dark ? 'light' : 'dark'}>
      {children}
    </div>
  );
}

/* ---------------- TopBar ---------------- */
export function TopBar({ title, right, dark = false, onBack, bg }: {
  title?: React.ReactNode; right?: React.ReactNode; dark?: boolean; onBack?: () => void; bg?: string;
}) {
  const { bindBack } = useWangyiyunGestures();
  return (
    <div className="flex items-center h-11 shrink-0 px-1"
      style={{ background: bg, color: dark ? '#fff' : WY.textPrimary }}>
      <button {...bindBack(onBack ? { onTrigger: onBack } : undefined)}
        className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer text-inherit" aria-label="返回">
        <IcBack size={22} />
      </button>
      <div className="flex-1 text-center font-semibold text-[16px] truncate">{title}</div>
      <div className="min-w-10 flex justify-end items-center pr-2 gap-2">{right}</div>
    </div>
  );
}

/* ---------------- Toast ---------------- */
export function useToast(): [React.ReactNode, (msg: string) => void] {
  const [msg, setMsg] = React.useState<string | null>(null);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = React.useCallback((m: string) => {
    setMsg(m);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(null), 1600);
  }, []);
  const node = msg ? createPortal(
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[9999] pointer-events-none">
      <div className="bg-black/80 text-white text-[13px] rounded-lg px-4 py-2.5 max-w-[80vw] text-center">{msg}</div>
    </div>, document.body) : null;
  return [node, show];
}

export const NOT_OPEN = '该功能暂未开放';

/* ---------------- 标签胶囊 ---------------- */
export function Tags({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <span className="inline-flex gap-1 mr-1 align-middle">
      {tags.slice(0, 3).map((t) => {
        const red = t === 'VIP' || t === '原唱';
        return (
          <span key={t} className="text-[9px] leading-[13px] px-1 rounded-sm border"
            style={{ color: red ? WY.primary : WY.textTertiary, borderColor: red ? WY.primary : '#D8D8DC' }}>{t}</span>
        );
      })}
    </span>
  );
}

/* ---------------- 歌曲行 ---------------- */
export function SongRow({ song, index, onTap, onMore, right, binding, moreBinding }: {
  song: Song;
  index?: number;
  onTap?: () => void;
  onMore?: () => void;
  right?: React.ReactNode;
  binding?: React.HTMLAttributes<HTMLDivElement>;
  moreBinding?: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const currentId = useWangyiyunStore((s) => s.currentSongId);
  const playing = currentId === song.id;
  const rowProps = binding ?? { onClick: onTap };
  const menuProps = moreBinding ?? {
    onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      onMore?.();
    },
  };
  return (
    <div {...rowProps} className="flex items-center gap-3 py-2.5" role="button">
      {index !== undefined && (
        <div className="w-6 text-center text-[15px] shrink-0" style={{ color: playing ? WY.primary : WY.textTertiary }}>{index}</div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] truncate" style={{ color: playing ? WY.primary : WY.textPrimary }}>
          {song.title}{song.sub ? <span style={{ color: WY.textTertiary }}> ({song.sub})</span> : null}
        </div>
        <div className="text-[11px] mt-0.5 truncate flex items-center" style={{ color: WY.textSecondary }}>
          <Tags tags={song.tags} />{song.artist} - {song.album}
        </div>
      </div>
      {right}
      {onMore && (
        <button {...menuProps}
          className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
          style={{ color: WY.textTertiary }} aria-label="更多"><IcMore size={20} /></button>
      )}
    </div>
  );
}

/** 打开 URL 驱动的弹层(平台合同:弹层走 searchParams) */
export function useSheets() {
  const [, setSp] = useSearchParams();
  const open = React.useCallback((key: string, val = 'open') =>
    setSp((p) => { p.set(key, val); return p; }), [setSp]);
  return { open };
}

/* ---------------- 全局迷你播放条 ---------------- */
export function MiniPlayer() {
  const { bindTap } = useWangyiyunGestures();
  const { open } = useSheets();
  const currentId = useWangyiyunStore((s) => s.currentSongId);
  const isPlaying = useWangyiyunStore((s) => s.isPlaying);
  const songs = useWangyiyunStore((s) => s.songs);
  const togglePlay = useWangyiyunStore((s) => s.togglePlay);
  const song = songs.find((x) => x.id === currentId);
  if (!song) return null;
  return (
    <div className="mx-2 mb-1.5 h-12 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.08)] flex items-center pl-1.5 pr-3 gap-2"
      {...bindTap('miniplayer.player-open')} role="button">
      <div className="w-9 h-9 rounded-full shrink-0" style={coverStyle(song.seed)} />
      <div className="flex-1 min-w-0 text-[12px] truncate" style={{ color: WY.textPrimary }}>
        {song.title} <span style={{ color: WY.textSecondary }}>- {song.artist}</span>
      </div>
      <button {...bindTap({ kind: 'action', id: 'player.play.toggle' }, {
        stopPropagation: true,
        onTrigger: togglePlay,
      })}
        className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0" style={{ color: WY.textPrimary }} aria-label="播放/暂停">
        {isPlaying ? <IcPause size={22} /> : <IcPlay size={22} />}
      </button>
      <button {...bindTap({ kind: 'action', id: 'queue.sheet.open' }, {
        stopPropagation: true,
        onTrigger: () => open('queue'),
      })}
        className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0" style={{ color: WY.textPrimary }} aria-label="播放列表">
        <IcQueue size={20} />
      </button>
    </div>
  );
}

/* ---------------- 底部弹层 ---------------- */
export function Sheet({ open, onClose, children, height, closeBinding }: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: string | number;
  closeBinding?: React.HTMLAttributes<HTMLDivElement>;
}) {
  if (!open) return null;
  const backdropProps = closeBinding ?? { onClick: onClose };
  return createPortal(
    <div {...backdropProps} className="fixed inset-0 z-[500] flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-t-2xl overflow-hidden animate-[slideup_.2s_ease]" style={{ maxHeight: height || '70%' }}
        onClick={(e) => e.stopPropagation()}>
        <div className="w-9 h-1 rounded-full bg-[#E0E0E4] mx-auto my-2" />
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 20px)' }}>{children}</div>
      </div>
    </div>, document.body);
}

/* ---------------- 居中确认对话框 ---------------- */
export function ConfirmDialog({ open, title, options, onClose }: {
  open: boolean; title: string; options: { label: string; danger?: boolean; onTap: () => void }[]; onClose: () => void;
}) {
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative bg-white rounded-2xl w-[76%] max-w-[300px] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="text-center text-[15px] font-medium py-4 px-4" style={{ color: WY.textPrimary }}>{title}</div>
        {options.map((o, i) => (
          <button key={i} onClick={() => { o.onTap(); onClose(); }}
            className="w-full py-3.5 text-[15px] bg-transparent border-t border-[#F0F0F2] cursor-pointer"
            style={{ color: o.danger ? WY.primary : WY.textPrimary }}>{o.label}</button>
        ))}
      </div>
    </div>, document.body);
}

export function HeartBtn({ liked, size = 24 }: { liked: boolean; size?: number }) {
  return <IcHeart size={size} fill={liked ? WY.primary : 'none'} style={{ color: liked ? WY.primary : 'currentColor' }} />;
}

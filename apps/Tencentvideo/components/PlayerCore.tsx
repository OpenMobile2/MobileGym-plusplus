// apps/Tencentvideo/components/PlayerCore.tsx —— 播放器核心:剧照流模拟画面 + 渐变遮罩 +
// 弹幕层 + 进度条 + 控件插槽。竖屏(16:9 顶部)/ 横屏全屏 两形态。
// 画面用 SimulatedStreamStill(同图放大裁切+降清晰度)随进度换「帧」;
// 播放推进走 hooks/usePlaybackTicker;控件按钮由页面以字面量绑定后塞入插槽。
import type { BindProps } from './ui';
import React, { useEffect, useRef, useState } from 'react';
import { TV_COLORS as C } from '../constants';
import { TvImg } from './Img';
import { SimulatedStreamStill } from './SimulatedStreamStill';
import { DanmakuLayer } from './DanmakuLayer';
import { useTencentvideoStore } from '../state';
import { beginPlaybackScrub, endPlaybackScrub } from '../hooks/playbackScrub';
import { IcPlay } from '../res/icons';

/** mm:ss / h:mm:ss */
export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  const mm = String(m).padStart(2, '0');
  const rr = String(r).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${rr}` : `${mm}:${rr}`;
}

/* ---------- 进度条 ---------- */

export interface ProgressBarProps {
  /** 拖动/点按落点回调(页面接 store.seekPlayback) */
  onSeek?: (positionSec: number) => void;
  /** 打点属性(data-action 等,页面传入) */
  dataProps?: BindProps;
  /** 粗形态(全屏拖动时) */
  thick?: boolean;
  className?: string;
}

/** 超过这个位移(px)才算「拖」,以内视为轻点 */
const DRAG_SLOP_PX = 3;

/**
 * 屏幕坐标 → 进度百分比(0~1)。
 * 竖屏沿 rect 横轴;横屏舞台是 rotate(90deg),条的本地 +X 落在屏幕 +Y 上,AABB 长短边对调,
 * 所以改沿纵轴取比例。两路都用 rect 自身尺寸归一,祖先若有缩放也不会算歪。
 */
function pctFromClient(el: HTMLDivElement, clientX: number, clientY: number): number {
  const rect = el.getBoundingClientRect();
  const rotated = Boolean(el.closest('.tv-landscape-stage')) && rect.height > rect.width;
  const pct = rotated
    ? rect.height > 0
      ? (clientY - rect.top) / rect.height
      : 0
    : rect.width > 0
      ? (clientX - rect.left) / rect.width
      : 0;
  return Math.max(0, Math.min(1, pct));
}

/**
 * 进度条:已播段 primarySoft / 未播段 progressRest。
 * PointerEvent 拖动 + 本地 scrub 态(拖动时立刻跟手,不甩 store 渲染节奏);
 * dataProps(bindTap)只保留打点/click 走查,不覆盖拖动手势。
 *
 * 拖动期间只冻结推进定时器(playbackScrub),不动 playback.playing ——
 * 一改 playing,竖屏播放器就会插入贴片广告浮层,pointer capture 当场作废,
 * 手指还按着却已经收不到 pointermove(表现:刚进播放页第一次拖不动)。
 */
export function ProgressBar({ onSeek, dataProps, thick = false, className }: ProgressBarProps) {
  const positionSec = useTencentvideoStore((s) => s.playback.positionSec);
  const durationSec = useTencentvideoStore((s) => s.playback.durationSec);
  const barRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [scrubSec, setScrubSec] = useState<number | null>(null);

  // 拖到一半组件被卸载(切全屏/退出播放页)时别把 scrub 计数漏在里面
  useEffect(
    () => () => {
      if (draggingRef.current) {
        draggingRef.current = false;
        endPlaybackScrub();
      }
    },
    [],
  );

  // 落点一律按 client 坐标反算:pointer capture 期间 event.target 会变成条自身以外的节点,
  // offsetX 就不再是条上的偏移;client 坐标对真实手指和合成事件都成立。
  const seekToEvent = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = barRef.current;
    if (!el || !onSeek || durationSec <= 0) return;
    const sec = pctFromClient(el, e.clientX, e.clientY) * durationSec;
    setScrubSec(sec);
    onSeek(sec);
  };

  const stopDragging = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    endPlaybackScrub();
    setScrubSec(null);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    // 不 preventDefault:那会连 click 一起吞掉,轻点进度条的动作(打点/进播放页)就没了。
    // 横向滚动/选区由 touch-none + select-none 挡住。
    e.stopPropagation();
    if (!draggingRef.current) {
      draggingRef.current = true;
      beginPlaybackScrub();
    }
    movedRef.current = false;
    startRef.current = { x: e.clientX, y: e.clientY };
    // capture 让手指滑出条子(甚至滑出画面)也继续收 move,和真机一致
    try {
      barRef.current?.setPointerCapture(e.pointerId);
    } catch {
      // 某些环境不支持 capture:退化成条内拖动,坐标反算仍然有效
    }
    seekToEvent(e);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current || !onSeek) return;
    // 手指按下时的几像素抖动不算拖,否则轻点会被当成拖而吞掉 click
    const start = startRef.current;
    if (start && Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > DRAG_SLOP_PX) {
      movedRef.current = true;
    }
    seekToEvent(e);
  };
  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    if (movedRef.current) seekToEvent(e);
    stopDragging();
  };

  // bindTap 的 onClick 给走查器点按;真实拖完会产生 click,拖过则吞掉避免二次 seek
  const {
    onClick: dataOnClick,
    onPointerDown: _dropPointerDown,
    onPointerMove: _dropPointerMove,
    onPointerUp: _dropPointerUp,
    onPointerCancel: _dropPointerCancel,
    ...dataRest
  } = (dataProps ?? {}) as BindProps & {
    onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp?: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel?: (e: React.PointerEvent<HTMLDivElement>) => void;
  };

  const displaySec = scrubSec ?? positionSec;
  const pct = durationSec > 0 ? (displaySec / durationSec) * 100 : 0;
  return (
    <div
      ref={barRef}
      className={`relative w-full touch-none select-none flex items-center ${
        thick ? 'h-6' : 'h-5'
      } ${className ?? ''}`}
      {...dataRest}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
      // 指针已抬起才收尾:capture 若被系统收走而手指还按着,保留拖动态继续接坐标
      onLostPointerCapture={(e) => {
        if (e.buttons === 0) stopDragging();
      }}
      onClick={(e) => {
        if (movedRef.current) {
          movedRef.current = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        dataOnClick?.(e);
      }}
    >
      <div
        className={`w-full rounded-full overflow-hidden pointer-events-none ${thick ? 'h-[4px]' : 'h-[3px]'}`}
        style={{ background: C.progressRest }}
      >
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.primarySoft }} />
      </div>
      <div
        className={`absolute rounded-full bg-white shadow pointer-events-none ${
          scrubSec !== null || thick ? 'w-3.5 h-3.5' : 'w-3 h-3'
        }`}
        style={{ left: `calc(${pct}% - ${scrubSec !== null || thick ? 7 : 6}px)` }}
      />
    </div>
  );
}

/* ---------- 播放器核心 ---------- */

export interface PlayerCoreProps {
  orientation?: 'portrait' | 'landscape';
  /** 画面剧照引用(缺省用当前播放内容的 still) */
  stillId?: string;
  /** 顶部控件插槽(返回/标题/投屏…,页面自带绑定) */
  topSlot?: React.ReactNode;
  /** 底部控件插槽(播放/进度/弹幕/全屏…) */
  bottomSlot?: React.ReactNode;
  /** 中央插槽(暂停大播放键/贴片广告/锁屏 icon) */
  centerSlot?: React.ReactNode;
  /** 右侧插槽(竖屏流互动栏/全屏锁屏键) */
  rightSlot?: React.ReactNode;
  /** 画面区点按绑定(controls.toggle / play.toggle,页面字面量绑定) */
  surfaceBind?: BindProps;
  /** 是否渲染弹幕层 */
  danmaku?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function PlayerCore({
  orientation = 'portrait',
  stillId,
  topSlot,
  bottomSlot,
  centerSlot,
  rightSlot,
  surfaceBind,
  danmaku = true,
  className,
  children,
}: PlayerCoreProps) {
  const contentId = useTencentvideoStore((s) => s.playback.contentId);
  const playing = useTencentvideoStore((s) => s.playback.playing);
  const audioMode = useTencentvideoStore((s) => s.playback.audioMode);
  const contents = useTencentvideoStore((s) => s.contents);
  const content = contentId !== null ? contents.find((c) => c.id === contentId) : undefined;
  // 只有热门内容配了 16:9 剧照,其余回落竖版海报裁切(object-cover)。
  const still = stillId ?? content?.still ?? content?.poster;

  return (
    <div
      className={`relative overflow-hidden shrink-0 ${
        orientation === 'portrait' ? 'w-full aspect-video' : 'w-full h-full'
      } ${className ?? ''}`}
      style={{ background: C.darkBg }}
    >
      {/* 画面:静态剧照;音频模式 = 黑胶盘 UI */}
      <div className="absolute inset-0" {...(surfaceBind ?? {})}>
        {audioMode ? (
          /* 音频播放模式:剧照虚化压暗当底 + 中央黑胶盘(证据 821) */
          <div className="relative w-full h-full">
            <TvImg
              id={still}
              alt={content?.title}
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(14px) brightness(0.45)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="relative rounded-full flex items-center justify-center"
                style={{
                  width: '48%',
                  aspectRatio: '1',
                  background: 'radial-gradient(circle, #202020 0%, #0C0C0C 72%)',
                  boxShadow: '0 0 0 6px rgba(255,255,255,0.06)',
                }}
              >
                <div className="w-1/2 h-1/2 rounded-full overflow-hidden">
                  <TvImg id={content?.poster} alt={content?.title} className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <SimulatedStreamStill stillId={still} alt={content?.title} />
        )}
        {/* 上下渐变遮罩 */}
        <div
          className="absolute inset-x-0 top-0 h-14 pointer-events-none"
          style={{ background: `linear-gradient(to bottom, ${C.playerMask}, transparent)` }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${C.playerMask}, transparent)` }}
        />
      </div>

      {danmaku && !audioMode && <DanmakuLayer />}

      {/* 暂停默认中央标识(centerSlot 覆写时不渲染) */}
      {!playing && !centerSlot && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center text-white">
            <IcPlay size={26} />
          </div>
        </div>
      )}
      {centerSlot && (
        <div className="absolute inset-0 flex items-center justify-center">{centerSlot}</div>
      )}

      {topSlot && <div className="absolute inset-x-0 top-0 z-10">{topSlot}</div>}
      {rightSlot && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">{rightSlot}</div>
      )}
      {bottomSlot && <div className="absolute inset-x-0 bottom-0 z-10">{bottomSlot}</div>}
      {children}
    </div>
  );
}

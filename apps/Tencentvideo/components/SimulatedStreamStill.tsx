// apps/Tencentvideo/components/SimulatedStreamStill.tsx —— 用同一张剧照的放大裁切 +
// 降清晰度,模拟视频流随 progress 推进。不生成新图:按 positionSec 切「帧」,每帧换
// object-position / scale / 轻微 blur,拖进度条时画面会跟着跳。
import React, { useMemo } from 'react';
import { TvImg } from './Img';
import { useTencentvideoStore } from '../state';

/** 播放时间每推进多少秒换一帧(拖进度时也会按这个粒度跳切) */
const FRAME_SEC = 0.5;
/** 放大下限 / 上限 —— 越大越「推近」,同时像素更糊 */
const SCALE_MIN = 1.18;
const SCALE_MAX = 1.72;

function hashKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 由 content + 帧号算出稳定的取景窗(同进度永远同一画面)。 */
export function streamFrameOf(
  contentKey: string,
  positionSec: number,
): { scale: number; posX: number; posY: number; blurPx: number; contrast: number } {
  const frame = Math.max(0, Math.floor(Math.max(0, positionSec) / FRAME_SEC));
  const h = hashKey(`${contentKey}|f${frame}`);
  const h2 = hashKey(`${contentKey}|p${frame}`);
  const scale = SCALE_MIN + ((h % 1000) / 1000) * (SCALE_MAX - SCALE_MIN);
  // 取景中心落在 18%~82%,避免放大后露边
  const posX = 18 + ((h >> 3) % 640) / 10;
  const posY = 18 + ((h2 >> 5) % 640) / 10;
  // 放大越多越糊,再叠一点帧噪声,像码流降清晰度
  const zoomBlur = (scale - SCALE_MIN) * 0.55;
  const blurPx = 0.25 + zoomBlur + ((h2 >> 11) % 20) / 100;
  const contrast = 1.04 + ((h >> 17) % 8) / 100;
  return { scale, posX, posY, blurPx, contrast };
}

export interface SimulatedStreamStillProps {
  stillId?: string | null;
  alt?: string;
  className?: string;
  /** 额外滤镜(如付费锁亮度),叠在流模拟之后 */
  extraFilter?: string;
  /** 不跟 store 进度时可由外部传入(短剧锁屏页等) */
  positionSec?: number;
  contentKey?: string;
}

/**
 * 播放画面:同一 still 按进度换取景。硬切换帧(无 CSS 过渡),拖进度跟手更快。
 */
export function SimulatedStreamStill({
  stillId,
  alt,
  className,
  extraFilter,
  positionSec: positionOverride,
  contentKey: contentKeyOverride,
}: SimulatedStreamStillProps) {
  const storePos = useTencentvideoStore((s) => s.playback.positionSec);
  const contentId = useTencentvideoStore((s) => s.playback.contentId);
  const episodeIndex = useTencentvideoStore((s) => s.playback.episodeIndex);
  const positionSec = positionOverride ?? storePos;
  // 集数进种子:同片不同集开场取景不同,避免每集开头都是同一裁切
  const contentKey =
    contentKeyOverride ?? `${contentId ?? stillId ?? 'still'}:ep${episodeIndex}`;
  const frameIndex = Math.floor(Math.max(0, positionSec) / FRAME_SEC);

  const frame = useMemo(
    () => streamFrameOf(contentKey, frameIndex * FRAME_SEC),
    [contentKey, frameIndex],
  );

  const filterParts = [
    `blur(${frame.blurPx.toFixed(2)}px)`,
    `contrast(${frame.contrast.toFixed(2)})`,
    'saturate(0.92)',
    extraFilter,
  ].filter(Boolean);

  return (
    <div className={`absolute inset-0 overflow-hidden ${className ?? ''}`}>
      <TvImg
        id={stillId}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          objectPosition: `${frame.posX.toFixed(1)}% ${frame.posY.toFixed(1)}%`,
          transform: `scale(${frame.scale.toFixed(3)})`,
          transformOrigin: `${frame.posX.toFixed(1)}% ${frame.posY.toFixed(1)}%`,
          filter: filterParts.join(' '),
          // 刻意无 CSS 过渡:拖进度/播到下一帧都是硬切,更像抽帧码流
        }}
      />
      {/* 轻量噪点层:强化「压缩码流」感,不挡点击 */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.35) 1px, rgba(255,255,255,0.35) 2px)',
          backgroundSize: '100% 3px',
        }}
      />
    </div>
  );
}

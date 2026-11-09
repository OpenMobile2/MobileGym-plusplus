// apps/Tencentvideo/components/DanmakuLayer.tsx —— 弹幕飘字层。
// 三态:full(全部弹幕池)/ selected(精选=偶数条)/ off(隐藏)。
// 用户发送的弹幕(playback.sentDanmaku)白框高亮胶囊即时上屏。
// 动画排布全部由索引确定(禁 Math.random,硬规则7);屏蔽词过滤生效。
import React, { useMemo } from 'react';
import { useTencentvideoStore } from '../state';

interface DanmakuItem {
  key: string;
  text: string;
  row: number;
  delaySec: number;
  durationSec: number;
  mine: boolean;
}

const ROWS = 4;

export function DanmakuLayer({ className }: { className?: string }) {
  const mode = useTencentvideoStore((s) => s.player.danmaku.mode);
  const opacity = useTencentvideoStore((s) => s.player.danmaku.opacity);
  const pool = useTencentvideoStore((s) => s.danmakuPool);
  const sent = useTencentvideoStore((s) => s.playback.sentDanmaku);
  const blockWords = useTencentvideoStore((s) => s.danmakuBlockWords);
  const playing = useTencentvideoStore((s) => s.playback.playing);

  const items = useMemo<DanmakuItem[]>(() => {
    if (mode === 'off') return [];
    const base = pool
      .filter((_, i) => (mode === 'selected' ? i % 2 === 0 : true))
      .filter((d) => !blockWords.some((w) => d.t.includes(w)))
      .map((d, i) => ({
        key: `pool_${i}`,
        text: d.t,
        row: i % ROWS,
        delaySec: (i * 1.7) % 14,
        durationSec: 8 + (i % 5),
        mine: false,
      }));
    const mine = sent.map((d, i) => ({
      key: `mine_${i}`,
      text: d.text,
      row: i % ROWS,
      delaySec: 0,
      durationSec: 9,
      mine: true,
    }));
    return [...base, ...mine];
  }, [mode, pool, sent, blockWords]);

  if (mode === 'off') return null;
  return (
    <div
      className={`absolute inset-x-0 top-1 pointer-events-none overflow-hidden ${className ?? ''}`}
      // containerType 让 100cqw = 本层宽度:横屏舞台里(744px)和竖屏(360px)都能飘满全程,
      // 用 100vw 会按手机壳宽度算,横屏时弹幕只飘半屏就消失。
      style={{ height: ROWS * 24, opacity: opacity / 100, containerType: 'inline-size' }}
      aria-hidden
    >
      <style>{`@keyframes tvDanmakuFly { from { transform: translateX(100cqw); } to { transform: translateX(-100%); } }`}</style>
      {items.map((it) => (
        <span
          key={it.key}
          className={`absolute whitespace-nowrap text-[12px] leading-[22px] px-1.5 ${
            it.mine ? 'rounded-full border border-white text-white' : 'text-white'
          }`}
          style={{
            top: it.row * 24,
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            animation: `tvDanmakuFly ${it.durationSec}s linear ${-it.delaySec}s infinite`,
            animationPlayState: playing ? 'running' : 'paused',
          }}
        >
          {it.text}
        </span>
      ))}
    </div>
  );
}

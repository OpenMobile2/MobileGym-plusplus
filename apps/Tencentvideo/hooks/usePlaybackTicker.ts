// apps/Tencentvideo/hooks/usePlaybackTicker.ts —— 播放进度推进定时器。
// 播放页挂载时调用;按倍速推进 playback.positionSec(store.tickPlayback)。
// 间隔 250ms:配合 SimulatedStreamStill 的 0.5s 换帧,拖进时画面跟手。
// 到末尾自动连播/停播逻辑在 store 内。倍率随 TimeService.getSpeed() 联动。
import { useEffect } from 'react';
import * as TimeService from '@/os/TimeService';
import { useTencentvideoStore } from '../state';
import { isPlaybackScrubbing } from './playbackScrub';

const TICK_MS = 250;

export function usePlaybackTicker(): void {
  const playing = useTencentvideoStore((s) => s.playback.playing);
  const tickPlayback = useTencentvideoStore((s) => s.tickPlayback);
  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      // 手指按在进度条上时不自动推进,否则松手位置会被 ticker 往前带
      if (isPlaybackScrubbing()) return;
      tickPlayback((TICK_MS / 1000) * TimeService.getSpeed());
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [playing, tickPlayback]);
}

// 播放器朝向登记。/player/sheets 一个路由承载 7 种面板,横屏是右侧抽屉、竖屏是底部半屏
// (spec player.sheets regions),但 sheet 类型本身分不出朝向 —— 所以由播放页在挂载时
// 把朝向写进 ui,面板只负责读。
import { useEffect } from 'react';
import { useTencentvideoStore } from '../state';
import { PLAYER_ORIENTATION_KEY } from '../constants';

export type PlayerOrientation = 'portrait' | 'landscape';

export function useDeclarePlayerOrientation(orientation: PlayerOrientation): void {
  const setUi = useTencentvideoStore((s) => s.setUi);
  useEffect(() => {
    setUi(PLAYER_ORIENTATION_KEY, orientation);
  }, [orientation, setUi]);
}

export function usePlayerOrientation(): PlayerOrientation {
  const value = useTencentvideoStore((s) => s.ui[PLAYER_ORIENTATION_KEY]);
  return value === 'landscape' ? 'landscape' : 'portrait';
}

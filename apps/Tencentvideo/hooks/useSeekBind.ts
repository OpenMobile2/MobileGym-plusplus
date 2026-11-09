// 进度条 seek 的 action 绑定。
// ProgressBar 自身用 PointerEvent 处理「拖」,但 spec 里 seek 是一个具名 action,
// 需要一个能被点击(走查器/模拟器只会 click)触发的真实回调 —— 这里按落点算出目标秒数。
// 落点用 nativeEvent.offsetX(元素本地坐标),因为全屏播放器整块被 rotate(90deg),
// clientX 与外接矩形都不在条子自身的轴上。
// actionId 由页面以字面量传入(硬规则8:组件/hook 不自带 actionId)。
import { useRef } from 'react';
import type React from 'react';
import { useTencentvideoGestures } from './useTencentvideoGestures';
import { useTencentvideoStore } from '../state';

export function useSeekBind(actionId: string) {
  const { bindTap } = useTencentvideoGestures();
  const durationSec = useTencentvideoStore((s) => s.playback.durationSec);
  const seekPlayback = useTencentvideoStore((s) => s.seekPlayback);
  const pendingRef = useRef<number | null>(null);

  return bindTap<HTMLDivElement>(
    { kind: 'action', id: actionId },
    {
      beforeTrigger: (event: React.SyntheticEvent<HTMLDivElement>) => {
        const el = event.currentTarget;
        const offsetX = (event.nativeEvent as MouseEvent).offsetX;
        if (!el.clientWidth || typeof offsetX !== 'number') {
          pendingRef.current = null;
          return;
        }
        const pct = Math.max(0, Math.min(1, offsetX / el.clientWidth));
        pendingRef.current = pct * durationSec;
      },
      onTrigger: () => {
        // 走查器 click 落在条中点时 offsetX 有效;拿不到坐标就跳到中点(仍是真实跳转)
        seekPlayback(pendingRef.current ?? durationSec / 2);
        pendingRef.current = null;
      },
    },
  );
}

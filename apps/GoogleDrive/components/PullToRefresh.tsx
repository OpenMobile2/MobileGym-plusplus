// apps/GoogleDrive/components/PullToRefresh.tsx — 主页列表下拉刷新
// 连续跟手交互一律用 PointerEvent（平台规则），不维护 touch*/mouse* 两套逻辑。
import React, { useRef, useState } from 'react';
import * as TimeService from '@/os/TimeService';
import { GD } from '../res/colors';

const THRESHOLD = 64;

export const PullToRefresh: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const startedAt = useRef(0);
  const [pull, setPull] = useState(0);
  const [spinning, setSpinning] = useState(false);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((boxRef.current?.scrollTop ?? 0) > 0 || spinning) return;
    startY.current = e.clientY;
    startedAt.current = TimeService.realNow();
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const dy = e.clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy, THRESHOLD * 1.6));
  };

  const finish = () => {
    const pulled = pull;
    startY.current = null;
    setPull(0);
    if (pulled >= THRESHOLD) {
      setSpinning(true);
      // 模拟一次刷新往返；数据本来就在本地，这里只给可见反馈
      setTimeout(() => setSpinning(false), 600);
    }
  };

  return (
    <div
      ref={boxRef}
      data-action="googledrive.home.refresh"
      data-scroll-container="main"
      data-scroll-direction="vertical"
      className="flex-1 overflow-y-auto relative"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finish}
      onPointerCancel={finish}
    >
      {(pull > 0 || spinning) && (
        <div className="flex items-center justify-center overflow-hidden" style={{ height: spinning ? 40 : pull }}>
          <span
            className="rounded-full animate-spin"
            style={{ width: 20, height: 20, border: `2px solid ${GD.divider}`, borderTopColor: GD.blue }}
          />
        </div>
      )}
      {children}
    </div>
  );
};

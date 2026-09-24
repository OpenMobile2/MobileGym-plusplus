// SVIP 权益墙半屏弹层。节点 vip.wall(spec v1.3.0)。
// 视觉证据:无(整节点 inferred,qa:Q3 锁定)——权益文案种子取自 70b62a 权益对比表 SVIP 列,
// 样式沿用播放器族的深色半屏弹层,因为它只会从清晰度/音质/下载音画这三个深色面板弹出。
import React from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { usePlayerOrientation } from '../hooks/usePlayerOrientation';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { LandscapeStage } from '../components/LandscapeStage';
import { Sheet } from '../components/Sheet';
import { IcCheck, IcCrown } from '../res/icons';

export default function VipWallPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  const membership = useTencentvideoStore((s) => s.membership);
  const user = useTencentvideoStore((s) => s.user);
  const wall = membership.wall;
  // 从横屏画质/音质面板弹来时不能突然变竖屏 —— 沿用播放器当前朝向
  const landscape = usePlayerOrientation() === 'landscape';

  const body = (
    <Sheet title={undefined} showClose dark heightClass={landscape ? 'max-h-[92%]' : 'max-h-[62%]'}>
        <div className="px-1 pb-2">
          <div className="flex items-center gap-2 pt-1 pb-3">
            <span
              className="flex items-center justify-center w-7 h-7 rounded-full"
              style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
            >
              <IcCrown size={16} />
            </span>
            <div>
              <div className="text-[17px] font-bold" style={{ color: C.svipBarText }}>
                {wall.title}
              </div>
              <div className="text-[12px]" style={{ color: C.darkTextSub }}>
                {wall.note.replace('VIP1', user.vipLevelLabel)}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 py-2">
            {wall.items.map((item) => (
              <div key={item} className="flex items-center gap-2">
                <span style={{ color: C.goldBtnTo }}>
                  <IcCheck size={16} />
                </span>
                <span className="text-[14px]" style={{ color: C.darkText }}>
                  {item}
                </span>
              </div>
            ))}
          </div>

          <button
            {...bindTap('vip.cashier.open.fromWall')}
            className="w-full mt-5 h-11 rounded-full border-none text-[15px] font-semibold"
            style={{
              background: `linear-gradient(90deg, ${C.goldBtnFrom}, ${C.goldBtnTo})`,
              color: C.goldBtnText,
            }}
          >
            {user.membership === 'svip' ? s.renewSvip : wall.btn}
          </button>
          <div className="text-center text-[11px] pt-2" style={{ color: C.darkTextSub }}>
            {membership.upsell}
          </div>
        </div>
    </Sheet>
  );

  if (landscape) {
    return (
      <div className="h-full" style={{ background: C.darkBg }} data-status-bar-foreground="light">
        <LandscapeStage>{body}</LandscapeStage>
      </div>
    );
  }
  return (
    <div className="h-full" style={{ background: C.darkBg }} data-status-bar-foreground="light">
      {body}
    </div>
  );
}

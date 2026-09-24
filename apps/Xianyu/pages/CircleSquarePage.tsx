import React from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { HOME_SEGMENTS } from '../constants';
import { Avatar } from '../components/ItemImage';
import { IcArrowRight, IcUsers } from '../res/icons';

function memberText(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万成员` : `${n}成员`;
}

export default function CircleSquarePage() {
  const { bindTap } = useXianyuGestures();
  const circles = useXianyuStore((s) => s.circles);
  const joinedCircles = useXianyuStore((s) => s.joinedCircles);
  const joinCircle = useXianyuStore((s) => s.joinCircle);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      {/* 顶部分段栏(当前=圈子,无返回) */}
      <div className="bg-white shrink-0">
        <div className="flex items-center gap-4 px-3 pt-1 pb-2">
          {HOME_SEGMENTS.map((seg) => (
            <button
              key={seg.id}
              {...(seg.id === 'circle' ? {} : bindTap(seg.transitionId))}
              className={`bg-transparent border-none cursor-pointer py-1.5 text-[15px] ${
                seg.id === 'circle' ? 'text-[#111111] font-bold' : 'text-[#666666]'
              }`}
            >
              {seg.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="CircleSquarePage-main" data-scroll-direction="vertical">
        {/* 圈子入口横排 */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[15px] font-semibold text-[#111111]">我的圈子</span>
            <button
              {...bindTap('circle.discover-open')}
              className="flex items-center gap-0.5 bg-transparent border-none cursor-pointer text-[12px] text-[#999999]"
            >
              全部圈子 <IcArrowRight size={14} />
            </button>
          </div>
          <div
            className="flex items-start gap-4 overflow-x-auto"
            data-scroll-container="circle-entries" data-scroll-direction="horizontal"
          >
            {circles.map((c) => (
              <button
                key={c.id}
                {...bindTap('circle.detail-open', { params: { circleId: c.id } })}
                className="shrink-0 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer w-14"
              >
                <Avatar seed={c.id} name={c.name} size={48} />
                <span className="text-[11px] text-[#666666] max-w-[56px] truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 每日热门圈子榜 */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[15px] font-semibold text-[#111111] mb-2">每日热门圈子榜</div>
          {circles.map((c) => {
            const joined = joinedCircles.includes(c.id);
            return (
              <div key={c.id} className="flex items-center gap-3 py-2 border-b border-[#F4F4F4] last:border-none">
                <button
                  {...bindTap('circle.detail-open', { params: { circleId: c.id } })}
                  className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left p-0"
                >
                  <Avatar seed={c.id} name={c.name} size={44} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[14px] text-[#111111] font-medium truncate">{c.name}</span>
                      {c.tag === 'HOT' && <span className="text-[10px] text-white bg-[#FF3B30] px-1 rounded">HOT</span>}
                      {c.tag === 'NEW' && <span className="text-[10px] text-white bg-[#FF8A00] px-1 rounded">NEW</span>}
                    </div>
                    <div className="text-[11px] text-[#999999] truncate flex items-center gap-1">
                      <IcUsers size={11} /> {memberText(c.memberCount)} · {c.desc}
                    </div>
                  </div>
                </button>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'circle.join.toggle' },
                    { params: { circleId: c.id }, onTrigger: () => joinCircle(c.id) },
                  )}
                  disabled={joined}
                  className={`shrink-0 text-[12px] px-3 h-7 rounded-full border cursor-pointer ${
                    joined ? 'bg-[#F4F4F4] text-[#999999] border-[#EEEEEE]' : 'bg-white text-[#FF8A00] border-[#FF8A00]'
                  }`}
                >
                  {joined ? '已加入' : '+加圈'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

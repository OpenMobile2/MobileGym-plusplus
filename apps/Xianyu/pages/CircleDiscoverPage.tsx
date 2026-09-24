import React, { useState } from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { Avatar } from '../components/ItemImage';
import { IcUsers } from '../res/icons';

const DISCOVER_CATS = ['收藏', '数码', '潮流', '二次元', '生活'] as const;

function memberText(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1)}万成员` : `${n}成员`;
}

export default function CircleDiscoverPage() {
  const { bindTap } = useXianyuGestures();
  const circles = useXianyuStore((s) => s.circles);
  const joinedCircles = useXianyuStore((s) => s.joinedCircles);
  const joinCircle = useXianyuStore((s) => s.joinCircle);

  const [cat, setCat] = useState<string>('收藏');
  const list = circles.filter((c) => c.category === cat);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="全部圈子" />

      <div className="flex-1 flex min-h-0">
        {/* 左侧分类栏 */}
        <div className="w-24 shrink-0 bg-[#F4F4F4] overflow-y-auto">
          {DISCOVER_CATS.map((c) => {
            const active = c === cat;
            return (
              <button
                key={c}
                {...bindTap(
                  { kind: 'action', id: 'circle.discoverCat.select.target' },
                  { params: { target: c }, onTrigger: () => setCat(c) },
                )}
                className={`block w-full text-center py-3 text-[13px] border-none cursor-pointer ${
                  active ? 'bg-white text-[#111111] font-semibold' : 'bg-transparent text-[#666666]'
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* 右侧圈子列表 */}
        <div
          className="flex-1 min-w-0 bg-white overflow-y-auto px-3"
          data-scroll-container="CircleDiscoverPage-main" data-scroll-direction="vertical"
        >
          {list.length === 0 ? (
            <div className="text-center text-[#999999] text-[13px] pt-16">该分类暂无圈子</div>
          ) : (
            list.map((c) => {
              const joined = joinedCircles.includes(c.id);
              return (
                <div key={c.id} className="flex items-center gap-3 py-3 border-b border-[#F4F4F4] last:border-none">
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
            })
          )}
        </div>
      </div>
    </div>
  );
}

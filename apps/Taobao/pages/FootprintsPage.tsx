import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, Price, EmptyState } from '../components/ui';
import { footprintGroupLabel } from '../utils/format';
import { IcSearch } from '../res/icons';

/** 我的足迹(spec: mine.footprints,IMG_8749;按日期分组三列宫格) */
export default function FootprintsPage() {
  const { bindTap } = useTaobaoGestures();
  const footprints = useTaobaoStore((s) => s.footprints);
  const items = useTaobaoStore((s) => s.items);

  const groups = new Map<string, typeof footprints>();
  for (const f of footprints) {
    const label = footprintGroupLabel(f.date);
    groups.set(label, [...(groups.get(label) ?? []), f]);
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar
        title={`我的足迹(${footprints.length})`}
        rightContent={
          <span className="flex items-center gap-3 text-[#333333]">
            <IcSearch size={17} /><span className="text-[12px] whitespace-nowrap">管理</span>
          </span>
        }
      />

      {/* 类型 Tab(展示) */}
      <div className="flex gap-5 px-4 h-9 items-center shrink-0 text-[13px]">
        <span className="text-[#FF5000] font-semibold border-b-2 border-[#FF5000] pb-0.5">宝贝</span>
        <span className="text-[#666666]">店铺</span>
        <span className="text-[#666666]">直播</span>
        <span className="text-[#666666]">图文</span>
        <span className="text-[#666666]">视频</span>
      </div>
      <div className="px-4 pb-1 shrink-0">
        <span className="text-[11px] text-[#666666] bg-[#F5F5F5] rounded-full px-2 py-0.5">筛选浏览时间 ▾</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="footprints-list" data-scroll-direction="vertical">
        {footprints.length === 0 ? (
          <EmptyState text="暂无足迹" />
        ) : (
          [...groups.entries()].map(([label, list]) => (
            <div key={label} className="mt-3">
              <div className="text-[14px] font-semibold mb-2">{label}</div>
              <div className="grid grid-cols-3 gap-2">
                {list.map((f) => {
                  const it = items.find((i) => i.id === f.itemId);
                  if (!it) return null;
                  return (
                    <div
                      key={f.itemId + f.date}
                      {...bindTap('footprints.item-open', { params: { itemId: it.id } })}
                      className="cursor-pointer"
                    >
                      <Img src={it.image} className="w-full aspect-square object-cover rounded-lg" />
                      <Price value={it.price} size="s" className="mt-1 block" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div className="h-4" />
      </div>
    </div>
  );
}

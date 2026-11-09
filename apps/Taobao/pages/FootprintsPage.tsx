import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, Price, EmptyState } from '../components/ui';
import { footprintGroupLabel, fmt } from '../utils/format';
import { IcSearch } from '../res/icons';

/** 我的足迹(spec: mine.footprints,IMG_8749;按日期分组三列宫格) */
export default function FootprintsPage() {
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const footprints = useTaobaoStore((st) => st.footprints);
  const items = useTaobaoStore((st) => st.items);

  const groups = new Map<string, typeof footprints>();
  for (const f of footprints) {
    const label = footprintGroupLabel(f.date);
    groups.set(label, [...(groups.get(label) ?? []), f]);
  }

  return (
    <div className="flex flex-col h-full bg-app-surface">
      <TopBar
        title={fmt(s.myFootprintsTitleFmt, { count: footprints.length })}
        rightContent={
          <span className="flex items-center gap-3 text-app-text">
            <IcSearch size={17} /><span className="text-[12px] whitespace-nowrap">{s.manageLabel}</span>
          </span>
        }
      />

      {/* 类型 Tab(展示) */}
      <div className="flex gap-5 px-4 h-9 items-center shrink-0 text-[13px]">
        <span className="text-[#FF5000] font-semibold border-b-2 border-[#FF5000] pb-0.5">{s.footprintTabItem}</span>
        <span className="text-app-text-muted">{s.footprintTabShop}</span>
        <span className="text-app-text-muted">{s.footprintTabLive}</span>
        <span className="text-app-text-muted">{s.footprintTabPost}</span>
        <span className="text-app-text-muted">{s.footprintTabVideo}</span>
      </div>
      <div className="px-4 pb-1 shrink-0">
        <span className="text-[11px] text-app-text-muted bg-[#F5F5F5] rounded-full px-2 py-0.5">{s.filterBrowseTime}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="footprints-list" data-scroll-direction="vertical">
        {footprints.length === 0 ? (
          <EmptyState text={s.noFootprintsText} />
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

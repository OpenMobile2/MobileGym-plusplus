import React, { useMemo, useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, DiscountTag, EmptyState } from '../components/ui';
import { footprintGroupLabel } from '../utils/format';

export default function FootprintsPage() {
  const { bindTap } = useVipshopGestures();
  const [manage, setManage] = useState(false);

  const items = useVipshopStore((s) => s.items);
  const footprints = useVipshopStore((s) => s.footprints);

  const groups = useMemo(() => {
    const map = new Map<string, typeof footprints>();
    for (const fp of footprints) {
      const label = footprintGroupLabel(fp.date);
      const arr = map.get(label) ?? [];
      arr.push(fp);
      map.set(label, arr);
    }
    return Array.from(map.entries());
  }, [footprints]);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar
        title="我的足迹"
        rightContent={
          <button
            {...bindTap({ kind: 'action', id: 'footprints.manage.toggle' }, { onTrigger: () => setManage((m) => !m) })}
            className="bg-transparent border-none cursor-pointer text-[14px] text-[#222222] whitespace-nowrap"
          >
            {manage ? '完成' : '管理'}
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="footprints-list" data-scroll-direction="vertical">
        {footprints.length === 0 && <EmptyState text="暂无浏览足迹" />}
        {groups.map(([label, fps]) => (
          <div key={label}>
            <div className="px-3 py-2 text-[13px] font-semibold text-[#666666]">{label}</div>
            <div className="flex flex-col gap-2 px-2">
              {fps.map((fp) => {
                const it = items.find((i) => i.id === fp.itemId);
                if (!it) return null;
                return (
                  <div
                    key={fp.itemId}
                    {...bindTap('footprints.item-open', { params: { id: fp.itemId } })}
                    className="bg-white rounded-lg p-2.5 flex gap-2.5 cursor-pointer"
                  >
                    <Img src={it.image} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0 flex flex-col">
                      <div className="text-[13px] text-[#222222] line-clamp-2">{it.title}</div>
                      <div className="flex-1" />
                      <div className="flex items-center gap-1.5">
                        <Price value={it.price} size="m" />
                        <span className="text-[10px] text-[#BBBBBB] line-through">¥{it.originPrice}</span>
                        <DiscountTag text={it.discountText} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div className="h-3" />
      </div>
    </div>
  );
}

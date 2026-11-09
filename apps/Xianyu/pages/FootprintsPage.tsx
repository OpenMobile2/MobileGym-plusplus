import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { EmptyState, Price } from '../components/ui';
import { ItemImage } from '../components/ItemImage';
import { IcDelete } from '../res/icons';
import type { XyItem } from '../types';

const DAY = 86400000;

function dateLabel(dayTs: number, todayStart: number): string {
  if (dayTs === todayStart) return '今天';
  if (dayTs === todayStart - DAY) return '昨天';
  const d = TimeService.fromTimestamp(dayTs);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default function FootprintsPage() {
  const { bindTap } = useXianyuGestures();
  const items = useXianyuStore((s) => s.items);
  const footprints = useXianyuStore((s) => s.footprints);
  const clearFootprints = useXianyuStore((s) => s.clearFootprints);

  const now = TimeService.now();
  const todayStart = now - (now % DAY);

  // 按 date 分组(footprints 已新→旧),关联商品
  const groups: { date: number; entries: { itemId: string; item: XyItem }[] }[] = [];
  for (const fp of footprints) {
    const item = items.find((it) => it.id === fp.itemId);
    if (!item) continue;
    let g = groups.find((x) => x.date === fp.date);
    if (!g) { g = { date: fp.date, entries: [] }; groups.push(g); }
    g.entries.push({ itemId: fp.itemId, item });
  }

  const clearBtn = (
    <button
      {...bindTap({ kind: 'action', id: 'footprint.history.clear' }, { onTrigger: () => clearFootprints() })}
      aria-label="清空"
      className="bg-transparent border-none cursor-pointer text-[#666] inline-flex items-center gap-0.5 text-[13px]"
    >
      <IcDelete size={16} />清空
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="历史浏览" rightContent={footprints.length > 0 ? clearBtn : undefined} />

      <div className="flex-1 overflow-y-auto" data-scroll-container="FootprintsPage-main" data-scroll-direction="vertical">
        {groups.length === 0 ? (
          <EmptyState text="还没有浏览记录" hint="去逛逛感兴趣的宝贝吧" />
        ) : (
          groups.map((g) => (
            <div key={g.date}>
              <div className="px-3 pt-3 pb-1 text-[13px] text-[#999]">{dateLabel(g.date, todayStart)}</div>
              {g.entries.map(({ itemId, item }, idx) => (
                <div key={`${g.date}_${itemId}_${idx}`} className="bg-white border-b border-[#F4F4F4]">
                  <button
                    {...bindTap('home.item-open', { params: { itemId } })}
                    className="w-full flex items-center gap-3 px-3 py-3 bg-transparent border-none cursor-pointer text-left"
                  >
                    <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                      <ItemImage seed={item.id} src={item.images[0]} category={item.category} label={item.title} className="w-full h-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] text-[#1A1A1A] leading-snug line-clamp-2">{item.title}</div>
                      <div className="mt-1.5"><Price value={item.price} size={16} /></div>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

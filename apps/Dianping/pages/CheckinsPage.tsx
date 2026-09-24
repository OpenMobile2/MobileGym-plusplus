import React, { useEffect, useMemo } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { CHECKIN_MOODS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcCheckinPin, IcMore } from '../res/icons';
import { shopCoverUrl } from '../assets';

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

export default function CheckinsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const checkins = useDianpingStore((st) => st.checkins);
  const shops = useDianpingStore((st) => st.shops);
  const showToast = useDianpingStore((st) => st.showToast);
  const recordCheckinsView = useDianpingStore((st) => st.recordCheckinsView);
  useEffect(() => {
    recordCheckinsView();
  }, [recordCheckinsView]);

  const rows = useMemo(
    () =>
      checkins
        .map((c) => ({ ...c, shop: shops.find((x) => x.id === c.shopId) }))
        .filter((c): c is typeof c & { shop: NonNullable<typeof c.shop> } => Boolean(c.shop))
        .sort((a, b) => b.ts - a.ts),
    [checkins, shops],
  );

  const fmt = (ts: number) => {
    const d = TimeService.fromTimestamp(ts);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${mm} / ${dd} ${WEEK[d.getDay()]} ${hh}:${mi}`;
  };

  return (
    <div className="relative flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex h-11 items-center bg-white px-1">
        <button type="button" className="border-none bg-transparent p-2 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="flex-1 text-center text-[17px] font-semibold text-[#222]">我的打卡</div>
        {/* 占位,使标题真正居中 */}
        <div className="w-[38px] shrink-0" />
      </div>

      {/* 标题 */}
      <div className="bg-white px-3 pb-2 pt-1">
        <span className="text-[18px] font-black text-[#222]">全部打卡记录</span>
      </div>

      {/* 时间线 */}
      <div
        className="flex-1 overflow-y-auto px-3 pt-3"
        data-scroll-container="checkins-list"
        data-scroll-direction="vertical"
      >
        {rows.length === 0 ? (
          <div className="py-20 text-center text-[13px] text-[#999]">还没有打卡记录，去打卡吧~</div>
        ) : (
          rows.map((c) => {
            const moodLabel = CHECKIN_MOODS.find((m) => m.id === c.mood)?.label;
            return (
              <div key={`${c.shopId}-${c.ts}`} className="mb-3">
                <div className="mb-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[13px] text-[#666]">
                    <span className="h-2 w-2 rounded-full bg-[#FF6633]" />
                    {fmt(c.ts)}
                  </div>
                  <button
                    type="button"
                    className="border-none bg-transparent p-1 text-[#CCC] cursor-pointer"
                    {...action('checkins.item.menu.disabled', () => showToast(s.notOpen))}
                  >
                    <IcMore size={16} />
                  </button>
                </div>
                <div className="rounded-[10px] bg-white p-3">
                  <button
                    type="button"
                    className="flex w-full items-center gap-2.5 border-none bg-transparent p-0 text-left cursor-pointer"
                    {...bindTap('food.shop-open', { params: { shopId: c.shop.id } })}
                  >
                    <div className="h-[52px] w-[52px] shrink-0 overflow-hidden rounded-[8px]" style={{ background: c.shop.coverColor }}>
                      {shopCoverUrl(c.shop.id) ? (
                        <img src={shopCoverUrl(c.shop.id)} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-semibold text-[#222]">{c.shop.name}</div>
                      <div className="mt-0.5 text-[12px] text-[#999]">
                        {c.shop.district} {c.shop.category}
                      </div>
                    </div>
                  </button>
                  {c.note || moodLabel ? (
                    <div className="mt-2 border-t border-[#F5F5F5] pt-2">
                      {c.note ? <div className="text-[13px] text-[#333]">✨ {c.note}</div> : null}
                      {moodLabel ? (
                        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#FFF6EF] px-2.5 py-1 text-[12px] text-[#B45309]">
                          🔋 {moodLabel}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        {rows.length > 0 ? (
          <div className="py-4 text-center text-[12px] text-[#CCC]">没有更多了 ~</div>
        ) : null}
      </div>

      {/* 打卡 FAB */}
      <button
        type="button"
        className="absolute bottom-5 right-5 flex h-16 w-16 flex-col items-center justify-center rounded-full border-none bg-[#FF6633] text-white shadow-lg cursor-pointer"
        {...bindTap('checkins.new-open')}
      >
        <IcCheckinPin size={22} />
        <span className="text-[12px] font-bold">打卡</span>
      </button>
    </div>
  );
}

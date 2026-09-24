import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { seedTs } from '../utils/appTime';
import Img from '../components/Img';
import TaoSubTabs from '../components/TaoSubTabs';
import { UPCOMING, fmtCount, typeLabel, type UpcomingItem } from '../components/feedShared';

/**
 * spec 节点 taohaopian.upcoming(route /taohaopian/upcoming)—— 淘好片-新片预告(s196)。
 * uiStates:sortTime(s196 取证态,默认)按上映日期分组升序 / sortRecommend 按预约热度排、日期标保留。
 * 预约 toggle → store.toggleReserve,与 me.library 预约tab 双向联动(qa:Q12);
 * 卡片本体 wontfix(新片无播放页,spec 拍板)。
 */

/** 日期标(s196:『17 07月』大日小月) */
function dayLabel(dayOffset: number): { day: string; month: string } {
  const d = TimeService.fromTimestamp(seedTs(dayOffset, '10:00'));
  const p = (n: number) => String(n).padStart(2, '0');
  return { day: p(d.getDate()), month: `${p(d.getMonth() + 1)}月` };
}

export default function TaoUpcomingPage() {
  const { bindTap, action } = useYoukuGestures();
  const { t } = useI18n();
  const showToast = useYoukuStore((s) => s.showToast);
  const toggleReserve = useYoukuStore((s) => s.toggleReserve);
  const reservations = useYoukuStore((s) => s.reservations);

  // s196 取证态为时间排序选中
  const [sort, setSort] = useState<'recommend' | 'time'>('time');

  const list: UpcomingItem[] = [...UPCOMING].sort((a, b) =>
    sort === 'time' ? a.dayOffset - b.dayOffset : b.reserveCount - a.reserveCount,
  );

  const segCls = (active: boolean) =>
    `h-7 shrink-0 cursor-pointer rounded-full border-none px-3 text-[12px] ${
      active ? 'bg-(--app-c-chip-bg) font-bold text-(--app-c-text-primary)' : 'bg-transparent text-[#999999]'
    }`;

  let prevLabel = '';

  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <TaoSubTabs
        active="upcoming"
        toHot={bindTap('taohaopian.upcoming.hot.open')}
        toJieshuo={bindTap('taohaopian.upcoming.jieshuo.open')}
        search={bindTap('taohaopian.upcoming.search.open')}
      />

      {/* 工具行:共N部 + 推荐/时间 排序切换开关 */}
      <div className="flex shrink-0 items-center px-3 py-2">
        <span className="flex-1 text-[13px] text-[#999999]">{t('tao.upcoming.total', { n: UPCOMING.length })}</span>
        <div className="flex items-center rounded-full bg-(--app-c-card-bg) p-0.5">
          <button
            {...action('taohaopian.upcoming.sort.select.recommend', () => setSort('recommend'))}
            className={segCls(sort === 'recommend')}
          >
            {t('tao.upcoming.sortRecommend')}
          </button>
          <button
            {...action('taohaopian.upcoming.sort.select.time', () => setSort('time'))}
            className={segCls(sort === 'time')}
          >
            {t('tao.upcoming.sortTime')}
          </button>
        </div>
      </div>

      {/* 按上映日期分组列表(spec taohaopian.upcoming.list.scroll) */}
      <div
        data-action="taohaopian.upcoming.list.scroll"
        data-action-type="swipe"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto pb-4"
      >
        {list.map((item) => {
          const { day, month } = dayLabel(item.dayOffset);
          const label = `${day}${month}`;
          const showLabel = label !== prevLabel;
          prevLabel = label;
          const reserved = reservations.includes(item.id);
          return (
            <div key={item.id} className="flex px-3 pt-4">
              {/* 日期标:大日小月(分组重复时留白) */}
              <div className="w-11 shrink-0 pt-0.5">
                {showLabel && (
                  <>
                    <div className="text-[22px] font-bold leading-6 text-(--app-c-text-primary)">{day}</div>
                    <div className="text-[11px] text-[#999999]">{month}</div>
                  </>
                )}
              </div>
              {/* 新片卡:大图banner + 小海报 + 片名/信息/简介 + 预约 */}
              <div
                {...action('taohaopian.upcoming.card.wontfixToast', () => showToast(WONTFIX_TOAST))}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <Img src={item.poster} label={item.title} ratio="landscape" className="aspect-video w-full rounded-xl object-cover" />
                <div className="mt-2 flex items-start gap-2.5">
                  <Img src={item.poster} label={item.title} ratio="poster" className="-mt-8 h-[76px] w-[54px] shrink-0 rounded-md border border-black/60 object-cover shadow-[0_2px_8px_rgba(0,0,0,0.6)]" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[16px] font-bold text-(--app-c-text-primary)">{item.title}</div>
                    <div className="mt-0.5 truncate text-[12px] text-[#999999]">
                      {item.region} / {typeLabel(item.type)} / {item.genre}
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-center">
                    <button
                      {...action('taohaopian.upcoming.reserve.toggle', () => toggleReserve(item.id), {
                        params: { upcomingId: item.id },
                        stopPropagation: true,
                      })}
                      className={`h-8 cursor-pointer rounded-full border-none px-4 text-[13px] ${
                        reserved ? 'bg-(--app-c-chip-bg) text-[#999999]' : 'bg-[#0C7BFF] text-(--app-c-text-primary)'
                      }`}
                    >
                      {reserved ? t('tao.upcoming.reserved') : t('tao.upcoming.reserve')}
                    </button>
                    <span className="mt-1 text-[10px] text-[#666666]">
                      {t('tao.upcoming.reserveCount', { n: fmtCount(item.reserveCount + (reserved ? 1 : 0)) })}
                    </span>
                  </div>
                </div>
                <div className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-[#CCCCCC]">
                  {item.desc}({item.dateText})
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

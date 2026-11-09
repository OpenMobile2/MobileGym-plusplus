import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useLocale } from '@/os/locale';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, Img, Price, NOT_OPEN, MY, useStatusBarFg } from '../components/ui';
import { SHOW_CATEGORIES } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcSearch, IcArrowDown, IconRenderer } from '../res/icons';

const CAT_ICONS = ['IcMicVocal', 'IcMic', 'IcPalette', 'IcDrama', 'IcParty', 'IcBaby', 'IcPiano', 'IcSpeech'];

/** 演出频道(anchor_show_channel.jpg;分类宫格/今日必抢/临演特价/为你推荐) */
export default function ShowChannelPage() {
  const statusFg = useStatusBarFg();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const locale = useLocale();
  const [toast, showToast] = useToast();
  const city = useMaoyanStore((st) => st.city);
  const shows = useMaoyanStore((st) => st.shows);

  const rush = shows.filter((x) => x.discount || x.category === 'concert').slice(0, 4);
  const lastMinute = shows.filter((x) => x.discount).slice(0, 4);

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground={statusFg}>
      {toast}
      {/* 顶部:城市 + 搜索 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-app-surface shrink-0">
        <span className="flex items-center gap-0.5 text-[15px] font-medium text-app-text">{city}<IcArrowDown size={14} className="text-(--app-c-text-3)" /></span>
        <button {...bindTap('show.search-open')} className="flex-1 flex items-center h-8 rounded-full bg-(--app-c-fill) px-3 gap-1.5 border-none cursor-pointer">
          <IcSearch size={15} className="text-(--app-c-text-3)" />
          <span className="text-[12px] text-(--app-c-text-3)">搜索明星 演出 赛事 场馆</span>
          <span className="ml-auto shrink-0 text-white text-[12px] rounded-full px-3 py-1" style={{ background: MY.cta }}>{s.search}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="show-feed" data-scroll-direction="vertical">
        {/* 分类宫格 2行5列 */}
        <div className="grid grid-cols-5 gap-y-3 bg-app-surface pt-3 pb-3 px-2">
          {SHOW_CATEGORIES.map((c, i) => (
            <button
              key={c.id}
              {...bindTap('show.category-open', { params: { cat: c.id } })}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className="w-10 h-10 rounded-full bg-(--app-c-brand-tint) text-[#DC4038] flex items-center justify-center">
                <IconRenderer name={CAT_ICONS[i]} size={20} />
              </span>
              <span className="text-[11px] text-(--app-c-text-2)">{locale === 'en' ? c.labelEn : c.label}</span>
            </button>
          ))}
          <button
            {...bindTap({ kind: 'action', id: 'show.rank.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <span className="w-10 h-10 rounded-full bg-(--app-c-gold-tint) text-(--app-c-gold-text) flex items-center justify-center">🏆</span>
            <span className="text-[11px] text-(--app-c-text-2)">演出榜单</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'show.calendar.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <span className="w-10 h-10 rounded-full bg-(--app-c-brand-tint) text-[#DC4038] flex items-center justify-center">🎫</span>
            <span className="text-[11px] text-(--app-c-text-2)">观演团</span>
          </button>
        </div>

        {/* 今日必抢 */}
        <section className="bg-app-surface mt-2 pt-3 pb-3">
          <div className="px-3 mb-2 flex items-center">
            <span className="text-[16px] font-bold" style={{ color: MY.cta }}>{s.todayRush}</span>
            <span className="ml-auto text-[11px] text-(--app-c-text-3)">更多 ›</span>
          </div>
          <div className="flex gap-2 px-3 overflow-x-auto" data-scroll-container="rush-row" data-scroll-direction="horizontal">
            {rush.map((x) => (
              <button key={x.id} {...bindTap('show.item-open', { params: { id: x.id } })}
                className="w-[110px] shrink-0 bg-transparent border-none cursor-pointer p-0 text-left">
                <Img src={x.poster} className="w-[110px] h-[146px] object-cover rounded-lg" />
                <div className="text-[11px] text-app-text line-clamp-2 mt-1">{x.title}</div>
                <div className="text-[10px] text-(--app-c-text-3)">{x.dateDesc.slice(0, 10)}</div>
                {x.discount && <span className="text-[10px] text-[#FF6F00] bg-[#FFF3E0] rounded px-1">{x.discount}</span>}
              </button>
            ))}
          </div>
        </section>

        {/* 艺人预约 + 演出日历(wontfix) */}
        <div className="flex gap-2 mx-3 mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'show.artist.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="flex-1 bg-app-surface rounded-xl p-3 text-left border-none cursor-pointer"
          >
            <div className="text-[13px] font-bold text-app-text">艺人预约</div>
            <div className="text-[11px] text-(--app-c-text-3) mt-1">马思唯 · 赵传 · 梁静茹…</div>
            <div className="text-[11px] text-[#DC4038] mt-1">去预约 ›</div>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'show.calendar.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="flex-1 bg-app-surface rounded-xl p-3 text-left border-none cursor-pointer"
          >
            <div className="text-[13px] font-bold text-app-text">演出日历 <span className="text-[10px] text-white bg-[#DC4038] rounded px-1">今天12</span></div>
            <div className="text-[11px] text-(--app-c-text-3) mt-1">按时间选演出</div>
            <div className="text-[11px] text-[#DC4038] mt-1">天天神券 抢50元神券 ›</div>
          </button>
        </div>

        {/* 临演特价|早鸟预售 */}
        <section className="bg-app-surface mt-2 pt-3 pb-3">
          <div className="px-3 mb-2 flex items-center">
            <span className="text-[16px] font-bold text-app-text">{s.lastMinute}</span>
            <span className="ml-2 text-[12px] text-(--app-c-text-3)">早鸟预售</span>
            <span className="ml-auto text-[11px] text-(--app-c-text-3)">更多 ›</span>
          </div>
          <div className="flex gap-2 px-3 overflow-x-auto" data-scroll-container="lastmin-row" data-scroll-direction="horizontal">
            {lastMinute.map((x) => (
              <button key={x.id} {...bindTap('show.item-open', { params: { id: x.id } })}
                className="w-[110px] shrink-0 bg-transparent border-none cursor-pointer p-0 text-left">
                <Img src={x.poster} className="w-[110px] h-[146px] object-cover rounded-lg" />
                <div className="text-[11px] text-app-text line-clamp-2 mt-1">{x.title}</div>
                <div className="flex items-center gap-1">
                  {x.discount && <span className="text-[10px] text-[#FF6F00] bg-[#FFF3E0] rounded px-1">{x.discount}</span>}
                  <Price value={x.priceMin} size="s" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* 为你推荐 */}
        <section className="mt-2 px-3 pb-3">
          <div className="mb-2 text-[16px] font-bold text-app-text">{s.forYou}</div>
          <div className="grid grid-cols-2 gap-2">
            {shows.map((x) => (
              <button key={x.id} {...bindTap('show.item-open', { params: { id: x.id } })}
                className="bg-app-surface rounded-xl overflow-hidden text-left cursor-pointer p-0 border-none">
                <Img src={x.poster} className="w-full aspect-[3/4] object-cover" />
                <div className="p-2">
                  <div className="text-[12px] text-app-text leading-snug line-clamp-2">【{x.city}】{x.title}</div>
                  <div className="text-[10px] text-(--app-c-text-3) mt-1">{x.dateDesc}</div>
                  <Price value={x.priceMin} size="s" suffix=" 起" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

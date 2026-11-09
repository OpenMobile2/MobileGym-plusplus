import React, { useState } from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useI18n } from '../i18n';
import { contentNavParams } from '../utils/openContent';
import Img from '../components/Img';
import TaoSubTabs from '../components/TaoSubTabs';
import {
  SHORTS, JIESHUO_IDS, catalogById, jieshuoLocator, typeLabel, useSwipe,
} from '../components/feedShared';
import { IcSearch } from '../components/feedIcons';
import HScroll from './home/HScroll';
import type { CatalogItem } from '../types';

/**
 * spec 节点 taohaopian.hot(route /taohaopian)—— 淘好片-全球新热(s189)。
 * 焦点海报 coverflow(横滑)/ 页内搜索 / 标签胶囊单选过滤(轻做)/ 海外新片榜横滑 / 大家都在看列表。
 * 域数据无海外片库,楼层选片为模块内本地策展常量(片单属内容数据,中文域数据不进 i18n)。
 * 『看解说』→ 解说feed 定位该片条目:声明层无 searchParams,用 feedShared.jieshuoLocator 易失单例。
 */

/** 有解说条目的影片集合(解说角标 + 看解说按钮依据) */
const JIESHUO_LINKED = new Set(
  JIESHUO_IDS.map((id) => SHORTS.find((s) => s.id === id)?.linkedContentId).filter(Boolean) as string[],
);

/** 焦点海报 coverflow 片单(s189:中央带解说角标) */
const FOCUS_IDS = ['m_langchao', 'm_yueguang', 's_xuanan', 'm_menfeng', 'a_canglan'];
/** 海外新片榜横滑片单(前4部有解说) */
const RANK_IDS = ['a_canglan', 'm_xueshan3', 's_boyi', 'v_baichu', 'm_kuangben', 's_ruqingyun'];
/** 标签胶囊 → 大家都在看片单(各标签片单互不重合,切换后首屏可见变化) */
const TAG_LISTS: Record<string, string[]> = {
  hot: ['m_langchao', 's_xuanan', 'm_menfeng', 'm_xueshan3'],
  heibang: ['m_gansidui', 'm_weicheng', 'm_kuangben'],
  xuanyi: ['s_boyi', 'a_canglan', 's_anxiang'],
  yinhang: ['s_qiaochu', 'v_baichu', 'm_yueguang'],
};
const TAGS = ['hot', 'heibang', 'xuanyi', 'yinhang'] as const;

const pick = (ids: string[]): CatalogItem[] =>
  ids.map((id) => catalogById(id)).filter((c): c is CatalogItem => !!c);

export default function TaoHotPage() {
  const { bindTap, action } = useYoukuGestures();
  const { t } = useI18n();

  const focus = pick(FOCUS_IDS);
  const rank = pick(RANK_IDS);

  const [focusIdx, setFocusIdx] = useState(0);
  const [rankIdx, setRankIdx] = useState(0);
  const [tag, setTag] = useState<string>('hot');

  const focusItem = focus[focusIdx];
  const rankItem = rank[rankIdx];
  const everyone = pick(TAG_LISTS[tag] ?? TAG_LISTS.hot);

  const focusSwipe = useSwipe<HTMLDivElement>(
    'h',
    () => setFocusIdx((i) => Math.min(i + 1, focus.length - 1)),
    () => setFocusIdx((i) => Math.max(i - 1, 0)),
  );
  const rankSwipe = useSwipe<HTMLDivElement>(
    'h',
    () => setRankIdx((i) => Math.min(i + 1, rank.length - 1)),
    () => setRankIdx((i) => Math.max(i - 1, 0)),
  );

  /** coverflow 相邻位次(不足时留空) */
  const sideL = focus[focusIdx - 1];
  const sideR = focus[focusIdx + 1];

  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <TaoSubTabs
        active="hot"
        toJieshuo={bindTap('taohaopian.hot.jieshuo.open')}
        toUpcoming={bindTap('taohaopian.hot.upcoming.open')}
        search={bindTap('taohaopian.hot.search.open')}
      />
      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto pb-4"
      >
        {/* 焦点海报 coverflow(横滑切换,中央点击进播放页) */}
        <div
          data-action="taohaopian.hot.banner.swipe"
          data-action-type="swipe"
          {...focusSwipe}
          className="relative mt-1 flex h-[228px] touch-pan-y select-none items-center justify-center overflow-hidden"
        >
          {sideL ? (
            <Img src={sideL.poster} label={sideL.title} ratio="poster" className="h-[176px] w-[118px] shrink-0 rounded-lg object-cover opacity-60" />
          ) : (
            <div className="h-[176px] w-[118px] shrink-0" />
          )}
          <div
            {...bindTap('taohaopian.hot.player.open', { params: contentNavParams(focusItem) })}
            className="relative z-10 -mx-3.5 shrink-0 cursor-pointer"
          >
            <Img src={focusItem.poster} label={focusItem.title} ratio="poster" className="h-[212px] w-[144px] rounded-xl object-cover shadow-[0_4px_18px_rgba(0,0,0,0.8)]" />
            {JIESHUO_LINKED.has(focusItem.id) && (
              <span className="absolute bottom-1.5 right-1.5 rounded bg-black/60 px-1.5 text-[10px] leading-4 text-white">
                {t('tao.hot.jieshuoBadge')}
              </span>
            )}
          </div>
          {sideR ? (
            <Img src={sideR.poster} label={sideR.title} ratio="poster" className="h-[176px] w-[118px] shrink-0 rounded-lg object-cover opacity-60" />
          ) : (
            <div className="h-[176px] w-[118px] shrink-0" />
          )}
        </div>
        <div className="mt-3 text-center text-[18px] font-bold text-(--app-c-text-primary)">{focusItem.title}</div>
        <div className="mt-1 text-center text-[12px] text-[#999999]">
          {focusItem.region} / {typeLabel(String(focusItem.type))} / {t('tao.hot.release', { y: focusItem.year })}
        </div>

        {/* 页内搜索框(同搜索入口 transition) */}
        <div className="px-3">
          <div
            {...bindTap('taohaopian.hot.search.open')}
            className="mt-4 flex h-9 cursor-pointer items-center rounded-full bg-(--app-c-chip-bg) px-3.5"
          >
            <span className="flex-1 text-[13px] text-[#666666]">{t('tao.hot.searchPlaceholder')}</span>
            <IcSearch size={16} className="text-[#999999]" />
          </div>

          {/* 标签胶囊行(单选高亮 → 紧接下方片单立刻切换;HScroll 支持桌面拖拽横滑) */}
          <HScroll id="tao-hot-tags" className="mt-3 gap-2">
            {TAGS.map((tg) => {
              const cls = `shrink-0 cursor-pointer rounded-full border-none px-3.5 py-1.5 text-[13px] ${
                tag === tg ? 'bg-(--app-c-chip-bg) font-bold text-(--app-c-text-primary)' : 'bg-(--app-c-chip-bg) text-[#B8B8B8]'
              }`;
              const set = () => setTag(tg);
              if (tg === 'hot')
                return (
                  <button key={tg} {...action('taohaopian.hot.filter.select.hot', set)} className={cls}>
                    {t('tao.hot.tag.hot')}
                  </button>
                );
              if (tg === 'heibang')
                return (
                  <button key={tg} {...action('taohaopian.hot.filter.select.heibang', set)} className={cls}>
                    {t('tao.hot.tag.heibang')}
                  </button>
                );
              if (tg === 'xuanyi')
                return (
                  <button key={tg} {...action('taohaopian.hot.filter.select.xuanyi', set)} className={cls}>
                    {t('tao.hot.tag.xuanyi')}
                  </button>
                );
              return (
                <button key={tg} {...action('taohaopian.hot.filter.select.yinhang', set)} className={cls}>
                  {t('tao.hot.tag.yinhang')}
                </button>
              );
            })}
          </HScroll>

          {/* 大家都在看(紧贴标签下方,切换后首屏可见) */}
          <div className="mt-4 text-[18px] font-bold text-(--app-c-text-primary)">{t('tao.hot.everyone')}</div>
          <div className="mt-3 flex flex-col gap-5" key={tag}>
            {everyone.map((c) => (
              <div
                key={c.id}
                {...bindTap('taohaopian.hot.player.open', { params: contentNavParams(c) })}
                className="cursor-pointer"
              >
                <div className="flex gap-2">
                  <Img src={c.poster} label={c.title} ratio="poster" className="h-[118px] w-[84px] shrink-0 rounded-lg object-cover" />
                  <Img src={c.still} label={c.title} ratio="landscape" className="h-[118px] min-w-0 flex-1 rounded-lg object-cover" />
                </div>
                <div className="mt-2 text-[16px] font-bold text-(--app-c-text-primary)">{c.title}</div>
                <div className="mt-0.5 text-[12px] text-[#999999]">
                  {c.region} / {t('tao.hot.release', { y: c.year })}
                </div>
                <div className="mt-1 line-clamp-2 text-[13px] leading-5 text-[#CCCCCC]">{c.desc}</div>
                <div className="mt-1.5 flex gap-1.5">
                  {c.tags.slice(0, 3).map((tg) => (
                    <span key={tg} className="rounded bg-(--app-c-chip-bg) px-1.5 py-0.5 text-[11px] text-[#999999]">
                      {tg}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 海外新片榜:大图 + 小海报横滑 + 片名/简介 + 看解说(banner 静态图方案,00-scope Q2) */}
          <div className="mt-6 text-[18px] font-bold text-(--app-c-text-primary)">{t('tao.hot.rank')}</div>
          <div className="mt-3 rounded-xl bg-(--app-c-card-bg) p-2.5">
            <div
              data-action="taohaopian.hot.rank.swipe"
              data-action-type="swipe"
              {...rankSwipe}
              className="touch-pan-y select-none"
            >
              <div {...bindTap('taohaopian.hot.player.open', { params: contentNavParams(rankItem) })} className="cursor-pointer">
                <Img src={rankItem.still} label={rankItem.title} ratio="landscape" className="aspect-video w-full rounded-lg object-cover" />
              </div>
              <div className="mt-2.5 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
                {rank.map((r, i) => (
                  <div
                    key={r.id}
                    {...bindTap('taohaopian.hot.player.open', { params: contentNavParams(r) })}
                    className={`shrink-0 cursor-pointer rounded-md ${i === rankIdx ? 'ring-2 ring-white/85' : ''}`}
                  >
                    <Img src={r.poster} label={r.title} ratio="poster" className="h-[74px] w-[52px] rounded-md object-cover" />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[16px] font-bold text-(--app-c-text-primary)">{rankItem.title}</div>
                <div className="mt-0.5 truncate text-[12px] text-[#999999]">{rankItem.recTitle}</div>
              </div>
              {JIESHUO_LINKED.has(rankItem.id) && (
                <button
                  {...bindTap('taohaopian.hot.jieshuo.open', {
                    beforeTrigger: () => {
                      jieshuoLocator.contentId = rankItem.id;
                    },
                  })}
                  className="shrink-0 cursor-pointer rounded-full border-none bg-(--app-c-chip-bg) px-3.5 py-1.5 text-[13px] text-(--app-c-text-primary)"
                >
                  {t('tao.hot.kanjieshuo')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

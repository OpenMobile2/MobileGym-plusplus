import React from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import Img from '../components/Img';
import ShortsSubTabs from '../components/ShortsSubTabs';
import { DRAMAS, SHORTS, fmtCount } from '../components/feedShared';
import { IcChevronRight } from '../components/feedIcons';
import type { HistoryEntry } from '../types';

/**
 * spec 节点 shorts.watched(route /shorts/watched)—— 短剧-看过子tab(s255)。
 * 在追短剧=libFollowing(ctype=drama,与 me.library 在追tab 同源);
 * 历史记录=全局 history 的短剧/短视频条目(00-scope §21 联动);卡片点击续播定位。
 */
export default function ShortsWatchedPage() {
  const { bindTap } = useYoukuGestures();
  const { t } = useI18n();
  const libFollowing = useYoukuStore((s) => s.libFollowing);
  const history = useYoukuStore((s) => s.history);

  const zhuiDramas = libFollowing
    .filter((e) => e.ctype === 'drama')
    .map((e) => DRAMAS.find((d) => d.id === e.id))
    .filter((d): d is (typeof DRAMAS)[number] => !!d);

  /** 最近历史里该短剧看到第几集(writeProgress 置顶,取第一条) */
  const latestEp = (dramaId: string): number | undefined =>
    history.find((h) => h.id === dramaId && h.ctype === 'drama')?.episode;

  // 同剧只展示最新一条(writeProgress 已按剧去重;此处再兜底)
  const dramaHistory = history
    .filter((h) => h.ctype === 'drama')
    .filter((h, i, arr) => arr.findIndex((x) => x.id === h.id) === i);
  const shortHistory = history.filter((h) => h.ctype === 'short');
  const shortById = (id: string) => SHORTS.find((s) => s.id === id);

  const pctText = (h: HistoryEntry) => {
    const pct = h.durationSec > 0 ? Math.round((h.progressSec / h.durationSec) * 100) : 0;
    return pct >= 100 ? t('shorts.watched.watchedDone') : t('shorts.watched.watchedPct', { n: pct });
  };

  return (
    <div
      className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <ShortsSubTabs
        active="watched"
        toFeed={bindTap('shorts.watched.feed.open')}
        toDrama={bindTap('shorts.watched.dramaList.open')}
        search={bindTap('shorts.watched.search.open')}
      />
      <div
        data-scroll-container="main"
        data-scroll-direction="vertical"
        className="min-h-0 flex-1 overflow-y-auto px-3 pb-4"
      >
        {/* 在追短剧(与 me.library 在追tab 同源) */}
        <div className="mt-3 flex items-center">
          <span className="flex-1 text-[18px] font-bold text-(--app-c-text-primary)">{t('shorts.watched.zhuiju')}</span>
          <button
            {...bindTap('shorts.watched.library.open')}
            className="flex cursor-pointer items-center border-none bg-transparent p-0 text-[13px] text-[#999999]"
          >
            {t('shorts.watched.more')}
            <IcChevronRight size={14} />
          </button>
        </div>
        {zhuiDramas.length === 0 ? (
          <div className="py-8 text-center text-[13px] text-[#666666]">{t('shorts.watched.emptyZhuiju')}</div>
        ) : (
          <div
            data-action="shorts.watched.zhuiju.scroll"
            data-action-type="swipe"
            className="mt-3 flex gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none]"
          >
            {zhuiDramas.map((d) => {
              const ep = latestEp(d.id);
              return (
                <div
                  key={d.id}
                  {...bindTap('shorts.watched.dramaList.open', { params: { dramaId: d.id } })}
                  className="w-[126px] shrink-0 cursor-pointer"
                >
                  <Img src={d.cover} label={d.title} ratio="poster" className="aspect-[2/3] w-full rounded-lg object-cover" />
                  <div className="mt-1.5 truncate text-[15px] text-(--app-c-text-primary)">{d.title}</div>
                  <div className="mt-0.5 text-[12px] text-[#999999]">
                    {ep ? t('shorts.watched.epProgress', { n: ep }) : t('shorts.watched.unwatched')}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 历史记录(全局 me.history 联动) */}
        <button
          {...bindTap('shorts.watched.history.open')}
          className="mt-6 flex w-full cursor-pointer items-center border-none bg-transparent p-0"
        >
          <span className="flex-1 text-left text-[18px] font-bold text-(--app-c-text-primary)">{t('shorts.watched.history')}</span>
          <IcChevronRight size={16} className="text-[#999999]" />
        </button>
        <div className="mt-3 grid grid-cols-3 gap-x-2 gap-y-4">
          {dramaHistory.map((h) => {
            const d = DRAMAS.find((x) => x.id === h.id);
            if (!d) return null;
            return (
              <div
                key={`${h.id}#${h.episode ?? 0}`}
                {...bindTap('shorts.watched.dramaList.open', { params: { dramaId: d.id } })}
                className="cursor-pointer"
              >
                <div className="relative">
                  <Img src={d.cover} label={d.title} ratio="poster" className="aspect-[2/3] w-full rounded-lg object-cover" />
                  <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] leading-4 text-white">
                    {t('shorts.drama.epTotal', { n: d.episodeCount })}
                  </span>
                </div>
                <div className="mt-1.5 truncate text-[15px] text-(--app-c-text-primary)">{d.title}</div>
                <div className="mt-0.5 text-[12px] text-[#999999]">
                  {t('shorts.watched.epProgress', { n: h.episode ?? 1 })}
                </div>
              </div>
            );
          })}
        </div>
        {shortHistory.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {shortHistory.map((h) => {
              const s = shortById(h.id);
              if (!s) return null;
              return (
                <div
                  key={`${h.id}#0`}
                  {...bindTap('shorts.watched.feed.open', { params: { shortId: s.id } })}
                  className="flex cursor-pointer items-center gap-2.5"
                >
                  <div className="relative w-[128px] shrink-0">
                    <Img src={s.cover} label={s.title} ratio="landscape" className="aspect-video w-full rounded-md object-cover" />
                    <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1 text-[10px] leading-4 text-white">
                      {pctText(h)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[14px] leading-5 text-(--app-c-text-primary)">{s.title}</div>
                    <div className="mt-1 text-[12px] text-[#666666]">{fmtCount(s.likes)}赞</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

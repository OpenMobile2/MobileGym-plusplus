import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import Img from '../components/Img';
import ShortsSubTabs from '../components/ShortsSubTabs';
import CommentPanel from '../components/CommentPanel';
import { DRAMAS, fmtCount, useSwipe } from '../components/feedShared';
import { IcHeart, IcComment, IcZhuiAdd, IcZhuiDone } from '../components/feedIcons';
import { IcBack } from './me/meShared';

/**
 * spec 节点 shorts.dramaList(route /shorts/dramas)—— 短剧子tab竖屏feed。
 * - 浏览态(无 watch):上下滑切换不同短剧
 * - 连播态(?watch=1&dramaId=):『去观看』push 进入的独立页,上下滑切该剧集数,back 退出
 */

/** 竖屏短剧位置:dramaIdx + 集数 */
type Pos = { di: number; ep: number };

function clampPos(p: Pos): Pos {
  const di = Math.min(Math.max(p.di, 0), DRAMAS.length - 1);
  const ep = Math.min(Math.max(p.ep, 1), DRAMAS[di].updatedTo);
  return { di, ep };
}

const PLAY_BY_DRAMA: Record<string, string> = {
  sd_nixi: '/@app-assets/Youku/shorts/sd_nixi.png',
  sd_guanjia: '/@app-assets/Youku/shorts/sd_play_a.png',
  sd_chuanshu: '/@app-assets/Youku/shorts/sd_play_b.png',
  sd_yinlong: '/@app-assets/Youku/shorts/sd_yinlong.png',
};

export default function ShortsDramaListPage() {
  const { bindTap, action, bindBack, back } = useYoukuGestures();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const spDramaId = searchParams.get('dramaId');
  const watchMode = searchParams.get('watch') === '1';
  const commentsOpen = searchParams.get('comments') === '1';

  const latestEpOf = (dramaId: string): number | undefined =>
    useYoukuStore.getState().history.find((h) => h.id === dramaId && h.ctype === 'drama')?.episode;

  const [pos, setPos] = useState<Pos>(() => {
    const di = Math.max(0, DRAMAS.findIndex((d) => d.id === spDramaId));
    const id = DRAMAS[Math.max(di, 0)].id;
    return clampPos({ di, ep: latestEpOf(id) ?? 1 });
  });

  // dramaId/watch 变化时重定位(同路由 replace/push 不卸载)
  useEffect(() => {
    if (!spDramaId) return;
    const di = DRAMAS.findIndex((d) => d.id === spDramaId);
    if (di < 0) return;
    setPos(
      clampPos({
        di,
        ep: useYoukuStore.getState().history.find((h) => h.id === spDramaId && h.ctype === 'drama')?.episode ?? 1,
      }),
    );
  }, [spDramaId, watchMode]);

  const drama = DRAMAS[pos.di];
  const ep = pos.ep;

  const membershipActive = useYoukuStore((s) => s.membership.active);
  const toggleZhui = useYoukuStore((s) => s.toggleZhui);
  const toggleLike = useYoukuStore((s) => s.toggleLike);
  const writeProgress = useYoukuStore((s) => s.writeProgress);
  const zhui = useYoukuStore((s) => s.libFollowing.some((e) => e.id === drama.id));
  const liked = useYoukuStore((s) => s.likes.some((e) => e.id === drama.id));

  useEffect(() => {
    writeProgress({ id: drama.id, ctype: 'drama', episode: ep, progressSec: 120, durationSec: 180 });
  }, [drama.id, ep, writeProgress]);

  /** 浏览态:整剧切换;连播态:同剧切集 */
  const step = (dir: 1 | -1) => {
    if (!watchMode) {
      const ndi = pos.di + dir;
      if (ndi < 0 || ndi >= DRAMAS.length) return;
      const id = DRAMAS[ndi].id;
      setPos(
        clampPos({
          di: ndi,
          ep: useYoukuStore.getState().history.find((h) => h.id === id && h.ctype === 'drama')?.episode ?? 1,
        }),
      );
      // 当前短剧同步进 URL,离开再返回时回到当前剧而非第一部
      setSearchParams(
        (p) => {
          p.set('dramaId', id);
          return p;
        },
        { replace: true },
      );
      return;
    }
    setPos((cur) => {
      const d = DRAMAS[cur.di];
      const nextEp = cur.ep + dir;
      if (nextEp < 1 || nextEp > d.updatedTo) return cur;
      return { di: cur.di, ep: nextEp };
    });
  };
  const swipe = useSwipe<HTMLDivElement>('v', () => step(1), () => step(-1));

  const openComments = () => {
    if (commentsOpen) {
      back();
      return;
    }
    setSearchParams((p) => {
      p.set('comments', '1');
      return p;
    });
  };

  const vipLocked = ep >= drama.vipFrom && !membershipActive;
  const playCover = PLAY_BY_DRAMA[drama.id] ?? drama.cover;

  return (
    <div
      data-status-bar-foreground="light"
      className="relative flex h-full w-full flex-col overflow-hidden bg-black pt-10"
    >
      {/* 连播页返回浏览态;浏览态不展示返回 */}
      {watchMode && (
        <button
          {...bindBack()}
          aria-label={t('common.back')}
          className="absolute left-2 top-[52px] z-30 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none bg-black/35 text-white backdrop-blur-sm"
        >
          <IcBack size={22} strokeWidth={2.2} />
        </button>
      )}
      {!watchMode && (
        <ShortsSubTabs
          active="drama"
          overlay
          toWatched={bindTap('shorts.dramaList.watched.open')}
          toFeed={bindTap('shorts.dramaList.feed.open')}
          search={bindTap('shorts.dramaList.search.open')}
        />
      )}
      {watchMode && (
        <div className="pointer-events-none absolute inset-x-0 top-10 z-20 flex h-11 items-center justify-center">
          <span className="rounded-full bg-black/40 px-3 py-1 text-[14px] font-medium text-white backdrop-blur-sm">
            {drama.title}
          </span>
        </div>
      )}

      <div
        data-action="shorts.dramaList.swipe.next"
        data-action-type="swipe"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        {...swipe}
        className="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
      >
        <Img src={playCover} label={drama.title} ratio="poster" className="h-full w-full object-cover" />
        <div className="pointer-events-none absolute inset-x-0 top-[30%] text-center [text-shadow:0_1px_4px_rgba(0,0,0,0.85)]">
          <div className="px-8 text-[22px] font-bold text-white">{drama.title}</div>
          <div className="mt-1 text-[15px] text-white/90">
            {watchMode
              ? t('shorts.drama.ep', { n: ep })
              : t('shorts.drama.epTotal', { n: drama.episodeCount })}
          </div>
        </div>
        {vipLocked && (
          <div className="pointer-events-none absolute inset-x-0 bottom-32 flex justify-center">
            <span className="rounded-full bg-black/70 px-4 py-2 text-[13px] text-[#E8C87E]">
              {t('player.mask.vip')}
            </span>
          </div>
        )}

        <div className="absolute bottom-32 right-3 z-10 flex flex-col items-center gap-5">
          <button
            {...action('shorts.dramaList.follow.toggle', () => toggleZhui(drama.id, 'drama'))}
            className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white"
          >
            {zhui ? (
              <IcZhuiDone size={30} className="text-[#0C7BFF]" />
            ) : (
              <IcZhuiAdd size={30} />
            )}
            <span className="text-[12px]">{fmtCount(drama.follows + (zhui ? 1 : 0))}</span>
          </button>
          <button
            {...action('shorts.dramaList.like.toggle', () => toggleLike(drama.id, 'drama'))}
            className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white"
          >
            <IcHeart size={30} className={liked ? 'fill-[#F5265C] text-[#F5265C]' : ''} />
            <span className="text-[12px]">{fmtCount(drama.likes + (liked ? 1 : 0))}</span>
          </button>
          <button
            {...action('shorts.dramaList.comments.open', openComments)}
            className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white"
          >
            <IcComment size={28} />
            <span className="text-[12px]">{fmtCount(drama.commentsCount)}</span>
          </button>
        </div>

        {/* 浏览态底部去观看 → push 连播页;连播态展示集进度条文案 */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-2">
          <div className="pr-16 text-[14px] leading-5 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
            {drama.title}:{drama.desc}
          </div>
          {!watchMode ? (
            <div
              {...bindTap('shorts.dramaList.gowatch.open', { params: { dramaId: drama.id } })}
              className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#2A2A2A]/85 p-2"
            >
              <Img src={drama.cover} label={drama.title} ratio="poster" className="h-14 w-10 shrink-0 rounded-md object-cover" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[15px] font-bold text-white">{drama.title}</div>
                <div className="truncate text-[12px] text-[#999999]">
                  {t('shorts.drama.epTotal', { n: drama.episodeCount })}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-[#4A4A4A] px-3.5 py-1.5 text-[13px] text-white">
                {t('shorts.feed.gowatch')}
              </span>
            </div>
          ) : (
            <div className="mt-2.5 rounded-xl bg-[#2A2A2A]/85 px-3 py-2.5 text-[13px] text-[#CCCCCC]">
              {t('shorts.drama.ep', { n: ep })} / {t('shorts.drama.epTotal', { n: drama.updatedTo })}
              <span className="ml-2 text-[#666666]">上下滑切换集数</span>
            </div>
          )}
        </div>
      </div>

      <CommentPanel open={commentsOpen} contentKey={`${drama.id}:${ep}`} countBase={drama.commentsCount} />
    </div>
  );
}

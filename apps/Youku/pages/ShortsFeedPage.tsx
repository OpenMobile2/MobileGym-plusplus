import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuDark } from '../hooks/useYoukuDark';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import Img from '../components/Img';
import ShortsSubTabs from '../components/ShortsSubTabs';
import CommentPanel from '../components/CommentPanel';
import { catalogById, creatorById, fmtCount, SHORTS, useSwipe } from '../components/feedShared';
import { IcCheck, IcHeart, IcComment, IcStar, IcPlus, IcPlay, IcLayers, IcChevronRight } from '../components/feedIcons';

/**
 * spec 节点 shorts.feed(route /shorts?shortId?=)—— 短剧-短视频竖屏feed(s185 half / s186 fullUgc)。
 * 上下滑切条(PointerEvent);half=有关联影片(留黑+全屏观看+关联剧卡),fullUgc=无关联(铺满)。
 * 评论面板 ?comments=1 URL 驱动(AGENTS 弹层合同),关闭 bindBack。
 */
export default function ShortsFeedPage() {
  const { bindTap, action, back } = useYoukuGestures();
  const { t } = useI18n();
  const isDark = useYoukuDark();
  const [searchParams, setSearchParams] = useSearchParams();
  const spShortId = searchParams.get('shortId');
  const commentsOpen = searchParams.get('comments') === '1';

  const [idx, setIdx] = useState(() => {
    const i = SHORTS.findIndex((s) => s.id === spShortId);
    return i >= 0 ? i : 0;
  });
  const [paused, setPaused] = useState(false);

  // 带 ?shortId 再次进入(replace 同路由不卸载)时重新定位;幂等
  useEffect(() => {
    if (!spShortId) return;
    const i = SHORTS.findIndex((s) => s.id === spShortId);
    if (i >= 0) setIdx((cur) => (SHORTS[cur]?.id === spShortId ? cur : i));
  }, [spShortId]);

  const item = SHORTS[idx] ?? SHORTS[0];
  const creator = creatorById(item.creatorId);
  const linked = catalogById(item.linkedContentId);
  const isHalf = !!linked;

  const showToast = useYoukuStore((s) => s.showToast);
  const toggleLike = useYoukuStore((s) => s.toggleLike);
  const toggleFavorite = useYoukuStore((s) => s.toggleFavorite);
  const toggleFollowCreator = useYoukuStore((s) => s.toggleFollowCreator);
  const writeProgress = useYoukuStore((s) => s.writeProgress);
  const liked = useYoukuStore((s) => s.likes.some((e) => e.id === item.id));
  const faved = useYoukuStore((s) => s.favorites.some((e) => e.id === item.id));
  const following = useYoukuStore((s) => s.followingCreators.includes(item.creatorId));

  // 观看进度写入历史(00-scope Q2;upsert 幂等,StrictMode 双调用安全)
  useEffect(() => {
    writeProgress({
      id: item.id,
      ctype: 'short',
      progressSec: Math.min(60, item.durationSec),
      durationSec: item.durationSec,
    });
  }, [item.id, item.durationSec, writeProgress]);

  const switchTo = (next: number) => {
    if (next < 0 || next >= SHORTS.length) return;
    setIdx(next);
    setPaused(false);
    // 当前条同步进 URL(?shortId),离开(如进创作者主页)再返回时回到当前条而非第一条
    setSearchParams(
      (p) => {
        p.set('shortId', SHORTS[next].id);
        return p;
      },
      { replace: true },
    );
  };
  const swipe = useSwipe<HTMLDivElement>('v', () => switchTo(idx + 1), () => switchTo(idx - 1));

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

  // half=留白信箱跟外观;fullUgc=画面铺满,侧栏/文案仍用浅色字保证可读
  const chromeOnMedia = !isHalf;
  const sideCls = chromeOnMedia
    ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.75)]'
    : 'text-(--app-c-text-primary)';
  const captionCls = chromeOnMedia
    ? 'text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]'
    : 'text-(--app-c-text-primary)';

  return (
    <div
      data-status-bar-foreground={isDark || chromeOnMedia ? 'light' : 'dark'}
      className="relative flex h-full w-full flex-col overflow-hidden bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      <ShortsSubTabs
        active="feed"
        overlay={chromeOnMedia}
        toWatched={bindTap('shorts.feed.watched.open')}
        toDrama={bindTap('shorts.feed.dramaList.open')}
        search={bindTap('shorts.feed.search.open')}
      />
      {/* 视频区:上下滑切条(spec shorts.feed.switch,PointerEvent) */}
      <div
        data-action="shorts.feed.switch"
        data-action-type="swipe"
        data-scroll-container="main"
        data-scroll-direction="vertical"
        {...swipe}
        className="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
      >
        {/* 视频画面(点按播放/暂停) */}
        {isHalf ? (
          <div className="flex h-full flex-col">
            <div className="flex min-h-0 flex-1 items-center justify-center bg-(--app-c-chip-bg)">
              <div
                {...action('shorts.feed.playToggle', () => setPaused((p) => !p))}
                className="relative w-full cursor-pointer"
              >
                <Img src={item.cover} label={item.title} ratio="landscape" className="aspect-video w-full object-cover" />
                <div className="absolute inset-x-0 bottom-2 text-center text-[15px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
                  {item.title}
                </div>
                {paused && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <IcPlay size={44} className="fill-white/85 text-white/85" />
                  </div>
                )}
              </div>
            </div>
            <div className="flex shrink-0 justify-center pb-40 pt-3">
              <button
                {...action('shorts.fullscreen.wontfixToast', () => showToast(WONTFIX_TOAST))}
                className="cursor-pointer rounded-full border border-(--app-c-border) bg-(--app-c-chip-bg) px-4 py-1.5 text-[13px] text-(--app-c-text-primary)"
              >
                {t('shorts.feed.fullscreen')}
              </button>
            </div>
          </div>
        ) : (
          <div
            {...action('shorts.feed.playToggle', () => setPaused((p) => !p))}
            className="absolute inset-0 cursor-pointer bg-black"
          >
            <Img src={item.cover} label={item.title} ratio="landscape" className="h-full w-full object-cover" />
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center">
                <IcPlay size={44} className="fill-white/85 text-white/85" />
              </div>
            )}
          </div>
        )}

        {/* 右侧操作栏 */}
        <div className={`absolute bottom-36 right-3 z-10 flex flex-col items-center gap-5 ${sideCls}`}>
          <div className="relative">
            <button
              {...bindTap('shorts.feed.author.open', { params: { userId: item.creatorId } })}
              aria-label={creator?.name}
              className={`block cursor-pointer rounded-full border-2 bg-transparent p-0 ${
                chromeOnMedia ? 'border-white/80' : 'border-(--app-c-border)'
              }`}
            >
              <Img src={creator?.avatar} label={creator?.name ?? ''} ratio="square" className="h-11 w-11 rounded-full object-cover" />
            </button>
            <button
              {...action('shorts.follow.toggle', () => toggleFollowCreator(item.creatorId), { stopPropagation: true })}
              aria-label={following ? '已关注' : '关注'}
              className={`absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none text-white ${
                following ? 'bg-[#666666]' : 'bg-[#F5265C]'
              }`}
            >
              {following ? <IcCheck size={12} /> : <IcPlus size={14} />}
            </button>
          </div>
          <button
            {...action('shorts.like.toggle', () => toggleLike(item.id, 'short'))}
            className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
          >
            <IcHeart size={30} className={liked ? 'fill-[#F5265C] text-[#F5265C]' : ''} />
            <span className="text-[12px]">{fmtCount(item.likes + (liked ? 1 : 0))}</span>
          </button>
          <button
            {...action('shorts.comments.toggle', openComments)}
            className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
          >
            <IcComment size={28} />
            <span className="text-[12px]">{fmtCount(item.commentsCount)}</span>
          </button>
          <button
            {...action('shorts.fav.toggle', () => toggleFavorite(item.id, 'short'))}
            className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0"
          >
            <IcStar size={28} className={faved ? 'fill-[#F7CE45] text-[#F7CE45]' : ''} />
            <span className="text-[12px]">{fmtCount(item.favs + (faved ? 1 : 0))}</span>
          </button>
        </div>

        {/* 底部文案 + 关联剧卡(half) + 相关合集 */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-3 pb-2">
          <div className={`pr-16 text-[14px] leading-5 ${captionCls}`}>
            @{creator?.name}:{item.title}
          </div>
          {linked && (
            <>
              <div
                {...bindTap('shorts.feed.player.open', { params: contentNavParams(linked) })}
                className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-xl bg-(--app-c-card-bg) p-2 shadow-sm"
              >
                <Img src={linked.poster} label={linked.title} ratio="poster" className="h-14 w-10 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-(--app-c-text-primary)">{linked.title}</div>
                  <div className="truncate text-[12px] text-(--app-c-text-muted)">{linked.recTitle}</div>
                </div>
                <span className="shrink-0 rounded-full bg-(--app-c-chip-bg) px-3.5 py-1.5 text-[13px] text-(--app-c-text-primary)">
                  {t('shorts.feed.gowatch')}
                </span>
              </div>
              <button
                {...action('shorts.collection.wontfixToast', () => showToast(WONTFIX_TOAST))}
                className="mt-2 flex w-full cursor-pointer items-center gap-1.5 border-none bg-transparent px-0 py-1 text-[13px] text-(--app-c-text-muted)"
              >
                <IcLayers size={14} />
                <span className="min-w-0 flex-1 truncate text-left">
                  {t('shorts.feed.collection')}|{linked.title}:{linked.recTitle}
                </span>
                <IcChevronRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 评论面板(uiState comments,?comments=1) */}
      <CommentPanel open={commentsOpen} contentKey={item.id} countBase={item.commentsCount} />
    </div>
  );
}

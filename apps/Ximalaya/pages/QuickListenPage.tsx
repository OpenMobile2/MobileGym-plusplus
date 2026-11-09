import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, Sheet, wontfix, formatCount, formatDuration, showToast } from '../components/ui';
import { sharePlainText } from '@/os/shareBridge';
import {
  IcPlay, IcPause, IcRss, IcHeart, IcShare, IcMore, IcNextForward, IcClose, IcHeadphones,
} from '../res/icons';
import type { Album, Track } from '../types';

const QUICK_TABS = ['推荐', '刷短剧', '热点', '刷小说', '相声'] as const;
type QuickTab = Exclude<(typeof QUICK_TABS)[number], '刷短剧'>;
type QuickItem = { track: Track; album: Album };

const SHARE_CHANNELS = ['微信', '朋友圈', 'QQ', '微博', '复制链接', '海报'];
const WAVE = [8, 16, 28, 40, 24, 14, 30, 44, 22, 12, 26, 38, 48, 30, 18, 10, 22, 36, 44, 28, 16, 24, 34, 20];
const CHANNEL_CATEGORIES: Record<QuickTab, string[]> = {
  推荐: ['小说', '相声评书', '播客', '儿童', '历史', '大师课'],
  热点: ['播客', '历史', '大师课', '小说'],
  刷小说: ['小说'],
  相声: ['相声评书'],
};

function buildQuickPool(
  tab: QuickTab,
  albums: Album[],
  tracks: Track[],
  seedTrackIds: string[],
): QuickItem[] {
  const trackById = new Map(tracks.map((track) => [track.id, track]));
  const albumById = new Map(albums.map((album) => [album.id, album]));
  const seedAlbumIds = seedTrackIds
    .map((trackId) => trackById.get(trackId)?.albumId)
    .filter((albumId): albumId is string => Boolean(albumId));
  const categories = CHANNEL_CATEGORIES[tab];

  let candidates = albums.filter((album) => categories.includes(album.category));
  if (tab === '推荐') {
    const order = new Map(seedAlbumIds.map((albumId, index) => [albumId, index]));
    candidates = [...candidates].sort((left, right) => {
      const leftOrder = order.get(left.id) ?? seedAlbumIds.length + albums.indexOf(left);
      const rightOrder = order.get(right.id) ?? seedAlbumIds.length + albums.indexOf(right);
      return leftOrder - rightOrder;
    });
  } else if (tab === '热点') {
    candidates = [...candidates].sort((left, right) => right.playCount - left.playCount);
  }

  return candidates.slice(0, 24).flatMap((album, albumIndex) => {
    if (!album.trackIds.length) return [];
    const episodeOffset =
      tab === '热点' ? albumIndex * 5 + 2
        : tab === '刷小说' ? albumIndex * 3 + 1
          : tab === '相声' ? albumIndex * 2 + 2
            : albumIndex * 3;
    const trackId = album.trackIds[episodeOffset % album.trackIds.length];
    const track = trackById.get(trackId);
    return track ? [{ track, album: albumById.get(track.albumId) || album }] : [];
  });
}

export function QuickListenPage() {
  const { bindTap, bindBack } = useXimalayaGestures();
  const [sp] = useSearchParams();
  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const poolIds = useXimalayaStore((st) => st.quickListenTrackIds);
  const subscribedAlbumIds = useXimalayaStore((st) => st.subscribedAlbumIds);
  const likedTrackIds = useXimalayaStore((st) => st.likedTrackIds);
  const player = useXimalayaStore((st) => st.player);
  const toggleSubscribe = useXimalayaStore((st) => st.toggleSubscribe);
  const toggleLikeTrack = useXimalayaStore((st) => st.toggleLikeTrack);
  const togglePlay = useXimalayaStore((st) => st.togglePlay);
  const playTrack = useXimalayaStore((st) => st.playTrack);
  const recordTaskAudit = useXimalayaStore((st) => st.recordTaskAudit);

  const [tab, setTab] = useState<QuickTab>('推荐');
  const [idx, setIdx] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [animating, setAnimating] = useState(false);
  const swipeAreaRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const swipedRef = useRef(false);
  const capturingRef = useRef(false);
  const activePointerRef = useRef<number | null>(null);
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activePool = useMemo(
    () => buildQuickPool(tab, albums, tracks, poolIds),
    [tab, albums, tracks, poolIds],
  );
  const currentIndex = activePool.length ? ((idx % activePool.length) + activePool.length) % activePool.length : 0;
  const currentItem = activePool[currentIndex] || { track: tracks[0], album: albums[0] };
  const track = currentItem.track;
  const album = currentItem.album;
  const subscribed = subscribedAlbumIds.includes(album.id);
  const liked = likedTrackIds.includes(track.id);
  const isCurrentPlayerTrack = player.currentTrackId === track.id;
  const playing = player.playing && player.currentTrackId === track.id;

  useEffect(() => () => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
  }, []);

  const getItem = (offset: number): QuickItem => {
    if (!activePool.length) return currentItem;
    const targetIndex = (currentIndex + offset + activePool.length) % activePool.length;
    return activePool[targetIndex];
  };

  const completeSwitch = (direction: 'next' | 'previous') => {
    const nextIndex = direction === 'next'
      ? (currentIndex + 1) % activePool.length
      : (currentIndex - 1 + activePool.length) % activePool.length;
    const nextItem = activePool[nextIndex];
    transitionTimerRef.current = null;
    setAnimating(false);
    setDragOffset(0);
    setIdx(nextIndex);
    if (nextItem) {
      playTrack(nextItem.album.id, nextItem.track.id);
      recordTaskAudit({ quickListen: { tab, trackId: nextItem.track.id } });
    }
  };

  const animateTo = (direction: 'next' | 'previous') => {
    if (animating || transitionTimerRef.current || activePool.length < 2) return;
    const height = swipeAreaRef.current?.getBoundingClientRect().height || 420;
    swipedRef.current = true;
    setAnimating(true);
    setDragOffset(direction === 'next' ? -height : height);
    transitionTimerRef.current = setTimeout(() => completeSwitch(direction), 240);
  };

  const selectTab = (nextTab: QuickTab) => {
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    transitionTimerRef.current = null;
    const nextPool = buildQuickPool(nextTab, albums, tracks, poolIds);
    setAnimating(false);
    setDragOffset(0);
    setIdx(0);
    setTab(nextTab);
    if (nextPool[0]) {
      playTrack(nextPool[0].album.id, nextPool[0].track.id);
      recordTaskAudit({ quickListen: { tab: nextTab, trackId: nextPool[0].track.id } });
    }
  };

  const onSwipeDown = (e: React.PointerEvent) => {
    if (animating) return;
    activePointerRef.current = e.pointerId;
    startY.current = e.clientY;
    swipedRef.current = false;
    capturingRef.current = false;
  };
  const onSwipeMove = (e: React.PointerEvent) => {
    if (animating || activePointerRef.current !== e.pointerId) return;
    const delta = e.clientY - startY.current;
    if (!capturingRef.current && Math.abs(delta) > 8) {
      capturingRef.current = true;
      swipedRef.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    }
    if (!capturingRef.current) return;
    const height = swipeAreaRef.current?.getBoundingClientRect().height || 420;
    setDragOffset(Math.max(-height * 0.9, Math.min(height * 0.9, delta)));
  };
  const finishSwipe = (e: React.PointerEvent, cancelled = false) => {
    if (activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    if (capturingRef.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      capturingRef.current = false;
    }
    const height = swipeAreaRef.current?.getBoundingClientRect().height || 420;
    const threshold = Math.min(72, height * 0.16);
    if (!cancelled && dragOffset < -threshold) {
      animateTo('next');
    } else if (!cancelled && dragOffset > threshold) {
      animateTo('previous');
    } else if (dragOffset !== 0) {
      setAnimating(true);
      setDragOffset(0);
      transitionTimerRef.current = setTimeout(() => {
        transitionTimerRef.current = null;
        setAnimating(false);
      }, 180);
    }
  };

  const sharePanel = sp.get('panel') === 'share';

  return (
    <div
      className="h-full flex flex-col pt-10 relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${album.themeColor} 0%, #0B0B0F 78%)` }}
      data-status-bar-foreground="light"
    >
      {/* 顶部子Tab */}
      <div
        className="shrink-0 flex items-center gap-4 px-4 h-11 overflow-x-auto text-white text-[15px]"
        data-scroll-container data-scroll-direction="horizontal"
      >
        {QUICK_TABS.map((t) => {
          const active = t === tab;
          if (t === '刷短剧') {
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'quicklisten.drama.wontfix' }, { onTrigger: wontfix })}
                className="shrink-0 pb-1 opacity-70"
              >{t}</button>
            );
          }
          return (
            <button
              key={t}
              {...bindTap(
                { kind: 'action', id: 'quicklisten.tab.select.opt' },
                { params: { tab: t }, onTrigger: () => selectTab(t) },
              )}
              className={'shrink-0 pb-1 ' + (active ? 'font-semibold border-b-2 border-white' : 'opacity-70')}
            >{t}</button>
          );
        })}
      </div>

      {/* 上一条 / 当前条 / 下一条三页轨道，拖动时跟手，松手后吸附切换。 */}
      <div
        ref={swipeAreaRef}
        className="flex-1 min-h-0 relative overflow-hidden select-none"
        onPointerDown={onSwipeDown}
        onPointerMove={onSwipeMove}
        onPointerUp={(e) => finishSwipe(e)}
        onPointerCancel={(e) => finishSwipe(e, true)}
        style={{ touchAction: 'none' }}
      >
        {([-1, 0, 1] as const).map((offset) => {
          const item = getItem(offset);
          const isCurrent = offset === 0;
          const pageIndex = activePool.length
            ? (currentIndex + offset + activePool.length) % activePool.length
            : 0;
          return (
            <div
              key={`${item.track.id}_${offset}`}
              className="absolute inset-0 flex flex-col items-center justify-center px-8 gap-3"
              style={{
                transform: `translateY(calc(${offset * 100}% + ${dragOffset}px))`,
                transition: animating ? 'transform 240ms cubic-bezier(0.22, 0.72, 0.22, 1)' : 'none',
                background: `linear-gradient(180deg, ${item.album.themeColor} 0%, #0B0B0F 78%)`,
              }}
              aria-hidden={!isCurrent}
            >
              <div className="flex items-center gap-2 text-[11px] text-white/75">
                <span className="rounded-full bg-white/15 px-2 py-0.5">{item.album.category}</span>
                <span>{pageIndex + 1}/{activePool.length}</span>
              </div>
              {isCurrent ? (
                <button
                  {...bindTap(
                    { kind: 'action', id: 'quicklisten.toggle.toggle' },
                    {
                      onTrigger: () => {
                        if (swipedRef.current) return;
                        if (isCurrentPlayerTrack) togglePlay();
                        else playTrack(item.album.id, item.track.id);
                      },
                    },
                  )}
                  className="relative w-[210px] h-[210px] max-w-[62vw] max-h-[62vw] rounded-2xl overflow-hidden shadow-2xl shrink-0"
                  aria-label="播放/暂停"
                >
                  <Img src={item.album.cover} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-14 h-14 rounded-full bg-black/45 flex items-center justify-center text-white">
                      {playing ? <IcPause size={28} /> : <IcPlay size={28} />}
                    </div>
                  </div>
                </button>
              ) : (
                <div className="relative w-[210px] h-[210px] max-w-[62vw] max-h-[62vw] rounded-2xl overflow-hidden shadow-2xl shrink-0">
                  <Img src={item.album.cover} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/25" />
                </div>
              )}

              <div className="flex items-end gap-[3px] h-8">
                {WAVE.map((height, waveIndex) => (
                  <span
                    key={waveIndex}
                    className="w-[3px] rounded-full bg-white/70 transition-[height] duration-200"
                    style={{ height: `${isCurrent && playing ? height * 0.68 : Math.max(4, height * 0.32)}px` }}
                  />
                ))}
              </div>

              <div className="w-full text-center">
                <div className="text-white text-[16px] font-semibold truncate">{item.track.title}</div>
                <div className="text-white/60 text-[12px] mt-0.5 truncate">
                  {item.album.title} · {item.album.anchorName} · {formatDuration(item.track.durationSec)}
                </div>
                <p className="text-white/80 text-[13px] leading-[19px] mt-2 line-clamp-2">{item.track.transcript}</p>
              </div>
            </div>
          );
        })}
        {capturingRef.current && (
          <div className="absolute inset-x-0 bottom-2 text-center text-[10px] text-white/55 pointer-events-none">
            {dragOffset < 0 ? '松开播放下一条' : '松开返回上一条'}
          </div>
        )}
      </div>

      {/* 点击也可切下一条。 */}
      <button
        {...bindTap({ kind: 'action', id: 'quicklisten.next.tap' }, { onTrigger: () => animateTo('next') })}
        className="shrink-0 mx-auto mb-1 flex flex-col items-center text-white/70 text-[11px]"
        aria-label="上滑换一条"
      >
        <IcNextForward size={22} className="-rotate-90" />
        上下滑动切换
      </button>

      {/* 底部当前音源条:封面/标题→播放页;订阅/点赞/分享/更多 为独立同级按钮 */}
      <div className="shrink-0 mx-3 mb-3 rounded-2xl bg-white/12 backdrop-blur px-3 py-2.5 flex items-center gap-3">
        <div
          {...bindTap('quick.player-open', { beforeTrigger: () => playTrack(album.id, track.id) })}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <Img src={album.cover} className="w-11 h-11 rounded-lg object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white text-[13px] font-medium truncate">{track.title}</div>
            <div className="text-white/55 text-[11px] flex items-center gap-1">
              <IcHeadphones size={11} />{formatCount(track.playCount)}
            </div>
          </div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'quicklisten.subscribe.toggle' }, { stopPropagation: true, onTrigger: () => toggleSubscribe(album.id) })}
          className={'shrink-0 flex flex-col items-center text-[10px] ' + (subscribed ? 'text-[#FE4543]' : 'text-white/80')}
        >
          <IcRss size={20} />{subscribed ? '已订阅' : '订阅'}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'quicklisten.like.toggle' }, { stopPropagation: true, onTrigger: () => toggleLikeTrack(track.id) })}
          className={'shrink-0 flex flex-col items-center text-[10px] ' + (liked ? 'text-[#FE4543]' : 'text-white/80')}
        >
          <IcHeart size={20} className={liked ? 'fill-current' : ''} />赞
        </button>
        <button
          {...bindTap('quick.share-open', { stopPropagation: true })}
          className="shrink-0 flex flex-col items-center text-[10px] text-white/80"
        >
          <IcShare size={20} />分享
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); wontfix(); }}
          className="shrink-0 flex flex-col items-center text-[10px] text-white/80"
        >
          <IcMore size={20} />更多
        </button>
      </div>

      {/* 分享面板 */}
      {sharePanel && (
        <Sheet
          title="分享"
          onCloseNode={
            <button {...bindBack()} className="absolute right-3 text-[#999]" aria-label="关闭"><IcClose size={20} /></button>
          }
        >
          <div className="grid grid-cols-4 gap-y-5 p-5">
            {SHARE_CHANNELS.map((c) => (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'share.thirdparty.wontfix' }, { onTrigger: () => { const launched = sharePlainText('【喜马拉雅】正在听', { onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); } }); if (!launched) wontfix(); } })}
                className="flex flex-col items-center gap-1.5 text-[12px] text-[#333]"
              >
                <span className="w-11 h-11 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#999]"><IcShare size={20} /></span>
                {c}
              </button>
            ))}
          </div>
        </Sheet>
      )}
    </div>
  );
}

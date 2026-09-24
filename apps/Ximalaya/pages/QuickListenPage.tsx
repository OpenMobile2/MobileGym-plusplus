import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStore } from '../state';
import { Img, Sheet, wontfix, formatCount } from '../components/ui';
import {
  IcPlay, IcPause, IcRss, IcHeart, IcShare, IcMore, IcNextForward, IcClose, IcHeadphones,
} from '../res/icons';

// 顶部子Tab:除「刷短剧」(视频形态占位)外,均为同一沉浸流换内容池
const QUICK_TABS = ['推荐', '刷短剧', '热点', '刷小说', '相声'] as const;
const SHARE_CHANNELS = ['微信', '朋友圈', 'QQ', '微博', '复制链接', '海报'];

// 装饰性波形(静态高度序列)
const WAVE = [8, 16, 28, 40, 24, 14, 30, 44, 22, 12, 26, 38, 48, 30, 18, 10, 22, 36, 44, 28, 16, 24, 34, 20];

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

  const [tab, setTab] = useState<string>('推荐');
  const [idx, setIdx] = useState(0);
  const startY = useRef(0);
  const swipedRef = useRef(false);
  const capturingRef = useRef(false);

  const trackId = poolIds[idx % poolIds.length];
  const track = tracks.find((t) => t.id === trackId) ?? tracks[0];
  const album = albums.find((a) => a.id === track.albumId) ?? albums[0];
  const subscribed = subscribedAlbumIds.includes(album.id);
  const liked = likedTrackIds.includes(track.id);
  const playing = player.playing && player.currentTrackId === track.id;

  const goTo = (nextIdx: number) => {
    const ni = (nextIdx + poolIds.length) % poolIds.length;
    setIdx(ni);
    const nt = tracks.find((t) => t.id === poolIds[ni]);
    if (nt) playTrack(nt.albumId, nt.id);
  };
  const goNext = () => goTo(idx + 1);
  const goPrev = () => goTo(idx - 1);

  // 上下滑动切节目(PointerEvent);滑动时抑制封面的播放/暂停点击。
  // 关键:确认拖动意图(纵向位移>10px)后再 setPointerCapture —— 否则大幅/快速滑动
  // 时指针移出容器,pointerup 落到别处丢失,滑动失效(小幅滑动却能生效)。捕获后 pointerup
  // 必回落容器;阈值前不捕获,保留封面「轻点=播放/暂停」的 click。
  const onSwipeDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
    swipedRef.current = false;
    capturingRef.current = false;
  };
  const onSwipeMove = (e: React.PointerEvent) => {
    if (capturingRef.current) return;
    if (Math.abs(e.clientY - startY.current) > 10) {
      capturingRef.current = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    }
  };
  const onSwipeUp = (e: React.PointerEvent) => {
    if (capturingRef.current) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
      capturingRef.current = false;
    }
    const dy = e.clientY - startY.current;
    if (dy < -40) { swipedRef.current = true; goNext(); }
    else if (dy > 40) { swipedRef.current = true; goPrev(); }
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
              {...bindTap({ kind: 'action', id: 'quicklisten.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setTab(t) })}
              className={'shrink-0 pb-1 ' + (active ? 'font-semibold border-b-2 border-white' : 'opacity-70')}
            >{t}</button>
          );
        })}
      </div>

      {/* 居中大封面 + 波形 + AI文稿摘录;点封面切播放/暂停;上下滑切节目 */}
      <div
        className="flex-1 min-h-0 flex flex-col items-center justify-center px-8 gap-5"
        onPointerDown={onSwipeDown}
        onPointerMove={onSwipeMove}
        onPointerUp={onSwipeUp}
        onPointerCancel={onSwipeUp}
        style={{ touchAction: 'pan-x' }}
      >
        <button
          {...bindTap({ kind: 'action', id: 'quicklisten.toggle.toggle' }, { onTrigger: () => { if (!swipedRef.current) togglePlay(); } })}
          className="relative w-56 h-56 max-w-[70vw] max-h-[70vw] rounded-2xl overflow-hidden shadow-2xl"
          aria-label="播放/暂停"
        >
          <Img src={album.cover} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <div className="w-14 h-14 rounded-full bg-black/45 flex items-center justify-center text-white">
              {playing ? <IcPause size={28} /> : <IcPlay size={28} />}
            </div>
          </div>
        </button>

        {/* 声音波形 */}
        <div className="flex items-end gap-[3px] h-12">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-white/70"
              style={{ height: `${playing ? h : Math.max(6, h * 0.5)}px` }}
            />
          ))}
        </div>

        {/* AI文稿摘录 */}
        <div className="w-full text-center">
          <div className="text-white text-[16px] font-semibold truncate">{track.title}</div>
          <div className="text-white/60 text-[12px] mt-0.5 truncate">{album.title} · {album.anchorName}</div>
          <p className="text-white/80 text-[13px] leading-relaxed mt-3 line-clamp-3">{track.transcript}</p>
        </div>
      </div>

      {/* 上滑换下一条(点击=下一条;主区域可上下滑) */}
      <button
        {...bindTap({ kind: 'action', id: 'quicklisten.next.tap' }, { onTrigger: goNext })}
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
                {...bindTap({ kind: 'action', id: 'share.thirdparty.wontfix' }, { onTrigger: wontfix })}
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

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { useXimalayaStrings } from '../hooks/useXimalayaStrings';
import { useXimalayaStore } from '../state';
import { Img, Sheet, showToast, wontfix, formatCount, formatDuration } from '../components/ui';
import { SPEED_OPTIONS, TIMER_TIME_OPTIONS, TIMER_COUNT_OPTIONS } from '../constants';
import {
  IcChevronDown, IcChevronRight, IcClose, IcCheck, IcShare, IcDownload, IcSpeed, IcLike,
  IcStar, IcMore, IcList, IcPrev, IcNext, IcPlay, IcPause, IcTimer, IcBack15, IcForward15,
  IcComment, IcTicket, IcGift, IcQuality, IcSkin, IcSettings, IcCast, IcCar, IcFlag,
  IcCopyright, IcFeedback, IcAddList, IcHeadphones, IcUserCircle, IcSparkles, IcWifi,
} from '../res/icons';

const QUALITIES = [
  { q: '标准', vip: false, desc: '流量较省' },
  { q: '高清', vip: false, desc: '推荐音质' },
  { q: '超高', vip: true, desc: 'VIP 专享' },
];
const EFFECTS = [
  { q: '关闭', vip: false },
  { q: '助眠', vip: false },
  { q: '清澈人声', vip: false },
  { q: '降噪', vip: true },
  { q: '山谷混响', vip: true },
  { q: '环绕音效', vip: true },
];
const CAST_DEVICES = ['客厅的小雅音箱', '卧室电视', '车载蓝牙', 'JBL 蓝牙音箱'];
const SHARE_CHANNELS = ['微信', '朋友圈', '抖音', '小红书', 'QQ'];

export function PlayerPage() {
  const { bindTap, bindBack, back } = useXimalayaGestures();
  const s = useXimalayaStrings();
  const [sp] = useSearchParams();
  const panel = sp.get('panel');
  const view = sp.get('view');

  const albums = useXimalayaStore((st) => st.albums);
  const tracks = useXimalayaStore((st) => st.tracks);
  const anchors = useXimalayaStore((st) => st.anchors);
  const player = useXimalayaStore((st) => st.player);
  const likedTrackIds = useXimalayaStore((st) => st.likedTrackIds);
  const collectedTrackIds = useXimalayaStore((st) => st.collectedTrackIds);
  const togglePlay = useXimalayaStore((st) => st.togglePlay);
  const toggleLikeTrack = useXimalayaStore((st) => st.toggleLikeTrack);
  const toggleCollect = useXimalayaStore((st) => st.toggleCollect);
  const setSpeed = useXimalayaStore((st) => st.setSpeed);
  const setQuality = useXimalayaStore((st) => st.setQuality);
  const setTimer = useXimalayaStore((st) => st.setTimer);
  const playTrack = useXimalayaStore((st) => st.playTrack);
  const isVip = useXimalayaStore((st) => st.user.isVip);

  const album = albums.find((a) => a.id === player.currentAlbumId) ?? albums[0];
  const track = tracks.find((t) => t.id === player.currentTrackId)
    ?? tracks.find((t) => t.albumId === album?.id) ?? tracks[0];
  const anchor = anchors.find((a) => a.id === album?.anchorId);
  const albumTracks = (album?.trackIds ?? [])
    .map((id) => tracks.find((t) => t.id === id))
    .filter(Boolean) as typeof tracks;
  const idx = albumTracks.findIndex((t) => t.id === track?.id);

  const theme = album?.themeColor ?? '#3A3A3A';
  const liked = likedTrackIds.includes(track?.id ?? '');
  const collected = collectedTrackIds.includes(track?.id ?? '');
  const likeCount = Math.round((track?.playCount ?? 0) / 500) + (liked ? 1 : 0);
  const collectCount = Math.round((track?.playCount ?? 0) / 2000) + (collected ? 1 : 0);
  const dur = track?.durationSec ?? 0;

  // —— 本地运行态 ——
  const [coverTab, setCoverTab] = useState<'封面' | '文稿'>('封面');
  const [prog, setProg] = useState(() => Math.min(player.progressSec, dur));
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<HTMLDivElement | null>(null);
  const [danmaku, setDanmaku] = useState<string | null>(null);
  const [qualityTab, setQualityTab] = useState<'音质' | '音效'>('音质');
  const [ticketTab, setTicketTab] = useState<'领月票' | '投月票'>('领月票');
  const [playlistAsc, setPlaylistAsc] = useState(true);
  const [speedScope, setSpeedScope] = useState(false);
  const [autoplay, setAutoplay] = useState(true);
  const [mix, setMix] = useState(false);
  const [lock, setLock] = useState(true);
  // 更多菜单里的二级弹窗(无声明 search,用本地态)
  const [pop, setPop] = useState<null | 'skiphead' | 'alarm' | 'cast' | 'ticketVideo'>(null);

  const clampSeek = (sec: number) => setProg(Math.max(0, Math.min(dur, sec)));

  // 播放时进度条按秒推进(模拟播放时钟);暂停/拖动时停止
  useEffect(() => {
    if (!player.playing || dragging || dur <= 0) return;
    const id = setInterval(() => setProg((p) => (p < dur ? p + 1 : p)), 1000);
    return () => clearInterval(id);
  }, [player.playing, dragging, dur]);

  const seekFromClientX = (clientX: number) => {
    const el = barRef.current;
    if (!el || dur <= 0) return prog;
    const rect = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * dur);
  };

  const gotoTrack = (dir: 'prev' | 'next') => {
    if (idx < 0 || albumTracks.length === 0) return;
    const ni = dir === 'prev' ? idx - 1 : idx + 1;
    const nt = albumTracks[(ni + albumTracks.length) % albumTracks.length];
    if (nt && album) { playTrack(album.id, nt.id); setProg(0); }
  };

  // ============ 文稿全屏(?view=transcript) ============
  if (view === 'transcript') {
    return (
      <div
        className="h-full flex flex-col pt-10 text-white"
        style={{ background: `linear-gradient(180deg, ${theme} 0%, #141414 60%)` }}
        data-status-bar-foreground="light"
      >
        <div className="shrink-0 h-11 flex items-center px-2">
          <button
            {...bindTap({ kind: 'action', id: 'transcript.exit.tap' }, { onTrigger: () => back() })}
            className="flex items-center gap-1 text-[14px]"
          >
            <IcChevronDown size={22} /> 退出全屏阅读
          </button>
          <div className="flex-1" />
          <button {...bindTap('player.more-open')} className="w-9 h-9 flex items-center justify-center"><IcMore size={22} /></button>
        </div>
        <div
          className="flex-1 overflow-y-auto px-6 py-6 text-[19px] leading-[1.9] font-medium"
          {...bindTap({ kind: 'action', id: 'transcript.page.tap' }, { onTrigger: () => showToast('已翻页') })}
          data-scroll-container data-scroll-direction="vertical"
        >
          <div className="opacity-95">{track?.transcript ?? '（本集暂无文字稿件）'}</div>
          <div className="mt-6 opacity-50 text-[13px]">左滑翻页 · 文稿由 AI 生成,仅供参考</div>
        </div>
        <div className="shrink-0 flex items-center justify-around py-4 text-white/90">
          <button {...bindTap('player.playlist-open')} aria-label="列表"><IcList size={22} /></button>
          <button {...bindTap({ kind: 'action', id: 'player.prevnext.select.opt' }, { params: { dir: 'prev' }, onTrigger: () => gotoTrack('prev') })} aria-label="上一集"><IcPrev size={26} /></button>
          <button
            {...bindTap({ kind: 'action', id: 'player.toggle.toggle' }, { onTrigger: () => togglePlay() })}
            className="w-14 h-14 rounded-full bg-white/95 text-black flex items-center justify-center"
            aria-label="播放/暂停"
          >
            {player.playing ? <IcPause size={26} /> : <IcPlay size={26} />}
          </button>
          <button {...bindTap({ kind: 'action', id: 'player.prevnext.select.opt' }, { params: { dir: 'next' }, onTrigger: () => gotoTrack('next') })} aria-label="下一集"><IcNext size={26} /></button>
          <button {...bindTap('player.timer-open')} aria-label="定时"><IcTimer size={22} /></button>
        </div>
      </div>
    );
  }

  // ============ 主态 ============
  const CtrlBtn = ({ icon, label, count, onProps }: { icon: React.ReactNode; label?: string; count?: number; onProps: any }) => (
    <button {...onProps} className="flex flex-col items-center gap-1 text-white/90 text-[11px]">
      {icon}
      <span>{count !== undefined ? formatCount(count) : label}</span>
    </button>
  );

  return (
    <div
      className="h-full flex flex-col pt-10 text-white relative"
      style={{ background: `linear-gradient(180deg, ${theme} 0%, #1b1b1b 78%)` }}
      data-status-bar-foreground="light"
    >
      {/* 顶栏 */}
      <div className="shrink-0 h-11 flex items-center px-1">
        <button
          {...bindTap({ kind: 'action', id: 'player.collapse.tap' }, { onTrigger: () => back() })}
          className="w-9 h-9 flex items-center justify-center" aria-label="收起"
        >
          <IcChevronDown size={26} />
        </button>
        <div className="flex-1 min-w-0 text-center">
          <div className="text-[15px] font-medium truncate px-2">{album?.title ?? '播放'}</div>
        </div>
        <button {...bindTap('player.share-open')} className="w-9 h-9 flex items-center justify-center" aria-label="分享"><IcShare size={20} /></button>
      </div>

      {/* 封面/文稿/周边 Tab */}
      <div className="shrink-0 flex items-center justify-center gap-8 text-[15px] mt-1">
        <button
          {...bindTap({ kind: 'action', id: 'player.tab.switch.select.opt' }, { params: { tab: '封面' }, onTrigger: () => setCoverTab('封面') })}
          className={coverTab === '封面' ? 'font-semibold' : 'opacity-60'}
        >{s.player_cover}</button>
        <button
          {...bindTap({ kind: 'action', id: 'player.tab.switch.select.opt' }, { params: { tab: '文稿' }, onTrigger: () => setCoverTab('文稿') })}
          className={coverTab === '文稿' ? 'font-semibold' : 'opacity-60'}
        >{s.player_transcript}</button>
        <button
          {...bindTap({ kind: 'action', id: 'player.tab.zhoubian.wontfix' }, { onTrigger: wontfix })}
          className="opacity-60"
        >{s.player_around}</button>
      </div>

      {/* 主滚动区(player-main) */}
      <div className="flex-1 overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
        {/* 大封面 / 文稿 */}
        <div className="px-8 pt-6">
          {coverTab === '封面' ? (
            <Img src={album?.cover ?? ''} className="w-full aspect-square rounded-2xl object-cover shadow-lg" />
          ) : (
            <div className="w-full aspect-square rounded-2xl bg-black/25 p-5 overflow-y-auto text-[15px] leading-[1.9]" data-scroll-container data-scroll-direction="vertical">
              <div className="opacity-90">{track?.transcript ?? '（本集暂无文字稿件）'}</div>
              <button {...bindTap('player.transcript-open')} className="mt-4 text-[13px] text-white/70 underline">进入全屏阅读</button>
            </div>
          )}
          <div className="mt-3 text-center text-[14px] truncate opacity-90">{track?.title}</div>
        </div>

        {/* 弹幕『弹』 */}
        <div className="px-8 mt-4 flex items-center gap-2">
          <button
            {...bindTap({ kind: 'action', id: 'player.danmaku.input' }, { onTrigger: () => setDanmaku('') })}
            className="px-3 h-7 rounded-full border border-white/40 text-[12px] text-white/90 flex items-center gap-1"
          >
            <IcComment size={13} /> 弹
          </button>
          <div className="flex-1 h-7 rounded-full bg-white/10 px-3 flex items-center text-[12px] text-white/50 truncate">
            听友们都在说点什么…
          </div>
        </div>

        {/* 下载/倍速/点赞/收藏/更多 一排 */}
        <div className="px-6 mt-5 flex items-center justify-between">
          <CtrlBtn icon={<IcDownload size={22} />} label={s.download}
            onProps={bindTap({ kind: 'action', id: 'player.download.tap' }, { onTrigger: () => showToast(s.added_to_download) })} />
          <CtrlBtn icon={<IcSpeed size={22} />} label={`${player.speed.toFixed(1)}x`}
            onProps={bindTap('player.speed-open')} />
          <CtrlBtn icon={<IcLike size={22} className={liked ? 'text-[#FE4543] fill-[#FE4543]' : ''} />} count={likeCount}
            onProps={bindTap({ kind: 'action', id: 'player.like.toggle' }, { onTrigger: () => toggleLikeTrack(track!.id) })} />
          <CtrlBtn icon={<IcStar size={22} className={collected ? 'text-[#F5C36B] fill-[#F5C36B]' : ''} />} count={collectCount}
            onProps={bindTap({ kind: 'action', id: 'player.collect.toggle' }, { onTrigger: () => { toggleCollect(track!.id); showToast(collected ? '已取消收藏' : '已收藏到「我收藏的声音」'); } })} />
          <CtrlBtn icon={<IcMore size={22} />} label={s.more}
            onProps={bindTap('player.more-open')} />
        </div>

        {/* 进度条 + 高清 + ±15s */}
        <div className="px-6 mt-5">
          <div className="flex items-center gap-3">
            <button {...bindTap({ kind: 'action', id: 'player.skip15.select.opt' }, { params: { dir: 'back' }, onTrigger: () => clampSeek(prog - 15) })} aria-label="后退15秒"><IcBack15 size={22} /></button>
            <div className="flex-1">
              <div
                ref={barRef}
                {...bindTap({ kind: 'action', id: 'player.seek.set' }, { params: { sec: Math.round(prog) }, onTrigger: () => {} })}
                onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); setDragging(true); clampSeek(seekFromClientX(e.clientX)); }}
                onPointerMove={(e) => { if (dragging) clampSeek(seekFromClientX(e.clientX)); }}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                className="py-2 cursor-pointer"
              >
                <div className="h-1 rounded-full bg-white/25 relative">
                  <div className="h-1 rounded-full bg-white" style={{ width: `${dur ? (prog / dur) * 100 : 0}%` }} />
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow" style={{ left: `calc(${dur ? (prog / dur) * 100 : 0}% - 6px)` }} />
                </div>
              </div>
            </div>
            <button {...bindTap({ kind: 'action', id: 'player.skip15.select.opt' }, { params: { dir: 'forward' }, onTrigger: () => clampSeek(prog + 15) })} aria-label="前进15秒"><IcForward15 size={22} /></button>
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px] text-white/70">
            <span>{formatDuration(prog)}</span>
            <button {...bindTap('player.quality-open')} className="px-2 py-0.5 rounded-full border border-white/30 text-white/80">{player.quality}</button>
            <span>{formatDuration(dur)}</span>
          </div>
        </div>

        {/* 列表/上一集/播放暂停/下一集/定时 */}
        <div className="px-6 mt-4 flex items-center justify-between">
          <button {...bindTap('player.playlist-open')} className="flex flex-col items-center text-[11px] text-white/80 gap-0.5" aria-label="列表"><IcList size={22} />{s.player_list}</button>
          <button {...bindTap({ kind: 'action', id: 'player.prevnext.select.opt' }, { params: { dir: 'prev' }, onTrigger: () => gotoTrack('prev') })} aria-label="上一集"><IcPrev size={30} /></button>
          <button
            {...bindTap({ kind: 'action', id: 'player.toggle.toggle' }, { onTrigger: () => togglePlay() })}
            className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-lg" aria-label="播放/暂停"
          >{player.playing ? <IcPause size={30} /> : <IcPlay size={30} />}</button>
          <button {...bindTap({ kind: 'action', id: 'player.prevnext.select.opt' }, { params: { dir: 'next' }, onTrigger: () => gotoTrack('next') })} aria-label="下一集"><IcNext size={30} /></button>
          <button {...bindTap('player.timer-open')} className="flex flex-col items-center text-[11px] text-white/80 gap-0.5" aria-label="定时"><IcTimer size={22} />{player.timerLabel || s.player_timer}</button>
        </div>

        {/* 下滑内容区(player-content) */}
        <div className="mt-6 bg-[#F5F5F5] text-[#333] rounded-t-2xl overflow-y-auto max-h-[62vh]" data-scroll-container data-scroll-direction="vertical">
          {/* 核心概览 */}
          <div className="p-4">
            <div className="text-[15px] font-semibold mb-1">核心概览</div>
            <div className="text-[13px] text-[#666] leading-relaxed line-clamp-3">{album?.intro}</div>
          </div>
          {/* 专辑卡 */}
          {album && (
            <div {...bindTap('player.album-open', { params: { id: album.id } })} className="mx-4 mb-3 bg-white rounded-xl p-3 flex items-center gap-3">
              <Img src={album.cover} className="w-14 h-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">{album.title}</div>
                <div className="text-[12px] text-[#999] mt-0.5 flex items-center gap-1"><IcHeadphones size={12} />{formatCount(album.playCount)} · 共{album.trackCount}集</div>
              </div>
              <IcChevronRight size={18} className="text-[#CCC]" />
            </div>
          )}
          {/* 主播 + 打赏 */}
          {anchor && (
            <div className="mx-4 mb-3 bg-white rounded-xl p-3 flex items-center gap-3">
              <div {...bindTap('player.anchor-open', { params: { id: anchor.id } })} className="flex items-center gap-3 flex-1 min-w-0">
                <Img src={anchor.avatar} className="w-10 h-10 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="text-[14px] font-medium truncate">{anchor.name}</div>
                  <div className="text-[12px] text-[#999]">{formatCount(anchor.fansCount)}粉丝</div>
                </div>
              </div>
              <button {...bindTap({ kind: 'action', id: 'player.reward.wontfix' }, { onTrigger: wontfix })} className="px-3 h-7 rounded-full bg-[#FFF0EF] text-[#FE4543] text-[12px]">打赏</button>
            </div>
          )}
          {/* 月票 / 投票 */}
          <div {...bindTap('player.ticket-open')} className="mx-4 mb-3 bg-white rounded-xl p-3 flex items-center gap-3">
            <IcTicket size={20} className="text-[#FE4543]" />
            <div className="flex-1 text-[13px]">本专辑月票 {album?.monthlyTicket ?? 0} 张 · 助力冲榜</div>
            <span className="px-3 h-7 rounded-full bg-[#FE4543] text-white text-[12px] flex items-center">去投票</span>
          </div>
          {/* 评论入口 */}
          <div {...bindTap('player.comment-open')} className="mx-4 mb-4 bg-white rounded-xl p-3 flex items-center gap-3">
            <IcComment size={20} className="text-[#666]" />
            <div className="flex-1 text-[13px]">{s.comment} · 听友们都在讨论</div>
            <IcChevronRight size={18} className="text-[#CCC]" />
          </div>
        </div>
      </div>

      {/* ============ 弹层(函数调用,避免闭包重渲染导致滚动重置) ============ */}
      {panel === 'more' && MoreSheet()}
      {panel === 'speed' && SpeedSheet()}
      {panel === 'timer' && TimerSheet()}
      {panel === 'quality' && QualitySheet()}
      {panel === 'playsettings' && PlaySettingsSheet()}
      {panel === 'downloadquality' && DownloadQualitySheet()}
      {panel === 'share' && ShareSheet()}
      {panel === 'playlist' && PlaylistSheet()}
      {panel === 'ticket' && TicketSheet()}

      {/* 弹幕输入弹窗(本地态) */}
      {danmaku !== null && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDanmaku(null)} />
          <div className="relative bg-white p-3 flex items-center gap-2" data-keep-keyboard="true">
            <input
              autoFocus value={danmaku} onChange={(e) => setDanmaku(e.target.value)}
              placeholder="发条弹幕…" className="flex-1 h-9 bg-[#F2F2F2] rounded-full px-3 text-[14px] text-[#333]"
              data-keep-keyboard="true"
            />
            <button onClick={() => { showToast(danmaku.trim() ? '弹幕已发送' : '弹幕已发送'); setDanmaku(null); }} className="px-4 h-9 rounded-full bg-[#FE4543] text-white text-[14px]">发送</button>
          </div>
        </div>
      )}

      {/* 更多菜单二级本地弹窗 */}
      {pop && LocalPop()}
    </div>
  );

  // —— 以下为闭包内子组件,复用外层 state/hooks ——

  function SheetRow({ icon, label, right, onProps, danger }: { icon?: React.ReactNode; label: string; right?: React.ReactNode; onProps?: any; danger?: boolean }) {
    return (
      <button {...(onProps ?? {})} className="w-full flex items-center gap-3 px-4 py-3 text-left">
        {icon && <span className={danger ? 'text-[#FE4543]' : 'text-[#555]'}>{icon}</span>}
        <span className="flex-1 text-[14px] text-[#333]">{label}</span>
        {right}
      </button>
    );
  }

  function Toggle({ on }: { on: boolean }) {
    return (
      <span className={`w-10 h-6 rounded-full flex items-center px-0.5 transition-colors ${on ? 'bg-[#FE4543] justify-end' : 'bg-[#DDD] justify-start'}`}>
        <span className="w-5 h-5 rounded-full bg-white shadow" />
      </span>
    );
  }

  function CloseBtn() {
    return <button {...bindBack()} className="absolute right-3 text-[#999]" aria-label="关闭"><IcClose size={20} /></button>;
  }

  function MoreSheet() {
    const top4 = [
      { label: s.share, icon: <IcShare size={22} />, onProps: bindTap('player.share-open') },
      { label: '月票', icon: <IcTicket size={22} />, onProps: bindTap('player.ticket-open') },
      { label: '边听边看', icon: <IcSparkles size={22} />, onProps: bindTap('player.watch-transcript') },
      { label: '跳过头尾', icon: <IcForward15 size={22} />, onProps: bindTap({ kind: 'action', id: 'more.skiphead.set' }, { onTrigger: () => setPop('skiphead') }) },
    ];
    return (
      <Sheet maxH="82%">
        <div className="grid grid-cols-4 gap-2 px-4 pt-4 pb-2">
          {top4.map((t) => (
            <button key={t.label} {...t.onProps} className="flex flex-col items-center gap-1 text-[12px] text-[#333]">
              <span className="w-11 h-11 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[#555]">{t.icon}</span>{t.label}
            </button>
          ))}
        </div>
        {/* 专辑行 / 主播行 */}
        {album && (
          <div {...bindTap('player.album-open', { params: { id: album.id } })} className="mx-4 my-2 bg-[#F7F7F7] rounded-xl p-2.5 flex items-center gap-3">
            <Img src={album.cover} className="w-11 h-11 rounded-lg object-cover" />
            <div className="flex-1 min-w-0"><div className="text-[13px] font-medium truncate">{album.title}</div><div className="text-[11px] text-[#999]">进入专辑</div></div>
            <IcChevronRight size={16} className="text-[#CCC]" />
          </div>
        )}
        {anchor && (
          <div {...bindTap('player.anchor-open', { params: { id: anchor.id } })} className="mx-4 mb-2 flex items-center gap-3 px-1">
            <Img src={anchor.avatar} className="w-9 h-9 rounded-full object-cover" />
            <div className="flex-1 text-[13px] text-[#333] truncate">{anchor.name}</div>
            <IcChevronRight size={16} className="text-[#CCC]" />
          </div>
        )}
        <div className="h-px bg-[#F2F2F2] my-1" />
        {/* 18 项 */}
        <SheetRow icon={<IcGift size={20} />} label="领积分" onProps={bindTap({ kind: 'action', id: 'more.points.wontfix' }, { onTrigger: wontfix })} />
        <SheetRow icon={<IcSettings size={20} />} label={s.player_playsettings} onProps={bindTap('player.playsettings-open')} />
        <SheetRow icon={<IcQuality size={20} />} label={s.player_quality} onProps={bindTap('player.quality-open')} />
        <SheetRow icon={<IcSkin size={20} />} label={s.player_skin} onProps={bindTap('player.skin-open')} />
        <SheetRow icon={<IcTimer size={20} />} label="定时关闭" onProps={bindTap('player.timer-open')} />
        <SheetRow icon={<IcTimer size={20} />} label="定时启播" onProps={bindTap({ kind: 'action', id: 'more.autostart.alarm' }, { onTrigger: () => setPop('alarm') })} />
        <SheetRow icon={<IcSparkles size={20} />} label="声音详情" onProps={bindTap('player.sounddetail-open', { params: { id: track?.id ?? '' } })} />
        <SheetRow icon={<IcAddList size={20} />} label="添加到听单" onProps={bindTap({ kind: 'action', id: 'more.addtolist.tap' }, { onTrigger: () => { if (track) toggleCollect(track.id); showToast('已加入「我收藏的声音」'); } })} />
        <SheetRow icon={<IcSparkles size={20} />} label="ka! 剪辑片段" onProps={bindTap({ kind: 'action', id: 'more.ka.wontfix' }, { onTrigger: wontfix })} />
        <SheetRow icon={<IcHeadphones size={20} />} label="设为铃声" onProps={bindTap({ kind: 'action', id: 'more.ringtone.wontfix' }, { onTrigger: wontfix })} />
        <SheetRow icon={<IcDownload size={20} />} label="下载节目" onProps={bindTap({ kind: 'action', id: 'more.download.tap' }, { onTrigger: () => showToast(s.added_to_download) })} />
        <SheetRow icon={<IcSparkles size={20} />} label="自动播放推荐内容" right={<Toggle on={autoplay} />} onProps={bindTap({ kind: 'action', id: 'more.autoplay.toggle' }, { onTrigger: () => setAutoplay((v) => !v) })} />
        <SheetRow icon={<IcCast size={20} />} label="连接外设" onProps={bindTap({ kind: 'action', id: 'more.castdevice.open' }, { onTrigger: () => setPop('cast') })} />
        <SheetRow icon={<IcCar size={20} />} label="驾驶模式" onProps={bindTap('player.driving-open')} />
        <SheetRow icon={<IcComment size={20} />} label="内容评价" onProps={bindTap('player.comment-open')} />
        <SheetRow icon={<IcFeedback size={20} />} label="意见反馈" onProps={bindTap('player.feedback-open')} />
        <SheetRow icon={<IcFlag size={20} />} label="举报" onProps={bindTap('player.report-open')} />
        <SheetRow icon={<IcCopyright size={20} />} label="版权申诉" onProps={bindTap('player.copyright-open')} />
      </Sheet>
    );
  }

  function SpeedSheet() {
    return (
      <Sheet title={s.player_speed} maxH="55%" onCloseNode={<CloseBtn />}>
        <div className="text-center py-4 text-[32px] font-semibold text-[#FE4543]">{player.speed.toFixed(1)}<span className="text-[16px]">x</span></div>
        <div className="flex items-center justify-around px-4 pb-4">
          {SPEED_OPTIONS.map((r) => (
            <button
              key={r}
              {...bindTap({ kind: 'action', id: 'speed.select.opt' }, { params: { rate: r }, onTrigger: () => setSpeed(r) })}
              className={`w-14 h-10 rounded-full text-[14px] ${player.speed === r ? 'bg-[#FE4543] text-white' : 'bg-[#F2F2F2] text-[#333]'}`}
            >{r.toFixed(1)}x</button>
          ))}
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'speed.scopetoggle.toggle' }, { onTrigger: () => setSpeedScope((v) => !v) })}
          className="w-full flex items-center gap-3 px-4 py-3 border-t border-[#F2F2F2]"
        >
          <span className="flex-1 text-left text-[14px] text-[#333]">只应用到本专辑</span>
          <Toggle on={speedScope} />
        </button>
      </Sheet>
    );
  }

  function TimerSheet() {
    return (
      <Sheet title={s.player_timer} maxH="65%" onCloseNode={<CloseBtn />}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#F2F2F2]">
          <span className="text-[14px] text-[#333]">{player.timerLabel ? `已设置:${player.timerLabel}` : '定时关闭'}</span>
          <button {...bindTap({ kind: 'action', id: 'timer.toggle.toggle' }, { onTrigger: () => setTimer(player.timerLabel ? '' : '不开启') })}><Toggle on={!!player.timerLabel} /></button>
        </div>
        <div className="px-4 pt-3 text-[13px] text-[#999]">{s.timer_by_time}</div>
        <div className="flex items-center gap-2 px-4 py-2 flex-wrap">
          {TIMER_TIME_OPTIONS.map((m) => (
            <button key={m} {...bindTap({ kind: 'action', id: 'timer.bytime.select.opt' }, { params: { min: m }, onTrigger: () => setTimer(`${m}分钟后`) })}
              className={`px-4 h-9 rounded-full text-[14px] ${player.timerLabel === `${m}分钟后` ? 'bg-[#FE4543] text-white' : 'bg-[#F2F2F2] text-[#333]'}`}>{m}分钟</button>
          ))}
          <button {...bindTap({ kind: 'action', id: 'timer.custom.wontfix' }, { onTrigger: wontfix })} className="px-4 h-9 rounded-full bg-[#F2F2F2] text-[#333] text-[14px]">自定义</button>
        </div>
        <div className="px-4 pt-2 text-[13px] text-[#999]">{s.timer_by_count}</div>
        <div className="flex items-center gap-2 px-4 py-2 pb-4 flex-wrap">
          {TIMER_COUNT_OPTIONS.map((c) => {
            const label = c === 1 ? '播完本集' : `播完${c}集`;
            return (
              <button key={c} {...bindTap({ kind: 'action', id: 'timer.bycount.select.opt' }, { params: { cnt: c }, onTrigger: () => setTimer(label) })}
                className={`px-4 h-9 rounded-full text-[14px] ${player.timerLabel === label ? 'bg-[#FE4543] text-white' : 'bg-[#F2F2F2] text-[#333]'}`}>{label}</button>
            );
          })}
        </div>
      </Sheet>
    );
  }

  function QualitySheet() {
    const list = qualityTab === '音质' ? QUALITIES : EFFECTS;
    return (
      <Sheet title={s.player_quality} maxH="70%" onCloseNode={<CloseBtn />}>
        <div {...bindTap('member.purchase-open')} className="mx-4 mt-3 rounded-xl bg-gradient-to-r from-[#F5C36B] to-[#E8A94E] px-4 py-2.5 flex items-center gap-2 text-[#5A4322]">
          <IcQuality size={18} /><span className="flex-1 text-[13px] font-medium">开会员畅享无损音质与音效</span><span className="text-[12px]">去开通 ›</span>
        </div>
        <div className="flex items-center gap-6 px-4 pt-4 text-[15px]">
          {(['音质', '音效'] as const).map((t) => (
            <button key={t} {...bindTap({ kind: 'action', id: 'quality.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setQualityTab(t) })}
              className={qualityTab === t ? 'font-semibold text-[#333] border-b-2 border-[#FE4543] pb-1' : 'text-[#999] pb-1'}>{t}</button>
          ))}
        </div>
        <div className="py-2">
          {list.map((item) => {
            const active = player.quality === item.q;
            return (
              <div key={item.q} className="flex items-center px-4 py-3">
                <div className="flex-1">
                  <div className="text-[14px] text-[#333] flex items-center gap-1">{item.q}{item.vip && <span className="text-[10px] px-1 rounded bg-[#F5C36B] text-[#7A5B2E]">VIP</span>}</div>
                  <div className="text-[11px] text-[#999]">{(item as any).desc ?? '音效增强'}</div>
                </div>
                {active ? (
                  <span className="text-[13px] text-[#FE4543] flex items-center gap-1"><IcCheck size={16} />使用中</span>
                ) : item.vip ? (
                  <button {...bindTap({ kind: 'action', id: 'quality.vip.use.select.opt' }, { params: { q: item.q }, onTrigger: () => isVip ? setQuality(item.q) : showToast('开通 VIP 后可使用') })}
                    className="px-3 h-8 rounded-full bg-[#FFF7E8] text-[#B8860B] text-[13px]">使用</button>
                ) : (
                  <button {...bindTap({ kind: 'action', id: 'quality.use.select.opt' }, { params: { q: item.q }, onTrigger: () => setQuality(item.q) })}
                    className="px-3 h-8 rounded-full bg-[#F2F2F2] text-[#333] text-[13px]">使用</button>
                )}
              </div>
            );
          })}
        </div>
      </Sheet>
    );
  }

  function PlaySettingsSheet() {
    return (
      <Sheet title={s.player_playsettings} maxH="45%" onCloseNode={<CloseBtn />}>
        <SheetRow label="与其他应用同时播放" right={<Toggle on={mix} />} onProps={bindTap({ kind: 'action', id: 'playset.mix.toggle' }, { onTrigger: () => setMix((v) => !v) })} />
        <SheetRow label="锁屏显示歌词/封面" right={<Toggle on={lock} />} onProps={bindTap({ kind: 'action', id: 'playset.lock.toggle' }, { onTrigger: () => setLock((v) => !v) })} />
        <SheetRow label="查看帮助" right={<IcChevronRight size={16} className="text-[#CCC]" />} onProps={bindTap({ kind: 'action', id: 'playset.help.wontfix' }, { onTrigger: wontfix })} />
      </Sheet>
    );
  }

  function DownloadQualitySheet() {
    return (
      <Sheet title="选择下载音质" maxH="45%" onCloseNode={<CloseBtn />}>
        {QUALITIES.map((item) => (
          <button key={item.q} {...bindTap({ kind: 'action', id: 'dlquality.select.opt' }, { params: { q: item.q }, onTrigger: () => { showToast(s.added_to_download); back(); } })}
            className="w-full flex items-center px-4 py-3 text-left">
            <span className="flex-1 text-[14px] text-[#333]">{item.q}{item.vip && <span className="ml-1 text-[10px] px-1 rounded bg-[#F5C36B] text-[#7A5B2E]">VIP</span>}</span>
          </button>
        ))}
        <button {...bindBack()} className="w-full py-3 text-center text-[14px] text-[#999] border-t border-[#F2F2F2]">{s.cancel}</button>
      </Sheet>
    );
  }

  function ShareSheet() {
    return (
      <Sheet title={s.share} maxH="50%" onCloseNode={<CloseBtn />}>
        <div className="text-[13px] text-[#999] px-4 pt-3">分享至</div>
        <div className="grid grid-cols-5 gap-2 px-4 py-3">
          {SHARE_CHANNELS.map((c) => (
            <button key={c} {...bindTap({ kind: 'action', id: 'share.thirdparty.wontfix.v2' }, { onTrigger: wontfix })} className="flex flex-col items-center gap-1 text-[11px] text-[#333]">
              <span className="w-11 h-11 rounded-full bg-[#F2F2F2] flex items-center justify-center text-[#888]"><IcShare size={18} /></span>{c}
            </button>
          ))}
        </div>
        <div className="text-[13px] text-[#999] px-4">你还可以</div>
        <div className="grid grid-cols-3 gap-2 px-4 py-3">
          {['视频片段', '制作海报', '星球海报'].map((c) => (
            <button key={c} {...bindTap({ kind: 'action', id: 'share.poster.wontfix' }, { onTrigger: wontfix })} className="flex flex-col items-center gap-1 text-[11px] text-[#333]">
              <span className="w-11 h-11 rounded-lg bg-[#F2F2F2] flex items-center justify-center text-[#888]"><IcSparkles size={18} /></span>{c}
            </button>
          ))}
        </div>
      </Sheet>
    );
  }

  function PlaylistSheet() {
    const ordered = playlistAsc ? albumTracks : [...albumTracks].reverse();
    return (
      <Sheet
        title={`${album?.title ?? ''} · ${albumTracks.length}集`}
        maxH="72%"
        onCloseNode={<CloseBtn />}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#F2F2F2]">
          <button {...bindTap({ kind: 'action', id: 'playlist.sort.toggle' }, { onTrigger: () => setPlaylistAsc((v) => !v) })} className="text-[13px] text-[#666] flex items-center gap-1">
            <IcList size={16} />{playlistAsc ? '正序' : '倒序'}
          </button>
          <button {...bindTap('player.downloadquality-open')} className="text-[13px] text-[#666] flex items-center gap-1"><IcDownload size={16} />批量下载</button>
        </div>
        {ordered.map((t) => {
          const cur = t.id === track?.id;
          return (
            <button key={t.id} {...bindTap({ kind: 'action', id: 'playlist.play.select.opt' }, { params: { trackId: t.id }, onTrigger: () => { if (album) playTrack(album.id, t.id); setProg(0); } })}
              className="w-full flex items-center gap-3 px-4 py-3 text-left">
              <span className={`text-[13px] flex-1 truncate ${cur ? 'text-[#FE4543]' : 'text-[#333]'}`}>{t.title}</span>
              {cur && <IcHeadphones size={16} className="text-[#FE4543]" />}
              <span className="text-[11px] text-[#999]">{formatDuration(t.durationSec)}</span>
            </button>
          );
        })}
      </Sheet>
    );
  }

  function TicketSheet() {
    return (
      <Sheet title="月票" maxH="70%" onCloseNode={<CloseBtn />}>
        <div className="px-4 py-3 text-center">
          <div className="text-[26px] font-semibold text-[#FE4543]">{album?.monthlyTicket ?? 0}</div>
          <div className="text-[12px] text-[#999]">本专辑月票 · 距上一名还差 12 张</div>
        </div>
        <div className="flex items-center gap-6 px-4 text-[15px] border-b border-[#F2F2F2]">
          {(['领月票', '投月票'] as const).map((t) => (
            <button key={t} {...bindTap({ kind: 'action', id: 'ticket.tab.select.opt' }, { params: { tab: t }, onTrigger: () => setTicketTab(t) })}
              className={ticketTab === t ? 'font-semibold text-[#333] border-b-2 border-[#FE4543] pb-2' : 'text-[#999] pb-2'}>{t}</button>
          ))}
        </div>
        {ticketTab === '领月票' ? (
          <div className="p-4 flex flex-col gap-3">
            <div className="bg-[#F7F7F7] rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1"><div className="text-[14px]">收听专辑领月票</div><div className="text-[11px] text-[#999]">0/2</div></div>
              <button {...bindTap({ kind: 'action', id: 'ticket.listen.tap' }, { onTrigger: () => back() })} className="px-3 h-8 rounded-full bg-[#FE4543] text-white text-[13px]">去收听</button>
            </div>
            <div className="bg-[#F7F7F7] rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1"><div className="text-[14px]">看视频领月票</div><div className="text-[11px] text-[#999]">0/16</div></div>
              <button {...bindTap({ kind: 'action', id: 'ticket.video.fake' }, { onTrigger: () => setPop('ticketVideo') })} className="px-3 h-8 rounded-full bg-[#FE4543] text-white text-[13px]">去获取</button>
            </div>
            <button {...bindTap('member.purchase-open')} className="mt-2 py-2.5 rounded-full bg-gradient-to-r from-[#F5C36B] to-[#E8A94E] text-[#5A4322] text-[14px] font-medium">领超级月票 · 开通 SVIP</button>
          </div>
        ) : (
          <div className="p-4 flex flex-col gap-3">
            <div className="text-[13px] text-[#666]">你有 3 张月票可投给本专辑</div>
            <button {...bindTap({ kind: 'action', id: 'ticket.vote.tap' }, { onTrigger: () => showToast('已投出月票,助力冲榜成功') })} className="py-2.5 rounded-full bg-[#FE4543] text-white text-[14px]">投出月票</button>
          </div>
        )}
      </Sheet>
    );
  }

  function LocalPop() {
    let title = '', body: React.ReactNode = null;
    if (pop === 'skiphead') {
      title = '跳过头尾';
      body = (
        <div className="px-4 py-3 flex flex-col gap-4">
          {['跳过片头', '跳过片尾'].map((t) => (
            <div key={t}>
              <div className="flex justify-between text-[13px] text-[#333] mb-1"><span>{t}</span><span className="text-[#999]">15 秒</span></div>
              <div className="h-1 rounded-full bg-[#EEE]"><div className="h-1 rounded-full bg-[#FE4543] w-1/4" /></div>
            </div>
          ))}
          <button onClick={() => { setPop(null); showToast('已设置跳过头尾'); }} className="mt-1 py-2.5 rounded-full bg-[#FE4543] text-white text-[14px]">{s.confirm}</button>
        </div>
      );
    } else if (pop === 'alarm') {
      title = '定时启播';
      body = (
        <div className="px-4 py-4 flex flex-col gap-3">
          <div className="text-[13px] text-[#666]">到点自动播放,铃声为当前声音《{track?.title}》</div>
          <div className="text-[40px] font-semibold text-center text-[#333]">07:30</div>
          <button onClick={() => { setPop(null); showToast('已添加定时启播闹钟'); }} className="py-2.5 rounded-full bg-[#FE4543] text-white text-[14px]">添加闹钟</button>
        </div>
      );
    } else if (pop === 'cast') {
      title = '选择设备';
      body = (
        <div className="py-2">
          {CAST_DEVICES.map((d) => (
            <button key={d} onClick={() => { setPop(null); showToast(`已连接到「${d}」`); }} className="w-full flex items-center gap-3 px-4 py-3 text-left">
              <IcWifi size={18} className="text-[#888]" /><span className="flex-1 text-[14px] text-[#333]">{d}</span>
            </button>
          ))}
        </div>
      );
    } else if (pop === 'ticketVideo') {
      title = '看视频领月票';
      body = (
        <div className="px-4 py-6 flex flex-col items-center gap-3">
          <div className="w-full h-32 rounded-xl bg-black/80 flex items-center justify-center text-white/70 text-[13px]">视频广告播放中…(模拟)</div>
          <button onClick={() => { setPop(null); showToast('已领取 2 张月票'); }} className="py-2.5 px-8 rounded-full bg-[#FE4543] text-white text-[14px]">领取并返回收听</button>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end">
        <div className="absolute inset-0 bg-black/50" onClick={() => setPop(null)} />
        <div className="relative bg-white rounded-t-2xl pb-2">
          <div className="h-12 flex items-center justify-center border-b border-[#F2F2F2] relative">
            <span className="text-[15px] font-medium text-[#333]">{title}</span>
            <button onClick={() => setPop(null)} className="absolute right-3 text-[#999]"><IcClose size={20} /></button>
          </div>
          {body}
        </div>
      </div>
    );
  }
}

import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, SectionHeader } from '../components/ui';
import { ChannelTopBar } from '../components/ChannelTopBar';
import type { DoubanSubject } from '../types';

// 书影音-播客频道:今日推荐单集横滑(播放/加入列表)+ 年度榜单双入口 + 分类找播客 + 订阅 + 猜你喜欢。

// 分类找播客 emoji 色块(与 podcast.category 页分类集一致;真机单行横滑)
const PODCAST_CATS: { emoji: string; label: string; bg: string }[] = [
  { emoji: '💼', label: '商业科技', bg: '#EAF3FE' },
  { emoji: '🪴', label: '自我成长', bg: '#EAF8EE' },
  { emoji: '🧬', label: '健康与生活', bg: '#FFF4E5' },
  { emoji: '🌏', label: '科学与自然', bg: '#F0EDFB' },
  { emoji: '📜', label: '人文历史', bg: '#FDF0EC' },
  { emoji: '🎬', label: '影视娱乐', bg: '#FDEBF2' },
  { emoji: '📖', label: '阅读', bg: '#EFF6F0' },
  { emoji: '📰', label: '新闻资讯', bg: '#EEF1F6' },
];

export default function BmPodcastPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const rankings = useDoubanStore((s) => s.rankings);
  const notifications = useDoubanStore((s) => s.notifications);
  const toast = useDoubanStore((s) => s.toast);
  const startPlayer = useDoubanStore((s) => s.startPlayer);
  const subs = useDoubanStore((s) => s.podcastSubscriptions);
  const toggleSub = useDoubanStore((s) => s.togglePodcastSubscription);
  const unread = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const casts = React.useMemo(() => subjects.filter((s) => s.type === 'podcast'), [subjects]);
  const top10 = React.useMemo(() => rankings.find((r) => r.kind === 'music'), [rankings]);

  const channels: { ch: string; label: string }[] = [
    { ch: 'movie', label: '电影' },
    { ch: 'tv', label: '电视' },
    { ch: 'book', label: '读书' },
    { ch: 'podcast', label: '播客' },
    { ch: 'music', label: '音乐' },
    { ch: 'city', label: '同城' },
  ];

  const play = (c: DoubanSubject) =>
    startPlayer({
      title: c.title,
      sub: c.showName ?? '',
      cover: c.cover,
      remainingText: `剩余 ${c.durationText ?? ''}`,
      playing: true,
      actions: {
        toggle: { id: 'bm.podcast.fakePlayer.start' },
        close: { id: 'bm.podcast.fakePlayer.start' },
      },
    });

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <ChannelTopBar
        menuBinding={bindTap('bm.podcast.drawer-open')}
        searchBinding={bindTap('bm.podcast.search-open')}
        audioBinding={bindTap('bm.podcast.subscriptions-open')}
        messageBinding={bindTap('bm.podcast.message-open')}
        searchText="搜索播客/单集"
        unread={unread}
        audioLabel="我的播客"
      />

      {/* 二级频道Tab条:六个Tab均匀铺满,当前项黑粗+短黑下划线(对齐真机 t0005) */}
      <div className="flex items-center h-10 shrink-0 bg-white overflow-x-auto" data-scroll-container="channel-tabs" data-scroll-direction="horizontal">
        {channels.map((c) => {
          const active = c.ch === 'podcast';
          const inner = (
            <>
              <span className={`text-sm ${active ? 'font-bold' : ''}`} style={{ color: active ? C.text : C.sub }}>{c.label}</span>
              <span className="mt-1 rounded-full" style={{ width: 22, height: 3, background: active ? C.text : 'transparent' }} />
            </>
          );
          return active ? (
            <span key={c.ch} className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5">{inner}</span>
          ) : (
            <button
              key={c.ch}
              {...bindTap('bm.podcast.channelTab-open', { params: { channel: c.ch } })}
              className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5 bg-transparent border-none cursor-pointer"
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 今日播客推荐单集大卡横滑 */}
        <SectionHeader title="今日播客推荐" />
        <div className="flex gap-3 px-4 pb-2 overflow-x-auto" data-scroll-container="today-casts" data-scroll-direction="horizontal">
          {casts.map((c) => (
            <div key={c.id} className="shrink-0 w-56 rounded-xl p-3 bg-white" style={{ border: `1px solid ${C.border}` }}>
              <button {...bindTap('bm.podcast.episode-open', { params: { episodeId: c.id } })} className="w-full flex gap-2 text-left bg-transparent border-none cursor-pointer">
                <Img src={c.cover} className="w-14 h-14 rounded object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{c.title}</div>
                  <div className="text-[10px] truncate" style={{ color: C.sub }}>{c.showName} · {c.durationText}</div>
                </div>
              </button>
              <div className="flex items-center gap-2 mt-2">
                <button {...bindTap({ kind: 'action', id: 'bm.podcast.playlist.add' }, { onTrigger: () => toast('已添加到播放列表') })} className="flex items-center gap-1 h-8 px-3 rounded-full text-xs border cursor-pointer" style={{ borderColor: C.border, color: C.sub, background: 'transparent' }}>＋≡ 加入播放列表</button>
                <div className="flex-1" />
                <button {...bindTap({ kind: 'action', id: 'bm.podcast.fakePlayer.start' }, { onTrigger: () => play(c) })} className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: C.orange }} aria-label="播放">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 播客马拉松 全宽广告横幅(真机 IMG_0373:PODCAST MARATHON · 立即收听 · 广告 角标),静态非交互 */}
        <div className="px-4 pt-3">
          <div className="relative w-full rounded-xl px-4 py-3 flex items-center gap-3 overflow-hidden" style={{ background: 'linear-gradient(135deg, #2B2140 0%, #5B3A8C 100%)' }}>
            <span className="text-2xl shrink-0">🎙️</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold" style={{ color: '#fff' }}>豆瓣播客马拉松</div>
              <div className="text-[10px] tracking-widest mt-0.5" style={{ color: '#C9B8E8' }}>PODCAST MARATHON</div>
            </div>
            <span className="shrink-0 h-7 px-3 rounded-full flex items-center text-xs font-semibold" style={{ background: C.orange, color: '#fff' }}>立即收听</span>
            <span className="absolute top-1 right-1.5 text-[9px]" style={{ color: 'rgba(255,255,255,0.5)' }}>广告</span>
          </div>
        </div>

        {/* 豆瓣榜单 · 本周热门单集Top10 灰卡(真机该处结构;进榜单详情) */}
        {top10 && (
          <div className="px-4 pt-3">
            <button {...bindTap('bm.podcast.ranklist-open', { params: { listId: top10.id } })} className="w-full rounded-xl px-4 py-3 flex items-center gap-3 text-left cursor-pointer border-none" style={{ background: '#F2F3F5' }}>
              <span className="text-lg shrink-0">🏆</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold" style={{ color: C.text }}>本周热门单集 Top10</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>豆瓣榜单 · 每周一更新</div>
              </div>
              <span className="text-lg shrink-0" style={{ color: C.sub }}>›</span>
            </button>
          </div>
        )}

        {/* 分类找播客 */}
        <SectionHeader
          title={
            <button {...bindTap('bm.podcast.category-open')} className="flex items-center gap-1 p-0 text-base font-bold bg-transparent border-none cursor-pointer" style={{ color: C.text }}>
              分类找播客 <span className="text-sm font-normal" style={{ color: C.sub }}>›</span>
            </button>
          }
          extra={
            <button {...bindTap({ kind: 'action', id: 'bm.podcast.rssSubmit.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>提交RSS创建播客节目</button>
          }
        />
        <div className="flex gap-2 px-4 pb-1 overflow-x-auto" data-scroll-container="podcast-cats" data-scroll-direction="horizontal">
          {PODCAST_CATS.map((cat) => (
            <button key={cat.label} {...bindTap('bm.podcast.category-open')} className="shrink-0 flex flex-col items-center justify-center gap-1.5 w-16 h-16 rounded-xl border cursor-pointer" style={{ background: cat.bg, borderColor: C.border }}>
              <span className="text-lg">{cat.emoji}</span>
              <span className="text-[11px]" style={{ color: C.text }}>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* 近期精选播单 | 我的播单:热点播客大卡 */}
        {casts[0] && (
          <>
            <SectionHeader title="近期精选播单" />
            <div className="px-4">
              <button {...bindTap('bm.podcast.episode-open', { params: { episodeId: casts[0].id } })} className="w-full flex items-center gap-3 rounded-xl p-3 text-left border-none cursor-pointer" style={{ background: C.dark }}>
                <Img src={casts[0].cover} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate" style={{ color: C.darkText }}>{casts[0].showName ?? casts[0].title}</div>
                  <div className="text-[11px] mt-1" style={{ color: '#B9BEC6' }}>{casts[0].episodeCount ?? 18}期内容 · 20小时</div>
                </div>
                <span className="text-lg" style={{ color: C.darkText }}>›</span>
              </button>
            </div>
          </>
        )}

        {/* 猜你喜欢的播客:封面横滑 + 名称 + 分类标签 + 米底橙字♡订阅 */}
        <SectionHeader title="猜你喜欢的播客" />
        <div className="flex gap-3 px-4 pb-2 overflow-x-auto" data-scroll-container="guess-casts" data-scroll-direction="horizontal">
          {casts.map((c) => {
            const subscribed = subs.includes(c.id);
            return (
              <div key={c.id} className="shrink-0 w-28 flex flex-col">
                <button {...bindTap('bm.podcast.episode-open', { params: { episodeId: c.id } })} className="text-left bg-transparent border-none cursor-pointer p-0">
                  <Img src={c.cover} className="w-28 h-28 rounded-lg object-cover" />
                  <div className="mt-1.5 text-xs font-semibold truncate" style={{ color: C.text }}>{c.showName}</div>
                  <div className="text-[10px] truncate" style={{ color: C.sub }}>{c.genres?.[0] ?? '社会与人文'}</div>
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'bm.podcast.subscribe.toggle' }, { onTrigger: () => toggleSub(c.id) })}
                  className="mt-1.5 h-7 rounded-full text-xs cursor-pointer flex items-center justify-center gap-1"
                  style={subscribed ? { background: '#F2F3F5', color: C.sub, border: 'none' } : { background: '#FFF4E5', color: C.orange, border: 'none' }}
                >
                  {subscribed ? '✓ 已订阅' : '♡ 订阅'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

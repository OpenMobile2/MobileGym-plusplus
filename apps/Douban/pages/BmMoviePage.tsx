import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Stars, RatingLine } from '../components/ui';
import { ChannelFinderSection } from '../components/ChannelFinderSection';
import { ChannelTopBar } from '../components/ChannelTopBar';
import type { DoubanSubject } from '../types';

/** 快捷入口绿色线性图标(对齐真机 IMG_0468:线描风格,「豆瓣榜单」领奖台带金星) */
function EntryIcon({ name }: { name: 'finder' | 'rank' | 'clock' | 'playlist' }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: C.green,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (name) {
    case 'finder':
      return (
        <svg {...common}>
          <circle cx="10.5" cy="10.5" r="6.3" />
          <path d="M15.3 15.3L20 20" />
          <path d="M9.3 8.3v4.4l3.7-2.2z" fill={C.green} stroke="none" />
        </svg>
      );
    case 'rank':
      return (
        <svg {...common}>
          <path d="M9.3 20v-7.5h5.4V20" />
          <path d="M3.8 20v-4.4h5.5" />
          <path d="M20.2 20v-4.4h-5.5" />
          <path d="M3 20h18" />
          <path d="M12 2.6l.95 1.9 2.1.3-1.5 1.5.35 2.1L12 7.4l-1.9 1 .35-2.1-1.5-1.5 2.1-.3z" fill={C.gold} stroke="none" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12.5" r="7.6" />
          <path d="M12 8.6v3.9l2.7 1.9" />
        </svg>
      );
    case 'playlist':
      return (
        <svg {...common}>
          <path d="M7 4.2h10" />
          <rect x="4" y="7.2" width="16" height="13" rx="2.4" />
          <path d="M10.6 10.8v5l4.2-2.5z" fill={C.green} stroke="none" />
        </svg>
      );
  }
}

// 书影音-电影频道:热映横滑 + 榜单大卡 + 即将上映入口。
export default function BmMoviePage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const rankings = useDoubanStore((s) => s.rankings);
  const notifications = useDoubanStore((s) => s.notifications);
  const toast = useDoubanStore((s) => s.toast);
  const unread = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const movies = React.useMemo(
    () => subjects.filter((s) => s.type === 'movie'),
    [subjects],
  );
  const movieRanks = React.useMemo(
    () => rankings.filter((r) => r.kind === 'movie' || r.kind === 'tv'),
    [rankings],
  );
  const byId = React.useMemo(() => {
    const m: Record<string, DoubanSubject> = {};
    subjects.forEach((s) => (m[s.id] = s));
    return m;
  }, [subjects]);

  const channels: { ch: string; label: string }[] = [
    { ch: 'movie', label: '电影' },
    { ch: 'tv', label: '电视' },
    { ch: 'book', label: '读书' },
    { ch: 'podcast', label: '播客' },
    { ch: 'music', label: '音乐' },
    { ch: 'city', label: '同城' },
  ];

  /** 榜单大卡渐变皮肤(对齐真机 IMG_0468:深蓝/墨绿彩色卡) */
  const rankGradients = [
    'linear-gradient(155deg, #2456C8 0%, #122E7E 100%)',
    'linear-gradient(155deg, #1D7A50 0%, #0B3D28 100%)',
    'linear-gradient(155deg, #7A3FA8 0%, #3C1E5E 100%)',
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <ChannelTopBar
        menuBinding={bindTap('bm.movie.drawer-open')}
        searchBinding={bindTap('bm.movie.search-open')}
        audioBinding={bindTap({ kind: 'action', id: 'bm.movie.headset.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
        messageBinding={bindTap('bm.movie.message-open')}
        searchText="暑期档新片预售遇冷"
        unread={unread}
      />

      {/* 二级频道Tab条:六个Tab均匀铺满,当前项黑粗+短黑下划线(对齐真机 IMG_0468) */}
      <div className="flex items-center h-10 shrink-0 bg-white overflow-x-auto" data-scroll-container="channel-tabs" data-scroll-direction="horizontal">
        {channels.map((c) => {
          const active = c.ch === 'movie';
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
              {...bindTap('bm.movie.channelTab-open', { params: { channel: c.ch } })}
              className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5 bg-transparent border-none cursor-pointer"
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 快捷入口:圆角白卡片 + 绿色线性图标(对齐真机 IMG_0468) */}
        <div className="grid grid-cols-4 gap-2 px-3 py-3">
          <button {...bindTap({ kind: 'action', id: 'bm.movie.finder.scrollTo' }, { onTrigger: () => document.getElementById('finder-movie')?.scrollIntoView({ behavior: 'smooth' }) })} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="finder" />
            <span className="text-[11px]" style={{ color: C.text }}>找电影</span>
          </button>
          <button {...bindTap('bm.movie.rankhub-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="rank" />
            <span className="text-[11px]" style={{ color: C.text }}>豆瓣榜单</span>
          </button>
          <button {...bindTap('bm.movie.upcoming-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="clock" />
            <span className="text-[11px]" style={{ color: C.text }}>即将上映</span>
          </button>
          <button {...bindTap('bm.movie.rankhub-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="playlist" />
            <span className="text-[11px]" style={{ color: C.text }}>豆瓣片单</span>
          </button>
        </div>

        {/* 热映电影横滑卡:双标题「影院热映|豆瓣热门」+ 右侧「全部 72 ›」 */}
        <div className="flex items-baseline gap-3 px-4 pt-1 pb-2">
          <span className="text-lg font-bold" style={{ color: C.text }}>影院热映</span>
          <span className="text-lg" style={{ color: C.border }}>|</span>
          <span className="text-lg" style={{ color: C.sub }}>豆瓣热门</span>
          <button {...bindTap('bm.movie.hotList-open')} className="ml-auto text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>全部 72 ›</button>
        </div>
        <div className="flex gap-3 px-4 pb-2 overflow-x-auto" data-scroll-container="hot-movies" data-scroll-direction="horizontal">
          {movies.map((m) => (
            <div key={m.id} className="shrink-0 w-24 relative">
              <button
                {...bindTap('bm.movie.item-open', { params: { itemId: m.id } })}
                className="block w-full text-left bg-transparent border-none cursor-pointer"
              >
                <Img src={m.cover} className="w-24 rounded-md object-cover" style={{ height: 134 }} />
                <div className="mt-1 text-[15px] font-medium truncate" style={{ color: C.text }}>{m.title}</div>
                <div className="mt-0.5"><RatingLine rating={m.rating} size={10} /></div>
              </button>
              <button
                {...bindTap('bm.movie.mark-open', { beforeTrigger: () => addHistory('subject', m.id) })}
                className="absolute top-1 left-1 w-7 h-7 rounded-lg border-none cursor-pointer flex items-center justify-center text-[11px] text-white"
                style={{ background: 'rgba(0,0,0,0.35)' }}
                aria-label="想看"
              >
                ♡+
              </button>
            </div>
          ))}
        </div>

        {/* 即将上映双入口卡:大号加粗标题 + 行末独立「›」+ 两行副文案 + 海报贴右下(对齐真机 IMG_0468) */}
        <div className="px-4 pt-2">
          <div className="flex gap-3">
            <button {...bindTap('bm.movie.upcoming-open')} className="flex-1 rounded-xl p-3.5 text-left border-none cursor-pointer relative overflow-hidden bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold truncate" style={{ color: C.text }}>国内即将上映</span>
                <span className="text-base shrink-0" style={{ color: '#C3C9D1' }}>›</span>
              </div>
              <div className="mt-1.5 text-xs leading-5" style={{ color: C.sub }}>近期有5部<br />热门电影</div>
              {movies[0] && <Img src={movies[0].cover} className="absolute right-2.5 bottom-2.5 w-12 rounded-md object-cover" style={{ height: 64 }} />}
            </button>
            <button {...bindTap('bm.movie.upcoming-open')} className="flex-1 rounded-xl p-3.5 text-left border-none cursor-pointer relative overflow-hidden bg-white">
              <div className="flex items-center justify-between">
                <span className="text-[16px] font-bold truncate" style={{ color: C.text }}>全球值得期待</span>
                <span className="text-base shrink-0" style={{ color: '#C3C9D1' }}>›</span>
              </div>
              <div className="mt-1.5 text-xs leading-5" style={{ color: C.sub }}>近期有4部<br />热门电影</div>
              {movies[1] && <Img src={movies[1].cover} className="absolute right-2.5 bottom-2.5 w-12 rounded-md object-cover" style={{ height: 64 }} />}
            </button>
          </div>
        </div>

        {/* 豆瓣榜单大卡横滑:深色渐变图底卡,「豆瓣榜单」小标在卡内左上(对齐真机 IMG_0468,无外置区块标题) */}
        <div className="flex gap-3 px-4 pt-3 overflow-x-auto" data-scroll-container="rank-cards" data-scroll-direction="horizontal">
          {movieRanks.map((r, ri) => (
            <button
              key={r.id}
              {...bindTap('bm.movie.ranklist-open', { params: { listId: r.id } })}
              className="shrink-0 w-72 rounded-xl p-3.5 text-left border-none cursor-pointer"
              style={{ background: rankGradients[ri % rankGradients.length] }}
            >
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>豆瓣榜单</div>
              <div className="text-lg font-bold mt-0.5 mb-2 truncate text-white">{ri === 0 ? '🔥 ' : ''}{r.title}</div>
              {r.items.slice(0, 3).map((it, i) => {
                const sub = byId[it.subjectId];
                if (!sub) return null;
                return (
                  <div key={it.subjectId} className="flex items-center gap-2.5 py-1">
                    <span className="text-sm w-3 shrink-0 text-white">{i + 1}</span>
                    <Img src={sub.cover} className="w-10 rounded object-cover shrink-0" style={{ height: 56 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate text-white">{sub.title}</div>
                      <div className="mt-0.5 flex items-center gap-1">
                        {sub.rating != null && sub.rating > 0 ? (
                          <>
                            <Stars value={sub.rating} size={10} />
                            <span className="text-xs font-semibold" style={{ color: C.orange }}>{sub.rating.toFixed(1)}</span>
                          </>
                        ) : (
                          <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>暂无评分</span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{i < 2 ? '↑' : '–'}</span>
                  </div>
                );
              })}
            </button>
          ))}
        </div>

        {/* 找电影 内嵌筛选 section(快捷钮滚动定位到此) */}
        {/* 定档热门电影推荐卡(rec63fb7d:榜单大卡与找电影之间;→即将上映) */}
        <div className="px-4 pt-3">
          <button {...bindTap('bm.movie.upcoming-open')} className="w-full flex items-center gap-3 rounded-xl bg-white p-3.5 text-left border-none cursor-pointer">
            <span className="grid grid-cols-2 gap-0.5 shrink-0 rounded-lg overflow-hidden" style={{ width: 64, height: 64 }}>
              {movies.slice(0, 4).map((m) => <Img key={m.id} src={m.cover} className="w-full h-full object-cover" />)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[15px] font-bold truncate" style={{ color: C.text }}>2026年07月定档热门电影推荐</span>
              <span className="block mt-1 text-xs" style={{ color: C.sub }}>共30部</span>
            </span>
            <span className="text-base shrink-0" style={{ color: '#C3C9D1' }}>›</span>
          </button>
        </div>

        <ChannelFinderSection channel="movie" />
      </div>
    </div>
  );
}

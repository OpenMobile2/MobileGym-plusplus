import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Stars, RatingLine, Chip } from '../components/ui';
import { ChannelFinderSection } from '../components/ChannelFinderSection';
import { ChannelTopBar } from '../components/ChannelTopBar';
import type { DoubanSubject } from '../types';

/** 快捷入口绿色线性图标(对齐真机 IMG_0359:线描风格,「豆瓣榜单」领奖台带金星,「播出时间表」日历) */
function EntryIcon({ name }: { name: 'finder' | 'rank' | 'clock' | 'calendar' }) {
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
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3.8" y="5" width="16.4" height="15" rx="2.4" />
          <path d="M8 3v3.6M16 3v3.6M3.8 9.8h16.4" />
          <path d="M9 14.6l2.1 2.1 3.9-3.9" />
        </svg>
      );
  }
}

/** 标题前红圈播放图标(真机可播放条目:千香/爱情有烟火/南部档案) */
function PlayBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" className="shrink-0">
      <circle cx="7" cy="7" r="7" fill={C.danger} />
      <path d="M5.6 4.6v4.8l4-2.4z" fill="#fff" />
    </svg>
  );
}

// 书影音-电视频道:热播新剧/综艺切换 + 快捷入口 + 剧集横滑 + 榜单大卡。
export default function BmTvPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const rankings = useDoubanStore((s) => s.rankings);
  const notifications = useDoubanStore((s) => s.notifications);
  const toast = useDoubanStore((s) => s.toast);
  const [hotTab, setHotTab] = React.useState<'drama' | 'variety'>('drama');
  const [cat, setCat] = React.useState('综合');

  const unread = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const tvs = React.useMemo(() => subjects.filter((s) => s.type === 'tv'), [subjects]);
  const tvRanks = React.useMemo(() => rankings.filter((r) => r.kind === 'tv'), [rankings]);
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
  const cats = ['综合', '国产剧', '欧美剧', '日剧', '韩剧', '动画', '纪录片'];

  /** 榜单大卡渐变皮肤(对齐真机 IMG_0359:青蓝/深色图底卡) */
  const rankGradients = [
    'linear-gradient(155deg, #1F7F8C 0%, #0C3B46 100%)',
    'linear-gradient(155deg, #2F4B5E 0%, #16242E 100%)',
    'linear-gradient(155deg, #6A4A8C 0%, #2E1E48 100%)',
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <ChannelTopBar
        menuBinding={bindTap('bm.tv.drawer-open')}
        searchBinding={bindTap('bm.tv.search-open')}
        audioBinding={bindTap({ kind: 'action', id: 'bm.tv.headset.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
        messageBinding={bindTap('bm.tv.message-open')}
        searchText="暑期档新片预售遇冷"
        unread={unread}
      />

      {/* 二级频道Tab条:六个Tab均匀铺满,当前项黑粗+短黑下划线(对齐真机 IMG_0359) */}
      <div className="flex items-center h-10 shrink-0 bg-white overflow-x-auto" data-scroll-container="channel-tabs" data-scroll-direction="horizontal">
        {channels.map((c) => {
          const active = c.ch === 'tv';
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
              {...bindTap('bm.tv.channelTab-open', { params: { channel: c.ch } })}
              className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5 bg-transparent border-none cursor-pointer"
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 快捷入口:圆角白卡片 + 绿色线性图标(对齐真机 IMG_0359) */}
        <div className="grid grid-cols-4 gap-2 px-3 py-3">
          <button {...bindTap({ kind: 'action', id: 'bm.tv.finder.scrollTo' }, { onTrigger: () => document.getElementById('finder-tv')?.scrollIntoView({ behavior: 'smooth' }) })} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="finder" />
            <span className="text-[11px]" style={{ color: C.text }}>找电视</span>
          </button>
          <button {...bindTap('bm.tv.rankhub-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="rank" />
            <span className="text-[11px]" style={{ color: C.text }}>豆瓣榜单</span>
          </button>
          <button {...bindTap('bm.tv.upcoming-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="clock" />
            <span className="text-[11px]" style={{ color: C.text }}>即将播出</span>
          </button>
          <button {...bindTap('bm.tv.schedule-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="calendar" />
            <span className="text-[11px]" style={{ color: C.text }}>播出时间表</span>
          </button>
        </div>

        {/* 热播切换(带「|」分隔)+ 分类chips */}
        <div className="flex items-baseline gap-3 px-4 pt-1">
          <button {...bindTap({ kind: 'action', id: 'bm.tv.hotTab.select.target' }, { onTrigger: () => setHotTab('drama') })} className="text-xl bg-transparent border-none cursor-pointer px-0" style={{ color: hotTab === 'drama' ? C.text : C.sub, fontWeight: hotTab === 'drama' ? 700 : 400 }}>热播新剧</button>
          <span className="text-xl" style={{ color: C.border }}>|</span>
          <button {...bindTap({ kind: 'action', id: 'bm.tv.hotTab.select.target' }, { onTrigger: () => setHotTab('variety') })} className="text-xl bg-transparent border-none cursor-pointer px-0" style={{ color: hotTab === 'variety' ? C.text : C.sub, fontWeight: hotTab === 'variety' ? 700 : 400 }}>热播综艺</button>
          <button {...bindTap('bm.tv.hotList-open')} className="ml-auto text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>全部 267 ›</button>
        </div>
        <div className="flex gap-2 px-4 py-2 overflow-x-auto" data-scroll-container="cat-chips" data-scroll-direction="horizontal">
          {cats.map((ct) => (
            <Chip key={ct} label={ct} active={cat === ct} bind={bindTap({ kind: 'action', id: 'bm.tv.hotTab.select.target' }, { onTrigger: () => setCat(ct) })} />
          ))}
        </div>

        {/* 剧集横滑卡:海报左上♡+/✓角标,左下白字集数,标题前红圈播放图标(对齐真机 IMG_0359) */}
        <div className="flex gap-3 px-4 pb-2 overflow-x-auto" data-scroll-container="tv-cards" data-scroll-direction="horizontal">
          {tvs.map((t, i) => (
            <div key={t.id} className="shrink-0 w-28 relative">
              <button {...bindTap('bm.tv.item-open', { params: { itemId: t.id } })} className="block w-full text-left bg-transparent border-none cursor-pointer relative">
                <Img src={t.cover} className="w-28 rounded-md object-cover" style={{ height: 158 }} />
                {t.episodes != null && (
                  <span className="absolute bottom-1 left-1.5 text-[10px] text-white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}>
                    {t.onAir ? `更新至${t.episodes}集` : `${t.episodes}集全`}
                  </span>
                )}
                <div className="mt-1 flex items-center gap-1">
                  {i !== 2 && <PlayBadge />}
                  <span className="text-sm font-medium truncate" style={{ color: C.text }}>{t.title}</span>
                </div>
                <div className="mt-0.5"><RatingLine rating={t.rating} size={10} /></div>
              </button>
              <button
                {...bindTap('bm.tv.mark-open', { beforeTrigger: () => addHistory('subject', t.id) })}
                className="absolute top-1 left-1 w-7 h-7 rounded-lg border-none cursor-pointer flex items-center justify-center text-[11px] text-white"
                style={{ background: 'rgba(0,0,0,0.35)' }}
                aria-label={i === 2 ? '已标记' : '想看'}
              >
                {i === 2 ? '✓' : '♡+'}
              </button>
            </div>
          ))}
        </div>

        {/* 即将播出白色大卡:大号加粗标题+›、两行副文案、右侧海报缩略图(对齐真机 IMG_0359) */}
        <div className="px-4 pt-1">
          <button {...bindTap('bm.tv.upcoming-open')} className="w-full rounded-xl p-3.5 text-left border-none cursor-pointer flex items-center gap-3 bg-white">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[17px] font-bold" style={{ color: C.text }}>即将播出</span>
                <span className="text-base" style={{ color: '#C3C9D1' }}>›</span>
              </div>
              <div className="mt-1.5 text-sm leading-6" style={{ color: C.sub }}>近期有14部<br />热门新剧</div>
            </div>
            {tvs[0] && <Img src={tvs[0].cover} className="w-16 rounded-md object-cover shrink-0" style={{ height: 88 }} />}
          </button>
        </div>

        {/* 豆瓣榜单大卡横滑:深色图底渐变卡,「豆瓣榜单」小标在卡内左上(对齐真机 IMG_0359,无外置区块标题) */}
        <div className="flex gap-3 px-4 pt-3 overflow-x-auto" data-scroll-container="rank-cards" data-scroll-direction="horizontal">
          {tvRanks.map((r, ri) => (
            <button
              key={r.id}
              {...bindTap('bm.tv.ranklist-open', { params: { listId: r.id } })}
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

        {/* 找电视 内嵌筛选 section(快捷钮滚动定位到此) */}
        <ChannelFinderSection channel="tv" />
      </div>
    </div>
  );
}

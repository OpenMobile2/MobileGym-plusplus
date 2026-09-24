import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Stars, Chip, SectionHeader, fmtCount } from '../components/ui';
import { ChannelTopBar } from '../components/ChannelTopBar';
import type { DoubanSubject } from '../types';

/** 快捷入口绿色线性图标(对齐真机 frame:8b7ecc@t0005:线描风格,「豆瓣榜单」领奖台带金星) */
function EntryIcon({ name }: { name: 'finder' | 'rank' | 'bookact' | 'playlist' }) {
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
    case 'bookact':
      return (
        <svg {...common}>
          <path d="M12 6.3C10.4 4.9 7.9 4.4 4.4 4.9v13.4c3.5-.5 6 .1 7.6 1.5 1.6-1.4 4.1-2 7.6-1.5V4.9c-3.5-.5-6 0-7.6 1.4z" />
          <path d="M12 6.3v13.5" />
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

// 书影音-读书频道:新书速递横滑宽卡 + 榜单大卡。
export default function BmBookPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const rankings = useDoubanStore((s) => s.rankings);
  const notifications = useDoubanStore((s) => s.notifications);
  const toast = useDoubanStore((s) => s.toast);
  const [cat, setCat] = React.useState('全部');
  const unread = React.useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const books = React.useMemo(() => subjects.filter((s) => s.type === 'book'), [subjects]);
  const bookRanks = React.useMemo(() => rankings.filter((r) => r.kind === 'book'), [rankings]);
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
  const cats = ['全部', '文学', '小说', '历史文化', '社会纪实', '科学新知', '艺术设计'];
  // 分类chip → 图书 genres 关键词(真过滤新书速递列表)
  const CAT_GENRES: Record<string, string[]> = {
    文学: ['文学', '外国文学', '当代文学', '古典文学', '日本文学', '俄国文学', '诗歌', '散文', '文学评论', '经典'],
    小说: ['小说', '中篇', '短篇集', '推理', '悬疑', '本格', '科幻', '反乌托邦', '治愈'],
    历史文化: ['历史', '古典文学', '传记', '文化'],
    社会纪实: ['社科', '纪实', '女性主义', '城市', '传媒'],
    科学新知: ['科幻', '硬科幻', '科学', '社科', '新知'],
    艺术设计: ['艺术', '设计', '美食', '诗歌', '散文'],
  };
  const shownBooks = React.useMemo(
    () => (cat === '全部' ? books : books.filter((b) => (CAT_GENRES[cat] ?? []).some((g) => (b.genres ?? []).includes(g)))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [books, cat],
  );

  /** 榜单大卡渐变皮肤(对齐真机 t0005:墨绿/深棕图底卡) */
  const rankGradients = [
    'linear-gradient(155deg, #39584A 0%, #1E2F27 100%)',
    'linear-gradient(155deg, #6B4F35 0%, #37281B 100%)',
    'linear-gradient(155deg, #4A4A6B 0%, #242438 100%)',
  ];

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <ChannelTopBar
        menuBinding={bindTap('bm.book.drawer-open')}
        searchBinding={bindTap('bm.book.search-open')}
        audioBinding={bindTap({ kind: 'action', id: 'bm.book.headset.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
        messageBinding={bindTap('bm.book.message-open')}
        searchText="德国人没有味觉的程度令人震惊"
        unread={unread}
      />

      {/* 二级频道Tab条:六个Tab均匀铺满,当前项黑粗+短黑下划线(对齐真机 t0005) */}
      <div className="flex items-center h-10 shrink-0 bg-white overflow-x-auto" data-scroll-container="channel-tabs" data-scroll-direction="horizontal">
        {channels.map((c) => {
          const active = c.ch === 'book';
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
              {...bindTap('bm.book.channelTab-open', { params: { channel: c.ch } })}
              className="flex-1 min-w-0 flex flex-col items-center justify-center pt-1.5 bg-transparent border-none cursor-pointer"
            >
              {inner}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 快捷入口:圆角白卡片 + 绿色线性图标(对齐真机 frame:8b7ecc@t0005) */}
        <div className="grid grid-cols-4 gap-2 px-3 py-3">
          <button {...bindTap('bm.book.category-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="finder" />
            <span className="text-[11px]" style={{ color: C.text }}>找图书</span>
          </button>
          <button {...bindTap('bm.book.rankhub-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="rank" />
            <span className="text-[11px]" style={{ color: C.text }}>豆瓣榜单</span>
          </button>
          <button {...bindTap({ kind: 'action', id: 'bm.book.activity.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="bookact" />
            <span className="text-[11px]" style={{ color: C.text }}>读书活动</span>
          </button>
          <button {...bindTap('bm.book.booklist-open')} className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl bg-white border cursor-pointer" style={{ borderColor: C.border }}>
            <EntryIcon name="playlist" />
            <span className="text-[11px]" style={{ color: C.text }}>豆瓣书单</span>
          </button>
        </div>

        {/* 新书速递:标题在先(全部 295 ›),分类chips在标题之下(对齐真机 t0005) */}
        <SectionHeader title="新书速递" extra={<button {...bindTap('bm.book.newbooks-open')} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>全部 295 ›</button>} />
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto" data-scroll-container="cat-chips" data-scroll-direction="horizontal">
          {cats.map((ct) => (
            <Chip key={ct} label={ct} active={cat === ct} bind={bindTap({ kind: 'action', id: 'bm.book.categoryChip.select.target' }, { onTrigger: () => setCat(ct) })} />
          ))}
        </div>

        {/* 新书横滑宽卡:约2/3屏宽,右侧露出下一张;「N人想读 / 作者」+ 灰底简介框(对齐真机 t0005) */}
        <div className="flex gap-3 px-4 pb-1 overflow-x-auto" data-scroll-container="new-books" data-scroll-direction="horizontal">
          {shownBooks.length === 0 && (
            <div className="w-full py-8 text-center text-sm" style={{ color: C.sub }}>该分类暂无新书</div>
          )}
          {shownBooks.map((b) => (
            <button key={b.id} {...bindTap('bm.book.item-open', { params: { subjectId: b.id } })} className="shrink-0 w-64 flex gap-3 bg-white rounded-xl p-3 text-left border-none cursor-pointer">
              <Img src={b.cover} className="shrink-0 rounded object-cover self-start" style={{ width: 68, height: 96 }} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-bold truncate" style={{ color: C.text }}>{b.title}</div>
                <div className="mt-1 text-[11px] truncate" style={{ color: C.sub }}>
                  {fmtCount(b.wishCount ?? b.ratingCount)}人想读 / {b.author ?? b.info ?? ''}
                </div>
                {b.presetTags && b.presetTags.length > 0 && (
                  <div className="mt-1.5 flex gap-1 flex-wrap">
                    {b.presetTags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#F2F3F5', color: C.sub }}>{t}</span>
                    ))}
                  </div>
                )}
                {b.intro && (
                  <div className="mt-1.5 rounded-md px-2 py-1.5 text-[11px] leading-4 line-clamp-2" style={{ background: '#F5F6F7', color: C.sub }}>
                    {b.intro}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* 豆瓣榜单:外置黑标题(无更多链接)+ 墨绿/深棕图底大卡(对齐真机 t0005) */}
        <SectionHeader title="豆瓣榜单" />
        <div className="flex gap-3 px-4 overflow-x-auto" data-scroll-container="rank-cards" data-scroll-direction="horizontal">
          {bookRanks.map((r, ri) => (
            <button
              key={r.id}
              {...bindTap('bm.book.ranklist-open', { params: { listId: r.id } })}
              className="shrink-0 w-72 rounded-xl p-3.5 text-left border-none cursor-pointer"
              style={{ background: rankGradients[ri % rankGradients.length] }}
            >
              <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.75)' }}>豆瓣榜单</div>
              <div className="text-lg font-bold mt-0.5 mb-2 truncate text-white">{r.title}</div>
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
      </div>
    </div>
  );
}

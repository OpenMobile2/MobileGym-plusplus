import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { usePullRefresh, rotate } from '../hooks/usePullRefresh';
import { useDoubanStore } from '../state';
import { C, Img, TopBar, Chip } from '../components/ui';
import type { DoubanSubject } from '../types';

// 榜单·书单(图书):图书榜单/图书书单 双tab。
/** 榜单大卡渐变皮肤(对齐真机 IMG_0372:墨绿/深棕图底卡) */
const RANK_GRADIENTS = [
  'linear-gradient(155deg, #39584A 0%, #1E2F27 100%)',
  'linear-gradient(155deg, #6B4F35 0%, #37281B 100%)',
  'linear-gradient(155deg, #4A4A6B 0%, #242438 100%)',
];
/** 类型卡多彩皮肤 */
const TYPE_GRADIENTS = [
  'linear-gradient(140deg, #C93B3B 0%, #8E2222 100%)',
  'linear-gradient(140deg, #3E7BF2 0%, #2453B8 100%)',
  'linear-gradient(140deg, #8A6244 0%, #5A3E28 100%)',
  'linear-gradient(140deg, #2FA39A 0%, #1B6E68 100%)',
];

export default function RankBooksPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const rankings = useDoubanStore((s) => s.rankings);
  const doulists = useDoubanStore((s) => s.doulists);
  const toast = useDoubanStore((s) => s.toast);
  const setRanklistFilter = useDoubanStore((s) => s.setRanklistFilter);
  const [tab, setTab] = React.useState<'bookRank' | 'bookList'>('bookRank');
  const [year, setYear] = React.useState('2025');

  const byId = React.useMemo(() => {
    const m: Record<string, DoubanSubject> = {};
    subjects.forEach((s) => (m[s.id] = s));
    return m;
  }, [subjects]);
  const { refreshMsg, seed, listRef, pullHandlers } = usePullRefresh('为你更新了榜单');
  const bookRanks = React.useMemo(() => rotate(rankings.filter((r) => r.kind === 'book'), seed), [rankings, seed]);
  const bookDoulists = React.useMemo(
    () => doulists.filter((d) => d.items.some((it) => it.kind === 'subject' || it.kind === 'review')),
    [doulists],
  );

  const years = ['2025', '2024', '2023', '2022', '2021', '2020', '2019'];
  // 类型榜 → genres 关键词;实时按 genres 过滤真实图书,展示命中数并作为榜单预览。
  const typeRanks: { name: string; genres: string[] }[] = [
    { name: '豆瓣中国小说 Top 100', genres: ['当代文学', '古典文学', '小说', '华语'] },
    { name: '豆瓣外国小说 Top100', genres: ['外国文学', '俄国文学', '日本文学'] },
    { name: '豆瓣历史类图书 Top100', genres: ['历史', '文化', '纪实'] },
    { name: '豆瓣传记类图书 Top100', genres: ['传记'] },
  ];

  const allBooks = React.useMemo(() => subjects.filter((s) => s.type === 'book'), [subjects]);
  const typeRankBooks = React.useMemo(() => {
    const m: Record<string, DoubanSubject[]> = {};
    typeRanks.forEach((tr) => {
      m[tr.name] = allBooks
        .filter((b) => (b.genres ?? []).some((g) => tr.genres.includes(g)))
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBooks]);

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title="榜单·书单"
        right={
          <button {...bindTap({ kind: 'action', id: 'rank.books.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })} className="relative text-xl bg-transparent border-none cursor-pointer px-1" style={{ color: C.text }} aria-label="更多">
            ⋯
            <span className="absolute top-1 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: C.danger }} />
          </button>
        }
      />
      {refreshMsg && (
        <div className="absolute left-0 right-0 top-[88px] z-20 flex justify-center pointer-events-none">
          <span className="px-4 py-1.5 rounded-full text-xs text-white shadow" style={{ background: C.green }}>{refreshMsg}</span>
        </div>
      )}
      <div className="flex items-center gap-6 px-5 h-11 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        {([['bookRank', '图书榜单'], ['bookList', '图书书单']] as const).map(([id, label]) => (
          <button key={id} {...bindTap({ kind: 'action', id: 'rank.books.tab.select.target' }, { onTrigger: () => setTab(id) })} className="text-sm bg-transparent border-none cursor-pointer relative h-11" style={{ color: tab === id ? C.text : C.sub, fontWeight: tab === id ? 700 : 400 }}>
            {label}
            {tab === id && <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-5 h-0.5 rounded" style={{ background: C.text }} />}
          </button>
        ))}
      </div>

      <div ref={listRef} {...pullHandlers} className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'bookRank' ? (
          <>
            {/* 榜单大卡横滑:墨绿/深棕图底渐变卡 +「豆瓣榜单」小标在标题下 + 金色「N分」下一行 + 趋势箭头(对齐真机 IMG_0372) */}
            <div className="flex gap-3 px-4 pt-3 overflow-x-auto" data-scroll-container="rank-cards" data-scroll-direction="horizontal">
              {bookRanks.map((r, ri) => (
                <button key={r.id} {...bindTap('rank.books.ranklist-open', { params: { listId: r.id } })} className="shrink-0 w-72 rounded-xl p-3.5 text-left border-none cursor-pointer" style={{ background: RANK_GRADIENTS[ri % RANK_GRADIENTS.length] }}>
                  <div className="text-lg font-bold truncate text-white">{r.title}</div>
                  <div className="text-[11px] mb-2" style={{ color: 'rgba(255,255,255,0.75)' }}>豆瓣榜单</div>
                  {r.items.slice(0, 3).map((it, i) => {
                    const sub = byId[it.subjectId];
                    return (
                      <div key={it.subjectId} className="flex items-center gap-2.5 py-1">
                        <span className="text-sm w-3 shrink-0 text-white">{i + 1}</span>
                        <Img src={sub?.cover ?? ''} className="w-10 rounded object-cover shrink-0" style={{ height: 56 }} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-white">{sub?.title ?? it.subjectId}</div>
                          {sub?.rating != null && sub.rating > 0 ? (
                            <div className="mt-0.5 text-xs font-semibold" style={{ color: C.orange }}>{sub.rating.toFixed(1)}分</div>
                          ) : (
                            <div className="mt-0.5 text-[11px]" style={{ color: 'rgba(255,255,255,0.6)' }}>暂无评分</div>
                          )}
                        </div>
                        <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.55)' }}>{i < 2 ? '↑' : '–'}</span>
                      </div>
                    );
                  })}
                </button>
              ))}
            </div>

            {/* 年度读书榜单 */}
            <div className="px-4 pt-4 pb-1 text-base font-bold" style={{ color: C.text }}>年度读书榜单</div>
            <div className="flex gap-2 px-4 py-1 overflow-x-auto" data-scroll-container="year-chips" data-scroll-direction="horizontal">
              {years.map((y) => (
                <Chip key={y} label={y} active={year === y} bind={bindTap({ kind: 'action', id: 'rank.books.yearChip.select.target' }, { onTrigger: () => setYear(y) })} />
              ))}
            </div>
            {/* 年度读书榜单:真机两张截图均为空白灰占位卡(加载失败态),不自创皮肤/footer(对齐真机 IMG_0372) */}
            <div className="flex gap-3 px-4 py-2 overflow-x-auto" data-scroll-container="year-cards" data-scroll-direction="horizontal">
              {[
                { name: '年度小说', filter: '小说,当代文学,古典文学' },
                { name: '年度非虚构', filter: '纪实,历史,传记' },
                { name: '年度新知', filter: '科普,文化' },
              ].map((card, i) => (
                <button
                  key={card.name}
                  {...bindTap('rank.books.ranklist-open', {
                    params: { listId: bookRanks[i % Math.max(bookRanks.length, 1)]?.id ?? 'rank_book_monthly' },
                    beforeTrigger: () => setRanklistFilter(`${year},${card.filter}`),
                  })}
                  className="shrink-0 w-36 h-24 rounded-lg text-left border-none cursor-pointer px-3 py-2"
                  style={{ background: '#EEF0F2' }}
                  aria-label={`${year} ${card.name}`}
                >
                  <div className="text-sm font-semibold" style={{ color: C.text }}>{card.name}</div>
                  <div className="text-[11px] mt-1" style={{ color: C.sub }}>{year}</div>
                </button>
              ))}
            </div>

            {/* 图书类型榜单:彩色图底大卡,大白字标题 + 底部前三列表(对齐真机 IMG_0372) */}
            <div className="px-4 pt-3 pb-1 text-base font-bold" style={{ color: C.text }}>图书类型榜单</div>
            <div className="px-4 grid grid-cols-2 gap-3">
              {typeRanks.map((tr, i) => {
                const hits = typeRankBooks[tr.name] ?? [];
                const top3 = hits.slice(0, 3);
                return (
                  <button key={tr.name} {...bindTap('rank.books.typeRank-open', { params: { listId: bookRanks[i % Math.max(bookRanks.length, 1)]?.id ?? 'rank_book_monthly' }, beforeTrigger: () => setRanklistFilter(tr.genres.join(',')) })} className="rounded-lg overflow-hidden text-left border-none cursor-pointer relative" style={{ background: TYPE_GRADIENTS[i % TYPE_GRADIENTS.length] }}>
                    <div className="p-3 pb-2 flex items-start gap-2">
                      <div className="flex-1 min-w-0 text-sm font-bold text-white leading-tight">{tr.name}</div>
                      {/* 右上书封叠放小图 */}
                      {top3[0] && (
                        <div className="relative shrink-0" style={{ width: 34, height: 44 }}>
                          {top3.slice(0, 2).map((b, bi) => (
                            <Img key={bi} src={b.cover} className="absolute rounded object-cover" style={{ width: 26, height: 36, left: bi * 8, top: bi * 4, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="px-3 pb-3 space-y-1">
                      {(top3.length > 0 ? top3.map((b) => b.title) : ['暂无入选']).map((t, ti) => (
                        <div key={ti} className="flex items-center gap-1.5">
                          <span className="text-[10px] w-3 shrink-0" style={{ color: 'rgba(255,255,255,0.7)' }}>{ti + 1}</span>
                          <span className="text-[11px] truncate text-white/90">{t}</span>
                        </div>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="px-4 grid grid-cols-2 gap-3 pt-3">
            {bookDoulists.map((dl) => (
              <button key={dl.id} {...bindTap('rank.books.doulist-open', { params: { doulistId: dl.id } })} className="rounded-lg overflow-hidden text-left border-none cursor-pointer bg-white" style={{ border: `1px solid ${C.border}` }}>
                <Img src={dl.cover} className="w-full object-cover" style={{ height: 96 }} />
                <div className="p-2">
                  <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{dl.title}</div>
                  <div className="mt-1 text-[11px]" style={{ color: C.sub }}>{dl.items.length} 本</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

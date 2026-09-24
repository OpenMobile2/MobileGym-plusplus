import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { usePullRefresh, rotate } from '../hooks/usePullRefresh';
import { useDoubanStore } from '../state';
import { C, Img, Stars, TopBar, Chip } from '../components/ui';
import type { DoubanSubject } from '../types';

// 榜单·片单(影视):电影榜单/电视榜单/影视片单 三tab。
type RankTab = 'movieRank' | 'tvRank' | 'filmList';

/** 榜单大卡渐变皮肤(对齐 BmMoviePage:深蓝/墨绿/紫彩色卡) */
const RANK_GRADIENTS = [
  'linear-gradient(155deg, #2456C8 0%, #122E7E 100%)',
  'linear-gradient(155deg, #1D7A50 0%, #0B3D28 100%)',
  'linear-gradient(155deg, #7A3FA8 0%, #3C1E5E 100%)',
];

/** 年度卡 / 类型卡多彩皮肤(对齐真机 IMG_0362 彩色年度榜 / 类型榜) */
const YEAR_GRADIENTS = [
  'linear-gradient(140deg, #E8702A 0%, #C24E14 100%)',
  'linear-gradient(140deg, #3E7BF2 0%, #2453B8 100%)',
  'linear-gradient(140deg, #2FA39A 0%, #1B6E68 100%)',
  'linear-gradient(140deg, #C93B6B 0%, #8E2247 100%)',
];

export default function RankMoviesPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const rankings = useDoubanStore((s) => s.rankings);
  const doulists = useDoubanStore((s) => s.doulists);
  const follows = useDoubanStore((s) => s.follows);
  const marks = useDoubanStore((s) => s.marks);
  const toast = useDoubanStore((s) => s.toast);
  const [tab, setTab] = React.useState<RankTab>('movieRank');
  const [year, setYear] = React.useState('2025');
  const [region, setRegion] = React.useState('全部');

  const byId = React.useMemo(() => {
    const m: Record<string, DoubanSubject> = {};
    subjects.forEach((s) => (m[s.id] = s));
    return m;
  }, [subjects]);
  const { refreshMsg, seed, listRef, pullHandlers } = usePullRefresh('为你更新了榜单');

  // 已看过的条目 id 集合(status==='done'),用于片单「看过 x/y」的确定性推导。
  const doneIds = React.useMemo(
    () => new Set(marks.filter((m) => m.status === 'done').map((m) => m.subjectId)),
    [marks],
  );

  const tvRanks = React.useMemo(() => rotate(rankings.filter((r) => r.kind === 'tv'), seed), [rankings, seed]);

  // 电影榜单:优先真实 movie-kind 榜单;数据太少时用 movie-type 条目池合成主题榜单
  // (华语电影/外语电影/冷门佳片/豆瓣电影Top250),标题必须是电影榜口吻。
  const movieRanks = React.useMemo(() => {
    const real = rankings.filter((r) => r.kind === 'movie');
    const moviePool = subjects.filter((s) => s.type === 'movie');
    const pick = (start: number, count: number) =>
      moviePool.slice(start, start + count).map((s) => ({ subjectId: s.id }));
    const synth = [
      { id: 'rank_cn_movie', title: '华语电影口碑榜', subtitle: '本周口碑最佳华语电影', kind: 'movie' as const, items: pick(3, 5) },
      { id: 'rank_foreign_movie', title: '外语电影口碑榜', subtitle: '近期高分外语佳作', kind: 'movie' as const, items: pick(7, 5) },
      { id: 'rank_hidden_gem', title: '冷门佳片榜', subtitle: '被低估的宝藏电影', kind: 'movie' as const, items: pick(9, 5) },
    ];
    // 真实榜单在前(如 豆瓣电影 Top250),再补合成榜凑够横滑卡。
    const merged = [...real, ...synth];
    return rotate(merged, seed);
  }, [rankings, subjects, seed]);

  const filmDoulists = React.useMemo(
    () => doulists.filter((d) => d.kindLabel === '片单' || d.items.some((it) => it.kind === 'subject')),
    [doulists],
  );
  const todayDoulist = filmDoulists.find((d) => d.kindLabel === '片单') ?? filmDoulists[0];
  const followedDoulist = doulists.find((d) => follows.doulists.includes(d.id));

  const years = ['2025', '2024', '2023', '2022', '2021', '2020', '2019'];
  // 年度榜预览:按所选年份 + 当前 tab 类型取条目池(年份切换→卡片预览变化,真过滤意义)
  const yearPool = React.useMemo(() => {
    const t = tab === 'movieRank' ? 'movie' : 'tv';
    return subjects.filter((s) => s.type === t && s.year === year).sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [subjects, tab, year]);
  // 电影 tab 筛选 chips 顺序对齐真机 IMG_0362(6 项);电视 tab 复用其地区口径。
  const regions =
    tab === 'movieRank'
      ? ['全部', '近期热门', '高分经典', '冷门佳作', '地区佳作', '分类题材']
      : ['全部', '近期热门', '高分经典', '冷门佳作', '地区剧集', '分类题材'];

  // 当前 tab 顶部横滑大卡:电影 tab 用电影榜,电视 tab 用电视榜。
  const heroRanks = tab === 'movieRank' ? movieRanks : tvRanks;

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title="榜单·片单"
        right={
          <button {...bindTap({ kind: 'action', id: 'rank.movies.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })} className="relative text-xl bg-transparent border-none cursor-pointer px-1" style={{ color: C.text }} aria-label="更多">
            ⋯
            <span className="absolute top-1 right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: C.danger }} />
          </button>
        }
      />
      {/* 顶部tab:选中项短黑下划线(对齐真机 IMG_0362) */}
      <div className="flex items-center gap-6 px-5 h-11 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        {([['movieRank', '电影榜单'], ['tvRank', '电视榜单'], ['filmList', '影视片单']] as const).map(([id, label]) => (
          <button key={id} {...bindTap({ kind: 'action', id: 'rank.movies.tab.select.target' }, { onTrigger: () => setTab(id) })} className="text-sm bg-transparent border-none cursor-pointer relative h-11" style={{ color: tab === id ? C.text : C.sub, fontWeight: tab === id ? 700 : 400 }}>
            {label}
            {tab === id && <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-5 h-0.5 rounded" style={{ background: C.text }} />}
          </button>
        ))}
      </div>

      {refreshMsg && (
        <div className="absolute left-0 right-0 top-[88px] z-20 flex justify-center pointer-events-none">
          <span className="px-4 py-1.5 rounded-full text-xs text-white shadow" style={{ background: C.green }}>{refreshMsg}</span>
        </div>
      )}
      <div ref={listRef} {...pullHandlers} className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 口碑榜大卡横滑:深色渐变图底卡(仅电影/电视榜 tab) */}
        {tab !== 'filmList' && (
          <div className="flex gap-3 px-4 pt-3 overflow-x-auto" data-scroll-container="rep-cards" data-scroll-direction="horizontal">
            {heroRanks.map((r, ri) => (
              <button
                key={r.id}
                {...bindTap('rank.movies.ranklist-open', { params: { listId: r.id } })}
                className="shrink-0 w-72 rounded-xl p-3.5 text-left border-none cursor-pointer"
                style={{ background: RANK_GRADIENTS[ri % RANK_GRADIENTS.length] }}
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
                              <span className="text-xs font-semibold" style={{ color: C.orange }}>{sub.rating.toFixed(1)}分</span>
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
        )}

        {tab !== 'filmList' && (
          <>
            {/* 年度榜单年份chip */}
            <div className="px-4 pt-4 pb-1 text-base font-bold" style={{ color: C.text }}>{tab === 'movieRank' ? '年度电影榜单' : '年度电视榜单'}</div>
            <div className="flex gap-2 px-4 py-1 overflow-x-auto" data-scroll-container="year-chips" data-scroll-direction="horizontal">
              {years.map((y) => (
                <Chip key={y} label={y} active={year === y} bind={bindTap({ kind: 'action', id: 'rank.movies.yearChip.select.target' }, { onTrigger: () => setYear(y) })} />
              ))}
            </div>
            <div className="flex gap-3 px-4 py-2 overflow-x-auto" data-scroll-container="year-cards" data-scroll-direction="horizontal">
              {(tab === 'movieRank'
                ? ['华语电影', '外语电影', '冷门佳片', '恐怖悬疑']
                : ['华语剧', '英美新剧', '英美续订剧', '韩剧']
              ).map((name, i) => (
                <button key={name} {...bindTap('rank.movies.yearRank-open', { params: { listId: heroRanks[i % heroRanks.length]?.id ?? 'rank_top250' } })} className="shrink-0 w-36 h-28 rounded-lg overflow-hidden text-left border-none cursor-pointer relative" style={{ background: YEAR_GRADIENTS[i % YEAR_GRADIENTS.length] }}>
                  {/* 年份水印 + 「N年度榜」小字 + 大白字名称(对齐真机 IMG_0362 彩色年度卡) */}
                  <span className="absolute -bottom-2 right-1 text-5xl font-black leading-none" style={{ color: 'rgba(255,255,255,0.14)' }}>{year}</span>
                  <div className="absolute inset-0 p-3 flex flex-col justify-end">
                    <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.8)' }}>{year} 年度榜</div>
                    <div className="text-base font-bold text-white mt-0.5">{name}</div>
                    <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.75)' }}>
                      {yearPool[i] ? `第1名《${yearPool[i].title}》` : '敬请期待'}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 类型榜单 */}
            <div className="px-4 pt-3 pb-1 text-base font-bold" style={{ color: C.text }}>{tab === 'movieRank' ? '电影类型榜单' : '电视类型榜单'}</div>
            <div className="flex gap-2 px-4 py-1 overflow-x-auto" data-scroll-container="region-chips" data-scroll-direction="horizontal">
              {regions.map((rg) => (
                <Chip key={rg} label={rg} active={region === rg} bind={bindTap({ kind: 'action', id: 'rank.movies.regionChip.select.target' }, { onTrigger: () => setRegion(rg) })} />
              ))}
            </div>
            <div className="px-4 grid grid-cols-2 gap-3">
              {(tab === 'movieRank'
                ? ['高分经典电影', '大陆电影', '日本电影', '欧美电影']
                : ['高分经典美剧', '大陆剧', '日剧', '韩剧']
              ).map((name, i) => {
                // 底部前三预览:按所选筛选维度(全部/近期热门/高分经典…)确定性轮换 hero 榜单条目,
                // 使地区/类型 chip 切换时预览可见变化(regionIdx 作为 rotate 种子)。
                const regionIdx = Math.max(0, regions.indexOf(region));
                const src = heroRanks[i % heroRanks.length];
                const top3 = rotate(src?.items ?? [], regionIdx + i).slice(0, 3).map((it) => byId[it.subjectId]?.title).filter(Boolean) as string[];
                // 非「全部」时,卡名带上筛选维度前缀,直观反映选择
                const cardName = region === '全部' ? name : `${region}·${name}`;
                return (
                  <button key={name} {...bindTap('rank.movies.regionRank-open', { params: { listId: src?.id ?? 'rank_top250' } })} className="rounded-lg overflow-hidden text-left border-none cursor-pointer relative" style={{ background: YEAR_GRADIENTS[(i + 1) % YEAR_GRADIENTS.length] }}>
                    <div className="p-3 pb-2">
                      <div className="text-sm font-bold text-white">{cardName}</div>
                    </div>
                    <div className="px-3 pb-3 space-y-1">
                      {(top3.length > 0 ? top3 : ['暂无入选']).map((t, ti) => (
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
        )}

        {tab === 'filmList' && (
          <>
            {/* 「精选 ˅」筛选行 + 今日片单/关注的片单 入口 */}
            <div className="flex items-center gap-4 px-4 pt-3 pb-1">
              <button {...bindTap({ kind: 'action', id: 'rank.movies.regionChip.select.target' }, { onTrigger: () => setRegion(region === '精选' ? '全部' : '精选') })} className="flex items-center gap-1 text-sm font-semibold bg-transparent border-none cursor-pointer" style={{ color: C.text }}>
                精选 <span className="text-xs" style={{ color: C.sub }}>˅</span>
              </button>
              <button {...(todayDoulist
                ? bindTap('rank.movies.doulist-open', { params: { doulistId: todayDoulist.id } })
                : bindTap({ kind: 'action', id: 'rank.movies.todayList.empty' }, { onTrigger: () => toast('暂无今日片单') })
              )} className="text-sm bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>今日片单</button>
              <button {...(followedDoulist
                ? bindTap('rank.movies.doulist-open', { params: { doulistId: followedDoulist.id } })
                : bindTap({ kind: 'action', id: 'rank.movies.followedList.empty' }, { onTrigger: () => toast('暂无关注的片单') })
              )} className="ml-auto text-sm bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>关注的片单 ›</button>
            </div>

            {/* 片单卡:豆 badge + 「看过 x/y」进度条 */}
            <div className="px-4 pt-1 grid grid-cols-2 gap-3">
              {filmDoulists.map((dl) => {
                const subjItems = dl.items.filter((it) => it.kind === 'subject');
                const y = subjItems.length;
                const x = subjItems.filter((it) => doneIds.has(it.refId)).length;
                const pct = y > 0 ? Math.round((x / y) * 100) : 0;
                return (
                  <button key={dl.id} {...bindTap('rank.movies.doulist-open', { params: { doulistId: dl.id } })} className="rounded-lg overflow-hidden text-left border-none cursor-pointer bg-white" style={{ border: `1px solid ${C.border}` }}>
                    <div className="relative">
                      <Img src={dl.cover} className="w-full object-cover" style={{ height: 96 }} />
                      <span className="absolute top-1.5 left-1.5 w-5 h-5 rounded flex items-center justify-center text-[11px] font-bold text-white" style={{ background: C.green }}>豆</span>
                    </div>
                    <div className="p-2">
                      <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{dl.title}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: C.border }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: C.green }} />
                        </div>
                        <span className="text-[11px] shrink-0" style={{ color: C.sub }}>看过 {x}/{y}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

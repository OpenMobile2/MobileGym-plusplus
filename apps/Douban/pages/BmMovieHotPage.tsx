import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Stars } from '../components/ui';
import { Sheet } from '../components/Sheet';
import type { DoubanSubject } from '../types';

// 影院热映/豆瓣热门(全部展开):双 tab + 类型chips + 漏斗筛选(真过滤) + 富卡片列表。
// 节点 bm.movie.hot,同构 bm.tv.hot(rec1 电影频道)。
const CHIPS = ['综合', '剧情', '喜剧', '动作', '犯罪', '悬疑', '爱情', '科幻', '恐怖'];
const NOW_YEARS = ['2026', '2025'];
const hashOf = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff; return h; };
const isPlayable = (id: string) => hashOf(id) % 4 !== 0;
const PLATFORMS = ['腾讯视频', '爱奇艺', '优酷', '芒果TV', 'Netflix'];
const platformOf = (id: string) => PLATFORMS[hashOf(id) % PLATFORMS.length];

export default function BmMovieHotPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const marks = useDoubanStore((s) => s.marks);
  const rankings = useDoubanStore((s) => s.rankings);
  const toast = useDoubanStore((s) => s.toast);

  const [tab, setTab] = React.useState<'now' | 'hot'>('now');
  const [chip, setChip] = React.useState('综合');
  const [showFilter, setShowFilter] = React.useState(false);
  const [ratingLo, setRatingLo] = React.useState(0);
  const [ratingHi, setRatingHi] = React.useState(10);
  const [playable, setPlayable] = React.useState(false);
  const [unwatched, setUnwatched] = React.useState(false);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  const movieRankId = React.useMemo(() => rankings.find((r) => r.kind === 'movie')?.id ?? 'rank_top250', [rankings]);
  const toggleExpand = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const isMarked = (id: string) => marks.some((m) => m.subjectId === id);

  const results = React.useMemo(() => {
    let arr = subjects.filter((s) => s.type === 'movie');
    // 影院热映 = 近两年上映;豆瓣热门 = 全部
    if (tab === 'now') arr = arr.filter((s) => NOW_YEARS.includes(s.year ?? ''));
    if (chip !== '综合') arr = arr.filter((s) => (s.genres ?? []).includes(chip));
    if (ratingLo > 0 || ratingHi < 10) arr = arr.filter((s) => s.rating != null && s.rating >= ratingLo && s.rating <= ratingHi);
    if (playable) arr = arr.filter((s) => isPlayable(s.id));
    if (unwatched) {
      const seen = new Set(marks.filter((m) => m.status === 'done').map((m) => m.subjectId));
      arr = arr.filter((s) => !seen.has(s.id));
    }
    return [...arr].sort((a, b) => b.ratingCount - a.ratingCount);
  }, [subjects, marks, tab, chip, ratingLo, ratingHi, playable, unwatched]);

  // ── 双拇指评分滑块(0-10)──
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragThumb = React.useRef<'lo' | 'hi' | null>(null);
  const pct = (v: number) => (v / 10) * 100;
  const valFromX = (x: number) => {
    const el = trackRef.current; if (!el) return 0;
    const r = el.getBoundingClientRect();
    return Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * 10);
  };
  const onDown = (which: 'lo' | 'hi') => (e: React.PointerEvent) => {
    e.stopPropagation(); dragThumb.current = which;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (!dragThumb.current) return;
    const v = valFromX(e.clientX);
    if (dragThumb.current === 'lo') setRatingLo(Math.min(v, ratingHi));
    else setRatingHi(Math.max(v, ratingLo));
  };
  const onUp = (e: React.PointerEvent) => {
    if (!dragThumb.current) return;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    dragThumb.current = null;
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:‹ + 双tab(影院热映|豆瓣热门)+ ⋯ */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 flex items-center justify-center gap-8">
          {([['now', '影院热映'], ['hot', '豆瓣热门']] as const).map(([id, label]) => (
            <button
              key={id}
              {...bindTap({ kind: 'action', id: 'bm.movie.hot.tab.select.target' }, { params: { target: id }, onTrigger: () => setTab(id) })}
              className="relative h-11 bg-transparent border-none cursor-pointer text-lg"
              style={{ color: tab === id ? C.text : C.sub, fontWeight: tab === id ? 700 : 400 }}
            >
              {label}
              {tab === id && <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-6 h-0.5 rounded" style={{ background: C.text }} />}
            </button>
          ))}
        </div>
        <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.play.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })} className="w-10 h-10 flex items-center justify-center text-lg bg-transparent border-none cursor-pointer" style={{ color: C.sub }} aria-label="更多">⋯</button>
      </div>

      {/* 类型chips + 右侧漏斗 */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <div className="flex-1 flex gap-2 overflow-x-auto" data-scroll-container="type-chips" data-scroll-direction="horizontal">
          {CHIPS.map((ct) => {
            const active = chip === ct;
            return (
              <button
                key={ct}
                {...bindTap({ kind: 'action', id: 'bm.movie.hot.typeChip.select.target' }, { params: { target: ct }, onTrigger: () => setChip(ct) })}
                className="shrink-0 px-3 py-1 rounded-md text-sm border-none cursor-pointer"
                style={{ background: active ? C.greenSoft : '#F2F3F5', color: active ? C.green : C.sub, fontWeight: active ? 600 : 400 }}
              >
                {ct}
              </button>
            );
          })}
        </div>
        <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.filterPanel.open' }, { onTrigger: () => setShowFilter(true) })} className="relative shrink-0 text-base bg-transparent border-none cursor-pointer px-1" style={{ color: C.sub }} aria-label="筛选">
          ▽
          {(ratingLo > 0 || ratingHi < 10 || playable || unwatched) && <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />}
        </button>
      </div>

      {/* 富卡片列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-2 text-sm" style={{ color: C.sub }}>
            <span className="text-3xl">🎬</span>
            没有符合条件的电影
          </div>
        )}
        {results.map((s) => {
          const marked = isMarked(s.id);
          const isOpen = expanded.has(s.id);
          const goodRep = s.rating != null && s.rating >= 8;
          return (
            <div key={s.id} className="bg-white px-4 pt-3 pb-3.5 border-b" style={{ borderColor: '#F2F3F5' }}>
              {/* 双图行:海报 + 剧照(带圆点)*/}
              <button {...bindTap('bm.movie.hot.item-open', { params: { itemId: s.id } })} className="flex gap-2 w-full text-left bg-transparent border-none cursor-pointer p-0">
                <Img src={s.cover} className="shrink-0 rounded-md object-cover" style={{ width: 96, height: 132 }} />
                <div className="relative flex-1 min-w-0 rounded-md overflow-hidden" style={{ height: 132 }}>
                  <Img src={s.cover} className="w-full h-full object-cover" style={{ objectPosition: '50% 30%' }} />
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                    {[0, 1, 2, 3].map((d) => <span key={d} className="w-1 h-1 rounded-full" style={{ background: d === 0 ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
                  </div>
                </div>
              </button>

              {/* 标题行 + 标记按钮 */}
              <div className="flex items-start gap-2 mt-2">
                <button {...bindTap('bm.movie.hot.item-open', { params: { itemId: s.id } })} className="flex-1 min-w-0 flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0 text-left">
                  <span className="shrink-0 text-sm" style={{ color: C.danger }}>▷</span>
                  <span className="text-[17px] font-bold truncate" style={{ color: C.text }}>{s.title}</span>
                  <span className="shrink-0 text-[17px] font-bold" style={{ color: C.text }}>({s.year})</span>
                </button>
                <button
                  {...bindTap('bm.movie.hot.mark-open', { beforeTrigger: () => addHistory('subject', s.id) })}
                  className="shrink-0 flex items-center justify-center rounded-md text-lg cursor-pointer border-none"
                  style={{ width: 34, height: 30, background: 'transparent', color: marked ? C.green : C.orange }}
                  aria-label={marked ? '已标记' : '想看'}
                >
                  {marked ? '✓' : '♡+'}
                </button>
              </div>

              {/* 评分 */}
              <div className="mt-1 flex items-center gap-1.5">
                {s.rating != null && s.rating > 0 ? (
                  <>
                    <Stars value={s.rating} size={12} />
                    <span className="text-sm font-semibold" style={{ color: C.orange }}>{s.rating.toFixed(1)}</span>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: C.sub }}>暂无评分</span>
                )}
              </div>

              {/* 元信息 */}
              <div className="mt-1 text-xs truncate" style={{ color: C.sub }}>{s.year} / {s.info}</div>

              {/* 简介 + 展开 */}
              {s.intro && (
                <div className="mt-1.5">
                  <span className={`text-[13px] leading-5 ${isOpen ? '' : 'line-clamp-2'}`} style={{ color: '#4A4A4A' }}>{s.intro}</span>
                  {s.intro.length > 40 && (
                    <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.descExpand.toggle' }, { onTrigger: () => toggleExpand(s.id) })} className="ml-1 text-[13px] bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
                      {isOpen ? '收起∧' : '展开∨'}
                    </button>
                  )}
                </div>
              )}

              {/* 平台播放行 */}
              <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.play.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })} className="mt-2 flex items-center gap-1.5 bg-transparent border-none cursor-pointer p-0">
                <span className="flex items-center justify-center w-5 h-5 rounded-full text-[10px] text-white" style={{ background: C.danger }}>▷</span>
                <span className="text-[11px]" style={{ color: C.sub }}>{platformOf(s.id)}</span>
                <span className="text-[11px]" style={{ color: C.sub }}>›</span>
              </button>

              {/* 榜单 chip(高分才挂)*/}
              {goodRep && (
                <button {...bindTap('bm.movie.hot.ranklist-open', { params: { listId: movieRankId } })} className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] border-none cursor-pointer" style={{ background: '#FFF4E5', color: C.orange }}>
                  豆瓣电影 Top250 ›
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* 漏斗筛选面板 */}
      {showFilter && (
        <Sheet title="筛选">
          <div className="px-4 pb-2">
            <div className="flex items-center justify-between mt-2 mb-3">
              <span className="text-xs" style={{ color: C.sub }}>{ratingLo}分</span>
              <span className="text-sm font-semibold" style={{ color: C.text }}>评分区间</span>
              <span className="text-xs" style={{ color: C.sub }}>{ratingHi}分</span>
            </div>
            <div ref={trackRef} className="relative h-1 rounded-full mx-2 mb-6" style={{ background: '#E5E7EB' }}>
              <div className="absolute h-1 rounded-full" style={{ left: `${pct(ratingLo)}%`, right: `${100 - pct(ratingHi)}%`, background: C.orange }} />
              {(['lo', 'hi'] as const).map((which) => (
                <button
                  key={which}
                  onPointerDown={onDown(which)}
                  onPointerMove={onMove}
                  onPointerUp={onUp}
                  onPointerCancel={onUp}
                  {...bindTap({ kind: 'action', id: 'bm.movie.hot.ratingRange.adjust' }, { onTrigger: () => {} })}
                  className="absolute w-5 h-5 rounded-full bg-white shadow border cursor-pointer -translate-x-1/2 -translate-y-2"
                  style={{ left: `${pct(which === 'lo' ? ratingLo : ratingHi)}%`, borderColor: C.orange, touchAction: 'none' }}
                  aria-label={which === 'lo' ? '最低分' : '最高分'}
                />
              ))}
            </div>
            <div className="flex items-center py-3 border-t" style={{ borderColor: C.border }}>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: C.text }}>可播放</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>仅看有可播放片源的影片</div>
              </div>
              <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.playable.toggle' }, { onTrigger: () => setPlayable((v) => !v) })} className="w-11 h-6 rounded-full relative cursor-pointer border-none shrink-0" style={{ background: playable ? C.green : '#D8DCE1' }} aria-label="可播放">
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: playable ? 22 : 2 }} />
              </button>
            </div>
            <div className="flex items-center py-3 border-t" style={{ borderColor: C.border }}>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ color: C.text }}>未标「看过」</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>仅看还没有被标记为「看过」的影片</div>
              </div>
              <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.unwatched.toggle' }, { onTrigger: () => setUnwatched((v) => !v) })} className="w-11 h-6 rounded-full relative cursor-pointer border-none shrink-0" style={{ background: unwatched ? C.green : '#D8DCE1' }} aria-label="未标看过">
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: unwatched ? 22 : 2 }} />
              </button>
            </div>
          </div>
          <div className="flex items-stretch pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.filterPanel.apply' }, { onTrigger: () => setShowFilter(false) })} className="flex-1 h-11 text-sm bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>取消</button>
            <span className="w-px self-center" style={{ height: 20, background: C.border }} />
            <button {...bindTap({ kind: 'action', id: 'bm.movie.hot.filterPanel.apply' }, { onTrigger: () => setShowFilter(false) })} className="flex-1 h-11 text-sm font-semibold bg-transparent border-none cursor-pointer" style={{ color: C.green }}>确定</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, Stars, Chip } from './ui';
import { Sheet } from './Sheet';
import type { DoubanSubject } from '../types';

// 频道页内嵌「找电影/找电视」筛选 section(原独立 tv.finder 迁入)。
// channel 决定作用域 id 与基础类型;点频道页快捷钮滚动到 #finder-<channel>。
type Ch = 'movie' | 'tv';
type Dropdown = null | 'type' | 'region' | 'sort';

// 全部 id 为字面量(全局 action 一致性按字面量统计,两套都在此文件出现即算已用)。
const IDS: Record<Ch, Record<string, string>> = {
  movie: {
    playable: 'bm.movie.finder.playable.toggle', typeDD: 'bm.movie.finder.typeDropdown.toggle',
    type: 'bm.movie.finder.type.select.target', region: 'bm.movie.finder.region.select.target',
    sort: 'bm.movie.finder.sort.select.target', genre: 'bm.movie.finder.genreTag.select.target',
    filterOpen: 'bm.movie.finder.filterPanel.open', era: 'bm.movie.finder.era.select.target',
    platform: 'bm.movie.finder.platform.select.target', rating: 'bm.movie.finder.ratingRange.adjust',
    unwatched: 'bm.movie.finder.unwatched.toggle', apply: 'bm.movie.finder.filterPanel.apply',
    reset: 'bm.movie.finder.emptyReset.apply', customTag: 'bm.movie.finder.customTag.add',
    freeWatch: 'bm.movie.finder.freeWatch.wontfix',
  },
  tv: {
    playable: 'bm.tv.finder.playable.toggle', typeDD: 'bm.tv.finder.typeDropdown.toggle',
    type: 'bm.tv.finder.type.select.target', region: 'bm.tv.finder.region.select.target',
    sort: 'bm.tv.finder.sort.select.target', genre: 'bm.tv.finder.genreTag.select.target',
    filterOpen: 'bm.tv.finder.filterPanel.open', era: 'bm.tv.finder.era.select.target',
    platform: 'bm.tv.finder.platform.select.target', rating: 'bm.tv.finder.ratingRange.adjust',
    unwatched: 'bm.tv.finder.unwatched.toggle', apply: 'bm.tv.finder.filterPanel.apply',
    reset: 'bm.tv.finder.emptyReset.apply', customTag: 'bm.tv.finder.customTag.add',
    freeWatch: 'bm.tv.finder.freeWatch.wontfix',
  },
};

const REGION_GROUPS: Record<string, string[]> = {
  华语: ['中国大陆', '中国香港', '中国台湾', '香港', '台湾', '中国', '华语'],
  欧美: ['美国', '英国', '法国', '德国', '意大利', '西班牙', '加拿大', '澳大利亚'],
  日本: ['日本'], 韩国: ['韩国'],
};
const regionOf = (info?: string) => (info ?? '').split('/')[0].trim();
const hashOf = (id: string) => { let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff; return h; };
const isPlayable = (id: string) => hashOf(id) % 4 !== 0;
const PLATFORMS_ALL = ['腾讯视频', '爱奇艺', '优酷', '芒果TV', 'Netflix', 'HBO'];
const platformOf = (id: string) => PLATFORMS_ALL[hashOf(id) % PLATFORMS_ALL.length];
const VARIETY = ['真人秀', '综艺', '脱口秀'];

export function ChannelFinderSection({ channel }: { channel: Ch }) {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const marks = useDoubanStore((s) => s.marks);
  const toast = useDoubanStore((s) => s.toast);
  const A = IDS[channel];
  const isMovie = channel === 'movie';

  const [playable, setPlayable] = React.useState(false);
  const [type, setType] = React.useState(isMovie ? '电影' : '电视剧');
  const [region, setRegion] = React.useState('全部');
  const [sort, setSort] = React.useState(isMovie ? '近期热度' : '首播时间');
  const [genres, setGenres] = React.useState<string[]>([]);
  const [dropdown, setDropdown] = React.useState<Dropdown>(null);
  const [showFilter, setShowFilter] = React.useState(false);
  const [era, setEra] = React.useState('全部');
  const [platform, setPlatform] = React.useState('全部');
  const [ratingLo, setRatingLo] = React.useState(2);
  const [ratingHi, setRatingHi] = React.useState(10);
  const [unwatched, setUnwatched] = React.useState(false);
  const [customTags, setCustomTags] = React.useState<string[]>([]);

  const genreTags = isMovie
    ? ['剧情', '喜剧', '动作', '犯罪', '悬疑', '惊悚', '爱情', '科幻', '恐怖', '战争', '历史']
    : ['黑色幽默', '女性', '传记', '恐怖', '青春', '惊悚', '美食', '机战', '医疗', '科幻'];
  const typeOpts = isMovie ? ['电影', '喜剧', '动作', '爱情', '科幻', '恐怖'] : ['电视剧', '综艺', '动漫', '纪录片'];
  const regionOpts = ['全部', '华语', '欧美', '美国', '日本', '韩国'];
  const sortOpts = ['首播时间', '近期热度'];
  const eras = ['全部', '2020年代', '2026', '2025', '2024', '2023', '2022'];
  const platforms = ['全部', '腾讯视频', '爱奇艺', '优酷', '芒果TV', 'Netflix', 'HBO'];

  const results = React.useMemo(() => {
    let arr = subjects.filter((s) => s.type === (isMovie ? 'movie' : 'tv'));
    if (isMovie) {
      if (type !== '电影') arr = arr.filter((s) => (s.genres ?? []).includes(type));
    } else {
      if (type === '综艺') arr = arr.filter((s) => (s.genres ?? []).some((g) => VARIETY.includes(g)));
      else if (type === '动漫') arr = arr.filter((s) => (s.genres ?? []).some((g) => ['动画', '动漫'].includes(g)));
      else if (type === '纪录片') arr = arr.filter((s) => (s.genres ?? []).some((g) => g.includes('纪录')));
    }
    if (region !== '全部') {
      const grp = REGION_GROUPS[region] ?? [region];
      arr = arr.filter((s) => grp.some((r) => regionOf(s.info).includes(r)));
    }
    if (genres.length > 0) arr = arr.filter((s) => (s.genres ?? []).some((g) => genres.includes(g)));
    if (era !== '全部') {
      if (era === '2020年代') arr = arr.filter((s) => { const y = parseInt(s.year ?? '', 10); return y >= 2020 && y <= 2029; });
      else arr = arr.filter((s) => s.year === era);
    }
    if (ratingLo > 2 || ratingHi < 10) arr = arr.filter((s) => s.rating != null && s.rating >= ratingLo && s.rating <= ratingHi);
    if (platform !== '全部') arr = arr.filter((s) => platformOf(s.id) === platform);
    if (playable) arr = arr.filter((s) => isPlayable(s.id));
    if (unwatched) {
      const seen = new Set(marks.filter((m) => m.status === 'done').map((m) => m.subjectId));
      arr = arr.filter((s) => !seen.has(s.id));
    }
    if (sort === '近期热度') arr = [...arr].sort((a, b) => b.ratingCount - a.ratingCount);
    else arr = [...arr].sort((a, b) => parseInt(b.year ?? '0', 10) - parseInt(a.year ?? '0', 10));
    return arr;
  }, [subjects, marks, isMovie, type, region, genres, sort, era, ratingLo, ratingHi, platform, playable, unwatched]);

  const toggleGenre = (g: string) => setGenres((p) => (p.includes(g) ? p.filter((x) => x !== g) : [...p, g]));
  const reset = () => { setPlayable(false); setType(isMovie ? '电影' : '电视剧'); setRegion('全部'); setSort(isMovie ? '近期热度' : '首播时间'); setGenres([]); setEra('全部'); setPlatform('全部'); setRatingLo(2); setRatingHi(10); setUnwatched(false); setCustomTags([]); };

  // 结果卡跳转/标记(transition from-check 按频道:各自页内已用同名 id)
  const bindItem = (id: string) => isMovie
    ? bindTap('bm.movie.item-open', { params: { itemId: id } })
    : bindTap('bm.tv.item-open', { params: { itemId: id } });
  const bindMark = (sid: string) =>
    isMovie
      ? bindTap('bm.movie.mark-open', { beforeTrigger: () => addHistory('subject', sid) })
      : bindTap('bm.tv.mark-open', { beforeTrigger: () => addHistory('subject', sid) });

  // 评分双拇指滑块
  const trackRef = React.useRef<HTMLDivElement>(null);
  const dragThumb = React.useRef<'lo' | 'hi' | null>(null);
  const pct = (v: number) => (v / 10) * 100;
  const valFromX = (x: number) => { const el = trackRef.current; if (!el) return 0; const r = el.getBoundingClientRect(); return Math.round(Math.max(0, Math.min(1, (x - r.left) / r.width)) * 10); };
  const onDown = (w: 'lo' | 'hi') => (e: React.PointerEvent) => { e.stopPropagation(); dragThumb.current = w; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onMove = (e: React.PointerEvent) => { if (!dragThumb.current) return; const v = valFromX(e.clientX); if (dragThumb.current === 'lo') setRatingLo(Math.min(v, ratingHi)); else setRatingHi(Math.max(v, ratingLo)); };
  const onUp = (e: React.PointerEvent) => { if (!dragThumb.current) return; (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId); dragThumb.current = null; };

  const filtered = (v: 'lo' | 'hi') => (v === 'lo' ? ratingLo : ratingHi);

  return (
    <div id={`finder-${channel}`} className="relative bg-white mt-2">
      <div className="px-4 pt-4 pb-1 text-2xl font-bold" style={{ color: C.text }}>找{isMovie ? '电影' : '电视'}</div>

      {/* chips 行:可播放 + 类型/地区/排序 下拉 + 漏斗 */}
      <div className="flex items-center gap-3 px-4 py-2 overflow-x-auto" data-scroll-container="finder-chips" data-scroll-direction="horizontal">
        <Chip label="可播放" size="sm" active={playable} bind={bindTap({ kind: 'action', id: A.playable }, { onTrigger: () => setPlayable((v) => !v) })} />
        <button {...bindTap({ kind: 'action', id: A.typeDD }, { onTrigger: () => setDropdown((d) => (d === 'type' ? null : 'type')) })} className="text-sm shrink-0 bg-transparent border-none cursor-pointer" style={{ color: type !== typeOpts[0] ? C.green : C.sub, fontWeight: type !== typeOpts[0] ? 600 : 400 }}>{type !== typeOpts[0] ? type : '类型'} ∨</button>
        <button {...bindTap({ kind: 'action', id: A.region }, { onTrigger: () => setDropdown((d) => (d === 'region' ? null : 'region')) })} className="text-sm shrink-0 bg-transparent border-none cursor-pointer" style={{ color: region !== '全部' ? C.green : C.sub, fontWeight: region !== '全部' ? 600 : 400 }}>{region !== '全部' ? region : '地区'} ∨</button>
        <button {...bindTap({ kind: 'action', id: A.sort }, { onTrigger: () => setDropdown((d) => (d === 'sort' ? null : 'sort')) })} className="text-sm shrink-0 bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>{sort} ∨</button>
        <span className="flex-1" />
        <button {...bindTap({ kind: 'action', id: A.filterOpen }, { onTrigger: () => setShowFilter(true) })} className="relative text-base shrink-0 bg-transparent border-none cursor-pointer px-1" style={{ color: C.sub }} aria-label="筛选">
          ▽
          {(era !== '全部' || platform !== '全部' || ratingLo > 2 || ratingHi < 10 || unwatched || customTags.length > 0) && <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />}
        </button>
      </div>

      {/* 题材标签 */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto" data-scroll-container="genre-tags" data-scroll-direction="horizontal">
        {genreTags.map((g) => {
          const on = genres.includes(g);
          return (
            <button key={g} {...bindTap({ kind: 'action', id: A.genre }, { onTrigger: () => toggleGenre(g) })} className="text-[13px] px-3 py-1 rounded-md shrink-0 cursor-pointer" style={{ background: C.surface, border: `1px solid ${on ? C.green : C.border}`, color: on ? C.green : C.text }}>{g}</button>
          );
        })}
      </div>

      {results.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm" style={{ color: C.sub }}>
          暂无符合条件的{isMovie ? '电影' : '影视'},
          <button {...bindTap({ kind: 'action', id: A.reset }, { onTrigger: reset })} className="bg-transparent border-none cursor-pointer p-0 text-sm" style={{ color: C.green }}>重置</button>
        </div>
      ) : (
        <>
          {/* 快速标记引导 banner */}
          <div className="mx-4 mt-2 rounded-xl px-4 py-4 text-center" style={{ background: 'linear-gradient(135deg,#FFD98A,#FFB84D)' }}>
            <div className="text-base font-bold" style={{ color: '#5A3A00' }}>快速标记你的过往</div>
            <div className="text-sm mt-0.5" style={{ color: '#5A3A00' }}>获得更精准的{isMovie ? '电影' : '剧集'}推荐</div>
            <button {...bindTap({ kind: 'action', id: A.freeWatch }, { onTrigger: () => toast('该功能暂未开放') })} className="mt-2 w-full h-10 rounded-lg text-sm font-semibold border-none cursor-pointer" style={{ background: '#2A2A2A', color: C.orange }}>立即查看 ›</button>
          </div>

          {/* 豆瓣片单 大卡 */}
          <div className="mx-4 mt-3 rounded-xl overflow-hidden relative" style={{ height: 132 }}>
            <Img src={results[0]?.cover ?? ''} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(90deg,rgba(0,0,0,0.62),rgba(0,0,0,0.05))' }} />
            <div className="absolute inset-0 p-3 flex flex-col justify-end">
              <div className="text-[10px] text-white/80">豆瓣片单</div>
              <div className="text-base font-bold text-white mt-0.5">{isMovie ? '影史高分佳作,一次看个够' : '封神级华语剧,一次看个够'}</div>
              <div className="text-[11px] text-white/85 mt-1">沈知遥创建 · 共176部</div>
            </div>
          </div>

          {/* 双列瀑布 */}
          <div className="px-4 pt-3 pb-4 grid grid-cols-2 gap-3">
            {results.map((s) => (
              <div key={s.id} className="bg-white rounded-lg overflow-hidden relative" style={{ border: `1px solid ${C.border}` }}>
                <button {...bindItem(s.id)} className="block w-full text-left bg-transparent border-none cursor-pointer p-0">
                  <div className="relative">
                    <Img src={s.cover} className="w-full object-cover" style={{ aspectRatio: '3 / 4' }} />
                  </div>
                  <div className="px-2 pt-1.5 pb-1">
                    <div className="text-xs font-semibold truncate" style={{ color: C.text }}>{s.title}</div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Stars value={s.rating} size={10} />
                      <span className="text-[10px] font-semibold" style={{ color: C.orange }}>{s.rating != null ? s.rating.toFixed(1) : '暂无'}</span>
                    </div>
                    <div className="mt-0.5 text-[10px] truncate" style={{ color: C.sub }}>{s.info}</div>
                  </div>
                </button>
                <button {...bindMark(s.id)} className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded-full cursor-pointer border-none" style={{ background: marks.some((m) => m.subjectId === s.id) ? '#00B51D' : 'rgba(0,0,0,0.4)', color: '#fff' }}>{marks.some((m) => m.subjectId === s.id) ? '✓' : '♡'}</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 类型/地区/排序 下拉面板 */}
      {dropdown && (
        <>
          <div {...bindTap({ kind: 'action', id: A.typeDD }, { onTrigger: () => setDropdown(null) })} className="absolute inset-0 z-10" style={{ background: 'rgba(0,0,0,0.15)' }} />
          <div className="absolute left-0 right-0 z-20 bg-white p-3 shadow" style={{ top: 96, borderBottom: `1px solid ${C.border}` }}>
            <div className="flex gap-2 flex-wrap">
              {(dropdown === 'type' ? typeOpts : dropdown === 'region' ? regionOpts : sortOpts).map((o) => {
                const actId = dropdown === 'type' ? A.type : dropdown === 'region' ? A.region : A.sort;
                const active = dropdown === 'type' ? type === o : dropdown === 'region' ? region === o : sort === o;
                return (
                  <Chip key={o} label={o} active={active} bind={bindTap({ kind: 'action', id: actId }, { onTrigger: () => { if (dropdown === 'type') setType(o); else if (dropdown === 'region') setRegion(o); else setSort(o); setDropdown(null); } })} />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 漏斗筛选面板 */}
      {showFilter && (
        <Sheet title="筛选">
          <div className="px-4 pb-2">
            <div className="text-xs mb-2 font-semibold" style={{ color: C.text }}>年代</div>
            <div className="flex gap-2 flex-wrap mb-3">
              {eras.map((e) => (
                <Chip key={e} label={e} active={era === e} bind={bindTap({ kind: 'action', id: A.era }, { onTrigger: () => setEra(e) })} />
              ))}
            </div>
            <div className="text-xs mb-2 font-semibold" style={{ color: C.text }}>平台</div>
            <div className="flex gap-2 flex-wrap mb-3">
              {platforms.map((p) => (
                <Chip key={p} label={p} active={platform === p} bind={bindTap({ kind: 'action', id: A.platform }, { onTrigger: () => setPlatform(p) })} />
              ))}
            </div>
            {/* 标签(截图501:标签组在评分区间之上,仅 +自定义标签) */}
            <div className="text-xs mb-2 font-semibold" style={{ color: C.text }}>标签</div>
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <button {...bindTap({ kind: 'action', id: A.customTag }, { onTrigger: () => setCustomTags((p) => [...p, `自定义${p.length + 1}`]) })} className="text-xs px-2.5 py-1 rounded-md border cursor-pointer" style={{ borderColor: C.green, color: C.green, background: 'transparent' }}>+自定义标签</button>
              {customTags.map((t) => <span key={t} className="text-xs px-2.5 py-1 rounded-md" style={{ background: C.greenSoft, color: C.green }}>{t}</span>)}
            </div>
            {/* 评分区间:标签在左,滑轨在右(截图501) */}
            <div className="flex items-center gap-3 py-3 border-t" style={{ borderColor: C.border }}>
              <span className="text-sm font-semibold shrink-0" style={{ color: C.text }}>评分区间</span>
              <div className="flex-1 pt-3">
                <div className="flex items-center justify-between mb-1 -mt-4">
                  <span className="text-[10px]" style={{ color: C.sub }}>{ratingLo}分</span>
                  <span className="text-[10px]" style={{ color: C.sub }}>{ratingHi}分</span>
                </div>
                <div ref={trackRef} className="relative h-1 rounded-full" style={{ background: '#E5E7EB' }}>
                  <div className="absolute h-1 rounded-full" style={{ left: `${pct(ratingLo)}%`, right: `${100 - pct(ratingHi)}%`, background: C.orange }} />
                  {(['lo', 'hi'] as const).map((w) => (
                    <button key={w} onPointerDown={onDown(w)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} {...bindTap({ kind: 'action', id: A.rating }, { onTrigger: () => {} })} className="absolute w-5 h-5 rounded-full bg-white shadow border cursor-pointer -translate-x-1/2 -translate-y-2" style={{ left: `${pct(filtered(w))}%`, borderColor: C.orange, touchAction: 'none' }} aria-label={w === 'lo' ? '最低分' : '最高分'} />
                  ))}
                </div>
              </div>
            </div>
            {/* 未标「看过」:标题+副说明+开关(截图501) */}
            <div className="flex items-center py-3 border-t" style={{ borderColor: C.border }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: C.text }}>未标&ldquo;看过&rdquo;</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>仅看还没有被标记为&ldquo;看过&rdquo;的影片</div>
              </div>
              <button {...bindTap({ kind: 'action', id: A.unwatched }, { onTrigger: () => setUnwatched((v) => !v) })} className="w-11 h-6 rounded-full relative cursor-pointer border-none shrink-0" style={{ background: unwatched ? C.green : '#D8DCE1' }} aria-label="未标看过">
                <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white" style={{ left: unwatched ? 22 : 2 }} />
              </button>
            </div>
            {/* 免费观看设置(截图501:标题+副说明+⚙) */}
            <button {...bindTap({ kind: 'action', id: A.freeWatch }, { onTrigger: () => toast('该功能暂未开放') })} className="w-full flex items-center py-3 border-t bg-transparent border-x-0 border-b-0 cursor-pointer text-left" style={{ borderColor: C.border }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: C.text }}>免费观看设置</div>
                <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>定制免费观看影视库</div>
              </div>
              <span className="text-base shrink-0" style={{ color: C.sub }}>⚙</span>
            </button>
          </div>
          <div className="flex items-stretch pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
            <button {...bindTap({ kind: 'action', id: A.apply }, { onTrigger: () => setShowFilter(false) })} className="flex-1 h-11 text-sm bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>取消</button>
            <span className="w-px self-center" style={{ height: 20, background: C.border }} />
            <button {...bindTap({ kind: 'action', id: A.apply }, { onTrigger: () => setShowFilter(false) })} className="flex-1 h-11 text-sm font-semibold bg-transparent border-none cursor-pointer" style={{ color: C.green }}>确定</button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

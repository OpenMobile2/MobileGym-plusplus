import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, RatingLine, TopBar, EmptyState, MarkBtn } from '../components/ui';

// 分类找音乐:home(风格9+地区5+自定义)/ results(标签行+排序chips+曲目列表)。

// 结果态筛选行:「标签: 全部 opt1 opt2 …」,选中项绿字浅绿底。
function FilterRow({
  label,
  options,
  value,
  bindFor,
}: {
  label: string;
  options: string[];
  value: string;
  onPick: (v: string) => void;
  bindFor: (v: string) => object;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs mt-1.5 shrink-0" style={{ color: C.sub }}>{label}:</span>
      <div className="flex gap-1.5 flex-wrap">
        <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: '#F2F3F5', color: C.sub }}>全部</span>
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              {...bindFor(o)}
              className="text-[11px] px-2.5 py-1 rounded-full border-none cursor-pointer"
              style={{ background: active ? C.greenSoft : '#F2F3F5', color: active ? C.green : C.sub, fontWeight: active ? 600 : 400 }}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MusicCategoryPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const addHistory = useDoubanStore((s) => s.addHistory);
  const [view, setView] = React.useState<'home' | 'results'>('home');
  const [style, setStyle] = React.useState('流行');
  const [region, setRegion] = React.useState('华语');
  const [sort, setSort] = React.useState('热度');
  const [customTags, setCustomTags] = React.useState<string[]>([]);

  const allMusics = React.useMemo(() => subjects.filter((s) => s.type === 'music'), [subjects]);

  // 风格分区(3 列色块,顺序与真机一致);地区分区。
  const styles = ['流行', '摇滚', '民谣', '独立', '古典', '电子', '爵士', 'R&B', '说唱'];
  const regions = ['华语', '欧美', '日本', '韩国'];
  const sorts = ['热度', '评分', '时间'];

  // 每个风格/地区色块的渐变皮肤(近似真机的深色图底质感)。
  const STYLE_SKINS: Record<string, string> = {
    流行: 'linear-gradient(135deg,#4A5548,#2F3A32)',
    摇滚: 'linear-gradient(135deg,#2A2A2E,#0E0E12)',
    民谣: 'linear-gradient(135deg,#8A8D91,#5E6165)',
    独立: 'linear-gradient(135deg,#C88A2E,#8A5A16)',
    古典: 'linear-gradient(135deg,#1F4E6E,#123449)',
    电子: 'linear-gradient(135deg,#AEB2B8,#7E838A)',
    爵士: 'linear-gradient(135deg,#5E4A48,#3A2E2C)',
    'R&B': 'linear-gradient(135deg,#4C5A50,#2E3831)',
    说唱: 'linear-gradient(135deg,#6E5A4E,#463A31)',
  };
  const REGION_SKINS: Record<string, string> = {
    华语: 'linear-gradient(135deg,#4E5A50,#303A33)',
    欧美: 'linear-gradient(135deg,#9E8A94,#6E5E66)',
    日本: 'linear-gradient(135deg,#8A9298,#5E656A)',
    韩国: 'linear-gradient(135deg,#4B4EA8,#2E3070)',
  };

  // 风格 → genres 关键词;说唱同时匹配「嘻哈」;R&B/独立复用相近 genre。
  const STYLE_GENRES: Record<string, string[]> = {
    流行: ['流行', 'K-Pop', '舞曲'],
    摇滚: ['摇滚', '独立', '现场'],
    民谣: ['民谣', '独立'],
    独立: ['独立', '民谣', '摇滚'],
    古典: ['古典'],
    电子: ['电子', '合成器', '舞曲'],
    爵士: ['爵士'],
    'R&B': ['R&B', '嘻哈', '流行'],
    说唱: ['说唱', '嘻哈'],
  };
  // 地区 → genres 关键词(华语/K-Pop 有对应 genre;欧美/日本靠 genre 兜底)。
  const REGION_GENRES: Record<string, string[]> = {
    华语: ['华语'],
    韩国: ['K-Pop'],
    欧美: ['欧美', '摇滚', '独立', '电子', '合成器'],
    日本: ['日本', 'J-Pop', 'City Pop'],
    其他: [],
  };

  const musics = React.useMemo(() => {
    const styleWanted = STYLE_GENRES[style] ?? [style];
    const regionWanted = REGION_GENRES[region] ?? [region];
    const arr = allMusics.filter((m) => {
      const g = m.genres ?? [];
      const styleOk = g.some((x) => styleWanted.includes(x));
      const regionOk = region === '其他' ? !g.includes('华语') && !g.includes('K-Pop') : g.some((x) => regionWanted.includes(x));
      return styleOk && regionOk;
    });
    if (sort === '评分') arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === '热度') arr.sort((a, b) => b.ratingCount - a.ratingCount);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allMusics, style, region, sort]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="分类找音乐" />

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {view === 'home' ? (
          <>
            {/* 顶部筛选条:漏斗 + 分类找音乐 + 「地区、流派、特色 >」(非导航,展示态) */}
            <div className="mx-4 mt-3 mb-1 flex items-center rounded-xl border px-4 py-3" style={{ borderColor: C.border, background: C.surface }}>
              <span className="mr-2 text-base" style={{ color: C.text }}>▽</span>
              <span className="text-sm font-semibold" style={{ color: C.text }}>分类找音乐</span>
              <span className="flex-1" />
              <span className="text-xs" style={{ color: C.sub }}>地区、流派、特色</span>
              <span className="ml-1 text-xs" style={{ color: C.sub }}>›</span>
            </div>

            {/* 风格分区:3 列图底色块 */}
            <div className="px-4 pt-4 pb-2 text-base font-bold" style={{ color: C.text }}>风格</div>
            <div className="grid grid-cols-3 gap-2 px-4">
              {styles.map((s) => (
                <button
                  key={s}
                  {...bindTap({ kind: 'action', id: 'music.category.style.select.target' }, { onTrigger: () => { setStyle(s); setView('results'); } })}
                  className="flex items-center justify-center rounded-lg border-none cursor-pointer"
                  style={{ height: 68, background: STYLE_SKINS[s] ?? C.dark }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#fff' }}>{s}</span>
                </button>
              ))}
            </div>

            {/* 地区分区:3 列图底色块 */}
            <div className="px-4 pt-5 pb-2 text-base font-bold" style={{ color: C.text }}>地区</div>
            <div className="grid grid-cols-3 gap-2 px-4">
              {regions.map((r) => (
                <button
                  key={r}
                  {...bindTap({ kind: 'action', id: 'music.category.region.select.target' }, { onTrigger: () => { setRegion(r); setView('results'); } })}
                  className="flex items-center justify-center rounded-lg border-none cursor-pointer"
                  style={{ height: 68, background: REGION_SKINS[r] ?? C.dark }}
                >
                  <span className="text-sm font-semibold" style={{ color: '#fff' }}>{r}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 结果态筛选区:风格 / 地区 / 其他(+自定义标签)三行 chips */}
            <div className="bg-white px-4 pt-2 pb-1 space-y-2">
              <FilterRow
                label="风格"
                options={styles}
                value={style}
                onPick={(v) => setStyle(v)}
                bindFor={(v) => bindTap({ kind: 'action', id: 'music.category.style.select.target' }, { onTrigger: () => setStyle(v) })}
              />
              <FilterRow
                label="地区"
                options={[...regions, '其他']}
                value={region}
                onPick={(v) => setRegion(v)}
                bindFor={(v) => bindTap({ kind: 'action', id: 'music.category.region.select.target' }, { onTrigger: () => setRegion(v) })}
              />
              <div className="flex items-start gap-2">
                <span className="text-xs mt-1.5 shrink-0" style={{ color: C.sub }}>其他:</span>
                <div className="flex gap-1.5 flex-wrap items-center">
                  <span className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: C.greenSoft, color: C.green }}>全部</span>
                  {customTags.map((t) => (
                    <span key={t} className="text-[11px] px-2.5 py-1 rounded-full" style={{ background: C.greenSoft, color: C.green }}>{t}</span>
                  ))}
                  <button {...bindTap({ kind: 'action', id: 'music.category.customTag.add' }, { onTrigger: () => setCustomTags((prev) => [...prev, `标签${prev.length + 1}`]) })} className="text-[11px] px-2 py-1 bg-transparent border-none cursor-pointer" style={{ color: C.green }}>+ 自定义标签</button>
                </div>
              </div>
            </div>

            {/* 排序段控(白底描边分段)+ 漏斗(绿点) */}
            <div className="flex items-center px-4 py-2 bg-white border-t" style={{ borderColor: C.border }}>
              <div className="inline-flex items-center rounded-lg p-0.5" style={{ background: '#F2F3F5' }}>
                {sorts.map((s) => {
                  const active = sort === s;
                  return (
                    <button
                      key={s}
                      {...bindTap({ kind: 'action', id: 'music.category.sort.select.target' }, { onTrigger: () => setSort(s) })}
                      className="px-2.5 py-1 rounded-md text-xs border-none cursor-pointer"
                      style={active ? { background: C.surface, color: C.text, fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { background: 'transparent', color: C.sub }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <span className="flex-1" />
              <div className="relative shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" stroke={C.sub} strokeWidth="1.8" strokeLinejoin="round" /></svg>
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />
              </div>
            </div>

            {musics.length === 0 && <EmptyState text={`「${region} · ${style}」暂无结果`} sub="换个风格或地区试试" />}
            <div className="px-4 pt-2 space-y-2">
              {musics.map((m) => (
                <div key={m.id} className="flex gap-3 items-center bg-white rounded-lg p-3">
                  <button {...bindTap('music.category.item-open', { params: { subjectId: m.id } })} className="flex gap-3 flex-1 min-w-0 items-center text-left bg-transparent border-none cursor-pointer">
                    <Img src={m.cover} className="shrink-0 rounded object-cover" style={{ width: 96, height: 96 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{m.title}</div>
                      {m.rating != null && <div className="mt-1"><RatingLine rating={m.rating} size={10} /></div>}
                      <div className="mt-0.5 text-[11px] truncate" style={{ color: C.sub }}>{[m.artist, m.year].filter(Boolean).join(' / ') || m.info}</div>
                    </div>
                  </button>
                  <MarkBtn label="想听" marked={marks.some((mk) => mk.subjectId === m.id)} markedLabel="已想听" bind={bindTap('music.category.mark-open', { beforeTrigger: () => addHistory('subject', m.id) })} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

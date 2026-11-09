import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, RatingLine, TopBar, EmptyState, MarkBtn, fmtCount } from '../components/ui';

// 分类找图书:home(分类标签+专题色块)/ results(排序chips+图书列表)。
// 由 subjectId 派生的稳定「其他版本」数量(真机为 26/116 式真实数字,此处确定性派生非随机)。
function editionCount(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
  return 6 + (h % 250);
}

export default function BookCategoryPage() {
  const { bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const addHistory = useDoubanStore((s) => s.addHistory);
  // topic=专题主题榜视图(名著经典,rec63fb7d:深色头图+编号列表+想读)
  const [view, setView] = React.useState<'home' | 'results' | 'topic'>('home');
  // 结果态标签多选(截图500:哲学+心理可同时选中)
  const [tags, setTags] = React.useState<string[]>(['文学']);
  const [sort, setSort] = React.useState('热度');
  const [buyable, setBuyable] = React.useState(false);
  const markedIds = React.useMemo(() => new Set(marks.map((m) => m.subjectId)), [marks]);

  const allBooks = React.useMemo(() => subjects.filter((s) => s.type === 'book'), [subjects]);

  // 顶部结果态标签流(IMG_0371:文字标签铺满,末尾「+输入你想找的词」)。
  const tagOptions = [
    '诗歌', '小说', '散文', '戏剧', '传记', '哲学', '历史',
    '艺术', '心理', '教育', '生活', '摄影', '绘画', '旅行',
    '美食', '建筑', '设计', '互联网', '经济', '科幻', '推理',
    '武侠', '漫画', '科技',
  ];

  // 首页色块专题分组(IMG_0370:section-header 分组的 3 列色块)。
  // color 为渐变/纯色兜底(无图片资源时使用色块);label 为分类名。
  const sections: { header: string; blocks: { label: string; color: string }[] }[] = [
    {
      header: '专题',
      blocks: [{ label: '名著经典', color: '#9E6E68' }],
    },
    {
      header: '精神避难所',
      blocks: [
        { label: '文学', color: '#3C3B3A' },
        { label: '诗歌', color: '#9AA0A6' },
        { label: '小说', color: '#4A4441' },
        { label: '散文', color: '#B08A57' },
        { label: '戏剧', color: '#B7A06B' },
        { label: '传记', color: '#8A6244' },
        { label: '哲学', color: '#2C3E73' },
        { label: '历史', color: '#8A5A3B' },
        { label: '艺术', color: '#8E8FA3' },
      ],
    },
    {
      header: '生活启示录',
      blocks: [
        { label: '心理', color: '#B08A85' },
        { label: '教育', color: '#2A2724' },
        { label: '生活', color: '#5A5754' },
        { label: '摄影', color: '#B7BABF' },
        { label: '绘画', color: '#5E6B4E' },
        { label: '语言', color: '#2C4A5C' },
        { label: '旅行', color: '#8A4E77' },
        { label: '家居', color: '#B9B6AF' },
        { label: '美食', color: '#9C9690' },
      ],
    },
    {
      header: '职业成长营',
      blocks: [
        { label: '建筑', color: '#3E9E5A' },
        { label: '法律', color: '#232120' },
        { label: '设计', color: '#3A3736' },
        { label: '科技', color: '#2A3B4A' },
        { label: '互联网', color: '#345A7A' },
        { label: '计算机', color: '#454A4E' },
        { label: '经济', color: '#6B5B3E' },
        { label: '管理', color: '#8A7A5A' },
        { label: '广告', color: '#7A5A5A' },
      ],
    },
    {
      header: '流行特色区',
      blocks: [
        { label: '科幻', color: '#2C3E73' },
        { label: '推理', color: '#3A3736' },
        { label: '武侠', color: '#5A3B2E' },
        { label: '奇幻', color: '#4A3B6B' },
        { label: '绘本', color: '#6E7E52' },
        { label: '漫画', color: '#A85A5A' },
        { label: '反乌托邦', color: '#232120' },
      ],
    },
  ];

  const sorts = ['热度', '评分', '时间'];

  // UI 标签/专题 → genres 关键词集合(genres 里任一命中即算该标签)。
  const TAG_GENRES: Record<string, string[]> = {
    文学: ['文学', '外国文学', '当代文学', '古典文学', '日本文学', '俄国文学', '经典', '诗歌', '散文', '文学评论'],
    小说: ['小说', '中篇', '短篇集', '本格'],
    诗歌: ['诗歌', '文学'],
    散文: ['散文', '文学'],
    戏剧: ['戏剧', '文学'],
    传记: ['传记', '历史'],
    历史: ['历史', '文化', '古典文学', '传记'],
    社会纪实: ['社科', '纪实', '传媒', '女性主义'],
    科幻: ['科幻', '硬科幻', '科学', '新知'],
    科技: ['科幻', '硬科幻', '科学', '新知', '互联网'],
    艺术: ['艺术', '设计', '文学评论'],
    设计: ['设计', '艺术'],
    哲学: ['哲学', '思想'],
    心理: ['心理', '治愈', '成长'],
    名著经典: ['经典', '古典文学', '外国文学', '文学'],
    生活: ['生活', '成长', '治愈'],
    教育: ['成长', '社科'],
    摄影: ['艺术', '设计'],
    绘画: ['艺术', '设计'],
    旅行: ['生活', '文化'],
    美食: ['生活'],
    建筑: ['设计', '艺术'],
    法律: ['社科', '思想'],
    语言: ['文学', '社科'],
    家居: ['生活', '设计'],
    互联网: ['互联网', '科学', '新知'],
    经济: ['社科', '思想'],
    推理: ['推理', '悬疑', '本格'],
    武侠: ['小说', '古典文学'],
    漫画: ['小说'],
    计算机: ['互联网', '科学', '新知'],
    管理: ['社科', '思想'],
    广告: ['社科', '设计'],
    奇幻: ['科幻', '小说', '反乌托邦'],
    绘本: ['艺术', '小说'],
    反乌托邦: ['反乌托邦', '科幻', '小说'],
  };

  const books = React.useMemo(() => {
    // 多选标签 OR 语义:任一选中标签命中即入选(截图500);全不选=全部
    const wanted = tags.length === 0 ? null : tags.flatMap((t) => TAG_GENRES[t] ?? [t]);
    let arr = wanted == null ? [...allBooks] : allBooks.filter((b) => (b.genres ?? []).some((g) => wanted.includes(g)));
    if (buyable) arr = arr.filter((b) => b.buyPrice != null);
    if (sort === '评分') arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    else if (sort === '热度') arr.sort((a, b) => b.ratingCount - a.ratingCount);
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allBooks, tags, sort, buyable]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="分类找图书" />

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {view === 'home' ? (
          <>
            {/* 顶部筛选条:分类找图书 … 地区、类型、特色 › */}
            <div className="px-4 pt-3 pb-2">
              <button
                {...bindTap({ kind: 'action', id: 'book.category.tag.select.target' }, { onTrigger: () => setView('results') })}
                className="w-full flex items-center gap-2 rounded-lg border px-3.5 h-12 bg-white cursor-pointer text-left"
                style={{ borderColor: C.border }}
              >
                {/* 漏斗 icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                  <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" stroke={C.text} strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                <span className="text-[15px] font-medium" style={{ color: C.text }}>分类找图书</span>
                <span className="flex-1" />
                <span className="text-xs" style={{ color: C.sub }}>地区、类型、特色</span>
                <span className="text-base" style={{ color: C.sub }}>›</span>
              </button>
            </div>

            {/* section-header 分组的 3 列色块 */}
            {sections.map((sec) => (
              <div key={sec.header} className="mt-3">
                <div className="px-4 pb-2.5 text-lg font-bold" style={{ color: C.text }}>{sec.header}</div>
                <div className="px-4 grid grid-cols-3 gap-2.5">
                  {sec.blocks.map((blk) => (
                    <button
                      key={blk.label}
                      {...bindTap({ kind: 'action', id: 'book.category.topic.select.target' }, { params: { target: blk.label }, onTrigger: () => { setTags([blk.label]); setBuyable(false); setView(sec.header === '专题' ? 'topic' : 'results'); } })}
                      className="h-16 rounded-md flex items-center justify-center px-1 text-center border-none cursor-pointer relative overflow-hidden"
                      style={{ background: blk.color }}
                    >
                      {/* 图片可选:无资源时用色块 + 半透明遮罩,标签居中白字 */}
                      <span className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.12)' }} />
                      <span className="relative text-sm font-semibold text-white">{blk.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : view === 'topic' ? (
          <>
            {/* 专题主题榜(名著经典,rec63fb7d):深棕头图 + 编号列表 + 想读 */}
            <div className="relative px-4 pt-6 pb-5" style={{ background: 'linear-gradient(180deg,#5B3A38,#6E4A46)' }}>
              <button
                {...bindTap({ kind: 'action', id: 'book.category.topic.select.target' }, { params: { target: 'home' }, onTrigger: () => setView('home') })}
                className="absolute left-2 top-2 w-9 h-9 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer text-white"
                aria-label="返回分类"
              >‹</button>
              <div className="text-center text-xl font-bold text-white">{tags[0] ?? '专题'}</div>
              <div className="mt-1 text-center text-[11px] text-white/70">共 {books.length} 本 · 编辑精选</div>
            </div>
            {books.map((b, i) => (
              <div key={b.id} className="flex gap-3 items-start bg-white px-4 py-3 border-b" style={{ borderColor: '#F5F6F7' }}>
                <span className="w-5 shrink-0 text-center text-[15px] font-semibold pt-6" style={{ color: i < 3 ? C.orange : C.sub }}>{i + 1}</span>
                <div {...bindTap('book.category.item-open', { params: { subjectId: b.id } })} role="button" className="flex gap-3 flex-1 min-w-0 cursor-pointer">
                  <Img src={b.cover} className="shrink-0 rounded object-cover" style={{ width: 52, height: 74 }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{b.title}</div>
                    <div className="mt-0.5 text-[11px]" style={{ color: C.sub }}>{fmtCount(b.ratingCount)}人想读</div>
                    <div className="mt-0.5 text-[11px] truncate" style={{ color: C.sub }}>{b.info}</div>
                  </div>
                </div>
                <button
                  {...bindTap('book.category.mark-open', { beforeTrigger: () => addHistory('subject', b.id) })}
                  className="shrink-0 self-center flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer text-xs"
                  style={{ color: markedIds.has(b.id) ? C.sub : C.orange }}
                >
                  <span className="text-lg leading-none">{markedIds.has(b.id) ? '✓' : '♡+'}</span>
                  {markedIds.has(b.id) ? '已想读' : '想读'}
                </button>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* 结果态顶部:分类标签流铺满(多选,截图500:哲学+心理可同时绿) */}
            <div className="flex gap-2 px-4 pt-3 pb-3 flex-wrap bg-white">
              {tagOptions.map((t) => {
                const on = tags.includes(t);
                return (
                  <button
                    key={t}
                    {...bindTap({ kind: 'action', id: 'book.category.tag.select.target' }, { params: { target: t }, onTrigger: () => setTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t])) })}
                    className="px-3 py-1.5 rounded text-[13px] border-none cursor-pointer"
                    style={{ background: on ? C.greenSoft : '#F2F3F5', color: on ? C.green : C.text, fontWeight: on ? 600 : 400 }}
                  >
                    {t}
                  </button>
                );
              })}
              <span className="px-3 py-1.5 text-[13px]" style={{ color: C.green }}>+输入你想找的词</span>
            </div>

            {/* 筛选/排序条:🛒可购买 灰底pill(黑字红车) + 热度/评分/时间 白底描边分段 + 漏斗(绿点) */}
            <div className="flex items-center px-4 py-2.5 bg-white border-t" style={{ borderColor: C.border }}>
              <button
                {...bindTap({ kind: 'action', id: 'book.category.sort.select.target' }, { onTrigger: () => setBuyable((v) => !v) })}
                className="flex items-center gap-1 px-2.5 h-7 rounded-full text-xs border-none cursor-pointer"
                style={{ background: buyable ? '#FDE7E7' : '#F2F3F5', color: C.text }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M4 5h2l2 11h9l2-7H7" stroke={C.danger} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="10" cy="20" r="1.4" fill={C.danger} />
                  <circle cx="17" cy="20" r="1.4" fill={C.danger} />
                </svg>
                可购买
              </button>
              <span className="flex-1" />
              <div className="inline-flex items-center rounded-lg p-0.5 mr-2.5" style={{ background: '#F2F3F5' }}>
                {sorts.map((s) => {
                  const active = sort === s;
                  return (
                    <button
                      key={s}
                      {...bindTap({ kind: 'action', id: 'book.category.sort.select.target' }, { onTrigger: () => setSort(s) })}
                      className="px-2.5 py-1 rounded-md text-xs border-none cursor-pointer"
                      style={active ? { background: C.surface, color: C.text, fontWeight: 600, boxShadow: '0 1px 2px rgba(0,0,0,0.06)' } : { background: 'transparent', color: C.sub }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
              <div className="relative shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M3 5h18l-7 8v6l-4 2v-8L3 5z" stroke={C.sub} strokeWidth="1.8" strokeLinejoin="round" />
                </svg>
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: C.green }} />
              </div>
            </div>

            {/* 图书列表 */}
            {books.length === 0 && <EmptyState text={`「${tags.join('/') || '全部'}」暂无图书`} sub="换个分类看看" />}
            <div className="px-4 pt-2 space-y-2">
              {books.map((b) => (
                <div key={b.id} className="flex gap-3 items-start bg-white rounded-lg p-3">
                  {/* 外层 div 避免 button 嵌套 button;内层按钮阻止冒泡 */}
                  <div {...bindTap('book.category.item-open', { params: { subjectId: b.id } })} role="button" className="flex gap-3 flex-1 min-w-0 text-left cursor-pointer">
                    <Img src={b.cover} className="shrink-0 rounded object-cover" style={{ width: 52, height: 74 }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate flex items-center gap-1" style={{ color: C.text }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" className="shrink-0"><path d="M4 4h11a3 3 0 013 3v13H7a3 3 0 01-3-3V4zM4 4v13" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span className="truncate">{b.title}</span>
                      </div>
                      <div className="mt-1"><RatingLine rating={b.rating} size={10} /></div>
                      <div className="mt-1 text-[11px] truncate" style={{ color: C.sub }}>{b.info}</div>
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <button {...bindTap('book.category.edition-open', { params: { subjectId: b.id } })} onClickCapture={(e) => e.stopPropagation()} className="text-[10px] px-1.5 py-0.5 rounded cursor-pointer border-none" style={{ background: '#F2F3F5', color: C.sub }}>还有其他{editionCount(b.id)}个版本 ›</button>
                        {b.top250Rank != null && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: '#FBF6EC', color: '#B8860B' }}>豆瓣传记类图书 Top100 ›</span>}
                      </div>
                    </div>
                  </div>
                  <MarkBtn
                    label="想读"
                    marked={markedIds.has(b.id)}
                    markedLabel="已想读"
                    bind={bindTap('book.category.mark-open', { beforeTrigger: () => addHistory('subject', b.id) })}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

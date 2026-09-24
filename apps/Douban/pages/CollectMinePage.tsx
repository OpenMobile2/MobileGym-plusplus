// 我的收藏/豆列(collect.mine,/mine/collect,IMG_0232-0237,frame:38a79c@t0010/t0015):
// 收藏/豆列双tab。收藏:筛选chips(全部/内容/影视/图书/音乐,仅「全部」带计数)+混合收藏项;空→THE END。
// 豆列:类型chips(全部/文集/片单/书单/播单)+创建的/关注的切换+右上创建;空类型→猫空态。
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, Avatar, Img, RatingLine, C, Chip, EmptyState, TheEnd, MarkBtn, fmtAbsDateTime } from '../components/ui';
import type { DoubanCollectionItem } from '../types';

type CTab = 'favorites' | 'doulists';
type FavFilter = 'all' | 'content' | 'movie' | 'book' | 'music';
type DoulistType = 'all' | 'essay' | 'movieList' | 'bookList' | 'playlist';
type DoulistOwner = 'created' | 'followed';

/** 左侧计数标签名(随筛选切换) */
const favFilterLabel = (f: 'all' | 'content' | 'movie' | 'book' | 'music') =>
  ({ all: '全部', content: '内容', movie: '影视', book: '图书', music: '音乐' }[f]);
/** 标题前类型图标(绿书 / 红播放圆 / 音乐) */
const TYPE_ICON: Record<string, { icon: string; bg: string; fg: string }> = {
  movie: { icon: '▶', bg: '#FDE7E7', fg: '#E5484D' },
  book: { icon: '📖', bg: C.greenSoft, fg: C.green },
  music: { icon: '♪', bg: '#E7EEFD', fg: '#3E7BF2' },
};

export default function CollectMinePage() {
  const { bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const collections = useDoubanStore((s) => s.collections);
  const subjects = useDoubanStore((s) => s.subjects);
  const marks = useDoubanStore((s) => s.marks);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const users = useDoubanStore((s) => s.users);
  const doulists = useDoubanStore((s) => s.doulists);
  const follows = useDoubanStore((s) => s.follows);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const addHistory = useDoubanStore((s) => s.addHistory);

  const tab: CTab = searchParams.get('tab') === 'doulists' ? 'doulists' : 'favorites';
  const favFilter = (['all', 'content', 'movie', 'book', 'music'] as FavFilter[]).find((f) => f === searchParams.get('ff')) ?? 'all';
  const dlType = (['all', 'essay', 'movieList', 'bookList', 'playlist'] as DoulistType[]).find((t) => t === searchParams.get('dt')) ?? 'all';
  const dlOwner: DoulistOwner = searchParams.get('do') === 'followed' ? 'followed' : 'created';

  const subjById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);
  const bcById = useMemo(() => new Map(broadcasts.map((b) => [b.id, b])), [broadcasts]);
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const doulistById = useMemo(() => new Map(doulists.map((d) => [d.id, d])), [doulists]);

  const favList = useMemo(
    () => (favFilter === 'all' ? collections : collections.filter((it) => it.kind === favFilter)),
    [collections, favFilter],
  );

  const doulistList = useMemo(() => {
    let arr = dlOwner === 'created'
      ? doulists.filter((d) => d.ownerId === currentUser.id)
      : doulists.filter((d) => follows.doulists.includes(d.id));
    if (dlType !== 'all') {
      const labelMap: Record<Exclude<DoulistType, 'all'>, string> = { essay: '文集', movieList: '片单', bookList: '书单', playlist: '播单' };
      arr = arr.filter((d) => d.kindLabel === labelMap[dlType]);
    }
    return arr;
  }, [doulists, dlOwner, dlType, follows.doulists, currentUser.id]);

  const setParam = (key: string, val: string) =>
    setSearchParams(
      (p) => {
        p.set(key, val);
        return p;
      },
      { replace: true },
    );

  // 白卡卡片式行(圆角、卡间距)
  const rowCls = 'w-full flex gap-3 items-start p-3 bg-white rounded-lg text-left cursor-pointer';

  /** 收藏于 豆列名 绿字链接(找到收录该 ref 的豆列) */
  const sourceDoulistOf = (refId: string) => doulists.find((d) => d.items.some((i) => i.refId === refId));

  /** 底部灰底圆角「收藏于」条:日期时间 + 豆列名(绿) */
  const renderSourceBar = (it: DoubanCollectionItem, listWord: string) => {
    const source = sourceDoulistOf(it.refId);
    return (
      <div className="mt-2 rounded-md px-2.5 py-1.5 flex items-center gap-1 text-[11px]" style={{ background: '#F5F6F8', color: C.sub }}>
        <span>{fmtAbsDateTime(it.createdAt)} 收藏于{source ? listWord : ''}</span>
        {source && (
          <span
            {...bindTap('collect.sourceDoulist-open', { params: { doulistId: source.id }, stopPropagation: true })}
            className="cursor-pointer"
            style={{ color: C.green }}
            role="link"
          >
            {source.title}
          </span>
        )}
      </div>
    );
  };

  /** 单条收藏项 */
  const renderFav = (it: DoubanCollectionItem) => {
    if (it.kind === 'content') {
      // 内容:广播摘要卡(头像+昵称+右侧日期、正文)
      const b = bcById.get(it.refId);
      const u = b ? userById.get(b.authorId) : undefined;
      return (
        <div key={it.id} className={rowCls}>
          <span {...bindTap('collect.broadcast-open', { params: { id: it.refId } })} className="flex gap-3 flex-1 min-w-0 cursor-pointer">
            <Avatar src={u?.avatar ?? ''} size={40} />
            <span className="flex-1 min-w-0">
              <span className="flex items-center justify-between">
                <span className="text-xs" style={{ color: C.sub }}>{u?.name ?? '豆友'}的广播</span>
                <span className="text-[11px]" style={{ color: '#B9BEC6' }}>{fmtAbsDateTime(it.createdAt)}</span>
              </span>
              <span className="block mt-0.5 text-[14px] line-clamp-2" style={{ color: C.text }}>{b?.text ?? '内容'}</span>
              {renderSourceBar(it, '「')}
            </span>
          </span>
        </div>
      );
    }
    // 条目:类型图标+封面/评分/信息/Top250chip/收藏于 + 右侧想看想读想听
    const s = subjById.get(it.refId);
    const ti = TYPE_ICON[it.kind];
    const listWord = it.kind === 'movie' ? '片单' : '「';
    const markLabel = it.kind === 'movie' ? '想看' : it.kind === 'music' ? '想听' : '想读';
    const top250Word = it.kind === 'book' ? '豆瓣图书 Top250' : '豆瓣电影 Top250';
    const marked = s ? marks.some((m) => m.subjectId === s.id) : false;
    const tap =
      it.kind === 'book'
        ? bindTap('collect.book-open', { params: { subjectId: it.refId } })
        : it.kind === 'music'
          ? bindTap('collect.music-open', { params: { subjectId: it.refId } })
          : bindTap('collect.movie-open', { params: { itemId: it.refId } });
    return (
      <div key={it.id} className={rowCls}>
        <span {...tap} className="flex gap-3 flex-1 min-w-0 cursor-pointer">
          <Img src={s?.cover ?? ''} className="rounded object-cover shrink-0" style={{ width: 52, height: 72 }} />
          <span className="flex-1 min-w-0">
            <span className="flex items-center gap-1.5">
              {ti && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] shrink-0" style={{ background: ti.bg, color: ti.fg }}>{ti.icon}</span>
              )}
              <span className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{s?.title ?? '条目'}{s?.year ? `(${s.year})` : ''}</span>
            </span>
            <span className="block mt-1"><RatingLine rating={s?.rating ?? null} /></span>
            {s?.info && <span className="block mt-0.5 text-xs line-clamp-2" style={{ color: C.sub }}>{s.info}</span>}
            {s?.top250Rank != null && (
              <span className="inline-flex mt-1.5 px-1.5 py-0.5 rounded text-[11px]" style={{ color: '#B8860B', background: '#FBF6EC' }}>{top250Word} ›</span>
            )}
            {renderSourceBar(it, listWord)}
          </span>
        </span>
        <MarkBtn
          label={markLabel}
          marked={marked}
          markedLabel={`已${markLabel}`}
          bind={bindTap('collect.mark-open', { beforeTrigger: () => addHistory('subject', it.refId) })}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title="我的收藏/豆列"
        right={
          tab === 'doulists' ? (
            <button
              {...bindTap('collect.doulistCreate-open')}
              className="text-sm bg-transparent border-none cursor-pointer"
              style={{ color: C.green }}
            >
              创建
            </button>
          ) : undefined
        }
      />

      {/* 收藏/豆列双tab:左置窄间距 + 黑短下划线 */}
      <div className="flex items-center gap-5 px-4 bg-white border-b shrink-0" style={{ borderColor: C.border }}>
        {([['favorites', '收藏'], ['doulists', '豆列']] as [CTab, string][]).map(([t, label]) => {
          const active = tab === t;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'collect.tab.select.target' }, { params: { target: t }, onTrigger: () => setParam('tab', t) })}
              className="py-3 bg-transparent border-none cursor-pointer text-[15px] relative"
              style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
            >
              {label}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />}
            </button>
          );
        })}
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {tab === 'favorites' ? (
          <>
            {/* 筛选行:左「全部 N」+ 🔍 + 灰轨分段chips(IMG_0484) */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white">
              <span className="text-sm font-semibold shrink-0" style={{ color: C.text }}>
                {favFilterLabel(favFilter)} {favList.length}
              </span>
              <button
                {...bindTap({ kind: 'action', id: 'collect.search.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
                style={{ color: C.sub }}
                aria-label="搜索收藏"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
                </svg>
              </button>
              <div className="flex gap-2 flex-1 overflow-x-auto" data-scroll-container="fav-chips" data-scroll-direction="horizontal">
                {([['all', '全部'], ['content', '内容'], ['movie', '影视'], ['book', '图书'], ['music', '音乐']] as [FavFilter, string][]).map(([f, label]) => (
                  <Chip
                    key={f}
                    label={label}
                    active={favFilter === f}
                    variant="seg"
                    bind={bindTap({ kind: 'action', id: 'collect.filter.select.target' }, { params: { target: f }, onTrigger: () => setParam('ff', f) })}
                  />
                ))}
              </div>
            </div>
            {favList.length === 0 ? (
              <TheEnd />
            ) : (
              <div className="p-3 space-y-3">
                {favList.map(renderFav)}
                <TheEnd />
              </div>
            )}
          </>
        ) : (
          <>
            {/* 类型chips */}
            <div className="flex gap-2 px-4 pt-2.5 pb-1.5 bg-white overflow-x-auto" data-scroll-container="dl-type-chips" data-scroll-direction="horizontal">
              {([['all', '全部'], ['essay', '文集'], ['movieList', '片单'], ['bookList', '书单'], ['playlist', '播单']] as [DoulistType, string][]).map(([t, label]) => (
                <Chip
                  key={t}
                  label={label}
                  active={dlType === t}
                  bind={bindTap({ kind: 'action', id: 'collect.doulistType.select.target' }, { params: { target: t }, onTrigger: () => setParam('dt', t) })}
                />
              ))}
            </div>
            {/* 创建的/关注的切换 */}
            <div className="flex gap-4 px-4 pb-2.5 bg-white border-b" style={{ borderColor: '#F2F3F5' }}>
              {([['created', '创建的'], ['followed', '关注的']] as [DoulistOwner, string][]).map(([o, label]) => {
                const active = dlOwner === o;
                return (
                  <button
                    key={o}
                    {...bindTap({ kind: 'action', id: 'collect.doulistOwner.select.target' }, { params: { target: o }, onTrigger: () => setParam('do', o) })}
                    className="bg-transparent border-none cursor-pointer text-sm py-1"
                    style={{ color: active ? C.green : C.sub, fontWeight: active ? 600 : 400 }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            {/* 「N个」计数行(IMG_0485) */}
            <div className="px-4 py-2.5 text-sm bg-white" style={{ color: C.sub }}>{doulistList.length}个</div>
            {doulistList.length === 0 ? (
              <EmptyState text={dlOwner === 'created' ? '暂无创建的豆列' : '暂无关注的豆列'} />
            ) : (
              <div className="p-3 space-y-3">
                {doulistList.map((d) => {
                  // 片单/播单/榜单=进度「看过/听过 done/total部」;其余=「N个」
                  const total = d.items.length;
                  const hasProgress = d.kindLabel === '片单' || d.kindLabel === '播单' || d.kindLabel === '榜单';
                  const verb = d.kindLabel === '播单' ? '听过' : '看过';
                  const unit = d.kindLabel === '播单' ? '张' : '部';
                  const sub = hasProgress ? `${verb} ${d.doneCount}/${total}${unit}` : `${total}个`;
                  const badge = d.kindLabel === '播单' ? null : d.kindLabel === '片单' ? '片单' : null;
                  return (
                    <button key={d.id} {...bindTap('collect.doulist-open', { params: { doulistId: d.id } })} className={`${rowCls} items-center`}>
                      {/* 扇形堆叠封面 */}
                      <span className="relative w-14 h-14 shrink-0">
                        <Img src={d.cover} className="absolute right-0 top-0.5 w-11 h-13 rounded object-cover" style={{ transform: 'rotate(5deg)', opacity: 0.6 }} />
                        <Img src={d.cover} className="absolute left-0 top-0 w-14 h-14 rounded-lg object-cover" />
                        {badge && (
                          <span className="absolute bottom-0 left-0 px-1 py-px rounded-tr text-[9px] text-white" style={{ background: 'rgba(0,0,0,0.5)' }}>▷ {badge}</span>
                        )}
                      </span>
                      <span className="flex-1 min-w-0 self-center">
                        <span className="flex items-center gap-1 text-[15px] font-medium truncate" style={{ color: d.kindLabel === '播单' ? C.text : C.text }}>
                          {d.kindLabel === '播单' && <span style={{ color: C.danger }}>▷</span>}
                          <span className="truncate">{d.title}</span>
                        </span>
                        <span className="block mt-0.5 text-xs" style={{ color: C.sub }}>
                          {sub}{d.isPrivate ? ' · 🔒私密' : ''}
                        </span>
                      </span>
                    </button>
                  );
                })}
                <TheEnd />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

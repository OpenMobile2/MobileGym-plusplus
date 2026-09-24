// 我的关注(follow.mine,/mine/follow,IMG_0254-0284,frame:38a79c@t0020):
// 横向8类tab(片单书单/播单/地点豆列/文集/豆列/用户/人物/话题)+ 各类列表 + 计数。
// 片单书单tab二级chips(全部/榜单/片单/书单);空tab给猫空态;话题广场/用户搜索→toast。
import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { TopBar, Avatar, Img, C, SegRow, EmptyState } from '../components/ui';

type FTab =
  | 'lists' | 'playlists' | 'placeDoulists' | 'essaySets'
  | 'doulists' | 'users' | 'celebrities' | 'topics';

const TABS: [FTab, string][] = [
  ['lists', '片单/书单'],
  ['playlists', '播单'],
  ['placeDoulists', '地点豆列'],
  ['essaySets', '文集'],
  ['doulists', '豆列'],
  ['users', '用户'],
  ['celebrities', '人物'],
  ['topics', '话题'],
];

type ListType = 'all' | 'ranking' | 'movieList' | 'bookList';
const LIST_TYPE_LABEL: Record<ListType, string> = { all: '全部', ranking: '榜单', movieList: '片单', bookList: '书单' };

export default function FollowMinePage() {
  const { bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const doulists = useDoubanStore((s) => s.doulists);
  const rankings = useDoubanStore((s) => s.rankings);
  const essaySets = useDoubanStore((s) => s.essaySets);
  const users = useDoubanStore((s) => s.users);
  const celebrities = useDoubanStore((s) => s.celebrities);
  const topics = useDoubanStore((s) => s.topics);
  const subjects = useDoubanStore((s) => s.subjects);
  const follows = useDoubanStore((s) => s.follows);

  const tab: FTab = (TABS.find(([t]) => t === searchParams.get('ftab'))?.[0]) ?? 'lists';
  const [listType, setListType] = useState<ListType>('all');

  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const celebById = useMemo(() => new Map(celebrities.map((c) => [c.id, c])), [celebrities]);
  const topicById = useMemo(() => new Map(topics.map((t) => [t.id, t])), [topics]);
  const subjById = useMemo(() => new Map(subjects.map((s) => [s.id, s])), [subjects]);

  const followedDoulists = useMemo(
    () => doulists.filter((d) => follows.doulists.includes(d.id)),
    [doulists, follows.doulists],
  );

  type ListRow = {
    kind: 'ranking' | 'movieList' | 'bookList';
    id: string;
    title: string;
    /** 封面堆(subject covers) */
    covers: string[];
    /** 左下深色徽:「片单」/「TOP10」/「书单」 */
    badge: string;
    /** 深橄榄徽章(TOP10)标记 */
    top?: boolean;
    /** 可选创建人 */
    creator?: string;
    /** 看过 done/total 部/本 */
    done: number;
    total: number;
    unit: string;
    /** 关注数 */
    fans: number;
  };

  // 片单书单tab:榜单(rankings)+ 关注的片单/书单豆列 —— 带封面堆/徽标/进度
  const listRows = useMemo<ListRow[]>(() => {
    const rankItems: ListRow[] = rankings.map((r, i) => ({
      kind: 'ranking',
      id: r.id,
      title: r.title,
      covers: r.items.map((it) => subjById.get(it.subjectId)?.cover ?? '').filter(Boolean).slice(0, 3),
      badge: 'TOP10',
      top: true,
      done: 0,
      total: r.items.length,
      unit: r.kind === 'book' ? '本' : '部',
      fans: 100 + i * 137,
    }));
    const doulistItems: ListRow[] = followedDoulists
      .filter((d) => d.kindLabel === '片单' || d.kindLabel === '书单' || d.kindLabel === '榜单')
      .map((d, i) => ({
        kind: d.kindLabel === '书单' ? 'bookList' : 'movieList',
        id: d.id,
        title: d.title,
        covers: d.items.map((it) => subjById.get(it.refId)?.cover ?? '').filter(Boolean).slice(0, 3),
        badge: d.kindLabel ?? '片单',
        creator: userById.get(d.ownerId)?.name,
        done: d.doneCount,
        total: d.items.length,
        unit: d.kindLabel === '书单' ? '本' : '部',
        fans: 1 + i * 31,
      }));
    const all = [...rankItems, ...doulistItems];
    if (listType === 'all') return all;
    return all.filter((it) => it.kind === listType);
  }, [rankings, followedDoulists, listType, subjById, userById]);

  const switchTab = (t: FTab) =>
    setSearchParams(
      (p) => {
        p.set('ftab', t);
        return p;
      },
      { replace: true },
    );

  const rowCls = 'w-full flex items-center gap-3 px-4 py-3 bg-white border-b text-left cursor-pointer';
  const rowStyle = { borderColor: '#F2F3F5' } as const;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="我的关注" />

      {/* 横向类型tab */}
      <div className="flex gap-1 px-2 bg-white border-b overflow-x-auto shrink-0" style={{ borderColor: C.border }} data-scroll-container="follow-tabs" data-scroll-direction="horizontal">
        {TABS.map(([t, label]) => {
          const active = tab === t;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'follow.tab.select.target' }, { params: { target: t }, onTrigger: () => switchTab(t) })}
              className="px-3 py-3 bg-transparent border-none cursor-pointer text-sm whitespace-nowrap relative shrink-0"
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
        {/* 片单书单 */}
        {tab === 'lists' && (
          <>
            {/* 计数居左 + 二级chips 灰轨分段、右对齐 */}
            <div className="flex items-center px-4 py-2.5 bg-white">
              <span className="text-sm font-semibold shrink-0" style={{ color: C.text }}>{listRows.length}个</span>
              <div className="flex-1 flex justify-end overflow-x-auto" data-scroll-container="list-chips" data-scroll-direction="horizontal">
                <SegRow
                  options={['全部', '榜单', '片单', '书单'] as const}
                  value={LIST_TYPE_LABEL[listType]}
                  size="sm"
                  bindFor={(label) => {
                    const t = (Object.keys(LIST_TYPE_LABEL) as ListType[]).find((k) => LIST_TYPE_LABEL[k] === label) ?? 'all';
                    return bindTap({ kind: 'action', id: 'follow.listType.select.target' }, { params: { target: t }, onTrigger: () => setListType(t) });
                  }}
                />
              </div>
            </div>
            {listRows.length === 0 ? (
              <EmptyState text="暂无关注的片单书单" />
            ) : (
              <div className="p-3 space-y-3">
                {listRows.map((it) => (
                  <button
                    key={it.id}
                    {...(it.kind === 'ranking'
                      ? bindTap('follow.ranklist-open', { params: { listId: it.id } })
                      : bindTap('follow.doulist-open', { params: { doulistId: it.id } }))}
                    className="w-full flex gap-3 items-start p-3 bg-white rounded-lg text-left cursor-pointer"
                  >
                    {/* 多封面扇形堆叠 + 左下徽标 */}
                    <span className="relative shrink-0" style={{ width: 76, height: 76 }}>
                      {it.covers.length === 0 && (
                        <Img src="" className="absolute inset-0 w-full h-full rounded-md object-cover" />
                      )}
                      {it.covers.map((c, ci) => (
                        <Img
                          key={ci}
                          src={c}
                          className="absolute top-0 rounded-md object-cover shadow-sm"
                          style={{ width: 52, height: 72, left: ci * 12, zIndex: 3 - ci, opacity: 1 - ci * 0.12 }}
                        />
                      ))}
                      <span
                        className="absolute bottom-0 left-0 px-1.5 py-0.5 rounded text-[10px] text-white font-medium z-10"
                        style={{ background: it.top ? '#4A5A2E' : 'rgba(0,0,0,0.6)' }}
                      >
                        {it.badge}
                      </span>
                    </span>
                    <span className="flex-1 min-w-0 self-center">
                      {it.creator && (
                        <span className="flex items-center gap-1 text-[11px] mb-0.5" style={{ color: C.sub }}>
                          <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]" style={{ background: C.greenSoft }}>🙂</span>
                          {it.creator} 创建
                        </span>
                      )}
                      <span className="block text-[15px] font-bold truncate" style={{ color: C.text }}>{it.title}</span>
                      <span className="block mt-1 text-xs" style={{ color: C.sub }}>
                        看过 {it.done}/{it.total}{it.unit} · {it.fans}人关注
                      </span>
                      {/* 细进度条 */}
                      <span className="block mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: '#EDEDED' }}>
                        <span className="block h-full rounded-full" style={{ width: it.total ? `${(it.done / it.total) * 100}%` : '0%', background: C.green }} />
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* 播单(空态) */}
        {tab === 'playlists' && <EmptyState text="未关注任何播单" />}

        {/* 地点豆列(空态) */}
        {tab === 'placeDoulists' && <EmptyState text="暂无关注的地点豆列" />}

        {/* 文集 */}
        {tab === 'essaySets' && (
          essaySets.length === 0 ? <EmptyState text="暂无关注的文集" /> :
          essaySets.map((e) => {
            const owner = userById.get(e.ownerId);
            return (
              <button key={e.id} {...bindTap('follow.essaySet-open', { params: { essaySetId: e.id } })} className={rowCls} style={rowStyle}>
                <span className="w-11 h-11 rounded-lg flex items-center justify-center text-lg shrink-0" style={{ background: '#F3EEF9' }}>📖</span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{e.title}</span>
                  <span className="block mt-0.5 text-xs" style={{ color: C.sub }}>{owner?.name ?? '豆友'} · {e.articles.length}篇 · 1人关注</span>
                </span>
              </button>
            );
          })
        )}

        {/* 豆列 */}
        {tab === 'doulists' && (
          followedDoulists.length === 0 ? <EmptyState text="暂无关注的豆列" /> :
          followedDoulists.map((d) => (
            <button key={d.id} {...bindTap('follow.doulist-open', { params: { doulistId: d.id } })} className={rowCls} style={rowStyle}>
              <Img src={d.cover} className="w-11 h-11 rounded-lg object-cover shrink-0" />
              <span className="flex-1 min-w-0">
                <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{d.title}</span>
                <span className="block mt-0.5 text-xs" style={{ color: C.sub }}>{d.items.length}个内容</span>
              </span>
            </button>
          ))
        )}

        {/* 用户 */}
        {tab === 'users' && (
          <>
            <div className="p-3 bg-white">
              <button
                {...bindTap({ kind: 'action', id: 'follow.userSearch.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="w-full flex items-center gap-2 h-9 rounded-full px-3.5 border-none cursor-pointer text-sm text-left"
                style={{ background: '#F2F3F5', color: C.sub }}
              >
                🔍 搜索关注的用户
              </button>
            </div>
            {follows.users.length === 0 ? <EmptyState text="暂无关注的用户" /> :
            follows.users.map((uid) => {
              const u = userById.get(uid);
              if (!u) return null;
              return (
                <button key={uid} {...bindTap('follow.user-open', { params: { userId: uid } })} className={rowCls} style={rowStyle}>
                  <Avatar src={u.avatar} size={44} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{u.name}</span>
                    <span className="block mt-0.5 text-xs truncate" style={{ color: C.sub }}>{u.signature || u.ipLocation}</span>
                  </span>
                </button>
              );
            })}
          </>
        )}

        {/* 人物 */}
        {tab === 'celebrities' && (
          follows.celebrities.length === 0 ? <EmptyState text="暂无关注的人物" /> :
          follows.celebrities.map((cid) => {
            const c = celebById.get(cid);
            if (!c) return null;
            return (
              <button key={cid} {...bindTap('follow.celebrity-open', { params: { celebrityId: cid } })} className={rowCls} style={rowStyle}>
                <Avatar src={c.avatar} size={44} />
                <span className="flex-1 min-w-0">
                  <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{c.name}</span>
                  <span className="block mt-0.5 text-xs truncate" style={{ color: C.sub }}>{c.role}</span>
                </span>
              </button>
            );
          })
        )}

        {/* 话题 */}
        {tab === 'topics' && (
          <>
            {follows.topics.length === 0 ? <EmptyState text="暂无关注的话题" /> :
            follows.topics.map((tid) => {
              const t = topicById.get(tid);
              if (!t) return null;
              return (
                <button key={tid} {...bindTap('follow.topic-open', { params: { id: tid } })} className={rowCls} style={rowStyle}>
                  <span className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold shrink-0" style={{ background: C.green }}>#</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[15px] font-medium truncate" style={{ color: C.text }}>{t.name}</span>
                    <span className="block mt-0.5 text-xs" style={{ color: C.sub }}>{t.postCount}篇内容</span>
                  </span>
                </button>
              );
            })}
            <button
              {...bindTap({ kind: 'action', id: 'follow.topicSquare.entry.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
              className="w-full text-center py-4 text-sm bg-transparent border-none cursor-pointer"
              style={{ color: C.green }}
            >
              前往话题广场 ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}

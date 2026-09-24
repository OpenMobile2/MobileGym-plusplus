// 我的小组(group.mine,IMG_0338/0339/0340,frame:1779a1@t0018):
// 顶部「豆友_墨鱼仔的小组」+ 3子tab(我的小组/我回复的/我发布的)
// 我的小组 tab:计数「N个」+筛选chips(全部/加入的/关注的)+组行(封面/组名/摘要/成员数/…)+THE END
// 我回复的/我发布的:空态(或发过帖显示帖行)。tab/filter 走 URL 驱动。
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C, Img, SegRow, EmptyState, TheEnd } from '../components/ui';

type MineTab = 'mine' | 'replied' | 'posted';
type MineFilter = 'all' | 'joined' | 'followed';

const TABS: [MineTab, string][] = [
  ['mine', '我的小组'],
  ['replied', '我回复的'],
  ['posted', '我发布的'],
];
const FILTERS: [MineFilter, string][] = [
  ['all', '全部'],
  ['joined', '加入的'],
  ['followed', '关注的'],
];
const FILTER_LABELS = FILTERS.map(([, l]) => l);
const FILTER_BY_LABEL = new Map(FILTERS.map(([f, l]) => [l, f]));

/** 封面左下角未读气泡(灰黑 speech bubble + 白字,尾角在左下) */
function UnreadBubble({ n }: { n: number }) {
  return (
    <span
      className="absolute bottom-0 left-0 min-w-4 h-4 px-1 flex items-center justify-center text-[10px] text-white leading-none"
      style={{ background: 'rgba(45,48,54,0.85)', borderRadius: '8px 8px 8px 2px' }}
    >
      {n}
    </span>
  );
}

export default function GroupMinePage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const groups = useDoubanStore((s) => s.groups);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const replies = useDoubanStore((s) => s.replies);

  const tab: MineTab = (['mine', 'replied', 'posted'] as const).includes(searchParams.get('tab') as MineTab)
    ? (searchParams.get('tab') as MineTab)
    : 'mine';
  const filter: MineFilter = (['all', 'joined', 'followed'] as const).includes(searchParams.get('filter') as MineFilter)
    ? (searchParams.get('filter') as MineFilter)
    : 'all';

  const setParam = (key: string, value: string) =>
    setSearchParams(
      (p) => {
        p.set(key, value);
        return p;
      },
      { replace: true },
    );

  // 「我的小组」= 加入的 ∪ 关注的
  const relatedGroups = useMemo(() => groups.filter((g) => g.joined || g.followed), [groups]);
  const filteredGroups = useMemo(() => {
    if (filter === 'joined') return relatedGroups.filter((g) => g.joined);
    if (filter === 'followed') return relatedGroups.filter((g) => g.followed && !g.joined);
    return relatedGroups;
  }, [relatedGroups, filter]);

  const myPosts = useMemo(
    () => groupPosts.filter((p) => p.authorId === currentUser.id && p.groupId),
    [groupPosts, currentUser.id],
  );
  const myRepliedPosts = useMemo(() => {
    const ids = new Set(
      replies.filter((r) => r.targetType === 'groupPost' && r.authorId === currentUser.id).map((r) => r.targetId),
    );
    return groupPosts.filter((p) => ids.has(p.id));
  }, [replies, groupPosts, currentUser.id]);

  const groupOf = useMemo(() => {
    const m = new Map(groups.map((g) => [g.id, g]));
    return (gid: string | null) => (gid ? m.get(gid) : undefined);
  }, [groups]);

  // 组行副标题「最近更新: …」= 该组最新一帖标题
  const latestPostOf = useMemo(() => {
    const m = new Map<string, { title: string; ts: number }>();
    for (const p of groupPosts) {
      if (!p.groupId) continue;
      const cur = m.get(p.groupId);
      if (!cur || p.updatedAt > cur.ts) m.set(p.groupId, { title: p.title, ts: p.updatedAt });
    }
    return (gid: string) => m.get(gid)?.title;
  }, [groupPosts]);

  // 封面未读角标(seed 无未读字段,按该组回应总数派生一个稳定假角标)
  const unreadOf = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of groupPosts) {
      if (p.groupId) m.set(p.groupId, (m.get(p.groupId) ?? 0) + p.replyCount);
    }
    return (gid: string) => m.get(gid) ?? 0;
  }, [groupPosts]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-12 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          <Avatar src={currentUser.avatar} size={22} />
          <span className="font-semibold text-base truncate" style={{ color: C.text }}>{currentUser.name}的小组</span>
        </div>
        <div className="w-12" />
      </div>

      {/* 3子tab */}
      <div className="flex bg-white border-b" style={{ borderColor: C.border }}>
        {TABS.map(([t, label]) => {
          const active = tab === t;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'groupMine.tab.select.target' }, {
                params: { target: t },
                onTrigger: () => setParam('tab', t),
              })}
              className="flex-1 py-3 bg-transparent border-none cursor-pointer text-sm relative"
              style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
            >
              {label}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'mine' && (
          <>
            {/* 计数 + 筛选chips */}
            <div className="flex items-center gap-1.5 px-4 py-2.5 bg-white">
              <span className="text-xs" style={{ color: C.sub }}>{relatedGroups.length}个</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C3C9D1" strokeWidth="2" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.1 9a3 3 0 015.8 1c0 2-3 2.5-3 3.5" strokeLinecap="round" />
                <circle cx="12" cy="17.5" r="0.6" fill="#C3C9D1" stroke="none" />
              </svg>
              <div className="flex-1" />
              <button
                {...bindTap({ kind: 'action', id: 'groupMine.search.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="w-7 h-7 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
                style={{ color: C.sub }}
                aria-label="搜索"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
              <SegRow
                options={FILTER_LABELS}
                value={FILTERS.find(([f]) => f === filter)?.[1] ?? '全部'}
                size="sm"
                bindFor={(label) => {
                  const f = (FILTER_BY_LABEL.get(label) ?? 'all') as MineFilter;
                  return bindTap({ kind: 'action', id: 'groupMine.filter.select.target' }, {
                    params: { target: f },
                    onTrigger: () => setParam('filter', f),
                  });
                }}
              />
            </div>
            <div className="bg-white">
              {filteredGroups.length === 0 ? (
                <EmptyState text="暂无小组" />
              ) : (
                filteredGroups.map((g) => {
                  const latest = latestPostOf(g.id);
                  const unread = unreadOf(g.id);
                  return (
                  <div
                    key={g.id}
                    {...bindTap('groupMine.group-open', { params: { groupId: g.id } })}
                    className="flex items-center gap-3 px-4 py-3 border-t cursor-pointer"
                    style={{ borderColor: '#F2F3F5' }}
                  >
                    <span className="relative shrink-0 block">
                      <Img src={g.icon} className="w-12 h-12 rounded-xl object-cover" />
                      {unread > 0 && <UnreadBubble n={unread} />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{g.name}</span>
                        {!g.joined && g.followed && (
                          <span className="px-1 rounded text-[9px] shrink-0" style={{ background: C.greenSoft, color: C.green }}>关注</span>
                        )}
                      </div>
                      <div className="text-xs mt-0.5 truncate" style={{ color: C.sub }}>
                        {latest ? `最近更新: ${latest}` : '小组沉默中'}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: '#B9BEC6' }}>{g.members.toLocaleString()}成员</div>
                    </div>
                    <button
                      {...bindTap({ kind: 'action', id: 'groupMine.groupMore.wontfix' }, {
                        params: { groupId: g.id },
                        stopPropagation: true,
                        onTrigger: () => toast('该功能暂未开放'),
                      })}
                      className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
                      style={{ color: C.sub }}
                    >
                      …
                    </button>
                  </div>
                  );
                })
              )}
              {filteredGroups.length > 0 && <TheEnd />}
            </div>
          </>
        )}

        {tab === 'replied' && (
          myRepliedPosts.length === 0 ? (
            <EmptyState text="暂无回应过的讨论" />
          ) : (
            <div className="bg-white">
              {myRepliedPosts.map((p) => (
                <div
                  key={p.id}
                  {...bindTap('groupMine.group-open', { params: { groupId: p.groupId ?? '' } })}
                  className="px-4 py-3 border-t cursor-pointer"
                  style={{ borderColor: '#F2F3F5' }}
                >
                  <div className="text-[15px] font-medium line-clamp-1" style={{ color: C.text }}>{p.title}</div>
                  <div className="text-xs mt-1" style={{ color: C.sub }}>{groupOf(p.groupId)?.name} · {p.replyCount}回应</div>
                </div>
              ))}
            </div>
          )
        )}

        {tab === 'posted' && (
          myPosts.length === 0 ? (
            <EmptyState text="暂无发布过的讨论" />
          ) : (
            <div className="bg-white">
              {myPosts.map((p) => (
                <div
                  key={p.id}
                  {...bindTap('groupMine.group-open', { params: { groupId: p.groupId ?? '' } })}
                  className="px-4 py-3 border-t cursor-pointer"
                  style={{ borderColor: '#F2F3F5' }}
                >
                  <div className="text-[15px] font-medium line-clamp-1" style={{ color: C.text }}>{p.title}</div>
                  <div className="text-xs mt-1" style={{ color: C.sub }}>{groupOf(p.groupId)?.name} · {p.replyCount}回应</div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

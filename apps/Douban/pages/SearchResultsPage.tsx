import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStrings } from '../hooks/useDoubanStrings';
import { useDoubanStore } from '../state';
import { C, Avatar, EmptyState, Img, Stars, fmtCount, fmtCountPlus } from '../components/ui';

// 节点: search.results —— 搜索结果页(综合/书影音/小组/话题/用户 分区)。
// evidence: IMG_F8cb08c_t0016/t0018/t0022/t0027/t0030/t0032/t0048/IMG_0394/IMG_0475
// ?scope=mine → 「我发布的」单 tab 结果模式(IMG_0394:我的动态 + 条目卡「已想看/已看过」章)。

const pad2 = (n: number) => String(n).padStart(2, '0');

type Zone = 'all' | 'subjects' | 'groups' | 'topics' | 'users';
type SubjectFilter = 'screen' | 'book' | 'game' | 'music' | 'person' | 'drama';

const ZONES: { id: Zone; label: string }[] = [
  { id: 'all', label: '综合' },
  { id: 'subjects', label: '书影音' },
  { id: 'groups', label: '小组' },
  { id: 'topics', label: '话题' },
  { id: 'users', label: '用户' },
];

function relTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 60) return `${Math.max(1, min)}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

export default function SearchResultsPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const str = useDoubanStrings();
  const toast = useDoubanStore((s) => s.toast);
  const searchQuery = useDoubanStore((s) => s.searchQuery);
  const setSearchQuery = useDoubanStore((s) => s.setSearchQuery);
  const subjects = useDoubanStore((s) => s.subjects);
  const groups = useDoubanStore((s) => s.groups);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const topics = useDoubanStore((s) => s.topics);
  const users = useDoubanStore((s) => s.users);
  const celebrities = useDoubanStore((s) => s.celebrities);
  const doulists = useDoubanStore((s) => s.doulists);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const marks = useDoubanStore((s) => s.marks);
  const follows = useDoubanStore((s) => s.follows);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);
  const joinGroupDirect = useDoubanStore((s) => s.joinGroupDirect);

  const [searchParams] = useSearchParams();
  /** 「我发布的」结果模式(IMG_0394)，从个人页搜索链路保留 scope=mine。 */
  const mineMode = searchParams.get('scope') === 'mine';
  const [zone, setZone] = useState<Zone>('all');
  const [subFilter, setSubFilter] = useState<SubjectFilter>('screen');
  const [feedSort, setFeedSort] = useState<'hot' | 'new'>('hot');
  const [groupSort, setGroupSort] = useState<'hot' | 'new'>('hot');
  const [moreGroups, setMoreGroups] = useState(false);

  const q = searchQuery.trim();
  // 关键词匹配:标题 + genres + 作者/艺人
  const hitSubject = (s: (typeof subjects)[number]) =>
    q === '' ||
    s.title.includes(q) ||
    (s.genres ?? []).some((g) => g.includes(q)) ||
    (s.author ?? '').includes(q) ||
    (s.artist ?? '').includes(q) ||
    (s.info ?? '').includes(q);
  const hit = (text?: string | null) => q === '' || (text ?? '').includes(q);

  const matched = useMemo(() => {
    const subj = subjects.filter((s) => hitSubject(s));
    return {
      screen: subj.filter((s) => s.type === 'movie' || s.type === 'tv'),
      books: subj.filter((s) => s.type === 'book'),
      music: subj.filter((s) => s.type === 'music' || s.type === 'podcast'),
      persons: celebrities.filter((c) => hit(c.name) || hit(c.desc)),
      groups: groups.filter((g) => hit(g.name) || hit(g.desc)),
      topics: topics.filter((t) => t.id !== 'tp_test' && (hit(t.name) || hit(t.desc))),
      users: users.filter((u) => !u.isSelf && (hit(u.name) || hit(u.signature))),
      doulists: doulists.filter((d) => (d.kindLabel === '片单' || d.kindLabel === '书单') && hit(d.title)),
      posts: groupPosts.filter((p) => hit(p.title) || hit(p.content)),
      feed: broadcasts.filter((b) => hit(b.text)),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjects, celebrities, groups, topics, users, doulists, groupPosts, broadcasts, q]);

  const allSubjects = useMemo(
    () => [...matched.screen, ...matched.books, ...matched.music],
    [matched],
  );
  const sortedFeed = useMemo(
    () =>
      [...matched.feed].sort((a, b) =>
        feedSort === 'hot' ? b.likeCount - a.likeCount : b.createdAt - a.createdAt,
      ),
    [matched, feedSort],
  );
  const sortedPosts = useMemo(
    () =>
      [...matched.posts].sort((a, b) =>
        groupSort === 'hot' ? b.replyCount - a.replyCount : b.updatedAt - a.updatedAt,
      ),
    [matched, groupSort],
  );
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const nowTs = useMemo(() => Math.max(...broadcasts.map((b) => b.createdAt), 0) + 3600000, [broadcasts]);

  // ---------------- 「我发布的」模式数据(IMG_0394) ----------------
  const me = useMemo(() => users.find((u) => u.isSelf), [users]);
  const myPosts = useMemo(
    () =>
      broadcasts
        .filter((b) => b.authorId === me?.id && hit(b.text))
        .sort((a, b) => b.createdAt - a.createdAt),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [broadcasts, me, q],
  );
  /** subjectId → 最新一条标记(想看/看过章) */
  const markBySubject = useMemo(() => {
    const m = new Map<string, (typeof marks)[number]>();
    [...marks]
      .sort((a, b) => b.createdAt - a.createdAt)
      .forEach((mk) => {
        if (!m.has(mk.subjectId)) m.set(mk.subjectId, mk);
      });
    return m;
  }, [marks]);

  /** 条目卡(影视/图书/音乐通用视觉,绑定按类型) */
  const subjectRow = (s: (typeof subjects)[number]) => {
    const tapProps =
      s.type === 'movie' || s.type === 'tv'
        ? bindTap('search.results.movieItem-open', { params: { itemId: s.id } })
        : s.type === 'book'
          ? bindTap('search.results.bookItem-open', { params: { subjectId: s.id } })
          : bindTap('search.results.musicItem-open', { params: { subjectId: s.id } });
    const unreleased = s.rating == null && (s.type === 'movie' || s.type === 'tv');
    // 预告片红圆播放钮:仅影视类且部分条目有(按 id charCode 奇偶确定性划分),内联标题左侧。
    const hasTrailer =
      (s.type === 'movie' || s.type === 'tv') && s.id.charCodeAt(s.id.length - 1) % 2 === 1;
    return (
      <div key={s.id} {...tapProps} className="flex gap-3 px-4 py-3 cursor-pointer bg-white">
        <Img src={s.cover} className="w-14 h-[78px] rounded object-cover shrink-0" />
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {hasTrailer && (
              <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: '#E5484D' }}>
                <svg width="7" height="7" viewBox="0 0 10 10"><path d="M2.5 1l6 4-6 4z" fill="#fff" /></svg>
              </span>
            )}
            <span className="text-[15px] font-semibold truncate" style={{ color: C.text }}>
              {s.title} {s.year ? `(${s.year})` : ''}
            </span>
          </div>
          <div className="mt-1.5">
            {unreleased ? (
              <span className="text-xs" style={{ color: C.sub }}>尚未上映</span>
            ) : s.rating == null ? (
              <span className="text-xs" style={{ color: C.sub }}>暂无评分</span>
            ) : (
              <span className="inline-flex items-center gap-1">
                <Stars value={s.rating} size={12} color="#F5A623" />
                <span className="text-[13px] font-semibold" style={{ color: '#FF9900' }}>{s.rating.toFixed(1)}</span>
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: C.sub }}>
            <span className="px-1 rounded text-[10px] shrink-0" style={{ background: '#F2F3F5' }}>
              {s.type === 'book' ? '图书' : s.type === 'music' ? '音乐' : s.type === 'podcast' ? '播客' : '电影'}
            </span>
            <span className="truncate">{s.info ?? s.author ?? s.artist}</span>
          </div>
        </div>
      </div>
    );
  };

  /** 片单卡:第二行为片单条目名列表(真机格式,非 intro) */
  const doulistCard = (d: (typeof doulists)[number]) => {
    const itemTitles = d.items
      .map((it) => (it.kind === 'subject' ? subjects.find((s) => s.id === it.refId)?.title : undefined))
      .filter((t): t is string => Boolean(t));
    const itemLine = itemTitles.length > 0 ? itemTitles.join(' / ') : d.intro;
    return (
      <div key={d.id} {...bindTap('search.results.doulist-open', { params: { doulistId: d.id } })} className="flex gap-3 px-4 py-3 cursor-pointer bg-white">
        <Img src={d.cover} className="w-14 h-14 rounded object-cover shrink-0" />
        <div className="flex-1 min-w-0 py-0.5">
          <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{d.title}</div>
          <div className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: C.sub }}>
            <span className="px-1 rounded text-[10px] shrink-0" style={{ background: '#F2F3F5' }}>{d.kindLabel}</span>
            <span className="truncate">{d.items.length}个条目</span>
          </div>
          <div className="mt-1 text-xs truncate" style={{ color: '#B9BEC6' }}>{itemLine}</div>
        </div>
      </div>
    );
  };

  /** 用户行 */
  const userRow = (u: (typeof users)[number]) => {
    const followed = follows.users.includes(u.id);
    return (
      <div key={u.id} {...bindTap('search.results.user-open', { params: { userId: u.id } })} className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-white">
        <Avatar src={u.avatar} size={44} />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{u.name}</div>
          {u.signature && <div className="mt-0.5 text-xs truncate" style={{ color: C.sub }}>{u.signature}</div>}
          <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>
            {fmtCount(u.followers)}人关注 · {u.ipLocation}
          </div>
        </div>
        <button
          {...bindTap(
            { kind: 'action', id: 'search.results.userFollow.toggle' },
            {
              params: { userId: u.id },
              stopPropagation: true,
              onTrigger: () => {
                if (followed) {
                  unfollowUser(u.id);
                  toast('已取消关注');
                } else {
                  followUser(u.id);
                  toast('关注成功');
                }
              },
            },
          )}
          className="shrink-0 px-3.5 h-7 rounded-full text-[13px] cursor-pointer"
          style={
            followed
              ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }
              : { background: 'transparent', color: C.green, border: `1px solid ${C.green}` }
          }
        >
          {followed ? '已关注' : '+关注'}
        </button>
      </div>
    );
  };

  /** 小组卡(含加入按钮) */
  const groupCard = (g: (typeof groups)[number]) => (
    <div key={g.id} {...bindTap('search.results.group-open', { params: { groupId: g.id } })} className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-white">
      <Img src={g.icon} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{g.name}</div>
        <div className="mt-0.5 text-xs truncate" style={{ color: C.sub }}>{g.desc}</div>
        <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>{fmtCount(g.members)}人加入</div>
      </div>
      <button
        {...bindTap('search.results.groupJoin-open', {
          params: { groupId: g.id },
          stopPropagation: true,
          onTrigger: () => {
            if (g.joined) {
              toast('已加入');
              return;
            }
            joinGroupDirect(g.id);
            toast('加入成功');
          },
        })}
        className="shrink-0 px-3.5 h-7 rounded-full text-[13px] border-none cursor-pointer"
        style={g.joined ? { background: '#F2F3F5', color: C.sub } : { background: C.green, color: '#fff' }}
      >
        {g.joined ? '已加入' : '+加入'}
      </button>
    </div>
  );

  const subFilterChips: { id: SubjectFilter; label: string; count: number }[] = [
    { id: 'screen', label: '影视', count: matched.screen.length },
    { id: 'book', label: '图书', count: matched.books.length },
    { id: 'game', label: '游戏', count: 0 },
    { id: 'music', label: '音乐', count: matched.music.length },
    { id: 'person', label: '人物', count: matched.persons.length },
    { id: 'drama', label: '舞台剧', count: 0 },
  ];

  return (
    <div className="flex flex-col h-full bg-white relative" data-status-bar-foreground="dark">
      {/* 顶部搜索框(回填关键词,可再编辑) */}
      <div className="flex items-center gap-2 px-3 py-2 shrink-0 bg-white">
        <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-lg" style={{ background: '#F2F3F5' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm min-w-0"
            style={{ color: C.text }}
          />
        </div>
        <button {...bindBack()} className="text-[15px] bg-transparent border-none cursor-pointer shrink-0 px-1" style={{ color: C.green }}>
          取消
        </button>
      </div>

      {/* 分区 tab 条(「我发布的」模式为单 tab,IMG_0394) */}
      {mineMode ? (
        <div className="flex px-4 border-b shrink-0 bg-white" style={{ borderColor: C.border }}>
          <div className="pb-2.5 pt-1.5 relative text-[15px] font-bold" style={{ color: C.text }}>
            我发布的
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />
          </div>
        </div>
      ) : (
      <div className="flex px-2 border-b shrink-0 bg-white" style={{ borderColor: C.border }}>
        {ZONES.map((z) => {
          const active = zone === z.id;
          return (
            <button
              key={z.id}
              {...bindTap(
                { kind: 'action', id: 'search.results.zoneTab.select.target' },
                {
                  params: { target: z.id },
                  onTrigger: () => {
                    setZone(z.id);
                    setMoreGroups(false);
                  },
                },
              )}
              className="flex-1 pb-2.5 pt-1.5 bg-transparent border-none cursor-pointer relative text-[15px]"
              style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
            >
              {z.label}
              {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full" style={{ background: C.text }} />}
            </button>
          );
        })}
      </div>
      )}

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical" style={{ background: '#fff' }}>
        {/* ---------------- 「我发布的」模式:我的动态 + 标记条目卡(IMG_0394) ---------------- */}
        {mineMode && (
          <div>
            {myPosts.length === 0 ? (
              <EmptyState text={`${str.noResult} “${q}”`} sub={str.tryOtherKeyword} />
            ) : (
              myPosts.map((b) => {
                const mk = markBySubject.get(b.subjectCard ?? '');
                const mkSubject = mk ? subjects.find((s) => s.id === mk.subjectId) : undefined;
                return (
                  <div key={b.id} {...bindTap('search.results.mineItem-open', { params: { id: b.id } })} className="px-4 py-3 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                    <div className="flex items-center gap-2">
                      <Avatar src={me?.avatar ?? ''} size={30} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{me?.name}</div>
                        <div className="text-[11px]" style={{ color: '#B9BEC6' }}>{relTime(b.createdAt, nowTs)} · IP属地{b.ipLocation}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm leading-relaxed line-clamp-3" style={{ color: C.text }}>{b.text}</div>
                    {mk && mkSubject && (
                      <div className="mt-2 flex gap-2.5 rounded-lg p-2" style={{ background: '#F7F7F7' }}>
                        <Img src={mkSubject.cover} className="w-10 h-14 rounded object-cover shrink-0" />
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{mkSubject.title}</div>
                          <div className="mt-1 text-[11px]" style={{ color: C.green }}>
                            {mk.status === 'wish' ? '已想看 ✓' : '已看过'}
                          </div>
                        </div>
                      </div>
                    )}
                    <div className="mt-2 text-xs" style={{ color: '#B9BEC6' }}>
                      {b.likeCount}赞 · {b.replyCount}回复
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ---------------- 综合 ---------------- */}
        {!mineMode && zone === 'all' && (
          <div>
            <div className="flex items-center gap-2 px-4 pt-3">
              <span className="text-[13px]" style={{ color: C.sub }}>是否在找:</span>
              <button
                {...bindTap({ kind: 'action', id: 'search.results.location.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                className="px-2.5 py-1 rounded-full text-xs border-none cursor-pointer"
                style={{ background: '#F2F3F5', color: C.text }}
              >
                📍 {q || '豆瓣'} · 同城
              </button>
            </div>

            {allSubjects.slice(0, 3).map(subjectRow)}

            {allSubjects.length > 0 && (
              <button
                {...bindTap({ kind: 'action', id: 'search.results.moreSubjects.open' }, { onTrigger: () => setZone('subjects') })}
                className="w-full py-2.5 text-[13px] bg-transparent border-none cursor-pointer text-center"
                style={{ color: C.green }}
              >
                更多热门“{q || '推荐'}”书影音 ›
              </button>
            )}
            <div className="h-2" style={{ background: C.bg }} />

            {/* 结果 feed + 排序 */}
            <div className="flex items-center justify-between px-4 pt-3">
              <span className="text-sm font-semibold" style={{ color: C.text }}>全部内容</span>
              <div className="flex gap-1.5">
                {([['hot', '热门'], ['new', '最新']] as const).map(([id, label]) => (
                  <button
                    key={id}
                    {...bindTap(
                      { kind: 'action', id: 'search.results.feedSort.select.target' },
                      { params: { target: id }, onTrigger: () => setFeedSort(id) },
                    )}
                    className="px-2.5 py-0.5 rounded-full text-xs border-none cursor-pointer"
                    style={{ background: feedSort === id ? '#F2F3F5' : 'transparent', color: feedSort === id ? C.text : C.sub, fontWeight: feedSort === id ? 600 : 400 }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            {sortedFeed.length === 0 && allSubjects.length === 0 ? (
              <EmptyState text={`${str.noResult} “${q}”`} sub={str.tryOtherKeyword} />
            ) : (
              sortedFeed.map((b) => {
                const author = userById.get(b.authorId);
                return (
                  <div key={b.id} {...bindTap('search.results.mineItem-open', { params: { id: b.id } })} className="px-4 py-3 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                    <div className="flex items-center gap-2">
                      <Avatar src={author?.avatar ?? ''} size={30} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold truncate" style={{ color: C.text }}>{author?.name}</div>
                        <div className="text-[11px]" style={{ color: '#B9BEC6' }}>{relTime(b.createdAt, nowTs)} · IP属地{b.ipLocation}</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm leading-relaxed line-clamp-3" style={{ color: C.text }}>{b.text}</div>
                    <div className="mt-2 text-xs" style={{ color: '#B9BEC6' }}>
                      {b.likeCount}赞 · {b.replyCount}回应
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ---------------- 书影音 ---------------- */}
        {!mineMode && zone === 'subjects' && (
          <div>
            <div className="flex gap-2 px-4 py-2.5 overflow-x-auto" data-scroll-container="subject-filters" data-scroll-direction="horizontal">
              {subFilterChips.map((f) => {
                const active = subFilter === f.id;
                return (
                  <button
                    key={f.id}
                    {...bindTap(
                      { kind: 'action', id: 'search.results.subjectFilter.select.target' },
                      { params: { target: f.id }, onTrigger: () => setSubFilter(f.id) },
                    )}
                    className="px-3 py-1.5 rounded-full text-[13px] border-none cursor-pointer shrink-0"
                    style={{
                      background: active ? C.greenSoft : '#F2F3F5',
                      color: active ? C.green : C.text,
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    {f.label} {f.count}
                  </button>
                );
              })}
            </div>
            {subFilter === 'screen' && (
              <>
                {matched.screen.map(subjectRow)}
                {matched.doulists.map(doulistCard)}
                {matched.screen.length === 0 && <EmptyState text={`未找到与“${q}”相关的影视`} />}
              </>
            )}
            {subFilter === 'book' && (
              <>
                {matched.books.map(subjectRow)}
                {matched.books.length === 0 && <EmptyState text={`未找到与“${q}”相关的图书`} />}
              </>
            )}
            {subFilter === 'music' && (
              <>
                {matched.music.map(subjectRow)}
                {matched.music.length === 0 && <EmptyState text={`未找到与“${q}”相关的音乐`} />}
              </>
            )}
            {subFilter === 'game' && <EmptyState text={`未找到与“${q}”相关的游戏`} />}
            {subFilter === 'person' && (
              <>
                {matched.persons.map((c) => (
                  <div key={c.id} {...bindTap('search.results.celebrityItem-open', { params: { celebrityId: c.id } })} className="flex items-center gap-3 px-4 py-3 cursor-pointer bg-white">
                    <Img src={c.avatar} className="w-14 h-14 rounded object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{c.name}</div>
                      <div className="mt-0.5 text-xs truncate" style={{ color: C.sub }}>{c.role} · {c.desc}</div>
                      <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>{fmtCount(c.followers)}人关注</div>
                    </div>
                  </div>
                ))}
                {matched.persons.length === 0 && <EmptyState text={`未找到与“${q}”相关的人物`} />}
              </>
            )}
            {subFilter === 'drama' && <EmptyState text={`未找到与“${q}”相关的舞台剧`} />}
          </div>
        )}

        {/* ---------------- 小组 ---------------- */}
        {!mineMode && zone === 'groups' && (
          <div>
            {moreGroups ? (
              /* state.moreGroups 次级列表 */
              <div>
                <div className="flex items-center px-4 py-2.5 border-b" style={{ borderColor: C.border }}>
                  <button onClick={() => setMoreGroups(false)} className="w-8 text-left text-lg bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
                  <span className="flex-1 text-center text-[15px] font-semibold" style={{ color: C.text }}>更多“{q || '推荐'}”的小组</span>
                  <span className="w-8" />
                </div>
                {matched.groups.length === 0
                  ? <EmptyState text={`未找到与“${q}”相关的小组`} />
                  : matched.groups.map(groupCard)}
              </div>
            ) : matched.groups.length === 0 && sortedPosts.length === 0 ? (
              <EmptyState text={`未找到与“${q}”相关的小组`} />
            ) : (
              <div>
                {matched.groups.slice(0, 2).map(groupCard)}
                <button
                  {...bindTap({ kind: 'action', id: 'search.results.moreGroups.open' }, { onTrigger: () => setMoreGroups(true) })}
                  className="w-full py-2.5 text-[13px] bg-transparent border-none cursor-pointer text-center"
                  style={{ color: C.green }}
                >
                  更多“{q || '推荐'}”的小组 ›
                </button>
                <div className="h-2" style={{ background: C.bg }} />
                <div className="flex items-center justify-between px-4 pt-3">
                  <span className="text-sm font-semibold" style={{ color: C.text }}>小组讨论</span>
                  <div className="flex gap-1.5">
                    {([['hot', '热门'], ['new', '最新']] as const).map(([id, label]) => (
                      <button
                        key={id}
                        {...bindTap(
                          { kind: 'action', id: 'search.results.groupPostSort.select.target' },
                          { params: { target: id }, onTrigger: () => setGroupSort(id) },
                        )}
                        className="px-2.5 py-0.5 rounded-full text-xs border-none cursor-pointer"
                        style={{ background: groupSort === id ? '#F2F3F5' : 'transparent', color: groupSort === id ? C.text : C.sub, fontWeight: groupSort === id ? 600 : 400 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                {sortedPosts.map((p) => {
                  const g = groups.find((gg) => gg.id === p.groupId);
                  return (
                    <div key={p.id} {...bindTap('search.results.groupPost-open', { params: { topicId: p.id } })} className="px-4 py-3 border-b cursor-pointer" style={{ borderColor: '#F5F6F7' }}>
                      <div className="flex gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold leading-snug line-clamp-2" style={{ color: C.text }}>{p.title}</div>
                          <div className="mt-1 text-[13px] line-clamp-2" style={{ color: C.sub }}>{p.content}</div>
                        </div>
                        {p.images.length > 0 && <Img src={p.images[0]} className="w-[72px] h-[72px] rounded object-cover shrink-0" />}
                      </div>
                      <div className="mt-1.5 text-xs" style={{ color: '#B9BEC6' }}>
                        {g ? `${g.name} · ` : ''}{p.replyCount}回应 · {relTime(p.updatedAt, nowTs)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- 话题 ---------------- */}
        {!mineMode && zone === 'topics' && (
          <div>
            {matched.topics.length === 0 ? (
              <EmptyState text={`未找到与“${q}”相关的话题`} />
            ) : (
              matched.topics.map((t, i) => (
                <div
                  key={t.id}
                  {...bindTap('search.results.topic-open', { params: { id: t.id } })}
                  className="flex items-center gap-3 px-4 py-3.5 cursor-pointer"
                  style={{ borderTop: i === 0 ? 'none' : '8px solid #F2F3F5' }}
                >
                  <span className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold shrink-0" style={{ background: C.green, color: '#fff' }}>#</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{t.name}</div>
                    <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>
                      {fmtCountPlus(t.postCount)}篇内容 · {fmtCount(t.views)}次浏览
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ---------------- 用户 ---------------- */}
        {!mineMode && zone === 'users' && (
          <div>
            {matched.users.length === 0 ? (
              <EmptyState text={`未找到与“${q}”相关的用户`} />
            ) : (
              matched.users.map(userRow)
            )}
          </div>
        )}
      </div>

      {/* 综合 tab 右下黑色铅笔 FAB(t0016) */}
      {zone === 'all' && (
        <button
          {...bindTap('search.results.compose-open')}
          className="absolute right-4 bottom-6 w-12 h-12 rounded-full flex items-center justify-center border-none cursor-pointer shadow-lg z-20"
          style={{ background: '#1A1A1A' }}
          aria-label="写内容"
          data-hide-on-keyboard
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4L16.5 3.5z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

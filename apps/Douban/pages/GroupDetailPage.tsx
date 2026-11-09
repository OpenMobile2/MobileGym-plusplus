// 小组详情页(group.detail,IMG_0249-0252/0337,frame:1779a1@t0012/t0055,frame:8cb08c@t0050-0065):
// per-group 主题色组头 + 4 种入组变体(direct/quiz/apply/followOnly)+ ♡关注 + 「你可能感兴趣」推荐条
// + 子板块tabs + 排序chips(最新/热门/精华)+ 讨论列表 + 发帖FAB(未加入→toast)。
// 弹层(申请理由/欢迎/…菜单)一律 URL 驱动(?sheet=...)。
import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { Avatar, C, Img, SegRow, EmptyState } from '../components/ui';
import { Sheet, CenterDialog } from '../components/Sheet';

type SortId = 'latest' | 'hot' | 'digest';
const SORTS: [SortId, string][] = [
  ['latest', '最新'],
  ['hot', '热门'],
  ['digest', '精华'],
];

function relTime(ts: number, now: number): string {
  const min = Math.floor(Math.max(0, now - ts) / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}天前`;
  return `${Math.floor(d / 30)}个月前`;
}

export default function GroupDetailPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const { groupId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const groups = useDoubanStore((s) => s.groups);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const users = useDoubanStore((s) => s.users);
  const joinGroupDirect = useDoubanStore((s) => s.joinGroupDirect);
  const applyGroup = useDoubanStore((s) => s.applyGroup);
  const toggleFollowGroup = useDoubanStore((s) => s.toggleFollowGroup);

  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);
  const now = TimeService.now();

  // URL 驱动 UI 态
  const sheet = searchParams.get('sheet'); // 'apply' | 'welcome' | 'intro' | 'more' | 'episode' | null
  const section = searchParams.get('sec') ?? 'all';
  const sort: SortId = (['latest', 'hot', 'digest'] as const).includes(searchParams.get('sort') as SortId)
    ? (searchParams.get('sort') as SortId)
    : 'latest';
  const recClosed = searchParams.get('rec') === 'closed';
  const [applyReason, setApplyReason] = React.useState('');
  const [noticeClosed, setNoticeClosed] = React.useState(false);
  const [adClosed, setAdClosed] = React.useState(false);

  const setParam = (key: string, value: string | null, replace = true) =>
    setSearchParams(
      (p) => {
        if (value === null) p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace },
    );
  const openSheet = (name: string) =>
    setSearchParams((p) => {
      p.set('sheet', name);
      return p;
    });
  const closeSheet = () =>
    setSearchParams(
      (p) => {
        p.delete('sheet');
        return p;
      },
      { replace: true },
    );

  const userOf = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, u]));
    return (uid: string) => m.get(uid);
  }, [users]);

  const recGroups = useMemo(() => groups.filter((g) => g.id !== groupId).slice(0, 4), [groups, groupId]);

  const posts = useMemo(() => {
    if (!group) return [];
    let list = groupPosts.filter((p) => p.groupId === groupId);
    if (section !== 'all') list = list.filter((p) => p.tab === section);
    if (sort === 'digest') list = list.filter((p) => p.digest);
    const sorted = [...list].sort((a, b) => {
      if (sort === 'hot') return b.replyCount - a.replyCount;
      return b.updatedAt - a.updatedAt;
    });
    // 置顶帖永远在前
    return [...sorted.filter((p) => p.pinned), ...sorted.filter((p) => !p.pinned)];
  }, [groupPosts, groupId, section, sort, group]);

  if (!group) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="flex items-center h-11 px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-12 text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        </div>
        <EmptyState text="小组不存在" />
      </div>
    );
  }

  const theme = group.themeColor;
  const joined = group.joined;
  const isApplied = group.applyStatus === 'applied';

  // 加入按钮态与行为
  const joinLabel = joined
    ? '已加入'
    : isApplied
      ? '申请中'
      : group.joinType === 'direct'
        ? '加入'
        : '+ 加入';

  const onJoinPress = () => {
    if (joined || isApplied) return;
    if (group.joinType === 'direct') {
      joinGroupDirect(group.id);
      openSheet('welcome');
    } else if (group.joinType === 'quiz') {
      openSheet('quizIntro');
    } else if (group.joinType === 'apply') {
      setApplyReason('');
      openSheet('apply');
    } else {
      toast('该组仅可关注,点♡关注');
    }
  };

  const joinBind = joined || isApplied
    ? bindTap({ kind: 'action', id: 'groupDetail.join.direct' }, { params: { groupId: group.id, noop: 1 }, onTrigger: () => toast('已加入') })
    : group.joinType === 'direct'
      ? bindTap({ kind: 'action', id: 'groupDetail.join.direct' }, { params: { groupId: group.id }, onTrigger: onJoinPress })
      : group.joinType === 'quiz'
        ? bindTap({ kind: 'action', id: 'groupDetail.join.quizSheet' }, { params: { groupId: group.id }, onTrigger: onJoinPress })
        : group.joinType === 'apply'
          ? bindTap({ kind: 'action', id: 'groupDetail.join.applySheet' }, { params: { groupId: group.id }, onTrigger: onJoinPress })
          : bindTap({ kind: 'action', id: 'groupDetail.join.direct' }, { params: { groupId: group.id, followOnly: 1 }, onTrigger: onJoinPress });

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="light">
      {/* 组头(主题色) */}
      <div className="shrink-0" style={{ background: theme }}>
        <div className="flex items-center h-11 px-1">
          <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: '#fff' }}>‹</button>
          <button
            {...bindTap('groupDetail.search-open')}
            className="flex-1 flex items-center gap-2 h-8 rounded-full px-3 border-none cursor-pointer text-xs text-left min-w-0"
            style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
            <span className="truncate opacity-90">组内搜 | 这季的更新也太慢了吧</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'groupDetail.more.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="w-10 h-10 flex items-center justify-center text-xl bg-transparent border-none cursor-pointer relative"
            style={{ color: '#fff' }}
          >
            …
            <span className="absolute top-1.5 right-1.5 min-w-3.5 h-3.5 px-0.5 rounded-full text-[9px] text-white flex items-center justify-center" style={{ background: C.danger }}>1</span>
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 pb-3 pt-1">
          <div className="relative shrink-0">
            <Img src={group.icon} className="w-16 h-16 rounded-2xl object-cover" />
            {/* 官方组「豆瓣」绿角标 */}
            <span
              className="absolute -bottom-1 -right-1 px-1 rounded text-[9px] text-white flex items-center leading-none h-4"
              style={{ background: C.green, border: '1.5px solid #fff' }}
            >
              豆瓣
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg font-bold truncate" style={{ color: '#fff' }}>{group.name}</div>
            <div className="flex items-center gap-0.5 text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.85)' }}>
              <span>{group.members.toLocaleString()} {group.memberNoun ?? '成员'}</span>
              <span className="opacity-80">›</span>
            </div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'groupDetail.follow.toggle' }, {
              params: { groupId: group.id },
              onTrigger: () => {
                toggleFollowGroup(group.id);
                toast(group.followed ? '已取消关注' : '已关注该小组');
              },
            })}
            className="w-9 h-8 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer shrink-0"
            style={{ color: '#fff' }}
            aria-label="关注"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={group.followed ? '#fff' : 'none'} stroke="currentColor" strokeWidth="1.8">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
          </button>
          <button
            {...joinBind}
            className="px-4 h-8 rounded-full text-sm cursor-pointer shrink-0 border-none"
            style={
              joined || isApplied
                ? { background: 'rgba(255,255,255,0.3)', color: '#fff' }
                : { background: '#fff', color: theme, fontWeight: 600 }
            }
          >
            {joinLabel}
          </button>
        </div>

        {/* 小组简介 / 发言规则(组头内部,白字,标签 + 右 ›) */}
        <button
          {...bindTap({ kind: 'action', id: 'groupDetail.intro.expand' }, { onTrigger: () => openSheet('intro') })}
          className="w-full text-left px-4 pb-4 bg-transparent border-none cursor-pointer"
        >
          <div className="flex items-start gap-1">
            <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.95)' }}>小组简介:</span>
            <span className="text-xs line-clamp-1 flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{group.desc}</span>
          </div>
          <div className="flex items-start gap-1 mt-1">
            <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.95)' }}>发言规则:</span>
            <span className="text-xs line-clamp-1 flex-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{group.rules}</span>
            <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.8)' }}>›</span>
          </div>
        </button>
      </div>

      {/* 绿色公告条(组头与列表之间):管理员申请开放 + ×。纯装饰关闭 → 本地视觉态,不打 data-action */}
      {!noticeClosed && (
        <div className="flex items-center gap-2 px-4 py-2 shrink-0" style={{ background: C.greenSoft }}>
          <span className="text-xs flex-1 truncate" style={{ color: C.green }}>📢 本小组管理员申请开放中 ›</span>
          <button
            onClick={() => setNoticeClosed(true)}
            className="w-5 h-5 flex items-center justify-center bg-transparent border-none cursor-pointer text-sm shrink-0"
            style={{ color: C.green }}
          >
            ×
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 「你可能感兴趣」推荐横条(已加入后展示) */}
        {joined && !recClosed && (
          <div className="bg-white border-b px-4 py-3" style={{ borderColor: '#F2F3F5' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold" style={{ color: C.text }}>你可能感兴趣</span>
              <button
                {...bindTap({ kind: 'action', id: 'groupDetail.recBar.close' }, { onTrigger: () => setParam('rec', 'closed') })}
                className="w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer text-sm"
                style={{ color: C.sub }}
              >
                ×
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto" data-scroll-container="rec" data-scroll-direction="horizontal">
              {recGroups.map((rg) => (
                <div key={rg.id} className="shrink-0 w-24 flex flex-col items-center">
                  <span {...bindTap('groupDetail.recGroup-open', { params: { groupId: rg.id } })} className="cursor-pointer">
                    <Img src={rg.icon} className="w-16 h-16 rounded-xl object-cover" />
                  </span>
                  <span className="text-[11px] mt-1 truncate w-full text-center" style={{ color: C.text }}>{rg.name}</span>
                  <span className="text-[10px] truncate w-full text-center" style={{ color: C.sub }}>{rg.members.toLocaleString()} {rg.memberNoun ?? '成员'}</span>
                  <button
                    {...bindTap({ kind: 'action', id: 'groupDetail.recGroup.join' }, {
                      params: { groupId: rg.id },
                      onTrigger: () => {
                        if (rg.joined) return;
                        if (rg.joinType === 'direct') {
                          joinGroupDirect(rg.id);
                          toast(`已加入「${rg.name}」`);
                        } else {
                          toast('该组需在组内页加入');
                        }
                      },
                    })}
                    className="mt-1 px-2 h-5 rounded-full text-[10px] cursor-pointer border-none"
                    style={rg.joined ? { background: '#F2F3F5', color: C.sub } : { background: C.greenSoft, color: C.green }}
                  >
                    {rg.joined ? '已加入' : '+加入'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 子板块 tabs(文字tab + emoji,选中 = 加粗 + 下划线) */}
        <div className="sticky top-0 z-10 bg-white border-b" style={{ borderColor: C.border }}>
          <div className="flex gap-4 px-4 pt-2 overflow-x-auto" data-scroll-container="sections" data-scroll-direction="horizontal">
            {['all', ...group.tabs].map((t) => {
              const active = section === t;
              const label = t === 'all' ? '全部' : t;
              return (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'groupDetail.section.select.target' }, {
                    params: { target: t },
                    onTrigger: () => setParam('sec', t === 'all' ? null : t),
                  })}
                  className="pb-2 text-sm shrink-0 bg-transparent border-none cursor-pointer relative"
                  style={{ color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
                >
                  {label}
                  {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full" style={{ background: C.text }} />}
                </button>
              );
            })}
          </div>
          {/* 「讨论列表」标签 + 排序分段控件(+ 选集,仅综艺组全部tab) */}
          <div className="flex items-center gap-2 px-4 py-2">
            <span className="text-xs font-semibold" style={{ color: C.text }}>讨论列表</span>
            <div className="flex-1" />
            <SegRow
              options={SORTS.map(([, l]) => l)}
              value={SORTS.find(([s]) => s === sort)?.[1] ?? '最新'}
              size="sm"
              bindFor={(label) => {
                const s = (SORTS.find(([, l]) => l === label)?.[0] ?? 'latest') as SortId;
                return bindTap({ kind: 'action', id: 'groupDetail.sort.select.target' }, {
                  params: { target: s },
                  onTrigger: () => setParam('sort', s === 'latest' ? null : s),
                });
              }}
            />
            {group.tabs.some((t) => t.includes('综') || t.includes('季')) && section === 'all' && (
              <button
                {...bindTap({ kind: 'action', id: 'groupDetail.episode.select.target' }, { params: { target: 'ep' }, onTrigger: () => openSheet('episode') })}
                className="text-xs bg-transparent border-none cursor-pointer shrink-0"
                style={{ color: C.sub }}
              >
                选集 ˅
              </button>
            )}
          </div>
        </div>

        {/* 讨论列表 */}
        <div className="bg-white">
          {posts.length === 0 ? (
            <EmptyState text="暂无讨论,发布第一条讨论 ✏" sub="快来和组员们聊聊吧" />
          ) : (
            posts.map((p) => {
              const author = userOf(p.authorId);
              return (
                <div
                  key={p.id}
                  {...bindTap('groupDetail.post-open', { params: { topicId: p.id } })}
                  className="px-4 py-3 border-b cursor-pointer"
                  style={{ borderColor: '#F2F3F5' }}
                >
                  <div className="flex items-start gap-3">
                    {/* 左列:气泡图标 + 回应数(置顶红色实心,普通橙色) */}
                    <div className="shrink-0 w-9 flex flex-col items-center pt-0.5">
                      <svg width="22" height="22" viewBox="0 0 24 24" style={{ display: 'block' }}>
                        <path
                          d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H9l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z"
                          fill={p.pinned ? C.danger : C.orange}
                        />
                      </svg>
                      <span className="text-[11px] mt-0.5" style={{ color: p.pinned ? C.danger : C.orange }}>{p.replyCount}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-medium leading-snug line-clamp-2" style={{ color: C.text }}>
                        {p.pinned && <span className="mr-1 px-1 rounded text-[9px] align-middle" style={{ background: '#E9F0FF', color: '#3E7BF2' }}>顶</span>}
                        {p.digest && <span className="mr-1 px-1 rounded text-[9px] align-middle" style={{ background: C.greenSoft, color: C.green }}>精</span>}
                        {p.tab && <span style={{ color: C.text }}>{p.tab}|</span>}
                        {p.title}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Avatar src={author?.avatar ?? ''} size={16} />
                        <span className="text-[11px]" style={{ color: C.sub }}>{author?.name ?? '豆友'}</span>
                        <span className="text-[11px]" style={{ color: '#B9BEC6' }}>{relTime(p.updatedAt, now)}更新</span>
                      </div>
                    </div>
                    {p.images[0] && <Img src={p.images[0]} className="w-14 h-14 rounded object-cover shrink-0" />}
                  </div>
                </div>
              );
            })
          )}
          {/* 列表内广告行(纯装饰,不导航) */}
          {posts.length > 0 && !adClosed && (
            <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: '#F2F3F5' }}>
              <span className="flex-1 text-[13px] truncate" style={{ color: C.sub }}>邂逅清凉夏日,精选好物立即下载</span>
              <span className="text-[10px] px-1 rounded" style={{ background: '#F2F3F5', color: '#B9BEC6' }}>广告</span>
              <button
                onClick={() => setAdClosed(true)}
                className="w-5 h-5 flex items-center justify-center bg-transparent border-none cursor-pointer text-sm shrink-0"
                style={{ color: C.sub }}
              >
                ×
              </button>
            </div>
          )}
        </div>
        <div className="h-16" />
      </div>

      {/* 发帖 FAB */}
      <button
        {...(joined
          ? bindTap('groupDetail.compose-open', { params: { groupId: group.id } })
          : bindTap({ kind: 'action', id: 'groupDetail.compose.needJoin' }, { onTrigger: () => toast('需要加入小组方可发起讨论') }))}
        className="absolute right-4 bottom-6 w-13 h-13 rounded-full flex items-center justify-center border-none cursor-pointer z-20"
        style={{ background: '#1A1A1A', width: 52, height: 52, boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}
        aria-label="发帖"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        </svg>
      </button>

      {/* 申请理由输入层(申请制) */}
      {sheet === 'apply' && (
        <Sheet title="申请加入">
          <div className="px-5 pb-2">
            <div className="text-xs mb-2" style={{ color: C.sub }}>{userOf(group.id)?.name ?? '组长'}:欢迎申请加入本小组,请填写申请理由。</div>
            <textarea
              value={applyReason}
              onChange={(e) => setApplyReason(e.target.value.slice(0, 100))}
              placeholder="填写申请理由(≤100字)"
              rows={4}
              className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none border"
              style={{ background: '#F7F7F7', color: C.text, borderColor: C.border }}
            />
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px]" style={{ color: '#B9BEC6' }}>申请被拒后需等待7天才能再次申请</span>
              <span className="text-[11px]" style={{ color: applyReason.length >= 100 ? C.danger : '#B9BEC6' }}>{applyReason.length}/100</span>
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'groupDetail.join.applySubmit' }, {
                params: { groupId: group.id },
                onTrigger: () => {
                  applyGroup(group.id, applyReason.trim());
                  closeSheet();
                  toast('申请已提交,等待组长审核');
                },
              })}
              className="w-full h-10 mt-3 rounded-full text-sm text-white border-none cursor-pointer"
              style={{ background: applyReason.trim() ? C.green : '#B7E5BE' }}
            >
              完成
            </button>
          </div>
        </Sheet>
      )}

      {/* 答题入组前置半层(组长欢迎语 + 组规) */}
      {sheet === 'quizIntro' && (
        <Sheet title="加入小组">
          <div className="px-5 pb-2">
            <div className="text-sm mb-3" style={{ color: C.text }}>欢迎你来{group.name},本组需答题通过后加入。</div>
            <div className="text-xs leading-relaxed mb-4 px-3 py-2 rounded-lg" style={{ background: '#F7F7F7', color: C.sub }}>
              发言规则:{group.rules}
            </div>
            <div className="flex gap-3">
              <button
                {...bindBack()}
                className="flex-1 h-10 rounded-full text-sm border cursor-pointer"
                style={{ background: '#fff', color: C.sub, borderColor: C.border }}
              >
                取消
              </button>
              <button
                {...bindTap('groupDetail.quiz-open', { params: { groupId: group.id } })}
                className="flex-1 h-10 rounded-full text-sm text-white border-none cursor-pointer"
                style={{ background: theme }}
              >
                答题入组
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {/* 简介/规则全文层 */}
      {sheet === 'intro' && (
        <Sheet title="小组简介 & 发言规则">
          <div className="px-5 pb-3 overflow-y-auto" style={{ maxHeight: '50vh' }}>
            <div className="text-sm leading-relaxed mb-4" style={{ color: C.text }}>{group.desc}</div>
            <div className="text-sm font-semibold mb-1" style={{ color: C.text }}>发言规则</div>
            <div className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: C.sub }}>{group.rules}</div>
          </div>
        </Sheet>
      )}

      {/* 选集筛选层(占位:综艺组特有) */}
      {sheet === 'episode' && (
        <Sheet title="选集">
          <div className="px-4 pb-3 grid grid-cols-4 gap-2">
            {['全部', '第1集', '第2集', '第3集', '第4集', '第5集'].map((ep, i) => (
              <button
                key={ep}
                {...bindBack()}
                className="h-9 rounded-lg text-xs border cursor-pointer"
                style={{ background: i === 0 ? C.greenSoft : '#F7F7F7', color: i === 0 ? C.green : C.sub, borderColor: 'transparent' }}
              >
                {ep}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* 直接加入成功欢迎弹层 */}
      {sheet === 'welcome' && (
        <CenterDialog
          title={`欢迎加入「${group.name}」`}
          dismissable={false}
          buttons={[
            {
              label: '我知道了',
              primary: true,
              bind: bindTap({ kind: 'action', id: 'groupDetail.welcome.close' }, { onTrigger: closeSheet }),
            },
          ]}
        >
          请遵守小组发言规则,友善讨论,共建良好社区氛围。
        </CenterDialog>
      )}
    </div>
  );
}

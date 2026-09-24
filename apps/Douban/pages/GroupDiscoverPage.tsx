// 发现小组(group.discover,IMG_0341-0344,frame:1779a1@t0045):
// 顶部(返回 + 「发现小组」 + 「+创建小组」)+ 左侧分类纵向导航 + 右侧组卡列表(+加入/已加入)。
// 直接加入型 → 原位加入(成员+1);答题入组型 → 跳 group.joinQuiz;分类切换走 URL。
import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img } from '../components/ui';

const CATEGORIES: [string, string][] = [
  ['recommend', '推荐'],
  ['daily', '日榜'],
  ['new', '新组'],
  ['topic', '专题'],
  ['drama', '追剧'],
  ['bm', '书影音'],
  ['humanity', '人文'],
  ['fun', '闲趣'],
  ['interest', '兴趣'],
  ['life', '生活'],
  ['food', '美食'],
  ['home', '家居'],
  ['sport', '体育运动'],
  ['pet', '宠物'],
];

/** 分类 → 组 id 的简单归类(seed 无 category 字段,按语义映射) */
const CAT_GROUPS: Record<string, string[]> = {
  recommend: ['g_hanju', 'g_naicha', 'g_agatha', 'g_body', 'g_xiaoyuzhou'],
  daily: ['g_naicha', 'g_hanju'],
  new: ['g_body', 'g_xiaoyuzhou'],
  topic: ['g_banshu', 'g_eve', 'g_hanju', 'g_agatha', 'g_xiaoyuzhou', 'g_body'],
  drama: ['g_hanju', 'g_banshu', 'g_eve'],
  bm: ['g_agatha', 'g_hanju', 'g_eve'],
  humanity: ['g_body', 'g_agatha'],
  fun: ['g_yuehou', 'g_xiaoyuzhou'],
  interest: ['g_yuehou', 'g_naicha'],
  life: ['g_naicha', 'g_body'],
  food: ['g_naicha'],
  home: [],
  sport: ['g_body'],
  pet: [],
};

/** 热帖行图标:橙色实心气泡 + 内白细纹 */
function HotBubbleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" className="shrink-0" style={{ display: 'block' }}>
      <path d="M4 4h16a2 2 0 012 2v9a2 2 0 01-2 2H9l-5 4v-4H4a2 2 0 01-2-2V6a2 2 0 012-2z" fill="#FF9900" />
      <path d="M7 9h10M7 12.5h6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function GroupDiscoverPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useDoubanStore((s) => s.toast);
  const groups = useDoubanStore((s) => s.groups);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const joinGroupDirect = useDoubanStore((s) => s.joinGroupDirect);

  const cat = searchParams.get('cat') ?? 'recommend';
  const setCat = (c: string) =>
    setSearchParams(
      (p) => {
        p.set('cat', c);
        return p;
      },
      { replace: true },
    );

  const groupById = useMemo(() => {
    const m = new Map(groups.map((g) => [g.id, g]));
    return (id: string) => m.get(id);
  }, [groups]);

  const listGroups = useMemo(() => {
    const ids = CAT_GROUPS[cat] ?? [];
    return ids.map(groupById).filter(Boolean) as NonNullable<ReturnType<typeof groupById>>[];
  }, [cat, groupById]);

  // 每组取前 1~2 条热帖(标题 + 回应数)做预览行
  const hotPostsOf = useMemo(() => {
    const m = new Map<string, { title: string; replyCount: number }[]>();
    for (const p of groupPosts) {
      if (!p.groupId) continue;
      const list = m.get(p.groupId) ?? [];
      if (list.length < 2) {
        list.push({ title: p.title, replyCount: p.replyCount });
        m.set(p.groupId, list);
      }
    }
    return (gid: string) => m.get(gid) ?? [];
  }, [groupPosts]);

  // 分节标题仅「专题」tab 出现(真机):前 3 组归「发现新兴趣」,其余归「哈哈哈哈哈哈哈嗝」;
  // 其余 tab 平铺(无分节标题,section 为空串)。
  const sections = useMemo<[string, typeof listGroups][]>(() => {
    if (cat !== 'topic') return [['', listGroups]];
    if (listGroups.length > 3) {
      return [
        ['发现新兴趣', listGroups.slice(0, 3)],
        ['哈哈哈哈哈哈哈嗝', listGroups.slice(3)],
      ];
    }
    return [['发现新兴趣', listGroups]];
  }, [listGroups, cat]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-12 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>发现小组</div>
        <button
          {...bindTap('groupDiscover.create-open')}
          className="pr-2 h-8 flex items-center gap-0.5 bg-transparent border-none cursor-pointer text-sm"
          style={{ color: C.green }}
        >
          <span className="text-base leading-none">+</span>创建小组
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类纵向导航 */}
        <div className="w-22 shrink-0 overflow-y-auto" style={{ width: 88, background: '#F2F3F5' }} data-scroll-container="cats" data-scroll-direction="vertical">
          {CATEGORIES.map(([c, label]) => {
            const active = cat === c;
            return (
              <button
                key={c}
                {...bindTap({ kind: 'action', id: 'groupDiscover.category.select.target' }, {
                  params: { target: c },
                  onTrigger: () => setCat(c),
                })}
                className="w-full py-3.5 text-[13px] bg-transparent border-none cursor-pointer flex flex-col items-center"
                style={{ background: active ? C.surface : 'transparent', color: active ? C.text : C.sub, fontWeight: active ? 700 : 400 }}
              >
                <span>{label}</span>
                {active && <span className="mt-1 w-4 h-[2px] rounded-full" style={{ background: C.text }} />}
              </button>
            );
          })}
        </div>

        {/* 右侧组列表 */}
        <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
          {/* 顶部 banner 卡(仅「推荐」tab):鉴书团招募卡 + 卡下方分页点 */}
          {cat === 'recommend' && (
            <div className="mx-4 mt-3">
              <div className="rounded-xl px-4 py-3.5 flex items-center gap-3" style={{ background: '#FFF8EE', border: '1px solid #F3E6D0' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] text-white shrink-0" style={{ background: '#FF9900' }}>鉴书团</span>
                    <span className="text-[11px]" style={{ color: '#E8702A' }}>今天报名截止</span>
                  </div>
                  <div className="text-[15px] font-bold mt-1.5 truncate" style={{ color: C.text }}>《山雾里的旧信笺》</div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <Img src="" className="w-4 h-4 rounded-full object-cover shrink-0" />
                    <span className="text-[11px] truncate" style={{ color: C.sub }}>南岭文艺出版社 · 987 人报名参加</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-1 mt-2">
                {[0, 1, 2, 3].map((i) => (
                  <span key={i} className="h-1 rounded-full" style={{ width: i === 0 ? 10 : 4, background: i === 0 ? '#FF9900' : '#E3E6EA' }} />
                ))}
              </div>
            </div>
          )}
          {listGroups.length === 0 ? (
            <div className="py-16 text-center text-sm" style={{ color: C.sub }}>该分类暂无小组</div>
          ) : (
            sections.map(([sectionTitle, sectionGroups]) => (
              <div key={sectionTitle || 'flat'}>
                {/* 分节标题(仅「专题」tab:居中带短横线) */}
                {sectionTitle && (
                  <div className="flex items-center justify-center gap-2 px-4 pt-4 pb-1.5">
                    <span className="w-4 h-px" style={{ background: C.border }} />
                    <span className="text-sm font-bold" style={{ color: C.text }}>{sectionTitle}</span>
                    <span className="w-4 h-px" style={{ background: C.border }} />
                  </div>
                )}
                {sectionGroups.map((g) => {
              const isQuiz = g.joinType === 'quiz';
              const isApply = g.joinType === 'apply';
              const isFollowOnly = g.joinType === 'followOnly';
              const hots = hotPostsOf(g.id);
              return (
                <div key={g.id} className="px-4 py-3 border-b" style={{ borderColor: '#F2F3F5' }}>
                  <div className="flex items-start gap-3">
                    <span {...bindTap('groupDiscover.group-open', { params: { groupId: g.id } })} className="cursor-pointer shrink-0">
                      <Img src={g.icon} className="w-12 h-12 rounded-xl object-cover" />
                    </span>
                    <span
                      {...bindTap('groupDiscover.group-open', { params: { groupId: g.id } })}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <span className="block text-[15px] font-semibold truncate" style={{ color: C.text }}>{g.name}</span>
                      <span className="block text-xs mt-0.5" style={{ color: C.sub }}>{g.members.toLocaleString()} {g.memberNoun ?? '成员'}</span>
                      <span className="block text-xs mt-1 line-clamp-2" style={{ color: C.sub }}>{g.desc}</span>
                    </span>
                    <button
                      {...(isQuiz
                        ? bindTap('groupDiscover.quiz-open', { params: { groupId: g.id } })
                        : bindTap({ kind: 'action', id: 'groupDiscover.group.join' }, {
                            params: { groupId: g.id },
                            onTrigger: () => {
                              if (g.joined) return;
                              if (isApply) {
                                toast('该组为申请制,进入小组页申请');
                              } else if (isFollowOnly) {
                                toast('该组仅可关注');
                              } else {
                                joinGroupDirect(g.id);
                                toast(`已加入「${g.name}」`);
                              }
                            },
                          }))}
                      className="px-3 h-7 rounded-full text-xs cursor-pointer shrink-0 mt-0.5"
                      style={
                        g.joined
                          ? { background: 'transparent', color: C.sub, border: `1px solid ${C.border}` }
                          : { background: C.greenSoft, color: C.green, border: 'none' }
                      }
                    >
                      {g.joined ? '已加入' : '+ 加入'}
                    </button>
                  </div>
                  {/* 热帖预览行(每卡 1 行:橙实心气泡图标 + 灰数字 + 标题) */}
                  {hots[0] && (
                    <div className="mt-2 ml-15 rounded-lg overflow-hidden" style={{ background: '#F7F7F7' }}>
                      <div
                        {...bindTap('groupDiscover.group-open', { params: { groupId: g.id } })}
                        className="px-2.5 py-1.5 flex items-center gap-1.5 text-xs cursor-pointer"
                      >
                        <span className="shrink-0 flex items-center gap-1">
                          <HotBubbleIcon />
                          <span style={{ color: '#B9BEC6' }}>{hots[0].replyCount}</span>
                        </span>
                        <span className="flex-1 truncate" style={{ color: C.text }}>{hots[0].title}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

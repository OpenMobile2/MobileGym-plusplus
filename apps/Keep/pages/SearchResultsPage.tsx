import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { Img } from '../res/images';
import { IcSearch, IcArrowDown, IcFootprints } from '../res/icons';

const TABS = ['全部', '商品', '路线', '装备', '动作', '用户'];
const SORT_OPTIONS = ['智能排序', '最多练过', '评分最高', '最新上架'];
const LEVEL_OPTIONS = ['全部难度', 'K1', 'K2', 'K3', 'K4'];
const DURATION_OPTIONS = ['全部时长', '10分钟内', '11-20分钟', '20分钟以上'];
const MORE_OPTIONS = ['全部课程', '免费课', '会员课'];

function levelLabel(lv: string): string {
  return lv === 'K1' ? '零基础' : lv === 'K3' ? '进阶' : lv === 'K4' ? '强化' : '初学';
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** 子串匹配；中文热词允许「智能手环」命中「智能运动手环」(字符按序出现) */
function includesTerm(haystack: string, term: string): boolean {
  const t = norm(term);
  if (!t) return true;
  const h = norm(haystack);
  if (h.includes(t)) return true;
  let i = 0;
  for (const ch of h) {
    if (ch === t[i]) i += 1;
    if (i >= t.length) return true;
  }
  return false;
}

function displayCount(value: string): number {
  const number = Number.parseFloat(value.replace(/[^\d.]/g, '')) || 0;
  if (value.includes('万') || value.toLowerCase().includes('w')) return number * 10000;
  return number;
}

function EmptyResults({ term }: { term: string }) {
  return (
    <div className="flex flex-col items-center pt-24 px-8">
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: '#F2F3F6' }}>
        <IcSearch size={28} className="text-app-text-muted" />
      </div>
      <div className="text-[15px] text-app-text mt-5 font-medium">未找到相关结果</div>
      <div className="text-[13px] text-app-text-muted mt-1.5 text-center">
        没有与「{term}」匹配的内容，试试其他关键词
      </div>
    </div>
  );
}

/** 搜索结果页 —— 证据 n03/n04/n05/n06/n07 */
export default function SearchResultsPage() {
  const { bindTap, exitSearch } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const term = useKeepStore((st) => st.current.searchTerm) ?? '减脂';
  const courses = useKeepStore((st) => st.courses);
  const products = useKeepStore((st) => st.products);
  const routes = useKeepStore((st) => st.routes);
  const actionsLib = useKeepStore((st) => st.actionsLib);
  const coaches = useKeepStore((st) => st.coaches);
  const plans = useKeepStore((st) => st.plans);
  const followedCoaches = useKeepStore((st) => st.followedCoaches) ?? [];
  const followedUsers = useKeepStore((st) => st.followedUsers) ?? [];
  const followedNames = useKeepStore((st) => st.followedNames) ?? [];
  const toggleFollowUser = useKeepStore((st) => st.toggleFollowUser);

  const tab = searchParams.get('tab') ?? '全部';
  const sort = searchParams.get('sort') ?? '智能排序';
  const filterOpen = searchParams.get('flt');
  const level = searchParams.get('level') ?? '全部难度';
  const duration = searchParams.get('duration') ?? '全部时长';
  const membership = searchParams.get('membership') ?? '全部课程';

  const courseMatches = courses.filter(
    (c) => includesTerm(c.title, term) || includesTerm(c.coach, term) || includesTerm(c.category, term),
  );
  const courseList = courseMatches
    .filter((course) => level === '全部难度' || course.level === level)
    .filter((course) => (
      duration === '全部时长'
      || (duration === '10分钟内' && course.minutes <= 10)
      || (duration === '11-20分钟' && course.minutes >= 11 && course.minutes <= 20)
      || (duration === '20分钟以上' && course.minutes > 20)
    ))
    .filter((course) => (
      membership === '全部课程'
      || (membership === '会员课' && course.isMember)
      || (membership === '免费课' && !course.isMember)
    ))
    .sort((a, b) => {
      if (sort === '最多练过') return displayCount(b.practiced) - displayCount(a.practiced);
      if (sort === '评分最高') return b.rating - a.rating;
      if (sort === '最新上架') return courses.indexOf(b) - courses.indexOf(a);
      return courses.indexOf(a) - courses.indexOf(b);
    });
  const planList = plans.filter(
    (p) => includesTerm(p.title, term) || p.tags.some((t) => includesTerm(t, term)),
  );
  const equipList = products.filter(
    (p) =>
      (p.category === '运动装备' || p.category === '智能穿戴')
      && (includesTerm(p.title, term) || includesTerm(p.category, term) || p.sellPoints.some((x) => includesTerm(x, term))),
  );
  // 「商品」tab 与全部区相关商品同规则（按关键词过滤），装备类单独走装备 tab
  const relatedGoods = products.filter(
    (p) => includesTerm(p.title, term) || includesTerm(p.category, term) || p.sellPoints.some((x) => includesTerm(x, term)),
  );
  const goodsList = relatedGoods.filter(
    (p) => p.category !== '运动装备' && p.category !== '智能穿戴',
  );
  const relatedGoodsPreview = relatedGoods.slice(0, 4);
  const routeList = routes.filter(
    (r) => includesTerm(r.name, term) || includesTerm(r.type, term) || includesTerm(r.creator, term),
  );
  const actionList = actionsLib.filter(
    (a) => includesTerm(a.name, term) || includesTerm(a.bodyPart, term) || a.muscle.some((m) => includesTerm(m, term)),
  );
  const userList = coaches.filter(
    (co) => includesTerm(co.name, term) || co.certs.some((c) => includesTerm(c, term)) || includesTerm(co.bio, term),
  );

  const allEmpty =
    courseList.length === 0
    && planList.length === 0
    && relatedGoods.length === 0
    && routeList.length === 0
    && equipList.length === 0
    && actionList.length === 0
    && userList.length === 0;
  const allPrimaryEmpty =
    courseList.length === 0 && planList.length === 0 && relatedGoods.length === 0;
  const otherHits = [
    routeList.length > 0 ? `路线 ${routeList.length}` : null,
    equipList.length > 0 ? `装备 ${equipList.length}` : null,
    actionList.length > 0 ? `动作 ${actionList.length}` : null,
    userList.length > 0 ? `用户 ${userList.length}` : null,
    goodsList.length > 0 ? `商品 ${goodsList.length}` : null,
  ].filter(Boolean) as string[];

  const switchTab = (t: string) =>
    bindTap(
      { kind: 'action', id: 'search.results.tab.switch' },
      {
        params: { tab: t },
        onTrigger: () => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
      },
    );

  const toggleFilter = (which: string) => setSearchParams((previous) => {
    if (previous.get('flt') === which) previous.delete('flt');
    else previous.set('flt', which);
    return previous;
  }, { replace: true });

  const selectFilter = (key: string, value: string, allValue: string) => setSearchParams((previous) => {
    if (value === allValue) previous.delete(key);
    else previous.set(key, value);
    previous.delete('flt');
    return previous;
  }, { replace: true });

  const filterOptions = filterOpen === 'sort'
    ? { key: 'sort', selected: sort, all: '智能排序', options: SORT_OPTIONS }
    : filterOpen === 'level'
      ? { key: 'level', selected: level, all: '全部难度', options: LEVEL_OPTIONS }
      : filterOpen === 'duration'
        ? { key: 'duration', selected: duration, all: '全部时长', options: DURATION_OPTIONS }
        : filterOpen === 'more'
          ? { key: 'membership', selected: membership, all: '全部课程', options: MORE_OPTIONS }
          : null;

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      {/* 顶部搜索框(回填关键词)+取消 */}
      <div className="flex items-center gap-2 px-4 pt-1 pb-2 shrink-0">
        <button
          {...bindTap('course.search.open.reedit')}
          className="flex-1 flex items-center gap-2 h-10 px-3.5 rounded-full border-none text-left"
          style={{ background: '#F2F3F6' }}
        >
          <IcSearch size={18} className="text-app-text-muted" />
          <span className="text-[14px] text-app-text truncate">{term}</span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'search.results.cancel' }, { onTrigger: () => exitSearch() })}
          className="shrink-0 bg-transparent border-none text-[15px] text-app-text px-1"
        >
          {s.cancel}
        </button>
      </div>

      {/* 结果 tab 栏 */}
      <div className="flex items-center gap-5 px-4 pb-1 shrink-0 overflow-x-auto" data-scroll-container="tabs" data-scroll-direction="horizontal">
        {TABS.map((t) => (
          <button
            key={t}
            {...switchTab(t)}
            className="shrink-0 bg-transparent border-none p-0 pb-1 text-[16px]"
            style={tab === t
              ? { color: '#1A1A1A', fontWeight: 700, borderBottom: '3px solid #1A1A1A' }
              : { color: '#8A8F99' }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === '全部' && (
          allEmpty ? (
            <EmptyResults term={term} />
          ) : (
            <>
              {allPrimaryEmpty && otherHits.length > 0 && (
                <div className="px-4 pt-8 pb-4 text-center">
                  <div className="text-[15px] text-app-text font-medium">全部里暂无课程/计划/商品</div>
                  <div className="text-[13px] text-app-text-muted mt-1.5">
                    可在「{otherHits.join('、')}」相关 tab 查看
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {(['路线', '装备', '动作', '用户', '商品'] as const)
                      .filter((t) => otherHits.some((h) => h.startsWith(t)))
                      .map((t) => (
                        <button
                          key={t}
                          type="button"
                          {...switchTab(t)}
                          className="px-3 py-1.5 rounded-full border-none text-[13px]"
                          style={{ background: '#E9FAF2', color: C.greenDeep }}
                        >
                          去{t}
                        </button>
                      ))}
                  </div>
                </div>
              )}
              {/* 有课程命中时展示燃脂课程 banner */}
              {courseList.length > 0 && (
                <div
                  className="px-4 pt-4 pb-4 text-white"
                  style={{ background: 'linear-gradient(160deg, #F2708A, #F58FA4 70%, #F8B4C2)' }}
                >
                  <div className="text-[24px] font-bold">全身燃脂</div>
                  <div className="text-[13px] text-white/85 mt-1">高效燃脂 轻松瘦下来</div>
                  <div className="flex items-center bg-white rounded-xl mt-3 px-3 py-2.5">
                    <span className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: '#F4526A' }}>
                      <IcFootprints size={18} />
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-app-text ml-2.5">燃脂课程</span>
                    <button
                      {...bindTap('course.detail.open.fromSearch', {
                        params: { courseId: courseList[0].id },
                        beforeTrigger: () => setCurrent('courseId', courseList[0].id),
                      })}
                      className="px-4 py-1.5 rounded-full border-none text-white text-[13px]"
                      style={{ background: C.green }}
                    >
                      进入
                    </button>
                  </div>
                </div>
              )}

              {courseList.length > 0 && (
                <>
                  {/* 筛选栏 */}
                  <div className="flex items-center gap-4 px-4 pt-3 pb-1">
                    <button
                      {...bindTap(
                        { kind: 'action', id: 'search.results.filter.open' },
                        {
                          params: { which: '智能排序' },
                          onTrigger: () => toggleFilter('sort'),
                        },
                      )}
                      className="flex items-center gap-0.5 bg-transparent border-none p-0 text-[13px] text-app-text"
                    >
                      {sort} <IcArrowDown size={13} />
                    </button>
                    <button {...bindTap({ kind: 'action', id: 'search.results.filter.open' }, { params: { which: '难度' }, onTrigger: () => toggleFilter('level') })} className="flex items-center gap-0.5 border-none bg-transparent p-0 text-[13px] text-app-text-muted">{level === '全部难度' ? '难度' : level} <IcArrowDown size={13} /></button>
                    <button {...bindTap({ kind: 'action', id: 'search.results.filter.open' }, { params: { which: '时长' }, onTrigger: () => toggleFilter('duration') })} className="flex items-center gap-0.5 border-none bg-transparent p-0 text-[13px] text-app-text-muted">{duration === '全部时长' ? '时长' : duration} <IcArrowDown size={13} /></button>
                    <button {...bindTap({ kind: 'action', id: 'search.results.filter.open' }, { params: { which: '更多' }, onTrigger: () => toggleFilter('more') })} className="flex items-center gap-0.5 border-none bg-transparent p-0 text-[13px] text-app-text-muted">{membership === '全部课程' ? '更多' : membership} ▾</button>
                  </div>
                  {filterOptions && (
                    <div className="mx-4 mb-1 rounded-xl border border-app-border bg-app-surface flex flex-wrap gap-2 p-3">
                      {filterOptions.options.map((op) => (
                        <button
                          key={op}
                          {...bindTap(
                            { kind: 'action', id: 'search.results.filter.open' },
                            {
                              params: { value: op },
                              onTrigger: () => selectFilter(filterOptions.key, op, filterOptions.all),
                            },
                          )}
                          className="px-3 py-1.5 rounded-full text-[12px] border-none"
                          style={filterOptions.selected === op ? { background: '#E9FAF2', color: C.greenDeep, fontWeight: 600 } : { background: '#F2F3F6', color: '#666' }}
                        >
                          {op}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* 课程卡(仅命中) */}
                  <div className="flex flex-col gap-3 px-4 pt-2">
                    {courseList.slice(0, 5).map((c, i) => (
                      <button
                        key={c.id}
                        {...bindTap('course.detail.open.fromSearch', {
                          params: { courseId: c.id },
                          beforeTrigger: () => setCurrent('courseId', c.id),
                        })}
                        className="flex items-start gap-3 bg-transparent border-none p-0 text-left"
                      >
                        <div className="relative shrink-0">
                          <Img id={c.cover} className="w-29 h-20 rounded-lg object-cover" alt={c.title} />
                          {i < 3 && (
                            <span className="absolute left-1 top-1 px-1 py-0.5 rounded text-[10px] text-white" style={{ background: C.green }}>
                              新课
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[15px] font-semibold text-app-text leading-snug line-clamp-2">{c.title}</div>
                          <div className="text-[12px] text-app-text-muted mt-1">
                            {c.level} {levelLabel(c.level)} {c.minutes} 分钟
                          </div>
                          <div className="text-[12px] text-app-text-muted mt-0.5">
                            {c.coach} · 评分 {c.rating.toFixed(1)}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* 计划卡(按词过滤) */}
              {planList.length > 0 && (
                <div className="px-4 pt-3">
                  {planList.slice(0, 2).map((plan) => (
                    <button
                      key={plan.id}
                      {...bindTap('plan.result.open.fromSearch', {
                        params: { planId: plan.id },
                        beforeTrigger: () => setCurrent('planId', plan.id),
                      })}
                      className="flex items-center gap-3 w-full rounded-xl border border-app-border bg-app-surface p-3 text-left mb-2"
                    >
                      <Img id={plan.cover} className="w-24 h-16 rounded-lg object-cover shrink-0" alt={plan.title} />
                      <div className="flex-1 min-w-0">
                        <span className="px-1 py-0.5 rounded text-[10px]" style={{ background: '#F0EBFF', color: C.purple }}>计划</span>
                        <div className="text-[15px] font-semibold text-app-text truncate mt-1">{plan.title}</div>
                        <div className="text-[12px] text-app-text-muted mt-0.5">{plan.weeks}周 · {plan.practiced}练过</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* 相关商品横排 */}
              {relatedGoodsPreview.length > 0 && (
                <>
                  <div className="px-4 pt-4 text-[16px] font-bold text-app-text">相关商品</div>
                  <div className="flex gap-2.5 px-4 pt-2 pb-6 overflow-x-auto" data-scroll-container="goods" data-scroll-direction="horizontal">
                    {relatedGoodsPreview.map((p) => (
                      <button
                        key={p.id}
                        {...bindTap('mall.detail.open.fromSearch', {
                          params: { productId: p.id },
                          beforeTrigger: () => setCurrent('productId', p.id),
                        })}
                        className="shrink-0 w-28 bg-transparent border-none p-0 text-left"
                      >
                        <Img id={p.cover} className="w-28 h-28 rounded-lg object-cover" alt={p.title} />
                        <div className="text-[12px] text-app-text truncate mt-1">{p.title}</div>
                        <div className="text-[13px] font-bold" style={{ color: '#F4526A' }}>¥{p.price}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {relatedGoodsPreview.length === 0 && <div className="h-6" />}
            </>
          )
        )}

        {tab === '商品' && (
          goodsList.length === 0 ? (
            <EmptyResults term={term} />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-4 pt-3 pb-6">
              {goodsList.map((p) => (
                <button
                  key={p.id}
                  {...bindTap('mall.detail.open.fromSearch', {
                    params: { productId: p.id },
                    beforeTrigger: () => setCurrent('productId', p.id),
                  })}
                  className="rounded-xl overflow-hidden border border-app-border bg-app-surface p-0 text-left"
                >
                  <Img id={p.cover} className="w-full h-36 object-cover" alt={p.title} />
                  <div className="p-2">
                    <div className="text-[13px] text-app-text line-clamp-2 leading-snug">{p.title}</div>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-[15px] font-bold" style={{ color: '#F4526A' }}>¥{p.price}</span>
                      <span className="text-[11px] text-app-text-muted">月销{p.monthlySales}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === '路线' && (
          routeList.length === 0 ? (
            <EmptyResults term={term} />
          ) : (
            <div className="flex flex-col px-4 pt-2 pb-6">
              {routeList.map((r) => (
                <button
                  key={r.id}
                  {...bindTap('route.detail.open.fromSearch', {
                    params: { routeId: r.id },
                    beforeTrigger: () => setCurrent('routeId', r.id),
                  })}
                  className="flex items-center gap-3 py-2.5 bg-transparent border-none p-0 text-left border-b border-app-border"
                >
                  <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                    <MapCanvas height={80} route />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-app-text truncate">{r.name}</div>
                    <div className="flex items-center gap-1.5 mt-1 text-[12px] text-app-text-muted">
                      全程 {r.km} 公里 {r.climb > 0 ? `爬升 ${r.climb} 米` : ''}
                      <span className="px-1 py-0.5 rounded border border-app-border text-[10px]">{r.type}</span>
                    </div>
                    <div className="text-[12px] text-app-text-muted mt-1">{r.checkins} 人打卡</div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === '装备' && (
          equipList.length === 0 ? (
            <EmptyResults term={term} />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 px-4 pt-3 pb-6">
              {equipList.map((p) => (
                <button
                  key={p.id}
                  {...bindTap('mall.detail.open.fromSearch', {
                    params: { productId: p.id },
                    beforeTrigger: () => setCurrent('productId', p.id),
                  })}
                  className="rounded-xl overflow-hidden border border-app-border bg-app-surface p-0 text-left"
                >
                  <Img id={p.cover} className="w-full h-36 object-cover" alt={p.title} />
                  <div className="p-2">
                    <div className="text-[13px] text-app-text line-clamp-2 leading-snug">{p.title}</div>
                    <div className="text-[11px] text-app-text-muted mt-1.5">{p.monthlySales} 人使用</div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === '动作' && (
          actionList.length === 0 ? (
            <EmptyResults term={term} />
          ) : (
            <div className="flex flex-col px-4 pt-1 pb-6">
              {actionList.map((a) => (
                <button
                  key={a.id}
                  {...bindTap('action.detail.open.fromSearch', {
                    params: { actionId: a.id },
                    beforeTrigger: () => setCurrent('actionId', a.id),
                  })}
                  className="flex items-center gap-3 py-2.5 bg-transparent border-none p-0 text-left border-b border-app-border"
                >
                  <Img id={a.id} className="w-20 h-14 rounded-lg object-cover shrink-0" alt={a.name} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-app-text">{a.name}</div>
                    <div className="text-[12px] text-app-text-muted mt-1">{a.muscle.join(' · ')}</div>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === '用户' && (
          userList.length === 0 ? (
            <EmptyResults term={term} />
          ) : (
            <div className="flex flex-col px-4 pt-1 pb-6">
              {userList.map((co) => {
                const followed = followedCoaches.includes(co.id)
                  || followedUsers.includes(co.name)
                  || followedNames.includes(co.name);
                return (
                  <div key={co.id} className="flex items-center gap-3 py-3 border-b border-app-border">
                    <button
                      {...bindTap('coach.profile.open.fromResults', {
                        params: { coachId: co.id },
                        beforeTrigger: () => setCurrent('coachId', co.id),
                      })}
                      className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-none p-0 text-left"
                    >
                      <Img id={co.avatar} className="w-11 h-11 rounded-full object-cover shrink-0" alt={co.name} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] text-app-text">{co.name}</div>
                        <div className="text-[12px] text-app-text-muted mt-0.5">{co.certs[0]} · 粉丝 {co.fans}</div>
                      </div>
                    </button>
                    <button
                      {...bindTap(
                        { kind: 'action', id: 'search.results.user.follow.toggle' },
                        {
                          params: { name: co.name },
                          stopPropagation: true,
                          onTrigger: () => toggleFollowUser(co.name),
                        },
                      )}
                      className="px-4 py-1.5 rounded-full border-none text-[13px] shrink-0"
                      style={followed
                        ? { background: '#F2F3F6', color: '#9AA0A8' }
                        : { background: C.green, color: '#fff' }}
                    >
                      {followed ? s.followed : s.follow}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

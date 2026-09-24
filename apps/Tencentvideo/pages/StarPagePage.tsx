// 演员主页。节点 star.page(spec v1.2.0,8 条交互)。
// 视觉证据:753(渐变 banner + 返回/私信/… + 头像 + 姓名 +「+关注」+ 简介行 › +
// 0关注/4761粉丝/0转赞评 + 主页/圈儿/精选视频 tab + 作品筛选 全部29/电影1/电视剧27/综艺1 +
// 三列作品宫格)、751/752(关注前后状态对:4761→4762,「+关注」→「已关注」)。
//
// 关注计数联动是本页核心演示点,一律走 store.starFollowToggle(它同时改 fans 与 toast)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvQuery } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { PosterCard } from '../components/PosterCard';
import { EmptyState } from '../components/ui';
import { IcArrowRight, IcComment, IcMore, IcNavBack } from '../res/icons';

const UI_TAB = 'star.page.tab';
const UI_FILTER = 'star.page.worksFilter';
const UI_INTRO = 'star.page.introExpanded';

/** 结构性标签(证据 753;res/strings.ts 暂无对应键,已列入共享文件诉求) */
const FOLLOW_LABEL = '+关注';
const FOLLOWED_LABEL = '已关注';
const STAT_FOLLOWING = '关注';
const STAT_FANS = '粉丝';
const STAT_INTERACTIONS = '转赞评';
const WORKS_ALL = '全部';
/** 圈儿 / 精选视频未实拍,spec 明确 mock 给空态 */
const TAB_EMPTY = '内容更新中';

export default function StarPagePage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const actor = useTencentvideoStore((st) => st.actor);
  const contents = useTencentvideoStore((st) => st.contents);
  const followedAuthors = useTencentvideoStore((st) => st.followedAuthors);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const followAuthorToggle = useTencentvideoStore((st) => st.followAuthorToggle);

  const actorParam = useTvQuery('actor');
  const displayName = actorParam ?? actor.name;
  const castNames = useMemo(
    () => [...new Set(contents.flatMap((item) => (item.cast ?? []).map((member) => member.name)))],
    [contents],
  );
  const actorIndex = Math.max(0, castNames.indexOf(displayName));
  const actorAvatar = displayName === actor.name
    ? actor.avatar
    : `avatar_u${String((actorIndex % 12) + 1).padStart(2, '0')}.png`;
  const following = followedAuthors.includes(displayName) || (displayName === actor.name && actor.followed);

  const activeTab = (ui[UI_TAB] as string) || actor.tabs[0];
  const activeFilter = (ui[UI_FILTER] as string) || WORKS_ALL;
  const introExpanded = ui[UI_INTRO] === true;

  const works = useMemo(() => {
    const own = contents.filter((item) => (item.cast ?? []).some((member) => member.name === displayName));
    if (displayName === actor.name && own.length === 0) {
      return actor.workIds.map((id) => contents.find((c) => c.id === id)).filter((c) => c !== undefined);
    }
    return own;
  }, [actor.name, actor.workIds, contents, displayName]);
  const workCounts = useMemo(() => {
    const counts: Record<string, number> = { [WORKS_ALL]: works.length };
    works.forEach((work) => { counts[work.category] = (counts[work.category] ?? 0) + 1; });
    return counts;
  }, [works]);
  const intro = displayName === actor.name
    ? actor.intro
    : `${displayName}，主要作品${works.slice(0, 3).map((work) => `《${work.title}》`).join('、') || '正在更新'}。`;
  const fansBase = displayName === actor.name ? actor.fans : 1200 + actorIndex * 137;
  const fans = fansBase + (following && !(displayName === actor.name && actor.followed) ? 1 : 0);
  const filteredWorks = useMemo(
    () => (activeFilter === WORKS_ALL ? works : works.filter((c) => c.category === activeFilter)),
    [works, activeFilter],
  );

  const statBind = bindTap({ kind: 'action', id: 'star.social.wontfix' }, {
    onTrigger: () => toast(s.notOpen),
  });

  const stat = (value: React.ReactNode, label: string) => (
    <button
      {...statBind}
      className="flex items-baseline gap-1 bg-transparent border-none p-0"
      style={{ color: C.textSub }}
    >
      <span className="text-[14px] font-semibold" style={{ color: C.text }}>
        {value}
      </span>
      <span className="text-[12px]">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      {/* 渐变 banner + 顶栏(证据 753) */}
      <div className="relative shrink-0">
        <div className="absolute inset-0 overflow-hidden">
          <TvImg id={actorAvatar} alt={displayName} className="w-full h-full object-cover blur-xl scale-110" />
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(to bottom, rgba(0,0,0,0.35), ${C.pageBg})` }}
          />
        </div>
        <div className="relative flex items-center h-11 px-2">
          <button {...bindBack()} className="bg-transparent border-none p-1 text-white" aria-label={s.back}>
            <IcNavBack size={22} />
          </button>
          <div className="flex-1" />
          <button
            {...bindTap({ kind: 'action', id: 'star.dm.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="bg-transparent border-none p-1 text-white"
            aria-label="私信"
          >
            <IcComment size={19} />
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'star.more.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="bg-transparent border-none p-1 text-white"
            aria-label="更多"
          >
            <IcMore size={19} />
          </button>
        </div>

        <div className="relative flex items-end gap-3 px-3 pt-2 pb-3">
          <div className="w-[64px] h-[64px] rounded-full overflow-hidden shrink-0 border-2 border-white/70">
            <TvImg id={actorAvatar} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="text-[19px] font-bold truncate" style={{ color: C.text }}>
              {displayName}
            </div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'star.follow.toggle' }, {
              onTrigger: () => followAuthorToggle(displayName),
            })}
            className="shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium border-none"
            style={{
              background: following ? C.chipGray : C.primary,
              color: following ? C.textSub : '#FFFFFF',
            }}
          >
            {following ? FOLLOWED_LABEL : FOLLOW_LABEL}
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <button
          {...bindTap({ kind: 'action', id: 'star.intro.expand' }, {
            onTrigger: () => setUi(UI_INTRO, !introExpanded),
          })}
          className="flex items-start gap-1 w-full text-left px-3 bg-transparent border-none text-[12px] leading-[18px]"
          style={{ color: C.textSub }}
        >
          <span className={introExpanded ? 'flex-1' : 'flex-1 line-clamp-1'}>{intro}</span>
          <IcArrowRight size={14} />
        </button>

        <div className="flex items-center gap-4 px-3 pt-3">
          {stat(0, STAT_FOLLOWING)}
          {stat(fans, STAT_FANS)}
          {stat(0, STAT_INTERACTIONS)}
        </div>

        <div className="flex items-end gap-5 px-3 pt-4">
          {actor.tabs.map((t) => {
            const active = t === activeTab;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'star.tab.switch' }, {
                  onTrigger: () => setUi(UI_TAB, t),
                })}
                className={`bg-transparent border-none p-0 ${active ? 'text-[17px] font-bold' : 'text-[15px]'}`}
                style={{ color: active ? C.text : C.textSub }}
              >
                {t}
              </button>
            );
          })}
        </div>

        {activeTab === actor.tabs[0] ? (
          <>
            <div
              className="flex items-center gap-2 px-3 pt-3 pb-1 overflow-x-auto scrollbar-none"
              data-scroll-container="workFilters"
              data-scroll-direction="horizontal"
            >
              {Object.entries(workCounts).map(([key, count]) => {
                const active = key === activeFilter;
                return (
                  <button
                    key={key}
                    {...bindTap({ kind: 'action', id: 'star.works.filter' }, {
                      onTrigger: () => setUi(UI_FILTER, key),
                    })}
                    className="shrink-0 rounded-full border-none px-3 py-1 text-[13px]"
                    style={{
                      background: active ? C.primaryBg : C.chipGray,
                      color: active ? C.primary : C.textSub,
                    }}
                  >
                    {key}
                    {count}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-3 pt-2">
              {filteredWorks.length === 0 ? (
                <div className="col-span-3">
                  <EmptyState text={s.noWorks} />
                </div>
              ) : filteredWorks.map((c) => (
                <PosterCard
                  key={c.id}
                  content={c}
                  size="sm"
                  subtitle=""
                  bind={bindTap('detail.series.open.fromStar', { params: { contentId: c.id } })}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyState text={TAB_EMPTY} />
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}

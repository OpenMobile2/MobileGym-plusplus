// 短剧频道页(tab 根页 /shortdrama)。节点 shortdrama.home + chrome.resumebar(续播条并入本页)。
// 视觉证据:754(精选态:顶栏「短剧⇌」+ 推荐/精选/看过 + 搜索;主题楼层横滑;底部《天越》续播条;
// 切换 toast)、f_014/f_046(金刚位三键 + 为你推荐 3 列宫格「🔥热度 / 全N集」+ 换一换 + 排行榜双栏)、
// f_016(排行榜双栏内是「序号 + 小海报 + 片名 + 主演 + 推荐语」)、757/f_038(类型下拉三项)、
// 756/f_030(短番形态:同款顶栏压黑底 + 竖屏画面 + 全屏观看 + 右侧操作纵列 + 看全集条)。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { ShortdramaTypeHeader, SideRail, type RailItem } from '../components/shortdrama';
import { TvImg } from '../components/Img';
import { Badge, EmptyState, SectionHeader } from '../components/ui';
import type { TvContent } from '../types';
import { shareEpisodeToWechat } from '../capabilities';
import {
  IcArrowRight, IcClose, IcComment, IcEpisodes, IcFilter, IcFullscreen,
  IcHeart, IcHeat, IcLoop, IcShare, IcStar,
} from '../res/icons';

/** 页内离散 UI 态(brief §3:一律 store.ui,不进 URL) */
const UI_MODE = 'shortdrama.home.mode';
const UI_TAB = 'shortdrama.home.tab';
const UI_MENU = 'shortdrama.home.typemenu';
const UI_GUIDE_DONE = 'shortdrama.home.guideDismissed';
const UI_RESUMEBAR_HIDDEN = 'chrome.resumebar.hidden';
/** 为你推荐宫格的「换一换」洗牌键(store.shuffleSeeds) */
const SHUFFLE_KEY = 'shortdrama.home.grid';
/** 为你推荐宫格一屏 6 张(证据 f_014) */
const GRID_SIZE = 6;

export default function ShortdramaHomePage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contents = useTencentvideoStore((s) => s.contents);
  const channels = useTencentvideoStore((s) => s.channels);
  const rankings = useTencentvideoStore((s) => s.rankings);
  const watchHistory = useTencentvideoStore((s) => s.watchHistory);
  const chasing = useTencentvideoStore((s) => s.chasing);
  const likedContentIds = useTencentvideoStore((s) => s.likedContentIds);
  const followedAuthors = useTencentvideoStore((s) => s.followedAuthors);
  const shuffleSeeds = useTencentvideoStore((s) => s.shuffleSeeds);
  const resumeEpisode = useTencentvideoStore((s) => s.resume);
  const wontfixToast = useTencentvideoStore((s) => s.wontfixToast);
  const ui = useTencentvideoStore((s) => s.ui);

  const toast = useTencentvideoStore((s) => s.toast);
  const setUi = useTencentvideoStore((s) => s.setUi);
  const shuffleRefresh = useTencentvideoStore((s) => s.shuffleRefresh);
  const openPlayback = useTencentvideoStore((s) => s.openPlayback);
  const likeToggle = useTencentvideoStore((s) => s.likeToggle);
  const chaseToggle = useTencentvideoStore((s) => s.chaseToggle);
  const followAuthorToggle = useTencentvideoStore((s) => s.followAuthorToggle);

  const sd = channels.shortdrama ?? {};
  const modes = useMemo(() => sd.modes ?? [], [sd.modes]);
  const tabs = useMemo(() => sd.subTabs ?? [], [sd.subTabs]);
  const floors = useMemo(() => sd.floors ?? [], [sd.floors]);
  const resumeBar = sd.resumeBar;

  const mode = (ui[UI_MODE] as string) || modes[0] || '';
  // 精选是真机默认落地 tab(754/f_014 都是「精选」加粗)
  const activeTab = (ui[UI_TAB] as string) || tabs[1] || tabs[0] || '';
  const menuOpen = ui[UI_MENU] === true;
  const guideOpen = ui[UI_GUIDE_DONE] !== true;
  const resumeHidden = ui[UI_RESUMEBAR_HIDDEN] === true;

  const byId = useMemo(() => {
    const m = new Map<string, (typeof contents)[number]>();
    for (const c of contents) m.set(c.id, c);
    return m;
  }, [contents]);

  /** 为你推荐宫格:竖屏热播榜池,「换一换」按 shuffleSeeds 整体轮转(确定性,禁 Math.random) */
  const gridItems = useMemo(() => {
    const pool = rankings.shortdrama.verticalHot
      .map((e) => byId.get(e.id))
      .filter((c) => c !== undefined);
    if (pool.length === 0) return [];
    const offset = (shuffleSeeds[SHUFFLE_KEY] ?? 0) % pool.length;
    return [...pool.slice(offset), ...pool.slice(0, offset)].slice(0, GRID_SIZE);
  }, [rankings.shortdrama.verticalHot, byId, shuffleSeeds]);

  /** 看过 tab:观看历史里的短剧(真机该 tab 就是本人看过的短剧列表) */
  const watchedItems = useMemo(
    // 历史里还有「看过的短视频」聚合条目,它没有 contentId,先滤掉
    () =>
      watchHistory
        .flatMap((h) => (h.contentId ? [byId.get(h.contentId)] : []))
        .filter((c): c is TvContent => c !== undefined && c.category === '短剧'),
    [watchHistory, byId],
  );

  /** 短番形态的竖屏流内容:种子里的短番条目(证据 756 的《灵偶伴我余生》同族) */
  const fanItems = useMemo(() => contents.filter((c) => c.category === '短番'), [contents]);
  const fanItem = fanItems[0];

  /* ---------- 顶栏绑定 ---------- */

  const typeBind = bindTap({ kind: 'action', id: 'shortdrama.home.typemenu.toggle' }, {
    onTrigger: () => {
      setUi(UI_MENU, !menuOpen);
      setUi(UI_GUIDE_DONE, true); // 点过就不再提示(证据 758 气泡是首见引导)
    },
  });

  /** 下拉项:短剧⇄短番 = 页内换形态;少儿 = 独立路由 */
  const modeBind = (m: string) => {
    if (m === modes[2]) return bindTap('shortdrama.kids.open.fromTypemenu');
    return bindTap({ kind: 'action', id: 'shortdrama.home.type.switch' }, {
      onTrigger: () => {
        setUi(UI_MODE, m);
        setUi(UI_MENU, false);
        toast(switchToastOf(sd.switchToast ?? '', m, mode, modes));
      },
    });
  };

  const tabBind = (t: string) => bindTap({ kind: 'action', id: 'shortdrama.home.tab.switch' }, {
    onTrigger: () => setUi(UI_TAB, t),
  });

  const kingkongWontfix = bindTap({ kind: 'action', id: 'shortdrama.home.kingkong.wontfix' }, {
    onTrigger: () => toast(s.notOpen),
  });

  /* ---------- 短剧卡:进竖屏播放器前先建立播放上下文 ---------- */
  // 注意:transition 的 onTrigger 会顶掉跳转(useTriggerGestures),写 store 只能走 beforeTrigger。
  const cardBind = (contentId: string) =>
    bindTap('shortdrama.player.open.fromHome', {
      params: { contentId },
      beforeTrigger: () => openPlayback(contentId, 1),
    });

  const rankItemBind = (contentId: string) =>
    bindTap('shortdrama.player.open.fromHomeRank', {
      params: { contentId },
      beforeTrigger: () => openPlayback(contentId, 1),
    });

  /* ---------- 楼层 ---------- */

  const kingKong = (
    <div className="flex items-center gap-2 px-3 pt-1.5 pb-1">
      {/* 金刚位三键(证据 f_014:左键进全部分类,右两键真机未锁定去向 → wontfix) */}
      <button
        {...bindTap('filter.page.open.fromShortdrama', { params: { channel: '短剧' } })}
        className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border-none text-[13px]"
        style={{ background: C.chipGray, color: C.text }}
      >
        <IcFilter size={14} />
        全部分类
      </button>
      <button
        {...kingkongWontfix}
        className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border-none text-[13px]"
        style={{ background: C.rankChipBg, color: C.rankChipText }}
      >
        <IcStar size={14} />
        精选必看
      </button>
      <button
        {...kingkongWontfix}
        className="flex-1 flex items-center justify-center gap-1 h-9 rounded-lg border-none text-[13px]"
        style={{ background: C.primaryBg, color: C.primary }}
      >
        <IcHeat size={14} />
        上新推荐
      </button>
    </div>
  );

  const recommendGrid = (
    <>
      <SectionHeader
        title={s.shortdramaRecForYou}
        right={
          <button
            {...bindTap({ kind: 'action', id: 'shortdrama.home.shuffle.refresh' }, {
              onTrigger: () => shuffleRefresh(SHUFFLE_KEY),
            })}
            className="flex items-center gap-1 bg-transparent border-none p-0 text-[12px]"
            style={{ color: C.textSub }}
          >
            <IcLoop size={13} />
            换一换
          </button>
        }
      />
      <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-3">
        {gridItems.map((c) => (
          <div key={c.id} {...cardBind(c.id)} className="flex flex-col min-w-0 cursor-pointer">
            <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
              <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
              {c.badge && (
                <div className="absolute top-0 right-0">
                  <Badge text={c.badge} className="rounded-none rounded-bl-[6px] rounded-tr-[8px]" />
                </div>
              )}
              <div
                className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1 pb-0.5 pt-4 text-[10px] leading-none text-white"
                style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
              >
                <span className="flex items-center gap-0.5">
                  <IcHeat size={10} />
                  {c.heat}
                </span>
                <span>{c.episodes ? `全${c.episodes}集` : ''}</span>
              </div>
            </div>
            <div className="mt-1.5 text-[13px] font-medium truncate" style={{ color: C.text }}>
              {c.title}
            </div>
            <div className="mt-0.5 text-[11px] truncate" style={{ color: C.textSub }}>
              {(c.cast ?? []).map((p) => p.name).join('  ')}
            </div>
          </div>
        ))}
      </div>
    </>
  );

  /** 主题楼层:标题 + 横滑竖版卡(证据 754「虐渣·气场全开」「侯呈玥作品」) */
  const themeFloors = floors.map((f) => (
    <div key={f.title}>
      <SectionHeader title={f.title} />
      <div
        className="flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none"
        data-scroll-container="floor"
        data-scroll-direction="horizontal"
      >
        {f.ids
          .map((id) => byId.get(id))
          .filter((c) => c !== undefined)
          .map((c) => (
            <div key={c.id} {...cardBind(c.id)} className="shrink-0 w-[104px] cursor-pointer">
              <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
                <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
                {c.badge && (
                  <div className="absolute top-0 right-0">
                    <Badge text={c.badge} className="rounded-none rounded-bl-[6px] rounded-tr-[8px]" />
                  </div>
                )}
                <div
                  className="absolute inset-x-0 bottom-0 flex items-center justify-between px-1 pb-0.5 pt-4 text-[10px] leading-none text-white"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
                >
                  <span className="flex items-center gap-0.5">
                    <IcHeat size={10} />
                    {c.heat}
                  </span>
                  <span>{c.episodes ? `全${c.episodes}集` : ''}</span>
                </div>
              </div>
              <div className="mt-1 text-[12px] truncate" style={{ color: C.text }}>
                {c.title}
              </div>
            </div>
          ))}
      </div>
    </div>
  ));

  /** 排行榜双栏(证据 f_014/f_016:两张米金卡并排,各 3 条) */
  const rankBoards = (
    <>
      <SectionHeader title={s.shortdramaRank} />
      <div
        className="flex gap-2 px-3 overflow-x-auto scrollbar-none"
        data-scroll-container="rankBoards"
        data-scroll-direction="horizontal"
      >
        {[
          { title: rankings.shortdrama.tabOrder[0], ids: rankings.shortdrama.verticalHot.map((e) => e.id) },
          { title: rankings.shortdrama.tabOrder[1], ids: rankings.shortdrama.verticalSearch },
        ].map((board) => (
          <div
            key={board.title}
            className="shrink-0 w-[268px] rounded-xl px-2.5 py-2"
            style={{ background: C.rankChipBg }}
          >
            <button
              {...bindTap('rank.page.open.fromShortdrama', { params: { rank: 'shortdrama' } })}
              className="w-full flex items-center justify-between bg-transparent border-none p-0 pb-1.5"
              style={{ color: C.rankChipText }}
            >
              <span className="text-[14px] font-bold">{board.title}</span>
              <IcArrowRight size={14} />
            </button>
            {board.ids
              .slice(0, 3)
              .map((id) => byId.get(id))
              .filter((c) => c !== undefined)
              .map((c, i) => (
                <div
                  key={c.id}
                  {...rankItemBind(c.id)}
                  className="flex items-center gap-2 py-1 cursor-pointer"
                >
                  <span
                    className="shrink-0 w-4 h-4 rounded-[3px] text-[10px] leading-4 text-center font-bold text-white"
                    style={{ background: i < 3 ? C.badgeOrange : C.textTertiary }}
                  >
                    {i + 1}
                  </span>
                  <TvImg
                    id={c.poster}
                    alt={c.title}
                    className="shrink-0 w-8 h-11 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate" style={{ color: C.text }}>
                      {c.title}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: C.textSub }}>
                      {(c.cast ?? []).map((p) => p.name).join('  ')}
                    </div>
                    {c.recommend && (
                      <div className="text-[11px] truncate" style={{ color: C.rankChipText }}>
                        {c.recommend}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );

  /* ---------- 短番竖屏流形态(证据 756/f_030) ---------- */

  const fanRail: RailItem[] = fanItem
    ? [
      {
        key: 'author',
        ariaLabel: '关注',
        icon: (
          <span className="relative block">
            <TvImg
              id={fanItem.poster}
              alt={fanItem.director ?? fanItem.title}
              className="w-9 h-9 rounded-full object-cover border border-white/70"
            />
            <span
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 rounded-full text-[9px] leading-[13px] text-white whitespace-nowrap"
              style={{
                background: followedAuthors.includes(fanItem.director ?? '')
                  ? C.textTertiary
                  : C.unlockRed,
              }}
            >
              {followedAuthors.includes(fanItem.director ?? '') ? '已关注' : '关注'}
            </span>
          </span>
        ),
        bind: bindTap({ kind: 'action', id: 'shortdrama.player.follow.author' }, {
          onTrigger: () => followAuthorToggle(fanItem.director ?? fanItem.title),
        }),
      },
      {
        key: 'like',
        ariaLabel: '赞',
        icon: <IcHeart size={28} />,
        active: likedContentIds.includes(fanItem.id),
        bind: bindTap({ kind: 'action', id: 'shortdrama.player.like.toggle' }, {
          onTrigger: () => likeToggle(fanItem.id),
        }),
      },
      {
        key: 'comment',
        ariaLabel: '评论',
        icon: <IcComment size={28} />,
        label: '评论',
        // 评论面板长在播放器上(spec 把面板类交互建在 shortdrama.player),这里进播放器再看
        bind: bindTap('shortdrama.player.open.fromFanFeed', {
          params: { contentId: fanItem.id },
          beforeTrigger: () => openPlayback(fanItem.id, 1),
        }),
      },
      {
        key: 'share',
        ariaLabel: '分享',
        icon: <IcShare size={28} />,
        label: '分享',
        bind: bindTap({ kind: 'action', id: 'shortdrama.player.share' }, {
          onTrigger: () => {
            const launched = shareEpisodeToWechat(
              {
                contentId: fanItem.id,
                episode: 1,
                title: fanItem.title,
                cover: fanItem.poster,
              },
              (result) => toast(result.resultCode === 'OK' ? s.shareSuccess : s.shareCanceled),
            );
            if (!launched) toast(s.shareCanceled);
          },
        }),
      },
      {
        key: 'chase',
        ariaLabel: '追',
        icon: <IcEpisodes size={28} />,
        label: chasing.some((x) => x.contentId === fanItem.id) ? '在追' : '追',
        active: chasing.some((x) => x.contentId === fanItem.id),
        bind: bindTap({ kind: 'action', id: 'shortdrama.player.follow.toggle' }, {
          onTrigger: () => chaseToggle(fanItem.id),
        }),
      },
    ]
    : [];

  const fanFeed = fanItem ? (
    <div className="flex-1 relative overflow-hidden" style={{ background: C.darkBg }}>
      {/* 画面:整块进竖屏播放器全屏观看 */}
      <div className="absolute inset-x-0 top-[12%]">
        <div className="relative w-full aspect-[4/3]">
          <TvImg
            id={fanItem.still ?? fanItem.poster}
            alt={fanItem.title}
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 right-1.5 text-[9px] text-white/60">
            {/* 备案号是真机画面右下角的固定水印(证据 756) */}
            (腾讯)网微剧备字(2026)
          </span>
        </div>
      </div>

      <button
        {...bindTap('shortdrama.player.open.fromFanFeed', {
          params: { contentId: fanItem.id },
          beforeTrigger: () => openPlayback(fanItem.id, 1),
        })}
        className="absolute left-1/2 -translate-x-1/2 top-[62%] flex items-center gap-1 px-3 h-7 rounded-full border-none text-[12px] text-white"
        style={{ background: 'rgba(255,255,255,0.18)' }}
      >
        <IcFullscreen size={13} />
        全屏观看
      </button>

      <SideRail items={fanRail} className="absolute right-3 top-[58%]" />

      {/* 集号 + 看全集条(证据 756:第 001 集 + 底部「短番 全51集 免费」条) */}
      <div className="absolute inset-x-3 bottom-3">
        <div className="text-[13px] text-white pb-1.5">001</div>
        <button
          {...bindTap('shortdrama.player.open.fromFanBar', {
            params: { contentId: fanItem.id },
            beforeTrigger: () => openPlayback(fanItem.id, 1),
          })}
          className="w-full flex items-center gap-2 p-2 rounded-lg border-none text-left"
          style={{ background: C.darkEpisodeBar }}
        >
          <TvImg
            id={fanItem.poster}
            alt={fanItem.title}
            className="shrink-0 w-8 h-11 rounded object-cover"
          />
          <span className="flex-1 min-w-0">
            <span className="block text-[14px] text-white truncate">{fanItem.title}</span>
            <span className="block text-[11px] truncate" style={{ color: C.darkTextSub }}>
              {fanItem.category}
              {fanItem.episodes ? ` 全${fanItem.episodes}集` : ''} {fanItem.badge}
            </span>
          </span>
          <span
            className="shrink-0 px-3 h-7 leading-7 rounded-full text-[12px] text-white"
            style={{ background: 'rgba(255,255,255,0.18)' }}
          >
            看全集
          </span>
        </button>
      </div>
    </div>
  ) : (
    <EmptyState text="暂无短番内容" dark />
  );

  /* ---------- 短剧形态的滚动内容 ---------- */

  const dramaBody = (
    <div
      className="flex-1 overflow-y-auto"
      style={{ background: C.pageBg }}
      data-scroll-container="main"
      data-scroll-direction="vertical"
    >
      {activeTab === tabs[2] ? (
        watchedItems.length === 0 ? (
          <EmptyState text="还没有看过的短剧" sub="去精选里挑一部" />
        ) : (
          <div className="grid grid-cols-3 gap-x-2 gap-y-3 px-3 pt-3">
            {watchedItems.map((c) => (
              <div key={c.id} {...cardBind(c.id)} className="flex flex-col min-w-0 cursor-pointer">
                <div className="relative w-full aspect-[3/4] rounded-lg overflow-hidden">
                  <TvImg id={c.poster} alt={c.title} className="w-full h-full object-cover" />
                  <div
                    className="absolute inset-x-0 bottom-0 px-1 pb-0.5 pt-4 text-right text-[10px] leading-none text-white"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.65), transparent)' }}
                  >
                    {c.episodes ? `全${c.episodes}集` : ''}
                  </div>
                </div>
                <div className="mt-1.5 text-[13px] font-medium truncate" style={{ color: C.text }}>
                  {c.title}
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <>
          {activeTab === tabs[1] && (
            <>
              {kingKong}
              {recommendGrid}
            </>
          )}
          {themeFloors}
          {activeTab === tabs[1] && rankBoards}
          <div className="h-4" />
        </>
      )}
    </div>
  );

  /* ---------- 续播条(chrome.resumebar,悬浮在内容与 TabBar 之间) ---------- */

  const resumeContent = resumeBar ? byId.get(resumeBar.contentId) : undefined;
  const resumeBarNode =
    resumeBar && resumeContent && !resumeHidden && mode === modes[0] ? (
      <div
        {...bindTap('shortdrama.player.resume.fromBar', {
          params: { contentId: resumeBar.contentId },
          beforeTrigger: () =>
            openPlayback(
              resumeBar.contentId,
              resumeEpisode?.contentId === resumeBar.contentId ? resumeEpisode.episodeIndex : 1,
            ),
        })}
        className="shrink-0 mx-3 mb-1 flex items-center gap-2 p-1.5 rounded-xl shadow-lg cursor-pointer"
        style={{ background: C.pageBg, border: `1px solid ${C.divider}` }}
      >
        <TvImg
          id={resumeContent.poster}
          alt={resumeContent.title}
          className="shrink-0 w-8 h-10 rounded object-cover"
        />
        <div className="flex-1 min-w-0 text-[13px] truncate" style={{ color: C.text }}>
          {resumeBar.text}
        </div>
        {/* 「继续播放」胶囊是条内的行动指引,整条同一去向(证据 754) */}
        <span
          className="shrink-0 px-3 h-7 leading-7 rounded-full text-[12px]"
          style={{ background: C.chipGray, color: C.text }}
        >
          继续播放
        </span>
        <button
          {...bindTap({ kind: 'action', id: 'chrome.resumebar.close' }, {
            stopPropagation: true,
            onTrigger: () => setUi(UI_RESUMEBAR_HIDDEN, true),
          })}
          className="shrink-0 bg-transparent border-none p-1"
          style={{ color: C.textSub }}
          aria-label="关闭续播条"
        >
          <IcClose size={16} />
        </button>
      </div>
    ) : null;

  const fanMode = mode === modes[1];

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: fanMode ? C.darkBg : C.pageBg }}
      data-status-bar-foreground={fanMode ? 'light' : 'dark'}
    >
      <ShortdramaTypeHeader
        mode={mode}
        modes={modes}
        tabs={tabs}
        activeTab={activeTab}
        menuOpen={menuOpen}
        typeBind={typeBind}
        getModeBind={modeBind}
        getTabBind={tabBind}
        searchBind={bindTap('search.hub.open.fromShortdrama')}
        dark={fanMode}
        guideSlot={
          guideOpen && !menuOpen && sd.guideBubble ? (
            <span
              className="px-2 py-1 rounded-md text-[11px] text-white whitespace-nowrap"
              style={{ background: C.toastBg }}
            >
              {sd.guideBubble}
            </span>
          ) : undefined
        }
      />
      {fanMode ? fanFeed : dramaBody}
      {resumeBarNode}
    </div>
  );
}

/**
 * 类型切换 toast。种子只录到一个方向(switchToast:「已切换为短剧内容 返回短番」,证据 754),
 * 另一向 = 同句式把两个类型名对调(证据 756 的反向 toast 句式一致),不另造文案。
 */
function switchToastOf(seed: string, to: string, from: string, modes: readonly string[]): string {
  if (!seed || modes.length < 2) return seed;
  const [a, b] = [modes[0], modes[1]];
  return seed
    .split(a)
    .join('\u0000')
    .split(b)
    .join('\u0001')
    .split('\u0000')
    .join(to)
    .split('\u0001')
    .join(from);
}

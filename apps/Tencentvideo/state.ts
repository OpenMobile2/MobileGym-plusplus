// apps/Tencentvideo/state.ts —— Zustand store(persist `tencentvideo_v${DATA_VERSION}`)。
// 种子层 = data/defaults.json(TENCENTVIDEO_CONFIG);运行时层 = RUNTIME_DEFAULTS。
// action 命名与 spec actionId 尾段对应(对照表见各分组注释);时间一律走 TimeService,
// id/数值全部确定性构造(禁 Date.now / Math.random,IMPL_BRIEF 硬规则7)。
import * as TimeService from '@/os/TimeService';
import { createAppStoreWithActions } from '@/os/createAppStore';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { TENCENTVIDEO_CONFIG } from './data';
import type {
  TencentvideoState,
  TencentvideoActions,
  TvSet,
  TvGet,
  TvContent,
  TvDownloadTask,
  TvDanmakuMode,
} from './types';
import { currentSeasonOf, seasonEpisodeStateOf, seasonNumbersOf, seasonSubTabsOf } from './utils/seasonEpisodes';

/* ---------------- 辅助 ---------------- */

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/** 当前模拟日期 MM-DD(评论时间戳等) */
function todayMD(): string {
  const d = TimeService.getDate();
  return `${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function findContent(s: TencentvideoState, contentId: string): TvContent | undefined {
  return s.contents.find((c) => c.id === contentId);
}

function toggleInList(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

/** 下载任务确定性体积文案 */
function sizeTextOf(episode: number): string {
  return `${150 + ((episode * 37) % 200)}MB`;
}

const DANMAKU_CYCLE: TvDanmakuMode[] = ['full', 'selected', 'off'];

/** 收银台档位 → 会员时长(月),用于顺延到期日 */
const PLAN_MONTHS: Record<string, number> = {
  vip_month_cont: 1,
  vip_quarter: 3,
  vip_year: 12,
  vip_12m: 12,
  svip_upgrade2m: 2,
  svip_month_cont: 1,
  svip_quarter: 3,
};

/** 从开通说明行「开通得150V力值,199积分」里取到账数值 */
function grantsOf(desc: string): [number, number] {
  const vPower = Number(desc.match(/(\d+)V力值/)?.[1] ?? 0);
  const points = Number(desc.match(/(\d+)积分/)?.[1] ?? 0);
  return [vPower, points];
}

/** 会员续期从「当前到期日/今天」中较晚者顺延，避免续费反而缩短有效期。 */
function extendMembershipExpire(currentExpire: string, months: number): string {
  const today = TimeService.getDate();
  const todayText = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  const validExpire = /^\d{4}-\d{2}-\d{2}$/.test(currentExpire);
  const baseText = validExpire && currentExpire > todayText ? currentExpire : todayText;
  const [year, month, day] = baseText.split('-').map(Number);

  // 先落到目标月 1 日，再把日期夹到该月末，规避 1 月 31 日 + 1 月跳到 3 月。
  const result = TimeService.getDate();
  result.setFullYear(year, month - 1, 1);
  result.setMonth(result.getMonth() + months);
  const lastDay = TimeService.getDate();
  lastDay.setFullYear(result.getFullYear(), result.getMonth() + 1, 0);
  result.setDate(Math.min(day, lastDay.getDate()));
  return `${result.getFullYear()}-${pad2(result.getMonth() + 1)}-${pad2(result.getDate())}`;
}

/* ---------------- 初始状态 ---------------- */

const RUNTIME_DEFAULTS = {
  lastToast: null as string | null,
  featureNotice: null as string | null,
  loggedIn: true,
  playback: {
    contentId: null as string | null,
    episodeIndex: 1,
    season: null as number | null,
    subTab: null as string | null,
    playing: false,
    positionSec: 0,
    durationSec: 2700,
    speed: 1.0,
    qualityId: '720p',
    audioQualityId: 'standard',
    filterId: null as string | null,
    controlsVisible: true,
    locked: false,
    audioMode: false,
    pipOn: false,
    sleepTimer: null as string | null,
    screenshotBubble: false,
    sentDanmaku: [] as { text: string; atSec: number }[],
  },
  cast: { status: 'idle' as const, device: null as string | null, localBoost: false },
  search: { input: '', submitted: null as string | null },
  cashier: {
    tab: 'vip' as const,
    planId: 'vip_month_cont',
    addonIds: [] as string[],
    agreementChecked: false,
    redPacketClaimed: false,
    redPacketDismissed: false,
    paySuccess: false,
    pendingOrder: null as { orderId: string; planId: string; amount: number } | null,
    retainOpen: false,
    compareOpen: false,
    compareIndex: 0,
  },
  likedContentIds: [] as string[],
  likedCommentIds: [] as string[],
  likedDiscussionIds: [] as string[],
  discussReactions: {} as TencentvideoState['discussReactions'],
  followedAuthors: [] as string[],
  recommendedIds: [] as string[],
  wantIds: [] as string[],
  findfilm: { index: 0, previewOn: false },
  dismissedFeedIds: [] as string[],
  shuffleSeeds: {} as Record<string, number>,
  danmakuBlockWords: [] as string[],
  downloadReserved: [] as string[],
  downloadPausedAll: false,
  downloadVipToastShown: false,
  resume: null as TencentvideoState['resume'],
  selectedPushTags: [] as string[],
  ui: {} as Record<string, string | number | boolean>,
};

const initialState: TencentvideoState = {
  ...(JSON.parse(JSON.stringify(TENCENTVIDEO_CONFIG)) as typeof TENCENTVIDEO_CONFIG),
  ...RUNTIME_DEFAULTS,
};

/* ---------------- Actions ---------------- */

function createActions(set: TvSet, get: TvGet): TencentvideoActions {
  return {
    /* ==== 通用 ==== */
    toast: (msg) => {
      // 占位能力必须停留到用户明确确认，不能再用一闪而过的 toast 冒充完成。
      if (msg && (msg === get().wontfixToast || msg === 'Not available yet')) {
        set(() => ({ featureNotice: msg, lastToast: null }));
        return;
      }
      set(() => ({ lastToast: msg }));
    },
    dismissFeatureNotice: () => set(() => ({ featureNotice: null })),
    // 通用离散 UI 态(chip/tab/sort/编辑态等 spec 定为 action 的开关)
    setUi: (key, value) => set((s) => ({ ui: { ...s.ui, [key]: value } })),
    toggleUi: (key) => set((s) => ({ ui: { ...s.ui, [key]: !s.ui[key] } })),

    /* ==== 账号:auth.login.mock / auth.logout.mock / auth.switch.mock ==== */
    loginMock: () => set(() => ({ loggedIn: true, lastToast: '登录成功' })),
    logoutMock: () => set(() => ({ loggedIn: false, lastToast: '已退出登录' })),
    switchAccountMock: () => set(() => ({ lastToast: '已是当前账号' })),

    /* ==== 内容互动 ====
     * chaseToggle      ← *.follow.toggle(home.feed/channel.lite/haopian/detail.follow/
     *                     shortdrama.player.follow.toggle/home.shortvideo.follow.toggle/
     *                     me.history.guess.follow)
     * reserveToggle    ← home.channel.full.reserve.toggle
     * likeToggle       ← home.shortvideo.like.toggle / shortdrama.player.like.toggle /
     *                     detail.ugc.like.toggle
     * followAuthorToggle ← *.follow.author;starFollowToggle ← star.follow.toggle
     * recommendToggle  ← detail.recommend.toggle
     * dismissFeedCard  ← home.feed.card.dismiss
     * shuffleRefresh   ← *.shuffle.refresh
     */
    chaseToggle: (contentId) => {
      const s = get();
      const exists = s.chasing.some((c) => c.contentId === contentId);
      if (exists) {
        set((st) => ({
          chasing: st.chasing.filter((c) => c.contentId !== contentId),
          lastToast: '已取消加追',
        }));
        return;
      }
      const content = findContent(s, contentId);
      const updatedTo = content?.updatedTo ?? content?.episodes;
      set((st) => ({
        chasing: [
          {
            contentId,
            updateBadge: updatedTo ? `更新至${updatedTo}集` : '',
            progressText: '尚未观看',
          },
          ...st.chasing,
        ],
        lastToast: st.chaseToast,
      }));
    },

    reserveToggle: (contentId) => {
      const s = get();
      const exists = s.reservations.some((r) => r.contentId === contentId);
      if (exists) {
        set((st) => ({
          reservations: st.reservations.filter((r) => r.contentId !== contentId),
          lastToast: '已取消预约',
        }));
      } else {
        set((st) => ({
          reservations: [
            { contentId, note: '已预约', status: 'waiting' as const },
            ...st.reservations,
          ],
          lastToast: '预约成功,上线后第一时间提醒你',
        }));
      }
    },

    likeToggle: (contentId) =>
      set((s) => ({ likedContentIds: toggleInList(s.likedContentIds, contentId) })),

    followAuthorToggle: (author) => {
      const adding = !get().followedAuthors.includes(author);
      set((s) => ({
        followedAuthors: toggleInList(s.followedAuthors, author),
        lastToast: adding ? '关注成功' : s.lastToast,
      }));
    },

    starFollowToggle: () => {
      const s = get();
      const following = !s.actor.followed;
      set((st) => ({
        actor: {
          ...st.actor,
          followed: following,
          fans: st.actor.fans + (following ? 1 : -1),
        },
        lastToast: following ? st.actor.followToast : st.lastToast,
      }));
    },

    recommendToggle: (contentId) =>
      set((s) => ({ recommendedIds: toggleInList(s.recommendedIds, contentId) })),

    dismissFeedCard: (contentId) =>
      set((s) => ({ dismissedFeedIds: [...s.dismissedFeedIds, contentId] })),

    shuffleRefresh: (sectionKey) =>
      set((s) => ({
        shuffleSeeds: { ...s.shuffleSeeds, [sectionKey]: (s.shuffleSeeds[sectionKey] ?? 0) + 1 },
      })),

    /* ==== 以片找片:findfilm.dislike.next / findfilm.want.mark / findfilm.preview.toggle ==== */
    findfilmNext: () =>
      set((s) => ({
        findfilm: { index: (s.findfilm.index + 1) % s.pickFilm.queue.length, previewOn: false },
        ui: {
          ...s.ui,
          'findfilm.operations': Number(s.ui['findfilm.operations'] ?? 0) + 1,
          'findfilm.dislikes': Number(s.ui['findfilm.dislikes'] ?? 0) + 1,
        },
      })),
    findfilmWantMark: () => {
      const s = get();
      const cur = s.pickFilm.queue[s.findfilm.index];
      set((st) => ({
        wantIds: st.wantIds.includes(cur) ? st.wantIds : [...st.wantIds, cur],
        findfilm: { index: (st.findfilm.index + 1) % st.pickFilm.queue.length, previewOn: false },
        ui: {
          ...st.ui,
          'findfilm.operations': Number(st.ui['findfilm.operations'] ?? 0) + 1,
          'findfilm.wants': Number(st.ui['findfilm.wants'] ?? 0) + 1,
        },
        lastToast: '已加入想看',
      }));
    },
    findfilmPreviewToggle: () =>
      set((s) => ({ findfilm: { ...s.findfilm, previewOn: !s.findfilm.previewOn } })),

    /* ==== 列表编辑删除:me.history.edit.toggle(删除)/ me.favorites / me.follows ==== */
    removeHistoryEntries: (ids) =>
      set((s) => ({
        watchHistory: s.watchHistory.filter((h) => !ids.includes(h.id)),
        lastToast: '删除成功',
      })),
    removeFavorites: (contentIds) =>
      set((s) => ({
        favorites: s.favorites.filter((f) => !contentIds.includes(f.contentId)),
        lastToast: '删除成功',
      })),
    removeChasing: (contentIds) =>
      set((s) => ({
        chasing: s.chasing.filter((c) => !contentIds.includes(c.contentId)),
        lastToast: '删除成功',
      })),

    /* ==== 搜索:search.hub.input.clear / search.hub.history.clear / 提交 ==== */
    setSearchInput: (value) => set((s) => ({ search: { ...s.search, input: value } })),
    submitSearch: (keyword) => {
      const kw = keyword.trim();
      if (!kw) return;
      set((s) => ({
        search: { input: kw, submitted: kw },
        searchHub: {
          ...s.searchHub,
          history: [kw, ...s.searchHub.history.filter((h) => h !== kw)].slice(0, 10),
        },
      }));
    },
    clearSearchInput: () => set((s) => ({ search: { ...s.search, input: '', submitted: null } })),
    clearSearchHistory: () => set((s) => ({ searchHub: { ...s.searchHub, history: [] } })),

    /* ==== 播放器 ====
     * openPlayback   ← 详情/历史/续播条进入播放
     * playToggle     ← player.portrait.play.toggle / player.fullscreen.play.toggle /
     *                   shortdrama.player.play.toggle / cast.control.play.toggle /
     *                   detail.special.play.start
     * tickPlayback   ← TimeService 定时推进(hooks/usePlaybackTicker)
     * seekPlayback   ← *.progress.seek / cast.control.progress.seek
     * selectEpisode  ← *.episode.select / *.episodeVip.select / *.episodeCard.select /
     *                   detail.sports.highlight.select
     * nextEpisode    ← player.fullscreen.episode.next / cast.control.episode.next
     */
    openPlayback: (contentId, episodeIndex = 1, durationSec, requestedSeason, requestedSubTab) => {
      const s = get();
      const content = findContent(s, contentId);
      const isShortDrama = contentId.startsWith('sd_');
      const dur = durationSec ?? (isShortDrama || contentId.startsWith('sv_') ? 180 : 2700);
      const seasons = seasonNumbersOf(content);
      const defaultSeason = currentSeasonOf(content, seasons);
      const uiSeason = Number(s.ui[`playback.season.${contentId}`] ?? defaultSeason);
      const season = seasons.includes(requestedSeason ?? uiSeason) ? (requestedSeason ?? uiSeason) : null;
      const subTabs = seasonSubTabsOf(content, season ?? 0);
      const uiSubTab = String(s.ui[`playback.subTab.${contentId}`] ?? subTabs[0] ?? '');
      const candidateSubTab = requestedSubTab ?? uiSubTab;
      const subTab = season !== null && subTabs.includes(candidateSubTab) ? candidateSubTab : null;
      const availableEpisodes = season !== null
        ? seasonEpisodeStateOf(content, season, subTab ?? '').available
        : Math.max(1, content?.updatedTo ?? content?.episodes ?? 1);
      const safeEpisodeIndex = Math.max(1, Math.min(episodeIndex, availableEpisodes));
      const epLabel = season !== null
        ? `第${season}季·${subTab ?? '正片'}·第${safeEpisodeIndex}期`
        : content?.episodes && content.episodes > 1 ? `第${safeEpisodeIndex}集` : '';
      set((st) => ({
        playback: {
          ...st.playback,
          contentId,
          episodeIndex: safeEpisodeIndex,
          season,
          subTab,
          playing: true,
          positionSec: 0,
          durationSec: dur,
          controlsVisible: true,
          locked: false,
          audioMode: false,
          pipOn: false,
          screenshotBubble: false,
        },
        resume: isShortDrama ? { contentId, episodeIndex: safeEpisodeIndex } : st.resume,
        watchHistory: [
          {
            id: `h_${contentId}`,
            contentId,
            episode: epLabel,
            season: season ?? undefined,
            subTab: subTab ?? undefined,
            progressPct: 0,
            device: '手机',
            date: '今天',
            group: '今天',
          },
          ...st.watchHistory.filter((h) => h.contentId !== contentId),
        ],
        ui: {
          ...st.ui,
          ...(season !== null ? { [`playback.season.${contentId}`]: season } : {}),
          ...(subTab !== null ? { [`playback.subTab.${contentId}`]: subTab } : {}),
        },
      }));
    },

    playToggle: () =>
      set((s) => ({ playback: { ...s.playback, playing: !s.playback.playing } })),

    tickPlayback: (deltaSec) => {
      const s = get();
      const p = s.playback;
      if (!p.playing || p.contentId === null) return;
      const next = Math.min(p.positionSec + deltaSec * p.speed, p.durationSec);
      const ended = next >= p.durationSec;
      const content = findContent(s, p.contentId);
      const total = p.season !== null
        ? seasonEpisodeStateOf(content, p.season, p.subTab ?? '').available
        : content?.episodes ?? 1;
      if (ended && s.settings.play.autoPlayNext && p.episodeIndex < total) {
        // 自动连播下一集
        const episodeIndex = p.episodeIndex + 1;
        const episodeLabel = p.season !== null
          ? `第${p.season}季·${p.subTab ?? '正片'}·第${episodeIndex}期`
          : `第${episodeIndex}集`;
        set((st) => ({
          playback: {
            ...st.playback,
            episodeIndex,
            positionSec: 0,
          },
          watchHistory: st.watchHistory.map((h) =>
            h.contentId === p.contentId ? { ...h, episode: episodeLabel, progressPct: 0 } : h,
          ),
        }));
        return;
      }
      set((st) => ({
        playback: { ...st.playback, positionSec: next, playing: ended ? false : st.playback.playing },
        watchHistory: st.watchHistory.map((h) =>
          h.contentId === p.contentId
            ? { ...h, progressPct: p.durationSec > 0 ? Math.round((next / p.durationSec) * 100) : 0 }
            : h,
        ),
      }));
    },

    seekPlayback: (positionSec) =>
      set((s) => {
        const next = Math.max(0, Math.min(positionSec, s.playback.durationSec));
        return {
          playback: { ...s.playback, positionSec: next },
          watchHistory: s.watchHistory.map((h) =>
            h.contentId === s.playback.contentId
              ? {
                  ...h,
                  progressPct:
                    s.playback.durationSec > 0
                      ? Math.round((next / s.playback.durationSec) * 100)
                      : 0,
                }
              : h,
          ),
        };
      }),

    selectEpisode: (episodeIndex) => {
      const s = get();
      const cid = s.playback.contentId;
      const content = cid === null ? undefined : findContent(s, cid);
      const seasons = seasonNumbersOf(content);
      const uiSeason = cid === null ? 0 : Number(s.ui[`playback.season.${cid}`] ?? s.playback.season ?? 0);
      const season = seasons.includes(uiSeason) ? uiSeason : null;
      const subTabs = seasonSubTabsOf(content, season ?? 0);
      const uiSubTab = cid === null ? '' : String(s.ui[`playback.subTab.${cid}`] ?? s.playback.subTab ?? '');
      const subTab = season !== null && subTabs.includes(uiSubTab) ? uiSubTab : null;
      const availableEpisodes = season !== null
        ? seasonEpisodeStateOf(content, season, subTab ?? '').available
        : Math.max(1, content?.updatedTo ?? content?.episodes ?? 1);
      const safeEpisodeIndex = Math.max(1, Math.min(episodeIndex, availableEpisodes));
      const episodeLabel = season !== null
        ? `第${season}季·${subTab ?? '正片'}·第${safeEpisodeIndex}期`
        : `第${safeEpisodeIndex}集`;
      set((st) => ({
        playback: { ...st.playback, episodeIndex: safeEpisodeIndex, season, subTab, positionSec: 0, playing: true },
        resume:
          cid !== null && cid.startsWith('sd_')
            ? { contentId: cid, episodeIndex: safeEpisodeIndex }
            : st.resume,
        watchHistory:
          cid === null
            ? st.watchHistory
            : st.watchHistory.map((h) =>
                h.contentId === cid
                  ? {
                      ...h,
                      episode: episodeLabel,
                      season: season ?? undefined,
                      subTab: subTab ?? undefined,
                      progressPct: 0,
                    }
                  : h,
              ),
      }));
    },

    nextEpisode: () => {
      const s = get();
      const cid = s.playback.contentId;
      if (cid === null) return;
      const content = findContent(s, cid);
      const total = s.playback.season !== null
        ? seasonEpisodeStateOf(content, s.playback.season, s.playback.subTab ?? '').available
        : content?.episodes ?? 1;
      const next = Math.min(s.playback.episodeIndex + 1, total);
      if (next === s.playback.episodeIndex) {
        set(() => ({ lastToast: '已经是最后一集啦' }));
        return;
      }
      set((st) => {
        const episodeLabel = st.playback.season !== null
          ? `第${st.playback.season}季·${st.playback.subTab ?? '正片'}·第${next}期`
          : `第${next}集`;
        return {
          playback: { ...st.playback, episodeIndex: next, positionSec: 0, playing: true },
          resume: cid.startsWith('sd_') ? { contentId: cid, episodeIndex: next } : st.resume,
          watchHistory: st.watchHistory.map((h) =>
            h.contentId === cid ? { ...h, episode: episodeLabel, progressPct: 0 } : h,
          ),
          lastToast: episodeLabel,
        };
      });
    },

    /* ==== 倍速 / 清晰度 / 音质 / 滤镜(player.sheets.*) ==== */
    setSpeed: (speed, withToast = true) =>
      set((s) => ({
        playback: { ...s.playback, speed },
        lastToast: withToast ? `已切换至${speed}X倍速播放` : s.lastToast,
      })),
    setLongPressSpeed: (speed) =>
      set((s) => ({ player: { ...s.player, longPressSpeed: speed } })),
    toggleLongPressLockSpeed: () =>
      set((s) => ({ player: { ...s.player, longPressLockSpeed: !s.player.longPressLockSpeed } })),
    toggleLeftLongPressRewind: () =>
      set((s) => ({ player: { ...s.player, leftLongPressRewind: !s.player.leftLongPressRewind } })),
    selectQuality: (qualityId) => {
      const q = get().player.qualities.find((x) => x.id === qualityId);
      set((s) => ({
        playback: { ...s.playback, qualityId },
        lastToast: q ? `已切换至${q.label}` : s.lastToast,
      }));
    },
    selectAudioQuality: (audioQualityId) =>
      set((s) => ({ playback: { ...s.playback, audioQualityId } })),
    selectPlayerFilter: (filterId) =>
      set((s) => ({ playback: { ...s.playback, filterId } })),

    /* ==== 弹幕:player.danmaku.mode.cycle / player.danmaku.mode.set /
     *      player.sheets.danmaku.*(slider.adjust/switch.toggle/blockword.add)/
     *      player.fullscreen.danmaku.send ==== */
    danmakuModeCycle: () => {
      const cur = get().player.danmaku.mode;
      const next = DANMAKU_CYCLE[(DANMAKU_CYCLE.indexOf(cur) + 1) % DANMAKU_CYCLE.length];
      set((s) => ({
        player: { ...s.player, danmaku: { ...s.player.danmaku, mode: next } },
        lastToast:
          next === 'selected'
            ? '进入弹幕精选模式,再次点击可关闭'
            : next === 'off'
              ? '已关闭弹幕'
              : '已开启完整弹幕',
      }));
    },
    setDanmakuMode: (mode) =>
      set((s) => ({
        player: { ...s.player, danmaku: { ...s.player.danmaku, mode } },
        lastToast: mode === 'selected' ? s.player.danmakuModeToast : s.lastToast,
      })),
    setDanmakuSetting: (key, value) =>
      set((s) => ({
        player: { ...s.player, danmaku: { ...s.player.danmaku, [key]: value } },
      })),
    addDanmakuBlockword: (word) => {
      const w = word.trim();
      const s = get();
      if (!w || s.danmakuBlockWords.includes(w)) return;
      if (s.danmakuBlockWords.length >= s.player.danmaku.blockWordsMax) {
        set(() => ({ lastToast: '屏蔽词已达上限' }));
        return;
      }
      set((st) => ({
        danmakuBlockWords: [...st.danmakuBlockWords, w],
        player: {
          ...st.player,
          danmaku: { ...st.player.danmaku, blockWordsCount: st.danmakuBlockWords.length + 1 },
        },
      }));
    },
    removeDanmakuBlockword: (word) =>
      set((s) => ({
        danmakuBlockWords: s.danmakuBlockWords.filter((w) => w !== word),
        player: {
          ...s.player,
          danmaku: {
            ...s.player.danmaku,
            blockWordsCount: Math.max(0, s.danmakuBlockWords.length - 1),
          },
        },
      })),
    sendDanmaku: (text) => {
      const t = text.trim();
      if (!t) return;
      set((s) => ({
        playback: {
          ...s.playback,
          sentDanmaku: [...s.playback.sentDanmaku, { text: t, atSec: s.playback.positionSec }],
        },
      }));
    },

    /* ==== 播放器控件:controls.toggle / lock.toggle / audioMode.enter|exit /
     *      pip.open / timer.set / screenshot.take ==== */
    controlsToggle: () =>
      set((s) => ({ playback: { ...s.playback, controlsVisible: !s.playback.controlsVisible } })),
    lockToggle: () => {
      const locking = !get().playback.locked;
      set((s) => ({
        playback: { ...s.playback, locked: locking, controlsVisible: !locking },
        lastToast: locking ? s.player.lockToast : '已解锁',
      }));
    },
    audioModeEnter: () => set((s) => ({ playback: { ...s.playback, audioMode: true } })),
    audioModeExit: () => set((s) => ({ playback: { ...s.playback, audioMode: false } })),
    pipOpen: () => set((s) => ({ playback: { ...s.playback, pipOn: true } })),
    pipClose: () => set((s) => ({ playback: { ...s.playback, pipOn: false } })),
    setSleepTimer: (label) =>
      set((s) => ({
        playback: { ...s.playback, sleepTimer: label },
        lastToast: label && label !== '不开启' ? `定时关闭:${label}` : '已关闭定时',
      })),
    screenshotTake: () =>
      set((s) => ({ playback: { ...s.playback, screenshotBubble: true } })),
    screenshotDismiss: () =>
      set((s) => ({ playback: { ...s.playback, screenshotBubble: false } })),

    /* ==== 投屏:cast.search.refresh / cast.search.localboost.toggle /
     *      cast.control.device.switch / cast.control.seek.step15 ==== */
    castSearchStart: () =>
      set((s) => ({ cast: { ...s.cast, status: 'searching' as const } })),
    castConnect: (device) =>
      set((s) => ({ cast: { ...s.cast, status: 'connected' as const, device } })),
    castDisconnect: () =>
      set((s) => ({ cast: { ...s.cast, status: 'idle' as const, device: null } })),
    castDeviceSwitch: (device) =>
      set((s) => ({ cast: { ...s.cast, device }, lastToast: `已切换至${device}` })),
    castLocalBoostToggle: () =>
      set((s) => ({ cast: { ...s.cast, localBoost: !s.cast.localBoost } })),
    castSeekStep: (deltaSec) =>
      set((s) => ({
        playback: {
          ...s.playback,
          positionSec: Math.max(
            0,
            Math.min(s.playback.positionSec + deltaSec, s.playback.durationSec),
          ),
        },
      })),

    /* ==== 下载 ====
     * setDownloadQuality    ← download.select.quality.select / settings.download.quality.pick
     * setDownloadConcurrency← download.running.concurrency.set / settings.download.parallel.pick
     * addDownload           ← download.select.episode.add;addAllDownloads ← download.select.all.add
     * reserveDownloadEpisode← download.select.episode.reserve
     * toggleDownloadTask    ← download.running.task.toggle
     * toggleDownloadPauseAll← download.running.pauseAll.toggle
     * deleteDownloads       ← download.{mine,running,series}.edit.delete
     * tickDownloads         ← download.running.task.autoprogress(hooks/useDownloadTicker)
     * dislikeDownloadRec    ← download.mine.rec.dislike
     */
    setDownloadQuality: (label) =>
      set((s) => ({ settings: { ...s.settings, download: { ...s.settings.download, quality: label } } })),
    setDownloadConcurrency: (n) =>
      set((s) => ({
        settings: { ...s.settings, download: { ...s.settings.download, concurrent: n } },
      })),

    addDownload: (contentId, episode, label) => {
      const s = get();
      const id = `${contentId}#${episode}`;
      if (s.downloads.items.some((t) => t.id === id)) return;
      const content = findContent(s, contentId);
      const activeCount = s.downloads.items.filter((t) => t.status === 'downloading').length;
      const status: TvDownloadTask['status'] =
        !s.downloadPausedAll && activeCount < s.settings.download.concurrent
          ? 'downloading'
          : 'queued';
      const isVipEp =
        content?.vipFrom !== undefined && episode >= content.vipFrom && !s.downloadVipToastShown;
      const task: TvDownloadTask = {
        id,
        contentId,
        episode,
        label: label ?? (content?.episodes && content.episodes > 1 ? `第${episode}集` : content?.title ?? ''),
        qualityLabel: s.settings.download.quality,
        sizeText: sizeTextOf(episode),
        progressPct: 0,
        status,
      };
      set((st) => ({
        downloads: { ...st.downloads, items: [...st.downloads.items, task] },
        downloadVipToastShown: st.downloadVipToastShown || isVipEp,
        lastToast: isVipEp ? st.downloads.vipToast : st.lastToast,
      }));
    },

    addAllDownloads: (contentId, episodes) => {
      const actions = get();
      episodes.forEach((ep) => actions.addDownload(contentId, ep));
    },

    reserveDownloadEpisode: (contentId, episode) => {
      const key = `${contentId}#${episode}`;
      set((s) => ({
        downloadReserved: s.downloadReserved.includes(key)
          ? s.downloadReserved
          : [...s.downloadReserved, key],
        lastToast: '已预约,更新后将在Wi-Fi下自动下载',
      }));
    },

    toggleDownloadTask: (taskId) =>
      set((s) => ({
        downloads: {
          ...s.downloads,
          items: s.downloads.items.map((t) =>
            t.id === taskId
              ? { ...t, status: t.status === 'paused' ? 'downloading' : t.status === 'downloading' || t.status === 'queued' ? 'paused' : t.status }
              : t,
          ),
        },
      })),

    toggleDownloadPauseAll: () => {
      const pausing = !get().downloadPausedAll;
      set((s) => ({
        downloadPausedAll: pausing,
        downloads: {
          ...s.downloads,
          items: s.downloads.items.map((t) =>
            t.status === 'done'
              ? t
              : { ...t, status: pausing ? 'paused' : 'queued' },
          ),
        },
      }));
    },

    deleteDownloads: (taskIds) =>
      set((s) => ({
        downloads: {
          ...s.downloads,
          items: s.downloads.items.filter((t) => !taskIds.includes(t.id)),
        },
        lastToast: '删除成功',
      })),

    tickDownloads: () => {
      const s = get();
      if (s.downloadPausedAll) return;
      const limit = s.settings.download.concurrent;
      let active = s.downloads.items.filter((t) => t.status === 'downloading').length;
      let changed = false;
      const items = s.downloads.items.map((t) => {
        if (t.status === 'downloading') {
          changed = true;
          const next = Math.min(100, t.progressPct + 7);
          if (next >= 100) {
            active -= 1;
            return { ...t, progressPct: 100, status: 'done' as const };
          }
          return { ...t, progressPct: next };
        }
        if (t.status === 'queued' && active < limit) {
          active += 1;
          changed = true;
          return { ...t, status: 'downloading' as const };
        }
        return t;
      });
      if (changed) set((st) => ({ downloads: { ...st.downloads, items } }));
    },

    dislikeDownloadRec: (contentId) =>
      set((s) => ({
        downloads: {
          ...s.downloads,
          recommendations: s.downloads.recommendations.filter((id) => id !== contentId),
        },
        lastToast: '将为你减少类似推荐',
      })),

    /* ==== 评论 / 讨论 ====
     * commentLikeToggle ← detail.comments.like.toggle
     * postComment       ← detail.comments.post.submit / shortdrama.player.comment.post
     * discussLikeTap    ← detail.discuss.like.tap
     * discussEmojiReact ← detail.discuss.emoji.react(五档表情)
     */
    commentLikeToggle: (commentId) =>
      set((s) => ({ likedCommentIds: toggleInList(s.likedCommentIds, commentId) })),

    postComment: (threadKey, text) => {
      const t = text.trim();
      if (!t) return;
      const s = get();
      const baseKey = threadKey.includes('#') ? threadKey.split('#')[0] : threadKey;
      // 首次在某集发评时克隆该剧的种子评论，而不是用新评论覆盖整个评论区。
      const existingThread = s.comments[threadKey];
      const sourceThread = existingThread ?? s.comments[baseKey] ?? { total: 0, items: [] };
      // 克隆出的评论使用单集独立 id，避免不同季/集之间串联点赞状态。
      const thread = existingThread
        ? existingThread
        : {
            ...sourceThread,
            items: sourceThread.items.map((comment) => ({
              ...comment,
              id: `${threadKey}:${comment.id}`,
              replies: comment.replies.map((reply) => ({
                ...reply,
                id: `${threadKey}:${reply.id}`,
              })),
            })),
          };
      const item = {
        id: `c_${threadKey}_u${thread.items.length + 1}`,
        author: s.user.nickname,
        avatar: s.user.avatar,
        badges: [s.user.vipLevelLabel],
        region: '上海',
        date: todayMD(),
        likes: 0,
        content: t,
        replies: [],
      };
      set((st) => ({
        comments: {
          ...st.comments,
          [threadKey]: { total: thread.total + 1, items: [item, ...thread.items] },
        },
      }));
    },

    discussLikeTap: (discussionId) => {
      if (get().likedDiscussionIds.includes(discussionId)) return;
      set((s) => ({ likedDiscussionIds: [...s.likedDiscussionIds, discussionId] }));
    },

    discussEmojiReact: (discussionId, emoji) => {
      const s = get();
      const prev = s.discussReactions[discussionId];
      if (prev === emoji) return;
      set((st) => ({
        discussions: st.discussions.map((d) => {
          if (d.id !== discussionId) return d;
          const reactions = { ...d.reactions, [emoji]: d.reactions[emoji] + 1 };
          if (prev) reactions[prev] = Math.max(0, reactions[prev] - 1);
          return { ...d, reactions };
        }),
        discussReactions: { ...st.discussReactions, [discussionId]: emoji },
      }));
    },

    /* ==== 金币:coin.signin.daily / coin.signin.remind.toggle ==== */
    coinSigninDaily: () => {
      const s = get();
      const idx = s.coins.signDays.findIndex((d) => !d.signed);
      if (idx < 0) {
        set(() => ({ lastToast: '本周已全部签到' }));
        return;
      }
      const gained = s.coins.signDays[idx].coins;
      set((st) => ({
        coins: {
          ...st.coins,
          balance: st.coins.balance + gained,
          signDays: st.coins.signDays.map((d, i) => (i === idx ? { ...d, signed: true } : d)),
        },
        user: { ...st.user, coins: st.user.coins + gained },
        lastToast: `签到成功,金币+${gained}`,
      }));
    },
    coinSigninRemindToggle: () =>
      set((s) => ({ coins: { ...s.coins, remindOn: !s.coins.remindOn } })),

    /* ==== 消息:msg.entry.open / msg.session.{system,vip,remind}.open(红点消除) ==== */
    openMsgEntry: (entryId) =>
      set((s) => ({
        messages: {
          ...s.messages,
          entries: s.messages.entries.map((e) => (e.id === entryId ? { ...e, unread: 0 } : e)),
        },
      })),
    openMsgConversation: (convId) =>
      set((s) => ({
        messages: {
          ...s.messages,
          conversations: s.messages.conversations.map((c) =>
            c.id === convId ? { ...c, unread: 0 } : c,
          ),
        },
      })),

    /* ==== 收银台:vip.cashier.* ==== */
    cashierSetTab: (tab) => {
      const s = get();
      // 切 VIP/SVIP 时连带把选中档位复位到该 tab 首档。
      const plans = tab === 'svip' ? s.membership.svipPlans : s.membership.vipPlans;
      set((st) => ({
        cashier: { ...st.cashier, tab, planId: plans[0]?.id ?? st.cashier.planId },
      }));
    },
    // 换档位时清空「顺手带一件」勾选:附加项列表本身随档位换了一套
    cashierSelectPlan: (planId) =>
      set((s) => ({ cashier: { ...s.cashier, planId, addonIds: [] } })),
    cashierAddonToggle: (addonId) =>
      set((s) => ({ cashier: { ...s.cashier, addonIds: toggleInList(s.cashier.addonIds, addonId) } })),
    cashierAgreementToggle: () =>
      set((s) => ({ cashier: { ...s.cashier, agreementChecked: !s.cashier.agreementChecked } })),
    cashierRedpacketClaim: () =>
      set((s) => ({
        cashier: { ...s.cashier, redPacketClaimed: true, redPacketDismissed: true },
        lastToast: `已领取${s.membership.redPacket.amount}元红包`,
      })),
    cashierRedpacketClose: () =>
      set((s) => ({ cashier: { ...s.cashier, redPacketDismissed: true } })),
    cashierRetainOpen: () => set((s) => ({ cashier: { ...s.cashier, retainOpen: true } })),
    cashierRetainStay: () => set((s) => ({ cashier: { ...s.cashier, retainOpen: false } })),
    cashierCompareToggle: (open) =>
      set((s) => ({ cashier: { ...s.cashier, compareOpen: open } })),
    cashierCompareSwipe: () =>
      set((s) => ({
        cashier: {
          ...s.cashier,
          compareIndex: (s.cashier.compareIndex + 1) % s.membership.compareMoreCards.length,
        },
      })),
    cashierPaymentBegin: (orderId, planId, amount) =>
      set((s) => ({
        cashier: { ...s.cashier, pendingOrder: { orderId, planId, amount } },
      })),
    cashierPaymentCancel: () =>
      set((s) => ({ cashier: { ...s.cashier, pendingOrder: null } })),
    cashierPayMock: () => {
      const s = get();
      if (!s.cashier.agreementChecked) {
        set((st) => ({ lastToast: st.membership.agreement.uncheckedToast }));
        return;
      }
      // 无待支付单说明已经入账（支付回调与 PAY_RESULT 广播可能各到一次），禁止重复续期。
      const pending = s.cashier.pendingOrder;
      if (!pending) return;
      const planId = pending.planId;
      const plan =
        s.membership.svipPlans.find((p) => p.id === planId) ??
        s.membership.vipPlans.find((p) => p.id === planId);
      const isSvip = s.membership.svipPlans.some((p) => p.id === planId);
      // 到期日按「现有到期日/今天」中较晚者顺延(TimeService,禁 new Date)。
      // user 与 membership 的双份展示字段必须同批提交，所有会员入口才会即时一致。
      const months = PLAN_MONTHS[planId] ?? 1;
      // 开通说明行承诺的 V力值/积分要真到账,否则会员专区里的数字对不上
      const [gainedVPower, gainedPoints] = grantsOf(plan?.desc ?? '');
      set((st) => {
        const currentExpire =
          st.user.vipExpire > st.membership.expire ? st.user.vipExpire : st.membership.expire;
        const expire = extendMembershipExpire(currentExpire, months);
        // 已是 SVIP 时购买普通 VIP 只续期、不降级；否则按所购套餐切换会员类型。
        const membership = isSvip || st.user.membership === 'svip' ? 'svip' as const : 'vip' as const;
        const points = st.user.points + gainedPoints;
        const vPower = st.user.vPower + gainedVPower;
        const levels = st.membership.vPower.levels;
        const currentLevelIndex = levels.reduce(
          (found, item, index) => (vPower >= item.threshold ? index : found),
          0,
        );
        const currentLevel = levels[currentLevelIndex] ?? levels[0];
        const nextLevel = levels[currentLevelIndex + 1];
        const vipLevel = Number(currentLevel?.level.replace(/\D/g, '')) || 1;
        const levelLabel = `${membership === 'svip' ? 'SVIP' : 'VIP'}${vipLevel}`;
        const currentCard = {
          ...st.membership.levelUpCard.current,
          level: currentLevel.level,
          label: `当前${currentLevel.level}权益`,
          items: 19 + currentLevelIndex * 2,
          value: 186 + currentLevelIndex * 32,
          tagline: currentLevel.perk,
        };
        const nextCard = nextLevel
          ? {
              ...st.membership.levelUpCard.next,
              level: nextLevel.level,
              label: `${nextLevel.level}更多权益`,
              items: currentCard.items + 2,
              value: currentCard.value + 32,
              tagline: nextLevel.perk,
            }
          : { ...currentCard, label: `${currentLevel.level}最高等级权益` };

        return {
          cashier: { ...st.cashier, paySuccess: true, pendingOrder: null },
          user: {
            ...st.user,
            membership,
            vipLevel,
            vipLevelLabel: levelLabel,
            vipExpire: expire,
            vPower,
            points,
          },
          membership: {
            ...st.membership,
            status: membership,
            levelLabel,
            expire,
            vPower: {
              ...st.membership.vPower,
              value: vPower,
              current: currentLevel.level,
              next: nextLevel?.level ?? currentLevel.level,
              nextNeed: nextLevel?.threshold ?? currentLevel.threshold,
            },
            levelUpCard: {
              ...st.membership.levelUpCard,
              current: currentCard,
              next: nextCard,
              gapNote: nextLevel
                ? `距离升级${nextLevel.level}还差${Math.max(0, nextLevel.threshold - vPower)}V力值`
                : '已达到最高会员等级',
            },
            pointsMall: {
              ...st.membership.pointsMall,
              points,
            },
          },
          messages: {
            ...st.messages,
            conversations: st.messages.conversations.map((conversation) => {
              if (conversation.id !== 'conv_vip') return conversation;
              const tier = membership === 'svip' ? 'SVIP' : 'VIP';
              return {
                ...conversation,
                name: `视频${tier}会员`,
                lastText: `你的${tier}将于${expire}到期`,
                messages: conversation.messages.map((message) =>
                  message.id === 'm_vip_1'
                    ? {
                        ...message,
                        title: '会员状态更新',
                        text: `你的${tier}已同步生效，有效期至${expire}。`,
                        time: '刚刚',
                      }
                    : message,
                ),
              };
            }),
          },
        };
      });
    },
    cashierPaySuccessClose: () =>
      set((s) => ({ cashier: { ...s.cashier, paySuccess: false } })),

    /* ==== 设置:settings.*(appearance/privacy/notifications/download/play)/
     *      settings.push.tag.toggle / settings.storage.clean ==== */
    setSetting: (group, key, value) =>
      set((s) => ({
        settings: { ...s.settings, [group]: { ...s.settings[group], [key]: value } },
      })),
    toggleSetting: (group, key) =>
      set((s) => {
        const cur = (s.settings[group] as Record<string, unknown>)[key];
        return {
          settings: { ...s.settings, [group]: { ...s.settings[group], [key]: !cur } },
        };
      }),
    togglePushTag: (tag) =>
      set((s) => ({ selectedPushTags: toggleInList(s.selectedPushTags, tag) })),
    storageClean: () =>
      set((s) => ({
        settings: {
          ...s.settings,
          storage: { ...s.settings.storage, cacheSize: '0B' },
        },
        lastToast: '清理完成',
      })),
  };
}

export const useTencentvideoStore = createAppStoreWithActions<TencentvideoState, TencentvideoActions>(
  manifest.id,
  initialState,
  (set, get) => createActions(set as TvSet, get as TvGet),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const result: Record<string, unknown> = {};
      const volatileKeys = new Set([
        'lastToast',
        'featureNotice',
        'playback',
        'cast',
        'search',
        'cashier',
        'findfilm',
        'shuffleSeeds',
        'downloadPausedAll',
        'downloadVipToastShown',
        'ui',
      ]);
      for (const [k, v] of Object.entries(state)) {
        if (typeof v !== 'function' && !volatileKeys.has(k)) result[k] = v;
      }
      return result as Partial<TencentvideoState>;
    },
  },
);

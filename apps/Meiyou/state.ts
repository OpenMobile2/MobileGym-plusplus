import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { MEIYOU_CONFIG } from './data';
import type {
  MeiyouState, MeiyouActions, Post, Comment, InteractNotice, AiMessage, DayRecord,
} from './types';
import { fmtDate, addDays } from './utils/cycle';

let seq = 0;
const genId = (p: string) => `${p}_${TimeService.now()}_${seq++}`;

/** 有 commentCount 但没铺评论对象的非广告帖(需要填充评论,避免详情页显示 0 条) */
function postsWithoutComments(posts: Post[], comments: Record<string, Comment[]>): Post[] {
  return posts.filter((p) => !p.isAd && p.commentCount > 0 && (comments[p.id]?.length ?? 0) === 0);
}

/** 把 defaults 的相对偏移(daysAgo/hoursAgo)换算成绝对日期/时间戳 */
function buildInitialState(): MeiyouState {
  const cfg = JSON.parse(JSON.stringify(MEIYOU_CONFIG)) as typeof MEIYOU_CONFIG;
  const today = fmtDate(TimeService.now());

  const periods = (cfg.periodOffsets as Array<{ startDaysAgo: number; lenDays?: number; ongoing?: boolean }>).map((p) => ({
    start: addDays(today, -p.startDaysAgo),
    end: p.ongoing ? null : addDays(today, -p.startDaysAgo + (p.lenDays ?? 5) - 1),
  }));

  const dayRecords: Record<string, DayRecord> = {};
  for (const [off, rec] of Object.entries(cfg.recordOffsets as Record<string, DayRecord>)) {
    dayRecords[addDays(today, Number(off))] = rec;
  }

  const now = TimeService.now();
  const posts: Post[] = (cfg.posts as Array<Post & { hoursAgo: number }>).map(({ hoursAgo, ...p }) => ({
    ...p, createdAt: now - hoursAgo * 3600_000,
  }));

  const mapComment = (c: Comment & { hoursAgo?: number }): Comment => {
    const { hoursAgo, ...rest } = c as Comment & { hoursAgo: number };
    return { ...rest, createdAt: now - (hoursAgo ?? 1) * 3600_000, replies: (c.replies ?? []).map(mapComment) };
  };
  const comments: Record<string, Comment[]> = {};
  for (const [pid, list] of Object.entries(cfg.comments as unknown as Record<string, Comment[]>)) {
    comments[pid] = list.map(mapComment);
  }
  // 为所有有评论数但没铺评论对象的帖子生成填充评论,避免"卡片显示X评论、详情却0条"的数据不一致
  const AV = (n: number) => `/@app-assets/Meiyou/gen/avatar_u${(n % 10) + 1}.png`;
  const FILLER_NAMES = ['小柚子ZK7', '暖暖的柚', '柚见幸福', '晚风temp', '芒果布丁', '柚宝妈妈', '安然xy', '爱吃辣的猫', '棉花糖77', '柚子小姐'];
  const FILLER_REGIONS = ['江苏', '广东', '浙江', '山东', '四川', '北京', '湖南', '河南', '福建', '陕西'];
  const FILLER_TEXTS = [
    '抱抱姐妹,你不是一个人,大家都懂你', '说得太对了,我也有一样的经历', '理性看待,先照顾好自己最重要',
    '姐妹清醒一点,别委屈自己', '同款烦恼,一起加油鸭', '看完好有感触,谢谢分享',
    '这种事真的要早点想明白', '支持你的决定,勇敢一点', '多喝热水多休息,别太焦虑',
    '我当年也这样,过来人劝你三思', '柚子们的评论好治愈,收藏了', '顶一下,希望更多姐妹看到',
  ];
  postsWithoutComments(posts, comments).forEach((post, pi) => {
    const n = Math.min(4, Math.max(2, post.commentCount % 5 || 3));
    comments[post.id] = Array.from({ length: n }, (_, i) => {
      const k = (pi * 7 + i * 3) % FILLER_TEXTS.length;
      return {
        id: `fc_${post.id}_${i}`,
        author: { name: FILLER_NAMES[(pi + i) % FILLER_NAMES.length], avatar: AV(pi + i) },
        text: FILLER_TEXTS[k],
        createdAt: now - (i + 1) * 3600_000 * (2 + pi % 5),
        region: FILLER_REGIONS[(pi * 3 + i) % FILLER_REGIONS.length],
        likes: (post.commentCount * (i + 1)) % 37,
        replies: [],
        hiddenReplies: i === 0 && post.commentCount > 20 ? Math.min(post.commentCount - n, 20) : undefined,
      } as Comment;
    });
  });

  const notices: InteractNotice[] = (cfg.notices as Array<InteractNotice & { hoursAgo: number }>).map(
    ({ hoursAgo, ...n }) => ({ ...n, createdAt: now - hoursAgo * 3600_000 }),
  );
  const sysNotices = (cfg.sysNotices as Array<{ id: string; title: string; body: string; hoursAgo: number }>).map(
    ({ hoursAgo, ...n }) => ({ ...n, createdAt: now - hoursAgo * 3600_000 }),
  );

  return {
    user: cfg.user,
    loggedIn: cfg.loggedIn,
    mode: cfg.mode as MeiyouState['mode'],
    prepEnabled: cfg.prepEnabled,
    cycle: cfg.cycle,
    periods,
    dayRecords,
    posts,
    comments,
    circles: cfg.circles,
    joinedCircles: cfg.joinedCircles,
    myPostIds: [],
    likedPostIds: [],
    likedCommentIds: [],
    favPostIds: [],
    followedAuthors: [],
    dismissedAds: [],
    notices,
    sysNotices,
    aiSessions: [{ id: 'sess1', title: '新对话', messages: [] }],
    aiCurrentSession: 'sess1',
    aiSuggested: cfg.ai.suggested,
    searchHot: cfg.searchHot,
    searchGuess: cfg.searchGuess,
    searchHistory: cfg.searchHistory,
    notifSettings: cfg.notifSettings,
    unread: { interact: notices.length, sysChat: 1, aiChat: 1 },
    analysisBadge: 2,
    publishBanner: null,
    taskAudit: {},
  };
}

const AI_ANSWERS: Record<string, string> = MEIYOU_CONFIG.ai.answers;
const AI_FALLBACK: string = MEIYOU_CONFIG.ai.fallback;

export const useMeiyouStore = createAppStoreWithActions<MeiyouState, MeiyouActions>(
  manifest.id,
  buildInitialState(),
  (set, get) => ({
    // ---------- 记录 ----------
    saveRecord: (date, patch) => {
      set((s) => ({
        dayRecords: { ...s.dayRecords, [date]: { ...s.dayRecords[date], ...patch } },
        analysisBadge: s.analysisBadge + 1,
      }));
    },
    toggleSymptom: (date, symptom) => {
      set((s) => {
        const cur = s.dayRecords[date]?.symptoms ?? [];
        const symptoms = cur.includes(symptom) ? cur.filter((x) => x !== symptom) : [...cur, symptom];
        return { dayRecords: { ...s.dayRecords, [date]: { ...s.dayRecords[date], symptoms } } };
      });
    },
    confirmPeriodStart: (date, rec) => {
      set((s) => {
        // 该日标记经期开始;若与现有段重叠则忽略新增
        const exists = s.periods.some((p) => date >= p.start && date <= (p.end ?? addDays(p.start, s.cycle.periodLen - 1)));
        const periods = exists ? s.periods : [...s.periods, { start: date, end: addDays(date, s.cycle.periodLen - 1) }];
        return {
          periods,
          dayRecords: { ...s.dayRecords, [date]: { ...s.dayRecords[date], ...rec } },
          analysisBadge: s.analysisBadge + 1,
        };
      });
    },
    confirmPeriodEnd: (date) => {
      set((s) => {
        const sorted = [...s.periods].sort((a, b) => (a.start < b.start ? 1 : -1));
        const cur = sorted[0];
        if (!cur) return {};
        const periods = s.periods.map((p) => (p.start === cur.start ? { ...p, end: date } : p));
        return { periods, analysisBadge: s.analysisBadge + 1 };
      });
    },
    bumpAnalysisBadge: () => set((s) => ({ analysisBadge: s.analysisBadge + 1 })),
    clearAnalysisBadge: () => set(() => ({ analysisBadge: 0 })),

    // ---------- 周期设置 ----------
    setCycleLen: (n) => set((s) => ({ cycle: { ...s.cycle, cycleLen: n } })),
    setPeriodLen: (n) => set((s) => ({ cycle: { ...s.cycle, periodLen: n } })),
    toggleSmartPredict: () => set((s) => ({ cycle: { ...s.cycle, smartPredict: !s.cycle.smartPredict } })),
    togglePregProb: () => set((s) => ({ cycle: { ...s.cycle, showPregProb: !s.cycle.showPregProb } })),

    // ---------- 模式 ----------
    enablePrepMode: () => set(() => ({ mode: 'prep', prepEnabled: true })),
    switchMode: (m) => set(() => ({ mode: m })),

    // ---------- 社区 ----------
    likePost: (postId) => {
      set((s) => {
        const liked = s.likedPostIds.includes(postId);
        return {
          likedPostIds: liked ? s.likedPostIds.filter((i) => i !== postId) : [postId, ...s.likedPostIds],
          posts: s.posts.map((p) => (p.id === postId ? { ...p, likes: p.likes + (liked ? -1 : 1) } : p)),
        };
      });
    },
    likeComment: (commentId) => {
      set((s) => ({
        likedCommentIds: s.likedCommentIds.includes(commentId)
          ? s.likedCommentIds.filter((id) => id !== commentId)
          : [...s.likedCommentIds, commentId],
      }));
    },
    favPost: (postId) => {
      set((s) => ({
        favPostIds: s.favPostIds.includes(postId)
          ? s.favPostIds.filter((i) => i !== postId)
          : [postId, ...s.favPostIds],
      }));
    },
    followAuthor: (name) => {
      set((s) => ({
        followedAuthors: s.followedAuthors.includes(name)
          ? s.followedAuthors.filter((n) => n !== name)
          : [name, ...s.followedAuthors],
      }));
    },
    joinCircle: (circleId) => {
      set((s) => ({
        joinedCircles: s.joinedCircles.includes(circleId)
          ? s.joinedCircles.filter((c) => c !== circleId)
          : [...s.joinedCircles, circleId],
      }));
    },
    dismissAd: (postId) => set((s) => ({ dismissedAds: [...s.dismissedAds, postId] })),
    addComment: (postId, text) => {
      const c: Comment = {
        id: genId('c'),
        author: { name: get().user.nick, avatar: get().user.avatar },
        text,
        createdAt: TimeService.now(),
        region: get().user.ipRegion,
        likes: 0,
        replies: [],
      };
      set((s) => ({
        comments: { ...s.comments, [postId]: [c, ...(s.comments[postId] ?? [])] },
        posts: s.posts.map((p) => (p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p)),
      }));
    },
    publishPost: (text, topics, images, circleId) => {
      const p: Post = {
        id: genId('p'),
        author: { name: get().user.nick, avatar: get().user.avatar },
        circleId,
        text,
        images,
        topics,
        likes: 0,
        commentCount: 0,
        createdAt: TimeService.now(),
        region: get().user.ipRegion,
      };
      set((s) => ({
        posts: [p, ...s.posts],
        myPostIds: [p.id, ...s.myPostIds],
        publishBanner: { state: 'progress', pct: 3 },
      }));
    },
    setPublishBanner: (b) => set(() => ({ publishBanner: b })),

    // ---------- 搜索 ----------
    submitSearch: (q) => {
      const w = q.trim();
      if (!w) return;
      set((s) => ({ searchHistory: [w, ...s.searchHistory.filter((x) => x !== w)].slice(0, 10) }));
    },

    // ---------- AI ----------
    aiAsk: (q) => {
      const now = TimeService.now();
      const userMsg: AiMessage = { id: genId('m'), role: 'user', text: q, createdAt: now };
      const answer = AI_ANSWERS[q] ?? AI_FALLBACK;
      const aiMsg: AiMessage = { id: genId('m'), role: 'ai', text: answer, refBadges: true, createdAt: now + 1000 };
      set((s) => ({
        aiSessions: s.aiSessions.map((sess) =>
          sess.id === s.aiCurrentSession
            ? { ...sess, title: sess.messages.length === 0 ? q.slice(0, 12) : sess.title, messages: [...sess.messages, userMsg, aiMsg] }
            : sess,
        ),
      }));
    },
    aiNewSession: () => {
      const id = genId('sess');
      set((s) => ({
        aiSessions: [...s.aiSessions, { id, title: '新对话', messages: [] }],
        aiCurrentSession: id,
      }));
    },
    aiSwitchSession: (id) => set(() => ({ aiCurrentSession: id })),

    // ---------- 账号 ----------
    logout: () => set(() => ({ loggedIn: false })),
    login: () => set(() => ({ loggedIn: true })),

    // ---------- 通知设置 ----------
    toggleNotif: (key) => set((s) => ({ notifSettings: { ...s.notifSettings, [key]: !s.notifSettings[key] } })),
    recordDailyReportView: (day, pregnancyProbabilityVisible) => set((s) => ({
      taskAudit: {
        ...s.taskAudit,
        dailyReportDay: day,
        pregnancyProbabilityViewedOnTomorrow: s.taskAudit.pregnancyProbabilityViewedOnTomorrow
          || (day === 'tomorrow' && pregnancyProbabilityVisible),
      },
    })),
    recordNoticeOpened: (noticeId) => set((s) => ({
      taskAudit: { ...s.taskAudit, openedNoticeId: noticeId },
    })),

    // ---------- 消息已读 ----------
    markRead: (key) => set((s) => (s.unread[key] === 0 ? {} : { unread: { ...s.unread, [key]: 0 } })),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      const { _temp, ...rest } = state as MeiyouState & MeiyouActions;
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(rest)) {
        if (typeof v !== 'function') result[k] = v;
      }
      return result as Partial<MeiyouState>;
    },
  },
);

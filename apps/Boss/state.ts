import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { BOSS_CONFIG } from './data';
import { BOSS_REPLY_DELAY_MS, DATA_VERSION } from './constants';
import type {
  ChatMessage, ChatSession, ExpectItem, FeedComment, FullState, InterviewItem, JobStatus, JobType, SortMode,
} from './types';

const C = BOSS_CONFIG;

const initialState: FullState = {
  _dataVersion: DATA_VERSION,
  user: {
    ...C.user,
    birthday: '',
    industry: '',
    workCity: C.city,
    tags: '',
  },
  expects: C.expects.map((e) => ({ ...e })),
  city: C.city,
  cityHistory: [],
  jobType: 'fulltime',
  sortMode: 'recommend',
  dismissedJobIds: [],
  filter: {},
  searchHistory: [...C.searchHistory],
  favoriteJobIds: [],
  favoriteCompanyIds: [],
  sessions: C.sessions.map((s) => ({ ...s, messages: s.messages.map((m) => ({ ...m })) })),
  quickReplies: C.quickReplies.map((q) => ({ ...q })),
  feedTab: 'recommend',
  selectedExpect: '',
  parttimeCategory: '',
  myPosts: [],
  commentReplies: {},
  likedPostIds: [],
  favoritePostIds: [],
  followedAuthors: [],
  likedCommentIds: [],
  myComments: [],
  records: {
    viewed: C.records.viewed.map((r) => ({ ...r })),
    chatted: C.records.chatted.map((r) => ({ ...r })),
    applied: [],
    exchanged: C.records.exchanged.map((r) => ({ ...r })),
    interviewed: C.records.interviewed.map((r) => ({ ...r })),
  },
  interviews: [],
  interviewHistory: [],
  resume: { sections: { ...C.resumeSections }, dateRanges: {} },
  verifySubmitted: false,
  verificationReportImage: '',
  taskAudit: {},
  purchases: {
    vipCard: '', vipDays: 0,
    competitivenessPlan: '', competitivenessDays: 0,
    mbtiEdition: '',
  },
  cacheSizeMb: 6.2,
  settings: { language: 'zh', notifyMsg: true, notifySys: true, soundOn: true, resumeVisible: true },
  _temp: { toast: '', toastSeq: 0, notice: '', noticeSeq: 0 },
};

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

function nowLabel(): string {
  const d = TimeService.getDate();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function dateLabel(): string {
  const d = TimeService.getDate();
  return `${String(d.getMonth() + 1).padStart(2, '0')}月${String(d.getDate()).padStart(2, '0')}日`;
}

/** Boss 自动回复(Q7):按关键词挑话术,3-5 轮封顶;轮内按已回轮数取不同条,避免复读。 */
function pickReply(text: string, rounds: number): string | null {
  if (rounds >= C.autoReply.maxRounds) return null;
  for (const rule of C.autoReply.rules) {
    if (rule.keywords.some((k) => text.includes(k))) {
      return rule.replies[rounds % rule.replies.length];
    }
  }
  return C.autoReply.fallback[rounds % C.autoReply.fallback.length];
}

export interface AppActions {
  showToast: (msg: string) => void;
  showNotice: (msg: string) => void;
  dismissNotice: () => void;

  // 职位列表
  setJobType: (t: JobType) => void;
  setParttimeCategory: (category: string) => void;
  setSortMode: (m: SortMode) => void;
  setCity: (c: string) => void;
  dismissJob: (jobId: string) => void;
  setFilterOption: (group: string, value: string, single: boolean) => void;
  setFilter: (filter: Record<string, string[]>) => void;
  clearFilter: () => void;

  // 搜索
  addSearchHistory: (kw: string) => void;
  clearSearchHistory: () => void;

  // 收藏 / 浏览记录
  toggleFavoriteJob: (jobId: string) => void;
  toggleFavoriteCompany: (companyId: string) => void;
  addViewedRecord: (jobId: string) => void;

  // 求职期望
  saveExpect: (e: Omit<ExpectItem, 'id'>, id?: string) => void;
  deleteExpect: (id: string) => void;
  setJobStatus: (s: JobStatus) => void;

  // 聊天
  ensureSession: (bossId: string, jobId: string) => string;
  markSessionRead: (sessionId: string) => void;
  sendMessage: (sessionId: string, text: string, source?: 'typed' | 'quickreply') => void;
  sendImage: (sessionId: string, imageUri: string) => void;
  sendResumeCard: (sessionId: string) => void;
  requestExchange: (sessionId: string, kind: 'phone' | 'wechat') => void;
  dislikeSession: (sessionId: string) => void;
  setSessionPinned: (sessionId: string, pinned: boolean) => void;
  setSessionBlocked: (sessionId: string, blocked: boolean) => void;
  setSessionRemark: (sessionId: string, remark: string) => void;

  // 常用语
  saveQuickReply: (text: string, id?: string) => void;

  // 有了
  setFeedTab: (t: 'recommend' | 'follow') => void;
  setSelectedExpect: (position: string) => void;
  publishPost: (text: string, topics: string[], imageUris?: string[], aiDeclared?: boolean) => void;
  publishAsk: (title: string, desc: string, topics: string[], imageUris?: string[]) => void;
  publishAnswer: (question: string, answer: string) => void;
  replyComment: (commentId: string, text: string) => void;
  toggleLikePost: (postId: string) => void;
  toggleFavoritePost: (postId: string) => void;
  toggleFollowAuthor: (name: string) => void;
  toggleLikeComment: (commentId: string) => void;
  addComment: (postId: string, text: string) => void;

  // 面试
  addInterview: (item: Omit<InterviewItem, 'id'>) => void;

  // 简历 / 资料
  saveResumeSection: (section: string, text: string, dateRange?: string) => void;
  setUserField: (field: keyof FullState['user'], value: string) => void;
  toggleSetting: (key: 'notifyMsg' | 'notifySys' | 'soundOn' | 'resumeVisible') => void;
  setSetting: (key: 'notifyMsg' | 'notifySys' | 'soundOn' | 'resumeVisible', value: boolean) => void;
  submitVerification: (reportImage: string) => void;
  completePurchase: (kind: 'vip' | 'competitiveness' | 'mbti', sku: string) => void;
  clearCache: () => void;
  recordTaskAudit: (key: string, value: unknown) => void;
}

export const useBossStore = createAppStoreWithActions<FullState, AppActions>(
  'boss',
  initialState,
  (set, get) => ({
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),
    showNotice: (msg) =>
      set((s) => ({ _temp: { ...s._temp, notice: msg, noticeSeq: s._temp.noticeSeq + 1 } })),
    dismissNotice: () =>
      set((s) => ({ _temp: { ...s._temp, notice: '' } })),

    setJobType: (t) => set(() => ({
      jobType: t,
      // 职位类型之间的薪资单位和岗位语义不同，切换时不能沿用旧交集。
      selectedExpect: '',
      parttimeCategory: '',
      filter: {},
    })),
    setParttimeCategory: (category) => set((s) => ({
      parttimeCategory: s.parttimeCategory === category ? '' : category,
    })),
    setSortMode: (m) => set(() => ({ sortMode: m })),
    setCity: (c) => set((s) => ({
      city: c,
      cityHistory: c === s.city
        ? s.cityHistory
        : [s.city, ...s.cityHistory.filter((city) => city !== s.city && city !== c)].slice(0, 4),
    })),
    dismissJob: (jobId) =>
      set((s) => ({
        dismissedJobIds: s.dismissedJobIds.includes(jobId) ? s.dismissedJobIds : [...s.dismissedJobIds, jobId],
      })),
    setFilterOption: (group, value, single) =>
      set((s) => {
        const cur = s.filter[group] ?? [];
        let next: string[];
        if (value === '全部' || value === '不限') {
          next = [];
        } else if (single) {
          next = cur.includes(value) ? [] : [value];
        } else {
          next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
        }
        return { filter: { ...s.filter, [group]: next } };
      }),
    setFilter: (filter) => set(() => ({ filter })),
    clearFilter: () => set(() => ({ filter: {} })),

    addSearchHistory: (kw) =>
      set((s) => ({
        searchHistory: [kw, ...s.searchHistory.filter((h) => h !== kw)].slice(0, 10),
      })),
    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    toggleFavoriteJob: (jobId) =>
      set((s) => ({
        favoriteJobIds: s.favoriteJobIds.includes(jobId)
          ? s.favoriteJobIds.filter((i) => i !== jobId)
          : [...s.favoriteJobIds, jobId],
      })),
    toggleFavoriteCompany: (companyId) =>
      set((s) => ({
        favoriteCompanyIds: s.favoriteCompanyIds.includes(companyId)
          ? s.favoriteCompanyIds.filter((i) => i !== companyId)
          : [...s.favoriteCompanyIds, companyId],
      })),
    addViewedRecord: (jobId) =>
      set((s) => {
        if (s.records.viewed.some((r) => r.jobId === jobId)) return {};
        return {
          records: {
            ...s.records,
            viewed: [{ jobId, dateLabel: dateLabel(), timeLabel: nowLabel() }, ...s.records.viewed],
          },
        };
      }),

    saveExpect: (e, id) =>
      set((s) => {
        if (id) {
          const previous = s.expects.find((x) => x.id === id);
          return {
            expects: s.expects.map((x) => (x.id === id ? { ...x, ...e } : x)),
            selectedExpect: previous && s.selectedExpect === previous.position ? e.position : s.selectedExpect,
          };
        }
        return { expects: [...s.expects, { ...e, id: genId('e') }] };
      }),
    deleteExpect: (id) => set((s) => {
      const deleting = s.expects.find((x) => x.id === id);
      return {
        expects: s.expects.filter((x) => x.id !== id),
        selectedExpect: deleting && s.selectedExpect === deleting.position ? '' : s.selectedExpect,
      };
    }),
    setJobStatus: (js) => set((s) => ({ user: { ...s.user, jobStatus: js } })),

    ensureSession: (bossId, jobId) => {
      const found = get().sessions.find((s) => s.bossId === bossId && s.jobId === jobId);
      if (found) return found.id;
      const id = genId('s');
      const greetingText = get().quickReplies[0]?.text || '您好,看到您的招聘信息,我很感兴趣,希望可以进一步沟通。';
      const session: ChatSession = {
        id, bossId, jobId, isGreeting: false, unread: 0,
        lastTimeLabel: nowLabel(), initiatedByMe: true, replyRounds: 0,
        pinned: false, blocked: false, disliked: false, remark: '',
        phoneExchanged: false, wechatExchanged: false, resumeSent: false,
        messages: [{
          id: genId('m'), from: 'me', kind: 'text',
          text: greetingText, timeLabel: nowLabel(),
        }],
      };
      set((s) => ({
        sessions: [session, ...s.sessions],
        records: {
          ...s.records,
          chatted: s.records.chatted.some((r) => r.jobId === jobId)
            ? s.records.chatted
            : [{ jobId, dateLabel: dateLabel(), timeLabel: nowLabel() }, ...s.records.chatted],
        },
      }));
      scheduleBossReply(id, greetingText);
      return id;
    },
    markSessionRead: (sessionId) =>
      set((s) => ({
        sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, unread: 0 } : x)),
      })),
    sendMessage: (sessionId, text, source = 'typed') => {
      const msg: ChatMessage = { id: genId('m'), from: 'me', kind: 'text', text, timeLabel: nowLabel(), source };
      set((s) => ({
        sessions: s.sessions.map((x) =>
          x.id === sessionId
            ? { ...x, messages: [...x.messages, msg], lastTimeLabel: msg.timeLabel }
            : x,
        ),
      }));
      scheduleBossReply(sessionId, text);
    },
    sendImage: (sessionId, imageUri) => {
      const msg: ChatMessage = {
        id: genId('m'), from: 'me', kind: 'image', text: '图片', imageUri, timeLabel: nowLabel(),
      };
      set((s) => ({
        sessions: s.sessions.map((x) =>
          x.id === sessionId
            ? { ...x, messages: [...x.messages, msg], lastTimeLabel: msg.timeLabel }
            : x,
        ),
      }));
      scheduleBossReply(sessionId, '图片');
    },
    sendResumeCard: (sessionId) => {
      const msg: ChatMessage = {
        id: genId('m'), from: 'me', kind: 'resume',
        text: '我的在线简历', timeLabel: nowLabel(),
      };
      set((s) => {
        const jobId = s.sessions.find((x) => x.id === sessionId)?.jobId ?? '';
        return {
          sessions: s.sessions.map((x) =>
            x.id === sessionId
              ? { ...x, resumeSent: true, messages: [...x.messages, msg], lastTimeLabel: msg.timeLabel }
              : x,
          ),
          records: {
            ...s.records,
            applied: !jobId || s.records.applied.some((r) => r.jobId === jobId)
              ? s.records.applied
              : [{ jobId, dateLabel: dateLabel(), timeLabel: nowLabel() }, ...s.records.applied],
          },
        };
      });
      scheduleBossReply(sessionId, '简历');
    },
    requestExchange: (sessionId, kind) => {
      const label = kind === 'phone' ? '电话' : '微信';
      const msg: ChatMessage = {
        id: genId('m'), from: 'system', kind: 'exchange',
        text: `已向对方发送交换${label}请求`, timeLabel: nowLabel(),
      };
      set((s) => ({
        sessions: s.sessions.map((x) =>
          x.id === sessionId
            ? {
                ...x,
                phoneExchanged: kind === 'phone' ? true : x.phoneExchanged,
                wechatExchanged: kind === 'wechat' ? true : x.wechatExchanged,
                messages: [...x.messages, msg],
                lastTimeLabel: msg.timeLabel,
              }
            : x,
        ),
        records: (() => {
          const jobId = s.sessions.find((x) => x.id === sessionId)?.jobId ?? '';
          return {
            ...s.records,
            exchanged: !jobId || s.records.exchanged.some((r) => r.jobId === jobId)
              ? s.records.exchanged
              : [{ jobId, dateLabel: dateLabel(), timeLabel: nowLabel() }, ...s.records.exchanged],
          };
        })(),
      }));
      scheduleBossReply(sessionId, label);
    },
    dislikeSession: (sessionId) =>
      set((s) => ({
        sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, disliked: true } : x)),
      })),
    setSessionPinned: (sessionId, pinned) =>
      set((s) => ({ sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, pinned } : x)) })),
    setSessionBlocked: (sessionId, blocked) =>
      set((s) => ({ sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, blocked } : x)) })),
    setSessionRemark: (sessionId, remark) =>
      set((s) => ({ sessions: s.sessions.map((x) => (x.id === sessionId ? { ...x, remark } : x)) })),

    saveQuickReply: (text, id) =>
      set((s) => {
        if (id) return { quickReplies: s.quickReplies.map((q) => (q.id === id ? { ...q, text } : q)) };
        return { quickReplies: [...s.quickReplies, { id: genId('q'), text }] };
      }),

    setFeedTab: (t) => set(() => ({ feedTab: t })),
    setSelectedExpect: (position) => set(() => ({
      selectedExpect: position,
      // 期望岗位是新的筛选入口，避免历史筛选条件把结果无意收缩为 0。
      filter: {},
    })),
    publishPost: (text, topics, imageUris = [], aiDeclared = false) =>
      set((s) => {
        const post = {
          id: genId('post'), mine: true,
          author: { name: s.user.communityNick || s.user.nickname, avatar: 'u_me' },
          text, fullText: text, topics, imageUris, aiDeclared, comments: 0, stars: 0, likes: 0,
        };
        return { myPosts: [post, ...s.myPosts] };
      }),
    publishAsk: (title, desc, topics, imageUris = []) =>
      set((s) => {
        const post = {
          id: genId('post'), mine: true,
          author: { name: s.user.communityNick || s.user.nickname, avatar: 'u_me' },
          text: title, fullText: desc ? `${title}\n\n${desc}` : title,
          qaCard: title, topics, imageUris, comments: 0, stars: 0, likes: 0,
        };
        return { myPosts: [post, ...s.myPosts] };
      }),
    publishAnswer: (question, answer) =>
      set((s) => {
        const post = {
          id: genId('post'), mine: true,
          author: { name: s.user.communityNick || s.user.nickname, avatar: 'u_me' },
          text: answer, fullText: `${question}\n\n${answer}`,
          qaCard: question, topics: ['职场问答'], comments: 0, stars: 0, likes: 0,
        };
        return { myPosts: [post, ...s.myPosts] };
      }),
    replyComment: (commentId, text) =>
      set((s) => {
        const cur = s.commentReplies[commentId] ?? [];
        return {
          commentReplies: {
            ...s.commentReplies,
            [commentId]: [...cur, { author: s.user.communityNick || s.user.nickname, text, likes: 0, timeLabel: '刚刚' }],
          },
        };
      }),
    toggleLikePost: (postId) =>
      set((s) => ({
        likedPostIds: s.likedPostIds.includes(postId)
          ? s.likedPostIds.filter((i) => i !== postId)
          : [...s.likedPostIds, postId],
      })),
    toggleFavoritePost: (postId) =>
      set((s) => ({
        favoritePostIds: s.favoritePostIds.includes(postId)
          ? s.favoritePostIds.filter((i) => i !== postId)
          : [...s.favoritePostIds, postId],
      })),
    toggleFollowAuthor: (name) =>
      set((s) => {
        const followedAuthors = s.followedAuthors.includes(name)
          ? s.followedAuthors.filter((n) => n !== name)
          : [...s.followedAuthors, name];
        return {
          followedAuthors,
          user: { ...s.user, followCount: followedAuthors.length },
        };
      }),
    toggleLikeComment: (commentId) =>
      set((s) => ({
        likedCommentIds: s.likedCommentIds.includes(commentId)
          ? s.likedCommentIds.filter((i) => i !== commentId)
          : [...s.likedCommentIds, commentId],
      })),
    addComment: (postId, text) =>
      set((s) => {
        const c: FeedComment = {
          id: genId('c'), postId, author: s.user.communityNick || s.user.nickname,
          text, likes: 0, hot: false, timeLabel: nowLabel(), replies: [], moreReplies: 0,
        };
        return { myComments: [...s.myComments, c] };
      }),

    addInterview: (item) =>
      set((s) => ({
        interviews: [...s.interviews, { ...item, id: genId('iv') }],
        records: {
          ...s.records,
          interviewed: s.records.interviewed.some((r) => r.jobId === item.jobId)
            ? s.records.interviewed
            : [{ jobId: item.jobId, dateLabel: dateLabel(), timeLabel: item.time }, ...s.records.interviewed],
        },
      })),

    saveResumeSection: (section, text, dateRange = '') =>
      set((s) => ({
        resume: {
          sections: { ...s.resume.sections, [section]: text },
          dateRanges: { ...s.resume.dateRanges, [section]: dateRange },
        },
      })),
    setUserField: (field, value) =>
      set((s) => ({ user: { ...s.user, [field]: value } })),
    toggleSetting: (key) =>
      set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } })),
    setSetting: (key, value) =>
      set((s) => ({ settings: { ...s.settings, [key]: value } })),
    submitVerification: (reportImage) =>
      set(() => ({ verifySubmitted: true, verificationReportImage: reportImage })),
    completePurchase: (kind, sku) =>
      set((s) => {
        if (kind === 'vip') {
          const card = sku === 'card60' ? 'card60' : 'card30';
          const days = card === 'card60' ? 60 : 30;
          return { purchases: { ...s.purchases, vipCard: card, vipDays: s.purchases.vipDays + days } };
        }
        if (kind === 'competitiveness') {
          const days = sku.endsWith('30d') ? 30 : 1;
          return {
            purchases: {
              ...s.purchases,
              competitivenessPlan: sku,
              competitivenessDays: s.purchases.competitivenessDays + days,
            },
          };
        }
        const edition = sku.endsWith('full') ? 'full' : 'std';
        return { purchases: { ...s.purchases, mbtiEdition: edition } };
      }),
    clearCache: () => set(() => ({ cacheSizeMb: 0 })),
    recordTaskAudit: (key, value) => set((s) => ({ taskAudit: { ...s.taskAudit, [key]: value } })),
  }),
  {
    // 存档迁移:没有这段,改了 defaults.json 也只对全新用户生效,老 localStorage 会一直喂回旧值。
    afterHydration: () => {
      queueMicrotask(() => {
        const s = useBossStore.getState();
        if (s._dataVersion !== DATA_VERSION) {
          useBossStore.setState({ ...initialState });
        }
      });
    },
  },
);

/** 延迟写入 Boss 回复(uiState 无关,纯数据层;刷新丢失符合"运行时状态不持久"预期) */
function scheduleBossReply(sessionId: string, myText: string) {
  const session = useBossStore.getState().sessions.find((x) => x.id === sessionId);
  if (!session || session.blocked) return;
  const reply = pickReply(myText, session.replyRounds);
  if (!reply) return;
  setTimeout(() => {
    const msg: ChatMessage = { id: genId('m'), from: 'boss', kind: 'text', text: reply, timeLabel: nowLabel() };
    useBossStore.setState((s) => ({
      sessions: s.sessions.map((x) =>
        x.id === sessionId
          ? {
              ...x,
              replyRounds: x.replyRounds + 1,
              unread: x.unread + 1,
              messages: [...x.messages, msg],
              lastTimeLabel: msg.timeLabel,
            }
          : x,
      ),
    }));
  }, BOSS_REPLY_DELAY_MS);
}

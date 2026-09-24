import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { fromSeedAt, type SeedAt } from './utils/appTime';
import { YOUKU_CONFIG } from './data';
import { DATA_VERSION, WONTFIX_TOAST } from './constants';
import type {
  FullState, AppActions, CommentItem, CommentReply, HistoryEntry, LibraryEntry, NoticeEntry,
  OrderEntry, TempState, ConvMsg,
} from './types';

// ------------------------------------------------------------------ seed 映射
type RawComment = {
  id: string; user: string; avatar: string; vip: boolean; text: string;
  at: SeedAt; ip: string; likes: number; isReview: boolean;
  replies: Array<{ id: string; user: string; text: string; at: SeedAt; ip: string; likes: number }>;
};

function seedComment(c: RawComment): CommentItem {
  return {
    id: c.id, user: c.user, avatar: c.avatar, vip: c.vip, text: c.text,
    ts: fromSeedAt(c.at), ip: c.ip, likes: c.likes, likedByMe: false,
    isReview: c.isReview, byMe: false,
    replies: c.replies.map((r): CommentReply => ({
      id: r.id, user: r.user, text: r.text, ts: fromSeedAt(r.at), ip: r.ip, likes: r.likes,
    })),
  };
}

/** 种子本人评论 id(展示昵称/头像跟当前用户走,联动赞/评通知) */
const MINE_COMMENT_IDS = new Set(['cmt_ax1_6', 'cmt_yg_1', 'cmt_xa1_mine']);

function seedCommentsByKey(): Record<string, CommentItem[]> {
  const out: Record<string, CommentItem[]> = {};
  const seeds = YOUKU_CONFIG.seedComments as unknown as Record<string, RawComment[]>;
  const me = YOUKU_CONFIG.user;
  for (const [key, list] of Object.entries(seeds)) {
    out[key] = list.map(seedComment);
    for (const c of out[key]) {
      if (!MINE_COMMENT_IDS.has(c.id)) continue;
      c.byMe = true;
      c.user = me.nickname;
      c.avatar = me.avatar;
      c.ip = me.ip.replace('属地:', ':');
    }
  }
  return out;
}

const initialTemp: TempState = {
  toast: '',
  toastSeq: 0,
  searchInput: '',
  publishDraft: { text: '', images: [], topicName: null, showId: null, showTitle: null, aiDeclared: false },
  profileDraft: null,
  editSelect: [],
  profileTabHint: null,
};

function buildInitialState(): FullState {
  const C = YOUKU_CONFIG;
  return {
    _dataVersion: DATA_VERSION,
    user: { ...C.user },
    membership: { active: false, tier: null, sinceTs: null, expireTs: null, checkedIn: false },
    libFollowing: (C.seedLibFollowing as unknown as Array<Record<string, unknown>>).map((e) => ({
      id: e.id as string, ctype: e.ctype as string, ts: fromSeedAt(e.at as SeedAt),
      progressText: e.progressText as string, perk: e.perk as string,
    })),
    reservations: [...C.seedReservations],
    favorites: (C.seedFavorites as unknown as Array<Record<string, unknown>>).map((e) => ({
      id: e.id as string, ctype: e.ctype as string, ts: fromSeedAt(e.at as SeedAt),
      progressText: e.progressText as string,
    })),
    likes: (C.seedLikes as unknown as Array<Record<string, unknown>>).map((e) => ({
      id: e.id as string, ctype: e.ctype as string, ts: fromSeedAt(e.at as SeedAt),
    })),
    history: (C.seedHistory as unknown as Array<Record<string, unknown>>).map((e): HistoryEntry => ({
      id: e.id as string, ctype: e.ctype as string, episode: e.episode as number | undefined,
      progressSec: e.progressSec as number, durationSec: e.durationSec as number, ts: fromSeedAt(e.at as SeedAt),
    })),
    downloads: [],
    ratings: {},
    commentsByKey: seedCommentsByKey(),
    userDanmakuByKey: {},
    followingCreators: [...C.seedFollowingCreatorIds],
    fans: C.seedFans.map((f) => ({ ...f })),
    interactions: (C.seedInteractions as unknown as Array<Record<string, unknown>>).map((e) => ({
      id: e.id as string, text: e.text as string, contentId: e.contentId as string,
      episode: e.episode as number | undefined, ts: fromSeedAt(e.at as SeedAt), liked: e.liked as boolean,
    })),
    moments: ((C as { seedMoments?: Array<Record<string, unknown>> }).seedMoments ?? []).map((m) => ({
      id: m.id as string,
      text: (m.text as string) ?? '',
      images: Array.isArray(m.images)
        ? (m.images as string[])
        : (m.image ? [m.image as string] : []),
      topicName: (m.topicName as string | null) ?? null,
      showId: (m.showId as string | null) ?? null,
      showTitle: (m.showTitle as string | null) ?? null,
      aiDeclared: Boolean(m.aiDeclared),
      ts: fromSeedAt(m.at as SeedAt),
      likes: (m.likes as number) ?? 0,
    })),
    likedDynamics: [],
    votes: {},
    notices: {
      likes: (C.notices.likes as unknown as Array<Record<string, unknown>>).map(seedNotice),
      comments: (C.notices.comments as unknown as Array<Record<string, unknown>>).map(seedNotice),
      danmu: ((C.notices.danmu as unknown as Array<Record<string, unknown>>) ?? []).map(seedNotice),
      fans: ((C.notices.fans as unknown as Array<Record<string, unknown>>) ?? []).map(seedNotice),
    },
    conversations: {
      vip: (C.conversations.vip as unknown as Array<Record<string, unknown>>).map(seedConv),
      system: (C.conversations.system as unknown as Array<Record<string, unknown>>).map(seedConv),
      assistant: [],
    },
    unread: { ...C.unread },
    orders: (C.orders as unknown as Array<Record<string, unknown>>).map((o): OrderEntry => ({
      id: o.id as string, title: o.title as string, priceText: o.priceText as string,
      paidText: o.paidText as string, ts: fromSeedAt(o.at as SeedAt), status: o.status as string,
    })),
    ordersShown: 3,
    searchHistory: [...C.searchHistory],
    discoverBatch: 0,
    settings: (() => {
      const raw = { ...(C.settings as Record<string, boolean>) };
      delete raw.appearanceDark;
      return raw;
    })(),
    // App 默认深色(不跟随 OS,除非用户选「跟随系统」)
    appearanceMode: 'dark',
    playback: { speed: '1.0X', timer: 'off', danmakuOn: false, dataTipDismissed: false, languages: {} },
    episodePanelAudit: {},
    _temp: { ...initialTemp, publishDraft: { ...initialTemp.publishDraft } },
  };
}

function seedNotice(e: Record<string, unknown>): NoticeEntry {
  return {
    id: e.id as string, user: e.user as string, action: e.action as string,
    contentId: e.contentId as string, episode: e.episode as number | undefined,
    commentId: e.commentId as string | undefined, text: e.text as string | undefined,
    quote: e.quote as string | undefined, ts: fromSeedAt(e.at as SeedAt),
  };
}

function seedConv(e: Record<string, unknown>): ConvMsg {
  return { id: e.id as string, ts: fromSeedAt(e.at as SeedAt), text: e.text as string };
}

const initialState: FullState = buildInitialState();

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

const hKey = (id: string, episode?: number) => `${id}#${episode ?? 0}`;

// ---- 非种子评论区:按 contentKey 生成"看起来各不相同"的默认评论(阶段⑥走查②)
//      同一 key 稳定(缓存),不同剧不同集拿到不同用户/文案/点赞/时间,并带一条点名剧名的置顶评。
const CATALOG_TITLE: Record<string, string> = Object.fromEntries(
  (YOUKU_CONFIG.catalog as unknown as Array<{ id: string; title: string }>).map((c) => [c.id, c.title]),
);
const CMT_CITIES = ['北京', '上海', '广东', '江苏', '浙江', '四川', '湖南', '山东', '福建', '陕西', '河南', '辽宁'];
const COMMENT_AVATARS = (YOUKU_CONFIG as { commentAvatars?: string[] }).commentAvatars ?? [];
// 短剧/短视频 id 集合与标题(用于评论区按内容类型分池 + 点名标题)——走查③:短视频/短剧评论要适配语境
const DRAMA_TITLE: Record<string, string> = Object.fromEntries(
  ((YOUKU_CONFIG as { shortDramas?: Array<{ id: string; title: string }> }).shortDramas ?? []).map((d) => [d.id, d.title]),
);
const SHORT_ID_SET = new Set(
  ((YOUKU_CONFIG as { shorts?: Array<{ id: string }> }).shorts ?? []).map((s) => s.id),
);

/** 长片(剧集/电影)评论池 */
const LONG_POOL: Array<{ user: string; text: string; likes: number }> = [
  { user: '热心观众', text: '节奏很稳,不知不觉就刷完了。', likes: 326 },
  { user: '追剧日常', text: '已加追,蹲后续更新!', likes: 281 },
  { user: '画质党', text: '这画质在同类里算顶的了。', likes: 203 },
  { user: '剧情控', text: '伏笔埋得挺细,越往后越上头。', likes: 255 },
  { user: '理性讨论组', text: '有点小瑕疵,但瑕不掩瑜。', likes: 112 },
  { user: '弹幕少年', text: '弹幕氛围太欢乐,边看边笑。', likes: 98 },
  { user: '原著粉', text: '还原度不错,选角我给过。', likes: 176 },
  { user: '颜值即正义', text: '主角这颜值我能看一整天。', likes: 143 },
  { user: '考据癖', text: '服化道很用心,细节经得起放大。', likes: 121 },
  { user: '路人观众', text: '本来随便点开,结果一口气看完。', likes: 189 },
  { user: '配乐控', text: 'BGM 一起我就起鸡皮疙瘩。', likes: 87 },
  { user: '熬夜冠军', text: '说好只看一集,结果天亮了。', likes: 210 },
  { user: '打分侠', text: '评分不虚,值得二刷。', likes: 134 },
  { user: '剪辑鉴赏', text: '转场和运镜都在线,看着舒服。', likes: 76 },
];
/** 竖屏短剧评论池 */
const DRAMA_POOL: Array<{ user: string; text: string; likes: number }> = [
  { user: '爽剧本剧', text: '爽文节奏拉满,一口气刷完了。', likes: 268 },
  { user: '追更少女', text: '每天蹲更新,求加更求加更!', likes: 231 },
  { user: '磕到了', text: '男主也太苏了吧,姐妹们冲。', likes: 205 },
  { user: '反转爱好者', text: '这反转来得猝不及防,上头。', likes: 154 },
  { user: '短剧十级', text: '三分钟一集根本不够看啊。', likes: 142 },
  { user: '通宵选手', text: '说好看两集,结果补到大结局。', likes: 188 },
  { user: '嗑CP', text: '男二意难平…导演出来挨打。', likes: 96 },
  { user: '解气了', text: '女主打脸这段太解气了哈哈。', likes: 173 },
  { user: '白嫖党', text: '免费能看到这集,良心短剧。', likes: 88 },
  { user: '演技在线', text: '女主代入感很强,不尬。', likes: 77 },
  { user: '下饭首选', text: '吃饭必备,越看越上瘾。', likes: 119 },
  { user: '催更狂魔', text: '看完这集又断了,好难受。', likes: 64 },
];
/** 短视频/二创切片评论池 */
const SHORT_POOL: Array<{ user: string; text: string; likes: number }> = [
  { user: '刷到停不下', text: '这剪辑太上头了,连看三遍。', likes: 214 },
  { user: '笑不活了', text: '哈哈哈这段直接给我笑喷。', likes: 198 },
  { user: '求原片', text: '求正片名字/完整版链接!', likes: 176 },
  { user: '二创鉴赏', text: '二创天花板,收藏了。', likes: 143 },
  { user: '扒歌小能手', text: 'BGM 是什么呀?好抓耳。', likes: 92 },
  { user: '细节控', text: '这个细节我居然一直没发现。', likes: 121 },
  { user: '被安利了', text: '看完直接去追正片了。', likes: 158 },
  { user: '手速党', text: '几分钟信息量好大,收藏慢看。', likes: 84 },
  { user: '截图狂', text: '帧帧能当壁纸,截了一堆。', likes: 108 },
  { user: '蹲更新', text: '楼主更新好快,蹲下一期!', likes: 73 },
  { user: '一键三连', text: '剪得太丝滑,先赞后看。', likes: 130 },
  { user: '路过打卡', text: '刷到就是缘分,来评论区打卡。', likes: 56 },
];
type CmtKind = 'long' | 'drama' | 'short';
const CMT_LEADS: Record<CmtKind, Array<(t: string) => string>> = {
  long: [
    (t) => `《${t}》真的追对了,越看越有味道。`,
    (t) => `冲着口碑来看《${t}》,没让人失望。`,
    (t) => `《${t}》这波质量在线,安利给还没看的。`,
    (t) => `刚看完《${t}》最新一集,忍不住来打卡。`,
  ],
  drama: [
    (t) => `《${t}》追到上头,三分钟一集根本不够看!`,
    (t) => `刷到《${t}》停不下来,直接一口气追完。`,
    (t) => `《${t}》这节奏太爽了,催更催更!`,
  ],
  short: [
    () => '这条剪辑我能反复看一整天,太上头。',
    () => '二创质量太高了,先赞后看。',
    () => '刷到这条直接收藏,忍不住来评论。',
  ],
};
function cmtHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mkDefaultComment(
  id: string, user: string, text: string, city: string, likes: number, dayOffset: number, hm: string,
): CommentItem {
  return {
    id, user, avatar: COMMENT_AVATARS[cmtHash(id) % COMMENT_AVATARS.length] ?? '', vip: false, text, ts: fromSeedAt({ dayOffset, hm }),
    ip: `IP:${city}`, likes, likedByMe: false, isReview: false, byMe: false, replies: [],
  };
}
const defaultViewCache = new Map<string, CommentItem[]>();
function buildDefaultCommentsFor(key: string): CommentItem[] {
  const cached = defaultViewCache.get(key);
  if (cached) return cached;
  const contentId = key.split(':')[0];
  // 内容类型分池:短剧 / 短视频 / 长片(剧集·电影)
  const kind: CmtKind = DRAMA_TITLE[contentId] ? 'drama' : SHORT_ID_SET.has(contentId) ? 'short' : 'long';
  const pool = kind === 'drama' ? DRAMA_POOL : kind === 'short' ? SHORT_POOL : LONG_POOL;
  const title = kind === 'drama' ? DRAMA_TITLE[contentId] : kind === 'long' ? (CATALOG_TITLE[contentId] ?? '') : '';
  const h = cmtHash(key);
  const out: CommentItem[] = [];
  const leads = CMT_LEADS[kind];
  // 短视频无正式剧名,统一用通用引子;长片/短剧点名标题
  if (kind === 'short' || title) {
    out.push(
      mkDefaultComment(`cd_${h.toString(36)}_L`, kind === 'short' ? '优酷小编' : '优酷剧评',
        leads[h % leads.length](title), CMT_CITIES[h % CMT_CITIES.length], 220 + (h % 160), -(h % 2), `20:0${h % 6}`),
    );
  }
  const n = 6 + (h % 3); // 6~8 条
  for (let i = 0; i < n; i += 1) {
    const p = pool[(h + i * 5) % pool.length];
    const likes = Math.max(12, p.likes - (((h >>> (i % 5)) % 70)));
    const city = CMT_CITIES[(h + i * 3) % CMT_CITIES.length];
    const hm = `${9 + ((h + i * 7) % 13)}:${(h * (i + 1)) % 6}${(h + i) % 9}`;
    out.push(mkDefaultComment(`cd_${h.toString(36)}_${i}`, p.user, p.text, city, likes, -((h + i) % 3), hm));
  }
  defaultViewCache.set(key, out);
  return out;
}

/**
 * 评论区惰性初始化:key 无种子时以「按 key 派生的默认评论」兜底(各剧各不相同)。
 * 页面读取请用 selectComments(state, key)(见 docs 05-build-progress 契约)。
 */
function ensureComments(s: FullState, key: string): CommentItem[] {
  if (s.commentsByKey[key]) return s.commentsByKey[key];
  return buildDefaultCommentsFor(key);
}

/** 页面侧只读 selector:某 contentKey 的评论列表(含默认兜底,不落库) */
export function selectComments(s: FullState, key: string): CommentItem[] {
  return s.commentsByKey[key] ?? buildDefaultCommentsFor(key);
}

/** 页面侧只读 selector:某 contentKey 的弹幕(种子+默认池+我发的) */
export function selectDanmaku(s: FullState, key: string): string[] {
  const seeds = (YOUKU_CONFIG.seedDanmaku as unknown as Record<string, string[]>)[key] ?? YOUKU_CONFIG.defaultDanmaku;
  return [...seeds, ...(s.userDanmakuByKey[key] ?? [])];
}

export const useYoukuStore = createAppStoreWithActions<FullState, AppActions>(
  'youku',
  initialState,
  (set, get) => ({
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),

    setTemp: (patch) => set((s) => ({ _temp: { ...s._temp, ...patch } })),

    writeProgress: (e) =>
      set((s) => {
        // 短剧:同剧多集只保留最新一条历史;其他类型仍按 id+episode 覆盖
        const rest =
          e.ctype === 'drama'
            ? s.history.filter((h) => !(h.id === e.id && h.ctype === 'drama'))
            : s.history.filter((h) => hKey(h.id, h.episode) !== hKey(e.id, e.episode));
        const entry: HistoryEntry = { ...e, ts: TimeService.now() };
        return { history: [entry, ...rest] };
      }),

    deleteHistory: (keys) =>
      set((s) => ({
        history: s.history.filter((h) => !keys.includes(hKey(h.id, h.episode))),
        _temp: { ...s._temp, editSelect: [] },
      })),

    toggleZhui: (id, ctype) => {
      const on = !get().libFollowing.some((e) => e.id === id);
      set((s) => ({
        libFollowing: on
          ? [{ id, ctype, ts: TimeService.now(), progressText: '未观看', perk: '' } as LibraryEntry, ...s.libFollowing]
          : s.libFollowing.filter((e) => e.id !== id),
      }));
      get().showToast(on ? '加追成功!可在「我的」查看' : '已取消加追');
    },

    toggleReserve: (id) => {
      const on = !get().reservations.includes(id);
      set((s) => ({
        reservations: on ? [id, ...s.reservations] : s.reservations.filter((x) => x !== id),
      }));
      get().showToast(on ? '预约成功,上线后第一时间提醒你' : '已取消预约');
    },

    toggleFavorite: (id, ctype) => {
      const on = !get().favorites.some((e) => e.id === id);
      set((s) => ({
        favorites: on
          ? [{ id, ctype, ts: TimeService.now(), progressText: '' } as LibraryEntry, ...s.favorites]
          : s.favorites.filter((e) => e.id !== id),
      }));
      get().showToast(on ? '已收藏' : '已取消收藏');
    },

    removeLibraryItems: (tab, ids) =>
      set((s) => ({
        libFollowing: tab === 'zhui' ? s.libFollowing.filter((e) => !ids.includes(e.id)) : s.libFollowing,
        favorites: tab === 'fav' ? s.favorites.filter((e) => !ids.includes(e.id)) : s.favorites,
        _temp: { ...s._temp, editSelect: [] },
      })),

    toggleLike: (id, ctype) =>
      set((s) => {
        const on = !s.likes.some((e) => e.id === id);
        return {
          likes: on ? [{ id, ctype, ts: TimeService.now() }, ...s.likes] : s.likes.filter((e) => e.id !== id),
        };
      }),

    toggleCommentLike: (contentKey, commentId) =>
      set((s) => {
        // 本人主页动态从空评论区开始；不能套用影视评论区的默认评论池。
        const list = contentKey.startsWith('mm:') ? (s.commentsByKey[contentKey] ?? []) : ensureComments(s, contentKey);
        let likedNow = false;
        let likedComment: CommentItem | null = null;
        const next = list.map((c) => {
          if (c.id !== commentId) return c;
          likedNow = !c.likedByMe;
          likedComment = c;
          return { ...c, likedByMe: likedNow, likes: c.likes + (likedNow ? 1 : -1) };
        });
        const patch: Partial<FullState> = { commentsByKey: { ...s.commentsByKey, [contentKey]: next } };
        // spec msg.likes:给自己发布的评论点赞 → 实时生成『你 赞了你的评论』通知(取消不回收)
        const lc = likedComment as CommentItem | null;
        if (likedNow && lc && lc.byMe) {
          const [cid, ep] = contentKey.split(':');
          patch.notices = {
            ...s.notices,
            likes: [
              {
                id: genId('nt'), user: '你', action: '赞了你的评论', contentId: cid,
                episode: ep ? Number(ep) : undefined, commentId,
                quote: `你的评论: ${lc.text}`, ts: TimeService.now(),
              },
              ...s.notices.likes,
            ],
          };
        }
        return patch;
      }),

    publishComment: (contentKey, text, opts) =>
      set((s) => {
        const t = text.trim();
        if (!t) return {};
        const list = contentKey.startsWith('mm:') ? (s.commentsByKey[contentKey] ?? []) : ensureComments(s, contentKey);
        const now = TimeService.now();
        let next: CommentItem[];
        if (opts?.replyToCommentId) {
          next = list.map((c) =>
            c.id === opts.replyToCommentId
              ? {
                  ...c,
                  replies: [
                    ...c.replies,
                    { id: genId('rp'), user: s.user.nickname, text: t, ts: now, ip: s.user.ip, likes: 0 },
                  ],
                }
              : c,
          );
        } else {
          const mine: CommentItem = {
            id: genId('cmt'), user: s.user.nickname, avatar: s.user.avatar, vip: s.membership.active,
            text: t, ts: now, ip: s.user.ip, likes: 0, likedByMe: false, replies: [],
            isReview: opts?.isReview ?? false, byMe: true,
          };
          next = [mine, ...list];
        }
        const contentId = opts?.contentId ?? contentKey.split(':')[0];
        return {
          commentsByKey: { ...s.commentsByKey, [contentKey]: next },
          interactions: [
            { id: genId('itc'), text: t, contentId, episode: opts?.episode, ts: now, liked: false },
            ...s.interactions,
          ],
        };
      }),

    sendDanmaku: (contentKey, text) =>
      set((s) => {
        const t = text.trim();
        if (!t) return {};
        return {
          userDanmakuByKey: {
            ...s.userDanmakuByKey,
            [contentKey]: [...(s.userDanmakuByKey[contentKey] ?? []), t],
          },
        };
      }),

    submitRating: (contentId, score, review) => {
      set((s) => ({
        ratings: { ...s.ratings, [contentId]: { score, review, ts: TimeService.now() } },
      }));
      if (review.trim()) {
        get().publishComment(contentId, review, { isReview: true, contentId });
      }
      get().showToast('评分成功');
    },

    setLanguage: (videoId, lang) =>
      set((s) => ({
        playback: { ...s.playback, languages: { ...s.playback.languages, [videoId]: lang } },
      })),

    setSpeed: (option) => set((s) => ({ playback: { ...s.playback, speed: option } })),
    setTimer: (option) => set((s) => ({ playback: { ...s.playback, timer: option } })),
    toggleDanmaku: () => set((s) => ({ playback: { ...s.playback, danmakuOn: !s.playback.danmakuOn } })),
    dismissDataTip: () => set((s) => ({ playback: { ...s.playback, dataTipDismissed: true } })),

    recordEpisodePanel: (showId, patch) =>
      set((s) => {
        const current = s.episodePanelAudit[showId] ?? {
          viewedTabs: [],
          titlesEnabled: false,
          selectedEpisode: null,
        };
        const viewedTabs = patch.viewedTab && !current.viewedTabs.includes(patch.viewedTab)
          ? [...current.viewedTabs, patch.viewedTab]
          : current.viewedTabs;
        return {
          episodePanelAudit: {
            ...s.episodePanelAudit,
            [showId]: {
              viewedTabs,
              titlesEnabled: patch.titlesEnabled ?? current.titlesEnabled,
              selectedEpisode: patch.selectedEpisode ?? current.selectedEpisode,
            },
          },
        };
      }),

    toggleFollowCreator: (userId) => {
      const on = !get().followingCreators.includes(userId);
      set((s) => ({
        followingCreators: on
          ? [userId, ...s.followingCreators]
          : s.followingCreators.filter((x) => x !== userId),
      }));
      get().showToast(on ? '关注成功' : '已取消关注');
    },

    toggleFanFollowBack: (userId) =>
      set((s) => ({
        fans: s.fans.map((f) => (f.userId === userId ? { ...f, followedBack: !f.followedBack } : f)),
      })),

    activateVip: (tier, planId = 'monthly') => {
      const now = TimeService.now();
      const days = planId === 'year' ? 365 : planId === 'quarter' ? 90 : 30;
      const planName = planId === 'year' ? '连续包年' : planId === 'quarter' ? '连续包季' : '连续包月';
      const plans = (YOUKU_CONFIG.vipPlans as { vip: Array<{ id: string; price: number }>; svip: Array<{ id: string; price: number }> })[tier];
      const price = plans.find((p) => p.id === planId)?.price ?? 12;
      const tierText = tier === 'svip' ? 'SVIP' : 'VIP';
      const wasActive = get().membership.active;
      set((s) => {
        const base =
          s.membership.active && s.membership.expireTs && s.membership.expireTs > now
            ? s.membership.expireTs
            : now;
        const expireTs = base + days * 86400000;
        const expireDate = TimeService.fromTimestamp(expireTs);
        const expireLabel = `${expireDate.getFullYear()}年${expireDate.getMonth() + 1}月${expireDate.getDate()}日`;
        return {
          membership: {
            active: true,
            tier,
            sinceTs: s.membership.sinceTs ?? now,
            expireTs,
            checkedIn: s.membership.checkedIn,
          },
          orders: [
            {
              id: genId('od'),
              title: `${tierText}会员·${planName}`,
              priceText: `¥${price}`,
              paidText: `¥${price}.00`,
              ts: now,
              status: '交易成功',
            },
            ...s.orders,
          ],
          // 开通/续费同步到「优酷VIP会员」会话(非系统消息)
          conversations: {
            ...s.conversations,
            vip: [
              {
                id: genId('cv'),
                ts: now,
                text: wasActive
                  ? `【会员续费成功】您已续费${tierText}会员(${planName}),有效期延长至${expireLabel}。`
                  : `【会员开通成功】您已成功开通${tierText}会员(${planName}),有效期至${expireLabel}。可前往会员中心查看权益与续费。`,
              },
              ...s.conversations.vip,
            ],
          },
          unread: { ...s.unread, vip: s.unread.vip + 1 },
        };
      });
      get().showToast(wasActive ? '续费成功' : '开通成功');
    },

    /** @returns true=本次新打卡成功;false=今日已打过 */
    checkinVip: () => {
      if (get().membership.checkedIn) {
        get().showToast('今日已打卡');
        return false;
      }
      set((s) => ({ membership: { ...s.membership, checkedIn: true } }));
      return true;
    },

    fakeDownload: (id, ctype, episode) => {
      const exists = get().downloads.some((d) => d.id === id && d.episode === episode);
      if (!exists) {
        set((s) => ({
          downloads: [
            { id, ctype, episode, sizeMB: 380 + ((idCounter * 97) % 400), ts: TimeService.now() },
            ...s.downloads,
          ],
        }));
      }
      get().showToast('已加入下载,可在「我的下载」查看');
    },

    voteJieshuo: (shortId, option) =>
      set((s) => (s.votes[shortId] ? {} : { votes: { ...s.votes, [shortId]: option } })),

    markAllRead: () => {
      set(() => ({ unread: { likes: 0, comments: 0, danmu: 0, fans: 0, vip: 0, system: 0 } }));
      get().showToast('已清除未读');
    },

    markRead: (key) => set((s) => ({ unread: { ...s.unread, [key]: 0 } })),

    publishMoment: () => {
      const d = get()._temp.publishDraft;
      if (!d.text.trim() && d.images.length === 0) {
        get().showToast('先写点什么或加张图吧');
        return;
      }
      set((s) => ({
        moments: [
          {
            id: genId('mm'), text: d.text.trim(), images: d.images, topicName: d.topicName,
            showId: d.showId, showTitle: d.showTitle, aiDeclared: d.aiDeclared,
            ts: TimeService.now(), likes: 0,
          },
          ...s.moments,
        ],
        _temp: { ...s._temp, publishDraft: { ...initialTemp.publishDraft } },
      }));
      get().showToast('发布成功');
    },

    toggleDynamicLike: (dynamicId) =>
      set((s) => {
        const on = !s.likedDynamics.includes(dynamicId);
        return {
          likedDynamics: on
            ? [dynamicId, ...s.likedDynamics]
            : s.likedDynamics.filter((x) => x !== dynamicId),
          // 个人主页动态赞数同步
          moments: s.moments.map((m) =>
            m.id === dynamicId ? { ...m, likes: Math.max(0, m.likes + (on ? 1 : -1)) } : m,
          ),
        };
      }),

    toggleInteractionLike: (id) =>
      set((s) => ({
        interactions: s.interactions.map((e) => (e.id === id ? { ...e, liked: !e.liked } : e)),
      })),

    addSearchHistory: (word) =>
      set((s) => {
        const w = word.trim();
        if (!w) return {};
        return { searchHistory: [w, ...s.searchHistory.filter((x) => x !== w)].slice(0, 10) };
      }),

    clearSearchHistory: () => set(() => ({ searchHistory: [] })),

    refreshDiscover: () =>
      set((s) => ({ discoverBatch: (s.discoverBatch + 1) % YOUKU_CONFIG.discoverTags.length })),

    saveProfile: (patch) => {
      set((s) => ({ user: { ...s.user, ...patch }, _temp: { ...s._temp, profileDraft: null } }));
      get().showToast('保存成功');
    },

    toggleSetting: (key) => {
      const supported = key in get().settings;
      if (!supported) {
        get().showToast(WONTFIX_TOAST);
        return;
      }
      set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } }));
    },

    setAppearanceMode: (mode) => set(() => ({ appearanceMode: mode })),

    loadMoreOrders: () =>
      set((s) => ({ ordersShown: Math.min(s.orders.length, s.ordersShown + 3) })),
  }),
  {
    // localStorage key === manifest.id(硬约束);defaults 结构变更走 DATA_VERSION 重置
    afterHydration: () => {
      queueMicrotask(() => {
        const s = useYoukuStore.getState();
        if (s._dataVersion !== DATA_VERSION) {
          useYoukuStore.setState({ ...buildInitialState() });
          return;
        }
        // 非法/缺失外观回落深色(App 默认;不跟随 OS,除非用户显式选「跟随系统」)
        if (s.appearanceMode !== 'dark' && s.appearanceMode !== 'light' && s.appearanceMode !== 'system') {
          useYoukuStore.setState({ appearanceMode: 'dark' });
        }
      });
    },
  },
);

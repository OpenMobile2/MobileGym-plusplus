import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { BCZ_CONFIG } from './data';
import { COMBO_COIN_REWARD, COMBO_MILESTONE, DATA_VERSION } from './constants';
import type {
  Address, CartItem, FullState, PushKey, Settings, WordStatus,
} from './types';

const C = BCZ_CONFIG;

const initialState: FullState = {
  _dataVersion: DATA_VERSION,
  profile: { ...C.profile },
  words: C.words.map((w) => ({ ...w })),
  learn: Object.fromEntries(Object.entries(C.learn).map(([k, v]) => [k, { ...v }])),
  books: C.books.map((b) => ({ ...b })),
  currentBookId: C.currentBookId,
  dailyGroups: C.dailyGroups,
  today: { ...C.today },
  coins: C.coins,
  streakDays: C.streakDays,
  protectEquipped: C.protectEquipped,
  stars: C.stars,
  claimedTasks: [...C.claimedTasks],
  wordbooks: C.wordbooks.map((w) => ({ ...w, wordIds: [...w.wordIds] })),
  products: C.products.map((p) => ({ ...p })),
  cart: C.cart.map((c) => ({ ...c })),
  addresses: C.addresses.map((a) => ({ ...a })),
  order: { ...C.order },
  orders: [],
  favoriteProductIds: [...C.favoriteProductIds],
  memberships: { ...C.memberships },
  courseProgress: Object.fromEntries(Object.entries(C.courseProgress).map(([id, chapters]) => [id, [...chapters]])),
  articles: C.articles.map((a) => ({ ...a })),
  shelf: [...C.shelf],
  readChars: C.readChars,
  readArticleIds: [...C.readArticleIds],
  readPlan: C.readPlan ? { ...C.readPlan, articleIds: [...C.readPlan.articleIds] } : null,
  readCampLevel: C.readCampLevel,
  settings: { ...C.settings, push: { ...C.settings.push } },
  studyDetailAudit: {},
  _temp: { toast: '', toastSeq: 0, reward: null, combo: 0, streakBumped: false, dictQuery: '', directBuy: null },
};

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

/** 任务奖励表(8293) */
const TASK_REWARD: Record<string, number> = { login: 50, setPlan: 100, doPlan: 150 };

export interface AppActions {
  showToast: (msg: string) => void;
  showReward: (text: string) => void;

  // --- 学习 ---
  setStudyMode: (mode: Settings['studyMode']) => void;
  recordStudyDetailEvent: (wordId: string, event: 'exam' | 'synonym' | 'pronounced' | 'continued') => void;
  /** 答题:答对推进,记忆模式连对+1 并按里程碑发奖;答错清连对。返回是否触发里程碑。 */
  answerWord: (wordId: string, correct: boolean) => void;
  /** 记忆模式自评 */
  assessWord: (wordId: string, known: boolean) => void;
  collectWord: (wordId: string) => void;
  toggleWordZhan: (wordId: string) => void;
  setWordStatus: (wordId: string, status: WordStatus) => void;
  /** 完成一组:推进今日进度 + 发铜板/火箭/不断电 */
  finishGroup: (kind: 'new' | 'review') => void;
  addReviewGroup: () => void;

  // --- 铜板 / 不断电 / 任务 ---
  claimTask: (taskId: string) => void;
  equipProtect: () => void;

  // --- 词书 / 计划 ---
  setDailyGroups: (n: number) => void;
  pickCurrentBook: (bookId: string) => void;
  addBook: (bookId: string) => void;
  removeBook: (bookId: string) => void;

  // --- 单词本 ---
  setWordSort: (order: Settings['wordSort']) => void;
  toggleAccent: () => void;
  /** 新建单词本 */
  addWordbook: (name: string) => void;
  renameWordbook: (bookId: string, name: string) => void;
  deleteWordbook: (bookId: string) => void;
  addWordsToWordbook: (bookId: string, wordIds: string[]) => void;
  removeWordsFromWordbook: (bookId: string, wordIds: string[]) => void;

  // --- 商城 / 下单 ---
  addToCart: (productId: string, spec: string) => void;
  setCartChecked: (productId: string, checked: boolean) => void;
  setCartQty: (productId: string, delta: number) => void;
  setCartAllChecked: (checked: boolean) => void;
  setCartSpec: (productId: string, spec: string) => void;
  toggleOrderCoin: () => void;
  setPayMethod: (m: FullState['order']['payMethod']) => void;
  setOrderNote: (note: string) => void;
  addAddress: (a: Omit<Address, 'id'>) => void;
  /** 系统支付成功回调后:勾选商品转成订单,从购物车移除 */
  placeOrder: () => void;
  /** 立即购买:单个商品直接下单(不经购物车) */
  buyNow: (productId: string, spec: string, qty?: number) => void;
  /** 金币充值(我的账户) */
  rechargeCoins: (n: number) => void;
  toggleProductFavorite: (productId: string) => void;
  activatePro: (plan: 'trial' | 'monthly' | 'yearly') => void;

  // --- 课程 ---
  completeCourseLesson: (courseId: string, chapter: number) => void;

  setDictQuery: (q: string) => void;
  /** 阅读器点词加入单词本:命中种子词则收藏,否则建一个最小词条再收藏 */
  collectArticleWord: (text: string) => void;

  // --- 阅读 ---
  markArticleRead: (articleId: string) => void;
  addToShelf: (articleIds: string[]) => void;
  generateReadPlan: (option: string, minutes: number) => void;
  activateReadMembership: () => void;
  registerReadCamp: (level: 'basic' | 'mid' | 'high') => void;

  // --- 设置 ---
  toggleSound: () => void;
  toggleVibrate: () => void;
  togglePushMaster: () => void;
  togglePush: (key: PushKey) => void;
  togglePersonalize: () => void;
  setIdentity: (role: string) => void;
  logout: () => void;
}

function bumpStreak(s: FullState): Partial<FullState> {
  if (s._temp.streakBumped) return {};
  return {
    streakDays: s.streakDays + 1,
    _temp: { ...s._temp, streakBumped: true, reward: { seq: s._temp.reward ? s._temp.reward.seq + 1 : 1, text: '不断电+1天' } },
  };
}

export const useBaicizhanStore = createAppStoreWithActions<FullState, AppActions>(
  'baicizhan',
  initialState,
  (set, get) => ({
    showToast: (msg) => set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),
    showReward: (text) =>
      set((s) => ({ _temp: { ...s._temp, reward: { seq: (s._temp.reward?.seq ?? 0) + 1, text } } })),

    setStudyMode: (mode) => set((s) => ({ settings: { ...s.settings, studyMode: mode } })),
    recordStudyDetailEvent: (wordId, event) =>
      set((s) => {
        const previous = s.studyDetailAudit[wordId] ?? { viewedTabs: [], pronounced: false, continued: false };
        const viewedTabs = event === 'exam' || event === 'synonym'
          ? [...previous.viewedTabs, event]
          : previous.viewedTabs;
        return {
          studyDetailAudit: {
            ...s.studyDetailAudit,
            [wordId]: {
              viewedTabs,
              pronounced: previous.pronounced || event === 'pronounced',
              continued: previous.continued || event === 'continued',
            },
          },
        };
      }),

    answerWord: (wordId, correct) =>
      set((s) => {
        const patch: Partial<FullState> = { ...bumpStreak(s) };
        const learn = { ...s.learn };
        const prev = learn[wordId] ?? { status: 'new' as WordStatus, nextReviewDay: 0, collected: false };
        if (correct) {
          learn[wordId] = { ...prev, status: prev.status === 'known' ? 'known' : 'learning' };
          const combo = (patch._temp?.combo ?? s._temp.combo) + 1;
          const base = patch._temp ?? s._temp;
          if (combo > 0 && combo % COMBO_MILESTONE === 0) {
            patch.coins = (patch.coins ?? s.coins) + COMBO_COIN_REWARD;
            patch._temp = { ...base, combo, reward: { seq: (base.reward?.seq ?? 0) + 1, text: `${combo} 连对 · 铜板+${COMBO_COIN_REWARD}` } };
          } else {
            patch._temp = { ...base, combo };
          }
        } else {
          learn[wordId] = { ...prev, status: 'learning' };
          const base = patch._temp ?? s._temp;
          patch._temp = { ...base, combo: 0 };
        }
        patch.learn = learn;
        return patch;
      }),

    assessWord: (wordId, known) =>
      set((s) => {
        const patch: Partial<FullState> = { ...bumpStreak(s) };
        const learn = { ...s.learn };
        const prev = learn[wordId] ?? { status: 'new' as WordStatus, nextReviewDay: 0, collected: false };
        const base = patch._temp ?? s._temp;
        if (known) {
          learn[wordId] = { ...prev, status: 'known' };
          patch._temp = { ...base, combo: base.combo + 1 };
        } else {
          learn[wordId] = { ...prev, status: 'learning' };
          patch._temp = { ...base, combo: 0 };
        }
        patch.learn = learn;
        return patch;
      }),

    collectWord: (wordId) =>
      set((s) => {
        const learn = { ...s.learn };
        const prev = learn[wordId] ?? { status: 'new' as WordStatus, nextReviewDay: 0, collected: false };
        const nowCollected = !prev.collected;
        learn[wordId] = { ...prev, collected: nowCollected };
        const wordbooks = s.wordbooks.map((wb) => {
          if (wb.id !== 'wb_collect') return wb;
          const set2 = new Set(wb.wordIds);
          if (nowCollected) set2.add(wordId); else set2.delete(wordId);
          return { ...wb, wordIds: [...set2] };
        });
        return {
          learn, wordbooks,
          _temp: { ...s._temp, toast: nowCollected ? '收藏成功' : '已取消收藏', toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    toggleWordZhan: (wordId) =>
      set((s) => {
        const learn = { ...s.learn };
        const prev = learn[wordId] ?? { status: 'new' as WordStatus, nextReviewDay: 0, collected: false };
        learn[wordId] = { ...prev, status: prev.status === 'zhan' ? 'learning' : 'zhan' };
        return { learn, _temp: { ...s._temp, toast: '已斩', toastSeq: s._temp.toastSeq + 1 } };
      }),

    setWordStatus: (wordId, status) =>
      set((s) => {
        const learn = { ...s.learn };
        const prev = learn[wordId] ?? { status: 'new' as WordStatus, nextReviewDay: 0, collected: false };
        learn[wordId] = { ...prev, status };
        return { learn };
      }),

    finishGroup: (kind) =>
      set((s) => {
        const today = { ...s.today };
        let coinGain: number;
        if (kind === 'review') {
          today.reviewDone += 1;
          coinGain = today.reviewDone === 1 ? 14 : 8;
        } else {
          today.newDone += 1;
          coinGain = 15;
        }
        return { today, coins: s.coins + coinGain };
      }),

    addReviewGroup: () => set((s) => ({ today: { ...s.today, reviewTarget: s.today.reviewTarget + 1 } })),

    claimTask: (taskId) =>
      set((s) => {
        if (s.claimedTasks.includes(taskId)) return {};
        const reward = TASK_REWARD[taskId] ?? 0;
        return {
          claimedTasks: [...s.claimedTasks, taskId],
          coins: s.coins + reward,
          stars: Math.min(3, s.stars + 1),
          _temp: { ...s._temp, toast: `铜板 +${reward}`, toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    equipProtect: () =>
      set((s) => (s.protectEquipped >= 2 ? {} : { protectEquipped: s.protectEquipped + 1 })),

    setDailyGroups: (n) => set(() => ({ dailyGroups: n })),

    pickCurrentBook: (bookId) =>
      set((s) => {
        const book = s.books.find((b) => b.id === bookId);
        if (!book || !book.added) return {};
        return { currentBookId: bookId };
      }),

    addBook: (bookId) =>
      set((s) => ({
        books: s.books.map((b) => (b.id === bookId ? { ...b, added: true } : b)),
        _temp: { ...s._temp, toast: '已添加', toastSeq: s._temp.toastSeq + 1 },
      })),

    removeBook: (bookId) =>
      set((s) => {
        if (bookId === s.currentBookId) return {};
        return { books: s.books.map((b) => (b.id === bookId ? { ...b, added: false } : b)) };
      }),

    addWordbook: (name) =>
      set((s) => {
        const clean = name.trim().slice(0, 20);
        if (!clean) return { _temp: { ...s._temp, toast: '请输入单词本名称', toastSeq: s._temp.toastSeq + 1 } };
        if (s.wordbooks.length >= 3) return { _temp: { ...s._temp, toast: '最多创建 3 个单词本', toastSeq: s._temp.toastSeq + 1 } };
        if (s.wordbooks.some((wb) => wb.name === clean)) return { _temp: { ...s._temp, toast: '单词本名称已存在', toastSeq: s._temp.toastSeq + 1 } };
        return {
          wordbooks: [...s.wordbooks, { id: genId('wb'), name: clean, wordIds: [] }],
          _temp: { ...s._temp, toast: '单词本已创建', toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    renameWordbook: (bookId, name) =>
      set((s) => {
        const clean = name.trim().slice(0, 20);
        if (!clean) return { _temp: { ...s._temp, toast: '请输入单词本名称', toastSeq: s._temp.toastSeq + 1 } };
        if (s.wordbooks.some((wb) => wb.id !== bookId && wb.name === clean)) {
          return { _temp: { ...s._temp, toast: '单词本名称已存在', toastSeq: s._temp.toastSeq + 1 } };
        }
        return {
          wordbooks: s.wordbooks.map((wb) => (wb.id === bookId ? { ...wb, name: clean } : wb)),
          _temp: { ...s._temp, toast: '名称已更新', toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    deleteWordbook: (bookId) =>
      set((s) => {
        if (bookId === 'wb_collect') return { _temp: { ...s._temp, toast: '收藏的单词不可删除', toastSeq: s._temp.toastSeq + 1 } };
        return {
          wordbooks: s.wordbooks.filter((wb) => wb.id !== bookId),
          _temp: { ...s._temp, toast: '单词本已删除', toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    addWordsToWordbook: (bookId, wordIds) =>
      set((s) => {
        const adding = new Set(wordIds);
        const learn = bookId === 'wb_collect'
          ? Object.fromEntries(Object.entries(s.learn).map(([id, value]) => [id, adding.has(id) ? { ...value, collected: true } : value]))
          : s.learn;
        return {
          learn,
          wordbooks: s.wordbooks.map((wb) => wb.id === bookId
            ? { ...wb, wordIds: [...new Set([...wb.wordIds, ...wordIds])] }
            : wb),
          _temp: { ...s._temp, toast: `已添加 ${wordIds.length} 个单词`, toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    removeWordsFromWordbook: (bookId, wordIds) =>
      set((s) => {
        const removing = new Set(wordIds);
        const learn = bookId === 'wb_collect'
          ? Object.fromEntries(Object.entries(s.learn).map(([id, value]) => [id, removing.has(id) ? { ...value, collected: false } : value]))
          : s.learn;
        return {
          learn,
          wordbooks: s.wordbooks.map((wb) => wb.id === bookId
            ? { ...wb, wordIds: wb.wordIds.filter((id) => !removing.has(id)) }
            : wb),
          _temp: { ...s._temp, toast: `已移除 ${wordIds.length} 个单词`, toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    setWordSort: (order) => set((s) => ({ settings: { ...s.settings, wordSort: order } })),
    toggleAccent: () => set((s) => ({ settings: { ...s.settings, accent: s.settings.accent === 'us' ? 'uk' : 'us' } })),

    addToCart: (productId, spec) =>
      set((s) => {
        const existing = s.cart.find((c) => c.productId === productId && c.spec === spec);
        let cart: CartItem[];
        if (existing) {
          cart = s.cart.map((c) => (c === existing ? { ...c, qty: c.qty + 1 } : c));
        } else {
          cart = [...s.cart, { productId, qty: 1, spec, checked: true }];
        }
        return { cart, _temp: { ...s._temp, toast: '已加入购物车', toastSeq: s._temp.toastSeq + 1 } };
      }),

    setCartChecked: (productId, checked) =>
      set((s) => ({ cart: s.cart.map((c) => (c.productId === productId ? { ...c, checked } : c)) })),

    setCartQty: (productId, delta) =>
      set((s) => ({
        cart: s.cart
          .map((c) => (c.productId === productId ? { ...c, qty: c.qty + delta } : c))
          .filter((c) => c.qty > 0),
      })),

    setCartAllChecked: (checked) => set((s) => ({ cart: s.cart.map((c) => ({ ...c, checked })) })),
    setCartSpec: (productId, spec) =>
      set((s) => ({ cart: s.cart.map((c) => (c.productId === productId ? { ...c, spec } : c)) })),

    toggleOrderCoin: () => set((s) => ({ order: { ...s.order, useCoin: !s.order.useCoin } })),
    setPayMethod: (m) => set((s) => ({ order: { ...s.order, payMethod: m } })),
    setOrderNote: (note) => set((s) => ({ order: { ...s.order, note } })),

    addAddress: (a) =>
      set((s) => {
        const addr = { ...a, id: genId('addr') };
        const addresses = a.isDefault
          ? [addr, ...s.addresses.map((x) => ({ ...x, isDefault: false }))]
          : [...s.addresses, addr];
        return { addresses, _temp: { ...s._temp, toast: '已保存', toastSeq: s._temp.toastSeq + 1 } };
      }),

    /** 付款:直购项优先;否则结算购物车里勾选的商品 */
    placeOrder: () =>
      set((s) => {
        const db = s._temp.directBuy;
        if (db) {
          const p = s.products.find((x) => x.id === db.productId);
          if (!p) return {};
          const useCoin = s.order.useCoin && s.coins >= 100;
          const order = { id: genId('order'), items: [{ ...db }], total: Math.max(0, p.price * db.qty - (useCoin ? 1 : 0)), status: 'pending' as const };
          return {
            orders: [order, ...s.orders],
            coins: useCoin ? s.coins - 100 : s.coins,
            _temp: { ...s._temp, directBuy: null, toast: '下单成功', toastSeq: s._temp.toastSeq + 1 },
          };
        }
        const chosen = s.cart.filter((c) => c.checked);
        if (chosen.length === 0) return {};
        const total = chosen.reduce((n, c) => {
          const p = s.products.find((x) => x.id === c.productId);
          return n + (p ? p.price * c.qty : 0);
        }, 0);
        const useCoin = s.order.useCoin && s.coins >= 100;
        const order = {
          id: genId('order'),
          items: chosen.map((c) => ({ productId: c.productId, qty: c.qty, spec: c.spec })),
          total: Math.max(0, total - (useCoin ? 1 : 0)),
          status: 'pending' as const,
        };
        return {
          orders: [order, ...s.orders],
          cart: s.cart.filter((c) => !c.checked),
          coins: useCoin ? s.coins - 100 : s.coins,
          _temp: { ...s._temp, toast: '下单成功', toastSeq: s._temp.toastSeq + 1 },
        };
      }),

    /** 立即购买:只登记直购项,由确认订单页走地址+支付(Gate4v4) */
    buyNow: (productId, spec, qty = 1) =>
      set((s) => ({ _temp: { ...s._temp, directBuy: { productId, spec, qty } } })),

    rechargeCoins: (n) =>
      set((s) => ({ coins: s.coins + n, _temp: { ...s._temp, toast: `充值 ${n} 金币成功`, toastSeq: s._temp.toastSeq + 1 } })),

    toggleProductFavorite: (productId) =>
      set((s) => ({
        favoriteProductIds: s.favoriteProductIds.includes(productId)
          ? s.favoriteProductIds.filter((id) => id !== productId)
          : [...s.favoriteProductIds, productId],
      })),

    activatePro: (plan) =>
      set((s) => ({
        memberships: { ...s.memberships, proPlan: plan },
        _temp: { ...s._temp, toast: '会员已开通', toastSeq: s._temp.toastSeq + 1 },
      })),

    completeCourseLesson: (courseId, chapter) =>
      set((s) => ({
        courseProgress: {
          ...s.courseProgress,
          [courseId]: [...new Set([...(s.courseProgress[courseId] ?? []), chapter])],
        },
      })),

    setDictQuery: (q) => set((s) => ({ _temp: { ...s._temp, dictQuery: q } })),

    collectArticleWord: (text) =>
      set((s) => {
        const key = text.trim().toLowerCase();
        let words = s.words;
        let target = s.words.find((w) => w.word.toLowerCase() === key);
        if (!target) {
          target = {
            id: genId('aw'), word: text.trim(), phonetic: '', pos: '', meaning: '(阅读收藏)',
            options: [], sentence: '', sentenceCn: '', image: '',
          };
          words = [...s.words, target];
        }
        const learn = { ...s.learn, [target.id]: { ...(s.learn[target.id] ?? { status: 'new' as WordStatus, nextReviewDay: 0, collected: false }), collected: true } };
        const wordbooks = s.wordbooks.map((wb) => (wb.id === 'wb_collect' && !wb.wordIds.includes(target!.id)
          ? { ...wb, wordIds: [...wb.wordIds, target!.id] } : wb));
        return { words, learn, wordbooks, _temp: { ...s._temp, toast: '保存成功', toastSeq: s._temp.toastSeq + 1 } };
      }),

    markArticleRead: (articleId) =>
      set((s) => {
        if (s.readArticleIds.includes(articleId)) return {};
        const article = s.articles.find((item) => item.id === articleId);
        if (!article) return {};
        return {
          readArticleIds: [...s.readArticleIds, articleId],
          readChars: s.readChars + article.wordCount,
        };
      }),
    addToShelf: (articleIds) =>
      set((s) => {
        const validIds = articleIds.filter((id) => s.articles.some((article) => article.id === id));
        return { shelf: [...new Set([...s.shelf, ...validIds])] };
      }),
    generateReadPlan: (option, minutes) =>
      set((s) => ({ readPlan: { option, minutes, articleIds: s.articles.map((article) => article.id) } })),
    activateReadMembership: () =>
      set((s) => ({
        memberships: { ...s.memberships, readActive: true },
        _temp: { ...s._temp, toast: '阅读会员已开通', toastSeq: s._temp.toastSeq + 1 },
      })),
    registerReadCamp: (level) =>
      set((s) => ({
        readCampLevel: level,
        _temp: { ...s._temp, toast: '报名成功', toastSeq: s._temp.toastSeq + 1 },
      })),

    toggleSound: () => set((s) => ({ settings: { ...s.settings, sound: !s.settings.sound } })),
    toggleVibrate: () => set((s) => ({ settings: { ...s.settings, vibrate: !s.settings.vibrate } })),
    togglePushMaster: () => set((s) => ({ settings: { ...s.settings, pushMaster: !s.settings.pushMaster } })),
    togglePush: (key) =>
      set((s) => ({ settings: { ...s.settings, push: { ...s.settings.push, [key]: !s.settings.push[key] } } })),
    togglePersonalize: () => set((s) => ({ settings: { ...s.settings, personalizePush: !s.settings.personalizePush } })),
    setIdentity: (role) =>
      set((s) => ({
        settings: { ...s.settings, identity: role },
        profile: { ...s.profile },
      })),
    logout: () => set((s) => ({ _temp: { ...s._temp, toast: '已退出(演示)', toastSeq: s._temp.toastSeq + 1 } })),
  }),
  {
    // 存档迁移(§坑四):没有这段,改了 defaults.json 也只对全新用户生效,
    // 老 localStorage 会一直喂回旧值。
    afterHydration: () => {
      queueMicrotask(() => {
        const s = useBaicizhanStore.getState();
        if (s._dataVersion !== DATA_VERSION) {
          useBaicizhanStore.setState({ ...initialState });
        }
      });
    },
  },
);

// --- selectors(纯函数,组件内计算派生值,避免 store getter 返回新引用) ---
export function collectedCount(s: FullState): number {
  return s.wordbooks.find((w) => w.id === 'wb_collect')?.wordIds.length ?? 0;
}
export function cartCount(s: FullState): number {
  return s.cart.reduce((n, c) => n + c.qty, 0);
}

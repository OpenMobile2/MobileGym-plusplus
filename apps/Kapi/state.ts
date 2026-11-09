import { createAppStoreWithActions } from '@/os/createAppStore';
import * as TimeService from '@/os/TimeService';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { KAPI_CONFIG } from './data';
import type { KapiState, KapiActions, BillDraft, KapiDraft, FlowType } from './types';

let seq = 0;
const genId = (prefix: string) => `${prefix}_${TimeService.now()}_${seq++}`;

/** 求值金额表达式(仅支持数字、小数点、+ −) */
function evalAmount(expr: string): number {
  const cleaned = expr.replace(/[^0-9.+-]/g, '');
  if (!cleaned) return 0;
  const terms = cleaned.match(/[+-]?[0-9.]+/g) ?? [];
  const sum = terms.reduce((acc, t) => acc + (parseFloat(t) || 0), 0);
  return Math.round(sum * 100) / 100;
}

function makeDraft(s: Pick<KapiState, 'categories' | 'currentLedgerId'>, type: FlowType): KapiDraft {
  const list = type === 'income' ? s.categories.income : s.categories.expense;
  const c = list[0];
  return {
    type,
    categoryId: c?.id ?? '',
    categoryName: c?.name ?? '',
    icon: c?.icon ?? 'IcCatOther',
    color: c?.color ?? '#AAB2C0',
    amountExpr: '',
    note: '',
    date: TimeService.now(),
    ledgerId: s.currentLedgerId,
    accountId: null,
    fromAccountId: null,
    toAccountId: null,
    discount: null,
  };
}

const baseState: KapiState = JSON.parse(JSON.stringify(KAPI_CONFIG));
const initialState: KapiState = {
  ...baseState,
  _activeBillId: null,
  _categoryTarget: 'record',
  _pickedCategoryId: null,
  _editContext: 'draft',
  _draft: makeDraft(baseState, 'expense'),
  _statsRange: null,
};

/** 胖咪脚本化回复(P2,不接真模型) */
function aiReply(input: string): string {
  if (/预算|剩余|可用/.test(input)) return '本月预算 ¥9000,目前已用约 ¥2699,剩余 ¥6300。按当前节奏,今日可用约 ¥235 哦~';
  if (/分析|复盘|总结/.test(input)) return '本月支出里「餐饮」占比最高(约53%),其次是休闲娱乐。要不要试试每周设一天「极简日」?';
  if (/MBTI|性格|测试/.test(input)) return '根据你的消费记录,你大概是「享受当下型 ENFP」:爱给生活加点甜,奶茶咖啡从不亏待自己 🧋';
  if (/手账|记录/.test(input)) return '今日手账:3 笔支出共 ¥101.20,关键词「午餐、奶茶、通勤」。平凡而充实的一天~';
  return '收到!我可以帮你复盘消费、查预算、做趣味测试,描述得越具体我答得越准哦~';
}

export const useKapiStore = createAppStoreWithActions<KapiState, KapiActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    addBill: (draft: BillDraft) => {
      const id = genId('b');
      set((s) => ({ bills: [{ ...draft, id }, ...s.bills] }));
      return id;
    },
    deleteBill: (id) => set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),
    updateBill: (id, patch) =>
      set((s) => ({ bills: s.bills.map((b) => (b.id === id ? { ...b, ...patch } : b)) })),
    toggleBillFlag: (id, flag) =>
      set((s) => ({
        bills: s.bills.map((b) => (b.id === id ? { ...b, [flag]: !b[flag] } : b)),
      })),
    setActiveBill: (id) => set({ _activeBillId: id }),

    setCurrentLedger: (id) => set({ currentLedgerId: id }),
    addLedger: (draft) => {
      const id = genId('l');
      set((s) => ({ ledgers: [...s.ledgers, { ...draft, id }] }));
      return id;
    },

    addAccount: (draft) => {
      const id = genId('acc');
      set((s) => ({ accounts: [...s.accounts, { ...draft, id }] }));
      return id;
    },

    setMonthlyBudget: (amount) => set((s) => ({ budget: { ...s.budget, monthly: amount } })),
    setDailyBudget: (dateKey, amount) =>
      set((s) => ({ budget: { ...s.budget, daily: { ...s.budget.daily, [dateKey]: amount } } })),
    addCategoryBudget: (categoryId, amount) =>
      set((s) => {
        const rest = s.budget.categories.filter((c) => c.categoryId !== categoryId);
        return { budget: { ...s.budget, categories: [...rest, { categoryId, amount }] } };
      }),

    addRule: (kind, keyword, categoryId, categoryName) =>
      set((s) => ({ rules: [...s.rules, { id: genId('r'), kind, keyword, categoryId, categoryName }] })),

    sendAiMessage: (text) => {
      const t = text.trim();
      if (!t) return;
      const now = TimeService.now();
      set((s) => ({
        aiMessages: [
          ...s.aiMessages,
          { id: genId('m'), role: 'user', text: t, ts: now },
          { id: genId('m'), role: 'ai', text: aiReply(t), ts: now + 1 },
        ],
      }));
    },

    toggleAmountVisible: () => set((s) => ({ amountVisible: !s.amountVisible })),
    setTopCardView: (view) => set({ topCardView: view }),

    toggleSettingFlag: (key) =>
      set((s) => ({ settings: { ...s.settings, flags: { ...s.settings.flags, [key]: !s.settings.flags[key] } } })),
    togglePushItem: (key) =>
      set((s) => ({ settings: { ...s.settings, pushItems: { ...s.settings.pushItems, [key]: !s.settings.pushItems[key] } } })),
    updateProfile: (field, value) => set((s) => ({ user: { ...s.user, [field]: value } })),
    purgeAllBills: () => set({ bills: [] }),

    addSearchHistory: (q) => {
      const word = q.trim();
      if (!word) return;
      set((s) => ({ searchHistory: [word, ...s.searchHistory.filter((w) => w !== word)].slice(0, 10) }));
    },

    draftReset: (type) => set((s) => ({ _draft: makeDraft(s, type ?? s._draft.type) })),
    draftPatch: (patch) => set((s) => ({ _draft: { ...s._draft, ...patch } })),
    draftAmountKey: (key) =>
      set((s) => {
        let expr = s._draft.amountExpr;
        if (key === 'del') expr = expr.slice(0, -1);
        else if (key === '+' || key === '-') {
          if (expr && !/[+-]$/.test(expr)) expr += key;
        } else if (key === '.') {
          const last = expr.split(/[+-]/).pop() ?? '';
          if (!last.includes('.')) expr += expr ? '.' : '0.';
        } else {
          expr += key;
        }
        return { _draft: { ...s._draft, amountExpr: expr } };
      }),
    draftCommit: () => {
      const d = get()._draft;
      const amount = evalAmount(d.amountExpr);
      if (amount <= 0) return null;
      const id = genId('b');
      const bill = {
        id,
        type: d.type,
        categoryId: d.categoryId,
        categoryName: d.categoryName,
        icon: d.icon,
        color: d.color,
        amount,
        note: d.note,
        date: d.date,
        ledgerId: d.ledgerId,
        accountId: d.accountId,
        fromAccountId: d.fromAccountId,
        toAccountId: d.toAccountId,
        payee: '',
        tags: [] as string[],
        discount: d.discount,
        refund: null,
        reimburse: false,
        excludeFlow: false,
        excludeBudget: false,
      };
      set((s) => ({ bills: [bill, ...s.bills] }));
      return id;
    },
    setEditContext: (ctx) => set({ _editContext: ctx }),
    applyAttr: (patch) =>
      set((s) => {
        if (s._editContext === 'bill' && s._activeBillId) {
          return { bills: s.bills.map((b) => (b.id === s._activeBillId ? { ...b, ...patch } : b)) };
        }
        return { _draft: { ...s._draft, ...patch } };
      }),
    setCategoryTarget: (target) => set({ _categoryTarget: target }),
    pickCategory: (categoryId) =>
      set((s) => {
        const all = [...s.categories.expense, ...s.categories.income];
        const c = all.find((x) => x.id === categoryId);
        if (!c) return { _pickedCategoryId: categoryId };
        const fields = { categoryId: c.id, categoryName: c.name, icon: c.icon, color: c.color };
        if (s._categoryTarget !== 'record') return { _pickedCategoryId: categoryId };
        if (s._editContext === 'bill' && s._activeBillId) {
          return {
            _pickedCategoryId: categoryId,
            bills: s.bills.map((b) => (b.id === s._activeBillId ? { ...b, ...fields } : b)),
          };
        }
        return { _pickedCategoryId: categoryId, _draft: { ...s._draft, ...fields } };
      }),
    setStatsRange: (range) => set({ _statsRange: range }),
  }),
  { persistName: `${manifest.id}_v${DATA_VERSION}` },
);

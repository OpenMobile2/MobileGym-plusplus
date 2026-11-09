import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { XIAORICHANG_CONFIG } from './data';
import { DATA_VERSION } from './constants';
import { dateKeyAt, tsAt } from './utils/appTime';
import type {
  CheckinLog, CheckinStatus, FullState, Habit, Note, Reminder, SavedCard, Todo, Wish,
} from './types';

const C = XIAORICHANG_CONFIG;

const initialState: FullState = {
  _dataVersion: DATA_VERSION,
  user: { ...C.user },
  contexts: C.contexts.map((c) => ({ ...c })),
  habits: C.habits.map((h) => ({ ...h, createdAt: tsAt(-30) })),
  groups: C.groups.map((g) => ({ ...g })),
  logs: C.logs.map((l): CheckinLog => ({
    habitId: l.habitId,
    date: dateKeyAt(l.dayOffset),
    status: l.status,
    stamps: l.stamps.map((m) => tsAt(l.dayOffset, m)),
    note: l.note,
    quantity: l.quantity,
  })),
  glow: { ...C.glow },
  wishes: C.wishes.map((w) => ({ ...w })),
  notes: C.notes.map((n): Note => ({
    id: n.id, title: n.title, body: n.body, color: n.color,
    createdAt: tsAt(n.dayOffset, n.minuteOfDay),
  })),
  todos: C.todos.map((t): Todo => ({
    id: t.id, title: t.title, done: t.done, order: t.order,
    dueAt: t.dueDayOffset === undefined ? undefined : tsAt(t.dueDayOffset, 0),
    doneAt: t.doneDayOffset === undefined ? undefined : tsAt(t.doneDayOffset, 720),
  })),
  records: C.records.map((r) => ({
    id: r.id,
    habitId: r.habitId ?? undefined,
    startTs: tsAt(r.dayOffset, r.startMinute),
    endTs: tsAt(r.dayOffset, r.startMinute + r.minutes),
    minutes: r.minutes,
    note: r.note,
  })),
  cards: C.cards.map((c) => ({ ...c })),
  settings: { ...C.settings, modules: C.settings.modules.map((m) => ({ ...m })) },
  _temp: {
    toast: '', toastSeq: 0, notice: '', noticeSeq: 0,
    glowToast: null, activeFocus: null, planning: false, draft: null,
  },
};

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

export interface AppActions {
  showToast: (msg: string) => void;
  showNotice: (msg: string) => void;
  dismissNotice: () => void;
  setPlanning: (on: boolean) => void;
  /** 跨路由共享的编辑草稿(打卡弹层 ↔ 全屏备注、习惯表单 ↔ 图标库) */
  setDraft: (patch: Record<string, unknown> | null) => void;

  /** 打卡三态。核心计分规则,由 R1/R2 录屏 + 官方打卡教程(s222)双向证实。 */
  setCheckin: (
    habitId: string,
    date: string,
    status: CheckinStatus,
    opts?: { note?: string; quantity?: number; stampTs?: number },
  ) => void;
  /** 习惯详情日历:点空白日期格 = 就地补打卡,无弹层(s231→s233) */
  calendarCheckin: (habitId: string, date: string) => void;

  addHabit: (h: Partial<Habit>) => string;
  updateHabit: (id: string, patch: Partial<Habit>) => void;
  archiveHabit: (id: string) => void;
  unarchiveHabit: (id: string) => void;
  deleteHabit: (id: string) => void;
  resetHabitData: (id: string) => void;
  toggleImportant: (id: string) => void;
  /** 情境内上/下移(裁定1:替代真机没有的重排拖拽) */
  moveHabit: (id: string, delta: number) => void;
  addContext: (name: string) => string;
  deleteContexts: (ids: string[]) => void;
  moveContext: (id: string, delta: number) => void;
  addGroup: (name: string, habitIds: string[], contextId?: string) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  updateTodo: (id: string, patch: Partial<Todo>) => void;
  addRecordManual: (minutes: number, habitId?: string) => void;
  addCustomDuration: (minutes: number) => void;
  removeCustomDuration: (minutes: number) => void;
  resetAllLogs: () => void;
  updateUser: (patch: Partial<FullState['user']>) => void;
  /** 习惯提醒(s245) */
  addReminder: (habitId: string, r: Omit<Reminder, 'id'>) => void;
  removeReminder: (habitId: string, reminderId: string) => void;
  /** 今日卡片 → 卡包(s242 → s250) */
  saveCard: (card: Omit<SavedCard, 'id'>) => void;
  /** 实验室 → 整点报时(s251) */
  toggleChimeHour: (hour: number) => void;
  /** 个性化 → 色板(s248) */
  addPalette: (colors: string[]) => void;

  addWish: (name: string, cost: number) => void;
  redeemWish: (id: string) => void;

  addNote: (body: string, title?: string, createdAt?: number) => void;
  deleteNote: (id: string) => void;

  addTodo: (title: string, patch?: Partial<Omit<Todo, 'id' | 'title' | 'done' | 'order'>>) => string;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;

  startFocus: (targetMin: number, countUp: boolean, habitId?: string) => void;
  stopFocus: (commit: boolean, note?: string) => void;

  updateSettings: (patch: Partial<FullState['settings']>) => void;
  moveModule: (id: string, delta: number) => void;
}

/** 完成 +reward;标记失败 −reward;待定 0。切换状态时先撤销旧状态的分值。 */
function glowDelta(habit: Habit, from: CheckinStatus | null, to: CheckinStatus | null): number {
  const val = (s: CheckinStatus | null) => (s === 'done' ? habit.reward : s === 'failed' ? -habit.reward : 0);
  return val(to) - val(from);
}

export const useXiaorichangStore = createAppStoreWithActions<FullState, AppActions>(
  'xiaorichang',
  initialState,
  (set, get) => ({
    // 普通 toast 必须清掉 glowToast,否则会渲染成上一次的光芒横幅
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, glowToast: null, toastSeq: s._temp.toastSeq + 1 } })),

    showNotice: (msg) =>
      set((s) => ({
        _temp: { ...s._temp, notice: msg, noticeSeq: (s._temp.noticeSeq ?? 0) + 1 },
      })),

    dismissNotice: () => set((s) => ({ _temp: { ...s._temp, notice: '' } })),

    setPlanning: (on) => set((s) => ({ _temp: { ...s._temp, planning: on } })),

    setDraft: (patch) =>
      set((s) => ({
        _temp: { ...s._temp, draft: patch === null ? null : { ...(s._temp.draft ?? {}), ...patch } },
      })),

    setCheckin: (habitId, date, status, opts) => {
      const habit = get().habits.find((h) => h.id === habitId);
      if (!habit) return;
      set((s) => {
        const idx = s.logs.findIndex((l) => l.habitId === habitId && l.date === date);
        const prev = idx >= 0 ? s.logs[idx] : null;
        const delta = glowDelta(habit, prev?.status ?? null, status);
        const logs = [...s.logs];
        // 打卡时间戳**追加不覆盖**(R1 录屏证明)
        const stamps = status === 'done'
          ? [...(prev?.stamps ?? []), opts?.stampTs ?? TimeService.now()]
          : (prev?.stamps ?? []);
        const next: CheckinLog = {
          habitId, date, status, stamps,
          note: opts?.note ?? prev?.note,
          quantity: opts?.quantity ?? prev?.quantity,
        };
        if (idx >= 0) logs[idx] = next; else logs.push(next);
        return {
          logs,
          glow: { ...s.glow, cumulative: s.glow.cumulative + delta },
          // R4:光芒变化弹的是顶部横幅(带习惯图标与名称),不是居中的黑色 toast
          _temp: delta === 0 ? s._temp : {
            ...s._temp,
            glowToast: { habitId, delta },
            toastSeq: s._temp.toastSeq + 1,
          },
        };
      });
    },

    calendarCheckin: (habitId, date) => {
      const existing = get().logs.find((l) => l.habitId === habitId && l.date === date);
      // 只建模「空格 → 补打卡」这一个方向。反向(点已填充格取消)真机未拍到,
      // 见 spec.openIssues.habit-detail-calendar-uncheck,阶段⑥ 走查确认后再补。
      if (existing?.status === 'done') return;
      get().setCheckin(habitId, date, 'done');
    },

    addHabit: (h) => {
      const id = genId('h');
      set((s) => ({
        habits: [...s.habits, {
          id,
          name: h.name?.trim() || '未命名习惯',
          icon: h.icon ?? 'IcCheck',
          color: h.color ?? '#B2967D',
          contextId: h.contextId ?? s.contexts[0]?.id ?? 'ctx_morning',
          reward: h.reward ?? 10,
          recurrence: h.recurrence ?? { kind: 'daily' },
          quantify: h.quantify,
          focusRequired: h.focusRequired ?? false,
          important: h.important ?? false,
          oneTap: h.oneTap ?? true,
          iconStyle: h.iconStyle ?? 'graphic',
          iconText: h.iconText,
          motivation: h.motivation,
          reminders: h.reminders,
          archived: false,
          order: s.habits.length,
          createdAt: TimeService.now(),
        }],
      }));
      return id;
    },

    updateHabit: (id, patch) =>
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)) })),

    // 归档:移出今日页与打卡管理,但历史打卡仍计入统计(Q12=A)
    archiveHabit: (id) =>
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, archived: true } : h)) })),
    unarchiveHabit: (id) =>
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, archived: false } : h)) })),

    deleteHabit: (id) =>
      set((s) => {
        const habit = s.habits.find((h) => h.id === id);
        if (!habit) return {};
        const removedGlow = s.logs
          .filter((l) => l.habitId === id)
          .reduce((sum, l) => sum + glowDelta(habit, null, l.status), 0);
        const cumulative = Math.max(0, s.glow.cumulative - removedGlow);
        return {
          habits: s.habits.filter((h) => h.id !== id),
          logs: s.logs.filter((l) => l.habitId !== id),
          groups: s.groups.map((g) => ({ ...g, habitIds: g.habitIds.filter((habitId) => habitId !== id) })),
          records: s.records.map((r) => r.habitId === id ? { ...r, habitId: undefined } : r),
          glow: { cumulative, redeemed: Math.min(s.glow.redeemed, cumulative) },
          _temp: s._temp.activeFocus?.habitId === id
            ? { ...s._temp, activeFocus: { ...s._temp.activeFocus, habitId: undefined } }
            : s._temp,
        };
      }),

    resetHabitData: (id) => set((s) => {
      const habit = s.habits.find((h) => h.id === id);
      if (!habit) return {};
      const removedGlow = s.logs
        .filter((l) => l.habitId === id)
        .reduce((sum, l) => sum + glowDelta(habit, null, l.status), 0);
      const cumulative = Math.max(0, s.glow.cumulative - removedGlow);
      return {
        logs: s.logs.filter((l) => l.habitId !== id),
        glow: { cumulative, redeemed: Math.min(s.glow.redeemed, cumulative) },
      };
    }),

    // ⚠ 与习惯详情 ♡ 是同一字段,不得拆成两个状态
    toggleImportant: (id) =>
      set((s) => ({ habits: s.habits.map((h) => (h.id === id ? { ...h, important: !h.important } : h)) })),

    moveHabit: (id, delta) =>
      set((s) => {
        const me = s.habits.find((h) => h.id === id);
        if (!me) return {};
        const peers = s.habits.filter((h) => h.contextId === me.contextId && !h.archived)
          .sort((a, b) => a.order - b.order);
        const i = peers.findIndex((h) => h.id === id);
        const j = i + delta;
        if (j < 0 || j >= peers.length) return {};
        const other = peers[j];
        return {
          habits: s.habits.map((h) =>
            h.id === me.id ? { ...h, order: other.order } : h.id === other.id ? { ...h, order: me.order } : h),
        };
      }),

    addContext: (name) => {
      const id = genId('ctx');
      set((s) => ({ contexts: [...s.contexts, { id, name: name.trim() || '新情境', order: s.contexts.length }] }));
      return id;
    },

    deleteContexts: (ids) =>
      set((s) => {
        let contexts = s.contexts.filter((c) => !ids.includes(c.id));
        if (contexts.length === 0) {
          contexts = [{ id: genId('ctx'), name: '晨间', order: 0 }];
        }
        const fallbackId = [...contexts].sort((a, b) => a.order - b.order)[0].id;
        return {
          contexts,
          habits: s.habits.map((h) => ids.includes(h.contextId) ? { ...h, contextId: fallbackId } : h),
          groups: s.groups.map((g) => g.contextId && ids.includes(g.contextId) ? { ...g, contextId: fallbackId } : g),
        };
      }),

    moveContext: (id, delta) =>
      set((s) => {
        const list = [...s.contexts].sort((a, b) => a.order - b.order);
        const i = list.findIndex((c) => c.id === id);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= list.length) return {};
        [list[i], list[j]] = [list[j], list[i]];
        return { contexts: list.map((c, k) => ({ ...c, order: k })) };
      }),

    addGroup: (name, habitIds, contextId) =>
      set((s) => ({ groups: [...s.groups, { id: genId('g'), name: name.trim() || '未命名习惯组', habitIds, contextId }] })),

    updateNote: (id, patch) =>
      set((s) => ({ notes: s.notes.map((n) => (n.id === id ? { ...n, ...patch } : n)) })),

    updateTodo: (id, patch) =>
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

    addRecordManual: (minutes, habitId) => {
      const endTs = TimeService.now();
      set((s) => ({
        records: [...s.records, {
          id: genId('r'), habitId, startTs: endTs - minutes * 60000, endTs, minutes,
        }],
      }));
    },

    addCustomDuration: (minutes) =>
      set((s) => ({
        settings: {
          ...s.settings,
          customDurations: s.settings.customDurations.includes(minutes)
            ? s.settings.customDurations
            : [...s.settings.customDurations, minutes],
        },
      })),

    removeCustomDuration: (minutes) =>
      set((s) => ({
        settings: { ...s.settings, customDurations: s.settings.customDurations.filter((m) => m !== minutes) },
      })),

    resetAllLogs: () => set(() => ({ logs: [], glow: { cumulative: 0, redeemed: 0 } })),

    updateUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

    addReminder: (habitId, r) =>
      set((s) => ({
        habits: s.habits.map((h) =>
          h.id === habitId ? { ...h, reminders: [...(h.reminders ?? []), { ...r, id: genId('rm') }] } : h),
      })),

    removeReminder: (habitId, reminderId) =>
      set((s) => ({
        habits: s.habits.map((h) =>
          h.id === habitId ? { ...h, reminders: (h.reminders ?? []).filter((x) => x.id !== reminderId) } : h),
      })),

    saveCard: (card) => set((s) => ({ cards: [{ ...card, id: genId('c') }, ...s.cards] })),

    toggleChimeHour: (hour) =>
      set((s) => ({
        settings: {
          ...s.settings,
          chimeHours: s.settings.chimeHours.includes(hour)
            ? s.settings.chimeHours.filter((h) => h !== hour)
            : [...s.settings.chimeHours, hour].sort((a, b) => a - b),
        },
      })),

    addPalette: (colors) =>
      set((s) => {
        const id = genId('pal');
        return {
          settings: {
            ...s.settings,
            customPalettes: [...s.settings.customPalettes, { id, colors }],
            paletteId: id,
          },
        };
      }),

    addWish: (name, cost) =>
      set((s) => ({ wishes: [...s.wishes, { id: genId('w'), name: name.trim() || '未命名心愿', cost }] })),

    redeemWish: (id) => {
      const s0 = get();
      const wish = s0.wishes.find((w) => w.id === id);
      if (!wish || wish.redeemedAt) return;
      const available = s0.glow.cumulative - s0.glow.redeemed;
      if (available < wish.cost) {
        get().showToast('可用光芒不足');
        return;
      }
      set((s) => ({
        glow: { ...s.glow, redeemed: s.glow.redeemed + wish.cost },
        wishes: s.wishes.map((w) => (w.id === id ? { ...w, redeemedAt: TimeService.now() } : w)),
      }));
    },

    addNote: (body, title, createdAt) =>
      set((s) => ({
        notes: [{ id: genId('n'), title, body, color: '#F7CE45', createdAt: createdAt ?? TimeService.now() }, ...s.notes],
      })),
    deleteNote: (id) => set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

    addTodo: (title, patch) => {
      const id = genId('t');
      set((s) => ({
        todos: [...s.todos, {
          id, title: title.trim() || '未命名小事', done: false, order: s.todos.length, ...patch,
        }],
      }));
      return id;
    },

    // Q11:小事完成**不进**光芒值体系
    toggleTodo: (id) =>
      set((s) => ({
        todos: s.todos.map((t) =>
          t.id === id ? { ...t, done: !t.done, doneAt: t.done ? undefined : TimeService.now() } : t),
      })),
    deleteTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

    startFocus: (targetMin, countUp, habitId) =>
      set((s) => ({ _temp: { ...s._temp, activeFocus: { startTs: TimeService.now(), targetMin, countUp, habitId } } })),

    stopFocus: (commit, note) => {
      const af = get()._temp.activeFocus;
      if (!af) return;
      const endTs = TimeService.now();
      const minutes = Math.floor((endTs - af.startTs) / 60000);
      // 低于 1 分钟直接作废,不写记录(R3 录屏证明)
      if (!commit || minutes < 1) {
        set((s) => ({ _temp: { ...s._temp, activeFocus: null } }));
        return;
      }
      set((s) => ({
        records: [...s.records, { id: genId('r'), habitId: af.habitId, startTs: af.startTs, endTs, minutes, note }],
        _temp: { ...s._temp, activeFocus: null },
      }));
      // ⚠ 专注结束**不自动打卡、不加光芒值**(Q8 冲突,操作者裁定「按照截图来」)。
      // 专注时长只进习惯详情的「专注 Xm」数据块。
    },

    updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

    moveModule: (id, delta) =>
      set((s) => {
        const mods = [...s.settings.modules].sort((a, b) => a.order - b.order);
        const i = mods.findIndex((m) => m.id === id);
        const j = i + delta;
        if (i < 0 || j < 0 || j >= mods.length) return {};
        [mods[i], mods[j]] = [mods[j], mods[i]];
        return { settings: { ...s.settings, modules: mods.map((m, k) => ({ ...m, order: k })) } };
      }),
  }),
  {
    /**
     * 存档迁移。没有这段的话,改了 defaults.json 也只对**全新用户**生效 ——
     * 老 localStorage 会一直喂回旧值。
     * (Gate4 实测踩过:hideCompleted 默认值改了,但装过旧版的浏览器里打卡后习惯不消失。)
     */
    afterHydration: () => {
      queueMicrotask(() => {
        const s = useXiaorichangStore.getState();
        if (s._dataVersion !== DATA_VERSION) {
          useXiaorichangStore.setState({ ...initialState });
        }
      });
    },
  },
);

/** 可用光芒 = 累计 − 已兑换(s219 三字段模型) */
export function selectAvailableGlow(s: FullState): number {
  return s.glow.cumulative - s.glow.redeemed;
}

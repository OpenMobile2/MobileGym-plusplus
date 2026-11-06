import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { DAY_MS, getAppTodayMs, narrativeNow, remapSeedTs } from './utils/appTime';
import { FANQIETODO_CONFIG } from './data';
import { DATA_VERSION, SEED_TAG } from './constants';
import type { FullState, Todo, FocusRecord, FutureCountdown, Settings, UserInfo } from './types';

/** 每次调用把最新种子记录重映射到「昨天」,其余历史记录保持原有日间距 */
function buildSeedState(): FullState {
  const latestSeedDay = getAppTodayMs() - DAY_MS;
  return {
    _dataVersion: DATA_VERSION,
    _seedTag: SEED_TAG,
    user: { ...FANQIETODO_CONFIG.user },
    todos: FANQIETODO_CONFIG.todos.map((t) => ({ ...t })),
    records: FANQIETODO_CONFIG.records.map((r) => ({
      ...r,
      startTs: remapSeedTs(r.startTs, latestSeedDay),
      endTs: remapSeedTs(r.endTs, latestSeedDay),
    })),
    futures: FANQIETODO_CONFIG.futures.map((f) => ({ ...f })),
    settings: { ...FANQIETODO_CONFIG.settings },
    stats: { ...FANQIETODO_CONFIG.stats },
    taskAudit: {},
    _temp: { toast: '', toastSeq: 0, activeFocus: null, draft: null },
  } as FullState;
}

const initialState: FullState = buildSeedState();

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

export const useFanqieTodoStore = createAppStoreWithActions<FullState, import('./types').AppActions>(
  'fanqietodo',
  initialState,
  (set) => ({
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),

    setDraft: (patch) => set((s) => ({ _temp: { ...s._temp, draft: patch } })),
    recordTaskAudit: (patch) => set((s) => ({ taskAudit: { ...s.taskAudit, ...patch } })),

    addTodo: (t: Partial<Todo>) => {
      const id = genId('t');
      set((s) => {
        const todo: Todo = {
          id,
          name: t.name && t.name.trim() ? t.name.trim() : '未命名待办',
          type: t.type ?? 'normal',
          timing: t.timing ?? 'countdown',
          durationMin: t.durationMin ?? 25,
          bgKey: t.bgKey ?? 'snow',
          bgColor: t.bgColor ?? '#9FB2C4',
          order: s.todos.length,
          todayFocusCount: 0,
          todayDoneCount: 0,
          habitTodayMin: t.type === 'habit' ? 0 : undefined,
          habitTargetMin: t.habitTargetMin,
          frequency: t.frequency,
          goalDate: t.goalDate,
          goalHours: t.goalHours,
          note: t.note,
          hideNextDay: t.hideNextDay,
          loops: t.loops,
          restTimeMin: t.restTimeMin,
        };
        return { todos: [...s.todos, todo] };
      });
      return id;
    },

    updateTodo: (id, patch) =>
      set((s) => ({ todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

    deleteTodo: (id) => set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

    moveTodoToTop: (id) =>
      set((s) => {
        const target = s.todos.find((t) => t.id === id);
        if (!target) return {} as Partial<FullState>;
        const rest = s.todos.filter((t) => t.id !== id);
        return { todos: [target, ...rest].map((t, i) => ({ ...t, order: i })) };
      }),

    reorderTodos: (ids) =>
      set((s) => {
        const byId = new Map(s.todos.map((t) => [t.id, t]));
        const next = ids.map((id) => byId.get(id)).filter(Boolean) as Todo[];
        // 补上未列出的
        for (const t of s.todos) if (!ids.includes(t.id)) next.push(t);
        return { todos: next.map((t, i) => ({ ...t, order: i })) };
      }),

    completeTodoOnce: (id) =>
      set((s) => {
        const now = narrativeNow();
        const todo = s.todos.find((t) => t.id === id);
        const rec: FocusRecord = {
          id: genId('r'),
          todoId: id,
          todoName: todo?.name ?? '',
          startTs: now,
          endTs: now,
          durationMin: 0,
          status: 'done',
        };
        return {
          todos: s.todos.map((t) => (t.id === id ? { ...t, todayDoneCount: t.todayDoneCount + 1 } : t)),
          records: [rec, ...s.records],
          stats: { ...s.stats, totalCount: s.stats.totalCount + 1 },
        };
      }),

    finishFocus: (todoId, durationMin) => {
      const id = genId('r');
      set((s) => {
        const now = narrativeNow();
        const todo = s.todos.find((t) => t.id === todoId);
        const rec: FocusRecord = {
          id,
          todoId,
          todoName: todo?.name ?? '',
          startTs: s._temp.activeFocus?.startTs ?? now - durationMin * 60000,
          endTs: now,
          durationMin,
          status: 'done',
          percent: todo?.type === 'habit' && todo.habitTargetMin
            ? Math.min(100, Math.round(((todo.habitTodayMin ?? 0) + durationMin) / todo.habitTargetMin * 100))
            : undefined,
        };
        return {
          records: [rec, ...s.records],
          todos: s.todos.map((t) =>
            t.id === todoId
              ? {
                  ...t,
                  todayFocusCount: t.todayFocusCount + 1,
                  habitTodayMin: t.type === 'habit' ? (t.habitTodayMin ?? 0) + durationMin : t.habitTodayMin,
                }
              : t,
          ),
          stats: {
            ...s.stats,
            totalCount: s.stats.totalCount + 1,
            totalMinutes: s.stats.totalMinutes + durationMin,
          },
          _temp: { ...s._temp, activeFocus: null },
        };
      });
      return id;
    },

    addRecordNote: (recordId, reflection) =>
      set((s) => ({
        records: s.records.map((r) => (r.id === recordId ? { ...r, reflection } : r)),
      })),

    updateRecord: (recordId, patch) =>
      set((s) => ({
        records: s.records.map((r) => (r.id === recordId ? { ...r, ...patch } : r)),
      })),

    deleteRecord: (id) => set((s) => ({ records: s.records.filter((r) => r.id !== id) })),

    /** 时间轴补记专注(手动添加,不参与自习室排名) */
    addManualRecord: (input: { todoId: string; startTs: number; durationMin: number }) => {
      const id = genId('r');
      set((s) => {
        const todo = s.todos.find((t) => t.id === input.todoId);
        const durationMin = Math.max(0, Math.min(480, Math.round(input.durationMin)));
        const rec: FocusRecord = {
          id,
          todoId: input.todoId,
          todoName: todo?.name ?? '',
          startTs: input.startTs,
          endTs: input.startTs + durationMin * 60000,
          durationMin,
          status: 'done',
          percent: 100,
        };
        return {
          records: [rec, ...s.records],
          stats: {
            ...s.stats,
            totalCount: s.stats.totalCount + 1,
            totalMinutes: s.stats.totalMinutes + durationMin,
          },
        };
      });
      return id;
    },

    addFuture: (f: Partial<FutureCountdown>) => {
      const id = genId('f');
      set((s) => ({
        futures: [
          ...s.futures,
          {
            id,
            name: f.name && f.name.trim() ? f.name.trim() : '未命名',
            remark: f.remark ?? '',
            targetDate: f.targetDate ?? TimeService.now(),
          },
        ],
      }));
      return id;
    },

    deleteFuture: (id) => set((s) => ({ futures: s.futures.filter((f) => f.id !== id) })),

    toggleSetting: (key: keyof Settings) =>
      set((s) => ({ settings: { ...s.settings, [key]: !s.settings[key] } as Settings })),

    setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

    setUser: (patch: Partial<UserInfo>) => set((s) => ({ user: { ...s.user, ...patch } })),

    incMonthlyLockExit: () =>
      set((s) => ({ stats: { ...s.stats, monthlyLockExit: s.stats.monthlyLockExit + 1 } })),
  }),
  {
    afterHydration: () => {
      queueMicrotask(() => {
        const s = useFanqieTodoStore.getState();
        // 版本/种子指纹不一致时强制重种(含跨月更早数据)
        if (s._dataVersion !== DATA_VERSION || s._seedTag !== SEED_TAG) {
          useFanqieTodoStore.setState({ ...buildSeedState() });
        }
      });
    },
  },
);

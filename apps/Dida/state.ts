import { createAppStoreWithActions } from '../../os/createAppStore';
import * as TimeService from '../../os/TimeService';
import { DIDA_CONFIG } from './data';
import { DATA_VERSION } from './constants';
import type { FullState, AppActions, Task, TaskList, FocusRecord } from './types';

/** 由「相对天数 + 当天分钟」构造 simulated ts */
function dayTs(offsetDays: number, timeMin: number | null): number {
  const d = TimeService.getDate();
  const h = timeMin === null ? 0 : Math.floor(timeMin / 60);
  const m = timeMin === null ? 0 : timeMin % 60;
  return TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate() + offsetDays, h, m).getTime();
}

function buildInitialState(): FullState {
  const now = TimeService.now();
  const tasks: Task[] = DIDA_CONFIG.tasks.map((raw, i) => ({
    id: raw.id,
    title: raw.title,
    note: raw.note,
    listId: raw.listId,
    priority: raw.priority,
    quadrant: raw.quadrant,
    dueTs: raw.dueOffsetDays === null ? null : dayTs(raw.dueOffsetDays, raw.dueTimeMin),
    hasTime: raw.dueTimeMin !== null,
    reminder: raw.reminder,
    repeat: raw.repeat,
    tags: [...raw.tags],
    subtasks: raw.subtasks.map((s) => ({ ...s })),
    completed: raw.completed,
    completedAt: raw.completed ? dayTs(0, null) : null,
    pinned: raw.pinned ?? false,
    order: i,
    createdAt: now,
  }));
  const records: FocusRecord[] = DIDA_CONFIG.records.map((raw) => {
    const startTs = dayTs(raw.dayOffset, raw.startMin);
    return {
      id: raw.id,
      taskId: null,
      taskName: raw.taskName,
      startTs,
      endTs: startTs + raw.durationMin * 60000,
      durationMin: raw.durationMin,
      type: raw.type,
    };
  });
  const lists: TaskList[] = DIDA_CONFIG.lists.map((l) => ({
    id: l.id, name: l.name, color: l.color, icon: l.icon, kind: l.kind,
  }));
  return {
    _dataVersion: DATA_VERSION,
    user: { ...DIDA_CONFIG.user },
    lists,
    tasks,
    records,
    settings: { ...DIDA_CONFIG.settings },
    stats: { ...DIDA_CONFIG.stats },
    currentListId: 'today',
    _temp: { toast: '', toastSeq: 0, activeFocus: null },
  };
}

const initialState = buildInitialState();

let idCounter = 0;
function genId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${TimeService.now().toString(36)}_${idCounter}`;
}

export const useDidaStore = createAppStoreWithActions<FullState, AppActions>(
  'dida',
  initialState,
  (set) => ({
    showToast: (msg) =>
      set((s) => ({ _temp: { ...s._temp, toast: msg, toastSeq: s._temp.toastSeq + 1 } })),

    setCurrentList: (listId) => set(() => ({ currentListId: listId })),

    addTask: (patch) => {
      const id = genId('t');
      set((s) => {
        const task: Task = {
          id,
          title: patch.title && patch.title.trim() ? patch.title.trim() : '未命名任务',
          note: patch.note ?? '',
          listId: patch.listId ?? (s.currentListId === 'today' || s.currentListId === 'completed' ? 'inbox' : s.currentListId),
          priority: patch.priority ?? 'none',
          quadrant: patch.quadrant ?? 4,
          dueTs: patch.dueTs ?? null,
          hasTime: patch.hasTime ?? false,
          reminder: patch.reminder ?? null,
          repeat: patch.repeat ?? null,
          tags: patch.tags ?? [],
          subtasks: patch.subtasks ?? [],
          completed: false,
          completedAt: null,
          pinned: false,
          order: s.tasks.length,
          createdAt: TimeService.now(),
        };
        return { tasks: [task, ...s.tasks] };
      });
      return id;
    },

    updateTask: (id, patch) =>
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),

    deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

    toggleComplete: (id) =>
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === id
            ? { ...t, completed: !t.completed, completedAt: !t.completed ? TimeService.now() : null }
            : t,
        ),
      })),

    togglePin: (id) =>
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)) })),

    addSubtask: (taskId, title) =>
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...t.subtasks, { id: genId('s'), title: title.trim() || '子任务', done: false }] }
            : t,
        ),
      })),

    toggleSubtask: (taskId, subId) =>
      set((s) => ({
        tasks: s.tasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: t.subtasks.map((sub) => (sub.id === subId ? { ...sub, done: !sub.done } : sub)) }
            : t,
        ),
      })),

    startFocus: (type, taskId) =>
      set((s) => ({
        _temp: {
          ...s._temp,
          activeFocus: { type, taskId, startedRealTs: TimeService.realNow(), accumSec: 0, paused: false },
        },
      })),

    pauseFocus: () =>
      set((s) => {
        const af = s._temp.activeFocus;
        if (!af || af.paused) return {} as Partial<FullState>;
        const acc = af.accumSec + (TimeService.realNow() - af.startedRealTs) / 1000;
        return { _temp: { ...s._temp, activeFocus: { ...af, accumSec: acc, paused: true } } };
      }),

    resumeFocus: () =>
      set((s) => {
        const af = s._temp.activeFocus;
        if (!af || !af.paused) return {} as Partial<FullState>;
        return { _temp: { ...s._temp, activeFocus: { ...af, startedRealTs: TimeService.realNow(), paused: false } } };
      }),

    stopFocus: () => {
      const id = genId('r');
      set((s) => {
        const af = s._temp.activeFocus;
        if (!af) return {} as Partial<FullState>;
        const elapsedSec = af.paused ? af.accumSec : af.accumSec + (TimeService.realNow() - af.startedRealTs) / 1000;
        const durationMin = Math.max(0, Math.round(elapsedSec / 60));
        const now = TimeService.now();
        const rec: FocusRecord = {
          id,
          taskId: af.taskId,
          taskName: af.taskId ? s.tasks.find((t) => t.id === af.taskId)?.title ?? '专注' : '专注',
          startTs: now - durationMin * 60000,
          endTs: now,
          durationMin,
          type: af.type,
        };
        return {
          records: [rec, ...s.records],
          stats: {
            totalFocusMin: s.stats.totalFocusMin + durationMin,
            totalPomo: s.stats.totalPomo + (af.type === 'pomo' ? 1 : 0),
          },
          _temp: { ...s._temp, activeFocus: null },
        };
      });
    },

    setUser: (patch) => set((s) => ({ user: { ...s.user, ...patch } })),

    setSetting: (key, value) => set((s) => ({ settings: { ...s.settings, [key]: value } })),

    login: () => set((s) => ({ user: { ...s.user, loggedIn: true } })),

    logout: () => set((s) => ({ user: { ...s.user, loggedIn: false } })),
  }),
  {
    afterHydration: () => {
      queueMicrotask(() => {
        const s = useDidaStore.getState();
        if (s._dataVersion !== DATA_VERSION) {
          useDidaStore.setState({ ...buildInitialState() });
        }
      });
    },
  },
);

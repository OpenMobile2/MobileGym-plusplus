import { useDidaStore } from '@/apps/Dida/state';
import { QUADRANT_CREATE_DEFAULTS } from '@/apps/Dida/constants';
import type { Priority, Quadrant, Task } from '@/apps/Dida/types';
import * as TimeService from '@/os/TimeService';
import { assertAllowedKeys, optionalBoolean, optionalString, requireString, ToolExecutionError } from '../../core/errors';
import { compactResult, getLimit, includesQuery, requireFound } from '../../core/helpers';
import { openAppRoute } from '../../core/navigation';
import type { JsonObject, ToolHandler } from '../../core/types';
import { DIDA_TOOL_DEFINITIONS } from './definitions';

const state = () => useDidaStore.getState();
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const LIST_IDS = ['inbox', 'welcome', 'life'] as const;
const PRIORITIES = ['none', 'low', 'medium', 'high'] as const;

function formatDate(ts: number | null): string | null {
  if (ts === null) return null;
  const d = TimeService.fromTimestamp(ts);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

function isSameDay(ts: number, now: number): boolean {
  const a = TimeService.fromTimestamp(ts);
  const b = TimeService.fromTimestamp(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function parseDueDate(raw: string): number {
  if (!DATE_RE.test(raw)) {
    throw new ToolExecutionError('INVALID_ARGUMENT', '"due_date" must use YYYY-MM-DD format.');
  }
  const [year, month, day] = raw.split('-').map(Number);
  return TimeService.fromLocalParts(year, month - 1, day).getTime();
}

function optionalQuadrant(input: JsonObject): Quadrant | undefined {
  const value = input.quadrant;
  if (value === undefined || value === null) return undefined;
  if (value !== 1 && value !== 2 && value !== 3 && value !== 4) {
    throw new ToolExecutionError('INVALID_ARGUMENT', '"quadrant" must be one of: 1, 2, 3, 4.');
  }
  return value;
}

function optionalPriority(input: JsonObject): Priority | undefined {
  const raw = optionalString(input, 'priority', { maxLength: 20 });
  if (raw === undefined) return undefined;
  if (!PRIORITIES.includes(raw as Priority)) {
    throw new ToolExecutionError('INVALID_ARGUMENT', '"priority" must be one of: none, low, medium, high.');
  }
  return raw as Priority;
}

function optionalListId(input: JsonObject): string | undefined {
  const raw = optionalString(input, 'list_id', { maxLength: 40 });
  if (raw === undefined) return undefined;
  if (!(LIST_IDS as readonly string[]).includes(raw)) {
    throw new ToolExecutionError('INVALID_ARGUMENT', '"list_id" must be one of: inbox, welcome, life.');
  }
  return raw;
}

function listName(listId: string): string {
  return state().lists.find((list) => list.id === listId)?.name ?? listId;
}

function taskSummary(task: Task) {
  return {
    task_id: task.id,
    title: task.title,
    list_id: task.listId,
    list_name: listName(task.listId),
    priority: task.priority,
    quadrant: task.quadrant,
    due_date: formatDate(task.dueTs),
    completed: task.completed,
    pinned: task.pinned,
  };
}

function taskById(id: string): Task {
  return requireFound(state().tasks.find((task) => task.id === id), 'TASK_NOT_FOUND', `Dida task not found: ${id}`);
}

const handlers: Record<string, ToolHandler> = {
  dida__search_tasks: (input) => {
    assertAllowedKeys(input, ['query', 'include_completed', 'limit']);
    const query = requireString(input, 'query', { maxLength: 200 });
    const includeCompleted = optionalBoolean(input, 'include_completed', false);
    const rows = state().tasks
      .filter((task) => includeCompleted || !task.completed)
      .filter((task) => includesQuery([task.title], query))
      .map(taskSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  dida__list_today_tasks: (input) => {
    assertAllowedKeys(input, ['limit']);
    const now = TimeService.now();
    const rows = state().tasks
      .filter((task) => !task.completed && task.dueTs !== null && (isSameDay(task.dueTs, now) || task.dueTs <= now))
      .map(taskSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  dida__list_tasks_in_list: (input) => {
    assertAllowedKeys(input, ['list_id', 'limit']);
    const listId = optionalListId(input);
    if (!listId) throw new ToolExecutionError('INVALID_ARGUMENT', '"list_id" is required.');
    const rows = state().tasks.filter((task) => !task.completed && task.listId === listId).map(taskSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  dida__list_tasks_in_quadrant: (input) => {
    assertAllowedKeys(input, ['quadrant', 'limit']);
    const quadrant = optionalQuadrant(input);
    if (quadrant === undefined) throw new ToolExecutionError('INVALID_ARGUMENT', '"quadrant" is required.');
    const rows = state().tasks.filter((task) => !task.completed && task.quadrant === quadrant).map(taskSummary);
    return compactResult(rows, getLimit(input, 50));
  },

  dida__open_task: async (input) => {
    assertAllowedKeys(input, ['task_id']);
    const task = taskById(requireString(input, 'task_id', { maxLength: 200 }));
    const route = `/task/${encodeURIComponent(task.id)}`;
    await openAppRoute('dida', route);
    return { route, task_id: task.id };
  },

  dida__open_today: async () => {
    state().setCurrentList('today');
    await openAppRoute('dida', '/');
    return { route: '/', list_id: 'today' };
  },

  dida__create_task: (input) => {
    assertAllowedKeys(input, ['title', 'list_id', 'priority', 'quadrant', 'due_date']);
    const title = requireString(input, 'title', { maxLength: 200 });
    const listId = optionalListId(input) ?? 'inbox';
    const quadrant = optionalQuadrant(input);
    const defaults = quadrant !== undefined ? QUADRANT_CREATE_DEFAULTS[quadrant] : undefined;
    const priority = optionalPriority(input) ?? defaults?.priority ?? 'none';
    const dueRaw = optionalString(input, 'due_date', { maxLength: 10 });
    let dueTs: number | null = dueRaw !== undefined ? parseDueDate(dueRaw) : null;
    if (dueTs === null && defaults?.dueOffsetDays !== null && defaults?.dueOffsetDays !== undefined) {
      const today = TimeService.getDate();
      dueTs = TimeService.fromLocalParts(
        today.getFullYear(), today.getMonth(), today.getDate() + defaults.dueOffsetDays,
      ).getTime();
    }
    const id = state().addTask({
      title,
      listId,
      priority,
      quadrant: quadrant ?? 4,
      dueTs,
      hasTime: false,
    });
    return taskSummary(taskById(id));
  },

  dida__complete_task: (input) => {
    assertAllowedKeys(input, ['task_id']);
    const task = taskById(requireString(input, 'task_id', { maxLength: 200 }));
    state().toggleComplete(task.id);
    return { task_id: task.id, completed: taskById(task.id).completed };
  },
};

export function executeDidaTool(name: string, input: JsonObject) {
  return requireFound(handlers[name], 'TOOL_NOT_FOUND', `Unknown Dida tool: ${name}`)(input);
}

export { DIDA_TOOL_DEFINITIONS } from './definitions';

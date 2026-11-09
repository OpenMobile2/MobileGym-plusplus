import { defineAppTools, ID, LIMIT, STRING } from '../../core/define';

const DATE = { ...STRING, description: 'Local calendar date in YYYY-MM-DD format.' };
const LIST_ID = { type: 'string', enum: ['inbox', 'welcome', 'life'] } as const;
const PRIORITY = { type: 'string', enum: ['none', 'low', 'medium', 'high'] } as const;
const QUADRANT = { type: 'integer', enum: [1, 2, 3, 4], description: 'Eisenhower quadrant: 1 urgent-important, 2 important, 3 urgent, 4 neither.' } as const;

export const DIDA_TOOL_DEFINITIONS = defineAppTools('dida', [
  {
    name: 'search_tasks',
    description: 'Search tasks by title substring only. Notes, tags, and subtasks are not searched. Query is required; there is no list-all shortcut.',
    properties: { query: STRING, include_completed: { type: 'boolean', default: false }, limit: LIMIT },
    required: ['query'],
  },
  {
    name: 'list_today_tasks',
    description: 'List incomplete Today-view tasks: dated today or overdue. Returns date and priority, not clock time, notes, tags, or subtasks.',
    properties: { limit: LIMIT },
  },
  {
    name: 'list_tasks_in_list',
    description: 'List incomplete tasks in one physical list: inbox (收件箱), welcome (Welcome), or life (生活).',
    properties: { list_id: LIST_ID, limit: LIMIT },
    required: ['list_id'],
  },
  {
    name: 'list_tasks_in_quadrant',
    description: 'List incomplete tasks in one Eisenhower quadrant. Quadrant and priority are independent fields.',
    properties: { quadrant: QUADRANT, limit: LIMIT },
    required: ['quadrant'],
  },
  {
    name: 'open_task',
    description: 'Open one task detail page. Notes, subtasks, reminder, and exact due time are only visible in the GUI; read a fresh screenshot after this call.',
    properties: { task_id: ID },
    required: ['task_id'],
    kind: 'navigation',
  },
  {
    name: 'open_today',
    description: 'Open the Tasks tab on the Today smart list. Read a fresh screenshot after this call.',
    kind: 'navigation',
  },
  {
    name: 'create_task',
    description: 'Create one task through the same store action as the GUI. Notes, subtasks, reminder, and repeat stay GUI-only. If quadrant is set without priority or due_date, the same quadrant defaults as the Matrix page are applied.',
    properties: {
      title: { ...STRING, maxLength: 200 },
      list_id: LIST_ID,
      priority: PRIORITY,
      quadrant: QUADRANT,
      due_date: DATE,
    },
    required: ['title'],
    kind: 'write',
  },
  {
    name: 'complete_task',
    description: 'Toggle one task completed or incomplete, matching the list checkbox.',
    properties: { task_id: ID },
    required: ['task_id'],
    kind: 'write',
  },
]);

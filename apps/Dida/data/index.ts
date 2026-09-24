// 数据入口:合并 constants + defaults.json,导出 DIDA_CONFIG。
// tasks/records 在 defaults 里用「相对天数/分钟」表达时间,由 state.ts 在初始化时换算成 simulated ts。
import defaults from './defaults.json';
import type { Priority, Quadrant, TaskList, UserInfo, Settings, Stats, FocusType } from '../types';

export interface RawTask {
  id: string;
  title: string;
  note: string;
  listId: string;
  priority: Priority;
  quadrant: Quadrant;
  dueOffsetDays: number | null;
  dueTimeMin: number | null;
  reminder: string | null;
  repeat: string | null;
  tags: string[];
  subtasks: { id: string; title: string; done: boolean }[];
  completed: boolean;
  pinned?: boolean;
}

export interface RawRecord {
  id: string;
  taskName: string;
  dayOffset: number;
  startMin: number;
  durationMin: number;
  type: FocusType;
}

export const DIDA_CONFIG = {
  user: defaults.user as UserInfo,
  lists: defaults.lists as (TaskList & { nameEn: string })[],
  tasks: defaults.tasks as RawTask[],
  records: defaults.records as RawRecord[],
  settings: defaults.settings as Settings,
  stats: defaults.stats as Stats,
};

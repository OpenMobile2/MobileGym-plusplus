import type { KeepSchedule } from '../types';

/** 确保有按日课程表；旧数据仅有 todayCourses 时回填到 todayKey */
export function ensureDayCourses(
  schedule: KeepSchedule,
  todayKey: string,
): Record<string, string[]> {
  if (schedule.dayCourses && Object.keys(schedule.dayCourses).length > 0) {
    return { ...schedule.dayCourses };
  }
  const seed = schedule.todayCourses ?? [];
  return seed.length > 0 ? { [todayKey]: [...seed] } : {};
}

/** 某日已排课程 id */
export function courseIdsOnDate(schedule: KeepSchedule, date: string, todayKey: string): string[] {
  const map = ensureDayCourses(schedule, todayKey);
  if (map[date]) return [...map[date]];
  // 兼容：未建 dayCourses 且查今日时回落 todayCourses
  if (date === todayKey && (!schedule.dayCourses || Object.keys(schedule.dayCourses).length === 0)) {
    return [...(schedule.todayCourses ?? [])];
  }
  return [];
}

/** 日程中出现过的课程（去重，保序） */
export function allScheduledCourseIds(schedule: KeepSchedule, todayKey: string): string[] {
  const map = ensureDayCourses(schedule, todayKey);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ids of Object.values(map)) {
    for (const id of ids) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  if (out.length === 0) {
    for (const id of schedule.todayCourses ?? []) {
      if (!seen.has(id)) {
        seen.add(id);
        out.push(id);
      }
    }
  }
  return out;
}

export function addCoursesToDates(
  dayCourses: Record<string, string[]>,
  dates: string[],
  courseIds: string[],
): Record<string, string[]> {
  const next = { ...dayCourses };
  for (const date of dates) {
    const list = [...(next[date] ?? [])];
    for (const id of courseIds) {
      if (!list.includes(id)) list.push(id);
    }
    next[date] = list;
  }
  return next;
}

export function removeCourseFromDate(
  dayCourses: Record<string, string[]>,
  date: string,
  courseId: string,
): Record<string, string[]> {
  const next = { ...dayCourses };
  const list = (next[date] ?? []).filter((id) => id !== courseId);
  if (list.length === 0) delete next[date];
  else next[date] = list;
  return next;
}

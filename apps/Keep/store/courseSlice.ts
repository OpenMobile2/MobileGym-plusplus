// apps/Keep/store/courseSlice.ts —— 簇A(课程/训练/动作/路线/达人)actions。
// 仅本簇代理可改;状态字段见 types.ts KeepState 中 // clusterA 追加 部分。
import { realNow, now, getDate } from '@/os/TimeService';
import type { KeepSet, KeepGet, KeepSettings, KeepComment, KeepRunRecord } from '../types';
import { addCoursesToDates, ensureDayCourses } from './scheduleHelpers';
import { followingCountOf } from './profileHelpers';

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function todayStr(): string {
  const d = getDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function timeOfDayStr(): string {
  const d = getDate();
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export interface CourseActions {
  /** 课程「想练」toggle(course.detail.wish.toggle),带 toast */
  courseWishToggle: (courseId: string) => void;
  /** 动作「想练」toggle(action.detail.wish.toggle) */
  actionWishToggle: (actionId: string) => void;
  /** 模板一键想练(template.detail.wish.toggle) */
  templateWishToggle: (templateId: string) => void;
  /** 加日历:日期格 toggle(course.calendar.date.toggle) */
  calendarDateToggle: (date: string) => void;
  /** 加日历:清空已选(course.calendar.clear) */
  calendarClear: () => void;
  /** 加日历:把当前课程写入所选训练日(真实联动日程 dayCourses) */
  calendarSave: () => void;
  /** 发布评论(course.comments.publish):插入列表顶部,计数+1 */
  commentPublish: (courseId: string, content: string) => void;
  /** 评论点赞 toggle(course.comments.like.toggle) */
  commentLikeToggle: (commentId: string) => void;
  /** 课程社区 [关注] toggle(course.community.follow.toggle) */
  communityFollowToggle: (name: string) => void;
  /** 社区互动标签 +1(course.community.reaction.tap) */
  communityReactionTap: (key: string) => void;
  /** 达人关注(coach.profile.follow.on / follow.off) */
  coachFollowSet: (coachId: string, on: boolean) => void;
  /** 推荐关注卡 toggle(coach.profile.suggestFollow.toggle) */
  suggestFollowToggle: (coachId: string) => void;
  /** 提交搜索词:写 current.searchTerm + 最近搜索 */
  searchCommit: (term: string) => void;
  /** 跟练会话:开始(GO 的 beforeTrigger) */
  trainingStart: (courseId: string) => void;
  /** 跟练:暂停(course.training.pause) */
  trainingPause: () => void;
  /** 跟练:继续(course.training.resume / training.quit.continue) */
  trainingResume: () => void;
  /** 跟练:上/下一动作(course.training.prevAction/nextAction),总时长不重置 */
  trainingSeek: (dir: 1 | -1) => void;
  /** 跟练:动作倒计时归零自动进入下一动作(计时驱动) */
  trainingAdvanceSeg: () => void;
  /** 跟练:打卡(course.training.checkin) */
  trainingCheckin: () => void;
  /** 跟练:弹幕开关(course.training.danmaku.toggle) */
  trainingDanmakuToggle: () => void;
  /** 跟练:结束并生成结算(练完全部动作 → course.complete) */
  trainingFinish: () => void;
  /** 跟练:放弃(training.quit 结束训练,不保存记录) */
  trainingAbort: () => void;
  /** 结算页主观感受打分(course.complete.feeling.rate) */
  completeFeelingRate: (v: number) => void;
  /** 动作目标:计次/计时切换(action.goal.mode.switch) */
  actionGoalSetMode: (mode: '计次' | '计时') => void;
  /** 动作目标:刻度尺选值(action.goal.scale.slide),null=∞ */
  actionGoalSetValue: (v: number | null) => void;
  /** 动作目标:选择重量(action.goal.weight.pick) */
  actionGoalSetWeight: (kg: number | null) => void;
  /** 单动作会话:开始(开始第1次训练 beforeTrigger) */
  actionTrainStart: (actionId: string) => void;
  /** 单动作会话:暂停(action.training.pause) */
  actionTrainPause: () => void;
  /** 单动作会话:继续(action.training.resume) */
  actionTrainResume: () => void;
  /** 单动作会话:停止退出 */
  actionTrainStop: () => void;
  /** 训练设置弹层各开关/滑条(training.settings.*) */
  trainingSettingSet: (patch: Partial<KeepSettings>) => void;
}

const WISH_ON_TOAST = '已添加至「想练」,可在「我的」-「我的课程」查看';
const WISH_OFF_TOAST = '已取消想练';

function toggleInList(list: string[] | undefined, id: string): { next: string[]; on: boolean } {
  const cur = list ?? [];
  const on = !cur.includes(id);
  return { next: on ? [...cur, id] : cur.filter((x) => x !== id), on };
}

export function createCourseSlice(set: KeepSet, get: KeepGet): CourseActions {
  return {
    courseWishToggle: (courseId) =>
      set((s) => {
        // 与跑步课 wishCourseIds 双向同步，避免双列表分叉
        const merged = Array.from(new Set([...(s.wishCourses ?? []), ...(s.wishCourseIds ?? [])]));
        const { next, on } = toggleInList(merged, courseId);
        return {
          wishCourses: next,
          wishCourseIds: next,
          lastToast: on ? WISH_ON_TOAST : WISH_OFF_TOAST,
        };
      }),

    actionWishToggle: (actionId) =>
      set((s) => {
        const { next, on } = toggleInList(s.wishActions, actionId);
        return { wishActions: next, lastToast: on ? WISH_ON_TOAST : WISH_OFF_TOAST };
      }),

    templateWishToggle: (templateId) =>
      set((s) => {
        const { next, on } = toggleInList(s.wishTemplates, templateId);
        return { wishTemplates: next, lastToast: on ? '已一键想练 3 节课程' : WISH_OFF_TOAST };
      }),

    calendarDateToggle: (date) =>
      set((s) => ({ trainingDays: toggleInList(s.trainingDays, date).next })),

    calendarClear: () => set(() => ({ trainingDays: [] })),

    calendarSave: () =>
      set((s) => {
        const days = s.trainingDays ?? [];
        if (days.length === 0) return { lastToast: '未选择训练日' };

        const courseIds: string[] = [];
        if (s.current.courseId) {
          courseIds.push(s.current.courseId);
        } else if (s.current.templateId != null) {
          // 模板加日历：写入模板详情展示的前 3 门课
          courseIds.push(...s.courses.slice(0, 3).map((c) => c.id));
        }

        if (courseIds.length === 0) {
          // 动作加日历无课程实体：仅保留所选训练日
          return { lastToast: '已加入日程' };
        }

        const today = todayStr();
        const base = ensureDayCourses(s.schedule, today);
        const dayCourses = addCoursesToDates(base, days, courseIds);
        return {
          schedule: {
            ...s.schedule,
            dayCourses,
            todayCourses: dayCourses[today] ?? s.schedule.todayCourses,
          },
          lastToast: `已加入日程 · ${days.length} 天`,
        };
      }),

    commentPublish: (courseId, content) =>
      set((s) => {
        const text = content.trim();
        if (!text) return { lastToast: '评论不能为空' };
        const comment: KeepComment = {
          id: `cc_me_${realNow()}`,
          author: s.user.nickname,
          avatar: s.user.avatar,
          content: text,
          time: '刚刚',
          region: '云江',
          likes: 0,
          replies: [],
        };
        return {
          courses: s.courses.map((c) =>
            c.id === courseId
              ? { ...c, comments: [comment, ...c.comments], commentsCount: c.commentsCount + 1 }
              : c,
          ),
          lastToast: '评论发布成功',
        };
      }),

    commentLikeToggle: (commentId) =>
      set((s) => ({ likedComments: toggleInList(s.likedComments, commentId).next })),

    communityFollowToggle: (name) =>
      set((s) => {
        const followedUsers = s.followedUsers ?? [];
        const followedNames = s.followedNames ?? [];
        const followedCoaches = s.followedCoaches ?? [];
        const coach = s.coaches.find((item) => item.name === name);
        const wasOn = followedUsers.includes(name)
          || followedNames.includes(name)
          || Boolean(coach && followedCoaches.includes(coach.id));
        const on = !wasOn;
        const update = (list: string[], value: string) => (
          on ? (list.includes(value) ? list : [...list, value]) : list.filter((item) => item !== value)
        );
        const nextUsers = update(followedUsers, name);
        const nextNames = update(followedNames, name);
        const nextCoaches = coach ? update(followedCoaches, coach.id) : followedCoaches;
        return {
          followedUsers: nextUsers,
          followedNames: nextNames,
          followedCoaches: nextCoaches,
          user: {
            ...s.user,
            following: followingCountOf({
              ...s,
              followedUsers: nextUsers,
              followedNames: nextNames,
              followedCoaches: nextCoaches,
            }),
          },
        };
      }),

    communityReactionTap: (key) =>
      set((s) => ({
        reactionCounts: { ...(s.reactionCounts ?? {}), [key]: ((s.reactionCounts ?? {})[key] ?? 0) + 1 },
      })),

    coachFollowSet: (coachId, on) =>
      set((s) => {
        const followedUsers = s.followedUsers ?? [];
        const followedNames = s.followedNames ?? [];
        const followedCoaches = s.followedCoaches ?? [];
        const coach = s.coaches.find((item) => item.id === coachId);
        const wasOn = followedCoaches.includes(coachId)
          || Boolean(coach && (followedUsers.includes(coach.name) || followedNames.includes(coach.name)));
        const update = (list: string[], value: string) => (
          on ? (list.includes(value) ? list : [...list, value]) : list.filter((item) => item !== value)
        );
        const nextCoaches = update(followedCoaches, coachId);
        const nextUsers = coach ? update(followedUsers, coach.name) : followedUsers;
        const nextNames = coach ? update(followedNames, coach.name) : followedNames;
        return {
          followedCoaches: nextCoaches,
          followedUsers: nextUsers,
          followedNames: nextNames,
          user: {
            ...s.user,
            following: followingCountOf({
              ...s,
              followedCoaches: nextCoaches,
              followedUsers: nextUsers,
              followedNames: nextNames,
            }),
          },
        };
      }),

    suggestFollowToggle: (coachId) =>
      set((s) => {
        const coach = s.coaches.find((item) => item.id === coachId);
        const followedUsers = s.followedUsers ?? [];
        const followedNames = s.followedNames ?? [];
        const followedCoaches = s.followedCoaches ?? [];
        const wasOn = followedCoaches.includes(coachId)
          || Boolean(coach && (followedUsers.includes(coach.name) || followedNames.includes(coach.name)));
        const on = !wasOn;
        const update = (list: string[], value: string) => (
          on ? (list.includes(value) ? list : [...list, value]) : list.filter((item) => item !== value)
        );
        const nextCoaches = update(followedCoaches, coachId);
        const nextUsers = coach ? update(followedUsers, coach.name) : followedUsers;
        const nextNames = coach ? update(followedNames, coach.name) : followedNames;
        return {
          followedCoaches: nextCoaches,
          followedUsers: nextUsers,
          followedNames: nextNames,
          user: {
            ...s.user,
            following: followingCountOf({
              ...s,
              followedCoaches: nextCoaches,
              followedUsers: nextUsers,
              followedNames: nextNames,
            }),
          },
        };
      }),

    searchCommit: (term) =>
      set((s) => {
        const t = term.trim();
        if (!t) return {};
        return {
          current: { ...s.current, searchTerm: t },
          searchState: {
            ...s.searchState,
            recents: [t, ...s.searchState.recents.filter((r) => r !== t)].slice(0, 10),
          },
        };
      }),

    trainingStart: (courseId) =>
      set(() => {
        const now = realNow();
        return {
          trainingSession: {
            courseId,
            status: 'running' as const,
            startedRealMs: now,
            accumMs: 0,
            segIndex: 0,
            segAccumMs: 0,
            segStartedRealMs: now,
            checkins: 0,
            danmaku: true,
          },
        };
      }),

    trainingPause: () =>
      set((s) => {
        const t = s.trainingSession;
        if (!t || t.status !== 'running') return {};
        const now = realNow();
        return {
          trainingSession: {
            ...t,
            status: 'paused' as const,
            accumMs: t.accumMs + (now - t.startedRealMs),
            segAccumMs: t.segAccumMs + (now - t.segStartedRealMs),
          },
        };
      }),

    trainingResume: () =>
      set((s) => {
        const t = s.trainingSession;
        if (!t || t.status !== 'paused') return {};
        const now = realNow();
        return { trainingSession: { ...t, status: 'running' as const, startedRealMs: now, segStartedRealMs: now } };
      }),

    trainingSeek: (dir) =>
      set((s) => {
        const t = s.trainingSession;
        if (!t) return {};
        const course = s.courses.find((c) => c.id === t.courseId);
        const segCount = course ? course.segments.length : 1;
        const nextIdx = Math.min(segCount - 1, Math.max(0, t.segIndex + dir));
        return {
          trainingSession: { ...t, segIndex: nextIdx, segAccumMs: 0, segStartedRealMs: realNow() },
        };
      }),

    trainingAdvanceSeg: () =>
      set((s) => {
        const t = s.trainingSession;
        if (!t) return {};
        return {
          trainingSession: { ...t, segIndex: t.segIndex + 1, segAccumMs: 0, segStartedRealMs: realNow() },
        };
      }),

    trainingCheckin: () =>
      set((s) => {
        const t = s.trainingSession;
        if (!t) return {};
        return { trainingSession: { ...t, checkins: t.checkins + 1 }, lastToast: '打卡成功' };
      }),

    trainingDanmakuToggle: () =>
      set((s) => {
        const t = s.trainingSession;
        if (!t) return {};
        return { trainingSession: { ...t, danmaku: !t.danmaku } };
      }),

    trainingFinish: () =>
      set((s) => {
        const t = s.trainingSession;
        if (!t) return {};
        const course = s.courses.find((c) => c.id === t.courseId);
        const wall = realNow();
        const durationMs = t.accumMs + (t.status === 'running' ? wall - t.startedRealMs : 0);
        const durationSec = Math.max(1, Math.round(durationMs / 1000));
        const kcalBase = course ? parseInt(course.kcalRange, 10) || 20 : 20;
        const totalSec = course ? Math.max(60, course.minutes * 60) : 360;
        const kcal = Math.max(1, Math.round((kcalBase * durationSec) / totalSec + t.checkins));
        const actionCount = course ? course.segments.length : t.segIndex + 1;
        const recordId = `rr_course_${now()}`;
        const record: KeepRunRecord = {
          id: recordId,
          type: '室内有氧',
          name: course?.title ?? '课程训练',
          km: null,
          durationSec,
          kcal,
          paceSecPerKm: null,
          date: todayStr(),
          timeOfDay: timeOfDayStr(),
          source: 'Keep',
          uploaded: true,
          load: Math.max(1, Math.round(durationSec / 30)),
          totalSec: durationSec,
        };
        return {
          trainingSession: null,
          lastComplete: {
            courseId: t.courseId,
            durationSec,
            kcal,
            actionCount,
            feeling: null,
          },
          runRecords: [record, ...s.runRecords],
          user: {
            ...s.user,
            totalMinutes: s.user.totalMinutes + Math.max(1, Math.round(durationSec / 60)),
          },
          current: { ...s.current, recordId },
        };
      }),

    trainingAbort: () => set(() => ({ trainingSession: null })),

    completeFeelingRate: (v) =>
      set((s) => (s.lastComplete ? { lastComplete: { ...s.lastComplete, feeling: v } } : {})),

    actionGoalSetMode: (mode) =>
      set((s) => ({
        actionGoal: { ...(s.actionGoal ?? { weightKg: null }), mode, value: null },
      })),

    actionGoalSetValue: (v) =>
      set((s) => ({ actionGoal: { mode: '计次' as const, weightKg: null, ...(s.actionGoal ?? {}), value: v } })),

    actionGoalSetWeight: (kg) =>
      set((s) => ({ actionGoal: { mode: '计次' as const, value: null, ...(s.actionGoal ?? {}), weightKg: kg } })),

    actionTrainStart: (actionId) =>
      set(() => ({
        actionSession: {
          actionId,
          status: 'running' as const,
          startedRealMs: realNow(),
          accumMs: 0,
          completed: 0,
        },
      })),

    actionTrainPause: () =>
      set((s) => {
        const a = s.actionSession;
        if (!a || a.status !== 'running') return {};
        return {
          actionSession: { ...a, status: 'paused' as const, accumMs: a.accumMs + (realNow() - a.startedRealMs) },
        };
      }),

    actionTrainResume: () =>
      set((s) => {
        const a = s.actionSession;
        if (!a || a.status !== 'paused') return {};
        return { actionSession: { ...a, status: 'running' as const, startedRealMs: realNow() } };
      }),

    actionTrainStop: () => set(() => ({ actionSession: null })),

    trainingSettingSet: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
  };
}

// apps/Keep/store/meSlice.ts —— Me 域 actions(簇D:问卷/会员/日程计划/消息/上传)
import * as TimeService from '@/os/TimeService';
import type { KeepSet, KeepGet } from '../types';
import { pickPlanIdFromQuiz } from './planHelpers';
import { addCoursesToDates, ensureDayCourses, removeCourseFromDate } from './scheduleHelpers';

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function nowDateTime(): string {
  const d = TimeService.getDate();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

export interface MeActions {
  setUserCover: (uri: string) => void;
  /** 问卷:写入某题答案(单选 string / 复选 string[]) */
  setQuizAnswer: (qid: string, value: string | string[]) => void;
  /** 问卷:按答案规则生成匹配计划 */
  quizGeneratePlan: () => void;
  /** 问卷:双滚轮弹层确认身高体重 */
  setBodyInfo: (heightCm: number, weightKg: number) => void;
  /** 会员:mock 开通(active=true,到期日按所选档位顺延,全局生效) */
  purchaseMember: (planId: string) => void;
  /** 日程:开启智能计划(推荐计划加入日程) */
  startPlan: (planId: string) => void;
  /** 日程:「暂不推荐」收起推荐卡并轮换下一套 */
  dismissRecommendedPlan: () => void;
  /** 日程:重新展开智能计划推荐 */
  restoreRecommendedPlan: () => void;
  /** 请假:选天数,计划顺延 */
  confirmLeave: (days: number) => void;
  /** 管理日程:移除指定日期已排课程 */
  removeScheduledCourse: (courseId: string, date?: string) => void;
  /** 管理日程:向指定日期添加一节课程 */
  addScheduledCourse: (courseId: string, date?: string) => void;
  /** 私聊:发消息(追加自己气泡,对方不回) */
  sendChat: (threadId: string, content: string) => void;
  /** 达人私信:复用已有好友会话,否则创建与该达人的会话 */
  ensureCoachThread: (coachId: string, name: string, avatar: string) => string;
  /** 消息中心:全部已读(未读角标清零) */
  readAllMessages: () => void;
}

export function createMeSlice(set: KeepSet, get: KeepGet): MeActions {
  return {
    setUserCover: (uri) => set((s) => ({ user: { ...s.user, cover: uri }, lastToast: '封面已更新' })),

    setQuizAnswer: (qid, value) =>
      set((s) => ({ quiz: { ...s.quiz, answers: { ...s.quiz.answers, [qid]: value } } })),

    quizGeneratePlan: () =>
      set((s) => {
        const planId = pickPlanIdFromQuiz(s.quiz.answers, s.user.bmi);
        return {
          quiz: { ...s.quiz, generatedPlanId: planId },
          current: { ...s.current, planId },
          schedule: {
            ...s.schedule,
            recommendedPlanId: planId,
            recommendHidden: false,
          },
        };
      }),

    setBodyInfo: (heightCm, weightKg) =>
      set((s) => ({
        user: {
          ...s.user,
          heightCm,
          weightKg,
          bmi: Math.round((weightKg / ((heightCm / 100) * (heightCm / 100))) * 10) / 10,
        },
      })),

    purchaseMember: (planId) => {
      const d = TimeService.getDate();
      const months = planId === 'm_year' ? 12 : planId === 'm_quarter' ? 3 : 1;
      d.setMonth(d.getMonth() + months);
      const expire = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      set((s) => ({
        member: { ...s.member, active: true, expireDate: expire },
        user: { ...s.user, memberExpired: false },
        lastToast: '会员开通成功',
      }));
    },

    startPlan: (planId) =>
      set((s) => ({
        schedule: {
          ...s.schedule,
          activePlanId: planId,
          recommendedPlanId: planId,
          recommendHidden: false,
          planDay: 1,
        },
        quiz: { ...s.quiz, generatedPlanId: planId },
        current: { ...s.current, planId },
        lastToast: '已开启计划',
      })),

    dismissRecommendedPlan: () => {
      const s = get();
      const plans = s.plans;
      if (plans.length === 0) return;
      const cur = s.schedule.recommendedPlanId ?? 'p_abs';
      const idx = Math.max(0, plans.findIndex((p) => p.id === cur));
      const next = plans[(idx + 1) % plans.length].id;
      set((st) => ({
        schedule: {
          ...st.schedule,
          recommendedPlanId: next,
          recommendHidden: true,
        },
        lastToast: '已收起推荐,可随时重新看看',
      }));
    },

    restoreRecommendedPlan: () =>
      set((s) => ({
        schedule: { ...s.schedule, recommendHidden: false },
        lastToast: '已为你准备一套新推荐',
      })),

    confirmLeave: (days) =>
      set((s) => ({
        schedule: { ...s.schedule, leaveDays: days },
        lastToast: `已请假,计划顺延${days}天`,
      })),

    removeScheduledCourse: (courseId, date) =>
      set((s) => {
        const today = TimeService.getToday();
        const target = date ?? today;
        const dayCourses = removeCourseFromDate(ensureDayCourses(s.schedule, today), target, courseId);
        return {
          schedule: {
            ...s.schedule,
            dayCourses,
            todayCourses: dayCourses[today] ?? [],
          },
          lastToast: '已从日程移除',
        };
      }),

    addScheduledCourse: (courseId, date) =>
      set((s) => {
        const today = TimeService.getToday();
        const target = date ?? today;
        const dayCourses = addCoursesToDates(ensureDayCourses(s.schedule, today), [target], [courseId]);
        return {
          schedule: {
            ...s.schedule,
            dayCourses,
            todayCourses: dayCourses[today] ?? s.schedule.todayCourses,
          },
          lastToast: '已添加到日程',
        };
      }),

    sendChat: (threadId, content) => {
      const text = content.trim();
      if (!text) return;
      const time = nowDateTime();
      set((s) => {
        const list = s.messages.chat[threadId] ?? [];
        const msg = { id: `msg_${threadId}_${list.length + 1}`, from: 'me' as const, content: text, time };
        return {
          messages: {
            threads: s.messages.threads.map((t) => (t.id === threadId ? { ...t, preview: text, time } : t)),
            chat: { ...s.messages.chat, [threadId]: [...list, msg] },
          },
        };
      });
    },

    ensureCoachThread: (coachId, name, avatar) => {
      const existing = get().messages.threads.find((t) => t.name === name || t.id === `t_${coachId}`);
      if (existing) return existing.id;
      const threadId = `t_${coachId}`;
      set((s) => ({
        messages: {
          threads: [
            { id: threadId, name, avatar, preview: '开始和教练聊聊吧', time: nowDateTime(), unread: 0, kind: '好友' },
            ...s.messages.threads,
          ],
          chat: { ...s.messages.chat, [threadId]: [] },
        },
      }));
      return threadId;
    },

    readAllMessages: () =>
      set((s) => ({
        messages: {
          ...s.messages,
          threads: s.messages.threads.map((t) => ({ ...t, unread: 0 })),
        },
        notificationsRead: true,
        lastToast: '已全部标记为已读',
      })),

  };
}

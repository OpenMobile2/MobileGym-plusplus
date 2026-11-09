// apps/Keep/store/runSlice.ts —— Run 域 actions(簇B:跑步会话状态机/运动记录上传/体重录入)
import { realNow, now, getDate } from '@/os/TimeService';
import type { KeepSet, KeepGet, KeepRunSession, KeepRunRecord, KeepRunRecordType } from '../types';

/** 里程模拟速度(米/秒),约 06'25" 配速 */
export const RUN_SPEED_MPS = 2.6;

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

/** 会话累计秒数(含当前 running 段) */
export function sessionElapsedSec(s: KeepRunSession | null | undefined): number {
  if (!s) return 0;
  const extra = s.status === 'running' && s.startMs > 0 ? (realNow() - s.startMs) / 1000 : 0;
  return Math.max(0, s.baseSec + extra);
}

/** 会话累计米数(含当前 running 段,~2.6m/s 随时间推进) */
export function sessionDistanceM(s: KeepRunSession | null | undefined): number {
  if (!s) return 0;
  const extra = s.status === 'running' && s.startMs > 0 ? ((realNow() - s.startMs) / 1000) * RUN_SPEED_MPS : 0;
  return Math.max(0, s.baseM + extra);
}

/** 运动类型 → 记录类型映射(run.home 下拉可选项) */
function recordTypeOf(sportType: string): KeepRunRecordType {
  if (sportType === '行走') return '户外行走';
  if (sportType === '骑行') return '户外骑行';
  if (sportType === '室内跑步') return '室内跑步';
  return '户外跑步';
}

export interface RunActions {
  /** run.home.sportType.select:切换运动类型 */
  setSportType: (t: string) => void;
  /** run.home 二级模式 tab 持久化 */
  setRunMode: (m: '目标跑' | '自由跑' | '课程跑' | '自定义') => void;
  /** run.goalPicker:保存目标距离 */
  setRunGoalKm: (km: number) => void;
  /** run.voiceguide:标记引导已看(非首次 GO 直接开跑) */
  markVoiceguideSeen: () => void;
  /** run.active 进入:建立会话(3-2-1 倒计时) */
  startRunSession: () => void;
  /** run.active.countdown.auto:倒计时归零开始计时 */
  beginRunning: () => void;
  /** run.active.pause */
  pauseRun: () => void;
  /** run.active.resume */
  resumeRun: () => void;
  /** 距离过短结束:丢弃会话不保存 */
  abandonRun: () => void;
  /** 达标结束:写入新 runRecord 并累加全局数据,返回记录 id */
  finishRun: () => string | null;
  /** records.sync.upload:上传三态完成后落库(uploaded=true+全局累加) */
  uploadRunRecord: (id: string) => void;
  /** records.sync 自动上传开关 */
  setAutoUpload: (on: boolean) => void;
  /** run.home.courseWish.toggle:课程卡「想练」 */
  toggleRunCourseWish: (courseId: string) => void;
  /** weight.entry:保存体重(写 weightLog + user.weightKg/bmi 联动) */
  saveWeight: (kg: number) => void;
}

export function createRunSlice(set: KeepSet, get: KeepGet): RunActions {
  return {
    setSportType: (t) =>
      set((s) => ({ runState: { ...s.runState, sportType: t } })),

    setRunMode: (m) =>
      set((s) => ({ runState: { ...s.runState, mode: m } })),

    setRunGoalKm: (km) =>
      set((s) => ({ runState: { ...s.runState, goalKm: km } })),

    markVoiceguideSeen: () =>
      set((s) => (s.runState.voiceguideSeen ? {} : { runState: { ...s.runState, voiceguideSeen: true } })),

    startRunSession: () =>
      set((s) => ({
        runSession: {
          status: 'countdown',
          countdownEndMs: realNow() + 3200,
          startMs: 0,
          baseSec: 0,
          baseM: 0,
          goalKm: s.runState.mode === '目标跑' ? s.runState.goalKm : null,
          lastRecordId: null,
        },
      })),

    beginRunning: () =>
      set((s) => {
        if (!s.runSession || s.runSession.status !== 'countdown') return {};
        return { runSession: { ...s.runSession, status: 'running', startMs: realNow() } };
      }),

    pauseRun: () =>
      set((s) => {
        const ses = s.runSession;
        if (!ses || ses.status !== 'running') return {};
        const dt = ses.startMs > 0 ? (realNow() - ses.startMs) / 1000 : 0;
        return {
          runSession: {
            ...ses,
            status: 'paused',
            startMs: 0,
            baseSec: ses.baseSec + dt,
            baseM: ses.baseM + dt * RUN_SPEED_MPS,
          },
          interactionAudit: { ...s.interactionAudit, runPauseCount: s.interactionAudit.runPauseCount + 1 },
        };
      }),

    resumeRun: () =>
      set((s) => {
        const ses = s.runSession;
        if (!ses || ses.status !== 'paused') return {};
        return {
          runSession: { ...ses, status: 'running', startMs: realNow() },
          interactionAudit: { ...s.interactionAudit, runResumeCount: s.interactionAudit.runResumeCount + 1 },
        };
      }),

    abandonRun: () => set(() => ({ runSession: null })),

    finishRun: () => {
      const s = get();
      const ses = s.runSession;
      if (!ses) return null;
      const runningDt = ses.status === 'running' && ses.startMs > 0 ? (realNow() - ses.startMs) / 1000 : 0;
      const sec = Math.max(1, Math.round(ses.baseSec + runningDt));
      const m = ses.baseM + runningDt * RUN_SPEED_MPS;
      const km = Math.round((m / 1000) * 100) / 100;
      const type = recordTypeOf(s.runState.sportType);
      const id = `rr_run_${now()}`;
      const paceSecPerKm = km > 0.01 ? Math.round(sec / km) : null;
      const rec: KeepRunRecord = {
        id,
        type,
        name: type,
        km,
        durationSec: sec,
        kcal: Math.max(1, Math.round(km * 66)),
        paceSecPerKm,
        date: todayStr(),
        timeOfDay: timeOfDayStr(),
        source: 'Keep',
        uploaded: true,
        heartAvg: 148,
        heartMax: 172,
        climb: Math.max(1, Math.round(km * 2.2)),
        cadence: 168,
        power: 262,
        load: Math.max(1, Math.round(sec / 30)),
        totalSec: sec + 12,
        gear: undefined,
      };
      const isRunKm = type === '户外跑步' || type === '室内跑步';
      set((st) => ({
        runRecords: [rec, ...st.runRecords],
        runSession: { ...ses, status: 'done', startMs: 0, baseSec: sec, baseM: m, lastRecordId: id },
        current: { ...st.current, recordId: id },
        user: {
          ...st.user,
          totalMinutes: st.user.totalMinutes + Math.max(1, Math.round(sec / 60)),
          totalRunKm: Math.round((st.user.totalRunKm + (isRunKm ? km : 0)) * 100) / 100,
        },
      }));
      return id;
    },

    uploadRunRecord: (id) =>
      set((s) => {
        const rec = s.runRecords.find((r) => r.id === id);
        if (!rec || rec.uploaded) return {};
        const isRunKm = rec.type === '户外跑步' || rec.type === '室内跑步';
        return {
          runRecords: s.runRecords.map((r) => (r.id === id ? { ...r, uploaded: true } : r)),
          user: {
            ...s.user,
            totalMinutes: s.user.totalMinutes + Math.max(1, Math.round(rec.durationSec / 60)),
            totalRunKm: Math.round((s.user.totalRunKm + (isRunKm ? rec.km ?? 0 : 0)) * 100) / 100,
          },
          lastToast: '运动记录已上传',
        };
      }),

    setAutoUpload: (on) =>
      set((s) => ({ settings: { ...s.settings, autoUpload: on } })),

    toggleRunCourseWish: (courseId) =>
      set((s) => {
        // 与课程详情 wishCourses 双向同步；toast 与 courseWishToggle 一致
        const merged = Array.from(new Set([...(s.wishCourseIds ?? []), ...(s.wishCourses ?? [])]));
        const on = !merged.includes(courseId);
        const next = on ? [...merged, courseId] : merged.filter((c) => c !== courseId);
        return {
          wishCourseIds: next,
          wishCourses: next,
          lastToast: on ? '已添加至「想练」,可在「我的」-「我的课程」查看' : '已取消想练',
        };
      }),

    saveWeight: (kg) =>
      set((s) => {
        const date = todayStr();
        const rest = s.weightLog.filter((w) => w.date !== date);
        const hM = s.user.heightCm / 100;
        const bmi = Math.round((kg / (hM * hM)) * 10) / 10;
        return {
          weightLog: [...rest, { date, kg }],
          user: { ...s.user, weightKg: kg, bmi },
        };
      }),
  };
}

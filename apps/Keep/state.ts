import { createAppStoreWithActions } from '@/os/createAppStore';
import { manifest } from './manifest';
import { DATA_VERSION } from './constants';
import { KEEP_CONFIG } from './data';
import type { KeepState, KeepActions } from './types';
import { createCourseSlice } from './store/courseSlice';
import { createRunSlice } from './store/runSlice';
import { createMallSlice } from './store/mallSlice';
import { createSocialSlice } from './store/socialSlice';
import { createMeSlice } from './store/meSlice';
import * as TimeService from '@/os/TimeService';

const initialState: KeepState = {
  ...JSON.parse(JSON.stringify(KEEP_CONFIG)),
  interactionAudit: {
    coachDynamicViewedIds: [],
    runPanelViewed: [],
    runPauseCount: 0,
    runResumeCount: 0,
    recordViews: [],
    scheduleHomeViewed: false,
  },
};

// defaults 以 2026-07-14 为制作基准日；运行时整体平移运动记录，保持“本月/上月”与模拟器日期一致。
const reference = TimeService.fromLocalParts(2026, 6, 14, 12);
const simulated = TimeService.getDate();
const current = TimeService.fromLocalParts(simulated.getFullYear(), simulated.getMonth(), simulated.getDate(), 12);
const shiftDays = Math.round((current.getTime() - reference.getTime()) / 86_400_000);
const formatDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
initialState.runRecords = initialState.runRecords.map((record) => {
  const [year, month, day] = record.date.split('-').map(Number);
  const shifted = TimeService.fromLocalParts(year, month - 1, day + shiftDays, 12);
  return { ...record, date: formatDate(shifted) };
});

export const useKeepStore = createAppStoreWithActions<KeepState, KeepActions>(
  manifest.id,
  initialState,
  (set, get) => ({
    toast: (msg) => set(() => ({ lastToast: msg })),
    setCurrent: (key, id) => set((s) => ({ current: { ...s.current, [key]: id } })),
    recordCoachDynamicView: (coachId) => set((s) => ({
      interactionAudit: {
        ...s.interactionAudit,
        coachDynamicViewedIds: [...s.interactionAudit.coachDynamicViewedIds, coachId],
      },
    })),
    recordRunPanelView: (panel) => set((s) => ({
      interactionAudit: {
        ...s.interactionAudit,
        runPanelViewed: [...s.interactionAudit.runPanelViewed, panel],
      },
    })),
    recordRecordsView: (metric, segment, offset) => set((s) => ({
      interactionAudit: {
        ...s.interactionAudit,
        recordViews: [...s.interactionAudit.recordViews, { metric, segment, offset }],
      },
    })),
    recordScheduleHomeView: () => set((s) => ({
      interactionAudit: { ...s.interactionAudit, scheduleHomeViewed: true },
    })),
    ...createCourseSlice(set, get),
    ...createRunSlice(set, get),
    ...createMallSlice(set, get),
    ...createSocialSlice(set, get),
    ...createMeSlice(set, get),
  }),
  {
    persistName: `${manifest.id}_v${DATA_VERSION}`,
    partialize: (state) => {
      // 会话/草稿不落盘，避免重启复活僵尸训练/跑步/下单态
      const skip = new Set([
        'trainingSession',
        'runSession',
        'actionSession',
        'orderDraft',
        'lastToast',
      ]);
      const result: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(state)) {
        if (typeof v === 'function' || skip.has(k)) continue;
        result[k] = v;
      }
      return result as Partial<KeepState>;
    },
  },
);

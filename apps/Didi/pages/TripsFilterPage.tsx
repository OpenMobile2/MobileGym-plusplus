import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, C } from '../components/ui';

const SERVICE_TYPES = [
  '打车', '骑行', '顺风车',
  '代驾', '加油', '公交地铁',
  '包车', '站点巴士', '租车',
  '火车票', '充电', '景点门票',
];

/** 订单筛选(服务类型+时间)。证据:s17 */
export default function TripsFilterPage() {
  const { bindTap, back } = useDidiGestures();
  const tripsFilterTypes = useDidiStore((s) => s.tripsFilterTypes);
  const toggleTripsFilterType = useDidiStore((s) => s.toggleTripsFilterType);
  const resetTripsFilter = useDidiStore((s) => s.resetTripsFilter);
  const toast = useDidiStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="订单筛选" />
      <div className="flex-1 overflow-y-auto px-4 py-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[16px] font-semibold text-app-text mb-3">按服务类型选择</div>
        <div className="grid grid-cols-3 gap-2.5">
          {SERVICE_TYPES.map((t) => {
            const picked = tripsFilterTypes.includes(t);
            return (
              <button
                key={t}
                {...bindTap(
                  { kind: 'action', id: 'trips.filter.type.toggle' },
                  { params: { value: t }, onTrigger: () => toggleTripsFilterType(t) },
                )}
                className="py-2.5 rounded-full text-[14px] text-center"
                style={{
                  background: picked ? '#FFF4EC' : '#F5F6FA',
                  color: picked ? C.orangeDeep : '#444',
                  border: picked ? `1px solid ${C.orange}` : '1px solid transparent',
                  fontWeight: picked ? 600 : 400,
                }}
              >
                {t}
              </button>
            );
          })}
        </div>

        <div className="text-[16px] font-semibold text-app-text mt-6 mb-3">按时间范围选择</div>
        <button
          onClick={() => toast('该功能暂未开放')}
          className="w-full flex items-center justify-center py-3 rounded-full text-[14px] text-app-text-muted border-none"
          style={{ background: '#F5F6FA' }}
        >
          选择年月 ›
        </button>
      </div>

      {/* 底部按钮 */}
      <div className="shrink-0 bg-app-surface px-4 py-3 flex items-center gap-3 border-t border-app-border">
        <button
          {...bindTap({ kind: 'action', id: 'trips.filter.reset' }, { onTrigger: () => resetTripsFilter() })}
          className="flex-1 py-3 rounded-full text-[15px] font-medium bg-app-surface"
          style={{ border: `1px solid ${C.orange}`, color: C.orangeDeep }}
        >
          重置
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'trips.filter.apply' }, { onTrigger: () => back() })}
          className="flex-1 py-3 rounded-full text-[15px] font-medium text-white border-none"
          style={{ background: C.orange }}
        >
          确认
        </button>
      </div>
    </div>
  );
}

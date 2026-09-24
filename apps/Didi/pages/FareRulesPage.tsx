import React from 'react';
import { TopBar } from '../components/ui';
import { useDidiStore } from '../state';

/** 计价规则(一口价说明)—— 证据 n38。纯展示页,无 action。 */
export default function FareRulesPage() {
  const tripCarType = useDidiStore((s) => s.trip.carType);
  const checkedName = useDidiStore((s) =>
    s.carGroups.flatMap((g) => g.types).find((t) => t.checked)?.name,
  );
  const carTypeName = tripCarType || checkedName || '特惠快车';

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title="计价规则" />
      <div
        className="flex-1 overflow-y-auto bg-app-surface px-5 py-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 车辆插图 */}
        <div className="flex flex-col items-center mb-6">
          <svg width="120" height="64" viewBox="0 0 120 64">
            <rect x="12" y="30" width="96" height="22" rx="10" fill="#FFE3D2" />
            <path d="M32 32 C38 14, 82 14, 90 32 Z" fill="#FFF2EA" stroke="#FFB68C" strokeWidth="2" />
            <circle cx="36" cy="52" r="8" fill="#5A5F6B" />
            <circle cx="36" cy="52" r="3" fill="#fff" />
            <circle cx="86" cy="52" r="8" fill="#5A5F6B" />
            <circle cx="86" cy="52" r="3" fill="#fff" />
          </svg>
          <div className="text-[20px] font-bold text-app-text mt-3">{carTypeName}</div>
          <div className="text-[12px] text-app-text-muted mt-1">2026-07-13 适用</div>
        </div>

        {/* 实时用车 */}
        <div className="text-[16px] font-semibold text-app-text mb-2">实时用车</div>
        <div className="rounded-xl px-4 py-3.5 mb-4" style={{ background: '#F5F6FA' }}>
          <div className="text-[14px] font-medium text-app-text mb-1">{carTypeName}一口价</div>
          <div className="text-[13px] text-app-text-muted leading-relaxed">
            根据您的起终点、实时路况等因素计算的一口价,行程中不因堵车、绕路变化(修改终点/新增途经点除外)。
          </div>
        </div>

        {/* 留返地区接驾费 */}
        <div className="text-[16px] font-semibold text-app-text mb-2">留返地区接驾费</div>
        <div className="rounded-xl px-4 py-3.5 mb-4" style={{ background: '#F5F6FA' }}>
          <div className="text-[13px] text-app-text-muted leading-relaxed">
            若上车点位于偏远留返地区,车辆前往接驾可能收取一定接驾费用,下单前将在预估价中展示。
          </div>
        </div>

        {/* 超时等待费 */}
        <div className="text-[16px] font-semibold text-app-text mb-2">超时等待费</div>
        <div className="rounded-xl px-4 py-3.5" style={{ background: '#F5F6FA' }}>
          <div className="text-[14px] font-medium text-app-text mb-1">1.40元/分钟</div>
          <div className="text-[13px] text-app-text-muted leading-relaxed">
            司机到达后免费等待10分钟,超时按分钟计费。
          </div>
        </div>
      </div>
    </div>
  );
}

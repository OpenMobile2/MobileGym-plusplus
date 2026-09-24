import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Switch } from '../components/ui';

/** 同步行程(spec trip.sync)。实名证件/护照/12306账号 同步开关。 */
const SYNCS = [
  { key: 'syncId', label: '同步我的实名证件', sub: '用于快速填写乘客信息' },
  { key: 'syncPassport', label: '同步护照信息', sub: '国际出行更便捷' },
  { key: 'sync12306', label: '同步12306账号', sub: '火车票订单实时同步' },
];

export default function TripSyncPage() {
  const { bindTap } = useCtripGestures();
  const settings = useCtripStore((s) => s.settings);
  const toggleSetting = useCtripStore((s) => s.toggleSetting);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="同步行程" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2">
          {SYNCS.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#F2F2F2]">
              <div>
                <div className="text-[15px] text-[#222222]">{s.label}</div>
                <div className="text-[12px] text-[#999999] mt-0.5">{s.sub}</div>
              </div>
              <Switch
                on={!!settings[s.key]}
                onToggle={() => toggleSetting(s.key)}
                binding={bindTap({ kind: 'action', id: 'tripSync.switch.toggle.id' }, { params: { key: s.key }, onTrigger: () => toggleSetting(s.key) })}
              />
            </div>
          ))}
        </div>
        <div className="px-4 py-3 text-[12px] text-[#999999]">同步后,预订机票/火车票时可一键带入证件信息。</div>
      </div>
    </div>
  );
}

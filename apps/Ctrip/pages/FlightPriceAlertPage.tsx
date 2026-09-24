import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Switch, useToast, PrimaryBtn } from '../components/ui';

/** 低价提醒(spec flight.priceAlert)。单程往返/日期范围/价格滑块/智能提醒开关/确认(Q12 toast后返回)。 */
export default function FlightPriceAlertPage() {
  const { bindTap, back } = useCtripGestures();
  const [toast, showToast] = useToast();
  const [threshold, setThreshold] = React.useState(600);
  const [smart, setSmart] = React.useState(true);
  const [trip, setTrip] = React.useState('oneway');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="低价提醒" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white mx-2 mt-2 rounded-xl p-4">
          <div className="flex gap-4 mb-3">
            {[{ id: 'oneway', label: '单程' }, { id: 'roundtrip', label: '往返' }].map((t) => (
              <button key={t.id} onClick={() => setTrip(t.id)} className={`text-[14px] bg-transparent border-none cursor-pointer ${trip === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{t.label}</button>
            ))}
          </div>
          <div className="text-[15px] font-semibold mb-1">上海 → 潍坊</div>
          <div className="text-[13px] text-[#666666] mb-4">出发日期范围:07-01 ~ 07-31</div>

          <div className="text-[13px] text-[#666666] mb-2">期望价格阈值:<span className="text-[#FF6A2C] font-semibold">¥{threshold}</span> 以下提醒我</div>
          <input
            {...bindTap({ kind: 'action', id: 'priceAlert.threshold.value' }, { onTrigger: () => {} })}
            type="range" min={300} max={1200} step={20} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[#0086F6]"
          />

          <div className="flex items-center justify-between py-3 mt-2 border-t border-[#F2F2F2]">
            <span className="text-[14px] text-[#333333]">智能提醒(价格波动自动推送)</span>
            <Switch on={smart} onToggle={() => setSmart((v) => !v)} binding={bindTap({ kind: 'action', id: 'priceAlert.smart.toggle' }, { onTrigger: () => setSmart((v) => !v) })} />
          </div>

          <PrimaryBtn
            binding={bindTap({ kind: 'action', id: 'priceAlert.confirm.submit' }, { onTrigger: () => { showToast('已添加低价提醒'); window.setTimeout(() => back(), 800); } })}
            className="w-full mt-3"
          >确认</PrimaryBtn>
        </div>
      </div>
      {toast}
    </div>
  );
}

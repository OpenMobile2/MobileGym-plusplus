import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Switch, useToast, PrimaryBtn } from '../components/ui';
import { daysInMonth, startOfSystemDay } from '../utils/travelDate';
import { useCtripStore } from '../state';

/** 低价提醒：航线取自 URL from/to，避免写死上海→潍坊。 */
export default function FlightPriceAlertPage() {
  const s = useCtripStrings();
  const { bindTap, back } = useCtripGestures();
  const [sp] = useSearchParams();
  const from = sp.get('from') || '上海';
  const to = sp.get('to') || '潍坊';
  const [toast, showToast] = useToast();
  const [threshold, setThreshold] = React.useState(600);
  const [smart, setSmart] = React.useState(true);
  const [trip, setTrip] = React.useState('oneway');
  const saveFlightPriceAlert = useCtripStore((st) => st.saveFlightPriceAlert);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('低价提醒')} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white mx-2 mt-2 rounded-xl p-4">
          <div className="flex gap-4 mb-3">
            {[{ id: 'oneway', label: s.t('单程') }, { id: 'roundtrip', label: s.t('往返') }].map((t) => (
              <button key={t.id} onClick={() => setTrip(t.id)} className={`text-[14px] bg-transparent border-none cursor-pointer ${trip === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{s.t(t.label)}</button>
            ))}
          </div>
          <div className="text-[15px] font-semibold mb-1">{from} → {to}</div>
          <div className="text-[13px] text-[#666666] mb-4">出发日期范围:{String(startOfSystemDay().getMonth() + 1).padStart(2, '0')}-01 ~ {String(startOfSystemDay().getMonth() + 1).padStart(2, '0')}-{daysInMonth()}</div>

          <div className="text-[13px] text-[#666666] mb-2">{s.t('期望价格阈值:')}<span className="text-[#FF6A2C] font-semibold">¥{threshold}</span>{s.t('以下提醒我')}</div>
          <input
            {...bindTap({ kind: 'action', id: 'priceAlert.threshold.value' }, { onTrigger: () => {} })}
            type="range" min={300} max={1200} step={20} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-full accent-[#0086F6]"
          />
          <div className="mt-2 flex justify-between gap-2">
            <button
              {...bindTap({ kind: 'action', id: 'priceAlert.threshold.decrease' }, { onTrigger: () => setThreshold((value) => Math.max(300, value - 100)) })}
              className="flex-1 rounded-lg border border-[#D9E8F6] bg-[#F4FAFF] py-2 text-[13px] text-[#0076D6]"
            >-¥100</button>
            <button
              {...bindTap({ kind: 'action', id: 'priceAlert.threshold.increase' }, { onTrigger: () => setThreshold((value) => Math.min(1200, value + 100)) })}
              className="flex-1 rounded-lg border border-[#D9E8F6] bg-[#F4FAFF] py-2 text-[13px] text-[#0076D6]"
            >+¥100</button>
          </div>

          <div className="flex items-center justify-between py-3 mt-2 border-t border-[#F2F2F2]">
            <span className="text-[14px] text-[#333333]">{s.t('智能提醒(价格波动自动推送)')}</span>
            <Switch on={smart} onToggle={() => setSmart((v) => !v)} binding={bindTap({ kind: 'action', id: 'priceAlert.smart.toggle' }, { onTrigger: () => setSmart((v) => !v) })} />
          </div>

          <PrimaryBtn
            binding={bindTap({ kind: 'action', id: 'priceAlert.confirm.submit' }, { onTrigger: () => {
              saveFlightPriceAlert({ from, to, threshold, smart, trip });
              showToast(s.t('已添加低价提醒'));
              window.setTimeout(() => back(), 800);
            } })}
            className="w-full mt-3"
          >{s.t('确认')}</PrimaryBtn>
        </div>
      </div>
      {toast}
    </div>
  );
}

import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';
import { IcShare, IcBolt } from '../res/icons';

export default function StreakPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const [month, setMonth] = useState(7);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  return (
    <div className="flex h-full flex-col" style={{ background: '#EDE9FB' }} data-status-bar-foreground="dark">
      <PageHeader right={<>
        <button {...action('streak.rule.wontfixToast', toast)} className="text-[#7B6BC0]">?</button>
        <button {...bindTap('streak.share.open')}><IcShare size={20} color="#7B6BC0" /></button>
      </>} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl">🐶</div>
          <div><div className="text-2xl font-bold text-[#5B4B9E]">{st.streakDays} {s.streakUnit}</div><div className="text-xs text-[#8A7EC0]">{s.streakContinuous}</div></div>
          <IcBolt size={40} color="#8B5CF6" className="ml-auto" />
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4">
          <div className="flex items-center">
            <div className="text-base font-semibold text-[#33405C]">2026年{month}月</div>
            <div className="ml-auto flex gap-2">
              <button {...action('streak.calendar.nav', () => setMonth((m) => Math.max(1, m - 1)))} className="text-[#9AA5B1]">‹</button>
              <button {...action('streak.calendar.nav', () => setMonth((m) => Math.min(12, m + 1)))} className="text-[#9AA5B1]">›</button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-7 gap-y-2 text-center text-xs">
            {['日', '一', '二', '三', '四', '五', '六'].map((d) => <div key={d} className="text-[#B0B0B0]">{d}</div>)}
            {days.map((d) => (
              <div key={d} className="flex items-center justify-center">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${d === 11 ? 'bg-[#8B5CF6] text-white' : 'text-[#5B6B85]'}`}>{d === 17 ? '🗑️' : d}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-white p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">🃏</div>
            <div className="flex-1">
              <div className="text-sm font-bold text-[#33405C]">{s.protectCard}</div>
              <div className="mt-0.5 text-xs text-[#9AA5B1]">装备后,它将在你忘记学习时,自动帮你保住天数战绩不掉</div>
            </div>
          </div>
          <div className="mt-3 flex items-center">
            <span className="text-xs text-[#9AA5B1]">{s.equipped} {st.protectEquipped}/2</span>
            <button {...action('streak.protect.equip', () => st.equipProtect())} className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-[#EDE9FB] text-[#8B5CF6]">＋</button>
          </div>
        </div>
      </div>
    </div>
  );
}

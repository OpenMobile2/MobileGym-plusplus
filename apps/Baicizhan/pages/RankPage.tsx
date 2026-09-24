import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcArrowLeft } from '../res/icons';

export default function RankPage() {
  const s = useStrings();
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col text-white" style={{ background: colors.rankDark }} data-status-bar-foreground="light">
      <div className="flex items-center px-4 pt-12">
        <button {...bindBack()}><IcArrowLeft size={22} color="#fff" /></button>
        <div className="mx-auto text-base font-semibold">出国词书排行榜</div>
        <button {...action('rank.rule.wontfixToast', toast)} className="text-white/70">?</button>
        <button {...action('rank.medal.wontfixToast', toast)} className="ml-3">🏅</button>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${i === 0 ? 'bg-[#3A4A63]' : 'bg-white/10'}`}>{i === 0 ? '🌑' : '🔒'}</div>
        ))}
      </div>
      <div className="mt-2 text-center text-sm text-white/80">1段 未知小行星</div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl opacity-50">🚀</div>
        <div className="mt-4 text-sm text-white/70">只需怒学几个词,排行榜上有名字。<br />马上开始背,斩保你榜上有名(#^.^#)</div>
      </div>
      <div className="px-6 pb-8">
        <button {...bindTap('rank.study.start')} className="w-full rounded-full py-3.5 text-sm font-bold text-white" style={{ background: '#F5A623' }}>开始背单词</button>
      </div>
    </div>
  );
}

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcClose, IcCoin } from '../res/icons';

export default function SettlePage() {
  const s = useStrings();
  const { bindTap, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const kind = sp.get('kind') === 'review' ? 'review' : 'new';

  const done = kind === 'review' ? st.today.reviewDone : st.today.newDone;
  const target = kind === 'review' ? st.today.reviewTarget : st.today.newTarget;
  const rocket = kind === 'review' ? 7 : 40;
  const coin = kind === 'review' ? 14 : 15;

  return (
    <div className="flex h-full flex-col items-center" style={{ background: `linear-gradient(180deg, ${colors.settleBg}, #DDEAF7)` }} data-status-bar-foreground="dark">
      <div className="flex w-full justify-end px-4 pt-12">
        <button {...bindBack()} className="p-1"><IcClose size={22} color="#5B6B85" /></button>
      </div>

      <div className="mt-16 text-center">
        <div className="text-3xl font-bold text-[#33405C]">{s.finishGroup} 1 {s.groupsUnit}!</div>
        <button {...bindTap('settle.summary.open')} className="mt-2 text-sm text-[#7B88A0]">{s.wordSummary} ›</button>
      </div>

      <div className="mt-8 w-72 rounded-3xl bg-white/50 p-5 text-center">
        <div className="text-2xl font-bold" style={{ color: colors.primary }}>{done}/{target} {s.groupsUnit}</div>
        <div className="mt-1 text-xs text-[#7B88A0]">{kind === 'review' ? s.todayReviewProgress : s.todayPlan}</div>
        <div className="mt-4 flex items-center justify-center gap-8">
          <div className="flex items-center gap-1 text-lg font-bold text-[#E86A2B]">🚀 +{rocket}</div>
          <div className="flex items-center gap-1 text-lg font-bold text-[#E8912D]"><IcCoin size={18} /> +{coin}</div>
        </div>
        {kind === 'review' && done === 1 && <div className="mt-2 inline-block rounded-full bg-[#FFF0DA] px-3 py-1 text-xs text-[#E8912D]">{s.firstGroupBonus}</div>}
      </div>

      <div className="mt-auto flex w-full gap-3 px-5 pb-6">
        {kind === 'review' ? (
          <>
            <button {...bindTap('settle.review.more', { beforeTrigger: () => st.addReviewGroup() })} className="flex-1 rounded-full bg-white/80 py-3.5 text-sm font-semibold text-[#33405C]">{s.addReview}</button>
            <button {...bindTap('settle.review.finish', { nav: { mode: 'replace', popTo: '/' } })} className="flex-1 rounded-full py-3.5 text-sm font-semibold text-white" style={{ background: colors.primaryDeep }}>{s.finishTodayReview}</button>
          </>
        ) : (
          <>
            <button {...bindTap('settle.study.rest', { nav: { mode: 'replace', popTo: '/' } })} className="flex-1 rounded-full bg-white/80 py-3.5 text-sm font-semibold text-[#33405C]">{s.restAwhile}</button>
            <button {...bindTap('settle.study.next')} className="flex-1 rounded-full py-3.5 text-sm font-semibold text-white" style={{ background: colors.primaryDeep }}>{s.nextGroup}</button>
          </>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { PageHeader } from '../components/common';
import { IcChevronRight } from '../res/icons';

export default function SummaryPage() {
  const s = useStrings();
  const { bindTap } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const words = st.words.slice(0, 10);

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.wordSummary} />
      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {words.map((w) => (
          <button key={w.id} {...bindTap('summary.word.open', { params: { wordId: w.id } })}
            className="flex w-full items-center border-b border-[#F2F2F2] px-4 py-3 text-left">
            <div>
              <div className="text-base font-semibold text-[#212121]">{w.word}</div>
              <div className="text-xs text-[#9AA5B1]">{w.pos} {w.meaning}</div>
            </div>
            <IcChevronRight size={16} color="#C9CDD3" className="ml-auto" />
          </button>
        ))}
      </div>
    </div>
  );
}

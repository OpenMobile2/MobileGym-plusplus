import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';
import { IcSpeaker } from '../res/icons';

export default function VocabTestPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const listen = sp.get('mode') === 'listen';
  const [i, setI] = useState(0);
  const word = st.words[i % st.words.length];
  const next = () => setI((v) => v + 1);
  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title={listen ? '听力词汇量测试' : '阅读词汇量测试'} />
      <div className="px-4 text-xs text-[#9AA5B1]">预词汇量:{listen ? '2161 ~ 3876' : '1921 ~ 3826'}</div>
      <div className="mx-4 mt-2 h-1 rounded-full bg-[#E4E7EC]"><div className="h-1 rounded-full" style={{ width: `${(i % 10) * 10}%`, background: colors.primary }} /></div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        {listen ? <IcSpeaker size={48} color={colors.primary} /> : <div className="text-4xl font-bold text-[#33405C]">{word.word}</div>}
      </div>
      <div className="px-4 pb-4">
        <div className="flex gap-3">
          <button {...action('vocab.test.known', () => next())} className="flex-1 rounded-2xl bg-white py-3.5 text-sm text-[#33405C]">认识</button>
          <button {...action('vocab.test.unknown', () => next())} className="flex-1 rounded-2xl bg-white py-3.5 text-sm text-[#33405C]">不认识</button>
        </div>
        <button {...action('vocab.test.unsure', () => next())} className="mt-3 w-full rounded-2xl bg-white py-3.5 text-sm text-[#33405C]">我不确定</button>
        <button {...action('vocab.test.skipwarm', () => st.showToast('直接开始测试'))} className="mt-3 w-full text-center text-xs text-[#5B78C8]">跳过预热环节,直接开始测试</button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { PageHeader } from '../components/common';

// 单词自检(8407):只给词,自评「记得 / 不记得」;待过 N
export default function TrainSelfCheckPage() {
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [pool] = useState(() => st.words.filter((w) => w.meaning && w.meaning !== '(阅读收藏)').slice(0, 10));
  const [i, setI] = useState(0);
  const [known, setKnown] = useState(0);
  const word = pool[i % pool.length];
  const done = i >= pool.length;
  const next = () => setI((v) => v + 1);

  return (
    <div className="flex h-full flex-col bg-[#F7F8FA]" data-status-bar-foreground="dark">
      <PageHeader title="单词自检" right={<span className="text-xs text-[#C9CDD3]">待过 {Math.max(0, pool.length - i)}</span>} />
      {done ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="text-2xl font-bold text-[#33405C]">记得 {known}/{pool.length}</div>
        </div>
      ) : (
        <>
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <div className="text-4xl font-bold text-[#1B2A4A]">{word.word}</div>
          </div>
          <div className="flex gap-3 px-5 pb-8">
            <button {...action('train.selfcheck.unknown', () => { st.assessWord(word.id, false); next(); })}
              className="flex-1 rounded-xl bg-white py-4 text-center text-base text-[#33405C] shadow-sm">不记得</button>
            <button {...action('train.selfcheck.known', () => { st.assessWord(word.id, true); setKnown((k) => k + 1); next(); })}
              className="flex-1 rounded-xl bg-white py-4 text-center text-base text-[#33405C] shadow-sm">记得</button>
          </div>
        </>
      )}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';
import { buildOptions } from './_session';

export default function TrainChoicePage() {
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [pool] = useState(() => st.words.filter((w) => (st.learn[w.id]?.status ?? 'new') !== 'new').slice(0, 10));
  const list = pool.length >= 3 ? pool : st.words.slice(0, 10);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const word = list[i % list.length];
  const { options, correctIndex } = useMemo(() => buildOptions(word), [word]);
  const done = i >= list.length;
  return (
    <div className="flex h-full flex-col" style={{ background: colors.studyBg }} data-status-bar-foreground="dark">
      <PageHeader title="单词选义" />
      {done ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <div className="text-2xl font-bold text-[#33405C]">答对 {score}/{list.length}</div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-6">
          <div className="text-4xl font-bold text-[#1B2A4A]">{word.word}</div>
          <div className="mt-1 text-sm text-[#7B88A0]">美 {word.phonetic}</div>
          <div className="mt-6 grid w-full grid-cols-2 gap-3">
            {options.map((opt, k) => {
              const isWrong = picked === k && k !== correctIndex;
              const isRight = picked !== null && k === correctIndex;
              return (
                <button key={k} {...action('train.choice.answer', () => {
                  if (picked !== null) return;
                  setPicked(k);
                  const c = k === correctIndex;
                  st.answerWord(word.id, c);
                  if (c) setScore((sc) => sc + 1);
                  window.setTimeout(() => { setPicked(null); setI((v) => v + 1); }, 500);
                }, { params: { optionIndex: k } })}
                  className="min-h-[64px] rounded-2xl px-3 py-3 text-left text-sm"
                  style={{ background: isWrong ? colors.wrongBg : isRight ? colors.correctBg : colors.studyCard, color: isWrong ? colors.wrongText : '#33405C' }}>{opt}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

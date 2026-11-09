import React, { useMemo, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';
import { seededShuffle } from './_session';

// 中文选词(8387):给中文释义,从 4 个英文词里选对的
export default function TrainCnChoicePage() {
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [pool] = useState(() => st.words.filter((w) => w.meaning && w.meaning !== '(阅读收藏)').slice(0, 10));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const word = pool[i % pool.length];
  const options = useMemo(() => {
    const others = st.words.filter((w) => w.id !== word.id && w.word).slice(0, 20);
    const distract = seededShuffle(others, word.word.length + 3).slice(0, 3).map((w) => w.word);
    return seededShuffle([word.word, ...distract], word.word.charCodeAt(0) + 5);
  }, [st.words, word]);
  const correctIndex = options.indexOf(word.word);
  const done = i >= pool.length;

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title="中文选词" />
      {done ? (
        <div className="flex min-h-0 flex-1 items-center justify-center text-2xl font-bold text-[#33405C]">答对 {score}/{pool.length}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col px-6">
          <div className="mt-16 text-center text-lg font-semibold text-[#33405C]">{word.pos} {word.meaning}</div>
          <div className="mt-auto mb-8 space-y-3">
            {options.map((opt, k) => {
              const isWrong = picked === k && k !== correctIndex;
              const isRight = picked !== null && k === correctIndex;
              return (
                <button key={k} {...action('train.cnchoice.answer', () => {
                  if (picked !== null) return;
                  setPicked(k);
                  const correct = k === correctIndex;
                  st.answerWord(word.id, correct);
                  if (correct) setScore((s) => s + 1);
                  window.setTimeout(() => { setPicked(null); setI((v) => v + 1); }, 500);
                }, { params: { optionIndex: k } })}
                  className="w-full rounded-2xl py-4 text-center text-base"
                  style={{ background: isWrong ? colors.wrongBg : isRight ? colors.correctBg : '#fff', color: isWrong ? colors.wrongText : '#33405C' }}>{opt}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

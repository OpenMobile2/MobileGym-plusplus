import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

export default function TrainSpellPage() {
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const list = st.words.filter((w) => (st.learn[w.id]?.status ?? 'new') !== 'new').slice(0, 10);
  const pool = list.length >= 3 ? list : st.words.slice(0, 10);
  const [i, setI] = useState(0);
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  const [score, setScore] = useState(0);
  const word = pool[i % pool.length];
  const done = i >= pool.length;
  const submit = () => {
    if (typed.trim().toLowerCase() === word.word.toLowerCase()) {
      st.answerWord(word.id, true); setScore((value) => value + 1); setTyped(''); setWrong(false); setI((v) => v + 1);
    } else { st.answerWord(word.id, false); setWrong(true); }
  };
  return (
    <div className="flex h-full flex-col" style={{ background: colors.studyBg }} data-status-bar-foreground="dark">
      <PageHeader title="单词拼写" />
      {done ? <div className="flex min-h-0 flex-1 items-center justify-center text-2xl font-bold text-[#33405C]">拼对 {score}/{pool.length}</div> : <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-10">
        <div className="text-sm text-[#7B88A0]">{word.pos} {word.meaning}</div>
        {wrong && <div className="mt-2 text-[#FE1225]">正确:{word.word}</div>}
        <input value={typed} onChange={(e) => setTyped(e.target.value)}
          {...action('train.spell.input', () => {}, { params: { value: typed } })}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="拼写这个词" autoFocus
          className="mt-4 w-full rounded-2xl bg-white/70 px-4 py-3 text-center text-2xl font-bold tracking-widest text-[#1B2A4A] outline-none" />
        <button data-keep-keyboard="true" onClick={submit} className="mt-4 w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: colors.primary }}>确认</button>
      </div>}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';
import { seededShuffle } from './_session';

// 填空拼写(8388):词大部分给出、中间挖空,从字母块里选正确的填空
export default function TrainFillblankPage() {
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [pool] = useState(() => st.words.filter((w) => w.meaning && w.meaning !== '(阅读收藏)' && w.word.length >= 5).slice(0, 10));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const word = pool[i % pool.length];

  // 挖掉中间 2 个字母
  const { shown, opts, correctIndex } = useMemo(() => {
    const w = word.word;
    const mid = Math.floor(w.length / 2) - 1;
    const ans = w.slice(mid, mid + 2);
    const shownStr = w.slice(0, mid) + '__' + w.slice(mid + 2);
    const distract = ['an', 'un', 'in', 'on', 'en', 'or', 'ar', 'le'].filter((x) => x !== ans).slice(0, 4);
    const o = seededShuffle([ans, ...distract.slice(0, 4)], w.length + 2);
    return { shown: shownStr, answer: ans, opts: o, correctIndex: o.indexOf(ans) };
  }, [word]);

  const done = i >= pool.length;

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title="填空拼写" />
      {done ? (
        <div className="flex min-h-0 flex-1 items-center justify-center text-2xl font-bold text-[#33405C]">完成!</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center px-6">
          <div className="mt-20 text-3xl font-bold tracking-widest text-[#1B2A4A]">
            {shown.split('').map((ch, k) => ch === '_'
              ? <span key={k} className="mx-0.5 inline-block h-0.5 w-5 bg-[#B0B8C4] align-middle" />
              : <span key={k}>{ch}</span>)}
          </div>
          <div className="mt-3 text-sm text-[#7B88A0]">{word.pos} {word.meaning}</div>
          <div className="mt-auto mb-10 grid grid-cols-3 gap-3">
            {opts.map((o, k) => {
              const isWrong = picked === k && k !== correctIndex;
              const isRight = picked !== null && k === correctIndex;
              return (
                <button key={k} {...action('train.fillblank.pick', () => {
                  if (picked !== null) return;
                  setPicked(k);
                  st.answerWord(word.id, k === correctIndex);
                  window.setTimeout(() => { setPicked(null); setI((v) => v + 1); }, 550);
                }, { params: { optionIndex: k } })}
                  className="rounded-xl px-6 py-4 text-center text-lg font-semibold shadow-sm"
                  style={{ background: isWrong ? colors.wrongBg : isRight ? colors.correctBg : '#fff', color: isWrong ? colors.wrongText : '#33405C' }}>{o}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

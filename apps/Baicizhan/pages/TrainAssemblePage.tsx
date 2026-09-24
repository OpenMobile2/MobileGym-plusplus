import React, { useMemo, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';
import { seededShuffle } from './_session';

// 组合拼写(8389):中文释义 + 空格,用字母块按顺序拼出单词
function chunks(word: string): string[] {
  const n = word.length;
  if (n <= 4) return [word.slice(0, 2), word.slice(2)];
  const a = Math.floor(n / 3), b = Math.floor((2 * n) / 3);
  return [word.slice(0, a), word.slice(a, b), word.slice(b)].filter(Boolean);
}

export default function TrainAssemblePage() {
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [pool] = useState(() => st.words.filter((w) => w.meaning && w.meaning !== '(阅读收藏)' && w.word.length >= 4).slice(0, 10));
  const [i, setI] = useState(0);
  const word = pool[i % pool.length];
  const target = word.word;

  // 已放入拼装区的 tile 下标(按顺序);tile 一次性使用
  const [used, setUsed] = useState<number[]>([]);
  const [shake, setShake] = useState(false);

  const tiles = useMemo(() => {
    const correct = chunks(target);
    // 干扰块:取其它词的片段,且不与正确块重复(避免歧义)
    const distract: string[] = [];
    for (const w of st.words) {
      if (w.id === word.id || w.word.length < 4) continue;
      for (const c of chunks(w.word)) {
        if (!correct.includes(c) && !distract.includes(c) && distract.length < 2) distract.push(c);
      }
      if (distract.length >= 2) break;
    }
    return seededShuffle([...correct, ...distract], target.length + 9);
  }, [st.words, target, word.id]);

  const current = used.map((k) => tiles[k]).join('');
  const solved = current === target;

  const next = () => { setUsed([]); setShake(false); setI((v) => v + 1); };

  const onTile = (k: number) => {
    if (solved || used.includes(k)) return;          // tile 一次性,已用不可再点
    const nb = [...used, k];
    const str = nb.map((x) => tiles[x]).join('');
    if (str === target) { st.answerWord(word.id, true); setUsed(nb); window.setTimeout(next, 700); return; }
    if (target.startsWith(str)) { setUsed(nb); return; }  // 仍是正确前缀,继续拼
    st.answerWord(word.id, false);
    setShake(true);                                       // 拼错:抖一下并清空重来
    window.setTimeout(() => { setUsed([]); setShake(false); }, 450);
  };

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]" data-status-bar-foreground="dark">
      <PageHeader title="组合拼写" />
      <div className="flex min-h-0 flex-1 flex-col items-center px-6">
        <div className="mt-20 flex min-h-[42px] items-center text-2xl font-bold tracking-widest"
          style={{ color: solved ? '#3DBE6B' : shake ? colors.spellWrong : '#1B2A4A' }}>
          {current || target.split('').map((_, k) => <span key={k} className="mx-0.5 inline-block h-0.5 w-5 bg-[#B0B8C4] align-middle" />)}
        </div>
        <div className="mt-3 text-sm text-[#7B88A0]">{word.pos} {word.meaning}</div>
        {solved && <div className="mt-2 text-sm font-semibold text-[#3DBE6B]">✓ 正确</div>}

        <div className="mt-auto mb-10 flex flex-wrap justify-center gap-3">
          {tiles.map((t, k) => {
            const isUsed = used.includes(k);
            return (
              <button key={k} {...action('train.assemble.pick', () => onTile(k), { params: { tile: k } })}
                className="rounded-xl px-6 py-3 text-base font-semibold shadow-sm transition-opacity"
                style={{ background: '#fff', color: '#33405C', opacity: isUsed ? 0.25 : 1 }}>
                {t}
              </button>
            );
          })}
        </div>
        <button onClick={() => setUsed([])} className="mb-6 text-xs text-[#9AA5B1]">清空重拼</button>
      </div>
    </div>
  );
}

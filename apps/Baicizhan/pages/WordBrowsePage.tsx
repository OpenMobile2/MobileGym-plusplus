import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { WordImage } from '../components/common';
import { IcArrowLeft, IcArrowRight, IcStar, IcPlay, IcPause, IcList, IcSettings } from '../res/icons';

export default function WordBrowsePage() {
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const initialIndex = Math.max(0, st.words.findIndex((item) => item.id === sp.get('wordId')));
  const [i, setI] = useState(initialIndex);
  const [playing, setPlaying] = useState(true);
  const word = st.words[i % st.words.length];
  const collected = st.learn[word.id]?.collected ?? false;
  return (
    <div className="flex h-full flex-col" style={{ background: colors.studyBg }} data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <button {...bindBack()}><IcArrowLeft size={22} /></button>
        <div className="flex-1 text-xs text-[#7B88A0]">{i + 1}/{st.words.length} · 暂无上一词</div>
        <span className="text-[#9AA5B1]">⏱</span>
        <button {...action('word.browse.collect', () => st.collectWord(word.id))}><IcStar size={20} color={collected ? '#F5C518' : '#C9CDD3'} /></button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6">
        <div className="text-4xl font-bold text-[#1B2A4A]">{word.word}</div>
        <div className="mt-1 text-sm text-[#7B88A0]">美 {word.phonetic}</div>
        <div className="mt-2 text-sm text-[#33405C]">{word.pos} {word.meaning}</div>
        <div className="mt-4 w-full rounded-2xl bg-white/60 p-3">
          <div className="text-sm text-[#33405C]">{word.sentence}</div>
          <div className="text-xs text-[#8A93A6]">{word.sentenceCn}</div>
          <WordImage id={word.word} label={word.word} className="mt-2 h-24 w-full" rounded={10} />
        </div>
        <button {...bindTap('word.browse.studyDetail.open', { params: { wordId: word.id } })}
          className="mt-4 rounded-full bg-white/80 px-5 py-2 text-sm font-semibold text-[#2F58E8]">
          学习详情
        </button>
      </div>
      <div className="flex items-center justify-around bg-white/60 px-6 py-3">
        <button {...bindBack()}><IcList size={22} color="#33405C" /></button>
        <button {...action('word.browse.prev', () => setI((v) => Math.max(0, v - 1)))}><IcArrowLeft size={22} color="#33405C" /></button>
        <button {...action('word.browse.playpause', () => setPlaying((p) => !p))} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#C9D6EC]">{playing ? <IcPause size={22} color={colors.primary} /> : <IcPlay size={22} color={colors.primary} />}</button>
        <button {...action('word.browse.next', () => setI((v) => Math.min(st.words.length - 1, v + 1)))}><IcArrowRight size={22} color="#33405C" /></button>
        <button {...bindTap('word.browse.unavailable.open', { params: { feature: '速刷设置' } })}><IcSettings size={22} color="#33405C" /></button>
      </div>
    </div>
  );
}

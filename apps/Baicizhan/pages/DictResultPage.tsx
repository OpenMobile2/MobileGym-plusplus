import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { WordImage } from '../components/common';
import { IcArrowLeft, IcSearch, IcStar, IcSpeaker } from '../res/icons';

const RTABS = [
  { key: 'sentence', id: 'dict.rtab.select.sentence', label: '例句' },
  { key: 'phrase', id: 'dict.rtab.select.phrase', label: '词组' },
  { key: 'mnemonic', id: 'dict.rtab.select.mnemonic', label: '助记' },
  { key: 'derived', id: 'dict.rtab.select.derived', label: '派生' },
  { key: 'other', id: 'dict.rtab.select.other', label: '其他' },
] as const;

export default function DictResultPage() {
  const s = useStrings();
  const { action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const toast = () => st.showToast(s.notAvailable);
  const query = st._temp.dictQuery.trim().toLowerCase();
  // 按查询词匹配词库(前缀优先,其次包含);无输入则取第一个
  const matches = query
    ? st.words.filter((w) => w.word.toLowerCase().startsWith(query)).concat(
        st.words.filter((w) => !w.word.toLowerCase().startsWith(query) && w.word.toLowerCase().includes(query)))
    : st.words;
  const [pickedId, setPickedId] = useState<string | null>(sp.get('wordId'));
  const [rtab, setRtab] = useState('sentence');
  const word = st.words.find((w) => w.id === pickedId) ?? matches[0] ?? st.words[0];
  const noResult = query.length > 0 && matches.length === 0 && !pickedId;
  const collected = st.learn[word.id]?.collected ?? false;
  const suggestions = (matches.length ? matches : st.words).slice(0, 10);
  const setPicked = (id: string) => setPickedId(id);

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <button {...bindBack()}><IcArrowLeft size={22} color="#33405C" /></button>
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#F2F3F5] px-3 py-1.5">
          <IcSearch size={16} color="#9AA5B1" /><span className="text-sm text-[#33405C]">{noResult ? st._temp.dictQuery : word.word}</span>
        </div>
      </div>

      {noResult ? (
        <div className="flex flex-col items-center py-20 text-sm text-[#9AA5B1]">词库中暂未收录「{st._temp.dictQuery}」</div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
          <div className="mt-2 flex items-start">
            <div>
              <div className="text-2xl font-bold text-[#212121]">{word.word}</div>
              <button {...action('dict.result.sound', () => {
                if (!st.settings.sound || !('speechSynthesis' in window)) { st.showToast('请先开启单词发音'); return; }
                const utterance = new SpeechSynthesisUtterance(word.word); utterance.lang = 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
              })} className="mt-1 flex items-center gap-1 text-sm text-[#5B78C8]">{word.phonetic} <IcSpeaker size={14} /></button>
              <div className="mt-1 text-sm text-[#33405C]">{word.pos} {word.meaning}</div>
              <div className="mt-1 flex gap-1">{['初中', '高中', 'CET4'].map((t) => <span key={t} className="rounded bg-[#F2F3F5] px-1.5 py-0.5 text-[10px] text-[#9AA5B1]">{t}</span>)}</div>
            </div>
            <button {...action('dict.result.collect', () => st.collectWord(word.id))} className="ml-auto p-1"><IcStar size={24} color={collected ? '#2F58E8' : '#C9CDD3'} /></button>
          </div>

          <div className="mt-4 flex gap-4 border-b border-[#F0F0F0] pb-2 text-sm">
            {RTABS.map((t) => (
              <button key={t.key} {...action(t.id, () => setRtab(t.key))} style={{ color: rtab === t.key ? colors.primary : '#9AA5B1', fontWeight: rtab === t.key ? 600 : 400 }}>{t.label}</button>
            ))}
          </div>
          <div className="mt-3 rounded-xl bg-[#F7F8FA] p-3 text-sm text-[#33405C]">
            {rtab === 'sentence' && <><div>{word.sentence}</div><div className="mt-1 text-xs text-[#8A93A6]">{word.sentenceCn}</div><WordImage id={word.word} label={word.word} className="mt-2 h-24 w-full" rounded={10} /></>}
            {rtab !== 'sentence' && <div>{word.word} — {word.meaning}({RTABS.find((t) => t.key === rtab)?.label})</div>}
          </div>

          <div className="mt-4 flex justify-between">
            <button {...action('dict.result.report.wontfixToast', toast)} className="text-xs text-[#9AA5B1]">单词报错</button>
            <button {...action('dict.result.report.wontfixToast', toast)} className="text-xs text-[#9AA5B1]">举报</button>
          </div>

          <div className="mt-4 text-xs text-[#9AA5B1]">联想</div>
          {suggestions.map((w) => (
            <button key={w.id} {...action('dict.result.pick', () => setPicked(w.id), { params: { wordId: w.id } })}
              className="flex w-full items-baseline gap-2 border-b border-[#F4F4F4] py-2.5 text-left">
              <span className="text-base font-semibold text-[#212121]">{w.word}</span>
              <span className="text-xs text-[#9AA5B1]">{w.pos} {w.meaning}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

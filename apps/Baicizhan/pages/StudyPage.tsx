import React, { useMemo, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { WordImage } from '../components/common';
import { IcArrowLeft, IcMore, IcZhan, IcBulb, IcSpeaker, IcCheckCircle } from '../res/icons';
import { buildOptions, pickNewGroup } from './_session';

// 认识模式:答对显示绿卡后进词详情(此处内联为绿卡 → 自动下一词,词详情作为独立页由词云进入);
// 记忆模式:答对绿卡 + 连对,直接下一词。组末 → 结算页(直接路由,非声明 transition)。
export default function StudyPage() {
  const s = useStrings();
  const { action, bindBack, bindTap, go } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const mode = st.settings.studyMode;

  const [group] = useState(() => pickNewGroup(st.words, st.learn));
  const [idx, setIdx] = useState(0);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [assessMode, setAssessMode] = useState(false);
  const [pulled, setPulled] = useState(false);
  const [hideImg, setHideImg] = useState(false);
  const [hintOpen, setHintOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const word = group[idx];
  const { options, correctIndex } = useMemo(() => buildOptions(word), [word]);
  const isLast = idx + 1 >= group.length;

  const finishAndSettle = () => {
    st.finishGroup('new');
    go('study.complete.settle', { kind: 'new' });
  };

  const nextWord = () => {
    if (isLast) { finishAndSettle(); return; }
    setWrongPicks([]);
    setSolved(false);
    setPulled(false);
    setHintOpen(false);
    setMenuOpen(false);
    setAssessMode(mode === 'memory' ? !assessMode : false);
    setIdx((i) => i + 1);
  };

  // Q1=A:答错该选项标红,仍可继续选,直到答对才推进(不锁死)
  const onAnswer = (i: number) => {
    if (solved || wrongPicks.includes(i)) return;
    const correct = i === correctIndex;
    st.answerWord(word.id, correct);
    if (correct) { setSolved(true); window.setTimeout(nextWord, 620); }
    else { setWrongPicks((p) => [...p, i]); }
  };

  return (
    <div className="flex h-full flex-col" style={{ background: colors.studyBg }} data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <button {...bindBack()} className="p-1"><IcArrowLeft size={22} /></button>
        <div className="flex-1 rounded-full bg-white/60 px-3 py-1.5 text-xs text-[#7B88A0]">
          {idx === 0 ? s.noPrevWord : `${group[idx - 1].word}: ${group[idx - 1].meaning}`}
          <div className="mt-1 h-1 rounded-full bg-white">
            <div className="h-1 rounded-full" style={{ width: `${((idx + 1) / group.length) * 100}%`, background: colors.correctBg }} />
          </div>
        </div>
        <div className="relative">
          <button {...action('study.topmenu.open', () => setMenuOpen((v) => !v))} className="p-1"><IcMore size={20} /></button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-20 w-32 rounded-xl bg-white py-1 shadow-lg">
              <div className="px-3 py-2 text-xs text-[#9AA5B1]">当前:{mode === 'memory' ? '记忆模式' : '认识模式'}</div>
              <button {...action('study.mode.toggle', () => { st.setStudyMode(mode === 'memory' ? 'recognize' : 'memory'); setMenuOpen(false); st.showToast('切换记忆模式,背单词更高效'); })}
                className="block w-full px-3 py-2 text-left text-sm text-[#33405C]">切换{mode === 'memory' ? '认识' : '记忆'}模式</button>
            </div>
          )}
        </div>
      </div>

      <button {...action('study.card.pullup', () => setPulled(true))} className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-white/70" aria-label="pullup" />

      <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-3">
        {(!assessMode || pulled) && !hideImg && <WordImage id={word.word} label={word.word} className="mb-3 h-36 w-60" rounded={18} />}
        <div className="text-4xl font-bold" style={{ color: hintOpen ? colors.primary : '#1B2A4A' }}>{word.word}</div>
        <div className="mt-2 rounded-full bg-white/50 px-2 py-0.5 text-sm text-[#7B88A0]">美 {word.phonetic}</div>

        {/* 灯提示:例句(目标词标蓝)+ 释义,Q7=D */}
        {hintOpen && (
          <div className="mt-3 w-full rounded-2xl bg-white/60 px-4 py-3 text-sm text-[#33405C]">
            {word.sentence.split(new RegExp(`(${word.word})`, 'i')).map((seg, k) =>
              seg.toLowerCase() === word.word.toLowerCase()
                ? <b key={k} style={{ color: colors.primary }}>{seg}</b> : <span key={k}>{seg}</span>)}
            <div className="mt-1 text-xs text-[#8A93A6]">{word.sentenceCn}</div>
          </div>
        )}

        {!assessMode && (
          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            {options.map((opt, i) => {
              const isWrong = wrongPicks.includes(i);
              const isRight = solved && i === correctIndex;
              return (
                <button key={i} {...action('study.quiz.answer', () => onAnswer(i), { params: { optionIndex: i } })}
                  className="relative min-h-[64px] rounded-2xl px-3 py-3 text-left text-sm"
                  style={{ background: isWrong ? colors.wrongBg : isRight ? colors.correctBg : colors.studyCard, color: isWrong ? colors.wrongText : '#33405C' }}>
                  {opt}
                  {isRight && <span className="absolute right-2 top-2"><IcCheckCircle size={18} /></span>}
                </button>
              );
            })}
          </div>
        )}
        {assessMode && pulled && <div className="mt-4 rounded-2xl bg-white/60 px-4 py-3 text-center text-[#33405C]">{word.pos} {word.meaning}</div>}
      </div>

      {assessMode ? (
        <div className="flex gap-3 px-4 pb-3">
          <button {...action('study.assess.unknown', () => { st.assessWord(word.id, false); setAssessMode(false); setWrongPicks([]); setSolved(false); setPulled(false); })}
            className="flex-1 rounded-2xl bg-white/80 py-3 text-center">
            <div className="text-base font-bold text-[#33405C]">{s.studyUnknown}</div>
            <div className="text-xs text-[#9AA5B1]">{s.studyUnknownSub}</div>
          </button>
          <button {...action('study.assess.known', () => { st.assessWord(word.id, true); nextWord(); })}
            className="flex-1 rounded-2xl bg-white/80 py-3 text-center">
            <div className="text-base font-bold text-[#33405C]">{s.studyKnown}</div>
            <div className="text-xs text-[#9AA5B1]">{s.studyKnownSub}</div>
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-around px-6 pb-3 pt-2">
          <button {...action('study.tool.image', () => { setHideImg((v) => !v); st.showToast(hideImg ? '已显示配图' : '已隐藏配图'); })}
            className="text-lg" style={{ opacity: hideImg ? 0.4 : 1 }}>🖼️</button>
          <button {...action('study.tool.zhan', () => { st.toggleWordZhan(word.id); st.showToast('已斩,太简单啦'); nextWord(); })}><IcZhan size={22} color="#33405C" /></button>
          <button {...bindTap('study.unavailable.open', { params: { feature: 'AI 单词助记' } })} className="font-bold text-[#2FA8A0]">Ai</button>
          <button {...action('study.tool.hint', () => setHintOpen((v) => !v))}><IcBulb size={22} color={hintOpen ? colors.primary : '#9AA5B1'} /></button>
          <button {...action('study.tool.sound', () => {
            if (!st.settings.sound || !('speechSynthesis' in window)) { st.showToast('请先开启单词发音'); return; }
            const utterance = new SpeechSynthesisUtterance(word.word); utterance.lang = 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
          })}><IcSpeaker size={22} color="#5B78C8" /></button>
        </div>
      )}
    </div>
  );
}

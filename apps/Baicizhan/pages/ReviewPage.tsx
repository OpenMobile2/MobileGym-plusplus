import React, { useMemo, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { WordImage } from '../components/common';
import { IcArrowLeft, IcZhan, IcBulb, IcSpeaker } from '../res/icons';
import { buildOptions, pickReviewGroup } from './_session';

type Kind = 'recall' | 'quiz' | 'spell';
const KIND_OF = (i: number): Kind => (['recall', 'quiz', 'spell'] as const)[i % 3];

export default function ReviewPage() {
  const s = useStrings();
  const { action, bindBack, bindTap, go } = useBaicizhanGestures();
  const st = useBaicizhanStore();

  const [group] = useState(() => pickReviewGroup(st.words, st.learn));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [wrongPicks, setWrongPicks] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [typed, setTyped] = useState('');
  const [spellWrong, setSpellWrong] = useState(false);
  const [wrongAttempt, setWrongAttempt] = useState('');

  const word = group[idx];
  const kind = KIND_OF(idx);
  const { options, correctIndex } = useMemo(() => buildOptions(word), [word]);
  const isLast = idx + 1 >= group.length;

  const next = () => {
    if (isLast) { st.finishGroup('review'); go('review.complete.settle', { kind: 'review' }); return; }
    setIdx((i) => i + 1); setFlipped(false); setWrongPicks([]); setSolved(false); setTyped(''); setSpellWrong(false);
  };

  const onQuiz = (i: number) => {
    if (solved || wrongPicks.includes(i)) return;
    const c = i === correctIndex;
    st.answerWord(word.id, c);
    if (c) { setSolved(true); window.setTimeout(next, 550); }
    else { setWrongPicks((p) => [...p, i]); }
  };

  const submitSpell = () => {
    if (typed.trim().toLowerCase() === word.word.toLowerCase()) { st.answerWord(word.id, true); window.setTimeout(next, 400); }
    else { setWrongAttempt(typed.trim()); setSpellWrong(true); setTyped(''); st.answerWord(word.id, false); }
  };

  return (
    <div className="flex h-full flex-col" style={{ background: colors.studyBg }} data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <button {...bindBack()} className="p-1"><IcArrowLeft size={22} /></button>
        <div className="flex-1 rounded-full bg-white/60 px-3 py-1.5 text-xs text-[#7B88A0]">
          {idx === 0 ? s.noPrevWord : `${group[idx - 1].word}`}
          <div className="mt-1 h-1 rounded-full bg-white"><div className="h-1 rounded-full" style={{ width: `${((idx + 1) / group.length) * 100}%`, background: colors.correctBg }} /></div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center px-6 pt-3">
        {kind !== 'spell' && <WordImage id={word.word} label={word.word} className="mb-3 h-36 w-60" rounded={18} />}
        {kind === 'spell' && <WordImage id={word.word} label={word.word} className="mb-3 h-28 w-48" rounded={14} />}
        {kind !== 'spell' && <div className="text-4xl font-bold text-[#1B2A4A]">{word.word}</div>}
        {kind !== 'spell' && <div className="mt-2 rounded-full bg-white/50 px-2 py-0.5 text-sm text-[#7B88A0]">美 {word.phonetic}</div>}

        {kind === 'recall' && (
          <button {...action('review.recall.flip', () => setFlipped(true))} className="mt-6 rounded-2xl bg-white/60 px-6 py-4 text-sm text-[#33405C]">
            {flipped ? `${word.pos} ${word.meaning}` : '点一下屏幕,回想释义'}
          </button>
        )}

        {kind === 'quiz' && (
          <div className="mt-5 grid w-full grid-cols-2 gap-3">
            {options.map((opt, i) => {
              const isWrong = wrongPicks.includes(i);
              const isRight = solved && i === correctIndex;
              return (
                <button key={i} {...action('review.quiz.answer', () => onQuiz(i), { params: { optionIndex: i } })}
                  className="min-h-[64px] rounded-2xl px-3 py-3 text-left text-sm"
                  style={{ background: isWrong ? colors.wrongBg : isRight ? colors.correctBg : colors.studyCard, color: isWrong ? colors.wrongText : '#33405C' }}>{opt}</button>
              );
            })}
          </div>
        )}

        {kind === 'spell' && (
          <div className="mt-4 w-full">
            <div className="text-center text-sm text-[#7B88A0]">{word.pos} {word.meaning}</div>
            {spellWrong && (
              <div className="mt-2 text-center">
                {/* 冻结的错误拼写:与正确词逐字母比对,错字母标红(R2@00:21);不随后续输入变化 */}
                <div className="text-lg font-bold tracking-widest">
                  {wrongAttempt.split('').map((ch, k) => (
                    <span key={k} style={{ color: ch.toLowerCase() === (word.word[k] ?? '').toLowerCase() ? '#9AA5B1' : '#FE1225' }}>{ch}</span>
                  ))}
                </div>
                <div className="mt-1 text-lg font-bold tracking-widest text-[#33405C]">{word.word}</div>
                <div className="mt-1 text-xs text-[#E8912D]">错词巩固</div>
              </div>
            )}
            <input value={typed} onChange={(e) => setTyped(e.target.value)}
              {...action('review.spell.input', () => {}, { params: { value: typed } })}
              onKeyDown={(e) => { if (e.key === 'Enter') submitSpell(); }}
              placeholder="拼写这个词" autoFocus
              className="mt-3 w-full rounded-2xl bg-white/70 px-4 py-3 text-center text-2xl font-bold tracking-widest text-[#1B2A4A] outline-none" />
            <button data-keep-keyboard="true" onClick={submitSpell} className="mt-3 w-full rounded-full py-3 text-sm font-semibold text-white" style={{ background: colors.primary }}>确认</button>
          </div>
        )}
      </div>

      {kind === 'recall' ? (
        <div className="flex gap-3 px-4 pb-3">
          <button {...action('review.recall.unknown', () => { st.assessWord(word.id, false); next(); })} className="flex-1 rounded-2xl bg-white/80 py-3 text-center font-bold text-[#33405C]">{s.studyUnknown}</button>
          <button {...action('review.recall.known', () => { st.assessWord(word.id, true); next(); })} className="flex-1 rounded-2xl bg-white/80 py-3 text-center font-bold text-[#33405C]">{s.studyKnown}</button>
        </div>
      ) : (
        <div className="flex items-center justify-around px-4 pb-3 pt-2">
          {kind === 'spell' && <button {...action('review.spell.skip', () => next())} className="text-xs text-[#9AA5B1]">跳过</button>}
          <button {...action('review.tool.image', () => st.showToast('已隐藏配图'))} className="text-lg">🖼️</button>
          <button {...action('review.tool.zhan', () => st.toggleWordZhan(word.id))}><IcZhan size={22} color="#33405C" /></button>
          <button {...bindTap('review.unavailable.open', { params: { feature: 'AI 单词助记' } })} className="font-bold text-[#2FA8A0]">Ai</button>
          <button {...action('review.tool.hint', () => st.showToast('提示:首字母 ' + word.word[0]))}><IcBulb size={22} color="#9AA5B1" /></button>
          <button {...action('review.tool.sound', () => {
            if (!st.settings.sound || !('speechSynthesis' in window)) { st.showToast('请先开启单词发音'); return; }
            const utterance = new SpeechSynthesisUtterance(word.word); utterance.lang = 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
          })}><IcSpeaker size={22} color="#5B78C8" /></button>
          <button {...bindTap('review.unavailable.open', { params: { feature: '复习题型设置' } })} className="text-[10px] text-[#9AA5B1]">不想拼写?</button>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { WordImage } from '../components/common';
import { IcArrowLeft, IcStar, IcSpeaker, IcArrowRight, IcZhan } from '../res/icons';

const KTABS = [
  { key: 'roots', id: 'study.ktab.select.roots', label: '词根词缀' },
  { key: 'exam', id: 'study.ktab.select.exam', label: '真题考频' },
  { key: 'synonym', id: 'study.ktab.select.synonym', label: '同义替换' },
  { key: 'mnemonic', id: 'study.ktab.select.mnemonic', label: '小斩助记' },
] as const;

export default function WordDetailPage() {
  const s = useStrings();
  const { action, bindBack, bindTap, go, back } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();

  const wordId = sp.get('wordId') ?? st.words[0].id;
  const wIndex = Math.max(0, st.words.findIndex((w) => w.id === wordId));
  const word = st.words[wIndex] ?? st.words[0];
  const collected = st.learn[word.id]?.collected ?? false;

  const [ktab, setKtab] = useState<string>(word.roots ? 'roots' : 'exam');
  const [ptab, setPtab] = useState('phrase');
  const [stab, setStab] = useState('similar');
  const [examShown, setExamShown] = useState(false);
  const [sentenceCnShown, setSentenceCnShown] = useState(true);
  const toast = () => st.showToast(s.notAvailable);
  const gotoWord = (i: number) => go('study.detail.word.switch', { wordId: st.words[i].id }, { mode: 'replace' });

  return (
    <div className="flex h-full flex-col" style={{ background: colors.studyBg }} data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <button {...bindBack()} className="p-1"><IcArrowLeft size={22} /></button>
        <button {...action('study.detail.prevword', () => wIndex > 0 && gotoWord(wIndex - 1))}
          className="flex-1 rounded-full bg-white/60 px-3 py-1.5 text-left text-xs text-[#7B88A0]">
          {wIndex === 0 ? s.noPrevWord : `${st.words[wIndex - 1].word}: ${st.words[wIndex - 1].meaning}`}
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 词头 */}
        <div className="mt-2 flex items-start">
          <div>
            <div className="text-3xl font-bold text-[#1B2A4A]">{word.word}</div>
            <div className="mt-1 flex items-center gap-2 text-sm text-[#7B88A0]">
              <button {...action('study.word.pronounce', () => {
                if (!st.settings.sound || !('speechSynthesis' in window)) { st.showToast('请先开启单词发音'); return; }
                const utterance = new SpeechSynthesisUtterance(word.word); utterance.lang = 'en-US'; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance);
                st.recordStudyDetailEvent(word.id, 'pronounced');
              })} className="flex items-center gap-1">美 {word.phonetic} <IcSpeaker size={14} color="#5B78C8" /></button>
            </div>
            {word.examFreq && <div className="mt-1 text-xs text-[#8A93A6]">近5年在GRE考试中出现 <b className="text-[#E8912D]">{word.examFreq}</b> 次</div>}
            <div className="mt-1 text-sm text-[#33405C]">{word.pos} {word.meaning}</div>
          </div>
          <button {...action('study.word.collect', () => st.collectWord(word.id))} className="ml-auto p-1">
            <IcStar size={24} color={collected ? '#F5C518' : '#C9CDD3'} />
          </button>
        </div>

        {/* 知识 tab */}
        <div className="mt-4 rounded-2xl bg-white/60 p-1">
          <div className="flex">
            {KTABS.map((t) => (
              <button key={t.key} {...action(t.id, () => {
                setKtab(t.key);
                if (t.key === 'exam' || t.key === 'synonym') st.recordStudyDetailEvent(word.id, t.key);
              })}
                className="flex-1 rounded-xl py-2 text-xs font-medium"
                style={{ background: ktab === t.key ? '#fff' : 'transparent', color: ktab === t.key ? colors.primary : '#7B88A0' }}>{t.label}</button>
            ))}
          </div>
          <div className="px-3 py-3 text-sm text-[#33405C]">
            {ktab === 'roots' && <div>{word.roots ?? '暂无词根拆解'}</div>}
            {ktab === 'exam' && (
              <div>
                <div>该释义近5年出现 {word.examFreq ?? 0} 次,93% 在多选题中。</div>
                <div className="mt-2 rounded-xl bg-[#EAF0FB] p-3 text-[#33405C]">{word.sentence}</div>
                <button {...action('study.exam.reveal', () => setExamShown((v) => !v))} className="mt-2 text-xs text-[#5B78C8]">
                  {examShown ? `答案:${word.meaning}` : '点击查看答案和翻译'}
                </button>
                <button {...action('study.exam.more.wontfixToast', toast)} className="ml-3 mt-2 text-xs text-[#9AA5B1]">扫描全部考法 ›</button>
              </div>
            )}
            {ktab === 'synonym' && <div>{s.ktabSyn}:{word.options[0]} 等,扫描到 5 个同义替换,掌握地道用法 ›</div>}
            {ktab === 'mnemonic' && <div>「{word.word}」最常见的含义是「{word.meaning}」。小斩助记帮你记牢。</div>}
          </div>
        </div>

        {/* 例句轮播 */}
        <button {...action('study.sentence.swipe', () => setSentenceCnShown((value) => !value))} className="mt-3 w-full rounded-2xl bg-white/70 p-3 text-left">
          <div className="text-sm text-[#33405C]">{word.sentence}</div>
          <div className="mt-1 text-xs text-[#8A93A6]">{sentenceCnShown ? word.sentenceCn : '点击显示中文释义'}</div>
          <WordImage id={word.word} label={word.word} className="mt-2 h-24 w-full" rounded={12} />
        </button>

        {/* 词组搭配 */}
        <div className="mt-3 rounded-2xl bg-white/70 p-3">
          <div className="text-sm text-[#33405C]">{word.word} + 常见搭配 · 词组示例</div>
          <button {...action('study.phrase.more.wontfixToast', toast)} className="mt-2 text-xs text-[#5B78C8]">查看全部词组搭配 ›</button>
          <div className="mt-2 flex gap-3 text-xs">
            <button {...action('study.ptab.select.phrase', () => setPtab('phrase'))} style={{ color: ptab === 'phrase' ? colors.ink : '#9AA5B1' }}>词组搭配</button>
            <button {...action('study.ptab.select.derived', () => setPtab('derived'))} style={{ color: ptab === 'derived' ? colors.ink : '#9AA5B1' }}>派生词</button>
            <button {...action('study.ptab.select.endef', () => setPtab('endef'))} style={{ color: ptab === 'endef' ? colors.ink : '#9AA5B1' }}>英文释义</button>
          </div>
        </div>

        {/* 形近/近义词 */}
        <div className="mt-3 rounded-2xl bg-white/70 p-3">
          <div className="flex gap-3 text-xs">
            <button {...action('study.stab.select.similar', () => setStab('similar'))} style={{ color: stab === 'similar' ? colors.ink : '#9AA5B1' }}>形近词</button>
            <button {...action('study.stab.select.syn', () => setStab('syn'))} style={{ color: stab === 'syn' ? colors.ink : '#9AA5B1' }}>近义词</button>
            <button {...action('study.wordtv.wontfixToast', toast)} className="ml-auto text-[#9AA5B1]">单词TV</button>
          </div>
          <div className="mt-2 text-sm text-[#33405C]">{stab === 'similar' ? word.options.join(' / ') : word.meaning}</div>
        </div>
      </div>

      {/* 底部工具条 */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-white/70 px-4 py-2 backdrop-blur">
        <button {...action('study.nav.prev', () => wIndex > 0 && gotoWord(wIndex - 1))} className="p-1"><IcArrowLeft size={20} color={wIndex > 0 ? '#33405C' : '#C9CDD3'} /></button>
        <button {...action('study.nav.next', () => wIndex + 1 < st.words.length && gotoWord(wIndex + 1))} className="p-1"><IcArrowRight size={20} color="#33405C" /></button>
        <button {...action('study.detail.zhan', () => st.toggleWordZhan(word.id))}><IcZhan size={20} color="#33405C" /></button>
        <button {...bindTap('study.detail.unavailable.open', { params: { feature: 'AI 单词助记' } })} className="font-bold text-[#2FA8A0]">Ai</button>
        <button {...action('study.detail.continue', () => { st.recordStudyDetailEvent(word.id, 'continued'); back(); })}
          className="ml-auto rounded-full px-8 py-2.5 text-sm font-semibold text-white" style={{ background: colors.primarySoft }}>{s.continue}</button>
      </div>
    </div>
  );
}

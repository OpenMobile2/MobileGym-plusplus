import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { ArticleImage } from '../components/common';
import { IcArrowLeft, IcList, IcPause, IcPlay } from '../res/icons';

const RATES = [1, 1.25, 1.5, 2];

export default function ReadArticlePage() {
  const s = useStrings();
  const { action, bindBack, bindTap } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const article = st.articles.find((item) => item.id === sp.get('articleId')) ?? st.articles[0];
  const [wordCard, setWordCard] = useState<string | null>(null);
  const [font, setFont] = useState(16);
  const [playing, setPlaying] = useState(false);
  const [segment, setSegment] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rate, setRate] = useState(1);

  useEffect(() => {
    useBaicizhanStore.getState().markArticleRead(article.id);
    setPlaying(false);
    setSegment(0);
    setProgress(0);
    window.speechSynthesis?.cancel();
  }, [article.id]);

  useEffect(() => {
    if (!playing) {
      window.speechSynthesis?.cancel();
      return undefined;
    }

    const paragraph = article.body[segment];
    if (paragraph && st.settings.sound && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(paragraph.en);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }

    let currentProgress = 0;
    setProgress(0);
    const timer = window.setInterval(() => {
      currentProgress = Math.min(100, currentProgress + 4 * rate);
      setProgress(currentProgress);
      if (currentProgress >= 100) {
        window.clearInterval(timer);
        if (segment < article.body.length - 1) setSegment((value) => value + 1);
        else setPlaying(false);
      }
    }, 500);

    return () => {
      window.clearInterval(timer);
      window.speechSynthesis?.cancel();
    };
  }, [article.body, playing, rate, segment, st.settings.sound]);

  const previousSegment = () => {
    setSegment((value) => Math.max(0, value - 1));
    setProgress(0);
  };
  const nextSegment = () => {
    setSegment((value) => Math.min(article.body.length - 1, value + 1));
    setProgress(0);
  };
  const cycleRate = () => setRate((value) => RATES[(RATES.indexOf(value) + 1) % RATES.length]);

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <button {...bindBack()}><IcArrowLeft size={22} color="#33405C" /></button>
        <div className="ml-auto flex items-center gap-3 text-[#5B6B85]">
          <span className="text-[#C0C6D0]">译</span>
          <span className="text-[#C0C6D0]">精讲</span>
          <button {...action('read.article.audio.toggle', () => setPlaying((value) => !value))} className={playing ? 'text-[#2C7A6B]' : ''}>🎧</button>
          <button {...action('read.article.fontsize', () => setFont((value) => value >= 20 ? 14 : value + 2))} className="rounded px-1" aria-label="font-size">A<sup className="text-[9px]">{font}</sup></button>
          <span className="text-[#C0C6D0]">⚙</span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2 text-2xl font-bold text-[#212121]">{article.title}</div>
        <div className="mt-1 text-xs text-[#9AA5B1]">{article.wordCount}词 · {article.level} · 已为你标注核心词汇</div>
        <ArticleImage id={article.id} label={article.title} className="mt-3 h-40 w-full" rounded={12} />
        <button {...action('read.article.scroll', () => st.showToast('阅读进度已记录'))} className="hidden" aria-hidden />
        {article.body.map((paragraph, index) => (
          <div key={paragraph.en} className="mt-4 rounded-xl px-2 py-1 transition-colors" style={{ background: playing && segment === index ? '#F0F8F5' : 'transparent' }}>
            {playing && segment === index && <div className="mb-1 text-[10px] font-semibold text-[#2C7A6B]">正在朗读 · 第 {index + 1}/{article.body.length} 段</div>}
            <p className="leading-7 text-[#33405C]" style={{ fontSize: font }}>
              {paragraph.en.split(/\b/).map((token, tokenIndex) => (
                /^[a-zA-Z]{5,}$/.test(token)
                  ? <button key={`${token}-${tokenIndex}`} {...action('read.article.word', () => setWordCard(token), { params: { wordId: token } })} className="underline decoration-dotted underline-offset-4">{token}</button>
                  : <span key={`${token}-${tokenIndex}`}>{token}</span>
              ))}
              <span className="mt-1 block text-xs text-[#9AA5B1]">{paragraph.cn}</span>
            </p>
          </div>
        ))}
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-[#F0F0F0] bg-white px-4 pb-2 pt-2">
        <div className="mb-2 flex items-center gap-2 text-[10px] text-[#9AA5B1]"><span>{s.readingProgress}</span><div className="h-1 flex-1 overflow-hidden rounded-full bg-[#E4E9E7]"><div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: colors.readTeal }} /></div><span>{segment + 1}/{article.body.length}</span></div>
        <div className="flex items-center justify-around">
          <button {...action('read.article.audio.rate', cycleRate)} className="w-10 text-xs font-semibold text-[#5B6B85]">{rate.toFixed(rate === 1 ? 1 : 2)}x</button>
          <button {...action('read.article.audio.previous', previousSegment)} disabled={segment === 0} className="disabled:opacity-30">⏪</button>
          <button {...action('read.article.audio.toggle', () => setPlaying((value) => !value))} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#E6F4EF]">{playing ? <IcPause size={20} color={colors.readTeal} /> : <IcPlay size={20} color={colors.readTeal} />}</button>
          <button {...action('read.article.audio.next', nextSegment)} disabled={segment === article.body.length - 1} className="disabled:opacity-30">⏩</button>
          <button {...bindTap('read.article.toc.open', { params: { articleId: article.id } })} className="flex w-10 justify-center"><IcList size={20} color="#5B6B85" /></button>
        </div>
      </div>

      {wordCard && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/30" onClick={() => setWordCard(null)}>
          <div className="rounded-t-3xl bg-[#FBF6EC] p-4" onClick={(event) => event.stopPropagation()}>
            <div className="text-2xl font-bold text-[#33405C]">{wordCard}</div>
            <div className="mt-1 text-sm text-[#8A93A6]">英/美 音标</div>
            <div className="mt-2 text-sm text-[#33405C]">文中释义：{wordCard} 的中文含义</div>
            <div className="mt-2 flex gap-1">{['六级', '考研', '出国'].map((tag) => <span key={tag} className="rounded bg-white px-1.5 py-0.5 text-[10px] text-[#9AA5B1]">{tag}</span>)}</div>
            <button {...action('read.article.collect', () => { st.collectArticleWord(wordCard); setWordCard(null); })} className="mt-3 w-full rounded-full py-3 text-center text-sm font-semibold" style={{ color: colors.readTeal }}>➕ {s.addToWordbook}</button>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useBaicizhanStore, cartCount } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import {
  IcBolt, IcCoin, IcSearch, IcBook, IcChart, IcEdit, IcShare, IcStar,
} from '../res/icons';
import { LearningCover } from '../components/common';

const Pill: React.FC<{ children: React.ReactNode; onClick?: Record<string, any> }> = ({ children, onClick }) => (
  <button {...onClick} className="flex items-center gap-1 rounded-full bg-white/70 px-2.5 py-1 text-xs font-medium text-[#3A4A63]">{children}</button>
);

export default function HomePage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const [bannerOpen, setBannerOpen] = useState(true);
  void cartCount;

  const book = st.books.find((b) => b.id === st.currentBookId)!;
  const learnedInBook = Object.values(st.learn).filter((l) => l.status !== 'new').length;

  // 词云漂浮词:取单词本收藏的词(随收藏更新);不足则用已学词补
  const collectedIds = st.wordbooks.find((w) => w.id === 'wb_collect')?.wordIds ?? [];
  const cloudWords = collectedIds.map((id) => st.words.find((w) => w.id === id)).filter(Boolean) as typeof st.words;
  const cloud = (cloudWords.length >= 6 ? cloudWords.slice(-6) : st.words.slice(0, 6));

  return (
    <div className="flex h-full flex-col overflow-hidden" data-status-bar-foreground="dark"
      style={{ background: `linear-gradient(180deg, ${colors.homeBgTop} 0%, ${colors.homeBg} 42%)` }}>
      {/* 顶栏 */}
      <div className="flex items-center gap-2 px-4 pt-12">
        <button {...bindTap('home.avatar.open')} className="h-9 w-9 overflow-hidden rounded-full bg-white shadow">
          <div className="flex h-full w-full items-center justify-center text-lg">🐶</div>
        </button>
        <Pill onClick={bindTap('home.streak.open')}><IcBolt size={14} color="#F5A623" />{st.streakDays}{s.streakUnit}</Pill>
        <Pill onClick={bindTap('home.coin.open')}><IcCoin size={14} />{st.coins}</Pill>
        <div className="ml-auto" />
      </div>

      {/* 运营 banner */}
      {bannerOpen && (
        <div className="mx-4 mt-2 flex items-center rounded-2xl bg-[#EAF0FF] px-3 py-2">
          <button {...action('home.banner.wontfixToast', toast)} className="flex-1 text-left text-sm font-medium text-[#3355CC]">
            日韩法西英!场景会话免费练
          </button>
          <button {...action('home.banner.close', () => setBannerOpen(false))} className="px-1 text-[#9AA5B1]">✕</button>
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 词云区 + 右栏。h-56:右栏 4 个按钮约 4×46=184px,此前 h-40(160px)装不下,
            「会员」溢出压到下面的「返回旧版/分享/编辑」行上(Gate4v5:按钮重叠) */}
        <div className="relative mt-3 h-56">
          <div className="absolute inset-0">
            {cloud.map((w, i) => (
              <button key={w.id} {...bindTap('home.cloud.tap', { params: { wordId: w.id } })}
                className="absolute text-sm font-medium text-[#5B78C8]"
                style={{ left: `${8 + (i * 37) % 70}%`, top: `${10 + (i * 29) % 70}%` }}>{w.word}</button>
            ))}
          </div>
          <div className="absolute right-0 top-0 flex flex-col gap-2">
            {[
              { bind: bindTap('home.dict.open'), label: s.dict, Icon: IcSearch },
              { bind: bindTap('home.wordbook.open'), label: s.wordbook, Icon: IcBook },
              { bind: bindTap('home.read.open'), label: s.reading, Icon: IcBook },
              { bind: bindTap('home.member.open'), label: s.member, Icon: IcStar },
            ].map(({ bind, label, Icon }) => (
              <button key={label} {...bind} className="flex w-12 flex-col items-center gap-0.5 rounded-xl bg-white/70 py-1.5">
                <Icon size={16} color={colors.primary} /><span className="text-[10px] text-[#5B6B85]">{label}</span>
              </button>
            ))}
          </div>
          <div className="absolute left-0 top-0 flex flex-col gap-2">
            <button {...bindTap('home.task.open')} className="flex w-12 flex-col items-center gap-0.5 rounded-xl bg-white/70 py-1.5"><IcStar size={16} color="#E8912D" /><span className="text-[10px] text-[#5B6B85]">{s.task}</span></button>
            <button {...bindTap('home.rank.open')} className="flex w-12 flex-col items-center gap-0.5 rounded-xl bg-white/70 py-1.5"><IcChart size={16} color="#5B78C8" /><span className="text-[10px] text-[#5B6B85]">{s.rank}</span></button>
          </div>
        </div>

        {/* 返回旧版 + 图标行 */}
        <div className="mt-2 flex items-center">
          <button {...action('home.legacy.wontfixToast', toast)} className="rounded-full bg-white/70 px-3 py-1 text-xs text-[#8A93A6]">↩ {s.backToLegacy}</button>
          <div className="ml-auto flex items-center gap-3">
            <button {...bindTap('home.share.open')}><IcShare size={18} color="#7A8397" /></button>
            <button {...bindTap('home.edit.open')}><IcEdit size={18} color="#7A8397" /></button>
          </div>
        </div>

        {/* 词书卡 */}
        <div className="mt-2 rounded-3xl bg-white p-4 shadow-sm">
          <div className="flex items-center">
            <div className="text-xl font-bold text-[#212121]">{book.name}</div>
            <button {...bindTap('home.chart.open')} className="ml-auto"><IcChart size={18} color="#9AA5B1" /></button>
          </div>
          <button {...bindTap('home.book.plan.open')} className="mt-3 flex w-full items-center justify-end text-xs text-[#9AA5B1]">
            {learnedInBook}/{book.total}{s.wordsUnit} ›
          </button>
          <div className="mt-3 flex gap-3">
            <button {...bindTap('home.study.start')} className="flex flex-1 items-center justify-between rounded-full py-3 pl-4 pr-3 text-white" style={{ background: colors.primary }}>
              <span className="text-sm font-semibold">{s.newLearn}</span>
              <span className="text-xs opacity-90">{st.today.newDone}/{st.today.newTarget} {s.groupsUnit}</span>
            </button>
            <button {...bindTap('home.review.start')} className="flex flex-1 items-center justify-between rounded-full py-3 pl-4 pr-3 text-white" style={{ background: colors.primary }}>
              <span className="text-sm font-semibold">{s.review}</span>
              <span className="text-xs opacity-90">{st.today.reviewDone}/{st.today.reviewTarget} {s.groupsUnit}</span>
            </button>
          </div>
        </div>

        {/* 运营卡 ×3 */}
        {['雅思 英语能力证明的第二选择', '每日精读海量外刊', '如果你的听力很差'].map((t, i) => (
          <button key={i} {...action('home.promo.wontfixToast', toast)}
            className="mt-3 flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm">
            <LearningCover id={`home-promo-${i}`} title={t} icon={['IELTS', '📰', '🎧'][i]} compact className="h-12 w-16 shrink-0 rounded-xl" />
            <div>
              <div className="text-sm font-semibold text-[#212121]">{t}</div>
              <div className="mt-0.5 text-xs text-[#9AA5B1]">点击了解更多</div>
            </div>
          </button>
        ))}
        <div className="h-2" />
      </div>
    </div>
  );
}

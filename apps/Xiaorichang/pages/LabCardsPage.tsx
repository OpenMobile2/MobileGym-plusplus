import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { cardPhotoOf } from '../assets';
import { PageHeader } from '../components/common';

/**
 * 我的卡包(Gate4 补拍 s250)。原裁定 wontfix,证明有误:整页是纯展示。
 * 卡片来源 = today.card『存进卡包』(该动作也随之从 wontfix 改为真实现)。
 */
export default function LabCardsPage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const [expanded, setExpanded] = useState(false);
  const [shuffleIdx, setShuffleIdx] = useState(0);
  const n = st.cards.length;
  const featured = n ? st.cards[shuffleIdx % n] : null;

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]" data-status-bar-foreground="dark">
      <PageHeader title={s.cardsTitle} />
      <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm text-[#C9CDD3]">{s.cardsCount}: {n}</div>
            <div className="mt-1 text-2xl font-bold text-[#D5D8DC]">100% {s.cardsPerfectDays}</div>
            <div className="mt-1 text-sm text-[#C9CDD3]">{s.cardsRandomCount}: {n ? 1 : 0}</div>
          </div>
          <button {...action('lab.cards.shuffle', () => setShuffleIdx((i) => i + 1))}
            aria-label="随机" className="pt-2 text-2xl text-[#C9CDD3]">🔀</button>
        </div>

        {featured && (
          <div className="mt-5 overflow-hidden rounded-3xl bg-white shadow-sm">
            <img src={cardPhotoOf(featured.photo)} alt="" className="h-40 w-full object-cover" />
            <div className="flex justify-around px-4 py-3 text-center">
              <div><div className="text-base font-bold text-[#212121]">{featured.streakDays}d</div><div className="text-[10px] text-[#9AA5B1]">{s.cardsStreakDays}</div></div>
              <div><div className="text-base font-bold text-[#212121]">{featured.doneHabits}</div><div className="text-[10px] text-[#9AA5B1]">{s.cardsDoneHabits}</div></div>
              <div><div className="text-base font-bold text-[#212121]">{featured.glow}</div><div className="text-[10px] text-[#9AA5B1]">光芒值</div></div>
            </div>
            <div className="border-t border-dashed border-[#EEE] px-4 py-3 text-xs leading-relaxed text-[#6B7280]">
              {text(featured.note || featured.quote)}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <button {...action('lab.cards.viewAll', () => setExpanded((v) => !v))}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#212121] shadow-sm">
            🗂 {s.cardsViewAll}
          </button>
        </div>

        {expanded && (
          n === 0 ? (
            <div className="pt-10 text-center text-sm text-[#C9CDD3]">{s.cardsEmpty}</div>
          ) : (
            <div className="mt-5 grid grid-cols-2 gap-3">
              {st.cards.map((c) => (
                <div key={c.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                  <img src={cardPhotoOf(c.photo)} alt="" className="h-24 w-full object-cover" />
                  <div className="px-2 py-2 text-center">
                    <div className="text-xs font-semibold text-[#424242]">{c.date}</div>
                    <div className="text-[10px] text-[#9AA5B1]">☀ {c.glow}</div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}

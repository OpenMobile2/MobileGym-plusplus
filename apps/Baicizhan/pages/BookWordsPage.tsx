import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { colors } from '../res/colors';
import { PageHeader } from '../components/common';

const TABS = [
  { key: 'all', id: 'book.words.tab.select.all', label: '全部' },
  { key: 'today', id: 'book.words.tab.select.today', label: '今日' },
  { key: 'new', id: 'book.words.tab.select.new', label: '未学习' },
  { key: 'learning', id: 'book.words.tab.select.learning', label: '学习中' },
  { key: 'known', id: 'book.words.tab.select.known', label: '已熟识' },
  { key: 'zhan', id: 'book.words.tab.select.zhan', label: '已斩' },
] as const;

export default function BookWordsPage() {
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [tab, setTab] = useState('all');
  const [preview, setPreview] = useState(true);
  const book = st.books.find((b) => b.id === st.currentBookId)!;
  const words = st.words.filter((w) => {
    if (tab === 'all') return true;
    const l = st.learn[w.id];
    if (tab === 'today') return l?.nextReviewDay === 0;
    return (l?.status ?? 'new') === tab;
  });
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title="单词列表" right={<>
        <button {...action('book.words.preview', () => setPreview((v) => !v))} className="text-[#33405C]">👁</button>
        <button {...bindTap('book.words.unavailable.open', { params: { feature: '单词列表编辑' } })} className="text-[#33405C]">✎</button>
      </>} />
      <div className="flex gap-2 overflow-x-auto px-3 py-2">
        {TABS.map((t) => (
          <button key={t.key} {...action(t.id, () => setTab(t.key))} className="shrink-0 rounded-full px-3 py-1 text-xs"
            style={{ background: tab === t.key ? '#EAF0FF' : '#F2F3F5', color: tab === t.key ? colors.primary : '#5B6B85' }}>{t.label}</button>
        ))}
      </div>
      <div className="px-4 text-xs text-[#9AA5B1]">共 {book.total} 词 · 按词书默认排序</div>
      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {words.map((w) => {
          const l = st.learn[w.id];
          return (
            <button key={w.id} {...bindTap('book.words.open', { params: { wordId: w.id } })} className="flex w-full items-center border-b border-[#F4F4F4] px-4 py-3 text-left">
              <div className="mr-3 h-3 w-1 rounded" style={{ background: colors.primary }} />
              <div className="text-base font-semibold text-[#212121]">{w.word}</div>
              {preview && <div className="ml-2 text-xs text-[#9AA5B1]">{w.meaning}</div>}
              <div className="ml-auto text-xs text-[#9AA5B1]">{l?.status === 'zhan' ? '已斩' : `下次复习: ${l?.nextReviewDay ?? 0}天后`}</div>
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-around rounded-t-2xl border-t border-[#F0F0F0] bg-white px-2 py-3 text-[10px] text-[#5B78C8]">
        <button {...bindTap('book.words.unavailable.open', { params: { feature: '速听训练' } })} className="flex flex-col items-center gap-1">🎧<span>速听</span></button>
        <button {...bindTap('book.words.brush', { params: { wordId: words[0]?.id ?? st.words[0].id } })} className="flex flex-col items-center gap-1">⚡<span>速刷</span></button>
        <button {...bindTap('book.words.choice.open')} className="flex flex-col items-center gap-1">📝<span>单词选义</span></button>
        <button {...bindTap('book.words.spell.open')} className="flex flex-col items-center gap-1">🔤<span>拼写</span></button>
        <button {...bindTap('book.words.unavailable.open', { params: { feature: '听写训练' } })} className="flex flex-col items-center gap-1">✍️<span>听写</span></button>
      </div>
    </div>
  );
}

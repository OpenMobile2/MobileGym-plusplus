import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { LearningCover, PageHeader } from '../components/common';
import { IcSearch } from '../res/icons';

const CATS = [
  { key: 'hot', id: 'book.store.cat.select.hot', label: '热门' },
  { key: 'college', id: 'book.store.cat.select.college', label: '大学' },
  { key: 'highschool', id: 'book.store.cat.select.highschool', label: '高中' },
  { key: 'midschool', id: 'book.store.cat.select.midschool', label: '初中' },
  { key: 'abroad', id: 'book.store.cat.select.abroad', label: '留学' },
] as const;

export default function BookStorePage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const [cat, setCat] = useState('hot');
  const [query, setQuery] = useState('');
  const list = st.books.filter((b) => (cat === 'hot' ? true : b.tag === cat)
    && `${b.name}${b.desc ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.bookStore} right={<button {...action('book.store.lang', toast)} className="rounded-full bg-[#F2F3F5] px-2 py-1 text-xs text-[#5B6B85]">英语 ▾</button>} />
      <div className="px-4">
        <label className="flex w-full items-center gap-2 rounded-full bg-[#F2F3F5] px-3 py-2 text-sm text-[#9AA5B1]"><IcSearch size={16} color="#9AA5B1" /><input {...action('book.store.search', () => {}, { params: { value: query } })} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索词书" className="min-w-0 flex-1 bg-transparent outline-none" /></label>
      </div>
      <div className="mt-3 flex gap-4 overflow-x-auto px-4 text-sm">
        {CATS.map((c) => (
          <button key={c.key} {...action(c.id, () => setCat(c.key))} className="shrink-0 pb-1" style={{ color: cat === c.key ? colors.primary : '#9AA5B1', fontWeight: cat === c.key ? 700 : 400, borderBottom: cat === c.key ? `2px solid ${colors.primary}` : 'none' }}>{c.label}</button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {list.map((b) => (
          <div key={b.id} className="flex items-center border-b border-[#F4F4F4] py-3">
            <LearningCover id={b.id} title={b.name} icon="Aa" compact className="h-14 w-11 shrink-0 rounded" />
            <div className="ml-3 flex-1"><div className="text-sm font-semibold text-[#212121]">{b.name} 🔥</div><div className="text-xs text-[#9AA5B1]">{b.desc}</div><div className="text-xs text-[#C9CDD3]">共 {b.total} 词</div></div>
            <button {...action('book.store.add', () => !b.added && st.addBook(b.id), { params: { bookId: b.id } })}
              className="rounded-full px-4 py-1.5 text-xs" style={{ background: b.added ? '#F2F3F5' : '#EAF0FF', color: b.added ? '#9AA5B1' : colors.primary }}>{b.added ? s.added : s.add}</button>
          </div>
        ))}
        {list.length === 0 && <div className="py-12 text-center text-sm text-[#9AA5B1]">当前分类没有匹配的词书</div>}
      </div>
    </div>
  );
}

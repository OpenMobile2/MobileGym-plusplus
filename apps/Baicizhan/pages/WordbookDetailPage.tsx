import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { Empty, PageHeader } from '../components/common';
import { IcChevronRight, IcMore } from '../res/icons';
import { seededShuffle } from './_session';

const SORTS = [
  { key: 'timeAsc', id: 'wordbook.sort.select.timeAsc', label: '按时间顺序' },
  { key: 'timeDesc', id: 'wordbook.sort.select.timeDesc', label: '按时间倒序' },
  { key: 'alphaAsc', id: 'wordbook.sort.select.alphaAsc', label: '按字母顺序' },
  { key: 'alphaDesc', id: 'wordbook.sort.select.alphaDesc', label: '按字母倒序' },
  { key: 'random', id: 'wordbook.sort.select.random', label: '随机乱序' },
] as const;

export default function WordbookDetailPage() {
  const s = useStrings();
  const { bindTap, action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sortOpen, setSortOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [sp] = useSearchParams();
  const wb = st.wordbooks.find((wordbook) => wordbook.id === sp.get('bookId')) ?? st.wordbooks[0];
  const sort = st.settings.wordSort;
  const allWords = st.words;

  const words = useMemo(() => {
    let list = wb.wordIds.map((id) => allWords.find((word) => word.id === id)).filter(Boolean) as typeof allWords;
    if (sort === 'alphaAsc') list = [...list].sort((a, b) => a.word.localeCompare(b.word));
    else if (sort === 'alphaDesc') list = [...list].sort((a, b) => b.word.localeCompare(a.word));
    else if (sort === 'timeDesc') list = [...list].reverse();
    else if (sort === 'random') list = seededShuffle(list, 42);
    return list;
  }, [allWords, wb.wordIds, sort]);

  const toggleSelected = (wordId: string) => setSelected((items) => items.includes(wordId) ? items.filter((id) => id !== wordId) : [...items, wordId]);
  const leaveBatch = () => { setBatchMode(false); setSelected([]); };

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={batchMode ? `${s.selectedCount} ${selected.length}` : wb.name} right={batchMode ? undefined : <>
        <button {...bindTap('wordbook.manage.open', { params: { bookId: wb.id } })} className="text-xs font-semibold text-[#5B78C8]">{s.manage}</button>
        <button {...action('wordbook.more.open', () => setMoreOpen((value) => !value))}><IcMore size={20} color="#33405C" /></button>
      </>} />

      <div className="flex items-center px-4 py-2 text-xs text-[#9AA5B1]">
        <span>共 {words.length} 词</span>
        {!batchMode && <button {...action('wordbook.sort.open', () => setSortOpen(true))} className="ml-auto">{SORTS.find((item) => item.key === sort)?.label} ▾</button>}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {words.map((word) => batchMode ? (
          <button key={word.id} {...action('wordbook.batch.word.toggle', () => toggleSelected(word.id), { params: { wordId: word.id } })}
            className="flex w-full items-center gap-3 border-b border-[#F4F4F4] px-4 py-3 text-left">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs" style={{ borderColor: selected.includes(word.id) ? colors.primary : '#C9CDD3', background: selected.includes(word.id) ? colors.primary : '#fff', color: '#fff' }}>{selected.includes(word.id) ? '✓' : ''}</span>
            <div><div className="text-base font-semibold text-[#212121]">{word.word}</div><div className="text-xs text-[#9AA5B1]">{word.pos} {word.meaning}</div></div>
          </button>
        ) : (
          <button key={word.id} {...bindTap('wordbook.word.open', { params: { wordId: word.id } })} className="flex w-full items-center border-b border-[#F4F4F4] px-4 py-3 text-left">
            <div><div className="text-base font-semibold text-[#212121]">{word.word}</div><div className="text-xs text-[#9AA5B1]">{word.pos} {word.meaning}</div></div>
            <IcChevronRight size={16} color="#C9CDD3" className="ml-auto" />
          </button>
        ))}
        {words.length === 0 && (
          <div className="px-4">
            <Empty text={s.noWords} icon="📘" />
            <button {...bindTap('wordbook.add.open', { params: { bookId: wb.id } })} className="w-full rounded-full bg-[#EAF0FF] py-3 text-sm font-semibold text-[#2F58E8]">＋ {s.addWords}</button>
          </div>
        )}
      </div>

      {batchMode ? (
        <div className="flex gap-3 border-t border-[#F0F0F0] p-4">
          <button {...action('wordbook.batch.cancel', leaveBatch)} className="flex-1 rounded-full bg-[#F2F3F5] py-3 text-sm text-[#5B6B85]">{s.cancel}</button>
          <button disabled={selected.length === 0} {...action('wordbook.batch.delete.submit', () => { st.removeWordsFromWordbook(wb.id, selected); leaveBatch(); })} className="flex-1 rounded-full bg-[#FFF0EE] py-3 text-sm font-semibold text-[#E4574C] disabled:opacity-40">删除（{selected.length}）</button>
        </div>
      ) : (
        <div className="flex items-center justify-around rounded-t-2xl border-t border-[#F0F0F0] bg-white px-2 py-3 text-[10px] text-[#5B78C8] shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
          <span className="flex flex-col items-center gap-1 text-[#C0C6D0]">🎧<span>速听 · 待开放</span></span>
          <button {...bindTap('wordbook.tool.brush')} className="flex flex-col items-center gap-1">⚡<span>速刷</span></button>
          <button {...bindTap('wordbook.tool.choice')} className="flex flex-col items-center gap-1">📝<span>单词选义</span></button>
          <button {...bindTap('wordbook.tool.spell')} className="flex flex-col items-center gap-1">🔤<span>拼写</span></button>
        </div>
      )}

      {sortOpen && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-black/30" onClick={() => setSortOpen(false)}>
          <div className="rounded-t-2xl bg-white pb-4" onClick={(event) => event.stopPropagation()}>
            <div className="py-3 text-center text-sm text-[#9AA5B1]">{s.sortOrder}</div>
            {SORTS.map((option) => (
              <button key={option.key} {...action(option.id, () => { st.setWordSort(option.key); setSortOpen(false); })} className="flex w-full items-center justify-center border-t border-[#F4F4F4] py-3.5 text-sm" style={{ color: sort === option.key ? colors.ink : '#5B6B85', fontWeight: sort === option.key ? 700 : 400 }}>{option.label} {sort === option.key ? '✓' : ''}</button>
            ))}
          </div>
        </div>
      )}

      {moreOpen && (
        <div className="absolute inset-0 z-30" onClick={() => setMoreOpen(false)}>
          <div className="absolute right-3 top-12 w-40 rounded-xl bg-white py-1 shadow-lg" onClick={(event) => event.stopPropagation()}>
            <button {...action('wordbook.batch.edit', () => { setBatchMode(true); setMoreOpen(false); })} className="block w-full px-4 py-2.5 text-left text-sm text-[#33405C]">{s.batchEdit}</button>
            <button {...bindTap('wordbook.add.open', { params: { bookId: wb.id } })} className="block w-full px-4 py-2.5 text-left text-sm text-[#33405C]">{s.addWords}</button>
            <button {...action('wordbook.accent.toggle', () => { st.toggleAccent(); setMoreOpen(false); })} className="block w-full px-4 py-2.5 text-left text-sm text-[#33405C]">切换{st.settings.accent === 'us' ? '英' : '美'}音</button>
            <div className="px-4 py-2.5 text-sm text-[#C0C6D0]">导出 PDF · 待开放</div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '../components/common';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { useBaicizhanStore } from '../state';
import { colors } from '../res/colors';
import { IcSearch } from '../res/icons';

export default function WordbookAddPage() {
  const s = useStrings();
  const { action, back } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [sp] = useSearchParams();
  const bookId = sp.get('bookId') ?? st.wordbooks[0]?.id ?? 'wb_collect';
  const wordbook = st.wordbooks.find((item) => item.id === bookId) ?? st.wordbooks[0];
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const candidates = useMemo(() => {
    const key = query.trim().toLowerCase();
    return st.words
      .filter((word) => !wordbook.wordIds.includes(word.id))
      .filter((word) => !key || word.word.toLowerCase().includes(key) || word.meaning.includes(key))
      .slice(0, 80);
  }, [query, st.words, wordbook.wordIds]);

  const toggle = (wordId: string) => setSelected((items) => items.includes(wordId) ? items.filter((id) => id !== wordId) : [...items, wordId]);
  const submit = () => {
    if (selected.length === 0) return;
    st.addWordsToWordbook(wordbook.id, selected);
    back();
  };

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={`${s.addWords} · ${wordbook.name}`} />
      <div className="px-4 pb-3">
        <div className="flex items-center gap-2 rounded-full bg-[#F2F3F5] px-3 py-2.5">
          <IcSearch size={16} color="#9AA5B1" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} {...action('wordbook.add.search.input', () => {}, { params: { value: query } })}
            placeholder={s.searchWords} className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {candidates.map((word) => {
          const checked = selected.includes(word.id);
          return (
            <button key={word.id} {...action('wordbook.add.word.toggle', () => toggle(word.id), { params: { wordId: word.id } })} className="flex w-full items-center gap-3 border-b border-[#F4F4F4] px-4 py-3 text-left">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs" style={{ borderColor: checked ? colors.primary : '#C9CDD3', background: checked ? colors.primary : '#fff', color: '#fff' }}>{checked ? '✓' : ''}</span>
              <div className="min-w-0"><div className="font-semibold text-[#212121]">{word.word}</div><div className="truncate text-xs text-[#9AA5B1]">{word.pos} {word.meaning}</div></div>
            </button>
          );
        })}
        {candidates.length === 0 && <div className="py-20 text-center text-sm text-[#9AA5B1]">没有可添加的匹配单词</div>}
      </div>
      <div className="border-t border-[#F0F0F0] p-4">
        <button disabled={selected.length === 0} {...action('wordbook.add.submit', submit, { params: { bookId: wordbook.id } })} className="w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-40" style={{ background: colors.primary }}>{s.addSelected}（{selected.length}）</button>
      </div>
    </div>
  );
}

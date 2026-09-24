import React, { useMemo, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { IcCamera, IcChevronRight, IcSearch, IcSpeaker } from '../res/icons';

export default function DictPage() {
  const s = useStrings();
  const { bindTap, action, bindBack, go } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const [query, setQuery] = useState('');
  const key = query.trim().toLowerCase();

  const suggestions = useMemo(() => {
    if (!key) return [];
    const prefix = st.words.filter((word) => word.word.toLowerCase().startsWith(key));
    const contains = st.words.filter((word) => !word.word.toLowerCase().startsWith(key)
      && (word.word.toLowerCase().includes(key) || word.meaning.includes(query.trim())));
    return [...prefix, ...contains].slice(0, 12);
  }, [key, query, st.words]);

  const updateQuery = (value: string) => {
    setQuery(value);
    st.setDictQuery(value);
  };

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 px-3 pt-12">
        <span className="text-[#C0C6D0]"><IcCamera size={22} color="#C0C6D0" /></span>
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#F2F3F5] px-3 py-2">
          <IcSearch size={16} color="#9AA5B1" />
          <input value={query} onChange={(event) => updateQuery(event.target.value)}
            onKeyDown={(event) => { if (event.key === 'Enter' && key) go('dict.query.submit'); }}
            {...action('dict.query.input', () => {}, { params: { value: query } })}
            placeholder={s.dictPlaceholder} autoFocus className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </div>
        <button {...bindBack()} className="text-sm text-[#33405C]">{s.cancel}</button>
      </div>

      <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        {!key && (
          <div className="rounded-2xl bg-[#F7F9FC] p-4">
            <div className="text-sm font-semibold text-[#33405C]">输入即联想</div>
            <div className="mt-1 text-xs leading-5 text-[#9AA5B1]">输入一个字母或中文释义，会列出一批相关候选词。点击任意候选即可查看详情。</div>
          </div>
        )}
        {key && suggestions.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#EEF0F4] bg-white shadow-sm">
            <div className="border-b border-[#F2F3F5] px-4 py-2 text-xs text-[#9AA5B1]">联想到 {suggestions.length} 个候选</div>
            {suggestions.map((word) => (
              <button data-keep-keyboard="true" key={word.id}
                {...bindTap('dict.suggestion.open', { params: { wordId: word.id }, beforeTrigger: () => st.setDictQuery(word.word) })}
                className="flex w-full items-center gap-3 border-b border-[#F4F4F4] px-4 py-3 text-left last:border-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2"><span className="text-base font-semibold text-[#212121]">{word.word}</span><span className="truncate text-[11px] text-[#7B88A0]">{word.phonetic}</span></div>
                  <div className="truncate text-xs text-[#9AA5B1]">{word.pos} {word.meaning}</div>
                </div>
                <IcSpeaker size={15} color="#9AA5B1" />
                <IcChevronRight size={15} color="#C9CDD3" />
              </button>
            ))}
          </div>
        )}
        {key && suggestions.length === 0 && <div className="py-16 text-center text-sm text-[#9AA5B1]">没有找到与「{query}」相关的候选词</div>}
      </div>

      <div className="border-t border-[#F0F0F0] p-3">
        <button data-keep-keyboard="true" disabled={!key} {...bindTap('dict.query.submit')} className="w-full rounded-full py-2.5 text-sm font-semibold text-white disabled:opacity-40" style={{ background: '#2F58E8' }}>
          {s.dict} {key ? `「${query}」` : ''}
        </button>
      </div>
    </div>
  );
}

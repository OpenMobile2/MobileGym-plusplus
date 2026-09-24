import React, { useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { IcSearch, IcClose } from '../res/icons';

export default function SearchLandingPage() {
  const { bindTap, go } = useKapiGestures();
  const history = useKapiStore((s) => s.searchHistory);
  const addSearchHistory = useKapiStore((s) => s.addSearchHistory);
  const [q, setQ] = useState('');

  const submit = (word: string) => {
    const w = word.trim();
    if (!w) return;
    addSearchHistory(w);
    go('search.query.submit', { q: w });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 h-12 shrink-0">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-3 py-2">
          <IcSearch size={18} className="text-[#B3B9C6]" />
          <input
            autoFocus
            data-action="search.query.input.value"
            data-action-type="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(q)}
            placeholder="搜索账单备注/分类/交易方"
            className="flex-1 bg-transparent border-none outline-none text-[15px]"
          />
        </div>
        <button {...bindTap('search.close')} className="text-[14px] text-[#8A92A6] bg-transparent border-none cursor-pointer">取消</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {history.length > 0 && (
          <>
            <div className="text-[13px] text-[#8A92A6] mb-2">搜索历史</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h}
                  {...bindTap('search.query.submit', { params: { q: h } })}
                  className="px-3 py-1.5 rounded-full bg-white text-[13px] text-[#5A6172] border-none cursor-pointer flex items-center gap-1"
                >
                  {h}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

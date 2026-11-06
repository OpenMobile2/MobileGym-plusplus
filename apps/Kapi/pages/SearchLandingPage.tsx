import React, { useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { IcSearch, IcClose } from '../res/icons';
import { useStrings } from '../hooks/useStrings';

export default function SearchLandingPage() {
  const { bindTap, go } = useKapiGestures();
  const s = useStrings();
  const history = useKapiStore((st) => st.searchHistory);
  const addSearchHistory = useKapiStore((st) => st.addSearchHistory);
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
        <div className="flex-1 flex items-center gap-2 bg-app-surface rounded-full px-3 py-2">
          <IcSearch size={18} className="text-app-text-muted" />
          <input
            autoFocus
            data-action="search.query.input.value"
            data-action-type="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit(q)}
            placeholder={s.searchBillsPlaceholder}
            className="flex-1 bg-transparent border-none outline-none text-[15px]"
          />
        </div>
        <button {...bindTap('search.close')} className="text-[14px] text-app-text-muted bg-transparent border-none cursor-pointer">{s.cancelBtn}</button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {history.length > 0 && (
          <>
            <div className="text-[13px] text-app-text-muted mb-2">{s.searchHistoryTitle}</div>
            <div className="flex flex-wrap gap-2">
              {history.map((h) => (
                <button
                  key={h}
                  {...bindTap('search.query.submit', { params: { q: h } })}
                  className="px-3 py-1.5 rounded-full bg-app-surface text-[13px] text-[#5A6172] border-none cursor-pointer flex items-center gap-1"
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

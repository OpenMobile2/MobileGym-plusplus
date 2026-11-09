import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { Card, CategoryIcon } from '../components/ui';
import { money, fmtDateTime } from '../components/format';
import { IcSort, IcClose } from '../res/icons';
import { useStrings } from '../hooks/useStrings';

export default function SearchResultPage() {
  const [sp] = useSearchParams();
  const q = sp.get('q') ?? '';
  const { bindTap, bindAction, back } = useKapiGestures();
  const s = useStrings();
  const bills = useKapiStore((st) => st.bills);
  const [desc, setDesc] = useState(true);

  const results = useMemo(() => {
    const matched = bills.filter(
      (b) => b.note.includes(q) || b.categoryName.includes(q) || (b.payee ?? '').includes(q),
    );
    return matched.sort((a, b) => (desc ? b.date - a.date : a.date - b.date));
  }, [bills, q, desc]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-3 h-12 shrink-0">
        <div className="flex-1 text-[14px] text-app-text">
          {s.searchResultPrefix}<span className="text-[#4B6EF5] font-semibold">{results.length}</span>{s.searchResultSuffix}
          {q && <span className="text-app-text-muted">（{q}）</span>}
        </div>
        <button {...bindAction('searchResult.sort.select.order', () => setDesc((d) => !d), { value: desc ? 'asc' : 'desc' })} className="bg-transparent border-none cursor-pointer"><IcSort size={18} className="text-app-text-muted" /></button>
        <button {...bindAction('searchResult.clear.input.reset', () => back())} className="bg-transparent border-none cursor-pointer"><IcClose size={18} className="text-app-text-muted" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="search-result" data-scroll-direction="vertical">
        {results.length === 0 && <div className="text-center text-[13px] text-app-text-muted py-10">{s.noMatchingBills}</div>}
        {results.map((b) => (
          <Card key={b.id} className="mb-2">
            <button {...bindTap('searchResult.bill.open', { params: { id: b.id } })} className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left">
              <CategoryIcon icon={b.icon} color={b.color} size={40} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-app-text truncate">{b.categoryName}{b.note ? ` · ${b.note}` : ''}</div>
                <div className="text-[12px] text-app-text-muted">{fmtDateTime(b.date)}</div>
              </div>
              <span className={`text-[15px] font-semibold ${b.type === 'income' ? 'text-[#FF7B4A]' : 'text-[#3D6CF0]'}`}>{b.type === 'income' ? '+' : '-'}¥{money(b.amount)}</span>
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

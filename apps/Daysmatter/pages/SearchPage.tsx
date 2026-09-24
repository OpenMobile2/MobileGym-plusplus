import { useState } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import EventRow from '../components/EventRow';
import { useI18n } from '../i18n';

export default function SearchPage() {
  const { t } = useI18n();
  const { bindTap, action, bindBack } = useDaysmatterGestures();
  const events = useDaysmatterStore((s) => s.events);
  const clearDraft = useDaysmatterStore((s) => s.clearDraft);
  const [q, setQ] = useState('');

  const results = q.trim()
    ? events.filter((e) => !e.archived && !e.parentId && e.title.toLowerCase().includes(q.trim().toLowerCase()))
    : [];

  return (
    <div data-status-bar-foreground="dark" className="flex h-full flex-col bg-[#EFEEE9]">
      <div className="flex h-[88px] flex-shrink-0 items-center gap-2 bg-white px-3 pt-10">
        <div className="flex flex-1 items-center gap-2 rounded-full bg-[#EFEEE9] px-3 py-1.5">
          <Search size={16} className="text-[#9A9A9A]" />
          <input
            {...action<HTMLInputElement>('search.query.input', () => {})}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('common.search')}
            autoFocus
            className="flex-1 bg-transparent text-[15px] outline-none placeholder:text-[#B0B0B0]"
          />
          {q && (
            <button {...action<HTMLButtonElement>('search.input.clear', () => setQ(''))} aria-label="clear">
              <X size={16} className="text-white" fill="#C4C4C4" />
            </button>
          )}
        </div>
        <button {...bindBack<HTMLButtonElement>()} className="px-1 text-[15px] text-[#6B6B6B]">{t('common.cancel')}</button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto py-3 no-scrollbar">
        {results.length > 0 ? (
          results.map((e) => <EventRow key={e.id} event={e} openTrigger="search.item-open" />)
        ) : (
          <div className="mt-24 flex flex-col items-center px-8 text-center">
            <span className="text-[72px] leading-none opacity-30 grayscale">🧑‍🚀</span>
            <p className="mt-3 text-[15px] text-[#9A9A9A]">{t('search.noResults')}</p>
            <button
              {...bindTap<HTMLButtonElement>('search.add-open', { beforeTrigger: () => clearDraft() })}
              className="mt-8 flex items-center gap-1.5 rounded-full bg-[#5B9BD5] px-6 py-3 text-[16px] font-semibold text-white shadow-md active:bg-[#4A90D9]"
            >
              <Plus size={20} /> {t('search.addEvent')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

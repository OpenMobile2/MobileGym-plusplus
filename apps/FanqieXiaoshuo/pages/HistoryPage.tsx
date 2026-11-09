import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useNotOpenToast, TopBar, BookCover } from '../components/ui';
import { IcSearch, IcMore } from '../res/icons';
import type { FanqieBook } from '../types';

const TABS = [
  { v: 'all', label: '全部', enabled: true },
  { v: 'reading', label: '阅读', enabled: true },
  { v: 'listen', label: '听书', enabled: false },
  { v: 'drama', label: '短剧', enabled: false },
  { v: 'manju', label: '漫剧', enabled: false },
] as const;

export default function HistoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useFanqieGestures();
  const s = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();

  const books = useFanqieStore((st) => st.books);
  const history = useFanqieStore((st) => st.history);
  const tab = searchParams.get('tab') || 'all';

  const bookOf = (bid: string): FanqieBook | undefined => books.find((b) => b.id === bid);
  const entries = history
    .map((h) => ({ h, b: bookOf(h.bookId) }))
    .filter((x): x is { h: typeof history[number]; b: FanqieBook } => !!x.b);

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
      <TopBar
        title={s.history}
        right={
          <div className="flex items-center">
            <button {...bindTap({ kind: 'action', id: 'history.tab.disabled' }, { onTrigger: showNotOpen })} className="w-7 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="搜索">
              <IcSearch size={18} className="text-(--app-c-text-regular)" />
            </button>
          </div>
        }
      />
      {/* tab 行 */}
      <div className="flex items-center gap-5 px-4 h-9 bg-(--app-c-bg-card) shrink-0 overflow-x-auto no-scrollbar border-b border-(--app-c-divider)">
        {TABS.map((t) => {
          const on = tab === t.v;
          return (
            <button
              key={t.v}
              {...(t.enabled
                ? bindTap({ kind: 'action', id: 'history.filter.select.target' }, {
                    params: { target: t.v },
                    onTrigger: () => setSearchParams((p) => { p.set('tab', t.v); return p; }, { replace: true }),
                  })
                : bindTap({ kind: 'action', id: 'history.tab.disabled' }, { onTrigger: showNotOpen }))}
              className={`shrink-0 bg-transparent border-none cursor-pointer p-0 ${on ? 'text-[14px] font-semibold text-(--app-c-brand)' : 'text-[13px] text-(--app-c-text-regular)'}`}
            >
              {t.label}
            </button>
          );
        })}
        <span className="flex-1" />
        <button {...bindTap({ kind: 'action', id: 'history.tab.disabled' }, { onTrigger: showNotOpen })} className="shrink-0 bg-transparent border-none cursor-pointer p-0" aria-label="更多">
          <IcMore size={16} className="text-(--app-c-text-tertiary)" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3" data-scroll-container="history-grid" data-scroll-direction="vertical">
        {entries.length === 0 ? (
          <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-20">{s.emptyHistory}</div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-4">
            {entries.map(({ h, b }) => {
              const read = h.chapterIdx >= 0;
              const bind = read
                ? bindTap('history.reader-open', { params: { id: b.id, ch: String(h.chapterIdx) } })
                : bindTap('history.bookdetail-open', { params: { id: b.id } });
              return (
                <div key={b.id} {...bind} className="cursor-pointer">
                  <BookCover book={b} className="w-full aspect-[3/4]" />
                  <div className="text-[12px] text-(--app-c-text-primary) mt-1 line-clamp-1">{b.title}</div>
                  <div className="text-[10px] text-(--app-c-text-tertiary) mt-0.5 line-clamp-1">
                    {read ? `第${h.chapterIdx + 1}章` : s.bookCoverPage}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {notOpenNode}
    </div>
  );
}

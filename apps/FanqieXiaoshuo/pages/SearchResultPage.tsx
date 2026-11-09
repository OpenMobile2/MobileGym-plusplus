import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useNotOpenToast, BookCover, Badge } from '../components/ui';
import { IcBack, IcSearch } from '../res/icons';
import type { FanqieBook } from '../types';

/** 结果分类 tab:仅「综合」实现,其余 wontfix(spec search.result) */
const RESULT_TABS = ['综合', '听书', '社区', '短剧', '漫剧', '漫画'] as const;

export default function SearchResultPage() {
  const [searchParams] = useSearchParams();
  const { bindTap, bindBack } = useFanqieGestures();
  const s = useFanqieStrings();
  const [notOpenNode, showNotOpen] = useNotOpenToast();

  const q = searchParams.get('q') || '';
  const books = useFanqieStore((st) => st.books);
  const authors = useFanqieStore((st) => st.authors);
  const shelf = useFanqieStore((st) => st.shelf);
  const progress = useFanqieStore((st) => st.progress);

  const authorName = (b: FanqieBook) => authors.find((a) => a.id === b.authorId)?.name ?? '';
  const matched = books.filter(
    (b) => b.title.includes(q) || authorName(b).includes(q) || b.tags.some((t) => t.includes(q)),
  );
  const list = matched.length ? matched : books.filter((b) => b.gender !== 'publish').slice(0, 10);

  /** Q13:读过/在书架 → 直进阅读器续读;否则进书籍详情 */
  const bindBook = (b: FanqieBook) => {
    const read = !!progress[b.id] || shelf.some((e) => e.bookId === b.id);
    return read
      ? bindTap('searchresult.reader-open', { params: { id: b.id, ch: String(progress[b.id] ?? 0) } })
      : bindTap('searchresult.bookdetail-open', { params: { id: b.id } });
  };

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
      {/* 顶栏:返回 + 搜索框(点回中间页改词) + 搜索 */}
      <div className="flex items-center h-11 px-1 bg-(--app-c-bg-card) shrink-0">
        <button {...bindBack()} className="w-9 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
          <IcBack size={22} className="text-(--app-c-text-primary)" />
        </button>
        <button
          {...bindTap('searchresult.search-open')}
          className="flex-1 h-8 rounded-full bg-(--app-c-bg-fill) flex items-center px-3 gap-1.5 border-none cursor-pointer min-w-0"
        >
          <IcSearch size={14} className="text-(--app-c-text-tertiary) shrink-0" />
          <span className="flex-1 text-left text-[13px] text-(--app-c-text-primary) truncate">{q}</span>
        </button>
        <button
          {...bindTap('searchresult.search-open')}
          className="shrink-0 px-2 text-[14px] text-(--app-c-brand) bg-transparent border-none cursor-pointer"
        >
          {s.search}
        </button>
      </div>

      {/* 结果分类 tab */}
      <div className="flex items-center gap-4 px-3 h-9 bg-(--app-c-bg-card) shrink-0 overflow-x-auto no-scrollbar border-b border-(--app-c-divider)">
        {RESULT_TABS.map((t, i) => (
          <button
            key={t}
            {...(i === 0
              ? { className: '' }
              : bindTap({ kind: 'action', id: 'searchresult.tab.disabled' }, { onTrigger: showNotOpen }))}
            className={`shrink-0 bg-transparent border-none cursor-pointer p-0 ${
              i === 0 ? 'text-[14px] font-semibold text-(--app-c-text-primary)' : 'text-[13px] text-(--app-c-text-secondary)'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 结果列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="search-result" data-scroll-direction="vertical">
        {list.map((b) => (
          <div key={b.id} {...bindBook(b)} className="flex gap-3 px-3 py-3 bg-(--app-c-bg-card) border-b border-(--app-c-divider) cursor-pointer">
            <BookCover book={b} className="w-[68px] h-[92px] shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center">
                <span className="flex-1 text-[15px] font-semibold text-(--app-c-text-primary) truncate">{b.title}</span>
                <span className="shrink-0 text-[14px] font-bold italic text-(--app-c-brand) ml-2">{b.rating}分</span>
              </div>
              <div className="text-[12px] text-(--app-c-text-secondary) mt-1 truncate">作者:{authorName(b)}</div>
              <div className="text-[12px] text-(--app-c-text-tertiary) mt-1 leading-4 line-clamp-2 flex-1">{b.intro}</div>
              <div className="flex items-center mt-1.5 min-w-0">
                <Badge text={b.badge} />
                <span className="text-[11px] text-(--app-c-text-quaternary) truncate">{b.category}·{b.status}·{b.readersWan}万人在读</span>
              </div>
            </div>
          </div>
        ))}
        <div className="h-3" />
      </div>
      {notOpenNode}
    </div>
  );
}

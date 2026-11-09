import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { BookCover, Badge } from '../components/ui';
import { TAG_SORTS, CATEGORY_GROUPS } from '../constants';
import { IcBack, IcSearch } from '../res/icons';
import type { FanqieBook } from '../types';

/** 取标签所在分组的兄弟标签,作为顶部可切换 chip 行(取不到就用当前标签单条) */
function siblingTags(tag: string): string[] {
  for (const groups of Object.values(CATEGORY_GROUPS)) {
    for (const g of groups) {
      if (g.tags.includes(tag)) return g.tags.slice(0, 6);
    }
  }
  return [tag];
}

function sortBooks(list: FanqieBook[], sort: string): FanqieBook[] {
  const arr = [...list];
  switch (sort) {
    case '热门': return arr.sort((a, b) => b.hotWan - a.hotWan);
    case '新书': return arr.sort((a, b) => a.chapters - b.chapters);
    case '高分': return arr.sort((a, b) => b.rating - a.rating);
    default: return arr.sort((a, b) => b.readersWan - a.readersWan);
  }
}

export default function TagResultPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, bindBack } = useFanqieGestures();

  const tag = searchParams.get('tag') || '玄幻';
  const sort = searchParams.get('sort') || '综合';
  const books = useFanqieStore((st) => st.books);
  const authors = useFanqieStore((st) => st.authors);
  const recordTaskAudit = useFanqieStore((st) => st.recordTaskAudit);

  const authorName = (b: FanqieBook) => authors.find((a) => a.id === b.authorId)?.name ?? '';
  const matched = books.filter((b) => b.tags.includes(tag) || b.category === tag);
  const list = sortBooks(matched.length ? matched : books.filter((b) => b.gender !== 'publish'), sort);
  const chips = siblingTags(tag);

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt)">
      {/* 顶栏:返回 + 搜索框(标签词) */}
      <div className="flex items-center h-11 px-1 bg-(--app-c-bg-card) shrink-0">
        <button {...bindBack()} className="w-9 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
          <IcBack size={22} className="text-(--app-c-text-primary)" />
        </button>
        <div className="flex-1 h-8 mr-2 rounded-full bg-(--app-c-bg-fill) flex items-center px-3 gap-1.5 min-w-0">
          <IcSearch size={14} className="text-(--app-c-text-tertiary) shrink-0" />
          <span className="flex-1 text-[13px] text-(--app-c-text-primary) truncate">{tag}</span>
        </div>
      </div>

      {/* 标签 chip 行 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-(--app-c-bg-card) shrink-0 overflow-x-auto no-scrollbar">
        {chips.map((t) => {
          const on = t === tag;
          return (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'tagresult.tag.select.target' }, {
                params: { target: t },
                onTrigger: () => setSearchParams((p) => { p.set('tag', t); return p; }, { replace: true }),
              })}
              className={`shrink-0 text-[13px] rounded-full px-3 py-1 border-none cursor-pointer ${on ? 'bg-(--app-c-brand-soft) text-(--app-c-brand) font-semibold' : 'bg-(--app-c-bg-fill-weak) text-(--app-c-text-regular)'}`}
            >
              {t}
            </button>
          );
        })}
      </div>

      {/* 排序行 */}
      <div className="flex items-center gap-5 px-4 h-9 bg-(--app-c-bg-card) shrink-0 border-b border-(--app-c-divider)">
        {TAG_SORTS.map((so) => {
          const on = so === sort;
          return (
            <button
              key={so}
              {...bindTap({ kind: 'action', id: 'tagresult.sort.select.target' }, {
                params: { target: so },
                beforeTrigger: () => {
                  recordTaskAudit({ tagResult: { tag, sort: so } });
                  setSearchParams((p) => { p.set('sort', so); return p; }, { replace: true });
                },
              })}
              className={`bg-transparent border-none cursor-pointer p-0 ${on ? 'text-[13px] font-semibold text-(--app-c-brand)' : 'text-[13px] text-(--app-c-text-regular)'}`}
            >
              {so}
            </button>
          );
        })}
      </div>

      {/* 书目列表:先进入详情，便于关注作者、加入书架后再阅读 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="tag-result" data-scroll-direction="vertical">
        {list.map((b) => (
          <button
            type="button"
            key={b.id}
            {...bindTap('tagresult.bookdetail-open', { params: { id: b.id } })}
            className="flex w-full gap-3 px-3 py-3 text-left bg-(--app-c-bg-card) border-x-0 border-t-0 border-b border-(--app-c-divider) cursor-pointer"
          >
            <BookCover book={b} className="w-[68px] h-[92px] shrink-0" />
            <div className="flex-1 min-w-0 flex flex-col">
              <div className="flex items-center">
                <span className="flex-1 text-[15px] font-semibold text-(--app-c-text-primary) truncate">{b.title}</span>
                <span className="shrink-0 text-[14px] font-bold italic text-(--app-c-brand) ml-2">{b.rating}分</span>
              </div>
              <div className="text-[12px] text-(--app-c-text-tertiary) mt-1 leading-4 line-clamp-2 flex-1">{b.intro}</div>
              <div className="flex items-center mt-1.5 min-w-0">
                <Badge text={b.badge} />
                <span className="text-[11px] text-(--app-c-text-quaternary) truncate">{authorName(b)}·{b.category}·{b.status}</span>
              </div>
            </div>
          </button>
        ))}
        <div className="h-3" />
      </div>
    </div>
  );
}

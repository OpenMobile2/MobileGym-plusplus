import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, RatingLine, fmtCount } from '../components/ui';

// 新书速递(全部):示意封面网格。读书频道「全部295›」展开(其他频道做示意即可)。
// 节点 bm.book.newbooks。
export default function BmBookNewbooksPage() {
  const { bindBack, bindTap } = useDoubanGestures();
  const subjects = useDoubanStore((s) => s.subjects);
  const books = React.useMemo(() => subjects.filter((s) => s.type === 'book'), [subjects]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>新书速递</div>
        <div className="w-10 h-10 shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-4 py-2 text-xs" style={{ color: C.sub }}>共 {books.length} 本 · 近期上架</div>
        <div className="px-4 grid grid-cols-3 gap-x-3 gap-y-4">
          {books.map((b) => (
            <button
              key={b.id}
              {...bindTap('bm.book.newbooks.item-open', { params: { subjectId: b.id } })}
              className="text-left bg-transparent border-none cursor-pointer p-0"
            >
              <Img src={b.cover} className="w-full rounded-md object-cover" style={{ aspectRatio: '3 / 4' }} />
              <div className="mt-1.5 text-[13px] font-medium line-clamp-2 leading-4" style={{ color: C.text }}>{b.title}</div>
              <div className="mt-0.5">
                {b.rating != null && b.rating > 0
                  ? <RatingLine rating={b.rating} size={9} />
                  : <span className="text-[11px]" style={{ color: C.sub }}>{fmtCount(b.wishCount ?? b.ratingCount)}人想读</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, Stars, fmtTime } from '../components/ui';
import { IcBack, IcSearch, IcStar, IcLike, IcEdit } from '../res/icons';
import type { FanqieReview } from '../types';

const FILTERS = [
  { v: 'all', label: '全部' },
  { v: 'latest', label: '最新' },
  { v: 'likes', label: '最多赞' },
] as const;

export default function ReviewsPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, bindBack } = useFanqieGestures();
  const s = useFanqieStrings();
  const [expandedIds, setExpandedIds] = useState<string[]>([]);

  const book = useFanqieStore((st) => st.books.find((b) => b.id === id));
  const reviews = useFanqieStore((st) => st.reviews);
  const users = useFanqieStore((st) => st.users);
  const me = useFanqieStore((st) => st.user);
  const likedReviews = useFanqieStore((st) => st.likedReviews);
  const progress = useFanqieStore((st) => st.progress[id]);
  const toggleReviewLike = useFanqieStore((st) => st.toggleReviewLike);
  const recordTaskAudit = useFanqieStore((st) => st.recordTaskAudit);
  const auditedFilter = useFanqieStore((st) => st.taskAudit.reviewsFilter);

  const filter = searchParams.get('filter') ?? 'all';

  React.useEffect(() => {
    // Preserve an explicit non-default selection when this same book's list is
    // mounted again after composing a review. The task audit records that the
    // filter was used; it is not merely the current page's transient UI state.
    if (filter !== 'all' || auditedFilter?.bookId !== id) {
      recordTaskAudit({ reviewsFilter: { bookId: id, filter } });
    }
  }, [auditedFilter?.bookId, filter, id, recordTaskAudit]);

  if (!book) return null;

  const bookReviews = reviews.filter((r) => r.bookId === id);
  const mineReview = bookReviews.find((r) => r.mine);
  const others = bookReviews.filter((r) => !r.mine);
  const sortedOthers =
    filter === 'latest' ? [...others].sort((a, b) => b.timestamp - a.timestamp)
      : filter === 'likes' ? [...others].sort((a, b) => b.likes - a.likes)
        : others;
  // mine 置顶
  const shown: FanqieReview[] = [...(mineReview ? [mineReview] : []), ...sortedOthers];

  const avatarOf = (r: FanqieReview) =>
    (r.mine ? me.avatar : users.find((u) => u.id === r.userId)?.avatar ?? '');
  const nameOf = (r: FanqieReview) =>
    (r.mine ? me.name : users.find((u) => u.id === r.userId)?.name ?? '书友');

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt) relative">
      {/* 顶栏:返回 + 灰底搜索胶囊(纯展示) */}
      <div className="flex items-center h-11 px-1 bg-(--app-c-bg-card) shrink-0">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="back">
          <IcBack size={22} className="text-(--app-c-text-primary)" />
        </button>
        <div className="flex-1 h-8 mr-3 rounded-full bg-(--app-c-bg-fill) flex items-center px-3 gap-1.5 min-w-0">
          <IcSearch size={14} className="text-(--app-c-text-quaternary) shrink-0" />
          <span className="text-[13px] text-(--app-c-text-quaternary) truncate">搜索 《{book.title}》 的书评</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24" data-scroll-container="reviews-list" data-scroll-direction="vertical">
        {/* 评分头 */}
        <div className="bg-(--app-c-bg-card) mx-3 mt-3 rounded-xl px-4 py-4 flex items-center">
          <div className="flex-1">
            <div className="text-(--app-c-text-primary)">
              <span className="text-[32px] font-bold leading-none">{book.rating}</span>
              <span className="text-[14px] font-semibold ml-0.5">分</span>
            </div>
            <div className="text-[11px] text-(--app-c-text-tertiary) mt-1.5">{bookReviews.length}人五星追评</div>
          </div>
          <button
            {...bindTap('reviews.write-open', { params: { id, stars: '5' } })}
            className="flex flex-col items-end gap-1.5 bg-transparent border-none cursor-pointer p-0"
          >
            {mineReview ? (
              <>
                <Stars value={mineReview.stars} size={24} />
                <span className="flex items-center gap-1 text-[12px] text-(--app-c-brand)">
                  {s.addFollowUp}
                  <IcEdit size={12} />
                </span>
              </>
            ) : (
              <>
                <span className="inline-flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <IcStar key={i} size={24} className="text-(--app-c-brand)" />
                  ))}
                </span>
                <span className="text-[12px] text-(--app-c-text-tertiary)">{s.ratePrompt}</span>
              </>
            )}
          </button>
        </div>

        {/* 筛选 chips */}
        <div className="flex items-center gap-2 px-3 mt-3">
          {FILTERS.map((f) => {
            const on = filter === f.v;
            return (
              <button
                key={f.v}
                {...bindTap({ kind: 'action', id: 'reviews.filter.select.target' }, {
                  params: { target: f.v },
                  onTrigger: () => {
                    recordTaskAudit({ reviewsFilter: { bookId: id, filter: f.v } });
                    setSearchParams((p) => { p.set('filter', f.v); return p; }, { replace: true });
                  },
                })}
                className={`text-[12px] rounded-lg px-3 py-1.5 border-none cursor-pointer ${on ? 'bg-(--app-c-brand-soft) text-(--app-c-brand) font-semibold' : 'bg-(--app-c-bg-card) text-(--app-c-text-regular)'}`}
              >
                {f.v === 'all' ? `${f.label}${bookReviews.length}` : f.label}
              </button>
            );
          })}
        </div>

        {/* 书评卡 */}
        <div className="bg-(--app-c-bg-card) mx-3 mt-3 rounded-xl overflow-hidden">
          {shown.length === 0 && (
            <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-16">{s.emptyReviews}</div>
          )}
          {shown.map((r, idx) => {
            const liked = likedReviews.includes(r.id);
            const expanded = expandedIds.includes(r.id);
            const needExpand = r.text.length > 54 && !expanded;
            return (
              <div key={r.id} className={`px-4 py-3.5 ${idx > 0 ? 'border-t border-(--app-c-divider)' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <img src={avatarOf(r)} alt="" className="w-8 h-8 rounded-full bg-(--app-c-bg-fill) object-cover shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-(--app-c-text-primary) truncate">{nameOf(r)}</span>
                      {r.mine && (
                        <span className="text-[9px] text-(--app-c-text-tertiary) bg-(--app-c-bg-fill-weak) rounded-sm px-1 py-px shrink-0">我</span>
                      )}
                    </div>
                    <div className="text-[10px] text-(--app-c-text-disabled) mt-0.5">{fmtTime(r.timestamp)}</div>
                  </div>
                </div>
                <div className="mt-2 text-[14px] leading-6 text-(--app-c-text-primary)">
                  <span className={expanded ? '' : 'line-clamp-3'}>{r.text}</span>
                  {needExpand && (
                    <button
                      onClick={() => setExpandedIds((a) => [...a, r.id])}
                      className="text-[13px] text-[#576B95] bg-transparent border-none cursor-pointer p-0"
                    >
                      展开
                    </button>
                  )}
                </div>
                <div className="flex items-center mt-2">
                  <Stars value={r.stars} size={11} />
                  <span className="text-[11px] text-(--app-c-text-disabled) ml-1.5">{r.readNote}</span>
                  <span className="flex-1" />
                  <button
                    {...bindTap({ kind: 'action', id: 'reviews.like.toggle' }, {
                      params: { target: r.id },
                      onTrigger: () => toggleReviewLike(r.id),
                    })}
                    className="flex items-center gap-1 bg-transparent border-none cursor-pointer p-0"
                    aria-label="点赞"
                  >
                    <IcLike size={14} className={liked ? 'text-(--app-c-brand) fill-[#FA6E3D]' : 'text-(--app-c-text-tertiary)'} />
                    <span className={`text-[12px] ${liked ? 'text-(--app-c-brand)' : 'text-(--app-c-text-tertiary)'}`}>{r.likes}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部悬浮阅读按钮 */}
      <div className="absolute bottom-5 left-0 right-0 flex justify-center pointer-events-none">
        <button
          {...bindTap('reviews.reader-open', { params: { id, ch: String(progress ?? 0) } })}
          className="pointer-events-auto w-60 h-11 rounded-full bg-(--app-c-brand) text-white text-[15px] font-semibold border-none cursor-pointer shadow-[0_4px_12px_rgba(250,110,61,0.4)]"
        >
          {progress !== undefined ? s.continueReading : s.readNow}
        </button>
      </div>
    </div>
  );
}

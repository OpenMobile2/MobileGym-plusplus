import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { Img, TopBar, Stars, Chip, RecoverPage, MY, useStatusBarFg } from '../components/ui';
import { formatDate } from '../utils/format';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcLike } from '../res/icons';

const FILTERS = ['全部', '最新', '购票好评', '购票差评', '认证作者'];

/** 猫眼短评列表页(anchor_reviews.jpg) */
export default function ReviewsPage() {
  const statusFg = useStatusBarFg();
  const { id } = useParams();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [filter, setFilter] = React.useState('全部');

  const movie = useMaoyanStore((st) => st.movies.find((m) => m.id === id));
  const reviews = useMaoyanStore((st) => st.reviews);
  const watched = useMaoyanStore((st) => st.watched);
  const toggleReviewLike = useMaoyanStore((st) => st.toggleReviewLike);

  if (!movie) return <RecoverPage title="猫眼短评" text={s.movieNotFound} />;

  let list = reviews.filter((r) => r.movieId === movie.id);
  if (filter === '最新') list = [...list].sort((a, b) => b.timestamp - a.timestamp);
  else if (filter === '购票好评') list = list.filter((r) => r.bought && r.stars >= 7);
  else if (filter === '购票差评') list = list.filter((r) => r.bought && r.stars < 7);
  else if (filter === '认证作者') list = list.filter((r) => r.level >= 4);
  const myWatch = watched[movie.id];

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground={statusFg}>
      <TopBar
        title={<div className="leading-tight"><div>猫眼短评</div><div className="text-[10px] text-(--app-c-text-3) font-normal">{movie.title}</div></div>}
        rightContent={(
          <button
            {...bindTap('reviews.write-open', { params: { id: movie.id } })}
            className="text-[13px] bg-transparent border-none cursor-pointer whitespace-nowrap"
            style={{ color: MY.cta }}
          >
            {myWatch && myWatch.stars > 0 ? s.editReview : s.writeReview}
          </button>
        )}
      />
      <div className="shrink-0 flex gap-2 px-3 py-2 flex-wrap border-b border-app-border">
        {FILTERS.map((f) => (
          <Chip
            key={f}
            text={f}
            active={filter === f}
            binding={bindTap({ kind: 'action', id: 'reviews.filter.select.option' }, {
              params: { option: f },
              onTrigger: () => setFilter(f),
            })}
          />
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="reviews-list" data-scroll-direction="vertical">
        <div className="text-[12px] text-(--app-c-text-3) py-2">{list.length}条</div>
        {list.map((r) => (
          <div key={r.id} className="py-3 border-b border-app-border">
            <div className="flex items-center gap-2">
              <Img src={r.avatar} className="w-8 h-8 rounded-full object-cover" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-[13px] font-medium text-app-text truncate">{r.user}</span>
                  <span className="text-[9px] text-(--app-c-gold-text) bg-(--app-c-gold-tint) rounded px-1">Lv{r.level}</span>
                  {r.mine && <span className="text-[9px] text-[#DC4038] border border-[#DC4038] rounded px-0.5">我的</span>}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <Stars score10={r.stars} /><span className="text-[11px]" style={{ color: MY.scoreOrange }}>{r.stars}分</span>
                  {r.bought && <span className="text-[9px] text-(--app-c-text-3) bg-(--app-c-fill) rounded px-1">购票</span>}
                </div>
              </div>
            </div>
            <div className="text-[14px] text-(--app-c-text-2) mt-2 leading-relaxed">{r.text}</div>
            <div className="flex items-center mt-2 text-[11px] text-(--app-c-text-3)">
              {r.replies > 0 && <span className="bg-(--app-c-fill) rounded-full px-2 py-0.5 mr-2">{r.replies}回复</span>}
              <span>{formatDate(r.timestamp).slice(5)} {r.region}</span>
              <button
                {...bindTap({ kind: 'action', id: 'reviews.like.toggle' }, { params: { id: r.id }, onTrigger: () => toggleReviewLike(r.id) })}
                className="ml-auto flex items-center gap-1 bg-transparent border-none cursor-pointer text-(--app-c-text-3)"
              >
                {r.likes} <IcLike size={14} />
              </button>
            </div>
          </div>
        ))}
        <div className="h-4" />
      </div>
    </div>
  );
}

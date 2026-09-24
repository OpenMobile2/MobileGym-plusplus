import React from 'react';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, Img, TopBar, EmptyState, Stars, PillBtn, MY, WishCount, useStatusBarFg } from '../components/ui';

const CATS = [['movie', '电影'], ['tv', '电视剧'], ['variety', '综艺'], ['show', '演出']];

/** 想看/看过页(r7:想看/看过tab + 电影/电视剧/综艺/演出 分类) */
export default function FilmLogPage() {
  const statusFg = useStatusBarFg();
  const { bindTap } = useMaoyanGestures();
  const { searchParams, setSearchParams } = usePanel('tab');
  const tab = searchParams.get('tab') ?? 'wish';
  const cat = searchParams.get('cat') ?? 'movie';

  const movies = useMaoyanStore((st) => st.movies);
  const shows = useMaoyanStore((st) => st.shows);
  const wishMovies = useMaoyanStore((st) => st.wishMovies);
  const wishShows = useMaoyanStore((st) => st.wishShows);
  const watched = useMaoyanStore((st) => st.watched);

  const wishList = movies.filter((m) => wishMovies.includes(m.id));
  const watchedList = movies.filter((m) => watched[m.id]);
  const showWishList = shows.filter((x) => wishShows.includes(x.id));

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground={statusFg}>
      <TopBar
        title={(
          <span className="inline-flex gap-5">
            {[['wish', '想看'], ['watched', '看过']].map(([t, label]) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'filmlog.tab.select.target' }, {
                  params: { target: t },
                  onTrigger: () => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
                })}
                className={`bg-transparent border-none cursor-pointer text-[16px] ${tab === t ? 'font-bold text-app-text' : 'text-(--app-c-text-3)'}`}
              >
                {label}
              </button>
            ))}
          </span>
        )}
        rightContent={<span className="text-[13px] text-(--app-c-text-3)">编辑</span>}
      />
      {/* 分类tab */}
      <div className="shrink-0 flex bg-app-surface border-b border-app-border">
        {CATS.map(([c, label]) => (
          <button
            key={c}
            {...bindTap({ kind: 'action', id: 'filmlog.cat.select.target' }, {
              params: { target: c },
              onTrigger: () => setSearchParams((p) => { p.set('cat', c); return p; }, { replace: true }),
            })}
            className={`flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${cat === c ? 'text-[#DC4038] font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="filmlog-list" data-scroll-direction="vertical">
        {cat === 'movie' && tab === 'wish' && (
          wishList.length === 0 ? <EmptyState text="还没有想看的电影" /> : wishList.map((m) => (
            <button key={m.id} {...bindTap('filmlog.item-open', { params: { id: m.id } })}
              className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left items-center">
              <Img src={m.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text truncate">{m.title}</div>
                <div className="text-[12px] mt-0.5"><WishCount value={m.wishCount} /><span className="text-[10px] text-(--app-c-text-3)"> 人想看</span></div>
                <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{m.releaseNote}</div>
              </div>
            </button>
          ))
        )}
        {cat === 'movie' && tab === 'watched' && (
          watchedList.length === 0 ? <EmptyState text="还没有看过记录" /> : watchedList.map((m) => {
            const w = watched[m.id];
            return (
              <div key={m.id} className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-b border-app-border items-center">
                <button {...bindTap('filmlog.item-open', { params: { id: m.id } })} className="flex gap-2.5 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left items-center p-0">
                  <Img src={m.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-semibold text-app-text truncate">{m.title}</div>
                    {w.stars > 0 ? (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-[12px] text-(--app-c-text-3)">我的评分</span><Stars score10={w.stars} /><span className="text-[12px]" style={{ color: MY.scoreOrange }}>{w.stars}分</span>
                      </div>
                    ) : (
                      <div className="text-[12px] text-(--app-c-text-3) mt-1">快来写评论吧</div>
                    )}
                    {w.text && <div className="text-[11px] text-app-text-muted mt-0.5 truncate">{w.text}</div>}
                  </div>
                </button>
                {w.stars === 0 && (
                  <span
                    {...bindTap('filmlog.rate-open', { params: { id: m.id } })}
                    className="shrink-0 text-[12px] text-white rounded-full px-3.5 py-1.5 cursor-pointer"
                    style={{ background: MY.cta }}
                  >
                    评分
                  </span>
                )}
              </div>
            );
          })
        )}
        {cat === 'show' && (
          showWishList.length === 0 ? <EmptyState text="还没有想看的演出" /> : showWishList.map((x) => (
            <div key={x.id} className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-b border-app-border items-center">
              {/* 想看清单里的演出可直接进详情/直接订票(此前是纯展示,进不去下单链) */}
              <button
                {...bindTap('filmlog.show-open', { params: { id: x.id } })}
                className="flex gap-2.5 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left items-center p-0"
              >
                <Img src={x.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-app-text line-clamp-2">{x.title}</div>
                  <div className="text-[11px] text-(--app-c-text-3) mt-1">{x.dateDesc}</div>
                  <div className="text-[11px] text-(--app-c-text-3) mt-0.5 truncate">{x.city}·{x.venue}</div>
                  <div className="text-[12px] mt-0.5" style={{ color: MY.cta }}>¥{x.priceMin}起</div>
                </div>
              </button>
              <PillBtn kind="buy" binding={bindTap('filmlog.show.book-open', { params: { id: x.id }, stopPropagation: true })}>
                预订
              </PillBtn>
            </div>
          ))
        )}
        {(cat === 'tv' || cat === 'variety') && <EmptyState text="这里还没有内容" hint="电视剧/综艺标记暂未收录" />}
      </div>
    </div>
  );
}

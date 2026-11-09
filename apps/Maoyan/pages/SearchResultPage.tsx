import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, TopBar, Score, WishCount, PillBtn, Price, EmptyState, ServiceTag, NOT_OPEN, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import type { Artist } from '../types';

const TABS = ['全部', '演出', '影视剧', '影院', '影·艺人', '休闲玩乐'];

/** 搜索结果页(r4 + gate4轮2:影人卡/演出/影视综分组;热词均有真实内容) */
export default function SearchResultPage() {
  const statusFg = useStatusBarFg();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { searchParams, setSearchParams } = usePanel('tab');
  const q = searchParams.get('q') ?? '';
  const tab = searchParams.get('tab') ?? '全部';

  const movies = useMaoyanStore((st) => st.movies);
  const city = useMaoyanStore((st) => st.city);
  const allCinemas = useMaoyanStore((st) => st.cinemas);
  const cinemas = allCinemas.filter((c) => c.city === city); // 渲染体过滤,不在 selector 内(避免新数组无限重渲染)
  const shows = useMaoyanStore((st) => st.shows);
  const artists = useMaoyanStore((st) => st.artists);
  const wishMovies = useMaoyanStore((st) => st.wishMovies);
  const toggleWishMovie = useMaoyanStore((st) => st.toggleWishMovie);

  const kw = q.trim().toLowerCase();
  const match = (str: string) => kw !== '' && str.toLowerCase().includes(kw);

  const artistHits = artists.filter((a) => match(a.name) || match(a.nameEn) || a.works.some(match));
  const artistMovieIds = new Set(artistHits.flatMap((a) => a.movieIds));
  const artistShowIds = new Set(artistHits.flatMap((a) => a.showIds));

  const movieHits = movies.filter((m) =>
    match(m.title) || match(m.titleEn) || m.genres.some(match) || m.cast.some((c) => match(c.name)) || artistMovieIds.has(m.id));
  const cinemaHits = cinemas.filter((c) => match(c.name) || match(c.brand));
  const showHits = shows.filter((x) => match(x.title) || match(x.artist) || artistShowIds.has(x.id));

  // gate4 #14:无命中时不再把热门电影伪装成结果(铁律③),改成明确空态 + 单独推荐区
  const fallback = movieHits.length + cinemaHits.length + showHits.length + artistHits.length === 0;
  const recommend = movies.filter((m) => m.status === 'hot').slice(0, 3);

  const ArtistCard = ({ a, active }: { a: Artist; active?: boolean }) => (
    <div className="w-full flex gap-3 px-3 py-3 bg-app-surface border-b border-app-border items-start">
      <Img src={a.avatar} className="w-16 h-20 object-cover rounded shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[16px] font-semibold ${active ? 'text-[#DC4038]' : 'text-app-text'}`}>{a.name}</span>
        </div>
        <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{a.nameEn}</div>
        <div className="text-[12px] text-app-text-muted mt-1">{a.role}</div>
        <div className="text-[11px] text-(--app-c-text-3) mt-1 line-clamp-2">代表作《{a.works.join('》《')}》</div>
      </div>
      <button
        {...bindTap({ kind: 'action', id: 'searchresult.artist.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
        className="shrink-0 text-[12px] text-app-text-muted border border-(--app-c-border-strong) rounded-full px-3 py-1 bg-app-surface cursor-pointer"
      >
        去主页
      </button>
    </div>
  );

  const MovieRow = ({ m }: { m: typeof movies[number] }) => {
    const wished = wishMovies.includes(m.id);
    return (
      <button {...bindTap('searchresult.movie-open', { params: { id: m.id } })}
        className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left items-center">
        <Img src={m.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1"><span className="text-[9px] text-(--app-c-text-3) border border-(--app-c-border-strong) rounded px-0.5 shrink-0">电影</span>
            <span className="text-[15px] font-semibold text-app-text truncate">{m.title}</span></div>
          <div className="text-[12px] mt-0.5">
            {m.score > 0 ? <Score value={m.score} size="s" /> : <><WishCount value={m.wishCount} /><span className="text-[10px] text-(--app-c-text-3)">{s.wishCount}</span></>}
          </div>
          <div className="text-[11px] text-(--app-c-text-3) mt-0.5 truncate">{m.genres.join(',')} | {m.duration}分钟</div>
          <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{m.releaseNote}</div>
        </div>
        {m.status === 'hot' ? (
          <PillBtn kind="buy" binding={bindTap('searchresult.buy-open', { params: { id: m.id }, stopPropagation: true })}>{s.buy}</PillBtn>
        ) : m.status === 'upcoming' ? (
          <PillBtn kind={wished ? 'wished' : 'wish'}
            binding={bindTap({ kind: 'action', id: 'searchresult.wish.toggle' }, {
              params: { id: m.id }, stopPropagation: true, onTrigger: () => toggleWishMovie(m.id),
            })}>
            {wished ? s.wished : s.wish}
          </PillBtn>
        ) : null}
      </button>
    );
  };

  const ShowRow = ({ x }: { x: typeof shows[number] }) => (
    <button {...bindTap('searchresult.show-open', { params: { id: x.id } })}
      className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left">
      <Img src={x.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1"><span className="text-[9px] text-(--app-c-text-3) border border-(--app-c-border-strong) rounded px-0.5 shrink-0">{x.category === 'talkshow' ? '脱口秀' : x.category === 'drama' ? '话剧音乐剧' : '演出'}</span>
          <span className="text-[14px] font-semibold text-app-text line-clamp-2">{x.title}</span></div>
        <div className="text-[11px] text-(--app-c-text-3) mt-1">{x.dateDesc} · {x.city}·{x.venue}</div>
        <Price value={x.priceMin} size="s" suffix=" 起" />
      </div>
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground={statusFg}>
      {toast}
      <TopBar title={q || '搜索结果'} />
      <div className="shrink-0 flex bg-app-surface border-b border-app-border overflow-x-auto" data-scroll-container="result-tabs" data-scroll-direction="horizontal">
        {TABS.map((t) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'searchresult.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
            })}
            className={`shrink-0 px-4 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${tab === t ? 'text-[#DC4038] font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="search-result" data-scroll-direction="vertical">
        {fallback && (
          <>
            <EmptyState text={`没有找到「${q}」相关的内容`} hint="换个关键词试试吧" />
            <div className="px-3 pt-2 pb-1 text-[13px] font-bold text-app-text bg-app-surface border-t-8 border-app-bg">大家都在搜</div>
            {recommend.map((m) => <MovieRow key={m.id} m={m} />)}
          </>
        )}

        {/* 影人卡:全部tab展示首位;影·艺人tab展示全部 */}
        {!fallback && tab === '全部' && artistHits.slice(0, 1).map((a) => <ArtistCard key={a.id} a={a} />)}
        {tab === '影·艺人' && (artistHits.length ? artistHits.map((a) => <ArtistCard key={a.id} a={a} active />) : <EmptyState text="该分类暂无相关影人" />)}

        {/* 演出 */}
        {!fallback && (tab === '全部' || tab === '演出') && showHits.map((x) => <ShowRow key={x.id} x={x} />)}
        {tab === '演出' && !showHits.length && !fallback && <EmptyState text="该分类暂无相关演出" />}

        {/* 影视剧 */}
        {!fallback && (tab === '全部' || tab === '影视剧') && movieHits.map((m) => <MovieRow key={m.id} m={m} />)}
        {tab === '影视剧' && !movieHits.length && !fallback && <EmptyState text="该分类暂无相关影视" />}

        {/* 影院 */}
        {!fallback && (tab === '全部' || tab === '影院') && cinemaHits.map((c) => (
          <button key={c.id} {...bindTap('searchresult.cinema-open', { params: { id: c.id } })}
            className="w-full bg-app-surface border-none border-b border-app-border px-3 py-2.5 cursor-pointer text-left">
            <div className="flex items-center">
              <span className="text-[14px] font-semibold text-app-text truncate flex-1">{c.name}</span>
              <Price value={c.minPrice} size="s" suffix=" 起" />
            </div>
            <div className="text-[11px] text-(--app-c-text-3) mt-1 truncate">{c.address} · {c.distanceKm}km</div>
            <div className="flex gap-1 mt-1">{c.services.slice(0, 4).map((t) => <ServiceTag key={t} text={t} />)}</div>
          </button>
        ))}
        {tab === '影院' && !cinemaHits.length && !fallback && <EmptyState text={`${city}暂无相关影院`} />}

        {tab === '休闲玩乐' && <EmptyState text="该分类暂无相关结果" />}
        <div className="h-3" />
      </div>
    </div>
  );
}

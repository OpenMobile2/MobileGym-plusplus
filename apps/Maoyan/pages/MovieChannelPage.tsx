import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, PillBtn, Score, WishCount, EmptyState, Chip, ServiceTag, MY, NOT_OPEN, Price } from '../components/ui';
import { HALL_TYPES, CINEMA_SERVICES } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcSearch, IcArrowDown } from '../res/icons';

/** 电影频道:热映 / 影院 / 待映(anchor_movie_upcoming.jpg, r5) */
export default function MovieChannelPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { value: tabRaw, setSearchParams } = usePanel('tab');
  const tab = tabRaw ?? 'hot';
  const city = useMaoyanStore((st) => st.city);
  const movies = useMaoyanStore((st) => st.movies);
  const cinemas = useMaoyanStore((st) => st.cinemas);
  const wishMovies = useMaoyanStore((st) => st.wishMovies);
  const toggleWishMovie = useMaoyanStore((st) => st.toggleWishMovie);
  const recordCinemaBrowse = useMaoyanStore((st) => st.recordCinemaBrowse);

  const [region, setRegion] = React.useState('');
  const [sort, setSort] = React.useState('');
  const [service, setService] = React.useState('');

  const hot = movies.filter((m) => m.status === 'hot');
  const upcoming = movies.filter((m) => m.status === 'upcoming');
  let cinemaList = cinemas.filter((c) => c.city === city);
  if (region) cinemaList = cinemaList.filter((c) => c.district === region);
  if (service) cinemaList = cinemaList.filter((c) => c.services.includes(service) || c.hallTypes.includes(service));
  if (sort === 'price') cinemaList.sort((a, b) => a.minPrice - b.minPrice);
  else cinemaList.sort((a, b) => a.distanceKm - b.distanceKm);

  const setTab = (t: string) => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true });

  return (
    <div className="flex flex-col h-full relative" data-status-bar-foreground="light">
      {toast}
      {/* 红色顶栏:城市 + tabs + 搜索 */}
      <div className="shrink-0 text-white" style={{ background: MY.primary }}>
        <div className="flex items-center px-3 h-11">
          <span className="flex items-center gap-0.5 text-[14px]">{city}<IcArrowDown size={13} /></span>
          <div className="flex-1 flex justify-center gap-6">
            {[['hot', s.tabHot], ['cinemas', s.tabCinemas], ['upcoming', s.tabUpcoming]].map(([t, label]) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'movie.tab.select.target' }, { params: { target: t }, onTrigger: () => setTab(t) })}
                className={`bg-transparent border-none cursor-pointer text-[15px] text-white ${tab === t ? 'font-bold border-b-2 border-white pb-0.5' : 'opacity-80'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <IcSearch size={18} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="movie-list" data-scroll-direction="vertical">
        {tab === 'hot' && hot.map((m) => (
          <button key={m.id} {...bindTap('movie.hot.item-open', { params: { id: m.id } })}
            className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left items-center">
            <Img src={m.poster} className="w-16 h-[85px] object-cover rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-app-text truncate">{m.title}</span>
                {m.formats.slice(0, 2).map((f) => <span key={f} className="shrink-0 text-[9px] text-[#8A6D3B] border border-[#D9C69A] rounded px-0.5">{f}</span>)}
              </div>
              <div className="text-[12px] mt-1">
                {m.score > 0
                  ? <>{s.score} <Score value={m.score} size="s" /></>
                  : m.previewScore > 0
                    ? <>点映评分 <Score value={m.previewScore} size="s" /></>
                    : <span className="text-(--app-c-text-3)">{s.noScore}</span>}
              </div>
              <div className="text-[11px] text-(--app-c-text-3) mt-1 truncate">主演:{m.cast.filter((c) => c.role !== '导演').map((c) => c.name).join(',')}</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-0.5">今天{m.cinemaCount}家影院放映{m.sessionCount}场</div>
            </div>
            <PillBtn kind="buy" binding={bindTap('movie.hot.buy-open', { params: { id: m.id }, stopPropagation: true })}>{s.buy}</PillBtn>
          </button>
        ))}

        {tab === 'upcoming' && (
          <div className="flex items-center px-3 py-2 bg-app-surface border-b border-app-border">
            <span className="text-[14px] font-bold text-app-text">预告片推荐</span>
            <button
              {...bindTap({ kind: 'action', id: 'movie.trailer.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="ml-auto text-[12px] text-(--app-c-text-3) bg-transparent border-none cursor-pointer"
            >
              🎬 看预告片 ›
            </button>
          </div>
        )}
        {tab === 'upcoming' && upcoming.map((m) => {
          const wished = wishMovies.includes(m.id);
          return (
            <button key={m.id} {...bindTap('movie.hot.item-open', { params: { id: m.id } })}
              className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left items-center">
              <Img src={m.poster} className="w-16 h-[85px] object-cover rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text truncate">{m.title}</div>
                <div className="text-[12px] mt-1"><WishCount value={m.wishCount} /><span className="text-(--app-c-text-3) text-[11px]"> {s.wishCount}</span></div>
                <div className="text-[11px] text-(--app-c-text-3) mt-1 truncate">类型:{m.genres.join(',')}</div>
                <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{m.releaseDate} 上映</div>
              </div>
              {m.presale ? (
                <PillBtn kind="presale" binding={bindTap('movie.upcoming.presale-open', { params: { id: m.id }, stopPropagation: true })}>{s.presale}</PillBtn>
              ) : (
                <PillBtn kind={wished ? 'wished' : 'wish'}
                  binding={bindTap({ kind: 'action', id: 'movie.upcoming.wish.toggle' }, {
                    params: { id: m.id }, stopPropagation: true, onTrigger: () => toggleWishMovie(m.id),
                  })}>
                  {wished ? s.wished : s.wish}
                </PillBtn>
              )}
            </button>
          );
        })}

        {tab === 'cinemas' && (
          <>
            <div className="flex gap-2 px-3 py-2 bg-app-surface sticky top-0 z-10">
              <Chip
                text={region || s.wholeCity}
                active={!!region}
                binding={bindTap({ kind: 'action', id: 'movie.cinemas.region.select.option' }, {
                  params: { option: region ? '全城' : '秦都区' },
                  onTrigger: () => setRegion(region ? '' : '秦都区'),
                })}
              />
              <Chip
                text={sort === 'price' ? s.priceLow : s.distanceNear}
                active={sort === 'price'}
                binding={bindTap({ kind: 'action', id: 'movie.cinemas.sort.select.option' }, {
                  params: { option: sort === 'price' ? '距离近' : '价格低' },
                  onTrigger: () => { const next = sort === 'price' ? '' : 'price'; setSort(next); recordCinemaBrowse({ sort: next || 'distance' }); },
                })}
              />
              <Chip
                text={service || s.filter}
                active={!!service}
                binding={bindTap({ kind: 'action', id: 'movie.cinemas.filter.select.option' }, {
                  params: { option: service ? '全部' : '激光厅' },
                  onTrigger: () => { const next = service ? '' : '激光厅'; setService(next); recordCinemaBrowse({ service: next }); },
                })}
              />
              <span className="ml-auto text-[11px] text-(--app-c-text-4) self-center">点击切换筛选</span>
            </div>
            {cinemaList.length === 0 && <EmptyState text={s.noResult} />}
            {cinemaList.map((c) => (
              <button key={c.id} {...bindTap('movie.cinemas.item-open', { params: { id: c.id } })}
                className="w-full bg-app-surface border-none border-b border-app-border px-3 py-2.5 cursor-pointer text-left">
                <div className="flex items-center">
                  <span className="text-[15px] font-semibold text-app-text truncate flex-1">{c.name}</span>
                  <Price value={c.minPrice} size="s" suffix=" 起" />
                </div>
                <div className="flex items-center mt-1">
                  <span className="text-[11px] text-(--app-c-text-3) truncate flex-1">{c.address}</span>
                  <span className="text-[11px] text-(--app-c-text-3) shrink-0 ml-2">{c.distanceKm}km</span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {c.services.slice(0, 5).map((t) => <ServiceTag key={t} text={t} />)}
                </div>
                {c.promo && <div className="mt-1.5 text-[11px] text-(--app-c-gold-text) bg-[#FFF9E8] rounded px-2 py-1 truncate">🎁 {c.promo}</div>}
              </button>
            ))}
          </>
        )}
        <div className="h-3" />
      </div>
    </div>
  );
}

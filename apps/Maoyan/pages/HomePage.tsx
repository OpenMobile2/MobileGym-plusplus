import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useLocale } from '@/os/locale';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, PillBtn, Score, WishCount, NOT_OPEN, MY, Price, useStatusBarFg } from '../components/ui';
import { HOME_CHANNELS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcSearch, IcArrowDown, IcArrowRight, IcFilm, IcMicVocal, IcTicket, IcMic, IcDrama } from '../res/icons';

const CH_ICONS = [IcFilm, IcMicVocal, IcTicket, IcMic, IcDrama];

export default function HomePage() {
  const statusFg = useStatusBarFg();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const locale = useLocale();
  const [toast, showToast] = useToast();
  const { value: chRaw, setSearchParams } = usePanel('ch');
  const ch = chRaw ?? 'movie';
  const city = useMaoyanStore((st) => st.city);
  const movies = useMaoyanStore((st) => st.movies);
  const shows = useMaoyanStore((st) => st.shows);
  const wishMovies = useMaoyanStore((st) => st.wishMovies);
  const toggleWishMovie = useMaoyanStore((st) => st.toggleWishMovie);
  const scenics = useMaoyanStore((st) => st.scenics);
  const snacks = useMaoyanStore((st) => st.snacks);

  const hot = movies.filter((m) => m.status === 'hot');
  const upcoming = movies.filter((m) => m.status === 'upcoming');
  const chShows = ch === 'movie' ? shows : shows.filter((x) =>
    ch === 'concert' ? x.category === 'concert'
      : ch === 'talkshow' ? x.category === 'talkshow'
        : ch === 'drama' ? ['drama', 'classical', 'crosstalk'].includes(x.category)
          : true);

  return (
    <div className="flex flex-col h-full relative" data-status-bar-foreground={statusFg}>
      {toast}
      {/* 顶部:城市 + 搜索 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-app-surface shrink-0">
        <button {...bindTap('home.city-open')} className="flex items-center gap-0.5 bg-transparent border-none cursor-pointer text-[15px] font-medium text-app-text">
          {city}<IcArrowDown size={14} className="text-(--app-c-text-3)" />
        </button>
        <button {...bindTap('home.search-open')} className="flex-1 flex items-center h-8 rounded-full bg-(--app-c-fill) px-3 gap-1.5 border-none cursor-pointer">
          <IcSearch size={15} className="text-(--app-c-text-3)" />
          <span className="text-[12px] text-(--app-c-text-3) truncate">魔方小姐超低票价来袭</span>
          <span className="ml-auto shrink-0 text-white text-[12px] font-medium rounded-full px-3 py-1" style={{ background: MY.cta }}>{s.search}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {/* 营销banner(wontfix) */}
        <button
          {...bindTap({ kind: 'action', id: 'home.banner.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mx-3 mt-2 w-[calc(100%-24px)] h-16 rounded-xl border-none cursor-pointer text-left px-4 text-[15px] font-bold text-[#7A3B00]"
          style={{ background: 'linear-gradient(90deg,#FFE9B8,#FFD98A)' }}
        >
          暑期超级秒杀季 · 观演折上折 快乐不打折 GO→
        </button>

        {/* 金刚区频道(整版内容切换) */}
        <div className="flex px-2 pt-3 pb-1 bg-app-surface mt-2">
          {HOME_CHANNELS.map((c, i) => {
            const Icon = CH_ICONS[i];
            const active = ch === c.id;
            return (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'home.channel.select.target' }, {
                  params: { target: c.id },
                  onTrigger: () => setSearchParams((p) => { p.set('ch', c.id); return p; }, { replace: true }),
                })}
                className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
              >
                <span className={`w-11 h-11 rounded-full flex items-center justify-center ${active ? 'text-white' : 'text-[#DC4038]'}`}
                  style={{ background: active ? MY.ctaGradient : MY.brandTint }}>
                  <Icon size={22} />
                </span>
                <span className={`text-[11px] ${active ? 'text-[#DC4038] font-medium' : 'text-(--app-c-text-2)'}`}>{locale === 'en' ? c.labelEn : c.label}</span>
              </button>
            );
          })}
        </div>

        {ch === 'movie' ? (
          <>
            {/* 热门电影演出 */}
            <section className="bg-app-surface mt-2 pt-3 pb-2">
              <div className="flex items-center px-3 mb-2">
                <span className="text-[16px] font-bold text-app-text">{s.hotMovies}</span>
                <button {...bindTap('home.hotall-open')} className="ml-auto flex items-center text-[12px] text-(--app-c-text-3) bg-transparent border-none cursor-pointer">
                  {s.viewAll}<IcArrowRight size={13} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2 px-3">
                {hot.slice(0, 8).map((m) => (
                  <div key={m.id} className="flex flex-col items-center">
                    <button {...bindTap('home.movie-open', { params: { id: m.id } })} className="relative w-full bg-transparent border-none cursor-pointer p-0">
                      <Img src={m.poster} className="w-full aspect-[3/4] object-cover rounded-md" />
                      {m.score > 0 && (
                        <span className="absolute bottom-1 right-1 text-[11px] font-bold text-white drop-shadow" style={{ textShadow: '0 1px 2px rgba(0,0,0,.6)' }}>
                          {m.score.toFixed(1)}<span className="text-[9px]">分</span>
                        </span>
                      )}
                    </button>
                    <span className="text-[11px] text-app-text truncate w-full text-center mt-1">{m.title}</span>
                    <PillBtn kind="buy" binding={bindTap('home.movie.buy-open', { params: { id: m.id } })}>{s.buy}</PillBtn>
                  </div>
                ))}
              </div>
            </section>

            {/* 待映电影 */}
            <section className="bg-app-surface mt-2 pt-3 pb-3">
              <div className="flex items-center px-3 mb-2">
                <span className="text-[16px] font-bold text-app-text">{s.upcomingMovies}</span>
                <span className="ml-2 text-[12px] text-(--app-c-text-3)">即将上映 | 引进片专区</span>
              </div>
              <div className="flex gap-2 px-3 overflow-x-auto" data-scroll-container="upcoming-row" data-scroll-direction="horizontal">
                {upcoming.map((m) => {
                  const wished = wishMovies.includes(m.id);
                  return (
                    <div key={m.id} className="w-[88px] shrink-0 flex flex-col items-center">
                      <button {...bindTap('home.movie-open', { params: { id: m.id } })} className="relative w-full bg-transparent border-none cursor-pointer p-0">
                        <Img src={m.poster} className="w-full aspect-[3/4] object-cover rounded-md" />
                        <span className="absolute top-1 left-1 text-[9px] text-white bg-black/40 rounded px-1">{m.formats[0] ?? '2D'}</span>
                      </button>
                      <span className="text-[11px] text-app-text truncate w-full text-center mt-1">{m.title}</span>
                      <span className="text-[10px] text-(--app-c-text-3)">{m.releaseDate.slice(5).replace('-', '月')}日</span>
                      {m.presale ? (
                        <PillBtn kind="presale" binding={bindTap('home.movie.buy-open', { params: { id: m.id } })}>{s.presale}</PillBtn>
                      ) : (
                        <PillBtn
                          kind={wished ? 'wished' : 'wish'}
                          binding={bindTap({ kind: 'action', id: 'home.wish.toggle' }, {
                            params: { id: m.id },
                            onTrigger: () => toggleWishMovie(m.id),
                          })}
                        >
                          {wished ? s.wished : s.wish}
                        </PillBtn>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          /* 演出类频道:演出卡片流 */
          <section className="bg-app-surface mt-2 pt-3 pb-3">
            <div className="px-3 mb-2 text-[16px] font-bold text-app-text">{s.todayRush}</div>
            <div className="grid grid-cols-2 gap-2 px-3">
              {chShows.map((x) => (
                <button key={x.id} {...bindTap('home.show-open', { params: { id: x.id } })} className="bg-app-surface border border-app-border rounded-lg overflow-hidden text-left cursor-pointer p-0">
                  <Img src={x.poster} className="w-full aspect-[3/4] object-cover" />
                  <div className="p-2">
                    <div className="text-[12px] text-app-text leading-snug line-clamp-2">{x.title}</div>
                    <div className="text-[10px] text-(--app-c-text-3) mt-1">{x.dateDesc}</div>
                    <Price value={x.priceMin} size="s" suffix=" 起" />
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 爆款周边 + 景点门票(范围外,统一 toast) */}
        <section className="bg-app-surface mt-2 pt-3 pb-3">
          <div className="px-3 mb-2 text-[16px] font-bold text-app-text">爆款周边</div>
          <div className="flex gap-2 px-3 overflow-x-auto" data-scroll-container="peripheral-row" data-scroll-direction="horizontal">
            {snacks.filter((x) => x.kind === 'merch').map((x) => (
              <button
                key={x.id}
                {...bindTap({ kind: 'action', id: 'home.peripheral.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="w-[100px] shrink-0 bg-transparent border-none cursor-pointer p-0 text-left"
              >
                <Img src={x.image} className="w-[100px] h-[100px] object-cover rounded-lg" />
                <div className="text-[11px] text-app-text truncate mt-1">{x.name}</div>
                <Price value={x.price} size="s" suffix=" 起" />
              </button>
            ))}
          </div>
        </section>
        <section className="bg-app-surface mt-2 pt-3 pb-4">
          <div className="px-3 mb-2 text-[16px] font-bold text-app-text">景点门票</div>
          <div className="grid grid-cols-4 gap-2 px-3">
            {scenics.map((x) => (
              <button
                key={x.id}
                {...bindTap({ kind: 'action', id: 'home.peripheral.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="bg-transparent border-none cursor-pointer p-0 text-left"
              >
                <Img src={x.image} className="w-full aspect-square object-cover rounded-lg" />
                <div className="text-[11px] text-app-text truncate mt-1">{x.name}</div>
                <Price value={x.priceFrom} size="s" suffix=" 起" />
              </button>
            ))}
          </div>
        </section>
        <div className="h-3" />
      </div>
    </div>
  );
}

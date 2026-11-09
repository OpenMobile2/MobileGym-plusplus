import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, TopBar, Score, Price, RecoverPage, NOT_OPEN, MY, PillBtn, useStatusBarFg } from '../components/ui';
import { dayLabel } from '../utils/format';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcStar, IcPin, IcArrowRight } from '../res/icons';

/** 影院详情/场次页(anchor_cinema_detail.jpg, r1/r4/r5;含影片横滑+未上映空态+小吃) */
export default function CinemaDetailPage() {
  const statusFg = useStatusBarFg();
  const { id } = useParams();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { searchParams, setSearchParams } = usePanel('film');
  const [toggleTick, setTick] = React.useState(0);

  const cinema = useMaoyanStore((st) => st.cinemas.find((c) => c.id === id));
  const movies = useMaoyanStore((st) => st.movies);
  const sessions = useMaoyanStore((st) => st.sessions);
  const snacks = useMaoyanStore((st) => st.snacks);
  const toggleCinemaFav = useMaoyanStore((st) => st.toggleCinemaFav);
  const recordCinemaSchedule = useMaoyanStore((st) => st.recordCinemaSchedule);

  const hot = movies.filter((m) => m.status === 'hot');
  const upcomingPresale = movies.filter((m) => m.status === 'upcoming' && m.presale);
  const carousel = [...hot, ...upcomingPresale];
  const filmId = searchParams.get('film') ?? carousel[0]?.id;
  const day = Number(searchParams.get('date') ?? '0');
  const film = movies.find((m) => m.id === filmId) ?? carousel[0];

  if (!cinema || !film) return <RecoverPage title={s.tabCinemas} text={s.dataMissing} />;

  const filmSessions = sessions.filter((x) => x.cinemaId === cinema.id && x.movieId === film.id && x.dayOffset === day);
  const notReleased = film.status === 'upcoming';

  return (
    <div className="flex flex-col h-full relative bg-app-bg" data-status-bar-foreground={statusFg}>
      {toast}
      <TopBar
        title={cinema.name}
        rightContent={(
          <button
            {...bindTap({ kind: 'action', id: 'cinema.fav.toggle' }, { onTrigger: () => { toggleCinemaFav(cinema.id); setTick((v) => v + 1); } })}
            className="bg-transparent border-none cursor-pointer"
            aria-label="收藏影院"
          >
            <IcStar size={19} fill={cinema.favorite ? MY.scoreOrange : 'none'} className={cinema.favorite ? 'text-[#FFB400]' : 'text-app-text-muted'} />
          </button>
        )}
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container="cinema-scroll" data-scroll-direction="vertical">
        {/* 影院信息 */}
        <div className="bg-app-surface px-3 py-2.5">
          <div className="flex items-center">
            <div className="flex-1 min-w-0">
              <div className="text-[15px] font-semibold text-app-text">{cinema.name}</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-1 truncate">{cinema.address}</div>
            </div>
            <IcPin size={18} className="text-[#4B9EF8] shrink-0" />
          </div>
          {/* 促销行(wontfix) */}
          <button
            {...bindTap({ kind: 'action', id: 'cinema.promo.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="mt-2 w-full flex items-center rounded-lg px-2.5 py-2 text-[12px] text-[#B03A2E] border-none cursor-pointer text-left"
            style={{ background: '#FDF3F2' }}
          >
            🍿 观影套餐 · 小吃、周边25.24元起 <span className="ml-auto text-[10px] border border-[#E8B4B0] rounded px-1">促</span>
          </button>
        </div>

        {/* 影片横滑 */}
        <div className="bg-[#3A3A3E] mt-2 pt-3 pb-2">
          <div className="flex gap-2 px-3 overflow-x-auto items-end" data-scroll-container="film-carousel" data-scroll-direction="horizontal">
            {carousel.map((m) => (
              <button
                key={m.id}
                {...bindTap({ kind: 'action', id: 'cinema.film.select.target' }, {
                  params: { target: m.id },
                  onTrigger: () => { recordCinemaSchedule(cinema.id, m.id, day); setSearchParams((p) => { p.set('film', m.id); return p; }, { replace: true }); },
                })}
                className="bg-transparent border-none cursor-pointer p-0 shrink-0"
              >
                <Img
                  src={m.poster}
                  className={`object-cover rounded ${m.id === film.id ? 'w-[84px] h-[112px] ring-2 ring-white' : 'w-[64px] h-[86px] opacity-70'}`}
                />
              </button>
            ))}
          </div>
          <div className="text-center text-white mt-2">
            <span className="text-[15px] font-semibold">{film.title}</span>
            {film.score > 0 && <span className="ml-2"><Score value={film.score} size="s" /></span>}
          </div>
          <div className="text-center text-[11px] text-white/60 mt-0.5">
            {film.duration}分钟 | {film.genres.join(' ')} | {film.cast.filter((c) => c.role !== '导演').slice(0, 3).map((c) => c.name).join(',')}
          </div>
        </div>

        {/* 日期 tab */}
        <div className="flex bg-app-surface border-b border-app-border">
          {[0, 1, 2].map((d) => (
            <button
              key={d}
              {...bindTap({ kind: 'action', id: 'cinema.date.select.option' }, {
                params: { option: String(d) },
                onTrigger: () => { recordCinemaSchedule(cinema.id, film.id, d); setSearchParams((p) => { p.set('date', String(d)); return p; }, { replace: true }); },
              })}
              className={`flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${day === d ? 'text-[#DC4038] font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>

        {/* 场次列表 / 未上映空态 */}
        {notReleased ? (
          <div className="bg-app-surface py-10 flex flex-col items-center gap-2">
            <span className="text-[40px]">🎬</span>
            <div className="text-[13px] text-(--app-c-text-3)">影片未上映</div>
            <div className="text-[12px] text-[#4B9EF8]">点击查看{film.releaseDate}的场次</div>
          </div>
        ) : filmSessions.length === 0 ? (
          <div className="bg-app-surface py-10 text-center text-[13px] text-(--app-c-text-3)">{s.noResult}</div>
        ) : (
          <div className="bg-app-surface">
            {filmSessions.map((x) => (
              <div key={x.id} className="flex items-center px-3 py-3 border-b border-app-border">
                <div className="w-[72px]">
                  <div className="text-[17px] font-semibold text-app-text">{x.start}</div>
                  <div className="text-[10px] text-(--app-c-text-3)">{x.end}散场</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-(--app-c-text-2)">{x.lang}{x.dim}</div>
                  <div className="text-[10px] text-(--app-c-text-3)">{x.hall}</div>
                </div>
                <div className="text-right mr-3">
                  <div><span className="text-[10px] text-[#DC4038]">到手价</span> <Price value={x.price} size="m" /></div>
                  {x.tag && <div className="text-[9px] text-(--app-c-gold-text)">已优惠¥{(x.origPrice - x.price).toFixed(0)}</div>}
                </div>
                <PillBtn kind="buy" binding={bindTap('cinema.session.buy-open', { params: { sessionId: x.id } })}>{s.sessionsBuy}</PillBtn>
              </div>
            ))}
          </div>
        )}

        {/* 观影小吃(展示位,购买 wontfix) */}
        <div className="bg-app-surface mt-2 px-3 py-3">
          <div className="flex items-center mb-2">
            <span className="text-[15px] font-bold text-app-text">观影小吃</span>
            <span className="ml-auto text-[11px] text-(--app-c-text-3)">电影和可乐爆米花最配哦!</span>
          </div>
          {snacks.filter((x) => x.kind === 'snack').slice(0, 3).map((x) => (
            <div key={x.id} className="flex items-center gap-2.5 py-2 border-b border-app-border">
              <Img src={x.image} className="w-16 h-16 object-cover rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-app-text line-clamp-2">{x.name}</div>
                <div className="mt-1"><Price value={x.price} size="m" />{x.tag && <span className="ml-1 text-[9px] text-(--app-c-gold-text) bg-[#FFF9E8] rounded px-1">{x.tag}</span>}</div>
              </div>
              <button
                {...bindTap({ kind: 'action', id: 'cinema.snack.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="shrink-0 text-[12px] text-[#DC4038] border border-[#DC4038] rounded-full px-3 py-1 bg-app-surface cursor-pointer"
              >
                购买
              </button>
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>
    </div>
  );
}

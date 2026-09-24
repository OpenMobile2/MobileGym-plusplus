import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, Img, TopBar, ServiceTag, Price, Chip, WishCount, RecoverPage, MY, EmptyState, useStatusBarFg } from '../components/ui';
import { dayLabel } from '../utils/format';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 购票·选影院页(anchor_showtimes.jpg, r1/r4) */
export default function ShowtimesPage() {
  const statusFg = useStatusBarFg();
  const { id } = useParams();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const { value: dateRaw, setSearchParams } = usePanel('date');
  const day = Number(dateRaw ?? '0');
  const [brandFilter, setBrandFilter] = React.useState('');

  const movie = useMaoyanStore((st) => st.movies.find((m) => m.id === id));
  const city = useMaoyanStore((st) => st.city);
  const cinemas = useMaoyanStore((st) => st.cinemas);
  const sessions = useMaoyanStore((st) => st.sessions);

  if (!movie) return <RecoverPage title={s.sessionsBuy} text={s.movieNotFound} />;

  const daySessions = sessions.filter((x) => x.movieId === movie.id && x.dayOffset === day);
  let list = cinemas
    .filter((c) => c.city === city)
    .map((c) => ({ cinema: c, sess: daySessions.filter((x) => x.cinemaId === c.id) }))
    .filter((x) => x.sess.length > 0);
  if (brandFilter) list = list.filter((x) => x.cinema.brand === brandFilter);

  return (
    <div className="flex flex-col h-full relative bg-app-bg" data-status-bar-foreground={statusFg}>
      <TopBar title={movie.title} />
      {/* 红包banner */}
      <div className="shrink-0 mx-3 mt-2 rounded-lg px-3 py-2 text-[12px] text-[#B03A2E] flex items-center" style={{ background: MY.brandTint }}>
        🧧 詹姆斯送您3元红包购票立享优惠 <span className="ml-auto text-[11px] bg-app-surface rounded px-1.5 py-0.5">04:57 后失效</span>
      </div>
      {/* 影片头卡 */}
      <div className="shrink-0 flex gap-2.5 px-3 py-2.5 bg-app-surface mt-2 items-center">
        <Img src={movie.poster} className="w-12 h-16 object-cover rounded" />
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-app-text truncate">{movie.title}</div>
          <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{movie.genres.join(' ')} {movie.formats.slice(0, 2).join(' ')}</div>
          <div className="text-[11px] text-(--app-c-text-3) mt-0.5">{movie.releaseNote}</div>
        </div>
        {movie.status === 'upcoming' && <div className="text-[12px]"><WishCount value={movie.wishCount} /><span className="text-(--app-c-text-3) text-[10px]">{s.wishCount}</span></div>}
      </div>

      {/* 日期 tab */}
      <div className="shrink-0 flex bg-app-surface border-b border-app-border">
        {[0, 1, 2].map((d) => (
          <button
            key={d}
            {...bindTap({ kind: 'action', id: 'showtimes.date.select.option' }, {
              params: { option: String(d) },
              onTrigger: () => setSearchParams((p) => { p.set('date', String(d)); return p; }, { replace: true }),
            })}
            className={`flex-1 py-2.5 text-[13px] bg-transparent border-none cursor-pointer ${day === d ? 'text-[#DC4038] font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
          >
            {dayLabel(d)}{d === 0 && <span className="ml-1 text-[9px] text-[#DC4038] border border-[#DC4038] rounded px-0.5 align-middle">特殊场</span>}
          </button>
        ))}
      </div>

      {/* 筛选 bar */}
      <div className="shrink-0 flex gap-2 px-3 py-2 bg-app-surface">
        <Chip text={`${city}全城`} binding={bindTap({ kind: 'action', id: 'showtimes.filter.select.option' }, { params: { option: '全城' }, onTrigger: () => setBrandFilter('') })} />
        <Chip text={s.recommendSort} binding={bindTap({ kind: 'action', id: 'showtimes.filter.select.option' }, { params: { option: '推荐排序' }, onTrigger: () => setBrandFilter('') })} />
        <Chip text={brandFilter || s.brand} active={!!brandFilter}
          binding={bindTap({ kind: 'action', id: 'showtimes.filter.select.option' }, { params: { option: '品牌' }, onTrigger: () => setBrandFilter(brandFilter ? '' : '万达') })} />
      </div>

      {/* 影院列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="showtimes-list" data-scroll-direction="vertical">
        {list.length === 0 && <EmptyState text={s.noResult} hint="换个日期或筛选试试" />}
        {list.map(({ cinema, sess }) => (
          <button
            key={cinema.id}
            {...bindTap('showtimes.cinema-open', { params: { id: cinema.id, film: movie.id, date: String(day) } })}
            className="w-full bg-app-surface border-none border-b-8 border-app-bg px-3 py-2.5 cursor-pointer text-left"
          >
            <div className="flex items-center">
              <span className="text-[15px] font-semibold text-app-text truncate flex-1">{cinema.name}</span>
              <Price value={Math.min(...sess.map((x) => x.price))} size="s" suffix=" 起" />
            </div>
            <div className="flex items-center mt-1">
              <span className="text-[11px] text-(--app-c-text-3) truncate flex-1">{cinema.address}</span>
              <span className="text-[11px] text-(--app-c-text-3) shrink-0 ml-2">{cinema.distanceKm}km</span>
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {cinema.services.slice(0, 5).map((t) => <ServiceTag key={t} text={t} />)}
            </div>
            <div className="text-[12px] text-app-text-muted mt-1.5">
              近期场次:{sess.slice(0, 5).map((x) => x.start).join('  ')}
            </div>
            {cinema.promo && <div className="mt-1.5 text-[11px] text-(--app-c-gold-text) bg-[#FFF9E8] rounded px-2 py-1 truncate">🎁 {cinema.promo} ›</div>}
          </button>
        ))}
        <div className="h-3" />
      </div>
    </div>
  );
}

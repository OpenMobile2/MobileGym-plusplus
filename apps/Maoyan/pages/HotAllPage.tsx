import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, Img, TopBar, Score, WishCount, PillBtn, Price, ServiceTag } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';

/** 全部热门(anchor_hot_list.jpg:热映电影/热门演出/影院) */
export default function HotAllPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const { value: tabRaw, setSearchParams } = usePanel('tab');
  const tab = tabRaw ?? 'movies';

  const movies = useMaoyanStore((st) => st.movies);
  const shows = useMaoyanStore((st) => st.shows);
  const cinemas = useMaoyanStore((st) => st.cinemas);

  const hot = movies.filter((m) => m.status === 'hot');
  const upcoming = movies.filter((m) => m.status === 'upcoming');

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="light">
      <div className="shrink-0" style={{ background: '#DC4038' }}>
        <TopBar title="全部热门" variant="red" />
      </div>
      <div className="shrink-0 flex bg-app-surface border-b border-app-border">
        {[['movies', '热映电影'], ['shows', '热门演出'], ['cinemas', '影院']].map(([t, label]) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'hotall.tab.select.target' }, {
              params: { target: t },
              onTrigger: () => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
            })}
            className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t ? 'text-[#DC4038] font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="hotall-list" data-scroll-direction="vertical">
        {tab === 'movies' && [...hot, ...upcoming].map((m) => (
          <button key={m.id} {...bindTap('hotall.movie-open', { params: { id: m.id } })}
            className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left items-center">
            <Img src={m.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-semibold text-app-text truncate">{m.title}</span>
                {m.formats.slice(0, 2).map((f) => <span key={f} className="shrink-0 text-[9px] text-[#8A6D3B] border border-[#D9C69A] rounded px-0.5">{f}</span>)}
              </div>
              <div className="text-[12px] mt-0.5">
                {m.status === 'upcoming'
                  ? <><WishCount value={m.wishCount} /><span className="text-[10px] text-(--app-c-text-3)"> {s.wishCount}</span></>
                  : m.score > 0 ? <>猫眼评分 <Score value={m.score} size="s" /></> : <span className="text-(--app-c-text-3)">{s.noScore}</span>}
              </div>
              <div className="text-[11px] text-(--app-c-text-3) mt-0.5 truncate">主演:{m.cast.filter((c) => c.role !== '导演').map((c) => c.name).join(',')}</div>
              <div className="text-[11px] text-(--app-c-text-3) mt-0.5">
                {m.status === 'hot' ? `今天${m.cinemaCount}家影院放映${m.sessionCount}场` : `${m.releaseDate} 上映`}
              </div>
            </div>
            {m.status === 'hot' || m.presale ? (
              <PillBtn kind={m.status === 'hot' ? 'buy' : 'presale'} binding={bindTap('hotall.buy-open', { params: { id: m.id }, stopPropagation: true })}>
                {m.status === 'hot' ? s.buy : s.presale}
              </PillBtn>
            ) : null}
          </button>
        ))}
        {tab === 'shows' && (
          <>
            <div className="flex gap-2 px-3 py-2 bg-app-surface text-[12px] text-app-text-muted">
              <span>全部时间 ▾</span><span>智能排序 ▾</span><span>限时优惠 ▾</span>
            </div>
            {shows.map((x) => (
              <button key={x.id} {...bindTap('hotall.show-open', { params: { id: x.id } })}
                className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left">
                <Img src={x.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-app-text line-clamp-2">{x.title}</div>
                  <div className="text-[11px] text-(--app-c-text-3) mt-1">{x.dateDesc} · {x.venue}</div>
                  <div className="mt-1"><Price value={x.priceMin} size="s" suffix=" 起" />{x.discount && <span className="ml-1 text-[10px] text-[#FF6F00] bg-[#FFF3E0] rounded px-1">{x.discount}</span>}</div>
                </div>
              </button>
            ))}
          </>
        )}
        {tab === 'cinemas' && cinemas.map((c) => (
          <div key={c.id} className="w-full bg-app-surface border-b border-app-border px-3 py-2.5">
            <div className="flex items-center">
              <span className="text-[15px] font-semibold text-app-text truncate flex-1">{c.name}</span>
              <Price value={c.minPrice} size="s" suffix=" 起" />
            </div>
            <div className="flex items-center mt-1">
              <span className="text-[11px] text-(--app-c-text-3) truncate flex-1">{c.address}</span>
              <span className="text-[11px] text-(--app-c-text-3) shrink-0 ml-2">{c.distanceKm}km</span>
            </div>
            <div className="flex gap-1 mt-1.5 flex-wrap">{c.services.slice(0, 4).map((t) => <ServiceTag key={t} text={t} />)}</div>
          </div>
        ))}
        <div className="h-3" />
      </div>
    </div>
  );
}

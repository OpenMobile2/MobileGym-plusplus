import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { Img, TopBar, Chip, RecoverPage, MY, useToast, NOT_OPEN, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcHeart, IcPin, IcArrowDown, IcArrowUp } from '../res/icons';

/** 演出详情页(r6:场次城市chips/标签/艺人关注/须知/想看气泡/立即预订) */
export default function ShowDetailPage() {
  const statusFg = useStatusBarFg();
  const { id } = useParams();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [cityStop, setCityStop] = React.useState('');
  const [tab, setTab] = React.useState('介绍');
  const [noticeOpen, setNoticeOpen] = React.useState(false);
  const [bubble, setBubble] = React.useState(true);

  const show = useMaoyanStore((st) => st.shows.find((x) => x.id === id));
  const toggleWishShow = useMaoyanStore((st) => st.toggleWishShow);
  const followArtist = useMaoyanStore((st) => st.followArtist);
  const startShowDraft = useMaoyanStore((st) => st.startShowDraft);
  const recordShowNoticeViewed = useMaoyanStore((st) => st.recordShowNoticeViewed);

  if (!show) return <RecoverPage title={s.tabShow} text={s.showNotFound} />;
  const stop = cityStop || show.cityStops[0];

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground={statusFg}>
      {toast}
      <TopBar title="演出" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="showdetail-scroll" data-scroll-direction="vertical">
        {/* 头图+价格 */}
        <div className="bg-app-surface px-3 py-3 flex gap-3">
          <Img src={show.poster} className="w-24 h-32 object-cover rounded-lg shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-app-text leading-snug line-clamp-3">{show.title}</div>
            <div className="mt-2">
              <span className="text-[13px] font-semibold" style={{ color: MY.cta }}>¥</span>
              <span className="text-[20px] font-bold" style={{ color: MY.cta }}>{show.priceMin}-{show.priceMax}</span>
            </div>
          </div>
        </div>

        {/* 场次城市 chips */}
        <div className="bg-app-surface px-3 pb-3 border-t border-app-border pt-2">
          <div className="flex gap-2 flex-wrap">
            {show.cityStops.map((c) => (
              <Chip
                key={c}
                text={c}
                active={stop === c}
                binding={bindTap({ kind: 'action', id: 'showdetail.city.select.option' }, {
                  params: { option: c },
                  onTrigger: () => setCityStop(c),
                })}
              />
            ))}
            <Chip text="+求加场" color="outline" onClick={() => setBubble(true)} />
          </div>
          <div className="text-[13px] text-(--app-c-text-2) mt-2.5">{show.sessionDesc},以现场为准</div>
          <div className="flex items-center text-[13px] text-(--app-c-text-2) mt-1">
            <span className="truncate">{show.city}·{show.venue}</span>
            <span className="ml-auto text-[11px] text-(--app-c-text-3) shrink-0 flex items-center"><IcPin size={12} />{show.distanceKm}km</span>
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {show.tags.map((t) => (
              <span key={t} className={`text-[10px] px-1.5 py-0.5 rounded ${t.includes('不支持') ? 'text-(--app-c-brand-tint-text) bg-[#FEF0EF]' : 'text-app-text-muted bg-(--app-c-fill)'}`}>{t}</span>
            ))}
          </div>
        </div>

        {/* 艺人卡 */}
        <div className="bg-app-surface mt-2 px-3 py-2.5 flex items-center">
          <span
            {...bindTap({ kind: 'action', id: 'showdetail.artist.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="w-9 h-9 rounded-full bg-(--app-c-brand-tint) flex items-center justify-center text-[16px] cursor-pointer"
          >🎤</span>
          <div
            {...bindTap({ kind: 'action', id: 'showdetail.artist.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="ml-2 flex-1 cursor-pointer"
          >
            <div className="text-[13px] font-medium text-app-text">{show.artist}</div>
            <div className="text-[10px] text-(--app-c-text-3)">{show.category === 'concert' ? '歌手' : '演出团体'} · 5场 在售演出</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'showdetail.follow.toggle' }, { onTrigger: () => followArtist(show.id) })}
            className={`text-[12px] rounded-full px-3 py-1 cursor-pointer ${show.artistFollowed ? 'bg-(--app-c-fill) text-(--app-c-text-3) border-none' : 'text-[#DC4038] border border-[#DC4038] bg-app-surface'}`}
          >
            {show.artistFollowed ? '已关注' : '+关注'}
          </button>
        </div>

        {/* 介绍/须知/推荐 tab */}
        <div className="bg-app-surface mt-2">
          <div className="flex gap-6 px-4 pt-2 border-b border-app-border">
            {['介绍', '须知', '推荐'].map((t) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'showdetail.tab.select.target' }, {
                  params: { target: t },
                  onTrigger: () => {
                    setTab(t);
                    // The notice tab already renders the purchase notices, so
                    // entering it is sufficient evidence that they were viewed;
                    // expanding "全部" is an optional detail action.
                    if (t === '须知') recordShowNoticeViewed(show.id);
                  },
                })}
                className={`pb-2 bg-transparent border-none cursor-pointer text-[14px] ${tab === t ? 'text-app-text font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
              >
                {t}
              </button>
            ))}
          </div>
          {tab === '介绍' && (
            <div className="px-4 py-3">
              <div className="text-[13px] text-(--app-c-text-2) leading-relaxed">{show.intro}</div>
              <Img src={show.poster} className="w-full rounded-lg mt-3" />
            </div>
          )}
          {(tab === '须知' || tab === '介绍') && (
            <div className="px-4 py-3 border-t border-app-border">
              <button
                {...bindTap({ kind: 'action', id: 'showdetail.notice.toggle' }, { onTrigger: () => setNoticeOpen((v) => { const next = !v; if (next) recordShowNoticeViewed(show.id); return next; }) })}
                className="w-full flex items-center bg-transparent border-none cursor-pointer text-[14px] font-semibold text-app-text"
              >
                购票观演须知
                <span className="ml-auto text-[12px] text-(--app-c-text-3) font-normal flex items-center">全部{show.notices.length}条 {noticeOpen ? <IcArrowUp size={13} /> : <IcArrowDown size={13} />}</span>
              </button>
              {(noticeOpen ? show.notices : show.notices.slice(0, 2)).map((n) => (
                <div key={n} className="text-[12px] text-app-text-muted mt-2 leading-relaxed">· {n}</div>
              ))}
            </div>
          )}
          {tab === '推荐' && (
            <div className="px-4 py-3 text-[13px] text-(--app-c-text-3)">更多演出请回演出频道查看</div>
          )}
        </div>
        <div className="h-3" />
      </div>

      {/* 想看气泡 + 底部预订 */}
      <div className="shrink-0 relative bg-app-surface border-t border-app-border px-3 py-2 flex items-center gap-3">
        {bubble && (
          <div className="absolute -top-9 left-3 bg-black/75 text-white text-[11px] rounded-full px-3 py-1.5">
            还没想好没决定?标记【想看】不着急
            <button onClick={() => setBubble(false)} className="ml-1 bg-transparent border-none text-white/70 cursor-pointer">✕</button>
          </div>
        )}
        <button
          {...bindTap({ kind: 'action', id: 'showdetail.wish.toggle' }, { onTrigger: () => toggleWishShow(show.id) })}
          className="flex flex-col items-center bg-transparent border-none cursor-pointer w-12"
        >
          <IcHeart size={20} fill={show.wished ? MY.cta : 'none'} className={show.wished ? 'text-[#F5303E]' : 'text-(--app-c-text-3)'} />
          <span className="text-[10px] text-app-text-muted">{show.wished ? '已想看' : '想看'}</span>
        </button>
        <button
          {...bindTap('showdetail.book-open', { params: { id: show.id }, beforeTrigger: () => startShowDraft(show.id) })}
          className="flex-1 h-11 rounded-full text-white text-[16px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {s.bookNow}
        </button>
      </div>
    </div>
  );
}

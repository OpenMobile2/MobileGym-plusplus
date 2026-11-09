import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, TopBar, RecoverPage, MY, useStatusBarFg } from '../components/ui';
import { seatMap, recommendSeats, dayLabel } from '../utils/format';
import { MAX_SEATS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcClose } from '../res/icons';

/** 在线选座页(anchor_seat.jpg, r1/r5;协议弹窗 ?agree=open) */
export default function SeatSelectPage() {
  const statusFg = useStatusBarFg();
  const { sessionId } = useParams();
  const { bindTap, go, back } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { value: agree } = usePanel('agree');

  const session = useMaoyanStore((st) => st.sessions.find((x) => x.id === sessionId));
  const sessions = useMaoyanStore((st) => st.sessions);
  const movie = useMaoyanStore((st) => st.movies.find((m) => m.id === session?.movieId));
  const cinema = useMaoyanStore((st) => st.cinemas.find((c) => c.id === session?.cinemaId));
  const seatDraft = useMaoyanStore((st) => st.seatDraft);
  const startSeatDraft = useMaoyanStore((st) => st.startSeatDraft);
  const toggleSeat = useMaoyanStore((st) => st.toggleSeat);
  const applyRecommendSeats = useMaoyanStore((st) => st.applyRecommendSeats);
  const switchDraftSession = useMaoyanStore((st) => st.switchDraftSession);
  const setAgreed = useMaoyanStore((st) => st.setAgreed);

  const [showSessions, setShowSessions] = React.useState(false);

  React.useEffect(() => {
    if (sessionId && (!seatDraft || seatDraft.sessionId !== sessionId)) startSeatDraft(sessionId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  if (!session || !movie || !cinema) {
    return <RecoverPage title={s.sessionsBuy} text={s.sessionNotFound} />;
  }

  const grid = seatMap(session.id);
  const picked = seatDraft?.sessionId === session.id ? seatDraft.seats : [];
  const total = Math.round(picked.length * session.price * 10) / 10;
  const siblings = sessions.filter((x) => x.cinemaId === session.cinemaId && x.movieId === session.movieId && x.dayOffset === session.dayOffset);

  const seatKey = (r: number, c: number) => `${r + 1}-${String(c + 1).padStart(2, '0')}`;

  return (
    <div className="flex flex-col h-full relative bg-app-bg" data-status-bar-foreground={statusFg}>
      {toast}
      <TopBar title={cinema.name} />
      {/* 图例 */}
      <div className="shrink-0 flex justify-center gap-4 py-2 text-[11px] text-app-text-muted bg-app-surface">
        <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-sm bg-(--app-c-fill-strong) inline-block" />{s.seatSold}</span>
        <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-sm bg-app-surface border border-(--app-c-border-strong) inline-block" />{s.seatFree}</span>
        <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-sm bg-[#F8C8D0] inline-block" />{s.seatCouple}</span>
        <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-sm bg-(--app-c-fill-strong) inline-block opacity-40" />{s.seatBlocked}</span>
      </div>

      {/* 座位图 */}
      <div className="flex-1 overflow-auto bg-app-surface" data-scroll-container="seat-map" data-scroll-direction="horizontal">
        <div className="mx-auto w-fit px-4 pt-2 pb-4">
          <div className="mx-auto w-48 h-5 rounded-b-3xl bg-(--app-c-fill-strong) text-center text-[10px] text-(--app-c-text-3) leading-5 mb-3">
            {session.hall}银幕
          </div>
          {grid.map((row, r) => (
            <div key={r} className="flex gap-1 mb-1 items-center">
              <span className="w-4 text-[9px] text-(--app-c-text-3) text-center shrink-0">{r + 1}</span>
              {row.map((cell, c) => {
                const key = seatKey(r, c);
                const isPicked = picked.includes(key);
                if (cell === 'sold') {
                  return <span key={c} className="w-6 h-6 rounded bg-(--app-c-fill-strong) shrink-0" />;
                }
                return (
                  <button
                    key={c}
                    {...bindTap({ kind: 'action', id: 'seat.pick.toggle' }, {
                      params: { id: key },
                      onTrigger: () => {
                        const ok = toggleSeat(key);
                        if (!ok) showToast(s.maxSeatsHint);
                      },
                    })}
                    className={`w-6 h-6 rounded shrink-0 cursor-pointer border ${isPicked ? 'border-none text-white text-[10px] font-bold' : 'bg-app-surface border-(--app-c-border-strong)'}`}
                    style={isPicked ? { background: '#34B96F' } : undefined}
                  >
                    {isPicked ? '✓' : ''}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 底部卡:推荐座位 + 影片场次 + 已选 + 确认 */}
      <div className="shrink-0 bg-app-surface border-t border-app-border px-3 pt-2 pb-2">
        <div className="flex items-center gap-2 text-[12px] text-app-text-muted">
          <span className="shrink-0">{s.recommendSeat}</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              {...bindTap({ kind: 'action', id: 'seat.recommend.select.option' }, {
                params: { option: `${n}人` },
                onTrigger: () => {
                  const free: string[] = recommendSeats(grid, n);
                  if (free.length) applyRecommendSeats(n, free);
                  else showToast('没有找到连座');
                },
              })}
              className="px-2.5 py-0.5 rounded-full border border-(--app-c-border-strong) bg-app-surface text-[12px] cursor-pointer"
            >
              {n}人
            </button>
          ))}
        </div>
        <div className="flex items-center mt-2">
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-app-text truncate">{movie.title}</div>
            <div className="text-[11px] text-(--app-c-text-3)">{dayLabel(session.dayOffset)} {session.start}-{session.end} {session.lang}{session.dim}</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'seat.session.select.target' }, {
              params: { target: 'panel' },
              onTrigger: () => setShowSessions((v) => !v),
            })}
            className="shrink-0 text-[12px] text-[#4B9EF8] bg-transparent border-none cursor-pointer"
          >
            {s.switchSession} ▾
          </button>
        </div>
        {showSessions && (
          <div className="flex gap-2 mt-2 overflow-x-auto" data-scroll-container="session-row" data-scroll-direction="horizontal">
            {siblings.map((x) => (
              <button
                key={x.id}
                {...bindTap('seat.session.switch-open', {
                  params: { sessionId: x.id },
                  beforeTrigger: () => { switchDraftSession(x.id); setShowSessions(false); },
                })}
                className={`shrink-0 rounded-lg border px-3 py-1.5 text-[12px] cursor-pointer ${x.id === session.id ? 'border-[#DC4038] text-[#DC4038] bg-(--app-c-brand-tint)' : 'border-(--app-c-border-strong) bg-app-surface text-(--app-c-text-2)'}`}
              >
                <div>{x.start} {x.lang}{x.dim}</div>
                <div className="text-[10px]">¥{x.price}</div>
              </button>
            ))}
          </div>
        )}
        {picked.length > 0 && (
          <div className="flex gap-2 mt-2 flex-wrap">
            {picked.map((p) => (
              <span key={p} className="flex items-center gap-1.5 bg-(--app-c-fill) rounded px-2 py-1 text-[12px] text-(--app-c-text-2)">
                {p.replace('-', '排')}座 ¥{session.price}
                <button
                  {...bindTap({ kind: 'action', id: 'seat.remove.toggle' }, { params: { id: p }, onTrigger: () => toggleSeat(p) })}
                  className="bg-transparent border-none cursor-pointer text-(--app-c-text-3) p-0 flex"
                >
                  <IcClose size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
        {picked.length === 0 ? (
          <button
            {...bindTap({ kind: 'action', id: 'seat.confirm.blocked' }, { onTrigger: () => showToast(s.pickSeatFirst) })}
            className="w-full h-11 mt-2 rounded-full text-white text-[15px] font-bold border-none cursor-pointer opacity-60"
            style={{ background: MY.ctaGradient }}
          >
            {s.pickSeatFirst}
          </button>
        ) : (
          <button
            {...bindTap('seat.confirm.open', { params: { sessionId: session.id } })}
            className="w-full h-11 mt-2 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
            style={{ background: MY.ctaGradient }}
          >
            {total}元 {s.confirmSeats}
          </button>
        )}
      </div>

      {/* 退改签规定协议弹窗(?agree=open) */}
      {agree === 'open' && (
        <AgreementModal
          onContinueBlocked={() => showToast(s.agreeFirst)}
        />
      )}
    </div>
  );
}

function AgreementModal({ onContinueBlocked }: { onContinueBlocked: () => void }) {
  const { bindTap, bindBack } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const seatDraft = useMaoyanStore((st) => st.seatDraft);
  const setAgreed = useMaoyanStore((st) => st.setAgreed);
  const setPayContext = useMaoyanStore((st) => st.setPayContext);
  const checked = seatDraft?.agreed ?? false;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-app-surface rounded-xl w-[84%] max-h-[70%] flex flex-col p-4">
        <div className="text-[16px] font-bold text-center text-app-text mb-2">{s.agreementTitle}</div>
        <div className="flex-1 overflow-y-auto text-[12px] text-app-text-muted leading-relaxed" data-scroll-container="agreement" data-scroll-direction="vertical">
          用户点击同意本协议之前,请务必认真阅读、完全理解本协议中全部条款,特别是其中与用户权益有可能存在重大关系的条款(包括但不限于第1.2条、第1.3条、第2条、第3.2条)。当用户按照页面提示阅读、点击确认本协议或以其他方式接受本协议后,即表示用户已经充分阅读、理解并接受本协议的全部内容。退票、改签服务请参考影院具体政策要求,特殊场次及部分使用卡、券场次订单可能不支持此服务。
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'seat.agree.check.toggle' }, { onTrigger: () => setAgreed(!checked) })}
          className="mt-3 flex items-center gap-1.5 text-[12px] bg-transparent border-none cursor-pointer text-app-text-muted"
        >
          <span className={`w-4 h-4 rounded-full border inline-flex items-center justify-center text-[10px] ${checked ? 'bg-[#34B96F] border-[#34B96F] text-white' : 'border-(--app-c-border-strong)'}`}>
            {checked ? '✓' : ''}
          </span>
          {s.agreeCheck}
        </button>
        {checked ? (
          <button
            {...bindTap('seat.agreement.continue-open', { beforeTrigger: () => setPayContext('movie') })}
            className="mt-3 h-10 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
            style={{ background: MY.cta }}
          >
            {s.agreeContinue}
          </button>
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'seat.agree.blocked' }, { onTrigger: onContinueBlocked })}
            className="mt-3 h-10 rounded-full text-white text-[15px] font-bold border-none cursor-pointer opacity-70"
            style={{ background: MY.cta }}
          >
            {s.agreeContinue}
          </button>
        )}
        <button
          {...bindBack()}
          className="mt-2 h-9 text-[14px] text-(--app-c-text-3) bg-transparent border-none cursor-pointer"
        >
          {s.agreeLater}
        </button>
      </div>
    </div>
  );
}

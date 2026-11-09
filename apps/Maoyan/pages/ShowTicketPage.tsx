import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { TopBar, RecoverPage, MY, useStatusBarFg } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcMinus, IcPlus } from '../res/icons';

const MAX_QTY = 6;

/** 选择票档页(r6:场次/票档/数量,每笔订单限购6张) */
export default function ShowTicketPage() {
  const statusFg = useStatusBarFg();
  const { id } = useParams();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);

  const show = useMaoyanStore((st) => st.shows.find((x) => x.id === id));
  const showDraft = useMaoyanStore((st) => st.showDraft);
  const startShowDraft = useMaoyanStore((st) => st.startShowDraft);
  const setShowDraft = useMaoyanStore((st) => st.setShowDraft);
  const setPayContext = useMaoyanStore((st) => st.setPayContext);

  React.useEffect(() => {
    if (id && (!showDraft || showDraft.showId !== id)) startShowDraft(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!show) return <RecoverPage title={s.chooseTier} text={s.showNotFound} />;
  const draft = showDraft?.showId === show.id ? showDraft : null;
  const tier = show.tiers.find((t) => t.id === draft?.tierId) ?? show.tiers[0];
  const qty = draft?.qty ?? 1;
  const total = tier.price * qty;

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground={statusFg}>
      <TopBar title={s.chooseTier} />
      <div className="flex-1 overflow-y-auto px-4">
        <div className="text-[14px] font-bold text-app-text mt-3">{show.title}</div>
        <div className="text-[12px] text-(--app-c-text-3) mt-1">{show.city}·{show.venue}</div>

        <div className="text-[13px] font-semibold text-app-text-muted mt-5 mb-2">场次</div>
        <button
          {...bindTap({ kind: 'action', id: 'showticket.session.select.option' }, { params: { option: show.sessionDesc }, onTrigger: () => { /* 单场次,保持选中 */ } })}
          className="text-[13px] rounded-lg px-3 py-2 cursor-pointer border border-[#DC4038] text-[#DC4038] bg-(--app-c-brand-tint)"
        >
          {show.sessionDesc}
        </button>

        <div className="text-[13px] font-semibold text-app-text-muted mt-5 mb-2">票档</div>
        <div className="flex gap-2 flex-wrap">
          {show.tiers.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'showticket.tier.select.option' }, {
                params: { option: t.id },
                onTrigger: () => setShowDraft({ tierId: t.id }),
              })}
              className={`text-[13px] rounded-lg px-3 py-2 cursor-pointer border ${tier.id === t.id ? 'border-[#DC4038] text-[#DC4038] bg-(--app-c-brand-tint)' : 'border-(--app-c-border-strong) text-(--app-c-text-2) bg-app-surface'}`}
            >
              {t.name}{t.price}元 ¥{t.price}
            </button>
          ))}
        </div>

        <div className="flex items-center mt-6">
          <span className="text-[13px] font-semibold text-app-text-muted">{s.qty}</span>
          <span className="ml-2 text-[11px] text-(--app-c-text-4)">每笔订单限购{MAX_QTY}张</span>
          <div className="ml-auto flex items-center gap-3">
            <button
              {...bindTap({ kind: 'action', id: 'showticket.qty.input' }, {
                params: { value: String(Math.max(1, qty - 1)) },
                onTrigger: () => setShowDraft({ qty: Math.max(1, qty - 1) }),
              })}
              disabled={qty <= 1}
              className="w-8 h-8 rounded-full border border-(--app-c-border-strong) bg-app-surface cursor-pointer disabled:opacity-30 flex items-center justify-center"
              aria-label="减少"
            >
              <IcMinus size={15} />
            </button>
            <span className="text-[16px] font-semibold w-6 text-center">{qty}</span>
            <button
              {...bindTap({ kind: 'action', id: 'showticket.qty.input' }, {
                params: { value: String(Math.min(MAX_QTY, qty + 1)) },
                onTrigger: () => setShowDraft({ qty: Math.min(MAX_QTY, qty + 1) }),
              })}
              disabled={qty >= MAX_QTY}
              className="w-8 h-8 rounded-full border border-(--app-c-border-strong) bg-app-surface cursor-pointer disabled:opacity-30 flex items-center justify-center"
              aria-label="增加"
            >
              <IcPlus size={15} />
            </button>
          </div>
        </div>
      </div>
      <div className="shrink-0 flex items-center border-t border-app-border px-4 py-2">
        <div>
          <span className="text-[12px] text-app-text-muted">{s.total} </span>
          <span className="text-[20px] font-bold" style={{ color: MY.cta }}>¥{total}</span>
          <span className="text-[11px] text-(--app-c-text-3) ml-1">明细 ▴</span>
        </div>
        <button
          {...bindTap('showticket.confirm-open', { beforeTrigger: () => setPayContext('show') })}
          className="ml-auto h-10 px-10 rounded-full text-white text-[15px] font-bold border-none cursor-pointer"
          style={{ background: MY.ctaGradient }}
        >
          {s.confirm}
        </button>
      </div>
    </div>
  );
}

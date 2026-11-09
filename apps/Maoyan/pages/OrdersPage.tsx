import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, TopBar, EmptyState, MY } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { formatDate } from '../utils/format';

const STATUS_ZH: Record<string, string> = { finished: '已完成', upcoming: '待放映', changed: '已改签' };

/** 订单列表(anchor_orders_list.jpg;演出tab空态 r7) */
export default function OrdersPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { value: tabRaw, setSearchParams } = usePanel('tab');
  const tab = tabRaw ?? 'movie';
  const [editMode, setEditMode] = React.useState(false);

  const orders = useMaoyanStore((st) => st.orders);
  const list = orders.filter((o) => (tab === 'movie' ? o.kind === 'movie' : o.kind === 'show'));

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="light">
      {toast}
      <div className="shrink-0" style={{ background: MY.primary }}>
        <TopBar
          title={tab === 'movie' ? '电影票订单' : '演出订单'}
          variant="red"
          rightContent={(
            <button
              {...bindTap({ kind: 'action', id: 'orders.edit.toggle' }, { onTrigger: () => setEditMode((v) => !v) })}
              className="text-[13px] text-white bg-transparent border-none cursor-pointer"
            >
              {editMode ? '完成' : '编辑'}
            </button>
          )}
        />
        <div className="flex px-3 pb-2 gap-3">
          {[['movie', s.movieTickets], ['show', s.showOrders]].map(([t, label]) => (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'orders.tab.select.target' }, {
                params: { target: t },
                onTrigger: () => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
              })}
              className={`text-[13px] rounded-full px-4 py-1 border-none cursor-pointer ${tab === t ? 'bg-app-surface text-[#DC4038] font-semibold' : 'bg-app-surface/20 text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto" data-scroll-container="orders-list" data-scroll-direction="vertical">
        {list.length === 0 && <EmptyState text={s.noTickets} hint="去看场演出吧" />}
        {list.map((o) => (
          <button
            key={o.id}
            {...bindTap('orders.item-open', { params: { id: o.id } })}
            className="w-full bg-app-surface border-none border-b-8 border-app-bg px-3 py-2.5 cursor-pointer text-left"
          >
            <div className="flex items-center text-[12px] text-app-text-muted">
              <span className="truncate">{o.cinemaOrVenue} ›</span>
              <span className="ml-auto shrink-0 text-(--app-c-text-3)">{STATUS_ZH[o.status]}</span>
            </div>
            <div className="flex gap-2.5 mt-2">
              {editMode && <span className="self-center w-4 h-4 rounded-full border border-(--app-c-border-strong) shrink-0" />}
              <Img src={o.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="text-[15px] font-semibold text-app-text truncate">{o.title} {o.count}张</span>
                  {o.status === 'changed' && <span className="ml-1 shrink-0 text-[9px] text-(--app-c-gold-text) bg-(--app-c-gold-tint) rounded px-1">改签票</span>}
                </div>
                <div className="text-[12px] text-app-text-muted mt-1">{o.sessionDesc}</div>
                <div className="text-[12px] text-app-text-muted mt-0.5 truncate">{o.hallSeats || o.tierDesc}</div>
                <div className="text-[12px] text-(--app-c-text-3) mt-1">总价:{o.total}元</div>
              </div>
              {o.kind === 'movie' && o.status !== 'upcoming' && !o.rated && (
                <span
                  {...bindTap('orders.review-open', { params: { id: o.movieId }, stopPropagation: true })}
                  className="self-center shrink-0 text-[12px] text-white rounded-full px-3 py-1.5 cursor-pointer"
                  style={{ background: MY.cta }}
                >
                  {s.rateMovie}
                </span>
              )}
            </div>
            <div className="text-[10px] text-(--app-c-text-4) mt-1.5 text-right">{formatDate(o.timestamp)}</div>
          </button>
        ))}
        <div className="h-3" />
      </div>
    </div>
  );
}

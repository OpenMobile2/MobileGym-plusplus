import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { useToast, Img, TopBar, RecoverPage, NOT_OPEN, MY } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcPin, IcPhone, IcArrowRight, IcArrowDown, IcArrowUp } from '../res/icons';

/** 订单详情(anchor_ticket_code.jpg:深橄榄绿沉浸头部+取票码;r2) */
export default function OrderDetailPage() {
  const { id } = useParams();
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [codeOpen, setCodeOpen] = React.useState(true);
  const [rateStars, setRateStars] = React.useState(0);

  const order = useMaoyanStore((st) => st.orders.find((o) => o.id === id));
  const miaoCoins = useMaoyanStore((st) => st.miaoCoins);
  const cinemas = useMaoyanStore((st) => st.cinemas);

  if (!order) return <RecoverPage title={s.myOrders} text={s.orderNotFound} hint={s.payDraftMissingHint} />;
  const isShow = order.kind === 'show';
  // 影院行跳转到订单真实所属影院(此前写死 c_wenyuan,与订单对不上)
  const cinemaId = cinemas.find((c) => c.name === order.cinemaOrVenue)?.id ?? cinemas[0].id;
  const theme = '#4A4A30';
  const statusText = order.status === 'finished'
    ? (isShow ? '演出结束' : '放映结束')
    : order.status === 'changed' ? '已改签' : isShow ? '待观演' : '待放映';

  return (
    <div className="flex flex-col h-full relative" data-status-bar-foreground="light"
      style={{ background: `linear-gradient(180deg, ${theme} 0%, ${theme} 180px, ${MY.bg} 320px, ${MY.bg} 100%)` }}>
      {toast}
      <TopBar title={statusText} variant="dark" bg="transparent" />
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="orderdetail-scroll" data-scroll-direction="vertical">
        {/* 影院/场馆行 */}
        <div className="bg-app-surface/95 rounded-t-xl mt-1 px-3 py-2.5 flex items-center">
          {!isShow ? (
            <button
              {...bindTap('orderdetail.cinema-open', { params: { id: cinemaId } })}
              className="flex items-center flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left"
            >
              <span className="text-[14px] font-semibold text-app-text truncate">{order.cinemaOrVenue}</span>
              <IcArrowRight size={14} className="text-(--app-c-text-3) shrink-0" />
            </button>
          ) : (
            <span className="text-[14px] font-semibold text-app-text truncate flex-1">{order.cinemaOrVenue}</span>
          )}
          <IcPin size={16} className="text-[#4B9EF8] mx-2 shrink-0" />
          <IcPhone size={15} className="text-[#4B9EF8] shrink-0" />
        </div>

        {/* 票根卡 */}
        <div className="bg-app-surface px-3 py-3 flex gap-3">
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold text-app-text">{order.title}</div>
            <div className="text-[12px] text-app-text-muted mt-1">{order.sessionDesc}</div>
            <div className="text-[12px] text-app-text-muted mt-0.5">{order.hallSeats || order.tierDesc}</div>
            {order.viewerName && <div className="text-[12px] text-app-text-muted mt-0.5">观演人:{order.viewerName}</div>}
            <div className="text-[12px] text-(--app-c-text-3) mt-1">{order.count}张 总价{order.total}元</div>
          </div>
          <Img src={order.poster} className="w-16 h-[85px] object-cover rounded shrink-0" />
        </div>

        {/* 退票/改签(电影待放映,qa:Q11);演出票不支持退改,直接说明 */}
        {order.status === 'upcoming' && (
          <div className="bg-app-surface px-3 py-2 flex gap-2 border-t border-app-border items-center">
            {isShow ? (
              <span className="text-[11px] text-(--app-c-brand-tint-text) bg-[#FEF0EF] rounded px-1.5 py-0.5">{s.showNoRefund}</span>
            ) : (
              <button
                {...bindTap({ kind: 'action', id: 'orderdetail.refund.trigger' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="text-[12px] text-app-text-muted border border-(--app-c-border-strong) rounded-full px-3 py-1 bg-app-surface cursor-pointer"
              >
                {s.refundChange}
              </button>
            )}
          </div>
        )}

        {/* 取票码 */}
        <div className="bg-app-surface rounded-b-xl px-3 py-3 border-t border-dashed border-[#E0E0E0] relative">
          <button
            {...bindTap({ kind: 'action', id: 'orderdetail.code.toggle' }, { onTrigger: () => setCodeOpen((v) => !v) })}
            className="w-full flex items-center justify-center gap-1 bg-transparent border-none cursor-pointer text-[13px] text-app-text-muted"
          >
            {isShow ? s.expandEntryCode : s.expandCode}{codeOpen ? <IcArrowUp size={14} /> : <IcArrowDown size={14} />}
          </button>
          {codeOpen && order.code && (
            <div className="mt-3 text-center relative">
              {/* 演出=电子票凭证件入场,电影=影院取票码,两者文案/字段不同 */}
              <div className="text-[16px] font-bold text-app-text text-left">{isShow ? s.takeShowTicket : s.takeTicket}</div>
              {isShow && <div className="text-[11px] text-(--app-c-text-3) text-left mt-0.5">{s.showEntryNote}</div>}
              {/* 二维码(确定性图案,来自 qrToken) */}
              <QrBlock token={order.code.qrToken} />
              <div className="mx-auto mt-3 bg-(--app-c-fill) rounded-lg py-2.5 w-[90%]">
                {isShow && order.viewerName && (
                  <div className="text-[13px] text-(--app-c-text-3)">{s.viewerLabel}: <span className="text-(--app-c-text-2) font-semibold">{order.viewerName}</span></div>
                )}
                <div className="text-[13px] text-(--app-c-text-3) mt-1">手机号: <span className="text-(--app-c-text-2) line-through decoration-transparent">{order.code.phone}</span></div>
                <div className="text-[13px] text-(--app-c-text-3) mt-1">{s.verifyCode}: <span className="text-(--app-c-text-2) font-semibold">{order.code.verify}</span></div>
              </div>
              {order.status === 'finished' && (
                <div className="absolute right-2 top-10 rotate-[-18deg] text-(--app-c-brand-tint-text) border-[3px] border-[#D8574E] rounded-lg px-2 py-0.5 text-[16px] font-bold opacity-70">
                  已完成
                </div>
              )}
            </div>
          )}
        </div>

        {/* 喵币成长值 */}
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-2.5 flex items-center text-[13px]">
          <span className="text-[16px] mr-1.5">🎁</span>
          <span className="text-(--app-c-text-2)">已获得<span className="text-[#FF8800] font-semibold">{miaoCoins}</span>喵币和<span className="text-[#FF8800] font-semibold">100</span>成长值</span>
          <span className="ml-auto text-(--app-c-text-3) text-[12px]">去兑换 ›</span>
        </div>

        {/* 评价电影 */}
        {order.kind === 'movie' && order.status !== 'upcoming' && (
          <div className="bg-app-surface rounded-xl mt-2 px-3 py-3">
            <div className="text-[15px] font-bold text-app-text">评价电影</div>
            <div className="flex items-center justify-center gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <span
                  key={i}
                  {...bindTap('orderdetail.rate-open', {
                    params: { id: order.movieId },
                    beforeTrigger: () => setRateStars(i * 2),
                  })}
                  className="text-[30px] cursor-pointer"
                  style={{ color: rateStars >= i * 2 ? MY.scoreOrange : 'var(--app-c-border-strong)' }}
                >
                  ★
                </span>
              ))}
            </div>
            <div className="text-center text-[11px] text-(--app-c-text-3) mt-1">可以拖动星星评分</div>
          </div>
        )}

        {/* 附近美食/玩乐(wontfix) */}
        <div className="bg-app-surface rounded-xl mt-2 px-3 py-3 mb-3">
          <div className="flex gap-4 items-center text-[14px] font-semibold text-app-text">
            附近美食
            <span
              {...bindTap({ kind: 'action', id: 'orderdetail.food.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="text-(--app-c-text-3) font-normal cursor-pointer"
            >
              附近玩乐
            </span>
            <span
              {...bindTap({ kind: 'action', id: 'orderdetail.food.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="ml-auto text-[11px] text-(--app-c-text-3) font-normal cursor-pointer"
            >
              查看更多 ›
            </span>
          </div>
          <div className="flex gap-2 mt-2">
            {['海底捞火锅(九…', '喜牛牛·潮汕牛…', '不止是甜品'].map((n, i) => (
              <button
                key={n}
                {...bindTap({ kind: 'action', id: 'orderdetail.food.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="flex-1 bg-transparent border-none cursor-pointer p-0 text-left"
              >
                <div className="w-full aspect-square rounded-lg bg-(--app-c-fill) flex items-center justify-center text-[24px]">{['🍲', '🥩', '🍰'][i]}</div>
                <div className="text-[11px] text-(--app-c-text-2) truncate mt-1">{n}</div>
                <div className="text-[10px] text-(--app-c-text-3)">4.{8 - i}分 ¥{120 + i * 3}/人</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 确定性伪二维码(qrToken 派生图案;仅装饰) */
function QrBlock({ token }: { token: string }) {
  const cells: boolean[] = [];
  let h = 0;
  for (const ch of token) h = (h * 131 + ch.charCodeAt(0)) >>> 0;
  for (let i = 0; i < 17 * 17; i++) {
    h = (h * 1103515245 + 12345) >>> 0;
    cells.push(((h >>> 15) & 1) === 1);
  }
  return (
    <div className="mx-auto mt-3 grid w-[176px] h-[176px] p-2 bg-app-surface border border-app-border" style={{ gridTemplateColumns: 'repeat(17,1fr)' }}>
      {cells.map((on, i) => (
        <span key={i} style={{ background: on ? '#8A8A88' : 'transparent' }} />
      ))}
    </div>
  );
}

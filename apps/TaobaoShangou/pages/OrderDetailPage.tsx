import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, EmptyState, fmtDate, fmtTime, showToast } from '../components/common';
import { MoreMenuSheet } from '../components/MoreMenuSheet';
import { RefundReasonSheet } from '../components/RefundReasonSheet';
import { PaySheet } from '../components/PaySheet';
import {
  IcBack, IcChat, IcClose, IcDown, IcEdit, IcMore, IcPlus, IcRight, IcService, IcShield, IcStar, IcTicket, IcUp,
} from '../res/icons';
import { ORDER_TICK } from '../constants';
import { fmt } from '../utils';
import { useStatusBarBg } from '../statusbar';

const hm = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

/** 订单详情状态机页(spec order.detail,证据 IMG_6055/6058/6059/6065/6075/6076/6079) */
export default function OrderDetailPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useTbsgGestures();
  const { orderId } = useParams<{ orderId: string }>();
  const [sp, setSp] = useSearchParams();
  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const addresses = useTbsgStore((st) => st.addresses);
  const currentAddressId = useTbsgStore((st) => st.currentAddressId);
  const user = useTbsgStore((st) => st.user);
  const payUnpaidOrder = useTbsgStore((st) => st.payUnpaidOrder);
  const reorderAction = useTbsgStore((st) => st.reorder);
  const setRefundDraft = useTbsgStore((st) => st.setRefundDraft);

  const [priceExpand, setPriceExpand] = useState(false);
  const [timelineExpand, setTimelineExpand] = useState(false);
  const [nowTs, setNowTs] = useState(() => TimeService.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(TimeService.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const order = orders.find((o) => o.id === orderId);
  const shop = shops.find((x) => x.id === order?.shopId);
  // 备餐/配送态顶部是地图(浅绿),其余态是浅灰;状态栏同色消除接缝
  useStatusBarBg(order?.status === 'preparing' || order?.status === 'delivering' ? '#E9EFE7' : '#F3F6F8');
  const recItems = useMemo(() => {
    const retailIds = new Set(shops.filter((x) => x.type === 'retail').map((x) => x.id));
    return items.filter((i) => retailIds.has(i.shopId)).slice(0, 4);
  }, [shops, items]);

  if (!order || !shop) {
    return (
      <div className="flex flex-col h-full bg-[#F3F6F8]">
        <div className="flex items-center h-11 px-2 shrink-0">
          <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcBack size={22} className="text-[#1A1A1A]" />
          </button>
        </div>
        <EmptyState text={s.emptyList} />
      </div>
    );
  }

  const panel = sp.get('panel');
  const addr = addresses.find((a) => a.id === order.addressId) ?? addresses.find((a) => a.id === currentAddressId) ?? addresses[0];
  const phoneMasked = addr ? `${addr.phone.slice(0, 3)}****${addr.phone.slice(7)}` : '';
  const addrText = addr ? `${addr.poi}${addr.detail} ${addr.name}(${addr.gender}) ${phoneMasked}` : '';
  const count = order.lines.reduce((a, l) => a + l.qty, 0);
  const grossTotal = order.totalPaid + order.totalDiscount;
  const deliveryOff = Math.max(0, order.deliveryFeeOrig - order.deliveryFee);

  /* ---------------- 复用小块 ---------------- */
  const opBtn = (key: string, icon: React.ReactNode, label: React.ReactNode, binding: React.HTMLAttributes<HTMLButtonElement>, highlight?: boolean) => (
    <button
      key={key}
      {...binding}
      className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer min-w-14"
    >
      <span className={highlight ? 'text-[#ED6C2C]' : 'text-[#1A1A1A]'}>{icon}</span>
      <span className={`text-[13px] ${highlight ? 'text-[#ED6C2C] font-semibold' : 'text-[#1A1A1A]'}`}>{label}</span>
    </button>
  );

  const refundReasonOpenBinding = bindTap<HTMLButtonElement>(
    { kind: 'action', id: 'order.refundReason.open' },
    {
      onTrigger: () => {
        setRefundDraft({ reason: '', subReason: null });
        setSp((p) => { p.set('panel', 'refund-reason'); return p; });
      },
    },
  );
  const reorderBinding = bindTap<HTMLButtonElement>('order.detail.reorder', {
    params: { shopId: shop.id },
    beforeTrigger: () => reorderAction(order.id),
  });
  const reviewBinding = bindTap<HTMLButtonElement>('order.detail.review-open', { params: { orderId: order.id } });
  const shopChatBinding = bindTap<HTMLButtonElement>('order.detail.shopchat-open', { params: { shopId: shop.id } });
  const riderChatBinding = bindTap<HTMLButtonElement>('order.detail.riderchat-open', { params: { orderId: order.id } });
  const surveyStubBinding = () => bindTap<HTMLButtonElement>(
    { kind: 'action', id: 'order.survey.stub' },
    { onTrigger: () => showToast(s.notOpen) },
  );
  const modifyStubBinding = () => bindTap<HTMLButtonElement>(
    { kind: 'action', id: 'order.modify.stub' },
    { onTrigger: () => showToast(s.notOpen) },
  );

  const refundCard = order.refund && (
    <div className="bg-white rounded-xl p-3.5 mt-2.5">
      <div className="flex items-center">
        <div className="flex-1 text-[16px] font-bold text-[#1A1A1A]">
          退回 ¥{fmt(order.refund.amount)}
          {order.refund.couponsBack > 0 && <span>+{order.refund.couponsBack}个红包</span>}
        </div>
        <button
          {...bindTap<HTMLButtonElement>('order.detail.refund-open', { params: { orderId: order.id } })}
          className="flex items-center text-[14px] text-[#ED6C2C] font-semibold bg-transparent border-none cursor-pointer"
        >
          {order.refund.status === 'done' ? '打款成功' : '退款处理中'}
          <IcRight size={14} />
        </button>
      </div>
      {order.refund.status === 'done' && (
        <div className="text-[12px] text-[#999999] mt-1.5 leading-5">
          「支付宝」已在「{fmtDate(order.refund.timeline[order.refund.timeline.length - 1]?.[1] ?? order.statusChangedAt)}」前将「¥{order.refund.amount.toFixed(2)}」入账至您的原支付账户
        </div>
      )}
    </div>
  );

  /* ---------------- 状态头部 ---------------- */
  let header: React.ReactNode = null;
  if (order.status === 'unpaid') {
    const remain = Math.max(0, order.statusChangedAt + ORDER_TICK.UNPAID_TIMEOUT - nowTs);
    const mm = String(Math.floor(remain / 60000)).padStart(2, '0');
    const ss = String(Math.floor((remain % 60000) / 1000)).padStart(2, '0');
    header = (
      <div className="px-4 pb-3">
        <div className="text-[26px] font-bold text-[#1A1A1A]">等待支付</div>
        <div className="text-[13px] text-[#999999] mt-1">剩余支付时间 {mm}:{ss}，超时订单将自动取消</div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'order.repay.open' }, { onTrigger: () => setSp((p) => { p.set('panel', 'pay'); return p; }) })}
          className="w-full h-11 mt-4 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
        >
          {s.goPay} ¥{fmt(order.totalPaid)}
        </button>
        <button
          {...bindTap<HTMLButtonElement>('order.unpaid.cancel', { params: { orderId: order.id } })}
          className="w-full h-11 mt-2.5 rounded-full bg-white text-[#1A1A1A] text-[15px] border border-[#EEEEEE] cursor-pointer"
        >
          {s.cancelOrder}
        </button>
      </div>
    );
  } else if (order.status === 'preparing' || order.status === 'delivering') {
    const preparing = order.status === 'preparing';
    const prepRemainMin = Math.max(1, Math.ceil((order.statusChangedAt + ORDER_TICK.PREPARING_TO_DELIVERING - nowTs) / 60000));
    const etaBase = preparing
      ? order.statusChangedAt + ORDER_TICK.PREPARING_TO_DELIVERING + ORDER_TICK.DELIVERING_TO_DELIVERED
      : order.statusChangedAt + ORDER_TICK.DELIVERING_TO_DELIVERED;
    header = (
      <div>
        {/* 地图区(css 纹理) */}
        <div className="relative h-52 -mt-11 overflow-hidden" style={{ background: 'linear-gradient(135deg,#E9EFE7 0%,#F2F4EF 45%,#E2EAE4 100%)' }}>
          <div className="absolute left-[-10%] right-[-10%] top-12 h-2.5 bg-white/70" style={{ transform: 'rotate(4deg)' }} />
          <div className="absolute left-[-10%] right-[-10%] top-28 h-1.5 bg-white/60" style={{ transform: 'rotate(-7deg)' }} />
          <div className="absolute top-[-10%] bottom-[-10%] left-14 w-2 bg-white/60" style={{ transform: 'rotate(14deg)' }} />
          <div className="absolute top-[-10%] bottom-[-10%] right-20 w-1.5 bg-white/50" style={{ transform: 'rotate(-10deg)' }} />
          <div className="absolute left-1/2 top-16 -translate-x-1/2 flex flex-col items-center">
            <div className="w-11 h-11 rounded-full bg-white p-0.5 shadow-md">
              <AppImg src={user.avatar} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="w-2.5 h-2.5 bg-white rotate-45 -mt-1.5 shadow-md" />
          </div>
        </div>
        {/* 状态卡 */}
        <div className="mx-3 -mt-10 relative bg-white rounded-xl p-3.5 shadow-sm">
          <div
            {...bindTap<HTMLDivElement>({ kind: 'action', id: 'order.status.expand' }, { onTrigger: () => setTimelineExpand((v) => !v) })}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <AppImg src={shop.logo} className="w-10 h-10 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center text-[17px] font-bold text-[#1A1A1A]">
                {preparing ? '正在召唤骑士' : '骑士正在配送'}
                <IcRight size={16} className="text-[#999999]" />
              </div>
              <div className="text-[13px] text-[#999999] mt-0.5">
                {preparing
                  ? <>商家正在备货，预计<span className="text-[#3CB268]">{prepRemainMin}分钟</span>完成备货</>
                  : `骑士${order.riderName ?? '小哥'}正在飞奔途中`}
              </div>
            </div>
          </div>
          {timelineExpand && (
            <div className="mt-3 pt-2 border-t border-[#EEEEEE]">
              {[...order.timeline].reverse().map(([txt, ts], i) => (
                <div key={i} className="flex items-center py-1.5">
                  <span className={`w-2 h-2 rounded-full mr-2.5 ${i === 0 ? 'bg-[#ED6C2C]' : 'bg-gray-300'}`} />
                  <span className={`flex-1 text-[13px] ${i === 0 ? 'text-[#1A1A1A] font-semibold' : 'text-[#999999]'}`}>{txt}</span>
                  <span className="text-[12px] text-[#999999]">{fmtTime(ts)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-3 rounded-lg bg-[#FDF6EF] px-2.5 py-2 flex items-center text-[12px] text-[#B26B3D]">
            <span className="flex-1">✅ 蜂鸟准时达·号码保护</span>
            <IcRight size={13} />
          </div>
          <div className="mt-3 text-[13px] text-[#999999]">
            预计 <span className="text-[24px] font-bold text-[#1A1A1A]">{hm(etaBase + 10 * 60000)}-{hm(etaBase + 25 * 60000)}</span>
          </div>
        </div>
        {/* 送至卡 + 三操作 */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl p-3.5">
          <div className="flex items-start">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#999999]">送至</div>
              <div className="text-[14px] text-[#1A1A1A] mt-0.5 leading-5">{addr ? `${addr.poi}${addr.detail}` : ''}</div>
              <div className="text-[13px] text-[#999999] mt-0.5">{addr ? `${addr.name}(${addr.gender}) ${phoneMasked}` : ''}</div>
            </div>
            <button {...modifyStubBinding()} className="flex items-center text-[13px] text-[#1A1A1A] bg-transparent border-none cursor-pointer shrink-0">
              修改<IcRight size={13} className="text-[#999999]" />
            </button>
          </div>
          <div className="flex justify-around mt-3.5 pt-3 border-t border-[#EEEEEE]">
            {opBtn('modify', <IcEdit size={20} className="text-[#ED6C2C]" />, '改订单信息', modifyStubBinding(), true)}
            {opBtn('shopchat', <IcChat size={20} />, s.contactShop, shopChatBinding)}
            {opBtn('cancel', <IcClose size={20} />, s.cancelOrder, bindTap<HTMLButtonElement>('order.cancel.confirm', { params: { orderId: order.id } }))}
          </div>
        </div>
      </div>
    );
  } else if (order.status === 'canceled') {
    header = (
      <div className="px-4 pb-1">
        <div
          {...bindTap<HTMLDivElement>({ kind: 'action', id: 'order.status.expand' }, { onTrigger: () => setTimelineExpand((v) => !v) })}
          className="flex items-center text-[26px] font-bold text-[#1A1A1A] cursor-pointer"
        >
          订单已取消<IcRight size={20} className="text-[#999999]" />
        </div>
        <div className="text-[14px] text-[#1A1A1A] mt-1.5">{order.cancelReason ?? '你取消了订单'}</div>
        {timelineExpand && (
          <div className="mt-2">
            {[...order.timeline].reverse().map(([txt, ts], i) => (
              <div key={i} className="flex items-center py-1 text-[12px] text-[#999999]">
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${i === 0 ? 'bg-[#ED6C2C]' : 'bg-gray-300'}`} />
                <span className="flex-1">{txt}</span>
                <span>{fmtTime(ts)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between mt-4 bg-white rounded-xl p-3">
          {opBtn('aftersale', <IcStar size={20} />, '售后评价', surveyStubBinding())}
          {opBtn('similar', <IcRight size={20} />, '相似好店', bindTap<HTMLButtonElement>('order.similar-open'))}
          {opBtn('reorder', <IcPlus size={20} className="text-[#ED6C2C]" />, s.reorder, reorderBinding, true)}
          {opBtn('shopchat', <IcChat size={20} />, s.contactShop, shopChatBinding)}
          {opBtn('survey', <IcEdit size={20} />, '问卷调查', surveyStubBinding())}
        </div>
        {refundCard}
      </div>
    );
  } else {
    // delivered / refunding / refunded
    const title = order.status === 'delivered' ? '订单已送达' : order.status === 'refunding' ? '退款处理中' : '退款成功';
    header = (
      <div className="px-4 pb-1">
        <div
          {...bindTap<HTMLDivElement>({ kind: 'action', id: 'order.status.expand' }, { onTrigger: () => setTimelineExpand((v) => !v) })}
          className="flex items-center text-[26px] font-bold text-[#1A1A1A] cursor-pointer"
        >
          {title}<IcRight size={20} className="text-[#999999]" />
        </div>
        {timelineExpand && (
          <div className="mt-2">
            {[...order.timeline].reverse().map(([txt, ts], i) => (
              <div key={i} className="flex items-center py-1 text-[12px] text-[#999999]">
                <span className={`w-1.5 h-1.5 rounded-full mr-2 ${i === 0 ? 'bg-[#ED6C2C]' : 'bg-gray-300'}`} />
                <span className="flex-1">{txt}</span>
                <span>{fmtTime(ts)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="text-[13px] text-[#999999] mt-1.5 truncate">送至 {addrText}</div>
        <div className="flex justify-between mt-4 bg-white rounded-xl p-3">
          {order.status === 'delivered' && opBtn('refund', <IcTicket size={20} />, s.applyRefund, refundReasonOpenBinding)}
          {opBtn('reorder', <IcPlus size={20} className="text-[#ED6C2C]" />, s.reorder, reorderBinding, true)}
          {order.reviewed
            ? opBtn('reviewed', <IcStar size={20} className="text-[#999999]" />, <span className="text-[#999999]">已评价</span>, {})
            : opBtn('review', <IcStar size={20} />, s.reviewBtn, reviewBinding)}
          {opBtn('shopchat', <IcChat size={20} />, s.contactShop, shopChatBinding)}
          {opBtn('riderchat', <IcChat size={20} />, s.contactRider, riderChatBinding)}
        </div>
        {order.status === 'delivered' && !order.reviewed && (
          <div
            {...bindTap<HTMLDivElement>('order.detail.review-open', { params: { orderId: order.id } })}
            className="mt-2.5 bg-white rounded-xl px-3.5 py-3 flex items-center cursor-pointer"
          >
            <span className="text-[14px] text-[#1A1A1A]">🫘 评价得<span className="text-[#ED6C2C] font-semibold">20吃货豆</span></span>
            <div className="flex-1" />
            <span className="flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => <IcStar key={i} size={18} className="text-gray-300" />)}
            </span>
          </div>
        )}
        {(order.status === 'refunding' || order.status === 'refunded') && refundCard}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      {/* 顶栏 */}
      <div className="flex items-center h-11 px-2 shrink-0 relative z-10">
        <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcBack size={22} className="text-[#1A1A1A]" />
        </button>
        <div className="flex-1" />
        <button
          {...bindTap<HTMLButtonElement>('order.detail.agent-open', { params: { orderId: order.id } })}
          className="flex flex-col items-center bg-white rounded-lg px-1.5 py-0.5 border-none cursor-pointer"
          aria-label="专属管家"
        >
          <IcService size={17} className="text-[#1A1A1A]" />
          <span className="text-[9px] text-[#1A1A1A]">专属管家</span>
        </button>
        <button
          onClick={() => setSp((p) => { p.set('panel', 'more'); return p; })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="更多"
        >
          <IcMore size={20} className="text-[#1A1A1A]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {header}

        {/* ---------- 公共区:店铺卡+商品明细 ---------- */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl p-3.5">
          <div
            {...bindTap<HTMLDivElement>('order.detail.shop-open', { params: { shopId: shop.id } })}
            className="flex items-center cursor-pointer"
          >
            <span className="text-[13px] font-bold text-[#ED6C2C] italic mr-1.5">闪购</span>
            <span className="text-[16px] font-bold text-[#1A1A1A] truncate">{shop.fullName}</span>
            <IcRight size={15} className="text-[#999999] shrink-0" />
            <div className="flex-1" />
            <span className="text-[11px] text-[#ED6C2C] border border-[#F0C9AC] rounded px-1.5 py-px shrink-0">蜂鸟准时达</span>
          </div>

          {order.lines.map((l, i) => (
            <div key={i} className="flex items-center mt-3">
              <AppImg src={l.image} className="w-14 h-14 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0 px-2.5">
                <div className="text-[14px] text-[#1A1A1A] truncate">{l.name}</div>
                {l.skuDesc && <div className="text-[12px] text-[#999999] mt-0.5 truncate">{l.skuDesc}</div>}
                <div className="text-[12px] text-[#999999] mt-0.5">× {l.qty}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] text-[#1A1A1A]">实付 <span className="font-semibold">¥{fmt(l.price)}</span></div>
                {l.origPrice > l.price && <div className="text-[12px] text-[#999999] line-through mt-0.5">¥{fmt(l.origPrice)}</div>}
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between mt-3.5 text-[14px] text-[#1A1A1A]">
            <span>打包费</span><span>¥{fmt(order.packFee)}</span>
          </div>
          <div className="flex items-center justify-between mt-2.5 text-[14px] text-[#1A1A1A]">
            <span>配送费</span>
            <span>
              实付 <span className="font-semibold">¥{fmt(order.deliveryFee)}</span>
              {order.deliveryFeeOrig > order.deliveryFee && (
                <span className="text-[12px] text-[#999999] line-through ml-1">¥{fmt(order.deliveryFeeOrig)}</span>
              )}
            </span>
          </div>

          {/* 价格明细 */}
          <div
            {...bindTap<HTMLDivElement>({ kind: 'action', id: 'order.detail.price.expand' }, { onTrigger: () => setPriceExpand((v) => !v) })}
            className="flex items-center mt-3.5 pt-3 border-t border-[#EEEEEE] cursor-pointer"
          >
            <span className="text-[16px] font-bold text-[#1A1A1A]">价格明细</span>
            {priceExpand ? <IcUp size={15} className="text-[#999999] ml-1" /> : <IcDown size={15} className="text-[#999999] ml-1" />}
            <div className="flex-1" />
            <span className="text-[14px] text-[#F53F3F]">总优惠¥{fmt(order.totalDiscount)}</span>
            <span className="text-[14px] text-[#1A1A1A] ml-2">实付<span className="text-[17px] font-bold">¥{fmt(order.totalPaid)}</span></span>
          </div>
          {priceExpand && (
            <div className="mt-2.5 rounded-lg bg-[#F7F8FA] p-3 text-[13px]">
              <div className="flex justify-between text-[#1A1A1A]"><span>总价</span><span>¥{fmt(grossTotal)}</span></div>
              {deliveryOff > 0 && (
                <div className="flex justify-between mt-2 text-[#1A1A1A]"><span>配送费优惠</span><span className="text-[#F53F3F]">-¥{fmt(deliveryOff)}</span></div>
              )}
              <div className="flex justify-between mt-2 text-[#1A1A1A]"><span>红包/抵用券</span><span className="text-[#F53F3F]">-¥{fmt(order.couponDiscount)}</span></div>
            </div>
          )}
        </div>

        {/* ---------- 发票/订单号/备注 ---------- */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl px-3.5 py-1">
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'order.detail.invoice.stub' }, { onTrigger: () => showToast(s.notOpen) })}
            className="w-full flex items-center py-3 bg-transparent border-none cursor-pointer"
          >
            <span className="text-[14px] text-[#1A1A1A]">发票</span>
            <div className="flex-1" />
            <span className="text-[14px] text-[#999999]">未添加开票信息</span>
            <IcRight size={14} className="text-[#999999]" />
          </button>
          <div className="h-px bg-[#EEEEEE]" />
          <div className="flex items-center py-3">
            <span className="text-[14px] text-[#1A1A1A]">订单号</span>
            <div className="flex-1" />
            <span className="text-[14px] text-[#1A1A1A]">{order.id}</span>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'order.detail.copyid' }, { onTrigger: () => showToast(s.copied) })}
              className="text-[14px] text-[#999999] bg-transparent border-none cursor-pointer pl-2 border-l border-[#EEEEEE] ml-2"
            >
              复制
            </button>
          </div>
          {order.remark && (
            <>
              <div className="h-px bg-[#EEEEEE]" />
              <div className="flex items-center py-3">
                <span className="text-[14px] text-[#1A1A1A]">备注</span>
                <div className="flex-1" />
                <span className="text-[14px] text-[#999999] truncate max-w-[60%]">{order.remark}</span>
              </div>
            </>
          )}
          {order.tableware && (
            <>
              <div className="h-px bg-[#EEEEEE]" />
              <div className="flex items-center py-3">
                <span className="text-[14px] text-[#1A1A1A]">餐具</span>
                <div className="flex-1" />
                <span className="text-[14px] text-[#999999]">{order.tableware}</span>
              </div>
            </>
          )}
        </div>

        {/* ---------- 安心权益 ---------- */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl p-3.5">
          <div className="flex items-center">
            <span className="text-[16px] font-bold text-[#1A1A1A]">安心权益</span>
            <span className="ml-2 text-[11px] text-[#6B4FBB] bg-[#EFEAFB] rounded px-1.5 py-px">悦享会员</span>
            <span className="ml-2 text-[13px] text-[#999999]">5项服务保障中</span>
          </div>
          <div className="flex gap-2 mt-2.5">
            <div className="flex-1 rounded-lg bg-[#F7F8FA] p-2.5">
              <div className="flex items-center text-[14px] font-semibold text-[#1A1A1A]"><IcShield size={14} className="mr-1 text-[#3CB268]" />食无忧</div>
              <div className="text-[11px] text-[#999999] mt-1 leading-4">如有异物变质或引起就医，可申请理赔</div>
            </div>
            <div className="flex-1 rounded-lg bg-[#F7F8FA] p-2.5">
              <div className="text-[14px] font-semibold text-[#3CB268]">超1分钟赔 <span className="text-[#1A1A1A]">商家赠送</span></div>
              <div className="text-[11px] text-[#999999] mt-1 leading-4">订单已准时送达，服务保障已结束</div>
            </div>
          </div>
        </div>

        {/* ---------- 常见问题 ---------- */}
        <div className="mx-3 mt-2.5 bg-white rounded-xl p-3.5">
          <div className="text-[16px] font-bold text-[#1A1A1A]">常见问题</div>
          <div className="flex gap-2 mt-2.5">
            {['未收到商品', '少送商品', '餐品撒漏'].map((q) => (
              <button
                key={q}
                {...bindTap<HTMLButtonElement>('order.detail.service-open', { params: { orderId: order.id } })}
                className="h-9 px-3.5 rounded-lg bg-[#F5F6F7] text-[13px] text-[#1A1A1A] border-none cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* ---------- 为你推荐 ---------- */}
        <div className="mx-3 mt-3">
          <div className="text-center text-[15px] font-semibold text-[#1A1A1A] mb-2.5">— 为你推荐 —</div>
          <div className="grid grid-cols-2 gap-2.5">
            {recItems.map((it) => (
              <div
                key={it.id}
                {...bindTap<HTMLDivElement>('order.detail.rec-open', { params: { shopId: it.shopId } })}
                className="bg-white rounded-xl overflow-hidden cursor-pointer"
              >
                <AppImg src={it.image} className="w-full h-32 object-cover" />
                <div className="p-2">
                  <div className="text-[13px] text-[#1A1A1A] leading-4 line-clamp-2">{it.name}</div>
                  <div className="text-[11px] text-[#999999] mt-1">月售{it.monthlySales}</div>
                  <div className="mt-1 text-[#F53F3F] font-bold text-[15px]">¥{fmt(it.price)}<span className="text-[11px] font-normal">起</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- 弹层 ---------- */}
      {panel === 'refund-reason' && <RefundReasonSheet order={order} shop={shop} />}
      {panel === 'pay' && order.status === 'unpaid' && (
        <PaySheet
          amount={order.totalPaid}
          payBinding={bindTap<HTMLButtonElement>('checkout.pay.success', {
            params: { orderId: order.id },
            beforeTrigger: () => payUnpaidOrder(order.id),
          })}
          closeBinding={bindBack<HTMLButtonElement>()}
        />
      )}
      {panel === 'more' && <MoreMenuSheet />}
    </div>
  );
}

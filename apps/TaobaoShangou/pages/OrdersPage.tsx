import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, EmptyState, Sheet, showToast } from '../components/common';
import { MoreMenuSheet } from '../components/MoreMenuSheet';
import { IcBack, IcMore, IcRight, IcSearch } from '../res/icons';
import { fmt } from '../utils';
import type { OrderStatus, TbOrder } from '../types';

const STATUS_TEXT: Record<OrderStatus, string> = {
  unpaid: '待支付',
  preparing: '商家接单中',
  delivering: '配送中',
  delivered: '已送达',
  canceled: '已取消',
  refunding: '退款中',
  refunded: '退款成功',
};

/** 我的订单列表(spec order.list,证据 IMG_6033/6062) */
export default function OrdersPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack, back } = useTbsgGestures();
  const [sp, setSp] = useSearchParams();
  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const monthSpend = useTbsgStore((st) => st.monthSpend);
  const claimOrderBeans = useTbsgStore((st) => st.claimOrderBeans);
  const reorderAction = useTbsgStore((st) => st.reorder);
  const [query, setQuery] = useState('');

  const tab = sp.get('tab') ?? 'all';
  const panel = sp.get('panel');
  const moreOrderId = sp.get('order');

  const tabs = [
    { id: 'all', label: s.orderTabAll },
    { id: 'pending', label: s.orderTabPending },
    { id: 'review', label: s.orderTabReview },
    { id: 'refund', label: s.orderTabRefund },
  ];

  const matchTab = (o: TbOrder): boolean => {
    if (tab === 'pending') return ['unpaid', 'preparing', 'delivering'].includes(o.status);
    if (tab === 'review') return o.status === 'delivered' && !o.reviewed;
    if (tab === 'refund') return o.status === 'refunding' || o.status === 'refunded' || (o.status === 'canceled' && !!o.refund);
    return true;
  };
  const matchQuery = (o: TbOrder): boolean => {
    const w = query.trim();
    if (!w) return true;
    const shop = shops.find((x) => x.id === o.shopId);
    return (shop?.fullName ?? '').includes(w) || o.lines.some((l) => l.name.includes(w));
  };
  const list = orders.filter((o) => matchTab(o) && matchQuery(o));

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      {/* 顶栏:返回 + 搜订单 + ... */}
      <div className="flex items-center h-12 px-2 gap-1 shrink-0 bg-[#F3F6F8]">
        <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
          <IcBack size={22} className="text-[#1A1A1A]" />
        </button>
        <div className="flex-1 h-9 rounded-lg bg-white flex items-center px-3 gap-2">
          <IcSearch size={16} className="text-[#999999] shrink-0" />
          <input
            {...bindTap<HTMLInputElement>({ kind: 'action', id: 'order.list.search' }, { onTrigger: () => {} })}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜订单"
            className="flex-1 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
          />
        </div>
        <button
          onClick={() => setSp((p) => { p.set('panel', 'more'); return p; })}
          className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
          aria-label="更多"
        >
          <IcMore size={20} className="text-[#1A1A1A]" />
        </button>
      </div>

      {/* tab 行 */}
      <div className="flex items-center px-2 shrink-0 bg-[#F3F6F8]">
        {tabs.map((t) => (
          <button
            key={t.id}
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'order.list.tab.select' },
              {
                params: { tab: t.id },
                onTrigger: () => setSp((p) => { p.set('tab', t.id); return p; }, { replace: true }),
              },
            )}
            className={`flex-1 h-10 text-center bg-transparent border-none cursor-pointer ${
              tab === t.id ? 'text-[#ED6C2C] text-[16px] font-bold' : 'text-[#1A1A1A] text-[15px]'
            }`}
          >
            {t.label}
            {tab === t.id && <div className="w-5 h-[3px] bg-[#ED6C2C] rounded-full mx-auto mt-0.5" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 月度统计 */}
        <div className="py-2.5 text-[13px] text-[#999999]">
          <span className="text-[15px] font-semibold text-[#1A1A1A] mr-2">{monthSpend.month}</span>
          支出¥<span className="text-[15px] font-semibold text-[#1A1A1A]">{fmt(monthSpend.amount)}</span>
        </div>

        {list.length === 0 && <EmptyState text={s.orderEmpty} />}

        {list.map((o) => {
          const shop = shops.find((x) => x.id === o.shopId);
          const count = o.lines.reduce((a, l) => a + l.qty, 0);
          const hasRefundEntry = o.status === 'refunding' || o.status === 'refunded' || (o.status === 'canceled' && !!o.refund);
          return (
            <div
              key={o.id}
              {...bindTap<HTMLDivElement>('order.list.detail-open', { params: { orderId: o.id } })}
              className="bg-white rounded-xl p-3 mb-2.5 cursor-pointer"
            >
              {/* 头行 */}
              <div className="flex items-center gap-2">
                <AppImg src={shop?.logo ?? ''} className="w-9 h-9 rounded-lg object-cover shrink-0" />
                <div
                  {...bindTap<HTMLDivElement>('order.list.shop-open', { params: { shopId: o.shopId }, stopPropagation: true })}
                  className="flex items-center min-w-0 cursor-pointer"
                >
                  <span className="text-[15px] font-semibold text-[#1A1A1A] truncate">{shop?.fullName ?? ''}</span>
                  <IcRight size={14} className="text-[#999999] shrink-0" />
                </div>
                <div className="flex-1" />
                <span className={`text-[13px] shrink-0 ${o.status === 'unpaid' ? 'text-[#ED6C2C]' : 'text-[#999999]'}`}>
                  {STATUS_TEXT[o.status]}
                </span>
              </div>

              {/* 促销标签行 */}
              {shop && (
                <div className="flex gap-1.5 mt-1.5 ml-11">
                  <span className="text-[10px] text-[#EB493B] border border-[#F5B7B1] rounded px-1 py-px">{shop.shopCoupon.amount}元</span>
                  {shop.promos.slice(0, 1).map((p, i) => (
                    <span key={i} className="text-[10px] text-[#EB493B] border border-[#F5B7B1] rounded px-1 py-px">{p.full}减{p.off}</span>
                  ))}
                  {shop.features.slice(0, 1).map((f) => (
                    <span key={f} className="text-[10px] text-[#999999] border border-[#EEEEEE] rounded px-1 py-px">{f}</span>
                  ))}
                </div>
              )}

              {/* 商品行 */}
              <div className="flex items-center mt-2.5">
                {o.lines.length === 1 ? (
                  <>
                    <AppImg src={o.lines[0].image} className="w-[72px] h-[72px] rounded-lg object-cover shrink-0" />
                    <div className="flex-1 min-w-0 px-2.5">
                      <div className="text-[14px] text-[#1A1A1A] truncate">{o.lines[0].name}</div>
                      {o.lines[0].skuDesc && <div className="text-[12px] text-[#999999] mt-0.5 truncate">{o.lines[0].skuDesc}</div>}
                      {o.status === 'delivered' && (
                        <div className="text-[12px] text-[#3CB268] mt-1">食品安全理赔 慢必赔</div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex gap-2 min-w-0">
                    {o.lines.slice(0, 2).map((l, i) => (
                      <AppImg key={i} src={l.image} className="w-[72px] h-[72px] rounded-lg object-cover shrink-0" />
                    ))}
                    {o.lines.length > 2 && (
                      <div className="w-[72px] h-[72px] rounded-lg bg-gray-50 flex items-center justify-center text-[12px] text-[#999999] shrink-0">
                        共{count}件
                      </div>
                    )}
                  </div>
                )}
                <div className="text-right shrink-0 pl-2">
                  <div className="text-[16px] font-bold text-[#1A1A1A]">¥{fmt(o.totalPaid)}</div>
                  <div className="text-[12px] text-[#999999] mt-0.5">共{count}件</div>
                </div>
              </div>
              {o.status === 'delivered' && o.lines.length > 1 && (
                <div className="text-[12px] text-[#3CB268] mt-1.5">食品安全理赔 慢必赔</div>
              )}

              {/* 操作按钮行 */}
              <div className="flex items-center mt-3 gap-2">
                {o.status === 'delivered' && (
                  <button
                    {...bindTap<HTMLButtonElement>(
                      { kind: 'action', id: 'order.list.more' },
                      {
                        params: { orderId: o.id },
                        stopPropagation: true,
                        onTrigger: () => setSp((p) => { p.set('panel', 'ordermore'); p.set('order', o.id); return p; }),
                      },
                    )}
                    className="text-[13px] text-[#999999] bg-transparent border-none cursor-pointer px-1"
                  >
                    更多
                  </button>
                )}
                <div className="flex-1" />
                {o.status === 'delivered' && !o.beansClaimed && (
                  <button
                    {...bindTap<HTMLButtonElement>(
                      { kind: 'action', id: 'order.list.beans.claim' },
                      { params: { orderId: o.id }, stopPropagation: true, onTrigger: () => claimOrderBeans(o.id) },
                    )}
                    className="h-8 px-3 rounded-full bg-[#F5F6F7] text-[13px] text-[#1A1A1A] border-none cursor-pointer"
                  >
                    🫘 领110豆
                  </button>
                )}
                {o.status === 'delivered' && !o.reviewed && (
                  <button
                    {...bindTap<HTMLButtonElement>('order.list.review-open', { params: { orderId: o.id }, stopPropagation: true })}
                    className="h-8 px-4 rounded-full bg-[#FDEFE4] text-[13px] text-[#ED6C2C] border-none cursor-pointer"
                  >
                    {s.reviewBtn}
                  </button>
                )}
                {hasRefundEntry && (
                  <button
                    {...bindTap<HTMLButtonElement>('order.list.refund-open', { params: { orderId: o.id }, stopPropagation: true })}
                    className="h-8 px-3.5 rounded-full bg-[#FDEFE4] text-[13px] text-[#ED6C2C] border-none cursor-pointer"
                  >
                    {s.refundProgress}
                  </button>
                )}
                {o.status === 'unpaid' ? (
                  <button
                    {...bindTap<HTMLButtonElement>('order.list.detail-open', { params: { orderId: o.id }, stopPropagation: true })}
                    className="h-8 px-4 rounded-full bg-[#ED6C2C] text-[13px] text-white border-none cursor-pointer"
                  >
                    {s.goPay}
                  </button>
                ) : (
                  <button
                    {...bindTap<HTMLButtonElement>('order.list.reorder', {
                      params: { shopId: o.shopId },
                      stopPropagation: true,
                      beforeTrigger: () => reorderAction(o.id),
                    })}
                    className="h-8 px-3.5 rounded-full bg-[#ED6C2C] text-[13px] text-white border-none cursor-pointer"
                  >
                    {s.reorder}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 订单「更多」小面板(qa:Q5) */}
      {panel === 'ordermore' && (
        <Sheet maxH="40%">
          <div className="p-4">
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'order.list.invoice.stub' }, { onTrigger: () => showToast(s.notOpen) })}
              className="w-full h-12 text-[15px] text-[#1A1A1A] bg-transparent border-none border-b cursor-pointer"
            >
              开发票
            </button>
            <div className="h-px bg-[#EEEEEE]" />
            <div className="w-full h-12 flex items-center justify-center text-[15px] text-[#999999]">
              订单评价{moreOrderId ? '：请在订单卡片上点击「评价」' : ''}
            </div>
            <button
              {...bindBack<HTMLButtonElement>()}
              className="w-full h-11 mt-1 rounded-full bg-gray-100 text-[15px] text-[#1A1A1A] border-none cursor-pointer"
            >
              {s.cancel}
            </button>
          </div>
        </Sheet>
      )}

      {/* 全局...面板 */}
      {panel === 'more' && <MoreMenuSheet />}
    </div>
  );
}

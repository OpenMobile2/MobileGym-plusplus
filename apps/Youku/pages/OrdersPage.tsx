import React, { useState } from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { WONTFIX_TOAST } from '../constants';
import { IcBack, EmptyBox, fmtYmd, fmtYmdHms } from './me/meShared';

/**
 * spec 节点 me.orders(route /me/orders)—— 我的订单(s249,审核拍板:去掉顶部胶囊做普通全屏页)。
 * 三tab:我的订单 / 我的影片(空态)/ 开发票(wontfix);列表展示 ordersShown 条 + 点击加载更多。
 */
export default function OrdersPage() {
  const { action, bindBack } = useYoukuGestures();
  const orders = useYoukuStore((s) => s.orders);
  const ordersShown = useYoukuStore((s) => s.ordersShown);
  const loadMoreOrders = useYoukuStore((s) => s.loadMoreOrders);
  const showToast = useYoukuStore((s) => s.showToast);

  const [tab, setTab] = useState<'orders' | 'films'>('orders');
  const shown = orders.slice(0, ordersShown);
  const hasMore = ordersShown < orders.length;

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏:返回 + tab(我的订单/我的影片/开发票) */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <div className="flex flex-1 items-baseline gap-6 pl-2">
          <button
            {...action('me.orders.tab.select.orders', () => setTab('orders'))}
            className="relative cursor-pointer border-none bg-transparent p-0"
          >
            <span className={tab === 'orders' ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[17px] text-[#8A8A8A]'}>我的订单</span>
            {tab === 'orders' && <span className="absolute -bottom-1.5 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-[#4D9BF0]" />}
          </button>
          <button
            {...action('me.orders.tab.select.films', () => setTab('films'))}
            className="relative cursor-pointer border-none bg-transparent p-0"
          >
            <span className={tab === 'films' ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[17px] text-[#8A8A8A]'}>我的影片</span>
            {tab === 'films' && <span className="absolute -bottom-1.5 left-1/2 h-1 w-5 -translate-x-1/2 rounded-full bg-[#4D9BF0]" />}
          </button>
        </div>
        <button
          {...action('me.orders.invoice.wontfixToast', () => showToast(WONTFIX_TOAST))}
          className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[17px] text-(--app-c-text-primary)"
        >
          开发票
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {tab === 'films' && <EmptyBox text="暂时没有影片" />}
        {tab === 'orders' && (
          <>
            {shown.map((o) => (
              <div
                key={o.id}
                {...action('me.orders.detail.wontfixToast', () => showToast(WONTFIX_TOAST))}
                className="mx-3 mt-3 cursor-pointer rounded-2xl bg-(--app-c-card-bg) px-4 py-3.5"
              >
                <div className="flex items-center">
                  <span className="text-[15px] text-[#CCCCCC]">{fmtYmd(o.ts)}</span>
                  <span className="ml-auto text-[15px] font-medium text-[#FF6000]">{o.status}</span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  {/* 金色钻石商品图 */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg,#4A3A1E,#2A2010)' }}
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden>
                      <path d="M4 8 7 4h10l3 4-8 12z" fill="#F5C542" stroke="#B8871E" strokeWidth="1" />
                      <path d="M4 8h16M9 8l3 12 3-12M7 4l2 4M17 4l-2 4" stroke="#B8871E" strokeWidth="0.8" fill="none" />
                    </svg>
                  </div>
                  <span className="min-w-0 flex-1 truncate text-[16px] font-medium">{o.title}</span>
                  <span className="shrink-0 text-[16px] font-medium">{o.priceText}</span>
                </div>
                <div className="mt-3 flex items-center text-[13px] text-[#999999]">
                  <span>支付时间: {fmtYmdHms(o.ts)}</span>
                  <span className="ml-auto">
                    实付款: <span className="text-[18px] font-bold text-(--app-c-text-primary)">{o.paidText.replace('.00', '')}</span>
                  </span>
                </div>
              </div>
            ))}
            {hasMore ? (
              <button
                {...action('me.orders.list.loadMore', loadMoreOrders)}
                className="mx-auto mt-5 block cursor-pointer border-none bg-transparent text-[14px] text-[#999999]"
              >
                点击加载更多
              </button>
            ) : (
              <div className="mt-5 text-center text-[14px] text-[#666666]">没有更多了</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, PriceYuan, EmptyState, showToast, wontfix } from '../components/ui';
import { IcNavBack, IcSearch, IcGift, IcFilter, IcChevronRight, IcCheck } from '../res/icons';
import type { Order, OrderChannel } from '../types';

const CHANNELS: { id: 'all' | OrderChannel; label: string; badge?: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'shopping', label: '购物' },
  { id: 'miaosong', label: '秒送', badge: '外卖' },
  { id: 'service', label: '服务' },
];

/** 状态 chips:横向滑动展示全部,不靠筛选按钮扩充 */
const STATUS_CHIPS: { id: string; label: string }[] = [
  { id: 'unpaid', label: '待付款' },
  { id: 'undelivered', label: '待收货' },
  { id: 'unused', label: '待使用' },
  { id: 'done', label: '已完成' },
  { id: 'review', label: '待评价' },
  { id: 'refunding', label: '退款中' },
  { id: 'cancelled', label: '已取消' },
];

const TIME_OPTIONS: { id: string; label: string; days?: number }[] = [
  { id: '3m', label: '近三个月', days: 90 },
  { id: '6m', label: '近六个月', days: 180 },
  { id: '1y', label: '近一年', days: 365 },
  { id: '2y', label: '近两年', days: 730 },
  { id: 'all', label: '全部时间' },
];

const STATUS_TEXT: Record<string, string> = {
  unpaid: '等待付款',
  undelivered: '付款成功',
  unused: '待使用',
  done: '交易完成',
  refunding: '退款中',
  refunded: '退款成功',
  cancelled: '已取消',
};

const btnGhost = 'h-7 px-2.5 rounded-full border border-[#DDD] text-[12px] text-[#555] whitespace-nowrap shrink-0';
const btnPrimary = 'h-7 px-2.5 rounded-full bg-[#E1251B] text-[12px] text-white whitespace-nowrap shrink-0';

export function OrdersPage() {
  const { bindTap, bindBack, back } = useJingdongGestures();
  const orders = useJingdongStore((s) => s.orders);
  const [searchParams, setSearchParams] = useSearchParams();
  const status = searchParams.get('status') || '';
  const view = searchParams.get('view');
  const [channel, setChannel] = useState<'all' | OrderChannel>('all');
  const [giftOnly, setGiftOnly] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [draftTime, setDraftTime] = useState('all');
  const [q, setQ] = useState('');

  const setStatus = (next: string) => {
    // replace:切换状态不压历史,返回直接回「我的」
    setSearchParams((p) => {
      if (p.get('status') === next) p.delete('status');
      else p.set('status', next);
      p.delete('view');
      return p;
    }, { replace: true });
  };

  const openFilter = () => {
    setDraftTime(timeRange);
    setSearchParams((p) => {
      p.set('view', 'filterDrawer');
      return p;
    });
  };

  const applyFilter = () => {
    setTimeRange(draftTime);
    back();
  };

  const resetFilter = () => setDraftTime('all');

  const kw = q.trim().toLowerCase();
  const list = useMemo(() => {
    const now = TimeService.now();
    const opt = TIME_OPTIONS.find((t) => t.id === timeRange);
    const minTs = opt?.days != null ? now - opt.days * 24 * 60 * 60 * 1000 : 0;

    return orders.filter((o) => {
      if (channel !== 'all' && o.channel !== channel) return false;
      if (status === 'review') {
        if (!(o.status === 'done' && !o.reviewed)) return false;
      } else if (status && o.status !== status) {
        return false;
      }
      if (giftOnly && !(o.payMethod.includes('礼') || o.shopName.includes('礼'))) return false;
      if (minTs > 0 && o.createdAt < minTs) return false;
      if (
        kw &&
        !(
          o.shopName.toLowerCase().includes(kw) ||
          o.orderNo.toLowerCase().includes(kw) ||
          o.lines.some((l) => l.title.toLowerCase().includes(kw))
        )
      ) {
        return false;
      }
      return true;
    });
  }, [orders, channel, status, giftOnly, kw, timeRange]);

  const timeLabel = TIME_OPTIONS.find((t) => t.id === timeRange)?.label ?? '全部时间';
  const filterActive = timeRange !== 'all';

  return (
    <div className="relative flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      {/* 顶部搜索栏 */}
      <div className="shrink-0 pt-10 px-2 pb-1 flex items-center gap-2 bg-[#F5F5F5]">
        <button
          {...bindTap('orders.back-to-mine')}
          aria-label="返回"
          data-trigger-type="back"
          className="w-8 h-9 flex items-center justify-center"
        >
          <IcNavBack size={24} className="text-[#333]" />
        </button>
        <div className="flex-1 h-9 rounded-full bg-white flex items-center px-3 gap-1.5">
          <IcSearch size={16} className="text-[#BBB] shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索我的订单"
            data-action="orders.search.input"
            className="flex-1 min-w-0 bg-transparent text-[13px] text-[#1A1A1A] placeholder:text-[#BBB] outline-none"
          />
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'orders.gift.toggle' }, {
            onTrigger: () => {
              setGiftOnly((v) => !v);
              showToast(giftOnly ? '已取消礼物订单筛选' : '已筛选礼物相关订单');
            },
          })}
          aria-label="礼物订单"
          className={`w-9 h-9 flex items-center justify-center ${giftOnly ? 'text-[#E1251B]' : 'text-[#333]'}`}
        >
          <IcGift size={22} />
        </button>
      </div>

      {/* 渠道 tab */}
      <div className="shrink-0 flex items-center px-4 gap-6 bg-[#F5F5F5] pt-1">
        {CHANNELS.map((c) => {
          const active = channel === c.id;
          return (
            <button
              key={c.id}
              {...bindTap({ kind: 'action', id: 'orders.channel.select.type' }, { onTrigger: () => setChannel(c.id) })}
              className="relative py-2 flex items-center gap-1"
            >
              <span className={`text-[16px] ${active ? 'text-[#E1251B] font-bold' : 'text-[#333]'}`}>{c.label}</span>
              {c.badge && <span className="text-[9px] text-[#E1251B] bg-[#FDE9C8] rounded px-1 leading-[14px]">{c.badge}</span>}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-5 h-[3px] rounded bg-[#E1251B]" />}
            </button>
          );
        })}
      </div>

      {/* 状态 chips:左右滑动 + 右侧筛选入口 */}
      <div className="shrink-0 flex items-center bg-[#F5F5F5] py-2">
        <div
          className="flex-1 min-w-0 overflow-x-auto no-scrollbar"
          data-scroll-container="orders-status"
          data-scroll-direction="horizontal"
        >
          <div className="flex items-center gap-2 px-3 w-max">
            {STATUS_CHIPS.map((c) => {
              const active = status === c.id;
              return (
                <button
                  key={c.id}
                  {...bindTap({ kind: 'action', id: 'orders.status.select.state' }, {
                    params: { status: c.id },
                    onTrigger: () => setStatus(c.id),
                  })}
                  className={`shrink-0 h-8 px-3.5 rounded-full flex items-center justify-center gap-1 text-[13px] whitespace-nowrap ${
                    active ? 'bg-white text-[#E1251B] border border-[#E1251B]' : 'bg-white text-[#555]'
                  }`}
                >
                  {c.label}{active && <span className="text-[11px]">✕</span>}
                </button>
              );
            })}
          </div>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'orders.filter.show' }, { onTrigger: openFilter })}
          className={`shrink-0 flex flex-col items-center px-2.5 ${filterActive || view === 'filterDrawer' ? 'text-[#E1251B]' : 'text-[#888]'}`}
          aria-label="筛选"
        >
          <IcFilter size={16} />
          <span className="text-[10px]">筛选</span>
        </button>
      </div>

      {filterActive && (
        <div className="shrink-0 px-3 pb-1 text-[12px] text-[#888]">
          已按{timeLabel}筛选
        </div>
      )}

      {/* 订单列表 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="orders-list" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text="您还没有相关订单" />
        ) : (
          <div className="flex flex-col gap-2.5 px-3 py-2.5">
            {list.map((o) => (
              <OrderCard key={o.id} order={o} bindTap={bindTap} />
            ))}
          </div>
        )}
      </div>

      {/* 筛选抽屉:从右侧弹出,按时间筛选 */}
      {view === 'filterDrawer' && (
        <div className="absolute inset-0 z-40 flex">
          <div {...bindBack()} className="flex-1 bg-black/40" />
          <div className="w-[78%] h-full bg-white flex flex-col pt-10">
            <div className="px-4 py-3 border-b border-[#F5F5F5]">
              <div className="text-[16px] font-semibold text-[#1A1A1A]">筛选</div>
            </div>
            <div className="flex-1 overflow-y-auto p-4" data-scroll-container="orders-filter" data-scroll-direction="vertical">
              <div className="text-[14px] font-medium text-[#1A1A1A] mb-3">按时间</div>
              <div className="flex flex-col gap-2">
                {TIME_OPTIONS.map((t) => {
                  const on = draftTime === t.id;
                  return (
                    <button
                      key={t.id}
                      {...bindTap({ kind: 'action', id: 'orders.filter.time.select' }, {
                        params: { time: t.id },
                        onTrigger: () => setDraftTime(t.id),
                      })}
                      className={`w-full flex items-center justify-between h-11 px-3 rounded-lg text-left ${
                        on ? 'bg-[#FFF0EF] text-[#E1251B]' : 'bg-[#F7F7F7] text-[#333]'
                      }`}
                    >
                      <span className="text-[14px]">{t.label}</span>
                      {on && <IcCheck size={16} className="text-[#E1251B]" />}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="shrink-0 flex gap-3 p-3 border-t border-[#F0F0F0]">
              <button
                {...bindTap({ kind: 'action', id: 'orders.filter.reset' }, { onTrigger: resetFilter })}
                className="flex-1 h-10 rounded-full bg-[#F4F4F4] text-[15px] text-[#333]"
              >
                重置
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'orders.filter.apply' }, { onTrigger: applyFilter })}
                className="flex-1 h-10 rounded-full bg-[#E1251B] text-white text-[15px] font-semibold"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  bindTap,
}: {
  order: Order;
  bindTap: ReturnType<typeof useJingdongGestures>['bindTap'];
}) {
  const first = order.lines[0];
  const totalQty = order.lines.reduce((n, l) => n + l.qty, 0);
  const statusText = STATUS_TEXT[order.status] || '';
  const isUnpaid = order.status === 'unpaid';
  const isUndelivered = order.status === 'undelivered';
  const showDoneActions = order.status === 'done';
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="bg-white rounded-xl p-3">
      {/* 店铺行 + 状态 (整行进详情) */}
      <button
        {...bindTap('orders.detail-open', { params: { orderId: order.id } })}
        className="w-full flex items-center justify-between"
      >
        <span className="flex items-center gap-1 min-w-0">
          {order.self && <span className="text-[10px] text-white bg-[#E1251B] rounded px-1 py-0.5 shrink-0">自营</span>}
          <span className="text-[14px] font-medium text-[#1A1A1A] truncate">{order.shopName}</span>
          <IcChevronRight size={14} className="text-[#999] shrink-0" />
        </span>
        <span className={`text-[13px] shrink-0 ml-2 ${isCancelled ? 'text-[#999]' : 'text-[#E1251B]'}`}>{statusText}</span>
      </button>

      {/* 商品行 (进详情) */}
      <button
        {...bindTap('orders.detail-open', { params: { orderId: order.id } })}
        className="w-full flex items-center gap-2.5 mt-2.5 text-left"
      >
        <Img src={first.image} className="w-16 h-16 rounded-lg object-cover bg-[#F5F5F5] shrink-0" alt={first.title} />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] text-[#1A1A1A] line-clamp-2 leading-[17px]">{first.title}</div>
          <div className="text-[11px] text-[#999] mt-1">{first.skuDesc}</div>
        </div>
        <div className="text-right shrink-0">
          <PriceYuan value={first.price} className="text-[#1A1A1A] text-[15px]" />
          <div className="text-[11px] text-[#999] mt-0.5">共{totalQty}件</div>
        </div>
      </button>

      {/* 按钮组:取消→取消页;去支付→确认订单选支付方式 */}
      <div className="flex items-center justify-end gap-1.5 mt-3 overflow-x-auto no-scrollbar">
        {(isUnpaid || isUndelivered) && (
          <>
            <button
              {...bindTap('orders.cancel-open', { params: { orderId: order.id } })}
              className={btnGhost}
            >
              取消订单
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'orders.invoice.wontfix' }, { onTrigger: wontfix })}
              className={btnGhost}
            >
              查看发票
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'orders.modify.action' }, { onTrigger: wontfix })}
              className={btnGhost}
            >
              修改订单
            </button>
            {isUnpaid ? (
              <button
                {...bindTap('orders.pay-open', { params: { orderId: order.id } })}
                className={btnPrimary}
              >
                去支付
              </button>
            ) : null}
          </>
        )}
        {showDoneActions && (
          <>
            <button
              {...bindTap('orders.refund-open', { params: { orderId: order.id } })}
              className={btnGhost}
            >
              退换/售后
            </button>
            {first?.itemId ? (
              <button
                {...bindTap('orders.reorder-open', { params: { itemId: first.itemId } })}
                className={btnGhost}
              >
                再次购买
              </button>
            ) : null}
            {order.reviewed ? (
              <button
                {...bindTap({ kind: 'action', id: 'orders.review.done' }, { onTrigger: () => showToast('您已评价过该订单') })}
                className={btnPrimary}
              >
                评价晒单
              </button>
            ) : (
              <button
                {...bindTap('orders.review-open', { params: { orderId: order.id } })}
                className={btnPrimary}
              >
                评价晒单
              </button>
            )}
          </>
        )}
        {!isUnpaid && !isUndelivered && !showDoneActions && order.status === 'unused' && (
          <button
            {...bindTap('orders.refund-open', { params: { orderId: order.id } })}
            className={btnGhost}
          >
            退换/售后
          </button>
        )}
        {isCancelled && first?.itemId ? (
          <button
            {...bindTap('orders.reorder-open', { params: { itemId: first.itemId } })}
            className={btnPrimary}
          >
            再次购买
          </button>
        ) : null}
      </div>
    </div>
  );
}

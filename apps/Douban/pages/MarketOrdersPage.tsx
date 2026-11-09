import React, { useMemo, useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img, SegRow } from '../components/ui';
import { CenterDialog } from '../components/Sheet';
import { fmt2, orderNo, patchDeleteOrder } from './marketShared';
import type { DoubanOrder } from '../types';
import { payWithSystem } from '../capabilities';

// 节点: market.orders —— 我的订单。
// 4 状态 tab(全部/待付款/待发货/待收货)· 立即付款→payResult · 取消(二次确认→交易关闭)· 删除关闭单。

const TABS: { key: string; label: string; status?: DoubanOrder['status'] }[] = [
  { key: 'all', label: '全部' },
  { key: 'unpaid', label: '待付款', status: 'unpaid' },
  { key: 'toShip', label: '待发货', status: 'toShip' },
  { key: 'shipped', label: '待收货', status: 'shipped' },
];

const STATUS_TEXT: Record<DoubanOrder['status'], string> = {
  unpaid: '等待付款',
  toShip: '等待发货',
  shipped: '等待收货',
  done: '交易完成',
  closed: '交易关闭',
};

export default function MarketOrdersPage() {
  const { bindBack, bindTap, go } = useDoubanGestures();
  const products = useDoubanStore((s) => s.products);
  const orders = useDoubanStore((s) => s.orders);
  const cancelOrder = useDoubanStore((s) => s.cancelOrder);
  const repayOrder = useDoubanStore((s) => s.repayOrder);
  const toast = useDoubanStore((s) => s.toast);

  const [tab, setTab] = useState('all');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const shown = useMemo(() => {
    const active = TABS.find((t) => t.key === tab);
    if (!active?.status) return orders;
    return orders.filter((o) => o.status === active.status);
  }, [orders, tab]);

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0" style={{ background: C.surface }}>
        <button {...bindBack()} className="w-12 text-left text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.green }}>
          ‹
        </button>
        <div className="flex-1 text-center font-semibold text-base truncate" style={{ color: C.text }}>我的订单</div>
        <div className="w-12 flex items-center justify-end pr-1">
          <span className="text-lg" style={{ color: C.text }}>⋯</span>
        </div>
      </div>

      {/* 副标题行:「豆瓣购买的订单」黑色 tab 下划线 + 灰底 chip「地址管理」 */}
      <div className="flex items-center justify-between h-11 px-4 shrink-0" style={{ background: C.surface }}>
        <span className="relative inline-block text-[14px] font-semibold py-2.5" style={{ color: C.text }}>
          豆瓣购买的订单
          <span className="absolute left-0 bottom-0 h-0.5 rounded" style={{ background: C.text, width: '100%' }} />
        </span>
        <button
          {...bindTap('market.orders.address-open')}
          className="px-2.5 h-7 rounded-full text-xs border-none cursor-pointer"
          style={{ background: '#F2F3F5', color: C.text }}
        >
          地址管理
        </button>
      </div>

      {/* 状态筛选:左「全部 (N)」黑体标签 + 右灰底胶囊分段控件 */}
      <div className="flex items-center justify-between px-4 py-2 shrink-0" style={{ background: C.surface }}>
        <span className="text-[14px] font-semibold" style={{ color: C.text }}>全部 ({orders.length})</span>
        <SegRow
          options={TABS.map((t) => t.label)}
          value={TABS.find((t) => t.key === tab)?.label ?? '全部'}
          bindFor={(label) => {
            const t = TABS.find((x) => x.label === label)!;
            return bindTap(
              { kind: 'action', id: 'market.orders.tab.select.target' },
              { params: { target: t.key }, onTrigger: () => setTab(t.key) },
            );
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3" data-scroll-container="main" data-scroll-direction="vertical">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center justify-center pt-24">
            <div className="text-sm" style={{ color: C.sub }}>这里什么也没有~</div>
            <button
              {...bindTap('market.orders.product-open', { params: { productId: products[0]?.id ?? '' } })}
              className="mt-4 px-6 h-9 rounded-full text-sm cursor-pointer bg-transparent"
              style={{ border: `1px solid ${C.green}`, color: C.green }}
            >
              去逛逛吧
            </button>
          </div>
        ) : (
          <>
            {shown.map((o) => {
              const goodsAmount = o.items.reduce((s, it) => s + it.price * it.count, 0);
              const totalCount = o.items.reduce((s, it) => s + it.count, 0);
              const statusGreen = o.status === 'unpaid' || o.status === 'closed';
              return (
                <div key={o.id} className="bg-white rounded-xl p-3">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-[11px]" style={{ color: C.sub }}>订单号 {orderNo(o.id)}</span>
                    <span className="text-[13px] font-semibold" style={{ color: statusGreen ? C.green : C.sub }}>
                      {STATUS_TEXT[o.status]}
                    </span>
                  </div>

                  {o.items.map((it, i) => {
                    const p = products.find((pp) => pp.id === it.productId);
                    return (
                      <div
                        key={i}
                        {...bindTap('market.orders.product-open', { params: { productId: it.productId } })}
                        className="flex gap-3 py-2 cursor-pointer"
                      >
                        <Img src={p?.cover ?? ''} className="w-16 h-16 rounded-lg object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] line-clamp-2" style={{ color: C.text }}>{p?.title ?? '豆品'}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>{it.sku}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[13px]" style={{ color: C.text }}>¥{fmt2(it.price)}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: C.sub }}>×{it.count}</div>
                        </div>
                      </div>
                    );
                  })}

                  <div className="text-right text-[12px] pt-1" style={{ color: C.text }}>
                    共 {totalCount} 件商品　运费:{fmt2(o.freight)}　总计:<span className="font-semibold">¥{fmt2(goodsAmount + o.freight)}</span>
                  </div>

                  {/* 操作按钮行:方角灰 chip「取消订单」+ 红色「立即付款」 */}
                  <div className="flex justify-end gap-2 pt-2">
                    {o.status === 'unpaid' && (
                      <>
                        <button
                          {...bindTap({ kind: 'action', id: 'market.orders.cancel.open' }, { onTrigger: () => setCancelId(o.id) })}
                          className="h-8 px-4 rounded text-[13px] border cursor-pointer bg-white"
                          style={{ borderColor: C.border, color: C.sub }}
                        >
                          取消订单
                        </button>
                        <button
                          {...bindTap('market.orders.payResult-open', { params: { orderId: o.id }, onTrigger: () => {
                            const launched = payWithSystem(
                              { amount: goodsAmount + o.freight, orderId: o.id, subject: '豆瓣市集订单' },
                              (result) => {
                                if (result.resultCode !== 'OK') return;
                                repayOrder(o.id);
                                go('market.orders.payResult-open', { orderId: o.id });
                              },
                            );
                            if (!launched) toast('无法打开系统支付');
                          } })}
                          className="h-8 px-4 rounded text-[13px] text-white border-none cursor-pointer"
                          style={{ background: C.danger }}
                        >
                          立即付款
                        </button>
                      </>
                    )}
                    {o.status === 'closed' && (
                      <button
                        {...bindTap({ kind: 'action', id: 'market.orders.item.delete' }, { onTrigger: () => patchDeleteOrder(o.id) })}
                        className="h-8 px-4 rounded text-[13px] border cursor-pointer bg-white"
                        style={{ borderColor: C.border, color: C.sub }}
                      >
                        删除订单
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {/* 列表尾 */}
            <div className="text-center text-[12px] py-3" style={{ color: '#B9BEC6' }}>没有更多了</div>
          </>
        )}
      </div>

      {/* 取消确认弹窗 */}
      {cancelId && (
        <CenterDialog
          dismissable={false}
          buttons={[
            {
              label: '取消',
              bind: bindTap({ kind: 'action', id: 'market.orders.cancel.dismiss' }, { onTrigger: () => setCancelId(null) }),
            },
            {
              label: '确定',
              danger: true,
              bind: bindTap(
                { kind: 'action', id: 'market.orders.cancel.confirm' },
                { onTrigger: () => { cancelOrder(cancelId); setCancelId(null); } },
              ),
            },
          ]}
        >
          确定关闭此订单吗?
        </CenterDialog>
      )}
    </div>
  );
}

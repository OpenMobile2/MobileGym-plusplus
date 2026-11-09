import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { MapCanvas } from '../components/MapCanvas';
import { RatePanel } from '../components/RatePanel';
import { TopBar, Card, C, MissingData } from '../components/ui';

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 订单详情=行程已结束(历史单回看)。证据:frames/recC_tripend.jpg、frames/recD_tripend_full.jpg、n01 */
export default function OrderDetailPage() {
  const { bindTap } = useDidiGestures();
  const currentOrderId = useDidiStore((s) => s.currentOrderId);
  const orders = useDidiStore((s) => s.orders);
  const chooseDest = useDidiStore((s) => s.chooseDest);
  const setInvoiceSelected = useDidiStore((s) => s.setInvoiceSelected);
  const toast = useDidiStore((s) => s.toast);

  const order = orders.find((o) => o.id === currentOrderId);

  if (!order) {
    return (
      <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="dark">
        <TopBar title="订单详情" />
        <MissingData message="未找到对应订单，请返回行程列表重新选择。" />
      </div>
    );
  }

  // ---- 已取消订单:简版 ----
  if (order.status === 'canceled') {
    return (
      <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
        <TopBar title="订单详情" />
        <div className="flex-1 overflow-y-auto px-3 py-4" data-scroll-container="main" data-scroll-direction="vertical">
          <Card className="p-6 flex flex-col items-center">
            <span
              className="flex items-center justify-center rounded-full text-[26px]"
              style={{ width: 56, height: 56, background: '#F0F1F5', color: '#AAB0BB' }}
            >
              ✕
            </span>
            <div className="text-[16px] font-semibold text-app-text mt-3">行程已取消</div>
            <div className="text-[12px] text-app-text-muted mt-1">本次行程未产生费用</div>
          </Card>
          <Card className="p-4 mt-3">
            <div className="text-[13px] font-semibold text-app-text mb-2">{order.carType}</div>
            <div className="flex items-center text-[13px] text-app-text mb-1.5">
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
              {order.from}
            </div>
            <div className="flex items-center text-[13px] text-app-text">
              <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
              {order.to}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="行程已结束" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-3 py-3 flex flex-col gap-3" style={{ background: 'linear-gradient(180deg,#FFEDE2 0%,#F5F6FA 40%)' }}>
          {/* 评价面板(order.detail 声明:rate.face / rate.tag.toggle / rate.submit) */}
          <RatePanel ns="order.detail" orderId={order.id} />

          {order && (
            <>
              {/* 费用 + 地图卡 */}
              <Card className="p-4">
                <div className="flex items-center">
                  <span className="text-[30px] font-bold text-app-text leading-none">¥{order.fare.toFixed(2)}</span>
                  {(order.discount ?? 0) > 0 && (
                    <span className="text-[12px] ml-2" style={{ color: C.red }}>
                      已优惠 ¥{(order.discount ?? 0).toFixed(2)}
                    </span>
                  )}
                  <span className="flex-1" />
                  <button
                    {...bindTap('fee.fromOrder')}
                    className="text-[12px] bg-transparent border border-app-border rounded-full px-2.5 py-1 text-app-text"
                  >
                    免密已支付·查看明细 ›
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden mt-3">
                  <MapCanvas route height={120} />
                </div>
                <div className="text-[14px] font-semibold text-app-text mt-3">
                  {order.carType}<span className="mx-1.5 text-app-border">|</span>全程{order.distanceKm}公里
                  <span className="mx-1.5 text-app-border">|</span>{order.durationMin}分钟
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  <div className="flex items-center text-[12px] text-app-text-muted">
                    <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.green }} />
                    {hm(order.createdAt)} {order.from}
                  </div>
                  <div className="flex items-center text-[12px] text-app-text-muted">
                    <span className="w-2 h-2 rounded-full mr-2 shrink-0" style={{ background: C.orange }} />
                    {hm(order.createdAt + order.durationMin * 60000)} {order.to}
                  </div>
                </div>
              </Card>

              {/* 成长值卡(装饰) */}
              <Card className="p-4 flex items-center gap-3">
                <div className="text-center shrink-0">
                  <div className="text-[20px] font-bold" style={{ color: '#7C3AED' }}>+8</div>
                  <div className="text-[13px] font-bold" style={{ color: '#7C3AED' }}>成长值</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center text-[12px]">
                    <span className="text-white text-[10px] px-1 rounded mr-1.5" style={{ background: '#7C3AED' }}>V3会员</span>
                    <span className="text-app-text">本月累计新增23成长值</span>
                    <span className="flex-1" />
                    <span className="text-app-text-muted">已到账</span>
                  </div>
                  <div className="h-1.5 rounded-full mt-2" style={{ background: '#EDE9FE' }}>
                    <div className="h-1.5 rounded-full" style={{ width: '50%', background: 'linear-gradient(90deg,#A78BFA,#7C3AED)' }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-app-text-muted mt-1">
                    <span>251/500</span>
                    <span>保级V3</span>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 底部功能 bar */}
      <div className="shrink-0 bg-app-surface border-t border-app-border px-2 py-2 flex items-center gap-1">
        <button
          {...bindTap('invoice.fromOrder', {
            beforeTrigger: () => setInvoiceSelected(
              order.status === 'completed' && !order.invoiced ? [order.id] : [],
            ),
          })}
          className="flex flex-col items-center flex-1 bg-transparent border-none py-0.5"
        >
          <span className="text-[15px] leading-none">🧾</span>
          <span className="text-[10px] text-app-text mt-1">开发票</span>
        </button>
        <button {...bindTap('help.fromOrder')} className="flex flex-col items-center flex-1 bg-transparent border-none py-0.5">
          <span className="text-[15px] leading-none">🎧</span>
          <span className="text-[10px] text-app-text mt-1">联系客服</span>
        </button>
        <button onClick={() => toast('该功能暂未开放')} className="flex flex-col items-center flex-1 bg-transparent border-none py-0.5">
          <span className="text-[15px] leading-none">🔍</span>
          <span className="text-[10px] text-app-text mt-1">失物寻找</span>
        </button>
        <button onClick={() => toast('该功能暂未开放')} className="flex flex-col items-center flex-1 bg-transparent border-none py-0.5">
          <span className="text-[15px] leading-none">💡</span>
          <span className="text-[10px] text-app-text mt-1">产品建议</span>
        </button>
        <button
          onClick={() => toast('该功能暂未开放')}
          className="shrink-0 px-3 py-2 rounded-full text-[13px] border-none text-app-text"
          style={{ background: '#F0F1F5' }}
        >
          呼叫代驾
        </button>
        <button
          {...bindTap('car.rebookFromOrder', { beforeTrigger: () => order && chooseDest(order.to) })}
          className="shrink-0 px-3.5 py-2 rounded-full text-[13px] font-medium text-white border-none"
          style={{ background: C.orange }}
        >
          再来一单
        </button>
      </div>
    </div>
  );
}

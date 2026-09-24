import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { RoadNetworkMap } from '../components/RoadNetworkMap';
import { MapCanvas } from '../components/MapCanvas';
import { RatePanel } from '../components/RatePanel';
import { Card, C, MissingData } from '../components/ui';

const pad = (n: number) => String(n).padStart(2, '0');
const hm = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** 行程已结束(免密已扣款+评价)。证据:frames/recD_tripend_full.jpg、frames/recC_tripend.jpg、n01、n03 */
export default function TripFinishPage() {
  const { bindTap } = useDidiGestures();
  const trip = useDidiStore((s) => s.trip);
  const currentOrderId = useDidiStore((s) => s.currentOrderId);
  const orders = useDidiStore((s) => s.orders);
  const couponsClaimed = useDidiStore((s) => s.couponsClaimed);
  const claimFinishCoupons = useDidiStore((s) => s.claimFinishCoupons);
  const resetTrip = useDidiStore((s) => s.resetTrip);
  const setInvoiceSelected = useDidiStore((s) => s.setInvoiceSelected);
  const toast = useDidiStore((s) => s.toast);

  const orderId = trip.orderId ?? currentOrderId;
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return (
      <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="dark">
        <div className="flex h-11 shrink-0 items-center px-3">
          <button
            {...bindTap('trip.finish.done', { beforeTrigger: () => resetTrip() })}
            className="flex h-9 w-9 items-center justify-center border-none bg-transparent text-[19px] text-app-text"
            aria-label="完成"
          >
            ✕
          </button>
          <div className="ml-0.5 text-[18px] font-semibold text-app-text">行程已结束</div>
        </div>
        <MissingData message="本次行程数据不完整，请返回首页重新发起行程。" />
      </div>
    );
  }
  // 刚结束的这一单还留着真实路线几何，历史单只有文本，退回示意图。
  const finishedRoute = order.from === trip.from && order.to === trip.to
    ? trip.routeOptions.find((route) => route.id === trip.routeId) ?? null
    : null;

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 粉→白渐变顶部 */}
        <div className="px-3 pb-3" style={{ background: 'linear-gradient(180deg,#FFD8D0 0%,#FFEDE2 55%,#F5F6FA 100%)' }}>
          <div className="flex items-center h-11">
            <button
              {...bindTap('trip.finish.done', { beforeTrigger: () => resetTrip() })}
              className="w-9 h-9 flex items-center justify-center bg-transparent border-none text-app-text text-[19px]"
              aria-label="完成"
            >
              ✕
            </button>
            <div className="text-[18px] font-semibold text-app-text ml-0.5">行程已结束</div>
          </div>

          {/* 一起5折 领取条 + 四张小券卡 */}
          <Card className="p-3 mt-1">
            <div className="flex items-center">
              <span
                className="text-[11px] font-bold text-white px-1.5 py-0.5 rounded shrink-0"
                style={{ background: 'linear-gradient(90deg,#8B5CF6,#FF7D41)' }}
              >
                一起5折
              </span>
              <span className="text-[15px] font-semibold text-app-text ml-2 flex-1">4张5折券待领取</span>
              {couponsClaimed ? (
                <button
                  {...bindTap({ kind: 'action', id: 'trip.finish.coupon.claim' }, { onTrigger: () => claimFinishCoupons() })}
                  className="px-3.5 py-1.5 rounded-full text-[13px] border-none"
                  style={{ background: '#EEE', color: '#999' }}
                >
                  已领取
                </button>
              ) : (
                <button
                  {...bindTap({ kind: 'action', id: 'trip.finish.coupon.claim' }, { onTrigger: () => claimFinishCoupons() })}
                  className="px-3.5 py-1.5 rounded-full text-[13px] font-medium text-white border-none"
                  style={{ background: C.orange }}
                >
                  领取
                </button>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2.5">
              {[
                { corner: '自己用', note: '16点后可用', main: true },
                { corner: '送好友', note: '无门槛', main: false },
                { corner: '送好友', note: '无门槛', main: false },
                { corner: '送好友', note: '无门槛', main: false },
              ].map((cp, i) => (
                <div
                  key={i}
                  className="rounded-lg text-center pb-1.5 overflow-hidden"
                  style={{
                    border: `1px dashed ${cp.main ? C.orange : '#C4B5FD'}`,
                    background: cp.main ? '#FFF8F3' : '#F7F4FF',
                  }}
                >
                  <div
                    className="text-[9px] text-white px-1 py-0.5 inline-block rounded-br-lg float-left"
                    style={{ background: cp.main ? C.orange : '#8B5CF6' }}
                  >
                    {cp.corner}
                  </div>
                  <div className="clear-both text-[17px] font-bold pt-0.5" style={{ color: cp.main ? C.orangeDeep : '#7C3AED' }}>
                    5<span className="text-[11px]">折</span>
                  </div>
                  <div className="text-[9px] text-app-text-muted mt-0.5">{cp.note}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="px-3 pb-4 flex flex-col gap-3">
          {/* 评价面板 */}
          <RatePanel ns="trip.finish" orderId={order?.id ?? null} />

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
                    {...bindTap('fee.explain.open')}
                    className="text-[12px] bg-transparent border border-app-border rounded-full px-2.5 py-1 text-app-text"
                  >
                    免密已支付·查看明细 ›
                  </button>
                </div>
                <div className="rounded-xl overflow-hidden mt-3">
                  {finishedRoute ? (
                    <RoadNetworkMap
                      height={120}
                      routes={[finishedRoute]}
                      selectedRouteId={finishedRoute.id}
                      traveled={finishedRoute.points}
                      originLabel={order.from}
                      destLabel={order.to}
                    />
                  ) : (
                    <MapCanvas route height={120} />
                  )}
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

              {/* +8 成长值(装饰) */}
              <Card className="p-4 flex items-center gap-3" >
                <div className="text-center shrink-0">
                  <div className="text-[20px] font-bold" style={{ color: '#7C3AED' }}>+8</div>
                  <div className="text-[13px] font-bold" style={{ color: '#7C3AED' }}>成长值</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center text-[12px]">
                    <span className="text-white text-[10px] px-1 rounded mr-1.5" style={{ background: '#7C3AED' }}>V3会员</span>
                    <span className="text-app-text">本月累计新增23成长值</span>
                    <span className="flex-1" />
                    <span className="text-app-text-muted">今日已到账</span>
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

              {/* V3 会员权益卡(装饰) */}
              <Card className="p-4">
                <div className="flex items-center">
                  <span className="text-[15px] font-semibold text-app-text">V3会员 您可享7项权益</span>
                  <span className="flex-1" />
                  <button
                    onClick={() => toast('该功能暂未开放')}
                    className="text-[12px] text-app-text-muted bg-transparent border-none"
                  >
                    查看更多 ›
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {['月月领券', '直通华住会', '包车专享价'].map((b, i) => (
                    <div key={b} className="rounded-xl text-center py-3" style={{ background: '#F5F1FF' }}>
                      <div className="text-[13px] font-medium text-app-text">{b}</div>
                      <div className="text-[10px] text-app-text-muted mt-0.5">
                        {['最高省20元', '银会员', '最高省180元'][i]}
                      </div>
                      <button
                        onClick={() => toast('该功能暂未开放')}
                        className="mt-2 text-[11px] text-white px-2.5 py-1 rounded-full border-none"
                        style={{ background: '#7C3AED' }}
                      >
                        免费领
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* 底部功能 bar */}
      <div className="shrink-0 bg-app-surface border-t border-app-border px-2 py-2 flex items-center gap-1">
        <button
          {...bindTap('invoice.entry.open', {
            beforeTrigger: () => {
              if (order.status === 'completed' && !order.invoiced) setInvoiceSelected([order.id]);
              else setInvoiceSelected([]);
            },
          })}
          className="flex flex-col items-center flex-1 bg-transparent border-none py-0.5"
        >
          <span className="text-[15px] leading-none">🧾</span>
          <span className="text-[10px] text-app-text mt-1">开发票</span>
        </button>
        <button {...bindTap('help.center.open')} className="flex flex-col items-center flex-1 bg-transparent border-none py-0.5">
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
          {...bindTap('car.select.rebook')}
          className="shrink-0 px-3.5 py-2 rounded-full text-[13px] font-medium text-white border-none"
          style={{ background: C.orange }}
        >
          再来一单
        </button>
      </div>
    </div>
  );
}

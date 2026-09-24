import React from 'react';
import * as TimeService from '@/os/TimeService';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { MapCanvas } from '../components/MapCanvas';
import { TopBar, Card, C, MissingData } from '../components/ui';

const pad = (n: number) => String(n).padStart(2, '0');
const mdhm = (ts: number) => {
  const d = TimeService.fromTimestamp(ts);
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

type FeeStep = 'order' | 'accept' | 'trip' | 'pay';

/** 费用说明·车费卫士。证据:n33(细读)、n34、n36、n39、n40 */
export default function FeeExplainPage() {
  const { bindTap } = useDidiGestures();
  const currentOrderId = useDidiStore((s) => s.currentOrderId);
  const orders = useDidiStore((s) => s.orders);
  const feeStep = useDidiStore((s) => s.feeStep);
  const helpFaqs = useDidiStore((s) => s.helpFaqs);
  const setFeeStep = useDidiStore((s) => s.setFeeStep);
  const toast = useDidiStore((s) => s.toast);
  const [openFaq, setOpenFaq] = React.useState<string | null>(null);

  const order = orders.find((o) => o.id === currentOrderId);

  if (!order) {
    return (
      <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="dark">
        <TopBar title="费用说明" />
        <MissingData message="未找到对应订单的费用信息，请返回订单详情重试。" />
      </div>
    );
  }

  const fare = order.fare;
  const discount = order.discount ?? 0;
  const estFare = order.estFare ?? Math.round((fare + discount) * 100) / 100;

  const steps: { id: FeeStep; name: string; sub: string }[] = [
    { id: 'order', name: '下单', sub: '选择车型' },
    { id: 'accept', name: '接单', sub: order.carType },
    { id: 'trip', name: '行程', sub: `${order.distanceKm}公里 ${order.durationMin}分钟` },
    { id: 'pay', name: '支付', sub: `${fare}元` },
  ];

  const ring = (active: boolean) =>
    active ? { boxShadow: `0 0 0 1.5px ${C.orange}` } : undefined;

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="费用说明" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 车费卫士横幅 */}
        <div className="px-4 pt-3 pb-6" style={{ background: 'linear-gradient(180deg,#FDE8DC 0%,#FBF0E8 100%)' }}>
          <div className="flex items-center gap-1.5">
            <span className="text-[16px]">🛡️</span>
            <span className="text-[17px] font-bold text-app-text">车费卫士</span>
          </div>
          <div className="text-[15px] font-semibold mt-1" style={{ color: '#3E7B27' }}>行程费用无异常</div>
        </div>

        <div className="px-3 -mt-3 pb-5 flex flex-col gap-3">
          {/* 四步条 */}
          <Card className="px-2 py-3">
            <div className="flex items-center">
              {steps.map((st, i) => {
                const active = feeStep === st.id;
                return (
                  <React.Fragment key={st.id}>
                    {i > 0 && <span className="text-app-text-muted text-[11px] shrink-0 px-0.5">›</span>}
                    <button
                      {...bindTap(
                        { kind: 'action', id: 'fee.explain.step' },
                        { params: { value: st.id }, onTrigger: () => setFeeStep(st.id) },
                      )}
                      className="flex-1 flex flex-col items-center bg-transparent border-none py-1"
                      style={active ? { borderBottom: `2.5px solid ${C.orange}` } : { borderBottom: '2.5px solid transparent' }}
                    >
                      <span
                        className="text-[15px]"
                        style={{ color: active ? C.orangeDeep : '#1A1A1A', fontWeight: active ? 700 : 500 }}
                      >
                        {st.name}
                      </span>
                      <span className="text-[10px] mt-0.5" style={{ color: active ? C.orangeDeep : '#8A8F99' }}>
                        {st.sub}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </Card>

          {/* 账单信息 */}
          <Card className="p-4" >
            <div className="flex items-center">
              <span className="text-[16px] font-bold text-app-text" style={feeStep === 'pay' ? { color: C.orangeDeep } : undefined}>账单信息</span>
              <span className="flex-1" />
              <span className="text-[12px] text-app-text-muted">查看计价规则 ›</span>
            </div>
            <div className="rounded-xl px-3 py-3 mt-3" style={{ background: '#FAFAFB' }}>
              <div className="flex items-center text-[13px] text-app-text-muted">
                <span className="flex-1" />
                <span className="w-24 text-right">预估费用</span>
                <span className="w-24 text-right">实际费用</span>
              </div>
              <div className="flex items-center text-[14px] text-app-text mt-2">
                <span className="flex-1">一口价</span>
                <span className="w-24 text-right">{estFare.toFixed(2)}元</span>
                <span className="w-24 text-right">{(fare + discount).toFixed(2)}元</span>
              </div>
              <div className="flex items-center text-[14px] mt-2" style={{ color: C.orangeDeep }}>
                <span className="flex-1">优惠券抵扣</span>
                <span className="w-24 text-right">-{discount.toFixed(2)}元</span>
                <span className="w-24 text-right">-{discount.toFixed(2)}元</span>
              </div>
              <div className="flex items-center mt-3 pt-2 border-t border-app-border">
                <span className="flex-1 text-[13px] text-app-text-muted">总预估{estFare.toFixed(0)}元</span>
                <span className="text-[14px] text-app-text">
                  总实付 <span className="text-[22px] font-bold">{fare}</span>元
                </span>
              </div>
              <div className="text-right mt-1">
                <button
                  onClick={() => toast('微信支付分免密支付')}
                  className="text-[12px] text-app-text-muted bg-transparent border-none"
                >
                  查看支付方式 ▾
                </button>
              </div>
            </div>
          </Card>

          {/* 行程信息 */}
          <Card className="p-4" >
            <div className="text-[16px] font-bold text-app-text" style={feeStep === 'trip' ? { color: C.orangeDeep } : undefined}>
              行程信息
            </div>
            <div className="rounded-xl overflow-hidden mt-3" style={ring(feeStep === 'trip')}>
              <MapCanvas route height={110} />
            </div>
            <div className="text-[13px] text-app-text mt-2.5">
              <span className="inline-block w-3 h-3 rounded-full align-[-1px] mr-1.5" style={{ background: C.blue }} />
              实际路线 {order?.distanceKm ?? 0}公里 {order?.durationMin ?? 0}分钟
            </div>
          </Card>

          {/* 叫车信息 */}
          <Card className="p-4" >
            <div
              className="text-[16px] font-bold text-app-text"
              style={feeStep === 'order' || feeStep === 'accept' ? { color: C.orangeDeep } : undefined}
            >
              叫车信息
            </div>
            <div className="flex items-center mt-3">
              <span className="w-2 h-2 rounded-full mr-2.5 shrink-0" style={{ background: '#C9CCD4' }} />
              <div className="flex-1">
                <div className="text-[14px] text-app-text">首次下单</div>
                <div className="text-[11px] text-app-text-muted mt-0.5">{order ? mdhm(order.createdAt) : ''}</div>
              </div>
              <span className="text-[13px] text-app-text">2个车型 ›</span>
            </div>
            <div className="flex items-center mt-3">
              <span className="w-2 h-2 rounded-full mr-2.5 shrink-0" style={{ background: C.orange }} />
              <div className="flex-1">
                <div className="text-[14px]" style={{ color: C.orangeDeep }}>司机接单</div>
                <div className="text-[11px] text-app-text-muted mt-0.5">可乘4座·{order?.carType ?? '特惠快车'}</div>
              </div>
              <span className="text-[13px]" style={{ color: C.orangeDeep }}>{fare}元</span>
            </div>
          </Card>

          {/* 常见问题 */}
          <Card className="p-4">
            <div className="text-[16px] font-bold text-app-text mb-1">常见问题</div>
            {helpFaqs.slice(0, 3).map((f, i) => (
              <div key={f.id} className={i < 2 ? 'border-b border-app-border' : ''}>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'fee.explain.faq.toggle' },
                    { params: { value: f.id }, onTrigger: () => setOpenFaq(openFaq === f.id ? null : f.id) },
                  )}
                  className="w-full flex items-center py-3 bg-transparent border-none text-left"
                >
                  <span className="flex-1 text-[14px] text-app-text">{f.q}</span>
                  <span className="text-app-text-muted text-[12px]">{openFaq === f.id ? '▴' : '▾'}</span>
                </button>
                {openFaq === f.id && (
                  <div className="pb-3 text-[12px] leading-5 text-app-text-muted">{f.a}</div>
                )}
              </div>
            ))}
            <div className="text-center mt-2">
              <button
                onClick={() => toast('该功能暂未开放')}
                className="text-[13px] text-app-text-muted bg-transparent border-none"
              >
                查看更多问题 ›
              </button>
            </div>
          </Card>

          {/* 计价规则 */}
          <button
            {...bindTap('fare.fromFee')}
            className="flex items-center w-full px-4 py-3.5 rounded-xl bg-app-surface border-none text-left"
          >
            <span className="flex-1 text-[15px] text-app-text">计价规则</span>
            <span className="text-app-text-muted">›</span>
          </button>

          {/* 不认可车费 */}
          <button
            {...bindTap(
              { kind: 'action', id: 'fee.explain.dispute' },
              { onTrigger: () => toast('已收到反馈,客服将介入核实') },
            )}
            className="w-full py-3.5 rounded-full text-[15px] font-medium border-none"
            style={{ background: '#FFEFE5', color: C.orangeDeep }}
          >
            不认可车费
          </button>
        </div>
      </div>
    </div>
  );
}

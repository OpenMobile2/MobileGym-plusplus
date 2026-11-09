import React from 'react';
import { useDidiGestures } from '../hooks/useDidiGestures';
import { useDidiStore } from '../state';
import { TopBar, Card, C } from '../components/ui';

// 送货 tab 着陆页(证据 s43,浏览版)。节点: delivery.home
const TRUCK_TYPES = ['搬运工', '快送两轮', '快送四轮', '微面', '小面', '中面', '大车型'];

export default function DeliveryHomePage() {
  const { bindTap } = useDidiGestures();
  const toast = useDidiStore((s) => s.toast);
  const deliveryTab = useDidiStore((s) => s.deliveryTab);
  const setDeliveryTab = useDidiStore((s) => s.setDeliveryTab);
  const user = useDidiStore((s) => s.user);
  const [truck, setTruck] = React.useState('快送四轮');

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar
        title="送货"
        right={<button onClick={() => toast('送货订单暂未开放')} className="text-[13px] text-app-text-muted bg-transparent border-none">订单</button>}
      />
      <div className="flex-1 overflow-y-auto p-3">
        {/* 拉货/搬家 切换 */}
        <div className="flex items-center gap-4 px-1 mb-2.5">
          {(['cargo', 'move'] as const).map((t) => (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'delivery.home.tab' }, { onTrigger: () => setDeliveryTab(t) })}
              className="bg-transparent border-none text-[16px] p-0"
              style={{
                color: deliveryTab === t ? C.dark : C.sub,
                fontWeight: deliveryTab === t ? 700 : 400,
                borderBottom: deliveryTab === t ? `2px solid ${C.orange}` : '2px solid transparent',
              }}
            >
              {t === 'cargo' ? '拉货' : '搬家'}
            </button>
          ))}
          <span className="flex-1" />
          <button onClick={() => toast('切换城市暂未开放')} className="text-[13px] text-app-text-muted bg-transparent border-none">云江 ›</button>
        </div>

        {/* 货车卡 */}
        <Card className="p-4 mb-2.5">
          <div className="flex items-center">
            <svg viewBox="0 0 120 70" className="w-28 h-16 shrink-0">
              <rect x="8" y="22" width="66" height="34" rx="4" fill="#FF9A62" />
              <rect x="74" y="32" width="30" height="24" rx="3" fill="#FF7D41" />
              <rect x="78" y="36" width="14" height="10" rx="2" fill="#BFE3FF" />
              <circle cx="30" cy="58" r="8" fill="#2B2F36" />
              <circle cx="90" cy="58" r="8" fill="#2B2F36" />
              <circle cx="30" cy="58" r="3" fill="#9AA2AF" />
              <circle cx="90" cy="58" r="3" fill="#9AA2AF" />
            </svg>
            <div className="ml-3 min-w-0">
              <div className="text-[15px] font-semibold text-app-text">{truck}</div>
              <div className="text-[12px] text-app-text-muted mt-1 leading-relaxed">
                {deliveryTab === 'cargo'
                  ? '载货1.4-1.7米 · 涵盖2.4立方米 · 载重0.5-1吨'
                  : '搬家小哥上门 · 拆装家具 · 全程搬运'}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-3 overflow-x-auto" data-scroll-container="truckTypes" data-scroll-direction="horizontal">
            {TRUCK_TYPES.map((t) => (
              <button
                key={t}
                onClick={() => setTruck(t)}
                className="px-3 py-1.5 rounded-full text-[12px] border-none shrink-0"
                style={{
                  background: truck === t ? '#FFEFE5' : '#F5F6FA',
                  color: truck === t ? C.orangeDeep : '#666',
                  fontWeight: truck === t ? 600 : 400,
                }}
              >
                {t}
              </button>
            ))}
          </div>
        </Card>

        {/* 起终点 */}
        <Card className="p-4 mb-2.5">
          <div className="flex items-center text-[14px] text-app-text pb-3 border-b border-app-border">
            <span className="inline-block w-2 h-2 rounded-full mr-2.5" style={{ background: C.green }} />
            云杉路口南-公交车站 <span className="text-app-text-muted ml-2">{user.phone}</span>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'delivery.home.go' }, { onTrigger: () => toast('送货下单暂未开放') })}
            className="flex items-center w-full pt-3 bg-transparent border-none text-left"
          >
            <span className="inline-block w-2 h-2 rounded-full mr-2.5" style={{ background: C.orange }} />
            <span className="flex-1 text-[16px] font-semibold text-app-text">送到哪里去</span>
            <span className="text-[12px] text-app-text-muted">地址簿</span>
          </button>
        </Card>

        {/* 功能行 */}
        <div className="flex gap-2 mb-2.5">
          {['预约用车', '常用路线', '加急包裹'].map((t) => (
            <button key={t} onClick={() => toast('该功能暂未开放')} className="flex-1 py-2.5 rounded-xl bg-app-surface border-none text-[13px] text-app-text">
              {t}
            </button>
          ))}
        </div>

        {/* 底部服务 */}
        <div className="grid grid-cols-4 gap-2">
          {['快送跑腿', '滴滴搬家', '滴滴货运', '帮个忙'].map((t) => (
            <button key={t} onClick={() => toast('该功能暂未开放')} className="py-3 rounded-xl bg-app-surface border-none text-[13px] text-app-text">
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

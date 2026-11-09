import React from 'react';
import { useParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img } from '../components/ui';
import { formatDateTime, fmt } from '../utils/format';
import { IcService, IcPackage } from '../res/icons';

const MAP_SRC = '/@app-assets/Taobao/misc/map.svg';

/** 物流详情(spec: orders.logistics;时间轴最新在上 qa:Q1;虚拟商品「无需物流」特例 IMG_8738) */
export default function LogisticsPage() {
  const { orderId = '' } = useParams();
  const s = useStrings();
  const order = useTaobaoStore((st) => st.orders.find((o) => o.id === orderId));

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-app-bg">
        <TopBar title={s.logisticsTitle} />
        <div className="flex-1 flex items-center justify-center text-app-text-muted">{s.orderNotFound}</div>
      </div>
    );
  }

  const { logistics } = order;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar
        title={s.logisticsTitle}
        rightContent={<IcService size={18} className="text-app-text" />}
      />
      <div className="flex-1 overflow-y-auto" data-scroll-container="logistics" data-scroll-direction="vertical">
        {/* 地图区 */}
        <Img src={MAP_SRC} className="w-full h-32 object-cover" />

        <div className="mx-2.5 -mt-4 bg-app-surface rounded-xl p-3 relative">
          {logistics.noLogistics ? (
            <>
              <div className="text-[15px] font-semibold text-[#FF5000]">{fmt(s.shippedAtFmt, { time: order.shippedAt ? formatDateTime(order.shippedAt).slice(5, 16) : '' })}</div>
              <div className="text-[13px] text-app-text-muted mt-1.5">{s.noLogisticsText}</div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <IcPackage size={18} className="text-[#FF5000]" />
                <span className="text-[15px] font-semibold">{logistics.nodes[0]?.status ?? s.orderStatusShipped}</span>
                <span className="text-[12px] text-app-text-muted">{logistics.company} {logistics.trackingNo}</span>
              </div>
              {/* 时间轴:最新在上(qa:Q1) */}
              <div className="mt-3">
                {logistics.nodes.map((n, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1 ${i === 0 ? 'bg-[#FF5000]' : 'bg-[#DDDDDD]'}`} />
                      {i < logistics.nodes.length - 1 && <span className="w-px flex-1 bg-[#EEEEEE]" />}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className={`text-[13px] ${i === 0 ? 'font-semibold text-app-text' : 'text-app-text-muted'}`}>
                        {n.status}
                      </div>
                      <div className="text-[12px] text-app-text-muted mt-0.5 leading-relaxed">{n.desc}</div>
                      <div className="text-[11px] text-[#BBBBBB] mt-0.5">{formatDateTime(n.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 送至 */}
        <div className="mx-2.5 mt-2 bg-app-surface rounded-xl p-3">
          <div className="text-[13px]">
            <span className="text-app-text-muted">{s.shipToLabel}</span> {order.addressSnapshot.full}
          </div>
          <div className="text-[12px] text-app-text-muted mt-1">
            {order.addressSnapshot.name} {order.addressSnapshot.phone}
            <span className="ml-1 text-[10px] border border-[#CCCCCC] rounded px-0.5">{s.numberProtectedLabel}</span>
          </div>
        </div>

        {/* 商品摘要 */}
        <div className="mx-2.5 mt-2 mb-3 bg-app-surface rounded-xl p-3 flex gap-2.5 items-center">
          <Img src={order.lines[0].image} className="w-12 h-12 rounded-lg object-cover" />
          <div className="flex-1 text-[13px] line-clamp-1">{order.lines[0].title}</div>
        </div>
      </div>
    </div>
  );
}

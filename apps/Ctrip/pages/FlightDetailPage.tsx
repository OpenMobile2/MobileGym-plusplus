import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price } from '../components/ui';

/** 航班详情(spec flight.detail)。票价方案「订」→booking;金牌延误服务增值选购。 */
const ADDONS = [
  { id: 'none', label: '不购买增值服务', price: 0 },
  { id: 'delay', label: '金牌延误服务', price: 40, desc: '延误30分钟起赔付' },
  { id: 'combo', label: '延误+行李组合', price: 68, desc: '延误+行李丢失赔付' },
];

export default function FlightDetailPage() {
  const { no = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const flights = useCtripStore((s) => s.flights);
  const flight = flights.find((f) => f.id === no) ?? flights[0];
  const [addon, setAddon] = React.useState('none');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={`${flight.airline} ${flight.flightNo}`} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 航段 */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center">
            <div><div className="text-[24px] font-bold">{flight.depart}</div><div className="text-[12px] text-[#999999]">{flight.fromAirport}</div></div>
            <div className="flex-1 text-center px-3">
              <div className="text-[12px] text-[#0086F6]">{flight.transfer ? `中转 ${flight.transfer}` : '直飞'}</div>
              <div className="text-[11px] text-[#999999] mt-1">{flight.duration}</div>
            </div>
            <div className="text-right"><div className="text-[24px] font-bold">{flight.arrive}</div><div className="text-[12px] text-[#999999]">{flight.toAirport}</div></div>
          </div>
          {flight.transfer && <div className="mt-2 text-[11px] text-[#B8860B] bg-[#FFF7E0] rounded px-2 py-1">联程提示:中转{flight.transfer},需在中转站换乘,建议预留充足时间</div>}
        </div>

        {/* 增值服务 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[15px] font-semibold mb-2">金牌延误服务</div>
          {ADDONS.map((a) => (
            <button
              key={a.id}
              {...bindTap({ kind: 'action', id: 'flightDetail.addon.toggle' }, { params: { addon: a.id }, onTrigger: () => setAddon(a.id) })}
              className="w-full flex items-center justify-between py-2.5 border-b border-[#F5F5F5] bg-transparent border-x-0 border-t-0 cursor-pointer text-left"
            >
              <div>
                <div className="text-[14px] text-[#222222]">{a.label} {a.price ? <span className="text-[#FF6A2C]">+¥{a.price}</span> : ''}</div>
                {a.desc && <div className="text-[11px] text-[#999999]">{a.desc}</div>}
              </div>
              <span className={`w-5 h-5 rounded-full border text-[12px] leading-4 text-center ${addon === a.id ? 'bg-[#0086F6] border-[#0086F6] text-white' : 'border-[#CCCCCC] text-transparent'}`}>✓</span>
            </button>
          ))}
        </div>

        {/* 票价方案 */}
        <div className="bg-white mt-2 px-4 py-3">
          <div className="text-[15px] font-semibold mb-2">选择票价</div>
          {[{ n: '经济舱 特价', p: flight.price, tag: '不可改签·退票收费' }, { n: '经济舱 灵活', p: flight.price + 320, tag: '免费改签1次' }].map((plan) => (
            <div key={plan.n} className="flex items-center justify-between py-3 border-b border-[#F5F5F5]">
              <div><div className="text-[14px] text-[#222222]">{plan.n}</div><div className="text-[11px] text-[#999999]">{plan.tag}</div></div>
              <div className="flex items-center gap-3">
                <Price value={plan.p} size="m" />
                <button {...bindTap('flightDetail.toBooking', { params: { no: flight.id } })} className="text-[13px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-5 py-1.5 border-none cursor-pointer">订</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

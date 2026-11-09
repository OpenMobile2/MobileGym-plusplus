import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar, wontfix } from '../components/ui';
import { IcSearch, IcChevronRight } from '../res/icons';

const CHANNELS = ['推荐', '酒店', '机票', '火车票', '门票'];

export function TravelPage() {
  const { bindTap } = useJingdongGestures();
  const [channel, setChannel] = useState('机票');
  const [trip, setTrip] = useState<'oneway' | 'round'>('oneway');
  const [from, setFrom] = useState('上海');
  const [to, setTo] = useState('北京');

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="light">
      {/* 蓝色头部 */}
      <div className="bg-[#1663E3] pt-10">
        <TopBar
          title="京东旅行"
          foreground="light"
          right={
            <div className="flex items-center gap-1 h-8 px-3 rounded-full bg-white/90 text-[12px] text-[#666]">
              <IcSearch size={13} className="text-[#1663E3]" /> 北京环球
            </div>
          }
        />
        {/* 频道 tab */}
        <div className="flex justify-around px-2 pb-3 pt-1">
          {CHANNELS.map((c) => (
            <button
              key={c}
              {...bindTap(
                { kind: 'action', id: 'travel.tab.select.channel' },
                { params: { channel: c }, onTrigger: () => setChannel(c) },
              )}
              className="flex flex-col items-center gap-1"
            >
              <span className={`text-[15px] ${channel === c ? 'text-white font-bold' : 'text-white/80'}`}>
                {c}
              </span>
              <span
                className={`w-5 h-0.5 rounded-full ${channel === c ? 'bg-white' : 'bg-transparent'}`}
              />
            </button>
          ))}
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="travel-scroll"
        data-scroll-direction="vertical"
      >
        {/* 机票查询表单 */}
        <div className="mx-3 -mt-1 bg-white rounded-2xl p-4 shadow-sm">
          {/* 单程/往返 */}
          <div className="flex gap-5 mb-4">
            {([['oneway', '单程'], ['round', '往返']] as const).map(([id, label]) => (
              <button
                key={id}
                {...bindTap(
                  { kind: 'action', id: 'travel.trip.select.type' },
                  { params: { type: id }, onTrigger: () => setTrip(id) },
                )}
                className={`text-[15px] pb-1 ${
                  trip === id ? 'text-[#1663E3] font-bold border-b-2 border-[#1663E3]' : 'text-[#666]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 出发/到达城市 */}
          <div className="flex items-center py-3 border-b border-[#F2F2F2]">
            <button
              {...bindTap(
                { kind: 'action', id: 'travel.field.edit.value' },
                { params: { value: 'from' }, onTrigger: () => setFrom(from === '上海' ? '广州' : '上海') },
              )}
              className="flex-1 text-left"
            >
              <div className="text-[11px] text-[#999]">出发城市</div>
              <div className="text-[24px] font-bold text-[#1A1A1A]">{from}</div>
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'travel.field.edit.value' },
                {
                  params: { value: 'swap' },
                  onTrigger: () => {
                    setFrom(to);
                    setTo(from);
                  },
                },
              )}
              className="w-9 h-9 rounded-full bg-[#F0F4FF] text-[#1663E3] flex items-center justify-center mx-2"
            >
              ⇌
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'travel.field.edit.value' },
                { params: { value: 'to' }, onTrigger: () => setTo(to === '北京' ? '成都' : '北京') },
              )}
              className="flex-1 text-right"
            >
              <div className="text-[11px] text-[#999]">到达城市</div>
              <div className="text-[24px] font-bold text-[#1A1A1A]">{to}</div>
            </button>
          </div>

          {/* 出发日期 */}
          <button
            {...bindTap(
              { kind: 'action', id: 'travel.field.edit.value' },
              { params: { value: 'date' }, onTrigger: () => {} },
            )}
            className="w-full flex items-center justify-between py-3 border-b border-[#F2F2F2]"
          >
            <div className="text-left">
              <span className="text-[11px] text-[#999]">出发日期</span>
              <div className="text-[16px] font-semibold text-[#1A1A1A]">
                07月06日 <span className="text-[12px] text-[#999] font-normal">今天 周日</span>
              </div>
            </div>
            <IcChevronRight size={18} className="text-[#CCC]" />
          </button>

          {/* 舱位 + 乘客 */}
          <button
            {...bindTap(
              { kind: 'action', id: 'travel.field.edit.value' },
              { params: { value: 'cabin' }, onTrigger: () => {} },
            )}
            className="w-full flex items-center justify-between py-3"
          >
            <span className="text-[14px] text-[#333]">经济舱 · 1成人</span>
            <IcChevronRight size={18} className="text-[#CCC]" />
          </button>

          {/* 机票查询(wontfix) */}
          <button
            {...bindTap({ kind: 'action', id: 'travel.search.wontfix' }, { onTrigger: wontfix })}
            className="w-full h-12 mt-2 rounded-full bg-gradient-to-r from-[#FF8A2B] to-[#FF6A00] text-white text-[17px] font-bold"
          >
            🎓 机票查询 · 学生专享优惠
          </button>
        </div>

        {/* 运营 banner */}
        <div className="mx-3 mt-3 h-24 rounded-2xl bg-gradient-to-r from-[#1663E3] to-[#3B8BFF] p-4 text-white">
          <div className="text-[18px] font-bold">抢5折机酒券</div>
          <div className="text-[12px] mt-1 opacity-90">暑价出游 · 早鸟价趁现在</div>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Price, BottomSheet, usePanel } from '../components/ui';

/** 车次详情(spec train.detail)。席别方案「订」→booking;经停信息弹层。 */
export default function TrainDetailPage() {
  const { no = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const trains = useCtripStore((s) => s.trains);
  const train = trains.find((t) => t.id === no) ?? trains[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={`${train.trainNo} 车次详情`} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 时刻 */}
        <div className="bg-white px-4 py-4">
          <div className="flex items-center">
            <div><div className="text-[24px] font-bold">{train.depart}</div><div className="text-[12px] text-[#999999]">{train.from}</div></div>
            <div className="flex-1 text-center px-3">
              <div className="text-[12px] text-[#0086F6]">{train.trainNo} · {train.type}</div>
              <div className="text-[11px] text-[#999999] mt-1">{train.duration}</div>
              <button {...bindTap({ kind: 'action', id: 'trainDetail.stops.open' }, { onTrigger: () => open('stops') })} className="text-[11px] text-[#0086F6] mt-1 bg-transparent border-none cursor-pointer">经停 {train.stops.length || 6} 站 ›</button>
            </div>
            <div className="text-right"><div className="text-[24px] font-bold">{train.arrive}</div><div className="text-[12px] text-[#999999]">{train.to}</div></div>
          </div>
        </div>

        {/* 换座提示 */}
        <div className="mx-3 mt-2 text-[12px] text-[#B8860B] bg-[#FFF7E0] rounded-lg px-3 py-2">座 · 车内换座:同车厢可自助换座,出票后可在订单内操作</div>

        {/* 席别方案 */}
        <div className="bg-white mt-2">
          <div className="px-4 py-2 text-[15px] font-semibold text-[#111111]">选择席别</div>
          {train.seats.map((s) => (
            <div key={s.name} className="flex items-center justify-between px-4 py-3 border-t border-[#F5F5F5]">
              <div>
                <div className="text-[15px] text-[#222222]">{s.name}</div>
                <div className={`text-[12px] ${s.status === '有票' ? 'text-[#38A169]' : 'text-[#FF6A2C]'}`}>{s.status}</div>
              </div>
              <div className="flex items-center gap-3">
                <Price value={s.price} size="m" />
                <button {...bindTap('trainDetail.toBooking', { params: { no: train.id } })} className="text-[13px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-5 py-1.5 border-none cursor-pointer">订</button>
              </div>
            </div>
          ))}
        </div>

        {/* 保障 */}
        <div className="mx-3 mt-2 text-[12px] text-[#666666] bg-white rounded-lg px-3 py-2">✓ 携程全能保障:抢票不加价,出行有保障,退改无忧</div>
      </div>

      {panel === 'stops' && (
        <BottomSheet title="经停信息" onClose={close}>
          <div className="p-4">
            {(train.stops.length ? train.stops : [{ station: train.from, arrive: '--', depart: train.depart, stay: '--' }, { station: train.to, arrive: train.arrive, depart: '--', stay: '--' }]).map((st, i) => (
              <div key={i} className="flex items-center py-2.5 border-b border-[#F5F5F5]">
                <span className="w-6 text-[12px] text-[#999999]">{i + 1}</span>
                <span className="flex-1 text-[14px] text-[#222222]">{st.station}</span>
                <span className="text-[12px] text-[#666666]">到 {st.arrive} / 发 {st.depart}</span>
                <span className="w-12 text-right text-[11px] text-[#999999]">{st.stay}</span>
              </div>
            ))}
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

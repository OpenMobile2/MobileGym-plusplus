import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, PrimaryBtn, BottomSheet, usePanel, Img } from '../components/ui';

/** 租车自驾首页(spec car.home)。取还车地点→locationPicker;取还时间弹层;查询→list;业务tab切换。 */
const BIZ_TABS = [{ id: 'domestic', label: '国内租车' }, { id: 'intl', label: '国际租车' }, { id: 'pickup', label: '接送机' }];

export default function CarHomePage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [tab, setTab] = React.useState('domestic');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="租车自驾" />
      <div className="shrink-0 bg-white flex px-2 border-b border-[#F0F0F0]">
        {BIZ_TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'carHome.tab.select.pickup' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
            className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
          >{t.label}</button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white mx-2 mt-2 rounded-xl p-3">
          <button {...bindTap('carHome.toLocation')} className="w-full flex items-center justify-between py-3 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
            <span className="text-[13px] text-[#999999]">取车地点</span>
            <span className="text-[16px] font-semibold">上海虹桥机场 ›</span>
          </button>
          <button {...bindTap('carHome.toLocation')} className="w-full flex items-center justify-between py-3 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
            <span className="text-[13px] text-[#999999]">还车地点</span>
            <span className="text-[16px] font-semibold">同取车点 ›</span>
          </button>
          <button {...bindTap({ kind: 'action', id: 'carHome.date.open' }, { onTrigger: () => open('date') })} className="w-full flex items-center justify-between py-3 bg-transparent border-none cursor-pointer">
            <span className="text-[13px] text-[#999999]">取还时间</span>
            <span className="text-[14px]">07-05 10:00 - 07-07 10:00 ›</span>
          </button>
          <PrimaryBtn binding={bindTap('carHome.query')} className="w-full mt-3">查询车辆</PrimaryBtn>
        </div>

        {/* 新客专享 */}
        <div className="mx-2 mt-2 rounded-xl overflow-hidden relative h-24">
          <Img src="/@app-assets/Ctrip/gen/banner_car.png" className="w-full h-full object-cover" />
          <span className="absolute left-3 top-3 text-white text-[14px] font-semibold drop-shadow">新客专享 · 首租立减</span>
        </div>

        <div className="mx-2 mt-2 bg-white rounded-xl p-3">
          <div className="text-[15px] font-semibold mb-2">自驾好去处</div>
          <div className="text-[13px] text-[#666666]">环沪自驾 · 江浙沪皖热门路线,续航无忧,ETC 畅行。</div>
        </div>
      </div>

      {panel === 'date' && (
        <BottomSheet title="取还车时间" onClose={close}>
          <div className="p-4 text-[13px] text-[#666666]">
            演示:07-05 10:00 取车,07-07 10:00 还车(共2天)。
            <button onClick={close} className="w-full mt-4 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">确定</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

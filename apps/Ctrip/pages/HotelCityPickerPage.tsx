import React from 'react';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img } from '../components/ui';
import { IcSearch } from '../res/icons';

/** 城市选择(spec hotel.cityPicker):搜索/历史/热门网格/字母索引。选择→list。 */
const HOT_CITIES = [
  { name: '上海', img: '/@app-assets/Ctrip/gen/city_shanghai.png' },
  { name: '成都', img: '/@app-assets/Ctrip/gen/city_chengdu.png' },
  { name: '重庆', img: '/@app-assets/Ctrip/gen/city_chongqing.png' },
  { name: '三亚', img: '/@app-assets/Ctrip/gen/city_sanya.png' },
];
const LETTERS = 'ABCDEFGHJKLMNPQRSTWXYZ'.split('');

export default function HotelCityPickerPage() {
  const { bindTap } = useCtripGestures();
  const [q, setQ] = React.useState('');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="选择城市" />
      <div className="shrink-0 bg-white px-3 py-2">
        <div className="flex items-center bg-[#F2F4F7] rounded-full h-9 px-3 gap-2">
          <IcSearch size={16} className="text-[#999999]" />
          <input
            {...bindTap({ kind: 'action', id: 'cityPicker.input.value' }, { onTrigger: () => {} })}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索国内城市/区域"
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-3 pt-3">
          <div className="text-[13px] text-[#999999] mb-2">历史/定位</div>
          <div className="flex flex-wrap gap-2">
            {['上海(当前)', '杭州', '成都'].map((c) => (
              <button key={c} {...bindTap('cityPicker.select')} className="bg-[#F2F4F7] rounded-full px-4 py-1.5 text-[13px] text-[#444444] border-none cursor-pointer">{c}</button>
            ))}
          </div>
        </div>

        <div className="px-3 pt-4">
          <div className="text-[13px] text-[#999999] mb-2">热门城市</div>
          <div className="grid grid-cols-4 gap-2">
            {HOT_CITIES.map((c) => (
              <button key={c.name} {...bindTap('cityPicker.select')} className="relative rounded-lg overflow-hidden border-none cursor-pointer p-0 h-16">
                <Img src={c.img} className="w-full h-full object-cover" />
                <span className="absolute inset-0 bg-black/25 flex items-center justify-center text-white text-[13px] font-medium">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 pt-4 pb-6">
          {LETTERS.map((l) => (
            <div key={l} className="py-1">
              <div className="text-[13px] text-[#999999] font-semibold">{l}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1 pt-1">
                {[`${l}城1`, `${l}城2`].map((c) => (
                  <button key={c} {...bindTap('cityPicker.select')} className="text-[14px] text-[#333333] bg-transparent border-none cursor-pointer py-0.5">{c}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';
import { IcHotel, IcTicket, IcFlight } from '../res/icons';

/**
 * 城市目的地页(spec dest.city,Gate2 修订新增)。
 * 品类入口(酒店/景点/机票)、必看精选卡→景点详情、玩法chips切换、攻略内容toast。
 */
const PLAY_CHIPS = [
  { id: 'overview', label: '城市速览' },
  { id: 'traffic', label: '交通攻略' },
  { id: 'family', label: '亲子游' },
];

export default function DestCityPage() {
  const { city = '上海' } = useParams();
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const attractions = useCtripStore((s) => s.attractions);
  const [chip, setChip] = React.useState('overview');

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={`${city} · 中国`} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 城市封面 */}
        <div className="relative h-40">
          <Img src="/@app-assets/Ctrip/gen/scene_bund.png" className="w-full h-full object-cover" />
          <div className="absolute left-3 bottom-3 text-white">
            <div className="text-[22px] font-bold drop-shadow">{city}</div>
            <div className="text-[12px] opacity-90">魔都 · 必看精选 · 玩转{city}</div>
          </div>
        </div>

        {/* 品类入口 */}
        <div className="bg-white mx-2 -mt-4 rounded-xl grid grid-cols-3 py-3 relative">
          <button {...bindTap('destCity.toHotel')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <span className="w-9 h-9 rounded-full bg-[#FF7A45] text-white flex items-center justify-center"><IcHotel size={18} /></span>
            <span className="text-[12px] text-[#333333]">酒店住宿</span>
          </button>
          <button {...bindTap('destCity.toTicket')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <span className="w-9 h-9 rounded-full bg-[#FF9F45] text-white flex items-center justify-center"><IcTicket size={18} /></span>
            <span className="text-[12px] text-[#333333]">景点日游</span>
          </button>
          <button {...bindTap('destCity.toFlight')} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
            <span className="w-9 h-9 rounded-full bg-[#3B9BFF] text-white flex items-center justify-center"><IcFlight size={18} /></span>
            <span className="text-[12px] text-[#333333]">机票火车</span>
          </button>
        </div>

        {/* 必看精选 */}
        <div className="mx-2 mt-3">
          <div className="text-[16px] font-semibold text-[#111111] mb-2">必看精选</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {attractions.map((a) => (
              <button
                key={a.id}
                {...bindTap('destCity.toAttraction', { params: { id: a.id } })}
                className="w-32 shrink-0 bg-white rounded-xl overflow-hidden border-none cursor-pointer p-0 text-left"
              >
                <Img src={a.image} className="w-full h-24 object-cover" />
                <div className="p-2">
                  <div className="text-[13px] text-[#222222] line-clamp-1">{a.name}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">{a.score}分 · {a.reviewCount}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 玩转 chips */}
        <div className="mx-2 mt-3 bg-white rounded-xl p-2">
          <div className="text-[16px] font-semibold text-[#111111] mb-1">玩转{city}</div>
          <div className="flex">
            {PLAY_CHIPS.map((c) => {
              const on = c.id === chip;
              return (
                <button
                  key={c.id}
                  {...bindTap({ kind: 'action', id: 'destCity.chip.select.overview' }, { params: { chip: c.id }, onTrigger: () => setChip(c.id) })}
                  className={`relative px-3 py-2 bg-transparent border-none cursor-pointer text-[14px] ${on ? 'text-[#111111] font-semibold' : 'text-[#666666]'}`}
                >
                  {c.label}
                  {on && <span className="absolute left-1/2 -translate-x-1/2 bottom-0.5 w-5 h-[3px] rounded-full bg-[#0086F6]" />}
                </button>
              );
            })}
          </div>
          <div className="px-2 py-3 text-[13px] text-[#666666] leading-relaxed">
            {chip === 'overview' && `${city}是中国最具活力的国际都市之一,外滩万国建筑、陆家嘴天际线、豫园古典园林,值得慢慢探索。`}
            {chip === 'traffic' && `${city}地铁网络发达,机场大巴/磁悬浮直达市区,景点间建议地铁+步行组合出行。`}
            {chip === 'family' && `迪士尼、海昌海洋公园、科技馆是${city}亲子首选,建议预留 2-3 天。`}
          </div>
        </div>

        {/* 当地指南等(wontfix toast) */}
        <div className="mx-2 mt-3 mb-4 grid grid-cols-2 gap-2">
          {['当地指南', '旅行热点', '线路规划', '连玩目的地'].map((g) => (
            <button
              key={g}
              {...bindTap({ kind: 'action', id: 'destCity.guide.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })}
              className="bg-white rounded-xl py-4 text-[14px] text-[#333333] border-none cursor-pointer"
            >{g}</button>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}

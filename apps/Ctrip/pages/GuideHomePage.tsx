import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { Img, Price, TopBar } from '../components/ui';

const CITY_GUIDES = [
  { city: '上海', image: '/@app-assets/Ctrip/gen/city_shanghai.png', subtitleKey: 'guideShanghai' as const },
  { city: '杭州', image: '/@app-assets/Ctrip/gen/scene_westlake.png', subtitleKey: 'guideHangzhou' as const },
  { city: '成都', image: '/@app-assets/Ctrip/gen/city_chengdu.png', subtitleKey: 'guideChengdu' as const },
  { city: '重庆', image: '/@app-assets/Ctrip/gen/city_chongqing.png', subtitleKey: 'guideChongqing' as const },
  { city: '三亚', image: '/@app-assets/Ctrip/gen/city_sanya.png', subtitleKey: 'guideSanya' as const },
] as const;

export default function GuideHomePage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const attractions = useCtripStore((state) => state.attractions);

  return (
    <div className="flex h-full flex-col bg-[#F5F6F8]">
      <TopBar title={s.guideTitle} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="relative mx-2 mt-2 h-40 overflow-hidden rounded-2xl">
          <Img src="/@app-assets/Ctrip/gen/scene_huangshan.png" alt={s.guideHeroTitle} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute bottom-4 left-4 text-white">
            <div className="text-[22px] font-bold">{s.guideHeroTitle}</div>
            <div className="mt-1 text-[12px] opacity-90">{s.guideHeroSubtitle}</div>
          </div>
        </div>

        <section className="mt-4">
          <div className="px-3 text-[17px] font-bold text-[#111111]">{s.guidePopularCities}</div>
          <div className="mt-2 flex gap-2 overflow-x-auto px-2 pb-1">
            {CITY_GUIDES.map((item) => (
              <button
                key={item.city}
                {...bindTap('guide.city-open', { params: { city: item.city } })}
                className="relative h-32 w-28 shrink-0 overflow-hidden rounded-xl border-none bg-white p-0 text-left"
              >
                <Img src={item.image} alt={item.city} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <div className="text-[16px] font-bold">{item.city}</div>
                  <div className="mt-0.5 text-[10px] opacity-90">{s[item.subtitleKey]}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 px-2">
          <div className="px-1 text-[17px] font-bold text-[#111111]">{s.guidePopularAttractions}</div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {attractions.slice(0, 4).map((attraction) => (
              <button
                key={attraction.id}
                {...bindTap('guide.attraction-open', { params: { id: attraction.id } })}
                className="overflow-hidden rounded-xl border-none bg-white p-0 text-left shadow-sm"
              >
                <Img src={attraction.image} alt={attraction.name} className="h-28 w-full object-cover" />
                <div className="p-2">
                  <div className="line-clamp-1 text-[13px] font-semibold text-[#222222]">{attraction.name}</div>
                  <div className="mt-1 text-[11px] text-[#777777]">{attraction.city} · {attraction.score}{s.guideScoreSuffix}</div>
                  <Price value={attraction.ticketTypes[0]?.price ?? 0} size="s" className="mt-1 inline-block" />
                  <span className="ml-0.5 text-[10px] text-[#999999]">{s.guidePriceSuffix}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

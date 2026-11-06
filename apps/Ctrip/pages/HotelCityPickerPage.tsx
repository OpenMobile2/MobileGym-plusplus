import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img } from '../components/ui';
import { IcSearch } from '../res/icons';

/** 城市选择(spec hotel.cityPicker):搜索/历史/热门网格/字母索引。选择→list?city=。 */
const HOT_CITIES = [
  { name: '上海', img: '/@app-assets/Ctrip/gen/city_shanghai.png' },
  { name: '成都', img: '/@app-assets/Ctrip/gen/city_chengdu.png' },
  { name: '重庆', img: '/@app-assets/Ctrip/gen/city_chongqing.png' },
  { name: '三亚', img: '/@app-assets/Ctrip/gen/city_sanya.png' },
];

const CITIES_BY_LETTER: Record<string, string[]> = {
  A: ['安庆', '鞍山', '澳门'],
  B: ['北京', '保定', '包头', '北海'],
  C: ['成都', '重庆', '长沙', '长春', '常州'],
  D: ['大连', '东莞', '大理'],
  F: ['福州', '佛山'],
  G: ['广州', '贵阳', '桂林'],
  H: ['杭州', '合肥', '哈尔滨', '海口', '呼和浩特'],
  J: ['济南', '嘉兴', '金华', '九江'],
  K: ['昆明', '开封'],
  L: ['兰州', '拉萨', '洛阳', '连云港'],
  N: ['南京', '南昌', '宁波', '南宁'],
  Q: ['青岛', '泉州', '衢州'],
  S: ['上海', '深圳', '苏州', '沈阳', '三亚', '石家庄'],
  T: ['天津', '太原', '台州'],
  W: ['武汉', '无锡', '温州', '乌鲁木齐', '潍坊'],
  X: ['西安', '厦门', '徐州', '西宁'],
  Y: ['银川', '烟台', '扬州'],
  Z: ['郑州', '珠海', '中山', '张家界'],
};

function cleanCity(name: string) {
  return name.replace(/\(当前\)/g, '').trim();
}

export default function HotelCityPickerPage() {
  const s = useCtripStrings();
  const { bindTap, go } = useCtripGestures();
  const setHotelCity = useCtripStore((st) => st.setHotelCity);
  const hotels = useCtripStore((st) => st.hotels);
  const citiesWithHotels = React.useMemo(() => new Set(hotels.map((h) => h.city)), [hotels]);
  const [q, setQ] = React.useState('');

  /** onTrigger 会短路 execute：只回写城市并返回搜索页，不直接进列表。 */
  const select = (name: string) => {
    const city = cleanCity(name);
    return bindTap('cityPicker.select', {
      params: { city },
      onTrigger: () => {
        setHotelCity(city);
        go('cityPicker.select', { city });
      },
    });
  };

  const filteredLetters = React.useMemo(() => {
    const needle = q.trim();
    return Object.entries(CITIES_BY_LETTER)
      .map(([letter, cities]) => ({
        letter,
        cities: needle ? cities.filter((c) => c.includes(needle) || needle.includes(c)) : cities,
      }))
      .filter((g) => g.cities.length > 0);
  }, [q]);

  const quickHits = React.useMemo(() => {
    const needle = q.trim();
    if (!needle) return [] as string[];
    const all = Object.values(CITIES_BY_LETTER).flat();
    return all.filter((c) => c.includes(needle) || needle.includes(c)).slice(0, 12);
  }, [q]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('选择城市')} backTo="/hotel/search" />
      <div className="shrink-0 bg-white px-3 py-2">
        <div className="flex items-center bg-[#F2F4F7] rounded-full h-9 px-3 gap-2">
          <IcSearch size={16} className="text-[#999999]" />
          <input
            {...bindTap({ kind: 'action', id: 'cityPicker.input.value' }, { params: { value: q } })}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={s.t('搜索国内城市/区域')}
            className="flex-1 bg-transparent border-none outline-none text-[14px]"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} className="text-[12px] text-[#999] bg-transparent border-none cursor-pointer">清除</button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {q.trim() ? (
          <div className="px-3 pt-3 pb-6">
            <div className="text-[13px] text-[#999999] mb-2">{s.t('搜索结果')} · {quickHits.length}</div>
            {quickHits.length === 0 ? (
              <div className="py-10 text-center text-[14px] text-[#999999]">{s.t('未找到城市，试试长春/成都/上海')}</div>
            ) : (
              <div className="bg-white rounded-xl overflow-hidden">
                {quickHits.map((c) => (
                  <button key={c} {...select(c)} className="w-full text-left px-4 py-3.5 border-b border-[#F5F5F5] text-[15px] text-[#222] bg-transparent border-x-0 border-t-0 cursor-pointer">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
        <div className="px-3 pt-3">
          <div className="text-[13px] text-[#999999] mb-2">{s.t('历史/定位')}</div>
          <div className="flex flex-wrap gap-2">
            {['上海(当前)', '杭州', '成都', '重庆', '长春', '北京', '三亚'].map((c) => (
              <button key={c} {...select(c)} className="bg-[#F2F4F7] rounded-full px-4 py-1.5 text-[13px] text-[#444444] border-none cursor-pointer">{c}</button>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-[#999999]">有房城市：{[...citiesWithHotels].join(' / ')}</div>
        </div>

        <div className="px-3 pt-4">
          <div className="text-[13px] text-[#999999] mb-2">热门城市</div>
          <div className="grid grid-cols-4 gap-2">
            {HOT_CITIES.map((c) => (
              <button key={c.name} {...select(c.name)} className="relative rounded-lg overflow-hidden border-none cursor-pointer p-0 h-16">
                <Img src={c.img} className="w-full h-full object-cover pointer-events-none" />
                <span className="absolute inset-0 bg-black/25 flex items-center justify-center text-white text-[13px] font-medium pointer-events-none">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-3 pt-4 pb-6">
          {filteredLetters.map(({ letter, cities }) => (
            <div key={letter} className="py-1">
              <div className="text-[13px] text-[#999999] font-semibold">{letter}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 pl-1 pt-1">
                {cities.map((c) => (
                  <button key={c} {...select(c)} className={`text-[14px] bg-transparent border-none cursor-pointer py-0.5 ${citiesWithHotels.has(c) ? 'text-[#333333]' : 'text-[#BBBBBB]'}`}>{c}{citiesWithHotels.has(c) ? '' : ' ·暂无'}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
          </>
        )}
      </div>
    </div>
  );
}

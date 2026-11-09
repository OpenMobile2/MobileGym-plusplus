import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcClose, IcSearch, IcMapMini } from '../res/icons';

const HOT = [
  '上海',
  '北京',
  '广州',
  '杭州',
  '成都',
  '深圳',
  '苏州',
  '重庆',
  '西安',
  '长沙',
  '天津',
  '三亚',
  '厦门',
  '武汉',
  '无锡',
  '青岛',
];

const ALL = [
  '南京',
  '上海',
  '北京',
  '杭州',
  '苏州',
  '无锡',
  '常州',
  '广州',
  '深圳',
  '成都',
  '重庆',
  '西安',
  '长沙',
  '天津',
  '厦门',
  '武汉',
  '青岛',
  '三亚',
];

function CityChip({
  label,
  active,
  pin,
  tap,
}: {
  label: string;
  active?: boolean;
  pin?: boolean;
  tap: Record<string, unknown>;
}) {
  return (
    <button
      type="button"
      className={`flex h-9 items-center justify-center gap-1 rounded-[6px] border-none text-[13px] cursor-pointer ${
        active ? 'bg-[#FFF1EA] font-semibold text-[#FF6633]' : 'bg-[#F5F5F5] text-[#333]'
      }`}
      {...tap}
    >
      {pin ? <IcMapMini size={12} className="text-[#FF6633]" /> : null}
      {label}
    </button>
  );
}

export default function CityPickerPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, action, back } = useDianpingGestures();
  const setCity = useDianpingStore((st) => st.setCity);
  const current = useDianpingStore((st) => st.city);
  const showToast = useDianpingStore((st) => st.showToast);
  const [q, setQ] = useState('');
  const list = useMemo(() => ALL.filter((c) => !q || c.includes(q.trim())), [q]);

  // 目前仅南京有真实商户/榜单数据:选南京生效,其它城市提示敬请期待(不切换)
  const pick = (c: string): Record<string, unknown> =>
    action(
      'city.pick.select.target',
      () => {
        if (c === '南京') {
          setCity(c);
          back();
        } else {
          showToast(`「${c}」商户数据陆续开通中，当前仅支持南京`);
        }
      },
      { params: { target: c } },
    ) as unknown as Record<string, unknown>;

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="bg-white px-2 pb-0 pt-2">
        <div className="flex items-center gap-2">
          <button type="button" className="cursor-pointer border-none bg-transparent p-1" {...bindBack()}>
            <IcClose size={20} />
          </button>
          <div className="flex h-9 flex-1 items-center rounded-full border-[1.5px] border-[#FF6633] bg-white px-2.5">
            <IcSearch size={15} className="text-[#999]" />
            <input
              className="ml-1.5 w-full border-none bg-transparent text-[13px] outline-none"
              placeholder="搜索城市/区县"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-2 flex justify-center gap-8">
          <div className="relative pb-2 text-[14px] font-bold text-[#222]">
            境内
            <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" />
          </div>
          <button
            type="button"
            className="border-none bg-transparent pb-2 text-[14px] text-[#666] cursor-pointer"
            {...action('city.intl.open.disabled', () => showToast(s.notOpen))}
          >
            国际/港澳台
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-3 py-2"
        data-scroll-container="city-list"
        data-scroll-direction="vertical"
      >
        <div className="rounded-[10px] bg-white p-3">
          <div className="mb-2 text-[12px] text-[#999]">当前定位/历史访问</div>
          <div className="grid grid-cols-3 gap-2">
            <CityChip label={current} active pin tap={pick(current)} />
            {['长沙', '杭州']
              .filter((c) => c !== current)
              .map((c) => (
                <CityChip key={c} label={c} tap={pick(c)} />
              ))}
          </div>
        </div>

        <div className="mt-2 rounded-[10px] bg-white p-3">
          <div className="mb-2 text-[12px] text-[#999]">热门城市</div>
          <div className="grid grid-cols-4 gap-2">
            {HOT.map((c) => (
              <CityChip key={c} label={c} active={c === current} tap={pick(c)} />
            ))}
          </div>
        </div>

        <div className="mt-2 overflow-hidden rounded-[10px] bg-white">
          <div className="px-3 pt-3 text-[12px] text-[#999]">{s.pickCity}</div>
          {(q ? list : ALL).map((c) => (
            <button
              key={c}
              type="button"
              className={`flex w-full cursor-pointer items-center border-none border-b border-[#F5F5F5] bg-transparent px-4 py-3 text-left text-[14px] ${
                c === current ? 'font-semibold text-[#FF6633]' : 'text-[#222]'
              }`}
              {...pick(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

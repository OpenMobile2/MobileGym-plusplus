import React from 'react';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { TopBar } from '../components/ui';
import { IcPin } from '../res/icons';

const LETTERS = 'ABCDEFGHJKLMNPQRSTWXYZ'.split('');

/** 城市选择页(r3:定位/最近访问/热门城市/字母索引) */
export default function CityPickerPage() {
  const { bindTap, back } = useMaoyanGestures();
  const city = useMaoyanStore((st) => st.city);
  const cities = useMaoyanStore((st) => st.cities);
  const switchCity = useMaoyanStore((st) => st.switchCity);
  const listRef = React.useRef<HTMLDivElement>(null);

  const pick = (name: string) => {
    switchCity(name);
    back();
  };

  return (
    <div className="flex flex-col h-full bg-app-surface relative" data-status-bar-foreground="light">
      <div className="shrink-0 text-white" style={{ background: '#DC4038' }}>
        <TopBar title="选择城市" variant="red" />
        <div className="px-3 pb-2">
          <div className="h-8 rounded-full bg-app-surface/90 flex items-center px-3 text-[12px] text-(--app-c-text-3)">输入城市名或拼音</div>
        </div>
      </div>
      <div ref={listRef} className="flex-1 overflow-y-auto" data-scroll-container="city-list" data-scroll-direction="vertical">
        <div className="px-4 py-3">
          <div className="text-[12px] text-(--app-c-text-3) mb-2">当前定位</div>
          <button
            {...bindTap({ kind: 'action', id: 'city.pick.select.target' }, { params: { target: '西安' }, onTrigger: () => pick('西安') })}
            className="flex items-center gap-1 text-[14px] border border-app-border rounded px-4 py-1.5 bg-app-surface cursor-pointer"
          >
            <IcPin size={14} className="text-[#DC4038]" />西安
          </button>
        </div>
        <div className="px-4 py-2">
          <div className="text-[12px] text-(--app-c-text-3) mb-2">最近访问</div>
          <div className="flex gap-2">
            {[city, '南京'].filter((v, i, a) => a.indexOf(v) === i).map((n) => (
              <button
                key={n}
                {...bindTap({ kind: 'action', id: 'city.pick.select.target' }, { params: { target: n }, onTrigger: () => pick(n) })}
                className="text-[14px] border border-app-border rounded px-4 py-1.5 bg-app-surface cursor-pointer"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-2">
          <div className="text-[12px] text-(--app-c-text-3) mb-2">热门城市</div>
          <div className="grid grid-cols-4 gap-2">
            {cities.filter((c) => c.hot).map((c) => (
              <button
                key={c.id}
                {...bindTap({ kind: 'action', id: 'city.pick.select.target' }, { params: { target: c.name }, onTrigger: () => pick(c.name) })}
                className={`text-[14px] border rounded px-2 py-1.5 cursor-pointer ${c.name === city ? 'border-[#DC4038] text-[#DC4038] bg-(--app-c-brand-tint)' : 'border-app-border bg-app-surface text-(--app-c-text-2)'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="px-4 py-3 text-[12px] text-(--app-c-text-4)">按字母查找城市(演示数据仅收录热门城市)</div>
        <div className="h-6" />
      </div>
      {/* 字母索引 */}
      <div className="absolute right-1 top-32 bottom-10 flex flex-col justify-center gap-0.5">
        {LETTERS.map((l) => (
          <button
            key={l}
            {...bindTap({ kind: 'action', id: 'city.index.select.letter' }, {
              params: { letter: l },
              onTrigger: () => listRef.current?.scrollTo({ top: 0, behavior: 'smooth' }),
            })}
            className="text-[9px] text-[#DC4038] bg-transparent border-none cursor-pointer p-0 leading-tight"
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}

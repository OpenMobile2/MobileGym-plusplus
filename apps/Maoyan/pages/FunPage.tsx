import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useMaoyanStore } from '../state';
import { useMaoyanGestures } from '../hooks/useMaoyanGestures';
import { usePanel, useToast, Img, Chip, NOT_OPEN, MY, Price } from '../components/ui';
import { FUN_CATEGORIES } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcSearch, IcArrowDown } from '../res/icons';

/** 玩乐频道(anchor_fun_channel.jpg;qa:Q9=A 简单列表页) */
export default function FunPage() {
  const { bindTap } = useMaoyanGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { searchParams, setSearchParams } = usePanel('tab');
  const tab = searchParams.get('tab') ?? 'fun';
  const [category, setCategory] = React.useState('');

  const city = useMaoyanStore((st) => st.city);
  const merchants = useMaoyanStore((st) => st.funMerchants);
  const scenics = useMaoyanStore((st) => st.scenics);
  const shows = useMaoyanStore((st) => st.shows);

  let list = merchants;
  if (category) {
    const filtered = merchants.filter((m) => category.includes(m.category) || m.category.includes(category.replace('/', '')));
    list = filtered.length > 0 ? filtered : merchants;
  }

  return (
    <div className="flex flex-col h-full bg-app-bg relative" data-status-bar-foreground="light">
      {toast}
      {/* 红顶栏 */}
      <div className="shrink-0 text-white pb-2" style={{ background: MY.primary }}>
        <div className="text-center text-[16px] font-semibold py-2">{s.tabFun}</div>
        <div className="flex items-center gap-2 px-3">
          <span className="flex items-center gap-0.5 text-[14px]">{city}<IcArrowDown size={13} /></span>
          <button {...bindTap('fun.search-open')} className="flex-1 flex items-center h-8 rounded-full bg-app-surface px-3 gap-1.5 border-none cursor-pointer">
            <IcSearch size={15} className="text-(--app-c-text-3)" />
            <span className="text-[12px] text-(--app-c-text-3)">搜索商户/玩乐项目</span>
            <span className="ml-auto shrink-0 text-white text-[12px] rounded-full px-3 py-1" style={{ background: MY.cta }}>{s.search}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="fun-list" data-scroll-direction="vertical">
        {/* 金刚区 3行5列(同组一致:全部可点=按分类过滤列表) */}
        <div className="grid grid-cols-5 gap-y-3 bg-app-surface pt-3 pb-3 px-2">
          {FUN_CATEGORIES.map((c, i) => (
            <button
              key={c}
              {...bindTap({ kind: 'action', id: 'fun.category.select.option' }, {
                params: { option: c },
                onTrigger: () => setCategory(category === c ? '' : c),
              })}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-[18px] ${category === c ? 'ring-2 ring-[#DC4038]' : ''}`}
                style={{ background: ['#FDECEB', '#FFF4D6', '#EAF3FF', '#F0EAFF', '#EAFBF0'][i % 5] }}>
                {['🎭', '🎤', '🎼', '🗝️', '🎡', '💆', '🕹️', '🏋️', '🖥️', '🧖', '🖼️', '😆', '🎪', '🎙️', '🏮'][i]}
              </span>
              <span className={`text-[10px] ${category === c ? 'text-[#DC4038] font-medium' : 'text-(--app-c-text-2)'}`}>{c}</span>
            </button>
          ))}
        </div>

        {/* 同城必玩景点 */}
        <section className="bg-app-surface mt-2 pt-3 pb-3">
          <div className="px-3 mb-2 flex items-center">
            <span className="text-[15px] font-bold text-app-text">{s.mustVisit}</span>
            <span className="ml-auto text-[11px] text-(--app-c-text-3)">更多 ›</span>
          </div>
          <div className="flex gap-2 px-3 overflow-x-auto" data-scroll-container="scenic-row" data-scroll-direction="horizontal">
            {scenics.map((x, i) => (
              <button
                key={x.id}
                {...bindTap({ kind: 'action', id: 'fun.merchant.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="w-[124px] shrink-0 bg-transparent border-none cursor-pointer p-0 text-left relative"
              >
                <span className="absolute top-1 left-1 z-10 w-5 h-5 rounded text-white text-[11px] font-bold flex items-center justify-center" style={{ background: ['#F5A623', '#B0B7C3', '#D2996D', '#8A97A8'][i] }}>{i + 1}</span>
                <Img src={x.image} className="w-[124px] h-[82px] object-cover rounded-lg" />
                <div className="text-[12px] text-app-text truncate mt-1">{x.name}</div>
                <Price value={x.priceFrom} size="s" suffix=" 起" />
              </button>
            ))}
          </div>
        </section>

        {/* 附近玩乐 tabs + 筛选 + 商户列表 */}
        <div className="bg-app-surface mt-2 pt-3">
          <div className="flex gap-5 px-3 border-b border-app-border">
            {[['fun', s.nearbyFun], ['food', s.foodDeals], ['shows', s.greatShows]].map(([t, label]) => (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'fun.tab.select.target' }, {
                  params: { target: t },
                  onTrigger: () => setSearchParams((p) => { p.set('tab', t); return p; }, { replace: true }),
                })}
                className={`pb-2 bg-transparent border-none cursor-pointer text-[14px] ${tab === t ? 'text-app-text font-bold border-b-2 border-[#DC4038]' : 'text-app-text-muted'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 px-3 py-2">
            {[s.nearby, s.category, s.recommendSort].map((f) => (
              <Chip
                key={f}
                text={`${f} ▾`}
                binding={bindTap({ kind: 'action', id: 'fun.filter.select.option' }, {
                  params: { option: f },
                  onTrigger: () => setCategory(''),
                })}
              />
            ))}
          </div>

          {tab === 'fun' && list.map((m) => (
            <button
              key={m.id}
              {...bindTap({ kind: 'action', id: 'fun.merchant.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
              className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left"
            >
              <Img src={m.image} className="w-[72px] h-[72px] object-cover rounded-lg shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-app-text truncate">{m.name}</div>
                <div className="flex items-center gap-1 mt-0.5 text-[11px]">
                  <span className="font-bold" style={{ color: MY.scoreOrange }}>{m.rating}</span>
                  <span style={{ color: MY.scoreOrange }}>{'★'.repeat(Math.round(m.rating))}</span>
                  {m.perCapita > 0 && <span className="text-(--app-c-text-3)">¥{m.perCapita}/人</span>}
                </div>
                <div className="flex items-center text-[11px] text-(--app-c-text-3) mt-0.5">
                  <span className="truncate">{m.category} {m.zone}</span>
                  <span className="ml-auto shrink-0">{m.distanceKm < 1 ? `${Math.round(m.distanceKm * 1000)}m` : `${m.distanceKm}km`}</span>
                </div>
                {m.deals.slice(0, 2).map((d) => (
                  <div key={d} className="text-[11px] mt-1 truncate">
                    <span className="text-[9px] text-white bg-[#F5A623] rounded px-0.5 mr-1">团</span>
                    <span className="text-(--app-c-brand-tint-text)">{d.replace(/^团 /, '')}</span>
                  </div>
                ))}
              </div>
            </button>
          ))}
          {tab === 'food' && (
            <div className="py-10 text-center text-[13px] text-(--app-c-text-3)">美食团购请移步团购频道(演示不收录)</div>
          )}
          {tab === 'shows' && shows.slice(0, 4).map((x) => (
            <button key={x.id} {...bindTap('fun.show-open', { params: { id: x.id } })}
              className="w-full flex gap-2.5 px-3 py-2.5 bg-app-surface border-none border-b border-app-border cursor-pointer text-left">
              <Img src={x.poster} className="w-14 h-[75px] object-cover rounded shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-app-text line-clamp-2">{x.title}</div>
                <div className="text-[11px] text-(--app-c-text-3) mt-1">{x.dateDesc}</div>
                <Price value={x.priceMin} size="s" suffix=" 起" />
              </div>
            </button>
          ))}
        </div>
        <div className="h-3" />
      </div>
    </div>
  );
}

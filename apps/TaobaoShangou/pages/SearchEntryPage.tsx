import React, { useMemo, useState } from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { AppImg, Price } from '../components/common';
import { IcBack, IcTrash } from '../res/icons';
import { useStatusBarBg } from '../statusbar';

const DEFAULT_Q = '酸奶';

/** 专属好店推荐理由(IMG_6025) */
const REASONS = ['根据你的下单推荐', '根据你的浏览推荐', '附近好店'];

export default function SearchEntryPage() {
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#FFE8D9');
  const s = useAppStrings(strings, stringsEn);

  const shops = useTbsgStore((st) => st.shops);
  const items = useTbsgStore((st) => st.items);
  const searchHistory = useTbsgStore((st) => st.searchHistory);
  const searchDiscover = useTbsgStore((st) => st.searchDiscover);
  const submitSearch = useTbsgStore((st) => st.submitSearch);
  const clearSearchHistory = useTbsgStore((st) => st.clearSearchHistory);

  const [q, setQ] = useState('');

  /** 专属好店:评分 top8 */
  const rankShops = useMemo(
    () => [...shops].sort((a, b) => b.rating - a.rating).slice(0, 8),
    [shops],
  );
  /** 为你精选:销量 top4 商品 */
  const rankItems = useMemo(
    () => [...items].sort((a, b) => b.monthlySales - a.monthlySales).slice(0, 4),
    [items],
  );

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 浅橙渐变头:返回+输入框+搜索 */}
      <div className="shrink-0 bg-gradient-to-b from-[#FFE8D9] to-white">
        <div className="flex items-center h-14 px-2 gap-1">
          <button
            {...bindBack<HTMLButtonElement>()}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="返回"
          >
            <IcBack size={22} className="text-[#1A1A1A]" />
          </button>
          <div className="flex-1 h-10 rounded-full bg-white border border-[#EEEEEE] flex items-center px-4">
            <input
              {...bindTap<HTMLInputElement>({ kind: 'action', id: 'search.entry.input' }, { onTrigger: () => {} })}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={DEFAULT_Q}
              className="flex-1 bg-transparent outline-none border-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
            />
          </div>
          <button
            {...bindTap<HTMLButtonElement>('search.submit', {
              params: { q: q || DEFAULT_Q },
              beforeTrigger: () => submitSearch(q || DEFAULT_Q),
            })}
            className="ml-1 h-10 px-4 rounded-full bg-gradient-to-r from-[#FF8A2A] to-[#ED6C2C] text-white text-[14px] font-semibold border-none cursor-pointer"
          >
            {s.search}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 历史搜索 */}
        {searchHistory.length > 0 && (
          <div className="px-4 mt-2">
            <div className="flex items-center">
              <span className="font-bold text-[16px] text-[#1A1A1A]">历史搜索</span>
              <button
                {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'search.history.clear' }, {
                  onTrigger: () => clearSearchHistory(),
                })}
                aria-label="清空历史"
                className="ml-auto w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer text-[#999999]"
              >
                <IcTrash size={17} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-1">
              {searchHistory.map((word) => (
                <button
                  key={word}
                  {...bindTap<HTMLButtonElement>('search.history-open', {
                    params: { q: word },
                    beforeTrigger: () => submitSearch(word),
                  })}
                  className="h-9 px-3.5 rounded-full bg-white border border-[#EEEEEE] text-[13px] text-[#1A1A1A] cursor-pointer"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 搜索发现 */}
        <div className="px-4 mt-4">
          <div className="font-bold text-[16px] text-[#1A1A1A]">搜索发现</div>
          <div className="flex flex-wrap gap-2 mt-2">
            {searchDiscover.map((word) => (
              <button
                key={word}
                {...bindTap<HTMLButtonElement>('search.discover-open', { params: { q: word } })}
                className="h-9 px-3.5 rounded-full bg-white border border-[#EEEEEE] text-[13px] text-[#1A1A1A] cursor-pointer"
              >
                {word}
              </button>
            ))}
          </div>
        </div>

        {/* 双列榜单卡 */}
        <div className="grid grid-cols-2 gap-2 px-3 mt-4 pb-4 items-start">
          {/* 专属好店 */}
          <div className="bg-gradient-to-b from-[#FFF3E6] to-white rounded-xl p-2.5">
            <div className="font-bold text-[16px] text-[#1A1A1A]">专属好店</div>
            <div className="flex flex-col gap-2.5 mt-2">
              {rankShops.map((shop, idx) => (
                <div
                  key={shop.id}
                  {...bindTap<HTMLDivElement>('search.rankshop-open', { params: { shopId: shop.id } })}
                  className="flex gap-1.5 cursor-pointer"
                >
                  <span className={`w-4 text-[14px] font-bold italic shrink-0 ${idx < 3 ? 'text-[#ED6C2C]' : 'text-[#BBBBBB]'}`}>{idx + 1}</span>
                  <AppImg src={shop.logo} className="w-9 h-9 rounded-md object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[#1A1A1A] truncate">{shop.name}</div>
                    <div className="flex items-center mt-0.5">
                      <span className="text-[10px] text-[#ED6C2C] truncate">{REASONS[idx % REASONS.length]}</span>
                    </div>
                    <div className="text-[10px] text-[#999999]">{shop.deliveryMinutes}分钟 | {shop.distanceKm}km</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* 为你精选 */}
          <div className="bg-gradient-to-b from-[#FFF3E6] to-white rounded-xl p-2.5">
            <div className="font-bold text-[16px] text-[#1A1A1A]">为你精选</div>
            <div className="flex flex-col gap-2.5 mt-2">
              {rankItems.map((it, idx) => (
                <div
                  key={it.id}
                  {...bindTap<HTMLDivElement>('search.rankshop-open', { params: { shopId: it.shopId } })}
                  className="cursor-pointer"
                >
                  <div className="relative">
                    <AppImg src={it.image} className="w-full h-[88px] rounded-lg object-cover" />
                    <span className={`absolute left-1 top-1 w-4 h-4 rounded text-[11px] font-bold italic text-white flex items-center justify-center ${idx < 3 ? 'bg-[#ED6C2C]' : 'bg-[#BBBBBB]'}`}>{idx + 1}</span>
                  </div>
                  <div className="text-[12px] text-[#1A1A1A] truncate mt-1">{it.name}</div>
                  <Price value={it.price} size={14} />
                </div>
              ))}
            </div>
            <div className="text-[9px] text-[#BBBBBB] mt-2">*人气值由词的热度综合计算</div>
          </div>
        </div>
      </div>
    </div>
  );
}

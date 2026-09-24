import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcSearch, IcClose, IcPear } from '../res/icons';
import { Stars } from '../components/Stars';
import { DpAvatar } from '../components/DpAvatar';
import { dishImageUrl } from '../assets';
import { useDragScroll } from '../hooks/useDragScroll';

const RECENT_SEEDS = ['锅底', '火锅', '湘菜', '烤肉', '自助', '一人食'];

export default function ShopSearchPage() {
  const { shopId = '' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const dishRowRef = useDragScroll<HTMLDivElement>();
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === shopId));
  const searchHistory = useDianpingStore((st) => st.searchHistory);
  const addSearchHistory = useDianpingStore((st) => st.addSearchHistory);
  const clearSearchHistory = useDianpingStore((st) => st.clearSearchHistory);
  const userProfile = useDianpingStore((st) => st.userProfile);
  const [q, setQ] = useState('');
  const recent = searchHistory.length ? searchHistory : RECENT_SEEDS;
  const commitSearch = (term: string) => {
    const t = term.trim();
    if (!t) return;
    addSearchHistory(t);
    setQ(t);
  };

  const hotList = useMemo(() => {
    if (!shop) return [];
    return [shop.name.replace(/\(.*?\)/g, ''), shop.name.split('·')[0], '海鲜市场', '秘制牛油锅底', '万达茂', '贵州红酸汤锅底', '火锅', '海鲜大排档'];
  }, [shop]);

  const kw = q.trim();
  const dishes = useMemo(() => {
    if (!shop) return [];
    if (!kw) return shop.dishes;
    return shop.dishes.filter((d) => d.name.includes(kw));
  }, [shop, kw]);

  const related = useMemo(() => {
    if (!shop) return [];
    if (!kw) return shop.reviews;
    return shop.reviews.filter(
      (r) => r.body.includes(kw) || r.tags.some((t) => t.includes(kw)) || r.userName.includes(kw),
    );
  }, [shop, kw]);
  const noMatch = kw.length > 0 && dishes.length === 0 && related.length === 0;

  const reviewPhotos = useMemo(
    () => (shop ? shop.dishes.map((d) => dishImageUrl(shop.id, d.id)).filter((u): u is string => Boolean(u)) : []),
    [shop],
  );

  if (!shop) {
    return (
      <div className="p-4">
        <button type="button" className="cursor-pointer border-none bg-transparent" {...bindBack()}>
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      {/* 顶部搜索栏 */}
      <div className="flex items-center gap-2 px-2 pt-2 pb-2">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="flex h-9 flex-1 items-center rounded-full bg-[#F5F5F5] px-3">
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-[14px] outline-none"
            placeholder={shop.name.replace(/\(.*?\)/g, '')}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitSearch(q);
            }}
          />
          {q ? (
            <button
              type="button"
              className="cursor-pointer border-none bg-transparent p-0 text-[#CCC]"
              {...action('shopsearch.clear.action', () => setQ(''))}
            >
              <IcClose size={16} />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="border-none bg-transparent pr-2 text-[15px] text-[#333] cursor-pointer"
          {...action('shopsearch.submit.action', () => commitSearch(q))}
        >
          {s.search}
        </button>
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="shop-search"
        data-scroll-direction="vertical"
      >
        {!q ? (
          <div className="px-3 pt-1">
            {/* 最近搜索 */}
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#222]">最近搜索</span>
              <button
                type="button"
                className="cursor-pointer border-none bg-transparent p-1 text-[#999]"
                {...action('shopsearch.history.clear.action', () => clearSearchHistory())}
              >
                <IcClose size={16} />
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {recent.map((t) => (
                <button
                  key={t}
                  type="button"
                  className="cursor-pointer rounded-full border-none bg-[#F5F5F5] px-3.5 py-1.5 text-[13px] text-[#555]"
                  {...action('shopsearch.hot.select.target', () => commitSearch(t), { params: { q: t } })}
                >
                  {t}
                </button>
              ))}
              {recent.length === 0 ? <span className="text-[12px] text-[#BBB]">暂无搜索记录</span> : null}
            </div>

            {/* 店内热搜 */}
            <div className="mt-6 text-[15px] font-bold text-[#222]">店内热搜</div>
            <div className="mt-2 grid grid-cols-2 gap-y-4">
              {hotList.map((t, i) => (
                <button
                  key={t + i}
                  type="button"
                  className="cursor-pointer border-none bg-transparent text-left text-[14px] text-[#333]"
                  {...action('shopsearch.hot.select.target', () => commitSearch(t), { params: { q: t } })}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {noMatch ? (
              <div className="px-6 py-10 text-center text-[13px] text-[#999]">
                本店暂无“{kw}”相关的推荐菜或评价，换个词试试~
              </div>
            ) : null}
            {/* 本店推荐菜 */}
            {dishes.length > 0 ? (
            <div className="px-3 pt-3">
              <div className="rounded-[10px] bg-[#F7F7F7] p-3">
                <div className="mb-2 text-[15px] font-bold text-[#222]">本店推荐菜({dishes.length})</div>
                <div ref={dishRowRef} className="flex gap-2 overflow-x-auto pb-1">
                  {dishes.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      className="w-[100px] shrink-0 border-none bg-transparent p-0 text-left cursor-pointer"
                      {...bindTap('shopsearch.dishes-open', { params: { shopId: shop.id } })}
                    >
                      <div
                        className="relative h-[100px] overflow-hidden rounded-[8px]"
                        style={{ background: shop.coverColor }}
                      >
                        {dishImageUrl(shop.id, d.id) ? (
                          <img src={dishImageUrl(shop.id, d.id)} alt="" draggable={false} className="h-full w-full object-cover" />
                        ) : null}
                        <div className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[11px] text-white">
                          {d.recommendCount}人推荐
                        </div>
                      </div>
                      <div className="mt-1 truncate text-[12px] text-[#333]">{d.name}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            ) : null}

            {/* 相关内容 */}
            {related.length > 0 ? (
            <div className="px-3 pt-4">
              <div className="text-[15px] font-bold text-[#222]">
                本店“{kw || shop.name.replace(/\(.*?\)/g, '')}”相关内容({related.length})
              </div>
              {related.map((r, ri) => (
                <button
                  key={r.id}
                  type="button"
                  className="block w-full border-none border-b border-[#F5F5F5] bg-transparent py-3 text-left last:border-none cursor-pointer"
                  {...bindTap('shop.review-open', { params: { shopId: shop.id, reviewId: r.id } })}
                >
                  <div className="flex items-center gap-2">
                    {r.userName === userProfile.nickname ? (
                      <IcPear size={28} className="shrink-0 rounded-full" />
                    ) : (
                      <DpAvatar seed={r.userName} size={28} className="shrink-0 rounded-full" />
                    )}
                    <span className="text-[13px] font-medium text-[#333]">{r.userName}</span>
                    <span className="ml-auto text-[11px] text-[#BBB]">{r.dateLabel}</span>
                  </div>
                  <div className="mt-1.5 text-[13px] leading-5 text-[#333]">{r.body}</div>
                  {r.hasPhoto && reviewPhotos.length > 0 ? (
                    <div className="mt-2 flex gap-1">
                      {[0, 1].map((i) => {
                        const url = reviewPhotos[(ri + i) % reviewPhotos.length];
                        return (
                          <div
                            key={i}
                            className="h-[92px] w-[92px] overflow-hidden rounded-[6px]"
                            style={{ background: shop.coverColor }}
                          >
                            {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </button>
              ))}
            </div>
            ) : null}

            {/* 为你推荐更多 */}
            <div className="mt-2 flex items-center gap-2 bg-[#F7F7F7] px-3 py-3">
              <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[6px]" style={{ background: shop.coverColor }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold text-[#222]">{shop.name}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <Stars score={shop.score} size={11} />
                  <span className="text-[11px] text-[#666]">{shop.reviewCount}条 · ¥{shop.avgPrice}/人</span>
                </div>
              </div>
              <span className="shrink-0 rounded bg-[#FFF1EA] px-1.5 py-0.5 text-[10px] text-[#FF6633]">浏览过</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

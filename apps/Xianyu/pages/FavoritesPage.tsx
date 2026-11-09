import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useXianyuStrings } from '../hooks/useXianyuStrings';
import { TopBar } from '../components/TopBar';
import { EmptyState, Price } from '../components/ui';
import { ItemImage } from '../components/ItemImage';
import type { XyItem } from '../types';

const FAV_TABS = [
  { id: 'reduced', label: '降价' },
  { id: 'valid', label: '有效' },
  { id: 'invalid', label: '失效' },
] as const;

export default function FavoritesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap } = useXianyuGestures();
  const s = useXianyuStrings();
  const items = useXianyuStore((st) => st.items);
  const favorites = useXianyuStore((st) => st.favorites);
  const removeFavorite = useXianyuStore((st) => st.removeFavorite);

  const tab = searchParams.get('tab') ?? 'valid';

  const favItems = favorites
    .map((id) => items.find((it) => it.id === id))
    .filter((it): it is XyItem => Boolean(it));

  const list = favItems.filter((it) => {
    if (tab === 'reduced') return Boolean(it.originalPrice);
    if (tab === 'invalid') return Boolean(it.soldOut);
    return !it.soldOut; // valid
  });

  const selectTab = (target: string) =>
    setSearchParams((p) => { p.set('tab', target); return p; }, { replace: true });

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title="收藏的宝贝" />

      {/* 筛选 tab */}
      <div className="bg-app-surface shrink-0 flex items-center gap-6 px-4 border-b border-(--app-border)">
        {FAV_TABS.map((t) => {
          const active = t.id === tab;
          return (
            <button
              key={t.id}
              {...bindTap(
                { kind: 'action', id: 'favorites.tab.select.target' },
                { params: { target: t.id }, onTrigger: () => selectTab(t.id) },
              )}
              className={`bg-transparent border-none cursor-pointer py-2.5 text-[14px] relative ${active ? 'text-app-text font-bold' : 'text-app-text-muted'}`}
            >
              {t.label}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-4 h-0.5 rounded bg-app-primary" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="FavoritesPage-main" data-scroll-direction="vertical">
        {list.length === 0 ? (
          <EmptyState text={s.emptyFavorites} hint="去首页逛逛,收藏心仪好物吧" />
        ) : (
          list.map((it) => (
            <div key={it.id} className="bg-white flex items-center gap-3 px-3 py-3 border-b border-[#F4F4F4]">
              <button
                {...bindTap('home.item-open', { params: { itemId: it.id } })}
                className="flex items-center gap-3 flex-1 min-w-0 bg-transparent border-none p-0 cursor-pointer text-left"
              >
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <ItemImage seed={it.id} src={it.images[0]} category={it.category} label={it.title} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] text-[#1A1A1A] leading-snug line-clamp-2">{it.title}</div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <Price value={it.price} size={17} />
                    {it.originalPrice && <span className="text-[#999] text-[11px] line-through">¥{it.originalPrice}</span>}
                    {it.soldOut && <span className="text-[11px] text-[#999]">已失效</span>}
                  </div>
                </div>
              </button>
              <button
                onClick={() => removeFavorite(it.id)}
                className="shrink-0 text-[12px] text-[#999] border border-[#DDD] rounded-full px-3 py-1 bg-white cursor-pointer"
              >
                移除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

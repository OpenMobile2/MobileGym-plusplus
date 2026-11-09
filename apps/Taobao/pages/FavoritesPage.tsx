import React, { useState } from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, Price, EmptyState, SwipeRow, useToast } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';
import { fmt } from '../utils/format';
import type { TaobaoStringKey } from '../res/strings';

const BUSINESS_TAB_KEYS: TaobaoStringKey[] = ['ordersShoppingTab', 'ordersFlashTab', 'ordersFliggyTab'];

/** 我的收藏(spec: mine.favorites,IMG_8748;取消收藏:长按菜单或左滑 qa:Q9) */
export default function FavoritesPage() {
  const { bindTap, bindLongPress } = useTaobaoGestures();
  const s = useStrings();
  const favorites = useTaobaoStore((st) => st.favorites);
  const items = useTaobaoStore((st) => st.items);
  const removeFavorite = useTaobaoStore((st) => st.removeFavorite);
  const setPriceAlert = useTaobaoStore((st) => st.setPriceAlert);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const [toast, showToast] = useToast();

  const favItems = favorites.map((id) => items.find((i) => i.id === id)).filter(Boolean) as typeof items;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar
        title={fmt(s.myFavoritesTitleFmt, { count: favItems.length })}
        rightContent={
          <button
            {...bindTap({ kind: 'action', id: 'favorites.manage.toggle' }, { onTrigger: () => setManage((v) => !v) })}
            className="text-[12px] text-app-text whitespace-nowrap bg-transparent border-none cursor-pointer"
          >
            {manage ? s.doneLabel : s.manageLabel}
          </button>
        }
      />

      {/* 业务 Tab + 筛选(展示) */}
      <div className="bg-app-surface shrink-0 px-3">
        <div className="flex gap-5 h-9 items-center text-[13px]">
          <span className="text-[#FF5000] font-semibold">{s.allLabel}</span>
          {BUSINESS_TAB_KEYS.map((bKey) => (
            <span key={bKey} className="text-app-text-muted cursor-pointer" onClick={() => showToast(fmt(s.categoryNotAvailableFmt, { name: s[bKey] }))}>{s[bKey]}</span>
          ))}
        </div>
        <div className="flex gap-2 pb-2 text-[11px] text-app-text-muted">
          <span className="bg-[#F5F5F5] rounded-full px-2 py-0.5">{s.filterPriceDrop}</span>
          <span className="bg-[#F5F5F5] rounded-full px-2 py-0.5">{s.filterCategory}</span>
          <span className="bg-[#F5F5F5] rounded-full px-2 py-0.5">{s.filterStatus}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="favorites-list" data-scroll-direction="vertical">
        {favItems.length === 0 ? (
          <EmptyState text={s.favoritesEmptyText} />
        ) : (
          favItems.map((it) => (
            <SwipeRow
              key={it.id}
              actionsWidth={80}
              swipeBinding={bindTap({ kind: 'action', id: 'favorites.item.swipeActions' }, {
                params: { itemId: it.id }, onTrigger: () => {},
              })}
              actions={
                <button
                  {...bindTap({ kind: 'action', id: 'favorites.item.remove' }, {
                    params: { itemId: it.id },
                    onTrigger: () => { removeFavorite(it.id); showToast(s.unfavoritedToast); },
                  })}
                  className="flex-1 h-full text-white text-[12px] border-none cursor-pointer bg-[#FF0036]"
                >
                  {s.unfavoriteLabel}
                </button>
              }
            >
              <div
                {...bindLongPress({ kind: 'action', id: 'favorites.item.menu.open' }, {
                  params: { itemId: it.id },
                  onTrigger: () => setMenuFor(it.id),
                })}
              >
                <div
                  {...bindTap('favorites.item-open', { params: { itemId: it.id } })}
                  className="flex gap-2.5 px-3 py-2.5 bg-app-surface border-b border-[#F5F5F5] cursor-pointer"
                >
                  <Img src={it.image} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] line-clamp-2 leading-snug">{it.title}</div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <Price value={it.price} size="m" />
                      <span className="text-[11px] text-app-text-muted">{fmt(s.favoritedByCountFmt, { count: it.favCount })}</span>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <button
                        {...bindTap({ kind: 'action', id: 'favorites.priceAlert.set' }, {
                          params: { itemId: it.id },
                          onTrigger: () => { setPriceAlert(it.id); showToast(s.priceAlertSetToast); },
                          stopPropagation: true,
                        })}
                        className="text-[11px] text-app-text-muted border border-[#DDDDDD] rounded-full px-2 py-0.5 bg-app-surface cursor-pointer"
                      >
                        {s.priceAlertLabel}
                      </button>
                      {/* 「找相似」按铁律③移除:做错不如不做 */}
                      {manage && (
                        <button
                          {...bindTap({ kind: 'action', id: 'favorites.item.remove' }, {
                            params: { itemId: it.id },
                            onTrigger: () => { removeFavorite(it.id); showToast(s.unfavoritedToast); },
                            stopPropagation: true,
                          })}
                          className="text-[11px] text-[#FF0036] border border-[#FF0036] rounded-full px-2 py-0.5 bg-app-surface cursor-pointer"
                        >
                          {s.unfavoriteLabel}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SwipeRow>
          ))
        )}

        <div className="text-[13px] text-app-text-muted px-4 mt-4 mb-2">{s.recommendForYou}</div>
        <div className="pb-3">
          <ItemGrid
            items={items.slice(0, 4)}
            bindingOf={(it) => bindTap('favorites.item-open', { params: { itemId: it.id } })}
          />
        </div>
      </div>

      {/* 长按菜单 */}
      {menuFor && (
        <div className="absolute inset-0 z-40 flex items-center justify-center" onClick={() => setMenuFor(null)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-app-surface rounded-2xl w-64 overflow-hidden">
            <button
              {...bindTap({ kind: 'action', id: 'favorites.item.remove' }, {
                params: { itemId: menuFor },
                onTrigger: () => { removeFavorite(menuFor); setMenuFor(null); showToast(s.unfavoritedToast); },
              })}
              className="w-full py-3.5 text-[15px] text-[#FF0036] bg-app-surface border-none border-b border-[#F5F5F5] cursor-pointer"
            >
              {s.unfavoriteLabel}
            </button>
            <button className="w-full py-3.5 text-[15px] bg-app-surface border-none cursor-pointer" onClick={() => setMenuFor(null)}>
              {s.cancelLabel}
            </button>
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}

import React, { useState } from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, Price, EmptyState, SwipeRow, useToast } from '../components/ui';
import { ItemGrid } from '../components/ItemCard';

/** 我的收藏(spec: mine.favorites,IMG_8748;取消收藏:长按菜单或左滑 qa:Q9) */
export default function FavoritesPage() {
  const { bindTap, bindLongPress } = useTaobaoGestures();
  const favorites = useTaobaoStore((s) => s.favorites);
  const items = useTaobaoStore((s) => s.items);
  const removeFavorite = useTaobaoStore((s) => s.removeFavorite);
  const setPriceAlert = useTaobaoStore((s) => s.setPriceAlert);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [manage, setManage] = useState(false);
  const [toast, showToast] = useToast();

  const favItems = favorites.map((id) => items.find((i) => i.id === id)).filter(Boolean) as typeof items;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar
        title={`我的收藏(${favItems.length})`}
        rightContent={
          <button
            {...bindTap({ kind: 'action', id: 'favorites.manage.toggle' }, { onTrigger: () => setManage((v) => !v) })}
            className="text-[12px] text-[#333333] whitespace-nowrap bg-transparent border-none cursor-pointer"
          >
            {manage ? '完成' : '管理'}
          </button>
        }
      />

      {/* 业务 Tab + 筛选(展示) */}
      <div className="bg-white shrink-0 px-3">
        <div className="flex gap-5 h-9 items-center text-[13px]">
          <span className="text-[#FF5000] font-semibold">全部</span>
          {['购物', '闪购', '飞猪'].map((b) => (
            <span key={b} className="text-[#666666] cursor-pointer" onClick={() => showToast(`「${b}」分类暂未开放`)}>{b}</span>
          ))}
        </div>
        <div className="flex gap-2 pb-2 text-[11px] text-[#666666]">
          <span className="bg-[#F5F5F5] rounded-full px-2 py-0.5">有降价</span>
          <span className="bg-[#F5F5F5] rounded-full px-2 py-0.5">宝贝分类 ▾</span>
          <span className="bg-[#F5F5F5] rounded-full px-2 py-0.5">宝贝状态 ▾</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="favorites-list" data-scroll-direction="vertical">
        {favItems.length === 0 ? (
          <EmptyState text="还没有收藏的宝贝" />
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
                    onTrigger: () => { removeFavorite(it.id); showToast('已取消收藏'); },
                  })}
                  className="flex-1 h-full text-white text-[12px] border-none cursor-pointer bg-[#FF0036]"
                >
                  取消收藏
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
                  className="flex gap-2.5 px-3 py-2.5 bg-white border-b border-[#F5F5F5] cursor-pointer"
                >
                  <Img src={it.image} className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] line-clamp-2 leading-snug">{it.title}</div>
                    <div className="flex items-baseline gap-2 mt-1.5">
                      <Price value={it.price} size="m" />
                      <span className="text-[11px] text-[#999999]">{it.favCount}人收藏</span>
                    </div>
                    <div className="flex gap-2 mt-1.5">
                      <button
                        {...bindTap({ kind: 'action', id: 'favorites.priceAlert.set' }, {
                          params: { itemId: it.id },
                          onTrigger: () => { setPriceAlert(it.id); showToast('已设置降价提醒'); },
                          stopPropagation: true,
                        })}
                        className="text-[11px] text-[#666666] border border-[#DDDDDD] rounded-full px-2 py-0.5 bg-white cursor-pointer"
                      >
                        降价提醒
                      </button>
                      {/* 「找相似」按铁律③移除:做错不如不做 */}
                      {manage && (
                        <button
                          {...bindTap({ kind: 'action', id: 'favorites.item.remove' }, {
                            params: { itemId: it.id },
                            onTrigger: () => { removeFavorite(it.id); showToast('已取消收藏'); },
                            stopPropagation: true,
                          })}
                          className="text-[11px] text-[#FF0036] border border-[#FF0036] rounded-full px-2 py-0.5 bg-white cursor-pointer"
                        >
                          取消收藏
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SwipeRow>
          ))
        )}

        <div className="text-[13px] text-[#999999] px-4 mt-4 mb-2">为你推荐</div>
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
          <div className="relative bg-white rounded-2xl w-64 overflow-hidden">
            <button
              {...bindTap({ kind: 'action', id: 'favorites.item.remove' }, {
                params: { itemId: menuFor },
                onTrigger: () => { removeFavorite(menuFor); setMenuFor(null); showToast('已取消收藏'); },
              })}
              className="w-full py-3.5 text-[15px] text-[#FF0036] bg-white border-none border-b border-[#F5F5F5] cursor-pointer"
            >
              取消收藏
            </button>
            <button className="w-full py-3.5 text-[15px] bg-white border-none cursor-pointer" onClick={() => setMenuFor(null)}>
              取消
            </button>
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}

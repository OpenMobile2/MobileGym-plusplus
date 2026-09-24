import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, PriceYuan, Tag, EmptyState, showToast } from '../components/ui';
import { IcStore } from '../res/icons';

// 收藏/关注 — 商品/店铺 tab;收藏商品卡;管理删除。
export function FavoritesPage() {
  const { bindTap } = useJingdongGestures();
  const favorites = useJingdongStore((s) => s.favorites);
  const followedShops = useJingdongStore((s) => s.followedShops);
  const items = useJingdongStore((s) => s.items);
  const shops = useJingdongStore((s) => s.shops);
  const removeFavorites = useJingdongStore((s) => s.removeFavorites);

  const [tab, setTab] = useState<'item' | 'shop'>('item');
  const [manage, setManage] = useState(false);

  const favItems = favorites.map((id) => items.find((i) => i.id === id)).filter(Boolean) as typeof items;
  const favShops = followedShops.map((id) => shops.find((s) => s.id === id)).filter(Boolean) as typeof shops;

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar
        title="收藏/关注"
        right={
          tab === 'item' && favItems.length > 0 ? (
            <button onClick={() => setManage((v) => !v)} className="text-[14px] text-[#333] pr-1">
              {manage ? '完成' : '管理'}
            </button>
          ) : undefined
        }
      />

      {/* Tab */}
      <div className="shrink-0 bg-white flex items-center px-4 gap-8 border-b border-[#F2F2F2]">
        {([['item', `商品 ${favItems.length}`], ['shop', `店铺 ${favShops.length}`]] as const).map(([k, label]) => {
          const active = tab === k;
          return (
            <button
              key={k}
              {...bindTap(
                { kind: 'action', id: 'favorites.tab.select.type' },
                { onTrigger: () => { setTab(k); setManage(false); } },
              )}
              className="relative py-3"
            >
              <span className={`text-[15px] ${active ? 'text-[#1A1A1A] font-semibold' : 'text-[#666]'}`}>{label}</span>
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-6 h-[3px] rounded-full bg-[#E1251B]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="favorites-list" data-scroll-direction="vertical">
        {tab === 'item' ? (
          favItems.length === 0 ? (
            <EmptyState text="还没有收藏商品" />
          ) : (
            <div className="grid grid-cols-2 gap-2 p-2">
              {favItems.map((item) => (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden flex flex-col">
                  <div className="relative" {...bindTap('favorites.item-open', { params: { itemId: item.id } })}>
                    <div className="w-full aspect-square bg-[#F5F5F5]">
                      <Img src={item.image} className="w-full h-full object-cover" alt={item.title} />
                    </div>
                    <div className="p-1.5 flex flex-col gap-1">
                      <div className="text-[13px] leading-[17px] text-[#1A1A1A] line-clamp-2">
                        {item.self && <span className="text-[#E1251B] font-semibold mr-0.5">自营</span>}
                        {item.title}
                      </div>
                      <div className="flex items-baseline gap-1">
                        <PriceYuan value={item.price} className="text-[#E1251B] text-[16px]" />
                        <span className="text-[10px] text-[#999]">{item.sold}</span>
                      </div>
                    </div>
                  </div>
                  {manage && (
                    <button
                      {...bindTap(
                        { kind: 'action', id: 'favorites.item.remove' },
                        { onTrigger: () => { removeFavorites([item.id]); showToast('已取消收藏'); } },
                      )}
                      className="mx-1.5 mb-1.5 h-7 rounded-full border border-[#DDD] text-[12px] text-[#666]"
                    >
                      取消收藏
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        ) : favShops.length === 0 ? (
          <EmptyState text="还没有关注店铺" />
        ) : (
          <div className="p-2 space-y-2">
            {favShops.map((shop) => (
              <button
                key={shop.id}
                {...bindTap('favorites.shop-open', { params: { shopId: shop.id } })}
                className="w-full bg-white rounded-lg p-3 flex items-center gap-3 text-left"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden bg-[#F5F5F5] shrink-0">
                  <Img src={shop.logo} className="w-full h-full object-cover" alt={shop.name} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 text-[15px] font-medium text-[#1A1A1A]">
                    <IcStore size={15} className="text-[#E1251B]" />
                    <span className="truncate">{shop.name}</span>
                  </div>
                  <div className="text-[12px] text-[#999] mt-0.5">{shop.fans}</div>
                </div>
                <Tag className="text-[#999] bg-[#F2F2F2] px-2 py-1">已关注</Tag>
              </button>
            ))}
          </div>
        )}
        <div className="h-3" />
      </div>
    </div>
  );
}

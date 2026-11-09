import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, showToast } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { IcNavBack, IcHeadphones } from '../res/icons';

const SHOP_TABS = ['保障', '全部商品', '评价', '大促'];

export function ShopPage() {
  const { shopId } = useParams();
  const { bindTap, bindBack } = usePinduoduoGestures();

  const shop = usePinduoduoStore((s) => s.shops.find((sh) => sh.id === shopId));
  const allItems = usePinduoduoStore((s) => s.items);
  const items = allItems.filter((i) => i.shopId === shopId);
  const followedShops = usePinduoduoStore((s) => s.followedShops);
  const followShop = usePinduoduoStore((s) => s.followShop);
  const ensureShopChat = usePinduoduoStore((s) => s.ensureShopChat);

  const [tab, setTab] = useState('全部商品');

  if (!shop || !shopId) {
    return <div className="h-full pt-10 flex items-center justify-center text-[#999]">店铺不存在</div>;
  }
  const isFollowed = followedShops.includes(shopId);

  return (
    <div
      className="h-full flex flex-col pt-10 overflow-hidden bg-gradient-to-b from-[#FF4D2E] to-[#E22E1F]"
      data-status-bar-foreground="light"
    >
      {/* 顶栏 */}
      <div className="shrink-0 h-11 flex items-center px-2 text-white">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center -ml-1">
          <IcNavBack size={24} />
        </button>
        <div className="flex-1 text-center text-[16px] font-medium truncate px-1">{shop.name}</div>
        <button
          {...bindTap('shop.cs-open', {
            params: { chatId: `ch_${shopId}` },
            beforeTrigger: () => ensureShopChat(shopId),
          })}
          aria-label="客服"
          className="w-9 h-9 flex items-center justify-center"
        >
          <IcHeadphones size={20} />
        </button>
      </div>

      {/* 店铺头 */}
      <div className="shrink-0 px-3 pb-3 flex items-center gap-3 text-white">
        <Img src={shop.logo} className="w-14 h-14 rounded-lg object-cover bg-white/20" alt={shop.name} />
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold truncate">{shop.name}</div>
          <div className="text-[12px] opacity-90 mt-0.5 truncate">{shop.soldTip}</div>
        </div>
        <button
          {...bindTap(
            { kind: 'action', id: 'shop.follow.toggle' },
            { onTrigger: () => { followShop(shopId); showToast(isFollowed ? '已取消关注' : '已关注'); } },
          )}
          className={`shrink-0 px-3 h-8 rounded-full text-[13px] font-medium ${
            isFollowed ? 'bg-white/25 text-white' : 'bg-white text-[#E22E1F]'
          }`}
        >
          {isFollowed ? '已关注' : '+关注'}
        </button>
      </div>

      {/* 白色内容容器 */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#F5F5F5] rounded-t-2xl overflow-hidden">
        {/* Tab 行 */}
        <div className="shrink-0 bg-white flex px-2">
          {SHOP_TABS.map((t) => {
            const on = tab === t;
            return (
              <button
                key={t}
                {...bindTap(
                  { kind: 'action', id: 'shop.tab.select.section' },
                  { params: { tab: t }, onTrigger: () => setTab(t) },
                )}
                className={`flex-1 py-2.5 text-[14px] relative ${on ? 'text-[#E22E1F] font-medium' : 'text-[#666]'}`}
              >
                {t}
                {on && <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-6 h-0.5 bg-[#E22E1F] rounded-full" />}
              </button>
            );
          })}
        </div>

        {/* 商品双列 */}
        <div className="flex-1 overflow-y-auto p-2" data-scroll-container data-scroll-direction="vertical">
          <div className="grid grid-cols-2 gap-2">
            {items.map((it) => (
              <ItemCard
                key={it.id}
                item={it}
                openBind={bindTap('shop.item-open', { params: { itemId: it.id } })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

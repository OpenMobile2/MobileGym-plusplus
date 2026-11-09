import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, EmptyState, showToast } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { IcNavBack, IcHeadphones, IcSearch, IcCheck } from '../res/icons';

const TABS = ['首页', '全部商品', '评价'];

export function ShopPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const { bindTap, bindBack } = useJingdongGestures();
  const shops = useJingdongStore((s) => s.shops);
  const items = useJingdongStore((s) => s.items);
  const followedShops = useJingdongStore((s) => s.followedShops);
  const followShop = useJingdongStore((s) => s.followShop);
  const ensureShopChat = useJingdongStore((s) => s.ensureShopChat);

  const shop = shops.find((s) => s.id === shopId) || shops[0];
  const shopItems = items.filter((i) => i.shopId === shop.id);
  const list = shopItems.length ? shopItems : items.slice(0, 6);
  const followed = followedShops.includes(shop.id);
  const chatId = `ch_${shop.id}`;

  const [tab, setTab] = useState(0);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="light">
      {/* 店铺头(pt-10 预留状态栏,红底用浅色状态栏前景) */}
      <div className="shrink-0 pt-10 bg-gradient-to-b from-[#E1251B] to-[#FF5A45]">
        <div className="flex items-center gap-2 px-2 h-11">
          <button {...bindBack()} aria-label="返回" className="w-8 h-8 flex items-center justify-center"><IcNavBack size={22} className="text-white" /></button>
          <div className="flex-1 h-8 rounded-full bg-white/90 flex items-center px-3 gap-1 text-[13px] text-[#999]">
            <IcSearch size={14} />搜索店内商品
          </div>
        </div>
        <div className="flex items-center gap-3 px-3 pb-3 pt-1">
          <Img src={shop.logo} className="w-14 h-14 rounded-lg object-cover bg-white" alt={shop.name} />
          <div className="flex-1 min-w-0 text-white">
            <div className="text-[16px] font-semibold truncate">{shop.name}</div>
            <div className="text-[12px] text-white/80 mt-0.5">{shop.fans}</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'shop.follow.toggle' }, { onTrigger: () => { followShop(shop.id); showToast(followed ? '已取消关注' : '已关注店铺'); } })}
            className={`px-3 h-7 rounded-full text-[13px] flex items-center gap-1 ${followed ? 'bg-white/20 text-white' : 'bg-white text-[#E1251B]'}`}
          >{followed ? <><IcCheck size={13} />已关注</> : '+ 关注'}</button>
          <button
            {...bindTap('shop.cs-open', { params: { chatId }, beforeTrigger: () => ensureShopChat(shop.id) })}
            className="flex flex-col items-center text-white text-[10px]"
          ><IcHeadphones size={20} />客服</button>
        </div>
      </div>

      {/* tab */}
      <div className="shrink-0 flex bg-white border-b border-[#F0F0F0]">
        {TABS.map((t, i) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'shop.tab.select.section' }, { onTrigger: () => setTab(i) })}
            className={`flex-1 py-2.5 text-[15px] ${tab === i ? 'text-[#E1251B] font-semibold' : 'text-[#666]'}`}
          >
            {t}
            {tab === i && <div className="mx-auto mt-1 w-5 h-0.5 rounded bg-[#E1251B]" />}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="shop-feed" data-scroll-direction="vertical">
        {tab === 2 ? (
          <EmptyState text="暂无评价" />
        ) : (
          <div className="grid grid-cols-2 gap-2 p-2">
            {list.map((it) => (
              <ItemCard key={it.id} item={it} openBind={bindTap('shop.item-open', { params: { itemId: it.id } })} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

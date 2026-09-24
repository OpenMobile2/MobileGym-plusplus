import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, ShopBadge, EmptyState } from '../components/ui';

/** 关注店铺(迭代#3 铁律②:补齐"我的淘宝"四格中的关注店铺入口) */
export default function FollowedShopsPage() {
  const { bindTap } = useTaobaoGestures();
  const followedShops = useTaobaoStore((s) => s.followedShops);
  const shops = useTaobaoStore((s) => s.shops);

  const followed = followedShops
    .map((id) => shops.find((x) => x.id === id))
    .filter(Boolean) as typeof shops;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar title={`关注店铺(${followed.length})`} />
      <div className="flex-1 overflow-y-auto px-2.5" data-scroll-container="follow-shops" data-scroll-direction="vertical">
        {followed.length === 0 ? (
          <EmptyState text="还没有关注的店铺" hint="进店点「关注」即可收藏店铺" />
        ) : (
          followed.map((shop) => (
            <div
              key={shop.id}
              {...bindTap('followShops.shop-open', { params: { shopId: shop.id } })}
              className="bg-white rounded-xl mt-2 p-3 flex items-center gap-2.5 cursor-pointer"
            >
              <Img src={shop.logo} className="w-12 h-12 rounded-xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center text-[14px] font-semibold">
                  <ShopBadge badge={shop.badge} />{shop.name}
                </div>
                <div className="text-[11px] text-[#999999] mt-0.5">
                  ★ {shop.rating} · {shop.fans}粉丝 · 好评率{shop.positiveRate}
                </div>
              </div>
              <span className="text-[#999999]">›</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

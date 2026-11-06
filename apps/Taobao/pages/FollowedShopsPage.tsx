import React from 'react';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, Img, ShopBadge, EmptyState } from '../components/ui';
import { fmt } from '../utils/format';

/** 关注店铺(迭代#3 铁律②:补齐「我的淘宝」四格中的关注店铺入口) */
export default function FollowedShopsPage() {
  const { bindTap } = useTaobaoGestures();
  const s = useStrings();
  const followedShops = useTaobaoStore((st) => st.followedShops);
  const shops = useTaobaoStore((st) => st.shops);

  const followed = followedShops
    .map((id) => shops.find((x) => x.id === id))
    .filter(Boolean) as typeof shops;

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar title={fmt(s.followedShopsTitleFmt, { count: followed.length })} />
      <div className="flex-1 overflow-y-auto px-2.5" data-scroll-container="follow-shops" data-scroll-direction="vertical">
        {followed.length === 0 ? (
          <EmptyState text={s.noFollowedShopsText} hint={s.noFollowedShopsHint} />
        ) : (
          followed.map((shop) => (
            <div
              key={shop.id}
              {...bindTap('followShops.shop-open', { params: { shopId: shop.id } })}
              className="bg-app-surface rounded-xl mt-2 p-3 flex items-center gap-2.5 cursor-pointer"
            >
              <Img src={shop.logo} className="w-12 h-12 rounded-xl" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center text-[14px] font-semibold">
                  <ShopBadge badge={shop.badge} />{shop.name}
                </div>
                <div className="text-[11px] text-app-text-muted mt-0.5">
                  {fmt(s.shopStatsFmt, { rating: shop.rating, fans: shop.fans, rate: shop.positiveRate })}
                </div>
              </div>
              <span className="text-app-text-muted">›</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import type { Shop } from '../types';
import { Stars } from './Stars';
import { fmtDistance } from '../utils/appTime';
import { computeOpenStatus } from '../utils/openStatus';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { shopCoverUrl } from '../assets';

type ShopOpenId = 'food.shop-open' | 'fav.shop-open' | 'history.shop-open';

export function ShopCard({
  shop,
  transitionId = 'food.shop-open',
  dense = false,
}: {
  shop: Shop;
  transitionId?: ShopOpenId;
  dense?: boolean;
}) {
  const { bindTap } = useDianpingGestures();
  const s = useAppStrings(strings, stringsEn);
  const status = computeOpenStatus(shop.hours);
  const statusText =
    status === 'open' ? s.openNow : status === 'closingSoon' ? s.closingSoon : s.closed;
  const statusColor =
    status === 'open' ? 'text-[#00B578]' : status === 'closingSoon' ? 'text-[#FF8A00]' : 'text-(--app-c-text-muted)';
  const deal = shop.deals[0];

  const tap =
    transitionId === 'fav.shop-open'
      ? bindTap('fav.shop-open', { params: { shopId: shop.id } })
      : transitionId === 'history.shop-open'
        ? bindTap('history.shop-open', { params: { shopId: shop.id } })
        : bindTap('food.shop-open', { params: { shopId: shop.id } });

  const thumb = dense ? 'h-[78px] w-[78px]' : 'h-[90px] w-[90px]';
  const cover = shopCoverUrl(shop.id);

  return (
    <button
      type="button"
      className="flex w-full gap-2.5 border-none bg-(--app-c-card-bg) px-3 py-3 text-left cursor-pointer"
      {...tap}
    >
      <div
        className={`${thumb} relative shrink-0 overflow-hidden rounded-[8px]`}
        style={{ background: shop.coverColor }}
      >
        {cover ? (
          <img src={cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-1.5 pb-1 pt-4">
          <span className="line-clamp-2 text-[10px] font-semibold leading-tight text-white">
            {shop.coverLabel}
          </span>
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold leading-snug text-(--app-c-text-primary)">{shop.name}</div>
        <div className="mt-[3px] flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Stars score={shop.score} size={11} />
          <span className="text-[11px] text-(--app-c-text-muted)">
            {shop.reviewCount}
            {s.reviews}
          </span>
          <span className="text-[11px] text-(--app-c-text-secondary)">
            ¥{shop.avgPrice}
            {s.perPerson}
          </span>
        </div>
        <div className="mt-[3px] flex items-center justify-between text-[11px] text-(--app-c-text-muted)">
          <span className="truncate">
            {shop.category} {shop.district}
          </span>
          <span className="ml-2 shrink-0">{fmtDistance(shop.distanceM)}</span>
        </div>
        <div className="mt-[2px] flex items-center gap-2 text-[11px]">
          <span className={`font-medium ${statusColor}`}>{statusText}</span>
          {shop.tags[0] ? (
            <span className="rounded-[3px] bg-[#FFF1EA] px-1 py-[1px] text-[10px] text-[#FF6633]">
              {shop.tags[0]}
            </span>
          ) : null}
        </div>
        {deal ? (
          <div className="mt-[4px] flex items-center gap-1 text-[11px] text-(--app-c-text-secondary)">
            <span className="inline-flex h-[14px] w-[14px] items-center justify-center rounded-[2px] bg-[#FF6633] text-[9px] font-bold text-white">
              券
            </span>
            <span className="font-semibold text-[#FF6633]">¥{deal.price}</span>
            <span className="truncate">{deal.title}</span>
          </div>
        ) : null}
      </div>
    </button>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcSearch, IcThumbs, IcStarOutline, IcStar } from '../res/icons';
import { dishImageUrl } from '../assets';

export default function DishesPage() {
  const { shopId = '' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, action } = useDianpingGestures();
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === shopId));
  const favoriteDishIds = useDianpingStore((st) => st.favoriteDishIds);
  const toggleFavoriteDish = useDianpingStore((st) => st.toggleFavoriteDish);
  const toggleDishLike = useDianpingStore((st) => st.toggleDishLike);
  const showToast = useDianpingStore((st) => st.showToast);

  if (!shop) {
    return (
      <div className="p-4">
        <button type="button" {...bindBack()} className="cursor-pointer border-none bg-transparent">
          <IcBack size={22} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex h-11 items-center px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-1.5" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="flex flex-1 items-end justify-center gap-6">
          <div className="relative pb-1 text-[15px] font-bold text-[#222]">
            {s.dishes}
            <span className="absolute bottom-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#FF6633]" />
          </div>
          <button
            type="button"
            className="pb-1 text-[15px] text-[#666] border-none bg-transparent cursor-pointer"
            {...action('dishes.menu.open.disabled', () => showToast(s.notOpen))}
          >
            {s.menuTab}
          </button>
        </div>
        <button
          type="button"
          className="cursor-pointer border-none bg-transparent p-1.5 text-[#333]"
          {...action('dishes.search.open.disabled', () => showToast(s.notOpen))}
        >
          <IcSearch size={18} />
        </button>
      </div>

      <div className="px-3 py-2 text-[14px] font-semibold text-[#222]">
        网友推荐菜 ({shop.dishes.length})
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="dishes"
        data-scroll-direction="vertical"
      >
        {shop.dishes.map((d, idx) => {
          const key = `${shop.id}:${d.id}`;
          const fav = favoriteDishIds.includes(key);
          const top = idx < 3;
          return (
            <div key={d.id} className="flex gap-2.5 border-b border-[#F5F5F5] px-3 py-3">
              <div
                className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-[6px]"
                style={{ background: shop.coverColor }}
              >
                {dishImageUrl(shop.id, d.id) ? (
                  <img
                    src={dishImageUrl(shop.id, d.id)}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <span
                  className={`absolute left-0 top-0 rounded-br px-1.5 py-0.5 text-[9px] font-bold text-white ${
                    top ? 'bg-gradient-to-r from-[#FF4B33] to-[#FF8A4C]' : 'bg-[#C4A574]'
                  }`}
                >
                  TOP {idx + 1}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-bold text-[#222]">{d.name}</div>
                <div className="mt-0.5 text-[13px] font-semibold text-[#222]">¥{d.price}</div>
                <div className="mt-1 inline-block rounded-[3px] bg-[#F5F5F5] px-1.5 py-0.5 text-[10px] text-[#999]">
                  近三月人气推荐
                </div>
                <div className="mt-1.5 text-[11px] text-[#999]">
                  “{d.recommendCount}
                  {s.recommendCount}，值得一试”
                </div>
              </div>
              <div className="flex w-10 shrink-0 flex-col items-center justify-center gap-3">
                <button
                  type="button"
                  className="flex flex-col items-center border-none bg-transparent text-[10px] text-[#999] cursor-pointer"
                  {...action('dishes.like.toggle', () => toggleDishLike(shop.id, d.id), {
                    params: { id: d.id },
                  })}
                >
                  <IcThumbs size={18} className={d.liked ? 'text-[#FF6633]' : 'text-[#999]'} />
                  {d.recommendCount}
                </button>
                <button
                  type="button"
                  className="flex flex-col items-center border-none bg-transparent text-[10px] text-[#999] cursor-pointer"
                  {...action('dishes.favorite.toggle', () => toggleFavoriteDish(shop.id, d.id), {
                    params: { id: d.id },
                  })}
                >
                  {fav ? (
                    <IcStar size={18} className="text-[#FF6633]" />
                  ) : (
                    <IcStarOutline size={18} />
                  )}
                  {s.favorite}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

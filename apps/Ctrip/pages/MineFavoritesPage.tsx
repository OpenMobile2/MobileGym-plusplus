import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Img, EmptyState } from '../components/ui';

/** 收藏 / 浏览记录：酒店 + 景点。 */
export default function MineFavoritesPage() {
  const s = useCtripStrings();
  const [sp] = useSearchParams();
  const mode = sp.get('mode') === 'browse' ? 'browse' : 'fav';
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((st) => st.hotels);
  const attractions = useCtripStore((st) => st.attractions);
  const favHotelIds = useCtripStore((st) => st.favoriteHotels);
  const favAttrIds = useCtripStore((st) => st.favoriteAttractions ?? []);
  const browseIds = useCtripStore((st) => st.browseHistory ?? []);

  const items = React.useMemo(() => {
    if (mode === 'browse') {
      return browseIds.map((id) => {
        const h = hotels.find((x) => x.id === id);
        if (h) return { kind: 'hotel' as const, id: h.id, name: h.name, image: h.image, sub: `${h.city} · ${h.district} · ${h.score}分`, price: h.price };
        const a = attractions.find((x) => x.id === id);
        if (a) return { kind: 'ticket' as const, id: a.id, name: a.name, image: a.image, sub: `${a.city || ''} · ${a.district} · ${a.score}分`, price: a.ticketTypes[0]?.price ?? 0 };
        return null;
      }).filter(Boolean);
    }
    const hotelItems = favHotelIds.map((id) => {
      const h = hotels.find((x) => x.id === id);
      return h ? { kind: 'hotel' as const, id: h.id, name: h.name, image: h.image, sub: `${h.city} · ${h.district} · ${h.score}分`, price: h.price } : null;
    });
    const attrItems = favAttrIds.map((id) => {
      const a = attractions.find((x) => x.id === id);
      return a ? { kind: 'ticket' as const, id: a.id, name: a.name, image: a.image, sub: `${a.city || ''} · ${a.district} · ${a.score}分`, price: a.ticketTypes[0]?.price ?? 0 } : null;
    });
    return [...hotelItems, ...attrItems].filter(Boolean);
  }, [mode, browseIds, favHotelIds, favAttrIds, hotels, attractions]);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={mode === 'browse' ? s.t('浏览记录') : s.t('我的收藏')} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {items.length === 0 ? (
          <EmptyState text={mode === 'browse' ? s.t('暂无浏览记录') : s.t('暂无收藏')} hint={s.t('去酒店/景点详情页点亮爱心试试')} />
        ) : items.map((it) => it && (
          <button
            key={`${it.kind}-${it.id}`}
            {...bindTap(it.kind === 'hotel' ? 'hotelList.toDetail' : 'ticketList.toDetail', { params: { id: it.id, ...(it.kind === 'hotel' ? { source: 'favorites' } : {}) } })}
            className="w-full flex gap-3 bg-white mx-2 mt-2 rounded-xl p-3 border-none cursor-pointer text-left"
            style={{ width: 'calc(100% - 1rem)' }}
          >
            <Img src={it.image} className="w-20 h-20 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold line-clamp-1">{it.name}</div>
              <div className="text-[12px] text-[#999999] mt-1">{it.sub}</div>
              <div className="text-[14px] text-[#FF6A2C] mt-1">¥{it.price}起</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

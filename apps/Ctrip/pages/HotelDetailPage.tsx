import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, usePanel, useToast, PrimaryBtn, StarLabel } from '../components/ui';
import { IcHeart, IcShare, IcMore, IcService } from '../res/icons';
import { WONTFIX_TOAST } from '../constants';

const DETAIL_TABS = [
  { id: 'cover', label: '亮点' },
  { id: 'facilities', label: '设施' },
  { id: 'review', label: '点评' },
  { id: 'policy', label: '政策' },
];

/** 酒店详情(spec hotel.detail)。查看房型→room;收藏toggle(Q5);点评→review;设施→facilities;问酒店→cs;更多→快捷面板浮层;分享wontfix。 */
export default function HotelDetailPage() {
  const { id = '' } = useParams();
  const { bindTap, go } = useCtripGestures();
  const { value: panel, open, close } = usePanel('more');
  const [toast, showToast] = useToast();
  const hotels = useCtripStore((s) => s.hotels);
  const favorites = useCtripStore((s) => s.favoriteHotels);
  const toggleFav = useCtripStore((s) => s.toggleHotelFavorite);
  const [tab, setTab] = React.useState('cover');

  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];
  const faved = favorites.includes(hotel.id);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={<span className="text-[15px] line-clamp-1">{hotel.name}</span>}
        rightContent={
          <>
            <button
              {...bindTap({ kind: 'action', id: 'hotelDetail.share.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })}
              className="bg-transparent border-none cursor-pointer p-0"
            ><IcShare size={18} className="text-[#333333]" /></button>
            <button
              {...bindTap({ kind: 'action', id: 'hotelDetail.more.open' }, { onTrigger: () => open('panel') })}
              className="bg-transparent border-none cursor-pointer p-0"
            ><IcMore size={20} className="text-[#333333]" /></button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 封面相册 */}
        <div className="relative">
          <Img src={hotel.gallery[0] ?? hotel.image} className="w-full h-52 object-cover" />
          <div className="absolute right-2 bottom-2 bg-black/50 text-white text-[11px] rounded-full px-2 py-0.5">{hotel.gallery.length}图</div>
          <button
            {...bindTap({ kind: 'action', id: 'hotelDetail.favorite.toggle' }, { onTrigger: () => { toggleFav(hotel.id); showToast(faved ? '已取消收藏' : '已收藏'); } })}
            className="absolute right-2 top-2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center border-none cursor-pointer"
          >
            <IcHeart size={18} className={faved ? 'text-[#FF3B5C]' : 'text-white'} />
          </button>
        </div>

        {/* 标题/评分 */}
        <div className="bg-white px-3 py-3">
          <div className="text-[18px] font-bold text-[#111111]">{hotel.name}</div>
          <div className="flex items-center gap-2 mt-1">
            <StarLabel star={hotel.star} />
            <span className="text-[12px] text-[#999999]">{hotel.openYear}</span>
          </div>
          <button
            {...bindTap('hotelDetail.toReview', { params: { id: hotel.id } })}
            className="mt-2 w-full flex items-center justify-between bg-[#F7FAFF] rounded-lg px-3 py-2 border-none cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-[20px] font-bold text-[#0086F6]">{hotel.score}</span>
              <span className="text-[13px] text-[#333333]">超棒 · {hotel.reviewCount}条点评</span>
            </span>
            <span className="text-[#CCCCCC]">›</span>
          </button>
        </div>

        {/* tab */}
        <div className="bg-white flex border-t border-[#F2F2F2] mt-2">
          {DETAIL_TABS.map((t) => {
            const on = t.id === tab;
            const isReview = t.id === 'review';
            const isFac = t.id === 'facilities';
            const props = isReview
              ? bindTap('hotelDetail.toReview', { params: { id: hotel.id } })
              : isFac
                ? bindTap('hotelDetail.toFacilities', { params: { id: hotel.id } })
                : { onClick: () => setTab(t.id) };
            return (
              <button key={t.id} {...props} className={`flex-1 py-2.5 bg-transparent border-none cursor-pointer text-[14px] ${on ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}>{t.label}</button>
            );
          })}
        </div>

        {/* 亮点/设施摘要 */}
        <div className="bg-white px-3 py-3 mt-0.5">
          <div className="grid grid-cols-4 gap-y-3">
            {hotel.facilities.slice(0, 8).map((f) => (
              <div key={f} className="text-[12px] text-[#555555] text-center line-clamp-1">{f}</div>
            ))}
          </div>
          <button {...bindTap('hotelDetail.toFacilities', { params: { id: hotel.id } })} className="w-full text-center text-[13px] text-[#0086F6] mt-3 bg-transparent border-none cursor-pointer">查看全部设施与政策 ›</button>
        </div>

        {/* 房型入口 */}
        <div className="bg-white px-3 py-3 mt-2">
          <div className="text-[16px] font-semibold text-[#111111] mb-2">选择房型</div>
          {hotel.rooms.slice(0, 2).map((r) => (
            <div key={r.id} className="flex gap-2.5 py-2 border-b border-[#F5F5F5] last:border-0">
              <Img src={r.image} className="w-16 h-16 rounded-lg object-cover shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#222222] line-clamp-2">{r.name}</div>
                <div className="text-[11px] text-[#999999] mt-0.5">{r.area} · {r.bed} · {r.breakfast}</div>
              </div>
              <div className="text-right shrink-0 flex flex-col items-end justify-between">
                <Price value={r.price} size="m" />
                <button {...bindTap('hotelDetail.toRoom', { params: { id: hotel.id } })} className="text-[12px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-3 py-1 border-none cursor-pointer">订</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2 gap-3">
        <button {...bindTap('hotelDetail.toCs', { params: { id: hotel.id } })} className="flex flex-col items-center bg-transparent border-none cursor-pointer text-[#666666]">
          <IcService size={20} className="text-[#0086F6]" />
          <span className="text-[10px]">问酒店</span>
        </button>
        <PrimaryBtn binding={bindTap('hotelDetail.toRoom', { params: { id: hotel.id } })} className="flex-1">查看房型</PrimaryBtn>
      </div>

      {/* 快捷面板浮层(screenshot 437) */}
      {panel === 'panel' && (
        <div className="absolute inset-0 z-40" onClick={close}>
          <div className="absolute right-2 top-12 bg-white rounded-xl shadow-lg py-1 w-36" onClick={(e) => e.stopPropagation()}>
            {[
              { label: '首页', act: () => go('paySuccess.toHome') },
              { label: '消息', act: () => go('tabbar.message-open') },
              { label: '订单', act: () => go('mine.toOrders') },
              { label: '反馈', act: () => showToast(WONTFIX_TOAST) },
            ].map((it) => (
              <button key={it.label} onClick={() => { close(); it.act(); }} className="w-full text-left px-4 py-2.5 text-[14px] text-[#333333] bg-transparent border-none cursor-pointer hover:bg-[#F7F8FA]">{it.label}</button>
            ))}
          </div>
        </div>
      )}
      {toast}
    </div>
  );
}

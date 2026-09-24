import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, usePanel, useToast } from '../components/ui';
import { IcHeart } from '../res/icons';

/** 景点详情(spec ticket.detail)。tab切换(预订/点评/须知/周边);票种→booking;相册;收藏toast。 */
const TABS = [{ id: 'booking', label: '预订' }, { id: 'review', label: '点评' }, { id: 'notice', label: '须知' }, { id: 'around', label: '周边' }];

export default function TicketDetailPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel('gallery');
  const [toast, showToast] = useToast();
  const attractions = useCtripStore((s) => s.attractions);
  const a = attractions.find((x) => x.id === id) ?? attractions[0];
  const [tab, setTab] = React.useState('booking');
  const [faved, setFaved] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={<span className="text-[15px] line-clamp-1">{a.name}</span>}
        rightContent={
          <button {...bindTap({ kind: 'action', id: 'ticketDetail.favorite.toggle' }, { onTrigger: () => { setFaved((v) => !v); showToast(faved ? '已取消收藏' : '已收藏'); } })} className="bg-transparent border-none cursor-pointer p-0">
            <IcHeart size={18} className={faved ? 'text-[#FF3B5C]' : 'text-[#333333]'} />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 封面 */}
        <button {...bindTap({ kind: 'action', id: 'ticketDetail.gallery.open' }, { onTrigger: () => open('open') })} className="relative w-full p-0 border-none cursor-pointer block">
          <Img src={a.gallery[0] ?? a.image} className="w-full h-52 object-cover" />
          <span className="absolute right-2 bottom-2 bg-black/50 text-white text-[11px] rounded-full px-2 py-0.5">相册 {a.gallery.length} ›</span>
        </button>

        {/* 标题 */}
        <div className="bg-white px-3 py-3">
          <div className="text-[18px] font-bold">{a.name}</div>
          <div className="flex items-center gap-2 mt-1 text-[12px]">
            <span className="text-[#0086F6] font-semibold">{a.score}分</span>
            <span className="text-[#999999]">{a.reviewCount}</span>
            <span className="text-[#999999]">{a.openTime}</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {a.tags.map((t) => <span key={t} className="text-[10px] text-[#0086F6] bg-[#EAF4FF] rounded px-1.5 py-0.5">{t}</span>)}
          </div>
        </div>

        {/* tab */}
        <div className="bg-white flex mt-2 border-b border-[#F2F2F2]">
          {TABS.map((t) => (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'ticketDetail.tab.select.booking' }, { params: { tab: t.id }, onTrigger: () => setTab(t.id) })}
              className={`flex-1 py-2.5 text-[14px] bg-transparent border-none cursor-pointer ${tab === t.id ? 'text-[#0086F6] font-semibold' : 'text-[#666666]'}`}
            >{t.label}</button>
          ))}
        </div>

        {tab === 'booking' && (
          <div className="bg-white px-3 py-2">
            {a.ticketTypes.map((tk) => (
              <div key={tk.id} className="flex items-center justify-between py-3 border-b border-[#F5F5F5]">
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-[#222222]">{tk.name}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">{tk.desc}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Price value={tk.price} size="m" />
                  <button {...bindTap('ticketDetail.toBooking', { params: { id: a.id } })} className="text-[13px] text-white bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] rounded-full px-5 py-1.5 border-none cursor-pointer">预订</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {tab === 'review' && <div className="bg-white px-3 py-4 text-[13px] text-[#666666] leading-relaxed">游客点评:{a.reviewCount},综合{a.score}分。「景色很赞,适合全家出游」「排队有序,体验好」…</div>}
        {tab === 'notice' && <div className="bg-white px-3 py-4 text-[13px] text-[#666666] leading-relaxed">预订须知:{a.openTime};凭身份证/二维码入园;{a.ticketTypes[0]?.desc}。</div>}
        {tab === 'around' && <div className="bg-white px-3 py-4 text-[13px] text-[#666666] leading-relaxed">周边推荐:附近有多家酒店与餐饮,建议搭配一日游线路。</div>}

        {/* 简介 */}
        <div className="bg-white px-3 py-3 mt-2">
          <div className="text-[15px] font-semibold mb-1">景点介绍</div>
          <div className="text-[13px] text-[#555555] leading-relaxed">{a.intro}</div>
        </div>
      </div>

      {/* 底部 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto"><Price value={a.ticketTypes[0]?.price ?? 0} size="l" /><span className="text-[11px] text-[#999999]"> 起</span></div>
        <button {...bindTap('ticketDetail.toBooking', { params: { id: a.id } })} className="rounded-full bg-gradient-to-r from-[#FF9F45] to-[#FF6A2C] text-white text-[15px] font-medium px-8 py-2.5 border-none cursor-pointer">选购</button>
      </div>

      {panel === 'open' && (
        <div className="absolute inset-0 z-40 bg-black/90 flex flex-col" onClick={close}>
          <div className="flex-1 overflow-y-auto p-3 space-y-2" data-scroll-container="gallery" data-scroll-direction="vertical">
            {a.gallery.map((im, i) => <Img key={i} src={im} className="w-full rounded-lg" />)}
          </div>
          <button onClick={close} className="shrink-0 text-white text-[14px] py-3 bg-transparent border-none cursor-pointer">关闭</button>
        </div>
      )}
      {toast}
    </div>
  );
}

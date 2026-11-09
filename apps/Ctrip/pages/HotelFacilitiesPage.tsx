import { useCtripStrings } from '../hooks/useCtripStrings';
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { TopBar } from '../components/ui';

/** 酒店设施服务(spec hotel.facilities)。分类展示;返回详情由 TopBar 处理。 */

export default function HotelFacilitiesPage() {
  const s = useCtripStrings();
  const GROUPS = [
    { title: s.t('交通服务'), items: [s.t('私人停车场'), s.t('叫车服务'), s.t('充电桩'), s.t('接机服务')] },
    { title: s.t('亲子服务'), items: [s.t('儿童餐'), s.t('儿童玩具'), s.t('亲子房'), s.t('婴儿床')] },
    { title: s.t('餐饮服务'), items: [s.t('大堂吧'), s.t('咖啡厅'), s.t('送餐服务'), s.t('中式餐厅')] },
    { title: s.t('前台服务'), items: [s.t('24小时前台'), s.t('行李寄存'), s.t('快递服务'), s.t('叫醒服务')] },
    { title: s.t('商务服务'), items: [s.t('会议室'), s.t('商务中心'), s.t('传真/复印')] },
  ];
  const { id = '' } = useParams();
  const [sp] = useSearchParams();
  const hotels = useCtripStore((s) => s.hotels);
  const recordTaskAudit = useCtripStore((s) => s.recordTaskAudit);
  const hotel = hotels.find((h) => h.id === id);
  React.useEffect(() => {
    if (hotel) recordTaskAudit(`hotelFacilities:${hotel.id}`, true);
  }, [hotel, recordTaskAudit]);
  if (!hotel) {
    return (
      <div className="flex flex-col h-full bg-[#F5F6F8]">
        <TopBar title={s.t('酒店')} />
        <div className="flex-1 flex items-center justify-center text-[14px] text-[#999999]">{s.t('未找到该酒店')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={s.t('设施与服务')} backTo={`/hotel/${encodeURIComponent(hotel.id)}${sp.toString() ? `?${sp.toString()}` : ''}`} />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-3 py-3 mb-2">
          <div className="text-[13px] text-[#999999]">{hotel.name} · 共51项设施</div>
        </div>
        {GROUPS.map((g) => (
          <div key={g.title} className="bg-white px-3 py-3 mb-2">
            <div className="text-[15px] font-semibold text-[#111111] mb-2">{g.title}</div>
            <div className="grid grid-cols-3 gap-y-3">
              {g.items.map((it) => (
                <div key={it} className="text-[13px] text-[#555555] flex items-center gap-1">
                  <span className="text-[#0086F6]">·</span>{it}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

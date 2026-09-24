import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { TopBar } from '../components/ui';

/** 酒店设施服务(spec hotel.facilities)。分类展示;返回详情由 TopBar 处理。 */
const GROUPS = [
  { title: '交通服务', items: ['私人停车场', '叫车服务', '充电桩', '接机服务'] },
  { title: '亲子服务', items: ['儿童餐', '儿童玩具', '亲子房', '婴儿床'] },
  { title: '餐饮服务', items: ['大堂吧', '咖啡厅', '送餐服务', '中式餐厅'] },
  { title: '前台服务', items: ['24小时前台', '行李寄存', '快递服务', '叫醒服务'] },
  { title: '商务服务', items: ['会议室', '商务中心', '传真/复印'] },
];

export default function HotelFacilitiesPage() {
  const { id = '' } = useParams();
  const hotels = useCtripStore((s) => s.hotels);
  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="设施与服务" />
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

import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img } from '../components/ui';

/** 酒店点评(spec hotel.review)。评分维度/AI总结/晒图/筛选chip(有图/差评/标签)/点评列表。返回由 TopBar。 */
const FILTERS = ['全部', '有图', '好评', '差评', '性价比高', '服务好'];

export default function HotelReviewPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const hotels = useCtripStore((s) => s.hotels);
  const reviewMap = useCtripStore((s) => s.hotelReviews);
  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];
  const reviews = reviewMap[hotel.id] ?? reviewMap['h_atour'] ?? [];
  const [filter, setFilter] = React.useState('全部');

  const shown = filter === '有图' ? reviews.filter((r) => r.images.length > 0) : reviews;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="酒店点评" />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 评分概览 */}
        <div className="bg-white px-3 py-3 flex items-center gap-4">
          <div className="text-center">
            <div className="text-[30px] font-bold text-[#0086F6] leading-none">{hotel.score}</div>
            <div className="text-[12px] text-[#666666] mt-1">超棒</div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-y-1 text-[12px] text-[#666666]">
            {[['卫生', 4.8], ['环境', 4.7], ['服务', 4.9], ['设施', 4.6]].map(([k, v]) => (
              <div key={k as string} className="flex justify-between pr-3"><span>{k}</span><span className="text-[#333333]">{v}</span></div>
            ))}
          </div>
        </div>

        {/* AI 总结 */}
        <div className="bg-white px-3 py-3 mt-2">
          <div className="text-[13px] text-[#0086F6] font-semibold mb-1">✨ AI 点评总结</div>
          <div className="text-[13px] text-[#555555] leading-relaxed">住客普遍反馈位置优越、离景区近,前台服务热情,房间干净整洁,早餐口味不错。整体性价比高,适合家庭出行。</div>
        </div>

        {/* 筛选chips */}
        <div className="bg-white px-3 py-2 mt-2 flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              {...bindTap({ kind: 'action', id: 'hotelReview.filter.select.withpic' }, { params: { filter: f }, onTrigger: () => setFilter(f) })}
              className={`shrink-0 text-[12px] rounded-full px-3 py-1 border cursor-pointer ${filter === f ? 'bg-[#E6F3FF] text-[#0086F6] border-[#0086F6]' : 'bg-[#F7F8FA] text-[#555555] border-transparent'}`}
            >{f}</button>
          ))}
        </div>

        {/* 点评列表 */}
        <div className="mt-2">
          {shown.map((r) => (
            <div key={r.id} className="bg-white px-3 py-3 mb-0.5">
              <div className="flex items-center gap-2">
                <Img src={r.avatar} className="w-8 h-8 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="text-[13px] text-[#222222]">{r.user}</div>
                  <div className="text-[11px] text-[#999999]">{r.level} · {r.date}</div>
                </div>
                <span className="text-[13px] font-semibold text-[#0086F6]">{r.score}分</span>
              </div>
              <div className="text-[13px] text-[#333333] mt-2 leading-relaxed">{r.content}</div>
              {r.images.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {r.images.map((im, i) => (
                    <Img key={i} src={im} className="w-20 h-20 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <div className="text-[11px] text-[#999999] mt-2">{r.roomType}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, PrimaryBtn } from '../components/ui';

/** 车型详情(spec car.detail)。相册/配置/积分抵扣/取还车/无忧租/评价;订→booking。 */
export default function CarDetailPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const cars = useCtripStore((s) => s.carModels);
  const c = cars.find((x) => x.id === id) ?? cars[0];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={<span className="text-[15px] line-clamp-1">{c.name}</span>} />
      <div className="flex-1 overflow-y-auto pb-16" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white"><Img src={c.image} className="w-full h-48 object-contain" /></div>

        <div className="bg-white px-4 py-3 mt-2">
          <div className="text-[18px] font-bold">{c.name}</div>
          <div className="text-[12px] text-[#999999] mt-1">{c.seats} · {c.energy} · 续航{c.range}</div>
          <div className="flex flex-wrap gap-1 mt-2">
            {c.tags.map((t) => <span key={t} className="text-[11px] text-[#0086F6] bg-[#EAF4FF] rounded px-1.5 py-0.5">{t}</span>)}
          </div>
        </div>

        <div className="bg-white px-4 py-3 mt-2">
          <div className="text-[15px] font-semibold mb-2">配置信息</div>
          <div className="grid grid-cols-3 gap-y-2 text-[12px] text-[#666666]">
            {[['座位', c.seats], ['能源', c.energy], ['续航', c.range], ['变速', '自动'], ['天窗', '有'], ['ETC', '含']].map(([k, v]) => (
              <div key={k as string}><span className="text-[#999999]">{k}:</span>{v}</div>
            ))}
          </div>
        </div>

        <div className="bg-[#FFF7E0] mx-4 mt-2 rounded-lg px-3 py-2 text-[12px] text-[#B8860B]">积分抵扣:铂金会员本单可用积分抵 ¥50</div>

        <div className="bg-white px-4 py-3 mt-2">
          <div className="text-[15px] font-semibold mb-1">无忧租保障</div>
          <div className="text-[13px] text-[#666666]">含基础保障,可升级尊享服务,免除事故自付。</div>
        </div>

        <div className="bg-white px-4 py-3 mt-2">
          <div className="text-[15px] font-semibold mb-1">用户评价</div>
          <div className="text-[13px] text-[#666666]">4.9分 · 「车况新,取还方便」「客服响应快」</div>
        </div>
      </div>

      <div className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center px-3 py-2">
        <div className="mr-auto"><Price value={c.totalPrice} size="l" /><div className="text-[11px] text-[#999999]">2天总价</div></div>
        <PrimaryBtn binding={bindTap('carDetail.toBooking', { params: { id: c.id } })} variant="orange" className="px-10">订</PrimaryBtn>
      </div>
    </div>
  );
}

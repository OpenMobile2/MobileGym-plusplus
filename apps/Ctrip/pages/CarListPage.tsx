import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Img, Price, BottomSheet, usePanel } from '../components/ui';

/** 租车车型列表(spec car.list)。车型卡→detail;筛选;修改取还车信息弹层。 */
export default function CarListPage() {
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const cars = useCtripStore((s) => s.carModels);

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="选择车型" />
      {/* 取还车条 */}
      <button {...bindTap({ kind: 'action', id: 'carList.editPickup.open' }, { onTrigger: () => open('edit') })} className="shrink-0 w-full bg-white px-4 py-2.5 text-left border-b border-[#F0F0F0] border-x-0 border-t-0 cursor-pointer flex items-center justify-between">
        <span className="text-[13px] text-[#333333]">虹桥机场T2 取 · 07-05 10:00 → 07-07 10:00</span>
        <span className="text-[13px] text-[#0086F6]">修改</span>
      </button>

      {/* 排序/筛选 */}
      <div className="shrink-0 bg-white flex text-[13px] text-[#333333] border-b border-[#F0F0F0]">
        <button {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">综合排序 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">座位/配置 ▾</button>
        <button {...bindTap({ kind: 'action', id: 'carList.filter.open' }, { onTrigger: () => open('filter') })} className="flex-1 py-2 bg-transparent border-none cursor-pointer">更多筛选 ▾</button>
      </div>

      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {cars.map((c) => (
          <div key={c.id} {...bindTap('carList.toDetail', { params: { id: c.id } })} className="bg-white mx-2 mt-2 rounded-xl p-3 cursor-pointer">
            <div className="flex gap-3">
              <Img src={c.image} className="w-28 h-20 object-contain shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold line-clamp-1">{c.name}</div>
                <div className="text-[11px] text-[#999999] mt-1">{c.seats} · {c.energy} · 续航{c.range}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {c.tags.slice(0, 3).map((t) => <span key={t} className="text-[10px] text-[#0086F6] bg-[#EAF4FF] rounded px-1 py-0.5">{t}</span>)}
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between mt-2 pt-2 border-t border-[#F5F5F5]">
              {c.rankLabel && <span className="text-[10px] text-[#B8860B] bg-[#FFF7E0] rounded px-1 py-0.5">{c.rankLabel}</span>}
              <div className="ml-auto text-right">
                <Price value={c.totalPrice} size="m" /><span className="text-[11px] text-[#999999]"> 总价</span>
                <div className="text-[11px] text-[#999999]">¥{c.pricePerDay}/天起</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {panel === 'filter' && (
        <BottomSheet title="筛选" onClose={close}>
          <div className="p-4 space-y-3">
            {[['座位', ['5座', '7座', 'SUV']], ['能源', ['纯电', '汽油', '混动']], ['服务', ['含无忧租', 'ETC', '免押']]].map(([g, opts]) => (
              <div key={g as string}>
                <div className="text-[13px] text-[#999999] mb-2">{g}</div>
                <div className="flex flex-wrap gap-2">{(opts as string[]).map((o) => <span key={o} className="text-[13px] bg-[#F2F4F7] rounded px-3 py-1.5">{o}</span>)}</div>
              </div>
            ))}
            <button onClick={close} className="w-full mt-2 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">确定</button>
          </div>
        </BottomSheet>
      )}
      {panel === 'edit' && (
        <BottomSheet title="修改取还车信息" onClose={close}>
          <div className="p-4 text-[13px] text-[#666666]">
            取车:虹桥机场T2 · 07-05 10:00<br />还车:虹桥机场T2 · 07-07 10:00
            <button onClick={close} className="w-full mt-4 py-3 rounded-full bg-[#0086F6] text-white text-[15px] border-none cursor-pointer">确定</button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, PriceYuan } from '../components/ui';

const SLOTS = [
  { time: '10:00', label: '抢购中', state: 'ongoing' },
  { time: '12:00', label: '即将开抢', state: 'upcoming' },
  { time: '14:00', label: '即将开抢', state: 'upcoming' },
  { time: '16:00', label: '即将开抢', state: 'upcoming' },
  { time: '18:00', label: '即将开抢', state: 'upcoming' },
];

export function SeckillPage() {
  const { bindTap } = useJingdongGestures();
  const items = useJingdongStore((s) => s.items);
  const [slot, setSlot] = useState(0);
  const ongoing = SLOTS[slot].state === 'ongoing';

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="light">
      <div className="shrink-0 bg-gradient-to-b from-[#E1251B] to-[#FF4E33] pt-10">
        <TopBar title="限时秒杀" foreground="light" />
        {/* 场次时间轴 */}
        <div className="overflow-x-auto no-scrollbar pb-3">
          <div className="flex gap-6 px-4 whitespace-nowrap">
            {SLOTS.map((s, i) => {
              const on = i === slot;
              return (
                <button
                  key={s.time}
                  {...bindTap({ kind: 'action', id: 'seckill.session.select.slot' }, { params: { slot: s.time }, onTrigger: () => setSlot(i) })}
                  className="flex flex-col items-center shrink-0"
                >
                  <span className={`text-[19px] font-bold ${on ? 'text-white' : 'text-white/70'}`}>{s.time}</span>
                  <span className={`mt-1 text-[11px] px-2 py-0.5 rounded-full ${on ? 'bg-white text-[#E1251B] font-semibold' : 'text-white/80'}`}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="seckill-feed" data-scroll-direction="vertical">
        <div className="flex flex-col gap-2 p-2">
          {items.map((it, idx) => {
            const pct = 40 + ((idx * 13) % 55); // 已抢百分比
            return (
              <div key={it.id} {...bindTap('seckill.item-open', { params: { itemId: it.id } })} className="flex gap-3 bg-white rounded-xl p-3 text-left">
                <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-[#F5F5F5]">
                  <Img src={it.image} className="w-full h-full object-cover" alt={it.title} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="text-[14px] leading-[18px] text-[#1A1A1A] line-clamp-2">{it.title}</div>
                  {/* 进度条 */}
                  <div className="mt-2 h-4 rounded-full bg-[#FFE3DE] relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF4E33] to-[#E1251B] rounded-full" style={{ width: `${pct}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-semibold">
                      {ongoing ? `已抢${pct}%` : '即将开抢'}
                    </span>
                  </div>
                  <div className="flex items-end justify-between mt-auto pt-2 gap-2">
                    <div className="flex items-baseline gap-1 min-w-0 flex-wrap">
                      <span className="text-[10px] text-white bg-[#E1251B] px-1 rounded-sm shrink-0">秒杀价</span>
                      <PriceYuan value={it.price} className="text-[#E1251B] text-[18px]" />
                      <span className="text-[11px] text-[#BBB] line-through">¥{it.originPrice}</span>
                    </div>
                    <button
                      {...bindTap('seckill.grab-open', { params: { itemId: it.id } })}
                      className="shrink-0 px-3 h-7 rounded-full bg-gradient-to-r from-[#FF4E33] to-[#E1251B] text-white text-[12px] font-semibold whitespace-nowrap"
                    >
                      {ongoing ? '马上抢' : '提醒我'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

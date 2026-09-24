import React, { useState } from 'react';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, Price, DiscountTag, Countdown, useToast, VIP } from '../components/ui';
import { FLASH_CATEGORIES } from '../constants';
import { IcFlash } from '../res/icons';

export default function FlashPage() {
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();

  const items = useVipshopStore((s) => s.items);
  const brands = useVipshopStore((s) => s.brands);

  const [cat, setCat] = useState<string>(FLASH_CATEGORIES[0].id);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="限时秒杀" />

      {/* 玫红→紫斜向渐变头部 */}
      <div className="shrink-0 px-3 py-3" style={{ background: 'linear-gradient(135deg,#E4007F,#7A3CFF)' }}>
        <div className="flex items-center gap-2">
          <IcFlash size={18} className="text-white" />
          <span className="text-[17px] font-bold text-white">限时秒杀</span>
          <span className="text-[12px] text-white opacity-90">24小时不间断</span>
          <span className="flex-1" />
          <span className="text-[11px] text-white opacity-90">距结束</span>
          <Countdown endsAt={brands[0]?.endsAt ?? 0} dark={false} />
        </div>
      </div>

      {/* 品类 tab */}
      <div className="shrink-0 bg-white flex overflow-x-auto no-scrollbar px-2 border-b border-[#F5F5F5]">
        {FLASH_CATEGORIES.map((c) => {
          const on = c.id === cat;
          return (
            <button
              key={c.id}
              {...bindTap({ kind: 'action', id: 'flash.category.select.target' }, {
                params: { target: c.id },
                onTrigger: () => setCat(c.id),
              })}
              className={`shrink-0 px-4 py-2 text-[14px] bg-transparent border-none cursor-pointer ${on ? 'font-semibold' : 'text-[#666666]'}`}
              style={on ? { color: VIP.red } : undefined}
            >
              {c.label}
              {on && <span className="block h-0.5 w-5 mx-auto mt-0.5 rounded-full" style={{ background: VIP.red }} />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="flash-list" data-scroll-direction="vertical">
        <div className="flex flex-col gap-2 p-2">
          {items.map((it) => (
            <div key={it.id} className="bg-white rounded-lg p-2.5 flex gap-2.5">
              <div {...bindTap('flash.item-open', { params: { id: it.id } })} className="shrink-0 cursor-pointer">
                <Img src={it.image} className="w-24 h-24 rounded-lg object-cover" />
              </div>
              <div className="flex-1 min-w-0 flex flex-col">
                <div {...bindTap('flash.item-open', { params: { id: it.id } })} className="text-[13px] text-[#222222] line-clamp-2 cursor-pointer">{it.title}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <DiscountTag text={it.discountText} />
                  <span className="text-[11px] text-[#888888]">{it.sold}</span>
                </div>
                <div className="flex-1" />
                <div className="flex items-end justify-between mt-1">
                  <div className="flex items-baseline gap-1 min-w-0">
                    <Price value={it.price} size="l" />
                    <span className="text-[10px] text-[#BBBBBB] line-through shrink-0">¥{it.originPrice}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      {...bindTap({ kind: 'action', id: 'flash.remind.submit' }, {
                        params: { itemId: it.id },
                        onTrigger: () => showToast('开抢提醒已设置'),
                      })}
                      className="text-[12px] rounded-full px-3 py-1 cursor-pointer bg-white"
                      style={{ color: VIP.red, border: `1px solid ${VIP.red}` }}
                    >
                      提醒我
                    </button>
                    <button
                      {...bindTap('flash.grab-open', { params: { id: it.id } })}
                      className="text-[13px] rounded-full px-4 py-1 cursor-pointer text-white font-semibold border-none"
                      style={{ background: VIP.red }}
                    >
                      抢
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="h-3" />
      </div>
      {toast}
    </div>
  );
}

import React from 'react';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, useToast, Img, Price, BottomSheet, usePanel } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 行程 Tab：添加走品类入口，同步单独入口。 */
export default function TripMainPage() {
  const s = useCtripStrings();
  const { bindTap } = useCtripGestures();
  const { value: panel, open, close } = usePanel();
  const [toast, showToast] = useToast();
  const orders = useCtripStore((st) => st.orders);
  const upcoming = orders.filter((o) => o.status === 'upcoming');
  const unpaid = orders.filter((o) => o.status === 'unpaid');

  const CAT: Record<string, string> = {
    hotel: s.t('酒店'), train: s.t('火车'), flight: s.t('机票'), ticket: s.t('门票'), car: s.t('租车'),
  };
  const ADD_ITEMS = [
    { label: s.t('订酒店'), transition: 'home.hotel-open' as const },
    { label: s.t('订机票'), transition: 'home.flight-open' as const },
    { label: s.t('订火车'), transition: 'home.train-open' as const },
    { label: s.t('订门票'), transition: 'home.ticket2-open' as const },
    { label: s.t('租车'), transition: 'home.car-open' as const },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar
        title={s.tabTrip}
        showBack={false}
        rightContent={<button {...bindTap({ kind: 'action', id: 'trip.add.open' }, { onTrigger: () => open('add') })} className="text-[#0086F6] text-[13px] bg-transparent border-none cursor-pointer">{s.t('+ 添加')}</button>}
      />
      <div className="flex-1 overflow-y-auto pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <button {...bindTap({ kind: 'action', id: 'trip.plan.wontfix' }, { onTrigger: () => showToast(WONTFIX_TOAST) })} className="mx-2 mt-2 w-[calc(100%-1rem)] rounded-xl overflow-hidden border-none cursor-pointer p-0 text-left relative h-28 bg-gradient-to-br from-[#6D5BFF] to-[#33A5FF] flex flex-col justify-center px-4">
          <span className="text-white text-[16px] font-semibold">{s.t('智能线路规划')}</span>
          <span className="text-white/85 text-[12px] mt-1">{s.t('告诉我目的地和天数,一键生成行程')}</span>
          <span className="mt-2 text-[12px] text-[#6D5BFF] bg-white rounded-full px-3 py-1 w-fit">{s.t('开始规划')}</span>
        </button>

        {unpaid.length > 0 && (
          <div className="mx-2 mt-3 bg-[#FFF7ED] border border-[#FFD7A8] rounded-xl px-3 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-[13px] font-semibold text-[#C05621]">{s.t('待付款行程')}</div>
              <div className="text-[12px] text-[#9C4221] mt-0.5">{unpaid[0].title}</div>
            </div>
            <button {...bindTap('mine.toOrders', { params: { state: 'unpaid' } })} className="text-[12px] text-white bg-[#FF6A2C] rounded-full px-3 py-1.5 border-none cursor-pointer">{s.t('去支付')}</button>
          </div>
        )}

        <div className="mx-2 mt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[16px] font-semibold text-[#111111]">{s.t('我的行程')}</div>
            <button {...bindTap('trip.toSync')} className="text-[12px] text-[#0086F6] bg-transparent border-none cursor-pointer">{s.t('同步行程')}</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="bg-white rounded-xl py-10 flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#CFE6FF] to-[#7FB6F0] opacity-60" />
              <div className="text-[14px] text-[#666666]">{s.t('暂无行程')}</div>
              <div className="text-[12px] text-[#999999] px-8 text-center">{s.t('预订酒店/机票/火车后，待出行订单会汇总在这里')}</div>
              <button {...bindTap({ kind: 'action', id: 'trip.add.open' }, { onTrigger: () => open('add') })} className="text-[13px] text-white bg-[#0086F6] rounded-full px-4 py-1.5 border-none cursor-pointer mt-1">{s.t('添加行程')}</button>
            </div>
          ) : (
            <div className="relative pl-3">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#D6E6F8]" />
              <div className="space-y-2">
                {upcoming.map((o) => (
                  <div key={o.id} {...bindTap('orders.toDetail', { params: { id: o.id } })} className="relative bg-white rounded-xl p-3 flex gap-3 ml-3 cursor-pointer">
                    <span className="absolute -left-[18px] top-5 w-2.5 h-2.5 rounded-full bg-[#0086F6] border-2 border-white shadow" />
                    {o.image ? <Img src={o.image} className="w-16 h-16 rounded-lg object-cover shrink-0" /> : <div className="w-16 h-16 rounded-lg bg-[#EAF4FF] flex items-center justify-center text-[#0086F6] text-[11px] shrink-0">{CAT[o.category]}</div>}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-[#0086F6] bg-[#EAF4FF] rounded px-1.5 py-0.5">{CAT[o.category]}</span>
                        <span className="text-[11px] text-[#38A169]">{o.statusText}</span>
                      </div>
                      <div className="text-[14px] font-semibold line-clamp-1 mt-1">{o.title}</div>
                      <div className="text-[12px] text-[#999999] mt-0.5 line-clamp-1">{o.subtitle}</div>
                      <div className="text-[11px] text-[#BBBBBB] mt-1">{o.date}</div>
                    </div>
                    <Price value={o.price} size="s" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mx-2 mt-3 mb-4">
          <div className="text-[16px] font-semibold text-[#111111] mb-2">{s.t('旅行灵感')}</div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { t: s.t('周末去哪玩'), d: s.t('近郊短途热门') },
              { t: s.t('亲子游攻略'), d: s.t('带娃不踩坑') },
              { t: s.t('小众目的地'), d: s.t('少人更出片') },
              { t: s.t('美食地图'), d: s.t('本地人私藏') },
            ].map((g) => (
              <button key={g.t} {...bindTap({ kind: 'action', id: 'trip.guide.wontfix' }, { params: { g: g.t }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="bg-white rounded-xl p-3 text-left border-none cursor-pointer">
                <div className="text-[14px] font-semibold text-[#333333]">{g.t}</div>
                <div className="text-[11px] text-[#999999] mt-1">{g.d}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {panel === 'add' && (
        <BottomSheet title={s.t('添加行程')} onClose={close}>
          <div className="p-3 grid grid-cols-2 gap-2">
            {ADD_ITEMS.map((it) => (
              <button key={it.label} {...bindTap(it.transition)} className="py-4 rounded-xl bg-[#F2F7FF] text-[14px] text-[#0086F6] font-semibold border-none cursor-pointer">{it.label}</button>
            ))}
          </div>
          <button {...bindTap('trip.toSync')} className="mx-3 mb-4 w-[calc(100%-1.5rem)] py-3 rounded-full border border-[#DDD] bg-white text-[14px] cursor-pointer">{s.t('从证件/邮箱同步行程')}</button>
        </BottomSheet>
      )}
      {toast}
    </div>
  );
}

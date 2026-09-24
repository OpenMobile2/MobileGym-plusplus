import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { SHEN_COUPONS } from '../constants';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcMore, IcTicket } from '../res/icons';

const FILTERS = ['品类', '筛选', '即将过期', '免费试', '神券'];

export default function CouponsPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, action } = useDianpingGestures();
  const orders = useDianpingStore((st) => st.orders);
  const showToast = useDianpingStore((st) => st.showToast);
  const usable = orders.filter((o) => o.status === 'usable').length;

  return (
    <div className="flex h-full flex-col bg-[#FBECE7]" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-[#FBECE7] px-1">
        <button type="button" className="absolute left-1 border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-bold text-[#222]">{s.couponPack}</div>
        <button
          type="button"
          className="absolute right-3 border-none bg-transparent p-1 text-[#333] cursor-pointer"
          {...action('coupons.filter.open.disabled', () => showToast(s.notOpen))}
        >
          <IcMore size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="coupons" data-scroll-direction="vertical">
        {/* 两张汇总卡 */}
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button
            type="button"
            className="flex items-center gap-2 rounded-[12px] border-none bg-[#FFF1EA] p-3 text-left cursor-pointer"
            {...action('coupons.use.open.disabled', () => showToast(s.notOpen))}
          >
            <IcTicket size={26} className="text-[#FF6633]" />
            <div>
              <div className="text-[14px] font-bold text-[#222]">团购券/代金券</div>
              <div className="mt-0.5 text-[11px] text-[#999]">{usable}张券待使用</div>
            </div>
          </button>
          <button
            type="button"
            className="flex items-center gap-2 rounded-[12px] border-none bg-[#FFF1EA] p-3 text-left cursor-pointer"
            {...action('coupons.use.open.disabled', () => showToast(s.notOpen))}
          >
            <span className="flex h-8 w-8 flex-col items-center justify-center rounded-[6px] bg-[#FF3B60] text-[9px] font-bold text-white">
              ¥97
            </span>
            <div>
              <div className="text-[14px] font-bold text-[#222]">免费领神券</div>
              <div className="mt-0.5 text-[11px] text-[#999]">每日最高可领97元</div>
            </div>
          </button>
        </div>

        {/* 筛选 chips */}
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {FILTERS.map((f, i) => (
            <button
              key={f}
              type="button"
              className={`shrink-0 rounded-full border-none px-3 py-1.5 text-[13px] font-medium cursor-pointer ${
                i === FILTERS.length - 1 ? 'bg-transparent text-[#FF3B2F]' : 'bg-white text-[#444]'
              }`}
              {...action('coupons.filter.open.disabled', () => showToast(s.notOpen))}
            >
              {f}
              {i < 2 ? ' ▾' : ''}
            </button>
          ))}
        </div>

        {/* 神券列表 */}
        <div className="mt-2 space-y-2">
          {SHEN_COUPONS.map((c) => (
            <div key={c.id} className="flex items-stretch overflow-hidden rounded-[12px] bg-white">
              <div className="flex w-[110px] shrink-0 flex-col items-center justify-center bg-gradient-to-b from-[#FFF3EC] to-[#FFE7DA] py-3">
                <div className="flex items-center gap-1">
                  <span className="rounded-[3px] bg-gradient-to-r from-[#FF7A3D] to-[#FF3B60] px-1 text-[9px] font-bold text-white">神券</span>
                  {c.tag ? <span className="rounded-[3px] bg-[#FFB3C1] px-1 text-[9px] font-bold text-white">{c.tag}</span> : null}
                </div>
                <div className="mt-1">
                  <span className="text-[12px] font-bold text-[#FF3B2F]">¥</span>
                  <span className="text-[28px] font-black leading-none text-[#FF3B2F]">{c.amount}</span>
                </div>
                <div className="text-[11px] text-[#999]">{c.cond}</div>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-between px-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold text-[#222]">{c.title}</div>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px]">
                    <span className="rounded bg-[#FFF1EA] px-1 text-[#FF6633]">新获取</span>
                    <span className="text-[#FF6633]">{c.expire}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border-none bg-[#FF6633] px-4 py-1.5 text-[13px] font-medium text-white cursor-pointer"
                  {...action('coupons.use.open.disabled', () => showToast(s.notOpen))}
                >
                  去使用
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

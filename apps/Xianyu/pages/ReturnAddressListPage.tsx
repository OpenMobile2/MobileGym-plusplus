import React from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { EmptyState } from '../components/ui';
import { IcPlus } from '../res/icons';

const mask = (phone: string) =>
  phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;

export default function ReturnAddressListPage() {
  const { bindTap } = useXianyuGestures();
  const returnAddresses = useXianyuStore((s) => s.returnAddresses);

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="退货地址" />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="ReturnAddressListPage-main"
        data-scroll-direction="vertical"
      >
        {returnAddresses.length === 0 ? (
          <EmptyState text="还没有退货地址" hint="点击下方按钮添加" />
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {returnAddresses.map((a) => (
              <div key={a.id} className="bg-white px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-medium text-[#111]">{a.name}</span>
                  <span className="text-[13px] text-[#666]">{mask(a.phone)}</span>
                  {a.isDefault && (
                    <span className="text-[10px] text-[#FF3B30] border border-[#FF3B30] rounded px-1 leading-tight">默认</span>
                  )}
                </div>
                <div className="text-[13px] text-[#333] mt-1 leading-snug">
                  {a.region.replace(/ /g, '')}{a.detail}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部新增 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-4 py-2">
        <button
          {...bindTap('address.returnEdit-open')}
          className="w-full h-11 rounded-full bg-[#FFE411] text-[#111] text-[15px] font-semibold border-none cursor-pointer flex items-center justify-center gap-1"
        >
          <IcPlus size={18} /> 新增退货地址
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { IcLocation, IcRefresh, IcArrowRight } from '../res/icons';

export default function AddressEntryPage() {
  const { bindTap } = useXianyuGestures();

  const rows = [
    { key: 'ship', label: '收货地址', desc: '管理你的收货地址', tid: 'address.list-open' as const, Icon: IcLocation, color: '#FF6A00' },
    { key: 'return', label: '退货地址', desc: '售后退货时使用', tid: 'address.returnList-open' as const, Icon: IcRefresh, color: '#1CB854' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="地址管理" />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="AddressEntryPage-main"
        data-scroll-direction="vertical"
      >
        <div className="bg-white mt-3">
          {rows.map((r) => (
            <button
              key={r.key}
              {...bindTap(r.tid)}
              className="w-full flex items-center gap-3 px-4 py-4 bg-transparent border-none border-b border-[#F4F4F4] cursor-pointer text-left"
            >
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ background: `${r.color}1A` }}
              >
                <r.Icon size={20} style={{ color: r.color }} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-[#111]">{r.label}</div>
                <div className="text-[12px] text-[#999] mt-0.5">{r.desc}</div>
              </div>
              <IcArrowRight size={18} className="text-[#CCC]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

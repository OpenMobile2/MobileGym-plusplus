import React from 'react';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { usePinduoduoStrings } from '../hooks/usePinduoduoStrings';
import { TopBar, EmptyState, showToast } from '../components/ui';

function maskPhone(phone: string) {
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

export function AddressListPage() {
  const { bindTap, back } = usePinduoduoGestures();
  const s = usePinduoduoStrings();
  const addresses = usePinduoduoStore((st) => st.addresses);
  const selectAddress = usePinduoduoStore((st) => st.selectAddress);
  const setDefaultAddress = usePinduoduoStore((st) => st.setDefaultAddress);

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="收货地址" className="bg-white" />

      <div className="flex-1 overflow-y-auto p-2.5" data-scroll-container data-scroll-direction="vertical">
        {addresses.length === 0 ? (
          <EmptyState text="还没有收货地址" />
        ) : (
          addresses.map((a) => (
            <div
              key={a.id}
              {...bindTap({ kind: 'action', id: 'address.item.choose' }, { onTrigger: () => { selectAddress(a.id); showToast('已选择'); back(); } })}
              className="bg-white rounded-lg mb-2.5 px-3 py-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[15px] text-[#333] font-medium">{a.name}</span>
                <span className="text-[13px] text-[#666]">{maskPhone(a.phone)}</span>
                {a.isDefault && (
                  <span className="text-[10px] text-[#E22E1F] border border-[#E22E1F] rounded-sm px-1 leading-[15px]">默认</span>
                )}
                {a.tag && (
                  <span className="text-[10px] text-[#999] border border-[#DDD] rounded-sm px-1 leading-[15px]">{a.tag}</span>
                )}
              </div>
              <div className="text-[13px] text-[#666] leading-[18px]">{a.region} {a.detail}</div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-[#F5F5F5]">
                <button
                  {...bindTap({ kind: 'action', id: 'address.item.setdefault' }, { stopPropagation: true, onTrigger: () => { setDefaultAddress(a.id); showToast('已设为默认'); } })}
                  className="px-3 h-7 rounded-full border border-[#DDD] text-[12px] text-[#666]"
                >
                  设为默认
                </button>
                <button
                  {...bindTap('address.edit-open', { stopPropagation: true, params: { id: a.id } })}
                  className="px-3 h-7 rounded-full border border-[#DDD] text-[12px] text-[#666]"
                >
                  修改
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 新增收货地址 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] p-3">
        <button
          {...bindTap('address.add-open')}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
        >
          {s.btn_add_address}
        </button>
      </div>
    </div>
  );
}

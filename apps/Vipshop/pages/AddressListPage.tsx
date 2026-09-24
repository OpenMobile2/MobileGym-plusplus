import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, EmptyState, useToast, VIP } from '../components/ui';
import { IcEdit, IcDelete, IcPlus, IcCheck } from '../res/icons';

export default function AddressListPage() {
  const { bindTap } = useVipshopGestures();
  const [toast, showToast] = useToast();
  const [searchParams] = useSearchParams();
  const selectMode = searchParams.get('mode') === 'select';

  const addresses = useVipshopStore((s) => s.addresses);
  const deleteAddress = useVipshopStore((s) => s.deleteAddress);
  const setCheckoutAddress = useVipshopStore((s) => s.setCheckoutAddress);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar
        title="收货地址"
        rightContent={
          <button
            {...bindTap('address.new-open')}
            className="bg-transparent border-none cursor-pointer text-[14px] whitespace-nowrap"
            style={{ color: VIP.primary }}
          >
            新增
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="address-list" data-scroll-direction="vertical">
        {addresses.length === 0 && <EmptyState text="还没有收货地址" hint="点击右上角新增" />}
        <div className="p-2 flex flex-col gap-2">
          {selectMode && (
            <div className="px-1 pb-1 text-[12px] text-[#888888]">选择收货地址</div>
          )}
          {addresses.map((a) => (
            <div key={a.id} className="bg-white rounded-lg p-3">
              <div
                {...(selectMode
                  ? bindTap('address.select-confirm', { beforeTrigger: () => setCheckoutAddress(a.id) })
                  : {})}
                className={selectMode ? 'cursor-pointer' : ''}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold text-[#222222]">{a.name}</span>
                  <span className="text-[13px] text-[#666666]">{a.phone}</span>
                  {a.isDefault && (
                    <span
                      className="text-[10px] rounded px-1.5 py-0.5"
                      style={{ color: VIP.primary, background: '#FDECF5' }}
                    >
                      默认
                    </span>
                  )}
                  <span className="text-[10px] text-[#888888] border border-[#DDDDDD] rounded px-1.5 py-0.5">{a.tag}</span>
                  {selectMode && <span className="flex-1" />}
                  {selectMode && <IcCheck size={16} style={{ color: VIP.primary }} />}
                </div>
                <div className="text-[13px] text-[#444444] mt-1.5 leading-snug">
                  {a.region} {a.detail}
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-2 pt-2 border-t border-[#F5F5F5]">
                <button
                  {...bindTap('address.edit-open', { params: { id: a.id } })}
                  className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[13px] text-[#666666]"
                >
                  <IcEdit size={15} />编辑
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'address.delete.submit' }, {
                    params: { addressId: a.id },
                    onTrigger: () => { deleteAddress(a.id); showToast('已删除'); },
                  })}
                  className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[13px] text-[#666666]"
                >
                  <IcDelete size={15} />删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部新增按钮 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] p-3">
        <button
          {...bindTap('address.new-open')}
          className="w-full h-11 rounded-full text-[15px] font-semibold border-none cursor-pointer text-white flex items-center justify-center gap-1"
          style={{ background: VIP.primary }}
        >
          <IcPlus size={18} />新增收货地址
        </button>
      </div>
      {toast}
    </div>
  );
}

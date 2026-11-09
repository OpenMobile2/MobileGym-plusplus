import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { EmptyState } from '../components/ui';
import { IcEdit, IcPlus } from '../res/icons';

const mask = (phone: string) =>
  phone.length >= 7 ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : phone;

export default function AddressListPage() {
  const [sp] = useSearchParams();
  const { bindTap, back } = useXianyuGestures();

  const addresses = useXianyuStore((s) => s.addresses);
  const setCheckoutAddress = useXianyuStore((s) => s.setCheckoutAddress);
  const setDefaultAddress = useXianyuStore((s) => s.setDefaultAddress);
  const deleteAddress = useXianyuStore((s) => s.deleteAddress);

  const [manageMode, setManageMode] = useState(false);
  const fromOrder = sp.get('from') === 'order';

  const manageBtn = (
    <button
      {...bindTap(
        { kind: 'action', id: 'address.manage.toggle' },
        { onTrigger: () => setManageMode((m) => !m) },
      )}
      className="text-[13px] text-[#333] bg-transparent border-none cursor-pointer"
    >
      {manageMode ? '完成' : '管理'}
    </button>
  );

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="收货地址" rightContent={manageBtn} />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="AddressListPage-main"
        data-scroll-direction="vertical"
      >
        {addresses.length === 0 ? (
          <EmptyState text="还没有收货地址" hint="点击下方按钮添加" />
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {addresses.map((a) => {
              const cardBody = (
                <>
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
                </>
              );

              return (
                <div key={a.id} className="bg-white px-4 py-3 flex items-center gap-2">
                  {fromOrder ? (
                    <button
                      {...bindTap(
                        { kind: 'action', id: 'order.address.select.target' },
                        { params: { target: a.id }, onTrigger: () => { setCheckoutAddress(a.id); back(); } },
                      )}
                      className="flex-1 min-w-0 text-left bg-transparent border-none cursor-pointer p-0"
                    >
                      {cardBody}
                    </button>
                  ) : (
                    <div className="flex-1 min-w-0">{cardBody}</div>
                  )}

                  <button
                    {...bindTap('address.edit-open', { params: { addressId: a.id } })}
                    aria-label="编辑"
                    className="shrink-0 bg-transparent border-none cursor-pointer p-1"
                  >
                    <IcEdit size={18} className="text-[#999]" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 管理态操作条 */}
        {manageMode && addresses.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {addresses.map((a) => (
              <div key={a.id} className="bg-white px-4 py-2 flex items-center justify-between">
                <span className="text-[13px] text-[#666] truncate">{a.name} · {a.region.replace(/ /g, '')}</span>
                <div className="flex items-center gap-4 shrink-0">
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'address.setDefault.commit' },
                      { params: { target: a.id }, onTrigger: () => setDefaultAddress(a.id) },
                    )}
                    className="text-[13px] text-[#333] bg-transparent border-none cursor-pointer"
                  >
                    {a.isDefault ? '已默认' : '设为默认'}
                  </button>
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'address.delete.commit' },
                      { params: { target: a.id }, onTrigger: () => deleteAddress(a.id) },
                    )}
                    className="text-[13px] text-[#FF3B30] bg-transparent border-none cursor-pointer"
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 底部添加 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-4 py-2">
        <button
          {...bindTap('address.edit-open')}
          className="w-full h-11 rounded-full bg-[#FFE411] text-[#111] text-[15px] font-semibold border-none cursor-pointer flex items-center justify-center gap-1"
        >
          <IcPlus size={18} /> 添加收货地址
        </button>
      </div>
    </div>
  );
}

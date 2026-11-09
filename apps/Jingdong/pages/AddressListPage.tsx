import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Tag, EmptyState, showToast } from '../components/ui';
import { IcCheck } from '../res/icons';

const TABS = [
  { key: 'rec', label: '推荐' },
  { key: 'shop', label: '购物' },
  { key: 'miao', label: '秒送', badge: '外卖' },
  { key: 'service', label: '服务', badge: '缴费' },
] as const;

function maskPhone(p: string): string {
  return p.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

// 收货地址 — 复刻截图 216:tab / 地址卡(姓名+脱敏手机+地址+默认标签)/ 复制·修改 / 底部新增。删除在编辑页。
export function AddressListPage() {
  const { bindTap } = useJingdongGestures();
  const addresses = useJingdongStore((s) => s.addresses);
  const selectedAddressId = useJingdongStore((s) => s.selectedAddressId);
  const setDefaultAddress = useJingdongStore((s) => s.setDefaultAddress);
  const [tab, setTab] = useState<string>('rec');

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="收货地址" />

      {/* 场景 Tab（视觉） */}
      <div className="shrink-0 bg-white flex items-center px-4 gap-6 border-b border-[#F2F2F2]">
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative py-3 flex items-center gap-1"
            >
              <span className={`text-[15px] ${active ? 'text-[#1A1A1A] font-semibold' : 'text-[#666]'}`}>{t.label}</span>
              {'badge' in t && t.badge && (
                <span className="text-[9px] leading-[13px] px-1 rounded-sm bg-[#FFE9C2] text-[#B4700A] font-medium">{t.badge}</span>
              )}
              {active && <span className="absolute left-1/2 -translate-x-1/2 bottom-1 w-5 h-[3px] rounded-full bg-[#E1251B]" />}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="address-list" data-scroll-direction="vertical">
        {addresses.length === 0 ? (
          <EmptyState text="还没有收货地址" />
        ) : (
          addresses.map((a) => {
            const selected = selectedAddressId ? selectedAddressId === a.id : a.isDefault;
            return (
              <div key={a.id} className="bg-white px-4 pt-3.5 pb-3 mb-2">
                <div className="text-[12px] text-[#999] mb-0.5">{a.region}</div>
                <div className="text-[17px] font-bold text-[#1A1A1A] leading-snug">{a.detail}</div>
                <div className="flex items-center flex-wrap gap-2 mt-1.5">
                  <span className="text-[14px] text-[#333]">{a.name}</span>
                  <span className="text-[14px] text-[#333]">{maskPhone(a.phone)}</span>
                  {a.isDefault ? (
                    <Tag className="text-[#E1251B] bg-[#FDECEA] font-medium">购物默认</Tag>
                  ) : (
                    a.tag && <Tag className="text-[#999] bg-[#F2F2F2]">{a.tag}</Tag>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F5F5F5]">
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'address.item.choose' },
                      { params: { addressId: a.id }, onTrigger: () => setDefaultAddress(a.id) },
                    )}
                    className="flex items-center gap-1.5"
                  >
                    <span
                      className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${
                        selected ? 'bg-[#E1251B]' : 'border border-[#CCC]'
                      }`}
                    >
                      {selected && <IcCheck size={13} className="text-white" />}
                    </span>
                    <span className={`text-[13px] ${selected ? 'text-[#333]' : 'text-[#999]'}`}>
                      {selected ? '已设购物默认' : '设为购物默认'}
                    </span>
                  </button>

                  <div className="flex items-center gap-5 text-[14px] text-[#666]">
                    <button onClick={() => showToast('已复制到剪贴板')}>复制</button>
                    <button {...bindTap('address.edit-open', { params: { id: a.id } })}>修改</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div className="h-4" />
      </div>

      {/* 底部新增（flex 布局，非 fixed） */}
      <div className="shrink-0 bg-white px-4 py-2.5 border-t border-[#F0F0F0]">
        <button
          {...bindTap('address.add-open')}
          className="w-full h-11 rounded-full bg-[#E1251B] text-white text-[16px] font-medium"
        >
          新增收货地址
        </button>
      </div>
    </div>
  );
}

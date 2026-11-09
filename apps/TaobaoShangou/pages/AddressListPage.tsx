import React from 'react';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { TopBar } from '../components/common';
import { IcEdit } from '../res/icons';

const maskPhone = (phone: string) => `${phone.slice(0, 3)}****${phone.slice(-4)}`;

/** 收货地址管理页(spec address.list,证据 IMG_6037) */
export default function AddressListPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap } = useTbsgGestures();
  const addresses = useTbsgStore((st) => st.addresses);

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar
        title={s.addressTitle}
        right={(
          <button
            {...bindTap<HTMLButtonElement>('address.list.add-open')}
            className="text-[15px] text-[#ED6C2C] font-semibold bg-transparent border-none cursor-pointer whitespace-nowrap"
          >
            {s.addAddress}
          </button>
        )}
      />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-4">
        {addresses.map((a) => (
          <div key={a.id} className="flex items-center py-4 border-b border-[#F0F0F0]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {a.isDefault && (
                  <span className="text-[11px] text-[#ED6C2C] bg-[#FDEEE3] rounded px-1 py-0.5 shrink-0">常用</span>
                )}
                <span className="text-[15px] font-semibold text-[#1A1A1A] truncate">{a.poi} {a.detail}</span>
              </div>
              <div className="text-[13px] text-[#999999] mt-1">
                {a.name}({a.gender}) <span className="ml-2">{maskPhone(a.phone)}</span>
              </div>
            </div>
            <button
              {...bindTap<HTMLButtonElement>('address.list.edit-open', { params: { id: a.id } })}
              aria-label="编辑地址"
              className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
            >
              <IcEdit size={17} className="text-[#BBBBBB]" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

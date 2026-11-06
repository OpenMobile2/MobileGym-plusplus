import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import { TopBar, EmptyState } from '../components/ui';
import { IcSearch, IcEdit } from '../res/icons';
import type { TbAddress } from '../types';

/**
 * 收货地址(spec: address.list,IMG_8733)
 * - select 模式(?mode=select):点地址行弹确认 → 确定后写回 checkout 并返回(qa:Q10)
 * - 管理模式(?manage=1):每条左下角「默认地址」勾选框(qa:Q11)
 */
export default function AddressListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectMode = searchParams.get('mode') === 'select';
  const manage = searchParams.get('manage') === '1';
  const { bindTap, go } = useTaobaoGestures();
  const s = useStrings();

  const addresses = useTaobaoStore((st) => st.addresses);
  const setDefaultAddress = useTaobaoStore((st) => st.setDefaultAddress);
  const setCheckoutAddress = useTaobaoStore((st) => st.setCheckoutAddress);
  const [confirming, setConfirming] = useState<TbAddress | null>(null);

  const toggleManage = () =>
    setSearchParams((p) => {
      if (manage) p.delete('manage');
      else p.set('manage', '1');
      return p;
    }, { replace: true });

  return (
    <div className="flex flex-col h-full bg-app-bg">
      <TopBar
        title={s.addressListTitle}
        rightContent={
          <span className="flex items-center gap-3">
            <IcSearch size={17} className="text-app-text" />
            <button
              {...bindTap({ kind: 'action', id: 'address.manage.toggle' }, { onTrigger: toggleManage })}
              className="text-[13px] text-app-text bg-transparent border-none cursor-pointer whitespace-nowrap"
            >
              {manage ? s.doneLabel : s.manageLabel}
            </button>
          </span>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="address-list" data-scroll-direction="vertical">
        {addresses.length === 0 ? (
          <EmptyState text={s.noAddressesText} />
        ) : (
          addresses.map((a) => (
            <div key={a.id} className="bg-app-surface border-b border-[#F5F5F5] px-4 py-3">
              <div
                {...(selectMode
                  ? bindTap({ kind: 'action', id: 'address.select.confirmDialog.open' }, {
                      params: { addressId: a.id },
                      onTrigger: () => setConfirming(a),
                    })
                  : {})}
                className={selectMode ? 'cursor-pointer' : ''}
              >
                <div className="text-[11px] text-app-text-muted">{a.region}</div>
                <div className="text-[15px] font-medium mt-0.5 flex items-center gap-1.5">
                  {a.detail}
                </div>
                <div className="text-[12px] text-app-text-muted mt-0.5 flex items-center gap-1.5">
                  {a.name} {a.phone.slice(0, 3)}****{a.phone.slice(-4)}
                  {a.isDefault && <Tag color="#FF5000">{s.defaultTagLabel}</Tag>}
                  {a.tag && <Tag color="#1677FF">{a.tag}</Tag>}
                </div>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                {manage ? (
                  <button
                    {...bindTap({ kind: 'action', id: 'address.default.set' }, {
                      params: { addressId: a.id },
                      onTrigger: () => setDefaultAddress(a.id),
                    })}
                    className="text-[12px] text-app-text-muted bg-transparent border-none cursor-pointer flex items-center gap-1"
                  >
                    <span className={`w-4 h-4 rounded-full border text-[10px] leading-3.5 leading-4 text-center ${
                      a.isDefault ? 'bg-[#FF5000] border-[#FF5000] text-white' : 'border-[#CCCCCC] text-transparent'
                    }`}>✓                    </span>
                    {s.defaultAddressCheckboxLabel}
                  </button>
                ) : <span />}
                <button
                  {...bindTap('address.edit-open', { params: { id: a.id } })}
                  className="bg-transparent border-none cursor-pointer text-app-text-muted"
                >
                  <IcEdit size={16} />
                </button>
              </div>
            </div>
          ))
        )}
        <div className="text-center text-[12px] text-app-text-muted py-4">{s.reachedEndText}</div>
      </div>

      <div className="shrink-0 bg-app-surface border-t border-app-border px-3 py-2">
        <button
          {...bindTap('address.new-open')}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[15px] border-none cursor-pointer"
        >
          {s.addNewAddressLabel}
        </button>
      </div>

      {/* 选择确认弹窗(qa:Q10) */}
      {confirming && (
        <div className="absolute inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirming(null)} />
          <div className="relative bg-app-surface rounded-2xl w-72 p-4">
            <div className="text-[15px] font-semibold text-center">{s.useThisAddressTitle}</div>
            <div className="text-[13px] text-app-text-muted text-center mt-2 leading-relaxed">
              {confirming.region.replace(/ /g, '')}{confirming.detail}<br />{confirming.name}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setConfirming(null)}
                className="flex-1 h-10 rounded-full border border-[#DDDDDD] bg-app-surface text-[14px] cursor-pointer"
              >
                {s.cancelLabel}
              </button>
              <button
                {...bindTap('address.select.confirm', {
                  beforeTrigger: () => setCheckoutAddress(confirming.id),
                })}
                className="flex-1 h-10 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[14px] border-none cursor-pointer"
              >
                {s.okLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tag({ color, children }: { color: string; children: React.ReactNode }) {
  return (
    <span className="text-[10px] rounded px-1 border" style={{ color, borderColor: color }}>
      {children}
    </span>
  );
}

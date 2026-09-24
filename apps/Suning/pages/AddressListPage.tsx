import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { IcNavBack, IcCheck, IcInbox } from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import type { Address } from '../types';

/**
 * 地址管理(spec address.list,s309)。
 * ?mode=picker(v1.7.0 新增)= 选择模式:点条目回填来源页后返回;缺省 manage 只做增删改与设默认。
 * ?dialog=deleteConfirm 删除确认弹窗 URL 驱动,关闭走 bindBack。
 */
export default function AddressListPage() {
  const { bindTap, action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const [searchParams] = useSearchParams();
  const picker = searchParams.get('mode') === 'picker';
  const dialogOpen = searchParams.get('dialog') === 'deleteConfirm';

  const addresses = useSuningStore((s) => s.addresses);
  const pickTarget = useSuningStore((s) => s._temp.addressPickTarget);
  const setTemp = useSuningStore((s) => s.setTemp);
  const setAddressDraft = useSuningStore((s) => s.setAddressDraft);
  const showToast = useSuningStore((s) => s.showToast);
  const setDefaultAddress = useSuningStore((s) => s.setDefaultAddress);

  /* 选择模式回填:来自 order.modify 写改单草稿,其余入口(商详送至/购物车定位/筛选地址行)置为全局默认 */
  const pick = (a: Address) => {
    if (pickTarget === 'orderModify') {
      const { name, phone, province, city, district, street, detail } = a;
      setTemp({ orderModifyDraft: { name, phone, province, city, district, street, detail } });
    } else {
      setDefaultAddress(a.id);
    }
    setTemp({ addressPickTarget: null });
    showToast(S.toastAddressPicked);
    back();
  };

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">
          {picker ? S.pickAddressTitle : S.addressListTitle}
        </span>
        <span className="w-7 shrink-0" />
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pt-2 pb-6"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {picker && (
          <div className="mb-2 rounded-lg bg-[#FFF3E8] px-3 py-2 text-[11px] leading-4 text-[var(--app-primary)]">
            {S.addressPickerTip}
          </div>
        )}

        {/* 配送地址区 */}
        <div className="rounded-xl bg-[var(--app-surface)] px-3 py-2.5">
          <div className="flex items-center pb-1">
            <span className="min-w-0 flex-1 text-[14px] font-bold text-[var(--app-text)]">{S.addressDeliverySection}</span>
            <button
              {...bindTap('address.list.new.open', {
                beforeTrigger: () => {
                  setAddressDraft(null);
                  setTemp({ addressEditFromCheckout: false });
                },
              })}
              className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[12px] text-[var(--app-primary)]"
            >
              {S.addAddress}
            </button>
          </div>

          {addresses.length === 0 ? (
            <div className="py-10 text-center">
              <IcInbox size={40} className="mx-auto text-[#DDD]" />
              <div className="mt-2 text-[13px] text-[var(--app-c-text-muted)]">{S.addressListEmpty}</div>
            </div>
          ) : (
            addresses.map((a) => (
              <AddressRow key={a.id} address={a} picker={picker} onPick={() => pick(a)} />
            ))
          )}
        </div>

        {/* 自提地址区:走查 0729 要求删除整块 */}

        <div className="mt-3 px-1 text-[11px] leading-4 text-[var(--app-c-text-muted)]">{S.addressListTip}</div>
      </div>

      {dialogOpen && <DeleteConfirmDialog />}
    </div>
  );
}

function AddressRow({
  address: a,
  picker,
  onPick,
}: {
  address: Address;
  picker: boolean;
  onPick: () => void;
}) {
  const { bindTap, action } = useSuningGestures();
  const S = useStrings();
  const setTemp = useSuningStore((s) => s.setTemp);
  const setAddressDraft = useSuningStore((s) => s.setAddressDraft);
  const showToast = useSuningStore((s) => s.showToast);
  const setDefaultAddress = useSuningStore((s) => s.setDefaultAddress);

  const body = (
    <>
      <span className="flex flex-wrap items-center gap-1">
        {a.tags.map((t) => (
          <span key={t} className="rounded-sm bg-[#FFF3E8] px-1 text-[10px] leading-4 text-[var(--app-primary)]">
            {t}
          </span>
        ))}
        <span className="text-[12px] text-[var(--app-text-muted)]">
          {a.province}
          {a.city}
          {a.district}
          {a.street}
        </span>
      </span>
      <span className="mt-0.5 block text-[14px] font-bold leading-5 text-[var(--app-text)]">{a.detail}</span>
      <span className="mt-0.5 block text-[12px] text-[var(--app-text-muted)]">
        {a.name} {a.phone}
      </span>
    </>
  );

  return (
    <div className="border-b border-[var(--app-border)] py-3 last:border-b-0">
      {/* 选择模式下整条可点回填;管理模式下条目本体无行为,不打 tag */}
      {picker ? (
        <button
          {...action('address.list.pick.select', onPick, { params: { addressId: a.id } })}
          className="flex w-full cursor-pointer items-start gap-2 border-none bg-transparent p-0 text-left"
        >
          <span className="min-w-0 flex-1">{body}</span>
          {a.isDefault && <IcCheck size={16} className="shrink-0 text-[var(--app-primary)]" />}
        </button>
      ) : (
        <div className="min-w-0">{body}</div>
      )}

      <div className="mt-2 flex items-center gap-3 border-t border-[var(--app-border)] pt-2">
        <button
          {...action('address.list.default.set', () => {
            if (a.isDefault) return;
            setDefaultAddress(a.id);
            showToast(S.toastAddressDefaultSet);
          }, { params: { addressId: a.id } })}
          className="flex min-w-0 flex-1 cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-left"
        >
          <span
            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
              a.isDefault ? 'bg-[var(--app-primary)] text-white' : 'border border-[var(--app-border)] text-transparent'
            }`}
          >
            <IcCheck size={11} />
          </span>
          <span className={`text-[12px] ${a.isDefault ? 'text-[var(--app-primary)]' : 'text-[var(--app-text-muted)]'}`}>
            {S.addressDefaultLabel}
          </span>
        </button>
        <button
          {...bindTap('address.list.deleteConfirm.open', {
            params: { addressId: a.id },
            beforeTrigger: () => setTemp({ pendingDeleteAddressId: a.id }),
          })}
          className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[12px] text-[var(--app-text-muted)]"
        >
          {S.deleteBtn}
        </button>
        <button
          {...bindTap('address.list.edit.open', {
            params: { addressId: a.id },
            beforeTrigger: () => {
              setAddressDraft(null);
              setTemp({ addressEditFromCheckout: false });
            },
          })}
          className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[12px] text-[var(--app-primary)]"
        >
          {S.modify}
        </button>
      </div>
    </div>
  );
}

/** ?dialog=deleteConfirm(qa:Q10):取消 = bindBack,删除后默认地址自动让位给剩余第一条 */
function DeleteConfirmDialog() {
  const { action, bindBack, back } = useSuningGestures();
  const S = useStrings();
  const pendingId = useSuningStore((s) => s._temp.pendingDeleteAddressId);
  const deleteAddress = useSuningStore((s) => s.deleteAddress);
  const showToast = useSuningStore((s) => s.showToast);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/50" />
      <div className="relative w-[72%] rounded-2xl bg-[var(--app-surface)] px-4 pb-2 pt-5">
        <div className="text-center text-[15px] font-bold text-[var(--app-text)]">{S.addressDeleteAsk}</div>
        <div className="mt-1 text-center text-[12px] text-[var(--app-c-text-muted)]">{S.addressDeleteDesc}</div>
        <div className="mt-4 flex border-t border-[var(--app-border)]">
          <button
            {...bindBack()}
            className="flex-1 cursor-pointer border-none bg-transparent py-3 text-[15px] text-[var(--app-text-muted)]"
          >
            {S.cancel}
          </button>
          <button
            {...action('address.list.delete.confirm', () => {
              if (pendingId) deleteAddress(pendingId);
              showToast(S.toastAddressDeleted);
              back();
            }, { params: { addressId: pendingId ?? '' } })}
            className="flex-1 cursor-pointer border-l border-[var(--app-border)] bg-transparent py-3 text-[15px] font-bold text-[var(--app-primary)]"
          >
            {S.deleteBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

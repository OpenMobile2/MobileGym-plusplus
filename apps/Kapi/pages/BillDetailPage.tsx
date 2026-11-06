import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Switch, CategoryIcon } from '../components/ui';
import { toast } from '../components/toast';
import { money, fmtDateTime } from '../components/format';
import { IcDelete } from '../res/icons';
import { useStrings } from '../hooks/useStrings';
import { pickImages } from '@/os/albumBridge';

export default function BillDetailPage() {
  const { id = '' } = useParams();
  const { bindBack, bindTap, bindAction, back } = useKapiGestures();
  const s = useStrings();
  const bills = useKapiStore((st) => st.bills);
  const ledgers = useKapiStore((st) => st.ledgers);
  const setActiveBill = useKapiStore((st) => st.setActiveBill);
  const setEditContext = useKapiStore((st) => st.setEditContext);
  const toggleBillFlag = useKapiStore((st) => st.toggleBillFlag);
  const updateBill = useKapiStore((st) => st.updateBill);
  const deleteBill = useKapiStore((st) => st.deleteBill);
  const bill = bills.find((b) => b.id === id);
  const [confirming, setConfirming] = useState(false);
  const [pickingImages, setPickingImages] = useState(false);

  useEffect(() => {
    setActiveBill(id);
    setEditContext('bill');
  }, [id, setActiveBill, setEditContext]);

  if (!bill) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title={s.billDetailTitle} backBind={bindBack()} />
        <div className="flex-1 flex items-center justify-center text-app-text-muted text-[14px]">{s.billNotFoundText}</div>
      </div>
    );
  }

  const ledgerName = ledgers.find((l) => l.id === bill.ledgerId)?.name ?? s.defaultLedgerName;
  const sign = bill.type === 'income' ? '+' : '-';
  const images = bill.images ?? [];
  const addImages = async () => {
    if (pickingImages || images.length >= 9) return;
    setPickingImages(true);
    try {
      const result = await pickImages({ multiple: true, maxSelect: 9 - images.length });
      if (result.cancelled || result.selected.length === 0) return;
      const next = [...images, ...result.selected.map((item) => item.uri)].slice(0, 9);
      updateBill(id, { images: next });
      toast('已添加图片');
    } finally {
      setPickingImages(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={s.billDetailTitle}
        backBind={bindBack()}
        right={
          <button {...bindAction('billDetail.delete.confirm.remove', () => setConfirming(true))} className="bg-transparent border-none cursor-pointer">
            <IcDelete size={20} className="text-app-text-muted" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="bill-detail" data-scroll-direction="vertical">
        <Card className="mt-2">
          <Row label={s.actualAmountLabel} bind={bindTap('billDetail.amount.open', { params: { id } })} value={<span className={bill.type === 'income' ? 'text-[#FF7B4A] text-[18px] font-bold' : 'text-[#3D6CF0] text-[18px] font-bold'}>{sign}¥{money(bill.amount)}</span>} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row
            label={s.categoryLabel}
            bind={bindTap('billDetail.category.open', { params: { id } })}
            leading={<CategoryIcon icon={bill.icon} color={bill.color} size={26} />}
            value={bill.categoryName}
          />
        </Card>

        <Card className="mt-3">
          <Row label={s.belongsLedgerLabel} bind={bindTap('billDetail.ledger.open', { params: { id } })} value={ledgerName} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.billTimeLabel} bind={bindTap('billDetail.date.open', { params: { id } })} value={fmtDateTime(bill.date)} />
        </Card>

        <Card className="mt-3">
          <Row label={s.payAccountLabel} bind={bindTap('billDetail.account.open', { params: { id } })} value={bill.accountId ? s.accountSelectedLabel : ''} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.discountAmountLabel} bind={bindTap('billDetail.discount.open', { params: { id } })} value={bill.discount ? `¥${money(bill.discount.amount)}` : s.noneLabel} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label={s.refundLabel} bind={bindTap('billDetail.refund.open', { params: { id } })} value={bill.refund ? `¥${money(bill.refund.amount)}` : s.noneLabel} />
        </Card>

        <Card className="mt-3">
          <Row
            label={s.reimburseLabel}
            chevron={false}
            bind={bindAction('billDetail.reimburse.toggle.flag', () => toggleBillFlag(id, 'reimburse'))}
            value={<Switch on={bill.reimburse} />}
          />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row
            label={s.excludeFlowLabel}
            chevron={false}
            bind={bindAction('billDetail.excludeFlow.toggle.flag', () => toggleBillFlag(id, 'excludeFlow'))}
            value={<Switch on={bill.excludeFlow} />}
          />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row
            label={s.excludeBudgetLabel}
            chevron={false}
            bind={bindAction('billDetail.excludeBudget.toggle.flag', () => toggleBillFlag(id, 'excludeBudget'))}
            value={<Switch on={bill.excludeBudget} />}
          />
        </Card>

        <Card className="mt-3">
          <Row label={s.payeeLabel} bind={bindTap('billDetail.payee.open', { params: { id } })} value={bill.payee || s.notFilledLabel} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <div className="flex items-center min-h-[52px] px-4">
            <span className="text-[15px] text-app-text mr-3">{s.tagsLabel}</span>
            <input
              data-action="billDetail.tag.input.value"
              data-action-type="input"
              defaultValue={bill.tags.join(' ')}
              onBlur={(e) => updateBill(id, { tags: e.target.value.split(/\s+/).filter(Boolean) })}
              placeholder={s.addTagPlaceholder}
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-right text-app-text placeholder:text-app-text-muted"
            />
          </div>
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <div className="px-4 py-3">
            <textarea
              data-action="billDetail.note.input.value"
              data-action-type="input"
              defaultValue={bill.note}
              onBlur={(e) => updateBill(id, { note: e.target.value })}
              placeholder={s.editNotePlaceholder}
              className="w-full h-16 bg-[#F4F6FA] rounded-xl p-2 border-none outline-none text-[14px] resize-none"
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {images.map((src, index) => (
                <div key={`${src}-${index}`} className="group relative h-14 w-14 overflow-hidden rounded-xl bg-[#EEF1F9]">
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => updateBill(id, { images: images.filter((_, itemIndex) => itemIndex !== index) })}
                    className="absolute right-0 top-0 flex h-5 w-5 items-center justify-center rounded-bl-lg border-none bg-black/55 text-[12px] text-white"
                    aria-label="删除图片"
                  >×</button>
                </div>
              ))}
              {images.length < 9 && (
                <button
                  {...bindAction('billDetail.image.noop', () => { void addImages(); })}
                  disabled={pickingImages}
                  className="h-14 w-14 cursor-pointer rounded-xl border border-dashed border-[#C5CAD4] bg-transparent text-[24px] text-app-text-muted disabled:opacity-50"
                >{pickingImages ? '…' : '+'}</button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-[130] flex items-center justify-center bg-black/40" onClick={() => setConfirming(false)}>
          <div className="bg-app-surface rounded-2xl w-64 p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-[16px] text-app-text mb-4">{s.confirmDeleteBillText}</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-xl bg-[#F0F2F8] text-[#5A6172] border-none cursor-pointer">{s.cancelBtn}</button>
              <button
                onClick={() => { deleteBill(id); setConfirming(false); toast(s.deletedDoneToast); back(); }}
                className="flex-1 py-2 rounded-xl bg-[#F0524B] text-white border-none cursor-pointer"
              >
                {s.deleteBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

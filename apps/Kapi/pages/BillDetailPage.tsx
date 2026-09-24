import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Switch, CategoryIcon } from '../components/ui';
import { toast } from '../components/toast';
import { money, fmtDateTime } from '../components/format';
import { IcDelete } from '../res/icons';

export default function BillDetailPage() {
  const { id = '' } = useParams();
  const { bindBack, bindTap, bindAction, back } = useKapiGestures();
  const bills = useKapiStore((s) => s.bills);
  const ledgers = useKapiStore((s) => s.ledgers);
  const setActiveBill = useKapiStore((s) => s.setActiveBill);
  const setEditContext = useKapiStore((s) => s.setEditContext);
  const toggleBillFlag = useKapiStore((s) => s.toggleBillFlag);
  const updateBill = useKapiStore((s) => s.updateBill);
  const deleteBill = useKapiStore((s) => s.deleteBill);
  const bill = bills.find((b) => b.id === id);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    setActiveBill(id);
    setEditContext('bill');
  }, [id, setActiveBill, setEditContext]);

  if (!bill) {
    return (
      <div className="flex flex-col h-full">
        <TopBar title="账单详情" backBind={bindBack()} />
        <div className="flex-1 flex items-center justify-center text-[#B3B9C6] text-[14px]">账单不存在或已删除</div>
      </div>
    );
  }

  const ledgerName = ledgers.find((l) => l.id === bill.ledgerId)?.name ?? '总账本';
  const sign = bill.type === 'income' ? '+' : '-';

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title="账单详情"
        backBind={bindBack()}
        right={
          <button {...bindAction('billDetail.delete.confirm.remove', () => setConfirming(true))} className="bg-transparent border-none cursor-pointer">
            <IcDelete size={20} className="text-[#8A92A6]" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="bill-detail" data-scroll-direction="vertical">
        <Card className="mt-2">
          <Row label="实付金额" bind={bindTap('billDetail.amount.open', { params: { id } })} value={<span className={bill.type === 'income' ? 'text-[#FF7B4A] text-[18px] font-bold' : 'text-[#3D6CF0] text-[18px] font-bold'}>{sign}¥{money(bill.amount)}</span>} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row
            label="分类"
            bind={bindTap('billDetail.category.open', { params: { id } })}
            leading={<CategoryIcon icon={bill.icon} color={bill.color} size={26} />}
            value={bill.categoryName}
          />
        </Card>

        <Card className="mt-3">
          <Row label="所属账本" bind={bindTap('billDetail.ledger.open', { params: { id } })} value={ledgerName} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="账单时间" bind={bindTap('billDetail.date.open', { params: { id } })} value={fmtDateTime(bill.date)} />
        </Card>

        <Card className="mt-3">
          <Row label="付款账户" bind={bindTap('billDetail.account.open', { params: { id } })} value={bill.accountId ? '已选账户' : ''} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="优惠金额" bind={bindTap('billDetail.discount.open', { params: { id } })} value={bill.discount ? `¥${money(bill.discount.amount)}` : '无'} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="退款" bind={bindTap('billDetail.refund.open', { params: { id } })} value={bill.refund ? `¥${money(bill.refund.amount)}` : '无'} />
        </Card>

        <Card className="mt-3">
          <Row label="是否报销" chevron={false} value={<Switch on={bill.reimburse} bind={bindAction('billDetail.reimburse.toggle.flag', () => toggleBillFlag(id, 'reimburse'))} />} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="不计收支" chevron={false} value={<Switch on={bill.excludeFlow} bind={bindAction('billDetail.excludeFlow.toggle.flag', () => toggleBillFlag(id, 'excludeFlow'))} />} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="不计预算" chevron={false} value={<Switch on={bill.excludeBudget} bind={bindAction('billDetail.excludeBudget.toggle.flag', () => toggleBillFlag(id, 'excludeBudget'))} />} />
        </Card>

        <Card className="mt-3">
          <Row label="交易方" bind={bindTap('billDetail.payee.open', { params: { id } })} value={bill.payee || '未填写'} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <div className="flex items-center min-h-[52px] px-4">
            <span className="text-[15px] text-[#1A1D26] mr-3">标签</span>
            <input
              data-action="billDetail.tag.input.value"
              data-action-type="input"
              defaultValue={bill.tags.join(' ')}
              onBlur={(e) => updateBill(id, { tags: e.target.value.split(/\s+/).filter(Boolean) })}
              placeholder="添加标签"
              className="flex-1 bg-transparent border-none outline-none text-[14px] text-right text-[#1A1D26] placeholder:text-[#B3B9C6]"
            />
          </div>
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <div className="px-4 py-3">
            <textarea
              data-action="billDetail.note.input.value"
              data-action-type="input"
              defaultValue={bill.note}
              onBlur={(e) => updateBill(id, { note: e.target.value })}
              placeholder="点击编辑备注"
              className="w-full h-16 bg-[#F4F6FA] rounded-xl p-2 border-none outline-none text-[14px] resize-none"
            />
            <button {...bindAction('billDetail.image.noop', () => toast('该功能暂未开放'))} className="mt-2 w-14 h-14 rounded-xl border border-dashed border-[#C5CAD4] text-[#B3B9C6] text-[24px] bg-transparent cursor-pointer">+</button>
          </div>
        </Card>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-[130] flex items-center justify-center bg-black/40" onClick={() => setConfirming(false)}>
          <div className="bg-white rounded-2xl w-64 p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-[16px] text-[#1A1D26] mb-4">确认删除这笔账单?</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-xl bg-[#F0F2F8] text-[#5A6172] border-none cursor-pointer">取消</button>
              <button
                onClick={() => { deleteBill(id); setConfirming(false); toast('已删除'); back(); }}
                className="flex-1 py-2 rounded-xl bg-[#F0524B] text-white border-none cursor-pointer"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

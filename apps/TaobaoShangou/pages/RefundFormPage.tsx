import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { AppImg, EmptyState, TopBar, showToast } from '../components/common';
import { RefundReasonSheet } from '../components/RefundReasonSheet';
import { IcCamera, IcRight } from '../res/icons';
import { cents, fmt, yuan } from '../utils';

/** 退款申请表单页(spec order.refundForm,证据 IMG_6071) */
export default function RefundFormPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, go } = useTbsgGestures();
  const { orderId } = useParams<{ orderId: string }>();
  const [sp, setSp] = useSearchParams();
  const orders = useTbsgStore((st) => st.orders);
  const shops = useTbsgStore((st) => st.shops);
  const submitRefund = useTbsgStore((st) => st.submitRefund);
  const refundDraft = useTbsgStore((st) => st.refundDraft);

  const [selected, setSelected] = useState<number[]>([]);
  const [desc, setDesc] = useState('');

  const order = orders.find((o) => o.id === orderId);
  const shop = shops.find((x) => x.id === order?.shopId);

  if (!order || !shop) {
    return (
      <div className="flex flex-col h-full bg-[#F3F6F8]">
        <TopBar title={s.applyRefund} />
        <EmptyState text={s.emptyList} />
      </div>
    );
  }

  const panel = sp.get('panel');
  const allSelected = selected.length === order.lines.length;
  const amount = allSelected
    ? order.totalPaid
    : yuan(selected.reduce((a, i) => a + cents(order.lines[i]?.price ?? 0) * (order.lines[i]?.qty ?? 0), 0));

  const toggleIdx = (idx: number) => {
    if (idx === -1) {
      setSelected(allSelected ? [] : order.lines.map((_, i) => i));
    } else {
      setSelected((cur) => (cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx]));
    }
  };

  const radio = (on: boolean) => (
    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${on ? 'bg-[#ED6C2C]' : 'border border-gray-300'}`}>
      {on && <span className="text-white text-[12px] leading-none">✓</span>}
    </span>
  );

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title={s.applyRefund} />

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 售后原因 */}
        <div className="bg-white px-4 py-3.5">
          <div
            {...bindTap<HTMLDivElement>(
              { kind: 'action', id: 'refund.form.reason.reopen' },
              { onTrigger: () => setSp((p) => { p.set('panel', 'reason'); return p; }) },
            )}
            className="flex items-center cursor-pointer"
          >
            <span className="text-[16px] font-bold text-[#1A1A1A]">售后原因<span className="text-[#F53F3F]">*</span></span>
            <div className="flex-1" />
            <span className="text-[14px] text-[#1A1A1A]">
              {refundDraft.reason || '请选择'}
              {refundDraft.subReason ? `(${refundDraft.subReason})` : ''}
            </span>
            <IcRight size={15} className="text-[#999999]" />
          </div>
          <div className="mt-3 rounded-xl bg-[#FDEFE4] flex items-center px-3 py-2">
            <div className="flex-1 text-[13px] text-[#ED6C2C]">直接联系骑士，更快处理</div>
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'refund.form.call.stub' }, { onTrigger: () => showToast(s.notOpen) })}
              className="h-8 px-3 rounded-lg text-[13px] text-[#7A3B12] border-none cursor-pointer"
              style={{ background: 'linear-gradient(90deg,#F5C9A8,#EDA167)' }}
            >
              致电骑士
            </button>
          </div>
        </div>

        {/* 售后商品 */}
        <div className="bg-white px-4 py-3.5 mt-2">
          <div className="text-[16px] font-bold text-[#1A1A1A]">请选择需要售后的商品<span className="text-[#F53F3F]">*</span></div>
          {order.lines.map((l, idx) => (
            <div
              key={idx}
              {...bindTap<HTMLDivElement>(
                { kind: 'action', id: 'refund.form.item.toggle' },
                { params: { lineIdx: idx }, onTrigger: () => toggleIdx(idx) },
              )}
              className="flex items-center mt-3.5 cursor-pointer"
            >
              {radio(selected.includes(idx))}
              <AppImg src={l.image} className="w-14 h-14 rounded-lg object-cover ml-3 shrink-0" />
              <div className="flex-1 min-w-0 px-2.5">
                <div className="text-[14px] text-[#1A1A1A] truncate">{l.name}</div>
                {l.skuDesc && <div className="text-[12px] text-[#999999] mt-0.5 truncate">{l.skuDesc}</div>}
                <div className="text-[12px] text-[#999999] mt-0.5">× {l.qty}</div>
              </div>
            </div>
          ))}
          <div className="flex items-center mt-4 pt-3 border-t border-[#EEEEEE]">
            <div
              {...bindTap<HTMLDivElement>(
                { kind: 'action', id: 'refund.form.item.toggle' },
                { params: { lineIdx: -1 }, onTrigger: () => toggleIdx(-1) },
              )}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              {radio(allSelected)}
              <span className="text-[15px] text-[#1A1A1A]">{s.selectAll}</span>
            </div>
            <div className="flex-1" />
            <span className="text-[15px] font-bold text-[#1A1A1A]">退款金额 ¥{fmt(amount)}</span>
          </div>
        </div>

        {/* 补充说明 */}
        <div className="bg-white px-4 py-3.5 mt-2">
          <div className="text-[16px] font-bold text-[#1A1A1A]">补充说明</div>
          <div className="mt-2.5 rounded-xl bg-[#F5F6F7] p-3">
            <textarea
              {...bindTap<HTMLTextAreaElement>({ kind: 'action', id: 'refund.form.desc' }, { onTrigger: () => {} })}
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, 500))}
              placeholder="(选填)补充详细退款原因，有利于商家更快帮你处理。"
              className="w-full h-24 bg-transparent outline-none border-none resize-none text-[14px] text-[#1A1A1A] placeholder:text-[#999999]"
            />
            <div className="text-right text-[12px] text-[#999999]">{desc.length}/500</div>
          </div>
          <button
            {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'refund.form.photo.stub' }, { onTrigger: () => showToast(s.notOpen) })}
            className="mt-3 w-28 h-24 rounded-xl bg-[#F5F6F7] flex flex-col items-center justify-center gap-1.5 border-none cursor-pointer"
          >
            <IcCamera size={26} className="text-[#ED6C2C]" />
            <span className="text-[12px] text-[#999999]">上传凭证<br />最多4张</span>
          </button>
        </div>
      </div>

      {/* 底部提交 */}
      <div className="shrink-0 bg-white px-4 py-2.5 flex items-center border-t border-[#EEEEEE]" data-hide-on-keyboard>
        <div className="flex-1">
          <div className="text-[15px] text-[#1A1A1A]">退款金额：<span className="font-bold text-[#F53F3F]">¥{fmt(amount)}</span></div>
          <div className="text-[12px] text-[#999999] mt-0.5">退款将原路退回</div>
        </div>
        {selected.length > 0 ? (
          <button
            {...bindTap<HTMLButtonElement>('refund.form.submit', {
              params: { orderId: order.id },
              beforeTrigger: () => submitRefund(order.id, refundDraft.reason || '其他', refundDraft.subReason, selected, desc),
              // 提交后清掉「原因弹层+申请表单」两层,返回直接落到订单详情(而非重开原因弹层)
              onTrigger: () => go('refund.form.submit', { orderId: order.id }, { popTo: `/order/${order.id}`, popToInclusive: true, mode: 'push' }),
            })}
            className="h-11 px-8 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
          >
            {s.submit}
          </button>
        ) : (
          <button
            onClick={() => showToast('请先选择需要售后的商品')}
            className="h-11 px-8 rounded-full bg-[#F7C4A3] text-white text-[16px] font-semibold border-none cursor-pointer"
          >
            {s.submit}
          </button>
        )}
      </div>

      {panel === 'reason' && <RefundReasonSheet order={order} shop={shop} />}
    </div>
  );
}

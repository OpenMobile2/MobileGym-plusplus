import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AppImg, Sheet, showToast } from './common';
import { IcChat, IcClose, IcPhone } from '../res/icons';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { fmt } from '../utils';
import type { TbOrder, TbShop } from '../types';

/** 售后原因(spec order.refundReasonSheet,证据 IMG_6056/6072) */
const REASONS = [
  '配送超时',
  '收到的餐品少了/错了',
  '未收到餐',
  '餐品撒漏',
  '餐品图片/备注不符',
  '餐品口味不佳',
  '餐品安全质量不佳',
];
const SUB_REASONS = ['配送时间太长', '商家迟迟未出餐'];

/**
 * 售后原因弹层(共享:订单详情/退款表单重选/智能客服)。
 * 选择结果写入 refundDraft(跨页草稿),确认后进入退款申请表单。
 */
export function RefundReasonSheet({ order, shop }: { order: TbOrder; shop: TbShop }) {
  const { bindTap, bindBack, back } = useTbsgGestures();
  const location = useLocation();
  const refundDraft = useTbsgStore((s) => s.refundDraft);
  const setRefundDraft = useTbsgStore((s) => s.setRefundDraft);
  const [reason, setReason] = useState<string | null>(refundDraft.reason || null);
  const [subReason, setSubReason] = useState<string | null>(refundDraft.subReason);

  const onOrderPage = /^\/order\/[^/]+$/.test(location.pathname);
  const onFormPage = location.pathname.endsWith('/refund/apply');
  const canConfirm = !!reason && (reason !== '配送超时' || !!subReason);

  const saveDraft = () => {
    setRefundDraft({ reason: reason ?? '', subReason: reason === '配送超时' ? subReason : null });
  };

  const contactMsgBinding = onOrderPage
    ? bindTap<HTMLButtonElement>('refund.contact.chat', { params: { shopId: shop.id }, stopPropagation: true })
    : onFormPage
      ? bindTap<HTMLButtonElement>('shop.chat-open', { params: { shopId: shop.id }, stopPropagation: true })
      : bindTap<HTMLButtonElement>(
        { kind: 'action', id: 'refund.contact.call.stub' },
        { onTrigger: () => showToast('该功能暂未开放'), stopPropagation: true },
      );

  return (
    <Sheet maxH="88%">
      {/* 标题 + × */}
      <div className="relative h-12 flex items-center justify-center shrink-0">
        <div className="text-[17px] font-semibold text-[#1A1A1A]">售后原因</div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'refund.reason.close' }, { onTrigger: () => back() })}
          className="absolute right-3 top-2 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center border-none cursor-pointer"
          aria-label="关闭"
        >
          <IcClose size={18} className="text-[#1A1A1A]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 店铺 + 商品摘要 */}
        <div className="px-4">
          <div className="text-[15px] font-semibold text-[#1A1A1A]">{shop.fullName}</div>
          <div className="flex items-center mt-2">
            <div className="flex gap-2 flex-1">
              {order.lines.slice(0, 3).map((l, i) => (
                <AppImg key={i} src={l.image} className="w-14 h-14 rounded-lg object-cover" />
              ))}
            </div>
            <div className="text-right">
              <div className="text-[13px] text-[#1A1A1A]">共{order.lines.reduce((a, l) => a + l.qty, 0)}件商品</div>
              <div className="text-[15px] font-semibold text-[#1A1A1A] mt-0.5">实付 ¥{fmt(order.totalPaid)}</div>
            </div>
          </div>

          {/* 联系商户条 */}
          <div className="mt-3 rounded-xl bg-[#FDEFE4] flex items-center px-3 py-2.5">
            <div className="flex-1 text-[14px] text-[#ED6C2C] font-medium">联系商户，更快处理问题</div>
            <button {...contactMsgBinding} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="消息">
              <IcChat size={20} className="text-[#ED6C2C]" />
            </button>
            <div className="w-px h-4 bg-[#F0C9AC] mx-1" />
            <button
              {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'refund.contact.call.stub' }, { onTrigger: () => showToast('该功能暂未开放') })}
              className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
              aria-label="电话"
            >
              <IcPhone size={18} className="text-[#ED6C2C]" />
            </button>
          </div>
        </div>

        <div className="h-2 bg-[#F3F6F8] mt-3" />

        {/* 原因单选 */}
        <div className="px-4 pb-4">
          <div className="text-[16px] font-semibold text-[#1A1A1A] py-3">选择真实原因，避免影响处理结果</div>
          {REASONS.map((r) => (
            <div key={r}>
              <div
                {...bindTap<HTMLDivElement>(
                  { kind: 'action', id: 'refund.reason.select' },
                  {
                    params: { reason: r },
                    onTrigger: () => {
                      setReason(r);
                      if (r !== '配送超时') setSubReason(null);
                    },
                  },
                )}
                className="flex items-center py-3.5 cursor-pointer"
              >
                <div className="flex-1 text-[15px] text-[#1A1A1A]">
                  {r}
                  {r === '配送超时' && reason === '配送超时' && !subReason && (
                    <span className="text-[12px] text-[#ED6C2C] ml-2">具体原因必选</span>
                  )}
                </div>
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    reason === r ? 'bg-[#ED6C2C]' : 'border border-gray-300'
                  }`}
                >
                  {reason === r && <span className="text-white text-[12px] leading-none">✓</span>}
                </span>
              </div>
              {r === '配送超时' && reason === '配送超时' && (
                <div className="pb-2">
                  <div className="flex gap-2">
                    {SUB_REASONS.map((sub) => (
                      <button
                        key={sub}
                        {...bindTap<HTMLButtonElement>(
                          { kind: 'action', id: 'refund.subreason.select' },
                          { params: { sub }, onTrigger: () => setSubReason(sub) },
                        )}
                        className={`px-3 h-9 rounded-lg text-[13px] border cursor-pointer ${
                          subReason === sub
                            ? 'bg-[#FDEFE4] text-[#ED6C2C] border-[#ED6C2C]'
                            : 'bg-[#F5F6F7] text-[#1A1A1A] border-transparent'
                        }`}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2 rounded-xl bg-[#FDEFE4] flex items-center px-3 py-2">
                    <div className="flex-1 text-[13px] text-[#ED6C2C]">直接联系骑士，更快处理</div>
                    <button
                      {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'refund.contact.call.stub' }, { onTrigger: () => showToast('该功能暂未开放') })}
                      className="h-8 px-3 rounded-lg text-[13px] text-[#7A3B12] border-none cursor-pointer"
                      style={{ background: 'linear-gradient(90deg,#F5C9A8,#EDA167)' }}
                    >
                      致电骑士
                    </button>
                  </div>
                </div>
              )}
              <div className="h-px bg-[#EEEEEE]" />
            </div>
          ))}
        </div>
      </div>

      {/* 底部按钮 */}
      <div className="p-3 shrink-0 bg-white">
        {canConfirm ? (
          onFormPage ? (
            <button
              {...bindBack<HTMLButtonElement>({ beforeTrigger: () => saveDraft() })}
              className="w-full h-11 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
            >
              确认
            </button>
          ) : (
            <button
              {...bindTap<HTMLButtonElement>('refund.reason.next', {
                params: { orderId: order.id },
                beforeTrigger: () => saveDraft(),
              })}
              className="w-full h-11 rounded-full bg-[#ED6C2C] text-white text-[16px] font-semibold border-none cursor-pointer"
            >
              确认
            </button>
          )
        ) : (
          <button
            onClick={() => showToast(reason ? '请先选择具体原因' : '请先选择原因')}
            className="w-full h-11 rounded-full bg-[#F7C4A3] text-white text-[16px] font-semibold border-none cursor-pointer"
          >
            {reason ? '确认' : '请先选择原因'}
          </button>
        )}
      </div>
    </Sheet>
  );
}

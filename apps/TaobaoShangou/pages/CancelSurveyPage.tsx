import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { useTbsgStore } from '../state';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { IcBack } from '../res/icons';
import { useStatusBarBg } from '../statusbar';

const REASONS = [
  '商家缺货',
  '忘记写备注/发票',
  '商家暂时不营业',
  '忘记使用红包/优惠券',
  '我不想要了',
  '信息填写错误(地址/时间/联系方式)',
  '买多/买错/买少',
];

/** 取消成功+原因调研页(spec order.cancelSurvey,证据 IMG_6077) */
export default function CancelSurveyPage() {
  const s = useAppStrings(strings, stringsEn);
  const { bindTap, bindBack } = useTbsgGestures();
  useStatusBarBg('#ffffff');
  const { orderId } = useParams<{ orderId: string }>();
  const orders = useTbsgStore((st) => st.orders);
  const cancelOrder = useTbsgStore((st) => st.cancelOrder);
  const submitCancelReason = useTbsgStore((st) => st.submitCancelReason);
  const [reason, setReason] = useState<string | null>(null);

  const order = orders.find((o) => o.id === orderId);

  // 取消在进入本页时生效(极速退)
  useEffect(() => {
    if (orderId && order && ['unpaid', 'preparing', 'delivering'].includes(order.status)) {
      cancelOrder(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 头部渐变 + 退角标 */}
      <div className="shrink-0 relative" style={{ background: 'linear-gradient(180deg,#FDF3EA 0%,#FFFFFF 100%)' }}>
        <div className="flex items-center h-11 px-2">
          <button {...bindBack<HTMLButtonElement>()} className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label="返回">
            <IcBack size={22} className="text-[#1A1A1A]" />
          </button>
        </div>
        <div
          className="absolute right-6 top-2 w-16 h-16 rounded-2xl flex items-center justify-center rotate-6"
          style={{ background: 'linear-gradient(150deg,#F9A65C 0%,#ED6C2C 60%,#D9581C 100%)', boxShadow: '0 6px 14px rgba(237,108,44,0.35)' }}
        >
          <span className="text-white text-[30px] font-bold" style={{ textShadow: '0 2px 3px rgba(0,0,0,0.2)' }}>退</span>
        </div>
        <div className="px-4 pb-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#3CB268] text-white flex items-center justify-center text-[15px]">✓</span>
            <span className="text-[24px] font-bold text-[#1A1A1A]">订单已取消</span>
          </div>
          <div className="text-[14px] text-[#1A1A1A] mt-2">由于您的信用良好，本次享受极速退</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-[17px] font-bold text-[#1A1A1A] py-3">请选择真实原因，帮助我们改进</div>
        {REASONS.map((r) => (
          <div key={r}>
            <div
              {...bindTap<HTMLDivElement>(
                { kind: 'action', id: 'cancel.survey.select' },
                { params: { reason: r }, onTrigger: () => setReason(r) },
              )}
              className="flex items-center py-3.5 cursor-pointer"
            >
              <span className="flex-1 text-[15px] text-[#1A1A1A]">{r}</span>
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center ${
                  reason === r ? 'bg-[#ED6C2C]' : 'border border-gray-300'
                }`}
              >
                {reason === r && <span className="text-white text-[12px] leading-none">✓</span>}
              </span>
            </div>
            <div className="h-px bg-[#EEEEEE]" />
          </div>
        ))}
      </div>

      <div className="p-3 shrink-0 bg-[#F3F6F8]">
        <button
          {...bindTap<HTMLButtonElement>('cancel.survey.submit', {
            params: { orderId: orderId ?? '' },
            beforeTrigger: () => submitCancelReason(orderId ?? '', reason ?? '我不想要了'),
          })}
          className={`w-full h-11 rounded-full text-white text-[16px] font-semibold border-none cursor-pointer ${
            reason ? 'bg-[#ED6C2C]' : 'bg-[#F7C4A3]'
          }`}
        >
          {s.submit}
        </button>
      </div>
    </div>
  );
}

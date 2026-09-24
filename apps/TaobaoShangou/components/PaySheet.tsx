import React from 'react';
import { IcClose, IcRight } from '../res/icons';
import { fmt } from '../utils';

/**
 * 模拟收银台弹层(跨域契约:交易域产出,订单域复用;证据 IMG_R045 简化)
 * 注意:× 不走 bindBack —— 关闭语义由调用方通过 closeBinding 决定
 * (结算页=弃单生成待支付订单 qa:R4;订单详情页=普通关闭)。
 */
export function PaySheet({
  amount, payBinding, closeBinding,
}: {
  amount: number;
  payBinding: React.HTMLAttributes<HTMLButtonElement>;
  closeBinding: React.HTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      {/* 蒙层:仅视觉,关闭走右上×(closeBinding) */}
      <div className="absolute inset-0 bg-[#1C2333]/70" />
      <div className="relative bg-[#F5F7FA] rounded-t-[20px] overflow-hidden flex flex-col pb-6">
        {/* 头部:更改付款方式(静态灰字) + 右上× */}
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="text-[13px] text-[#4E6EF2]">更改付款方式</span>
          <button
            {...(closeBinding as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            className="w-8 h-8 -mr-1 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="关闭收银台"
          >
            <IcClose size={20} className="text-[#333333]" />
          </button>
        </div>
        {/* 商户 + 金额 */}
        <div className="flex flex-col items-center mt-1">
          <div className="text-[14px] text-[#666666]">淘宝闪购商户</div>
          <div className="mt-1 text-[#1A1A1A] font-bold leading-none">
            <span className="text-[26px] align-baseline">¥</span>
            <span className="text-[44px]">{fmt(amount)}</span>
          </div>
        </div>
        {/* 付款方式 */}
        <div className="mx-4 mt-5 bg-white rounded-xl overflow-hidden">
          <div className="flex items-center px-4 py-3.5">
            <span className="w-7 h-7 rounded-md bg-[#1677FF] text-white text-[15px] font-bold flex items-center justify-center shrink-0">支</span>
            <div className="flex-1 ml-3">
              <div className="text-[15px] text-[#1A1A1A]">支付宝余额<span className="text-[#1677FF] text-[11px] ml-1">(推荐)</span></div>
              <div className="text-[11px] text-[#999999] mt-0.5">优先使用此方式,按支付顺序完成付款</div>
            </div>
            <span className="w-5 h-5 rounded-full bg-[#1677FF] flex items-center justify-center shrink-0">
              <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6.2 5 9l5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
          </div>
          <div className="h-px bg-[#EEEEEE] mx-4" />
          <div className="flex items-center px-4 py-3.5">
            <span className="w-7 h-7 rounded-full bg-[#EAF2FF] text-[#1677FF] text-[13px] font-bold flex items-center justify-center shrink-0">呗</span>
            <div className="flex-1 ml-3 text-[15px] text-[#999999]">花呗</div>
            <IcRight size={16} className="text-[#CCCCCC] shrink-0" />
          </div>
        </div>
        {/* 立即付款 */}
        <div className="px-4 mt-6">
          <button
            {...(payBinding as React.ButtonHTMLAttributes<HTMLButtonElement>)}
            className="w-full h-12 rounded-full bg-[#1677FF] text-white text-[17px] font-semibold border-none cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="w-5 h-5 rounded bg-white/90 text-[#1677FF] text-[12px] font-bold flex items-center justify-center">支</span>
            立即付款
          </button>
        </div>
      </div>
    </div>
  );
}

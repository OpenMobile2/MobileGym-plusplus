import React from 'react';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { Sheet, showToast } from './common';
import { IcClose } from '../res/icons';

/**
 * 超级吃货卡购买弹层(spec shop.foodcardSheet,IMG_6022 金卡)
 * 点卡面/价格区=模拟购卡;协议3链接=stub;×=关闭
 */
export function FoodcardSheet() {
  const { bindTap, back } = useTbsgGestures();
  const foodCard = useTbsgStore((s) => s.foodCard);
  const buyFoodCard = useTbsgStore((s) => s.buyFoodCard);

  const buyBinding = bindTap<HTMLDivElement>(
    { kind: 'action', id: 'shop.foodcard.buy' },
    {
      onTrigger: () => {
        if (foodCard.owned) {
          showToast('你已拥有超级吃货卡');
          return;
        }
        buyFoodCard();
        showToast('购卡成功,已放入券包「卡」');
        back();
      },
    },
  );

  return (
    <Sheet maxH="70%">
      {/* 标题 */}
      <div className="relative shrink-0 pt-4 pb-2">
        <div className="text-center text-[17px] font-bold text-[#1A1A1A]">购买超级吃货卡</div>
        <button
          {...bindTap<HTMLButtonElement>({ kind: 'action', id: 'shop.foodcardSheet.close' }, { onTrigger: () => back() })}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-[#F3F6F8] border-none flex items-center justify-center cursor-pointer"
          aria-label="关闭"
        >
          <IcClose size={18} className="text-[#1A1A1A]" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6" data-scroll-container="foodcard-sheet" data-scroll-direction="vertical">
        <div {...buyBinding} className="rounded-2xl border border-[#EEEEEE] bg-white p-4 cursor-pointer">
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-bold text-[#1A1A1A]">立即购卡,红包爆涨超省钱</span>
            <span className="inline-flex items-center gap-1">
              <span className="text-[10px] text-white rounded-full px-2 py-0.5" style={{ background: 'linear-gradient(90deg,#2B3A8F,#4557C9)' }}>悦享特权</span>
              <span className={`w-5 h-5 rounded-full border-2 ${foodCard.owned ? 'border-[#ED6C2C] bg-[#ED6C2C]' : 'border-[#CCCCCC]'}`} />
            </span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            {/* 金色卡面 */}
            <div className="w-40 shrink-0 rounded-xl px-3 py-3 text-[#8A5A16] border border-[#E8C48A]" style={{ background: 'linear-gradient(135deg,#F9E3B5,#EFC77F)' }}>
              <div className="text-[11px] font-semibold">👑 超级吃货卡</div>
              <div className="font-bold leading-tight mt-1">
                <span className="text-[22px]">¥5</span><span className="text-[11px]">起</span>
                <span className="text-[13px] mx-1">×</span><span className="text-[22px]">40</span><span className="text-[11px]">张</span>
              </div>
              <div className="text-[12px] mt-1 text-center">无门槛</div>
              <div className="flex justify-center gap-1 mt-1.5">
                <span className="text-[10px] bg-white/60 rounded px-1.5 py-0.5">爆红包</span>
                <span className="text-[10px] bg-white/60 rounded px-1.5 py-0.5">可爆涨</span>
              </div>
            </div>
            {/* 价格区 */}
            <div className="min-w-0">
              <div className="text-[16px] font-bold text-[#1A1A1A]">200元超级吃货卡</div>
              <div className="text-[11px] text-[#A46A22] bg-[#F8DFAE] rounded px-1.5 py-0.5 inline-block mt-1.5">本单立减 ¥5↑22</div>
              <div className="mt-2">
                {foodCard.owned ? (
                  <span className="text-[14px] font-bold text-[#999999]">已购买</span>
                ) : (
                  <>
                    <span className="text-[#F53F3F] font-bold"><span className="text-[13px]">¥</span><span className="text-[24px]">0.01</span></span>
                    <span className="text-[13px] text-[#999999] line-through ml-1.5">¥200</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 协议行 */}
        <div className="flex flex-wrap items-center gap-x-1 mt-3 text-[11px] text-[#999999]">
          <span>31天内有效</span>
          <span className="mx-0.5">|</span>
          <span>购买即视为同意</span>
          {['服务协议', '超级吃货卡权益说明', '相关协议'].map((t) => (
            <button
              key={t}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'shop.foodcard.agreement.stub' },
                { onTrigger: () => showToast('该功能暂未开放') },
              )}
              className="text-[11px] text-[#1A1A1A] font-medium bg-transparent border-none cursor-pointer px-0.5"
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

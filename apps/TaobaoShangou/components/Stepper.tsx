import React from 'react';
import { IcMinus, IcPlus } from '../res/icons';

/**
 * 橙色圆形 +/− 步进器(店铺域共享,IMG_6019)
 * qty>0 时才显示数字与−;绑定由调用方传入(action 字面量在调用处)
 */
export function Stepper({
  qty, addBinding, minusBinding,
}: {
  qty: number;
  addBinding: React.HTMLAttributes<HTMLButtonElement>;
  minusBinding: React.HTMLAttributes<HTMLButtonElement>;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      {qty > 0 && (
        <>
          <button
            {...minusBinding}
            className="w-6 h-6 rounded-full border border-[#ED6C2C] bg-white text-[#ED6C2C] flex items-center justify-center cursor-pointer p-0"
            aria-label="减少"
          >
            <IcMinus size={14} />
          </button>
          <span className="text-[14px] font-semibold text-[#1A1A1A] min-w-4 text-center">{qty}</span>
        </>
      )}
      <button
        {...addBinding}
        className="w-6 h-6 rounded-full bg-[#ED6C2C] border-none text-white flex items-center justify-center cursor-pointer p-0"
        aria-label="加购"
      >
        <IcPlus size={15} />
      </button>
    </span>
  );
}

import React, { useMemo } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { MascotCat } from '../components/ui';
import { toast } from '../components/toast';
import { money, todayTs } from '../components/format';
import { monthBills, sumByType } from '../components/derive';
import { IcClose } from '../res/icons';

export default function SharePage() {
  const { bindTap, bindAction } = useKapiGestures();
  const bills = useKapiStore((s) => s.bills);
  const currentLedgerId = useKapiStore((s) => s.currentLedgerId);
  const now = todayTs();
  const mBills = useMemo(() => monthBills(bills, currentLedgerId, now), [bills, currentLedgerId, now]);
  const expense = sumByType(mBills, 'expense');
  const income = sumByType(mBills, 'income');

  return (
    <div className="flex flex-col h-full bg-[#1A1D26]">
      <div className="flex items-center justify-end px-3 h-11 shrink-0">
        <button {...bindTap('share.close')} className="bg-transparent border-none cursor-pointer"><IcClose size={22} className="text-white" /></button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-2">
        <div className="bg-white rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MascotCat size={36} />
            <span className="text-[16px] font-bold text-[#1A1D26]">卡皮记账 · 2026年6月</span>
          </div>
          <div className="text-center py-4">
            <div className="text-[13px] text-[#8A92A6]">本月支出</div>
            <div className="text-[34px] font-bold text-[#3D6CF0]">¥{money(expense)}</div>
          </div>
          <div className="flex justify-around py-3 border-t border-[#EDEFF4]">
            <div className="text-center"><div className="text-[12px] text-[#8A92A6]">收入</div><div className="text-[16px] font-bold text-[#FF7B4A]">¥{money(income)}</div></div>
            <div className="text-center"><div className="text-[12px] text-[#8A92A6]">结余</div><div className="text-[16px] font-bold text-[#22B07D]">¥{money(income - expense)}</div></div>
            <div className="text-center"><div className="text-[12px] text-[#8A92A6]">笔数</div><div className="text-[16px] font-bold text-[#1A1D26]">{mBills.length}</div></div>
          </div>
          <div className="text-center text-[11px] text-[#B3B9C6] mt-4">长按识别 · 一起用卡皮记账</div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <button {...bindAction('share.date.select.period', () => toast('切换统计区间'), { value: 'month' })} className="px-5 py-2 rounded-full bg-white/15 text-white text-[14px] border-none cursor-pointer">切换日期</button>
          <button {...bindAction('share.save.noop', () => toast('已保存到相册'))} className="px-5 py-2 rounded-full bg-[#4B6EF5] text-white text-[14px] border-none cursor-pointer">保存图片</button>
        </div>
      </div>
    </div>
  );
}

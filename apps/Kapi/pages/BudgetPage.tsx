import React, { useMemo } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, CategoryIcon } from '../components/ui';
import { money, dateKey, todayTs } from '../components/format';
import * as TimeService from '@/os/TimeService';
import { monthBills, sumByType } from '../components/derive';
import { IcEye, IcEyeOff, IcPlus, IcArrowRight } from '../res/icons';

export default function BudgetPage() {
  const { bindBack, bindTap, bindAction, bindLongPress } = useKapiGestures();
  const bills = useKapiStore((s) => s.bills);
  const currentLedgerId = useKapiStore((s) => s.currentLedgerId);
  const budget = useKapiStore((s) => s.budget);
  const categories = useKapiStore((s) => s.categories);
  const amountVisible = useKapiStore((s) => s.amountVisible);
  const toggleAmountVisible = useKapiStore((s) => s.toggleAmountVisible);

  const now = todayTs();
  const mBills = useMemo(() => monthBills(bills, currentLedgerId, now), [bills, currentLedgerId, now]);
  const expense = useMemo(() => sumByType(mBills, 'expense'), [mBills]);
  const usedPct = Math.min(100, Math.round((expense / (budget.monthly || 1)) * 100));
  const show = (n: number) => (amountVisible ? money(n) : '****');
  const catName = (cid: string) => [...categories.expense].find((c) => c.id === cid);

  const base = TimeService.fromTimestamp(now);
  const daysInMonth = TimeService.fromLocalParts(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  const defaultDaily = Math.round((budget.monthly / daysInMonth) * 100) / 100;

  return (
    <div className="flex flex-col h-full">
      <TopBar title="预算管理" backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="budget" data-scroll-direction="vertical">
        <Card className="p-4 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-[#8A92A6]">本月预算</span>
            <button {...bindAction('budget.amount.toggle.visible', toggleAmountVisible)} className="bg-transparent border-none cursor-pointer">
              {amountVisible ? <IcEye size={16} className="text-[#B3B9C6]" /> : <IcEyeOff size={16} className="text-[#B3B9C6]" />}
            </button>
          </div>
          <button {...bindAction('budget.month.input.value', () => undefined, { value: String(budget.monthly) })} className="text-left bg-transparent border-none cursor-pointer w-full">
            <span className="text-[26px] font-bold text-[#1A1D26]">¥{show(budget.monthly)}</span>
          </button>
          <div className="mt-3 w-full h-2 rounded-full bg-[#EDEFF4] overflow-hidden">
            <div className="h-full bg-[#4B6EF5]" style={{ width: `${usedPct}%` }} />
          </div>
          <div className="text-[12px] text-[#8A92A6] mt-1">已用 ¥{show(expense)} · 剩余 ¥{show(budget.monthly - expense)}</div>
        </Card>

        <div className="text-[15px] font-semibold text-[#1A1D26] mt-4 mb-2 px-1">分类预算</div>
        <Card>
          {budget.categories.map((cb) => {
            const c = catName(cb.categoryId);
            const used = mBills.filter((b) => b.categoryId === cb.categoryId).reduce((a, b) => a + b.amount, 0);
            return (
              <div key={cb.categoryId} className="flex items-center gap-3 px-4 py-3 border-b border-[#EDEFF4] last:border-0">
                {c && <CategoryIcon icon={c.icon} color={c.color} size={34} />}
                <span className="flex-1 text-[15px] text-[#1A1D26]">{c?.name}</span>
                <span className="text-[13px] text-[#8A92A6]">¥{show(used)} / ¥{money(cb.amount)}</span>
              </div>
            );
          })}
          <button {...bindTap('budget.addCategory.open')} className="w-full flex items-center gap-2 px-4 py-3 text-[#4B6EF5] text-[15px] bg-transparent border-none cursor-pointer">
            <IcPlus size={18} /> 添加分类预算
          </button>
        </Card>

        <div className="text-[15px] font-semibold text-[#1A1D26] mt-4 mb-2 px-1">动态日预算</div>
        <Card className="p-3">
          <div className="text-[12px] text-[#8A92A6] mb-2">长按某天可单独调整(默认 ¥{money(defaultDaily)}/天)</div>
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ts = TimeService.fromLocalParts(base.getFullYear(), base.getMonth(), day, 12, 0).getTime();
              const k = dateKey(ts);
              const v = budget.daily[k] ?? defaultDaily;
              return (
                <button
                  key={day}
                  {...bindAction('budget.day.select.date', () => undefined, { value: k })}
                  {...bindLongPress('budget.editDay.open')}
                  className="flex flex-col items-center py-1 rounded-lg bg-[#F4F6FA] border-none cursor-pointer"
                >
                  <span className="text-[12px] text-[#1A1D26]">{day}</span>
                  <span className="text-[8px] text-[#8A92A6]">{money(v).split('.')[0]}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

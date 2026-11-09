import React, { useMemo } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, CategoryIcon } from '../components/ui';
import { money, dateKey, todayTs } from '../components/format';
import * as TimeService from '@/os/TimeService';
import { monthBills, sumByType } from '../components/derive';
import { IcEye, IcEyeOff, IcPlus, IcArrowRight } from '../res/icons';
import { useStrings } from '../hooks/useStrings';

export default function BudgetPage() {
  const { bindBack, bindTap, bindAction, bindLongPress } = useKapiGestures();
  const s = useStrings();
  const bills = useKapiStore((st) => st.bills);
  const currentLedgerId = useKapiStore((st) => st.currentLedgerId);
  const budget = useKapiStore((st) => st.budget);
  const categories = useKapiStore((st) => st.categories);
  const amountVisible = useKapiStore((st) => st.amountVisible);
  const toggleAmountVisible = useKapiStore((st) => st.toggleAmountVisible);

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
      <TopBar title={s.budgetManageTitle} backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="budget" data-scroll-direction="vertical">
        <Card className="p-4 mt-1">
          <div className="flex items-center justify-between">
            <span className="text-[14px] text-app-text-muted">{s.monthBudgetLabel}</span>
            <button {...bindAction('budget.amount.toggle.visible', toggleAmountVisible)} className="bg-transparent border-none cursor-pointer">
              {amountVisible ? <IcEye size={16} className="text-app-text-muted" /> : <IcEyeOff size={16} className="text-app-text-muted" />}
            </button>
          </div>
          <button {...bindAction('budget.month.input.value', () => undefined, { value: String(budget.monthly) })} className="text-left bg-transparent border-none cursor-pointer w-full">
            <span className="text-[26px] font-bold text-app-text">¥{show(budget.monthly)}</span>
          </button>
          <div className="mt-3 w-full h-2 rounded-full bg-[#EDEFF4] overflow-hidden">
            <div className="h-full bg-[#4B6EF5]" style={{ width: `${usedPct}%` }} />
          </div>
          <div className="text-[12px] text-app-text-muted mt-1">{s.usedPrefix} ¥{show(expense)} · {s.remainingLabel} ¥{show(budget.monthly - expense)}</div>
        </Card>

        <div className="text-[15px] font-semibold text-app-text mt-4 mb-2 px-1">{s.categoryBudgetTitle}</div>
        <Card>
          {budget.categories.map((cb) => {
            const c = catName(cb.categoryId);
            const used = mBills.filter((b) => b.categoryId === cb.categoryId).reduce((a, b) => a + b.amount, 0);
            return (
              <div key={cb.categoryId} className="flex items-center gap-3 px-4 py-3 border-b border-app-border last:border-0">
                {c && <CategoryIcon icon={c.icon} color={c.color} size={34} />}
                <span className="flex-1 text-[15px] text-app-text">{c?.name}</span>
                <span className="text-[13px] text-app-text-muted">¥{show(used)} / ¥{money(cb.amount)}</span>
              </div>
            );
          })}
          <button {...bindTap('budget.addCategory.open')} className="w-full flex items-center gap-2 px-4 py-3 text-[#4B6EF5] text-[15px] bg-transparent border-none cursor-pointer">
            <IcPlus size={18} /> {s.addCategoryBudgetBtn}
          </button>
        </Card>

        <div className="text-[15px] font-semibold text-app-text mt-4 mb-2 px-1">{s.dailyBudgetTitle}</div>
        <Card className="p-3">
          <div className="text-[12px] text-app-text-muted mb-2">{s.dailyBudgetHintPrefix}{money(defaultDaily)}{s.dailyBudgetHintSuffix}</div>
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
                  <span className="text-[12px] text-app-text">{day}</span>
                  <span className="text-[8px] text-app-text-muted">{money(v).split('.')[0]}</span>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

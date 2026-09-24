import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, CategoryIcon } from '../components/ui';
import { toast } from '../components/toast';
import { money, fmtTime, todayTs } from '../components/format';
import { monthBills } from '../components/derive';
import { IcNavBack, IcArrowRight, IcSwap } from '../res/icons';

export default function CategoryDetailPage() {
  const { id = '' } = useParams();
  const { bindBack, bindTap, bindAction } = useKapiGestures();
  const bills = useKapiStore((s) => s.bills);
  const currentLedgerId = useKapiStore((s) => s.currentLedgerId);
  const categories = useKapiStore((s) => s.categories);
  const cat = [...categories.expense, ...categories.income].find((c) => c.id === id);

  const now = todayTs();
  const catBills = useMemo(
    () => monthBills(bills, currentLedgerId, now).filter((b) => b.categoryId === id).sort((a, b) => b.date - a.date),
    [bills, currentLedgerId, now, id],
  );
  const total = catBills.reduce((a, b) => a + b.amount, 0);

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={
          <button {...bindAction('categoryDetail.category.select.switch', () => toast('可切换查看的分类'), { value: id })} className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[17px] font-semibold text-[#1A1D26]">
            {cat?.name ?? '分类'} <IcSwap size={15} className="text-[#8A92A6]" />
          </button>
        }
        backBind={bindBack()}
      />
      <div className="flex items-center justify-center gap-6 py-2 shrink-0">
        <button {...bindAction('categoryDetail.month.select.period', () => toast('上一月'), { value: 'prev' })} className="bg-transparent border-none cursor-pointer"><IcNavBack size={18} className="text-[#8A92A6]" /></button>
        <span className="text-[14px] text-[#1A1D26]">6/2026</span>
        <button {...bindAction('categoryDetail.month.select.period', () => toast('下一月'), { value: 'next' })} className="bg-transparent border-none cursor-pointer"><IcArrowRight size={18} className="text-[#8A92A6]" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="category-detail" data-scroll-direction="vertical">
        <Card className="p-4 flex items-center gap-3">
          {cat && <CategoryIcon icon={cat.icon} color={cat.color} size={48} />}
          <div>
            <div className="text-[12px] text-[#8A92A6]">本月合计</div>
            <div className="text-[22px] font-bold text-[#3D6CF0]">¥{money(total)}</div>
            <div className="text-[12px] text-[#8A92A6]">共 {catBills.length} 笔</div>
          </div>
        </Card>

        {cat?.subs && cat.subs.length > 0 && (
          <Card className="mt-3">
            {cat.subs.map((sub) => (
              <button key={sub.id} {...bindTap('categoryDetail.sub.open', { params: { id: sub.id } })} className="w-full flex items-center px-4 py-3 border-b border-[#EDEFF4] last:border-0 bg-transparent cursor-pointer text-left">
                <span className="flex-1 text-[15px] text-[#1A1D26]">{sub.name}</span>
                <IcArrowRight size={16} className="text-[#C5CAD4]" />
              </button>
            ))}
          </Card>
        )}

        <div className="text-[14px] font-semibold text-[#1A1D26] mt-4 mb-2 px-1">账单明细</div>
        {catBills.map((b) => (
          <Card key={b.id} className="mb-2">
            <button {...bindTap('categoryDetail.bill.open', { params: { id: b.id } })} className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left">
              <CategoryIcon icon={b.icon} color={b.color} size={38} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] text-[#1A1D26] truncate">{b.note || b.categoryName}</div>
                <div className="text-[12px] text-[#B3B9C6]">{fmtTime(b.date)}</div>
              </div>
              <span className="text-[15px] text-[#3D6CF0]">-¥{money(b.amount)}</span>
            </button>
          </Card>
        ))}

        <button {...bindAction('categoryDetail.coupon.noop', () => toast('该功能暂未开放'))} className="w-full mt-2 rounded-2xl bg-gradient-to-r from-[#FFF1E6] to-[#FFE8F0] p-4 text-left border-none cursor-pointer">
          <div className="text-[13px] text-[#B0743A]">🎟 相关优惠 · 点击领取</div>
        </button>
      </div>
    </div>
  );
}

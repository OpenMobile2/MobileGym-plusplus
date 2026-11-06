import React, { useMemo } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { Card, MascotCat, CategoryIcon, TopTabs } from '../components/ui';
import { toast } from '../components/toast';
import { money, fmtDayLabel, fmtTime, fmtMonthLabel, todayTs } from '../components/format';
import { monthBills, sumByType, groupByDay } from '../components/derive';
import {
  IcMenu, IcSearch, IcEye, IcEyeOff, IcVoice, IcLike, IcDislike, IcRefresh, IcShare, IcPlus, IcArrowDown,
} from '../res/icons';
import { useStrings } from '../hooks/useStrings';

export default function HomePage() {
  const { bindTap, bindAction } = useKapiGestures();
  const s = useStrings();
  const bills = useKapiStore((st) => st.bills);
  const ledgers = useKapiStore((st) => st.ledgers);
  const currentLedgerId = useKapiStore((st) => st.currentLedgerId);
  const budget = useKapiStore((st) => st.budget);
  const amountVisible = useKapiStore((st) => st.amountVisible);
  const topCardView = useKapiStore((st) => st.topCardView);
  const aiMessages = useKapiStore((st) => st.aiMessages);
  const toggleAmountVisible = useKapiStore((st) => st.toggleAmountVisible);
  const setTopCardView = useKapiStore((st) => st.setTopCardView);

  const now = todayTs();
  const mBills = useMemo(() => monthBills(bills, currentLedgerId, now), [bills, currentLedgerId, now]);
  const expense = useMemo(() => sumByType(mBills, 'expense'), [mBills]);
  const income = useMemo(() => sumByType(mBills, 'income'), [mBills]);
  const groups = useMemo(() => groupByDay(monthBills(bills, currentLedgerId, now)), [bills, currentLedgerId, now]);
  const ledgerName = ledgers.find((l) => l.id === currentLedgerId)?.name ?? s.defaultLedgerName;
  const remaining = Math.round((budget.monthly - expense) * 100) / 100;
  const usedPct = Math.min(100, Math.round((expense / (budget.monthly || 1)) * 100));
  const lastAi = [...aiMessages].reverse().find((m) => m.role === 'ai');
  const show = (n: number) => (amountVisible ? money(n) : '****');

  return (
    <div className="flex flex-col h-full animate-[fade-in_.15s_ease]">
      {/* 顶栏:记录/AI助手 切换器绝对居中,切 tab 不跳动(F8) */}
      <div className="relative flex items-center px-3 h-11 shrink-0">
        <button {...bindTap('home.drawer.open')} className="bg-transparent border-none cursor-pointer p-0"><IcMenu size={22} className="text-app-text" /></button>
        <div className="absolute left-1/2 -translate-x-1/2">
          <TopTabs active="record" aiBind={bindTap('home.ai.open')} />
        </div>
        <span className="flex-1" />
        <button {...bindTap('home.search.open')} className="bg-transparent border-none cursor-pointer p-0"><IcSearch size={20} className="text-app-text" /></button>
        <button {...bindTap('home.ledger.open')} className="flex items-center gap-0.5 text-[14px] text-app-text bg-transparent border-none cursor-pointer whitespace-nowrap">
          {ledgerName} <IcArrowDown size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-4" data-scroll-container="home-feed" data-scroll-direction="vertical">
        {/* 顶卡:预算/收支 */}
        <Card className="p-4 mt-1">
          <div className="flex items-center justify-between mb-2">
            <button {...bindTap('home.stats.open')} className="flex items-center gap-1 text-[13px] text-app-text-muted bg-transparent border-none cursor-pointer">
              {fmtMonthLabel(now)} ｜ {s.statsLink}
            </button>
            <button
              {...bindAction('home.topCard.toggle.view', () => setTopCardView(topCardView === 'budget' ? 'flow' : 'budget'))}
              className="px-2.5 py-1 rounded-full bg-app-bg text-[12px] text-[#4B6EF5] border-none cursor-pointer"
            >
              {s.flowToggle}
            </button>
          </div>
          {topCardView === 'budget' ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-end gap-2">
                  <button {...bindTap('home.budget.open')} className="text-left bg-transparent border-none cursor-pointer p-0">
                    <div className="text-[13px] text-app-text-muted mb-1">{s.budgetRemaining}</div>
                    <span className="text-[28px] font-bold text-app-text">¥{show(remaining)}</span>
                  </button>
                  <button {...bindAction('home.amount.toggle.visible', toggleAmountVisible)} className="bg-transparent border-none cursor-pointer pb-1">
                    {amountVisible ? <IcEye size={16} className="text-app-text-muted" /> : <IcEyeOff size={16} className="text-app-text-muted" />}
                  </button>
                </div>
                <div className="mt-3 w-40 h-1.5 rounded-full bg-[#EDEFF4] overflow-hidden">
                  <div className="h-full bg-[#4B6EF5]" style={{ width: `${usedPct}%` }} />
                </div>
                <div className="text-[11px] text-app-text-muted mt-1">{s.usedPrefix} ¥{show(expense)} / ¥{money(budget.monthly)}</div>
              </div>
              <button {...bindTap('home.asset.open')} className="w-16 h-16 rounded-full border-[5px] border-[#4B6EF5]/30 flex flex-col items-center justify-center bg-transparent cursor-pointer">
                <span className="text-[10px] text-app-text-muted">{s.todayAvailable}</span>
                <span className="text-[12px] font-bold text-[#4B6EF5]">¥{show(Math.max(0, Math.round((remaining / 27) * 100) / 100))}</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-around text-center">
              <div><div className="text-[12px] text-app-text-muted">{s.expense}</div><div className="text-[20px] font-bold text-[#3D6CF0]">¥{show(expense)}</div></div>
              <div><div className="text-[12px] text-app-text-muted">{s.income}</div><div className="text-[20px] font-bold text-[#FF7B4A]">¥{show(income)}</div></div>
              <div><div className="text-[12px] text-app-text-muted">{s.balance}</div><div className="text-[20px] font-bold text-[#22B07D]">¥{show(income - expense)}</div></div>
            </div>
          )}
          <button {...bindTap('home.asset.open')} className="mt-3 w-full flex items-center justify-center gap-1 py-2 rounded-xl bg-app-bg text-[13px] text-app-text-muted border-none cursor-pointer">
            <IcPlus size={14} /> {s.assetCta}
          </button>
        </Card>

        {/* AI 总结卡 */}
        <Card className="p-4 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <MascotCat size={28} />
            <span className="text-[14px] font-semibold text-app-text">{s.todaySummaryTitle}</span>
            <span className="flex-1" />
            <button {...bindTap('home.aiSummary.open')} className="px-2.5 py-1 rounded-full bg-[#EAF0FE] text-[12px] text-[#4B6EF5] border-none cursor-pointer">{s.askMascotBtn}</button>
          </div>
          <p className="text-[14px] text-[#5A6172] leading-relaxed">{lastAi?.text ?? s.noRecordsYetHint}</p>
          <div className="flex items-center gap-4 mt-3 text-app-text-muted">
            <button {...bindAction('home.aiSummary.feedback.react', () => toast(s.feedbackDoneToast))} className="bg-transparent border-none cursor-pointer"><IcLike size={16} /></button>
            <button {...bindAction('home.aiSummary.feedback.react', () => toast(s.feedbackDoneToast))} className="bg-transparent border-none cursor-pointer"><IcDislike size={16} /></button>
            <button {...bindAction('home.aiSummary.feedback.react', () => toast(s.refreshedDoneToast))} className="bg-transparent border-none cursor-pointer"><IcRefresh size={16} /></button>
          </div>
        </Card>

        {/* 记录明细 */}
        <div className="flex items-center justify-between mt-4 mb-2 px-1">
          <button {...bindTap('home.allList.open')} className="flex items-center gap-1 text-[16px] font-semibold text-app-text bg-transparent border-none cursor-pointer">
            {s.billList}
          </button>
          <button {...bindTap('home.share.open')} className="bg-transparent border-none cursor-pointer"><IcShare size={18} className="text-app-text-muted" /></button>
        </div>

        {groups.length === 0 && <div className="text-center text-[13px] text-app-text-muted py-8">{s.noRecordsThisMonth}</div>}
        {groups.map((g) => (
          <Card key={g.key} className="mb-2.5 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 text-[12px] text-app-text-muted border-b border-app-border">
              <span>{fmtDayLabel(g.ts)}</span>
              <span>{s.expenseAbbr} {money(g.expense)} ｜ {s.incomeAbbr} {money(g.income)}</span>
            </div>
            {g.items.map((b) => (
              <button
                key={b.id}
                {...bindTap('home.bill.open', { params: { id: b.id } })}
                className="w-full flex items-center gap-3 px-4 py-3 bg-transparent border-none cursor-pointer text-left active:bg-app-bg"
              >
                <CategoryIcon icon={b.icon} color={b.color} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] text-app-text truncate">{b.categoryName}{b.note ? ` · ${b.note}` : ''}</div>
                  <div className="text-[12px] text-app-text-muted">{fmtTime(b.date)}</div>
                </div>
                <span className={`text-[16px] font-semibold ${b.type === 'income' ? 'text-[#FF7B4A]' : 'text-[#3D6CF0]'}`}>
                  {b.type === 'income' ? '+' : '-'}¥{money(b.amount)}
                </span>
              </button>
            ))}
          </Card>
        ))}
      </div>

      {/* 记一笔条(chrome.recordBar) */}
      <div className="shrink-0 px-3 py-2 bg-app-bg">
        <div className="flex items-center gap-2 bg-app-surface rounded-full px-3 py-2.5 shadow-[0_2px_8px_rgba(75,110,245,0.12)]">
          <button {...bindTap('recordBar.search.open')} className="bg-transparent border-none cursor-pointer"><IcSearch size={20} className="text-app-text-muted" /></button>
          <button {...bindAction('recordBar.quickEntry.noop', () => toast(s.featureNotAvailable))} className="bg-transparent border-none cursor-pointer"><IcPlus size={20} className="text-app-text-muted" /></button>
          <button {...bindTap('recordBar.record.open')} className="flex-1 text-left text-[14px] text-app-text-muted bg-transparent border-none cursor-pointer">{s.recordBarPlaceholder}</button>
          <button {...bindTap('recordBar.voice.open')} className="bg-transparent border-none cursor-pointer"><IcVoice size={20} className="text-app-text-muted" /></button>
        </div>
      </div>
    </div>
  );
}

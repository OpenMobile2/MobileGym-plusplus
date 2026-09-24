import React, { useMemo, useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, MascotCat, CategoryIcon } from '../components/ui';
import { money, todayTs } from '../components/format';
import { periodRange, rangeBills, sumByType, expenseByCategory } from '../components/derive';
import { STATS_PERIODS } from '../constants';
import { IcNavBack, IcArrowRight, IcArrowDown } from '../res/icons';

const DONUT = ['#4B6EF5', '#7C8BFF', '#9AB0FF', '#C0CCFF', '#5AD0C0', '#FFB23E', '#AAB2C0'];

/** 大额自适应字号:位数多时缩小,避免拥挤/换行(gate4:F10a) */
function amtSize(s: string): string {
  return s.length > 8 ? 'text-[15px]' : s.length > 6 ? 'text-[17px]' : 'text-[20px]';
}

export default function StatsPage() {
  const { bindBack, bindTap, bindAction } = useKapiGestures();
  const bills = useKapiStore((s) => s.bills);
  const currentLedgerId = useKapiStore((s) => s.currentLedgerId);
  const ledgers = useKapiStore((s) => s.ledgers);
  const statsRange = useKapiStore((s) => s._statsRange);
  const [period, setPeriod] = useState<'week' | 'month' | 'year' | 'custom'>('month');
  const [offset, setOffset] = useState(0);
  const [flow, setFlow] = useState<'expense' | 'income'>('expense');
  const [expanded, setExpanded] = useState(false);

  const now = todayTs();
  const range = useMemo(() => periodRange(period, now, offset, statsRange), [period, now, offset, statsRange]);
  const pBills = useMemo(() => rangeBills(bills, currentLedgerId, range), [bills, currentLedgerId, range]);
  const expense = useMemo(() => sumByType(pBills, 'expense'), [pBills]);
  const income = useMemo(() => sumByType(pBills, 'income'), [pBills]);
  const cats = useMemo(() => expenseByCategory(pBills), [pBills]);
  const ranks = useMemo(() => [...pBills].filter((b) => b.type === flow).sort((a, b) => b.amount - a.amount), [pBills, flow]);
  const ledgerName = ledgers.find((l) => l.id === currentLedgerId)?.name ?? '总账本';
  const shownCats = expanded ? cats : cats.slice(0, 5);
  // 翻页:custom 无意义;next 不越过当前真实期(offset>=0 禁用)
  const arrowsOn = period !== 'custom';
  const nextOn = arrowsOn && offset < 0;

  let acc = 0;
  const gradient = cats
    .map((c, i) => {
      const start = acc;
      acc += c.pct;
      return `${DONUT[i % DONUT.length]} ${start}% ${acc}%`;
    })
    .join(', ');

  const switchPeriod = (p: 'week' | 'month' | 'year' | 'custom') => {
    setPeriod(p);
    setOffset(0);
  };

  return (
    <div className="flex flex-col h-full">
      <TopBar
        title={<span className="text-[#4B6EF5] font-bold">Kapi</span>}
        backBind={bindBack()}
        right={<button {...bindTap('stats.ledger.open')} className="flex items-center gap-0.5 text-[13px] text-[#1A1D26] bg-transparent border-none cursor-pointer whitespace-nowrap">{ledgerName}<IcArrowDown size={13} /></button>}
      />
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="stats" data-scroll-direction="vertical">
        {/* 周期 Tab */}
        <div className="flex bg-white rounded-full p-1 mt-1">
          {STATS_PERIODS.map((p) => (
            <button
              key={p.id}
              {...bindAction('stats.period.select.tab', () => switchPeriod(p.id), { value: p.id })}
              className={`flex-1 py-1.5 rounded-full text-[14px] border-none cursor-pointer ${period === p.id ? 'bg-[#EAF0FE] text-[#4B6EF5] font-semibold' : 'bg-transparent text-[#8A92A6]'}`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 py-2">
          <button
            {...bindAction('stats.range.select.shift', () => arrowsOn && setOffset((o) => o - 1), { value: 'prev' })}
            disabled={!arrowsOn}
            className={`bg-transparent border-none ${arrowsOn ? 'cursor-pointer' : 'opacity-30 cursor-default'}`}
          >
            <IcNavBack size={18} className="text-[#8A92A6]" />
          </button>
          <span data-range-label className="text-[14px] text-[#1A1D26] min-w-[120px] text-center whitespace-nowrap">{range.label}</span>
          <button
            {...bindAction('stats.range.select.shift', () => nextOn && setOffset((o) => o + 1), { value: 'next' })}
            disabled={!nextOn}
            className={`bg-transparent border-none ${nextOn ? 'cursor-pointer' : 'opacity-30 cursor-default'}`}
          >
            <IcArrowRight size={18} className="text-[#8A92A6]" />
          </button>
        </div>

        {period === 'custom' && (
          <button
            {...bindTap('stats.customRange.open')}
            className="w-full px-3 py-2.5 rounded-xl bg-white border-none cursor-pointer text-[14px] text-left mb-2 flex items-center justify-between"
          >
            <span className={statsRange ? 'text-[#1A1D26]' : 'text-[#B3B9C6]'}>{statsRange ? range.label : '点击选择起止日期'}</span>
            <IcArrowRight size={16} className="text-[#C5CAD4]" />
          </button>
        )}

        <Card className="p-4 flex justify-around text-center">
          <div><div className="text-[12px] text-[#8A92A6]">支出</div><div className={`${amtSize(money(expense))} font-bold text-[#3D6CF0] whitespace-nowrap`}>¥{money(expense)}</div></div>
          <div><div className="text-[12px] text-[#8A92A6]">收入</div><div className={`${amtSize(money(income))} font-bold text-[#FF7B4A] whitespace-nowrap`}>¥{money(income)}</div></div>
          <div><div className="text-[12px] text-[#8A92A6]">结余</div><div className={`${amtSize(money(income - expense))} font-bold text-[#22B07D] whitespace-nowrap`}>¥{money(income - expense)}</div></div>
        </Card>

        <Card className="p-4 mt-3">
          <div className="flex items-center gap-2 mb-1">
            <MascotCat size={24} />
            <span className="text-[14px] font-semibold text-[#1A1D26]">胖咔分析了账单</span>
          </div>
          <p className="text-[13px] text-[#5A6172] leading-relaxed">不妨尝试每个月找一天体验「极简生活」,或许会发现有些东西其实不是必需的。</p>
          <button {...bindTap('stats.ai.open')} className="mt-2 text-[13px] text-[#4B6EF5] bg-transparent border-none cursor-pointer">更多消费分析,前往AI助手 →</button>
        </Card>

        <Card className="p-4 mt-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[16px] font-semibold text-[#1A1D26]">{flow === 'expense' ? '支出' : '收入'}分类构成</span>
            <div className="flex bg-[#F0F2F8] rounded-full p-0.5">
              {(['expense', 'income'] as const).map((f) => (
                <button key={f} {...bindAction('stats.flow.select.tab', () => setFlow(f), { value: f })} className={`px-3 py-1 rounded-full text-[12px] border-none cursor-pointer ${flow === f ? 'bg-white text-[#4B6EF5]' : 'bg-transparent text-[#8A92A6]'}`}>{f === 'expense' ? '支出' : '收入'}</button>
              ))}
            </div>
          </div>
          <div className="flex justify-center mb-3">
            <div className="relative w-36 h-36 rounded-full" style={{ background: cats.length ? `conic-gradient(${gradient})` : '#EDEFF4' }}>
              <div className="absolute inset-[18%] rounded-full bg-white flex flex-col items-center justify-center">
                <span className="text-[11px] text-[#8A92A6]">本期支出</span>
                <span className="text-[15px] font-bold text-[#1A1D26]">¥{money(expense)}</span>
              </div>
            </div>
          </div>
          {shownCats.map((c, i) => (
            <button key={c.id} {...bindTap('stats.category.open', { params: { id: c.id } })} className="w-full flex items-center gap-2 py-2 bg-transparent border-none cursor-pointer text-left">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: DONUT[i % DONUT.length] }} />
              <span className="text-[14px] text-[#1A1D26] flex-1">{c.name}</span>
              <span className="text-[12px] text-[#8A92A6] mr-2">{c.pct}%</span>
              <span className="text-[14px] text-[#3D6CF0]">¥{money(c.amount)}</span>
            </button>
          ))}
          {cats.length === 0 && <div className="text-center text-[13px] text-[#B3B9C6] py-4">本期暂无{flow === 'expense' ? '支出' : '收入'}数据</div>}
          {cats.length > 5 && (
            <button {...bindAction('stats.list.toggle.expand', () => setExpanded((e) => !e))} className="w-full text-center text-[13px] text-[#8A92A6] pt-2 bg-transparent border-none cursor-pointer">{expanded ? '收起' : '展开全部'}</button>
          )}
        </Card>

        <Card className="p-4 mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[16px] font-semibold text-[#1A1D26]">单笔排行</span>
            <button {...bindAction('stats.trend.select.metric', () => undefined, { value: 'expense' })} className="text-[12px] text-[#8A92A6] bg-transparent border-none cursor-pointer">支出/收入/结余</button>
          </div>
          {ranks.slice(0, 5).map((b) => (
            <button key={b.id} {...bindTap('stats.rankBill.open', { params: { id: b.id } })} className="w-full flex items-center gap-3 py-2 bg-transparent border-none cursor-pointer text-left">
              <CategoryIcon icon={b.icon} color={b.color} size={34} />
              <span className="flex-1 text-[14px] text-[#1A1D26] truncate">{b.categoryName}{b.note ? ` · ${b.note}` : ''}</span>
              <span className="text-[14px] text-[#3D6CF0]">¥{money(b.amount)}</span>
            </button>
          ))}
          {ranks.length === 0 && <div className="text-center text-[13px] text-[#B3B9C6] py-4">本期暂无记录</div>}
        </Card>
      </div>
    </div>
  );
}

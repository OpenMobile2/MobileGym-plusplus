/** 今日密报页(qa:Q3/Q5)。spec: home.dailyReport */
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { TopBar, MY, NOT_OPEN, useToast, Switch, Img } from '../components/ui';
import { fmtDate, addDays, dayInfo, phaseName, pregnancyProb, daysToPeriodEnd } from '../utils/cycle';

const DAY_TABS = [
  { id: 'yesterday', label: '昨天', off: -1 },
  { id: 'today', label: '今天', off: 0 },
  { id: 'tomorrow', label: '明天', off: 1 },
];
const GUIDE = [
  { k: '知识', t: '经期身体正在经历什么', d: '子宫内膜脱落形成月经,这几天更易疲惫,注意休息。' },
  { k: '两性', t: '经期同房要不要紧', d: '经期不建议同房,易引起感染,建议做好清洁与防护。' },
  { k: '饮食', t: '多吃温补,少碰生冷', d: '红糖姜茶、温热食物有助缓解;避免冷饮和辛辣。' },
  { k: '运动', t: '轻度活动就好', d: '散步、拉伸即可,避免剧烈运动和倒立类瑜伽。' },
  { k: '护肤', t: '经期皮肤更敏感', d: '油脂分泌旺盛,温和清洁为主,慎试新护肤品。' },
  { k: '睡眠', t: '保证充足睡眠', d: '熬夜会加重经期不适,尽量早睡、保暖腹部。' },
];

const RING = [
  { name: '月经期', color: MY.periodBlock, deg: 90 },
  { name: '卵泡期', color: '#FFB000', deg: 110 },
  { name: '排卵期', color: MY.ovulation, deg: 40 },
  { name: '黄体期', color: '#5BB8F0', deg: 120 },
];

export default function DailyReportPage() {
  const { bindTap } = useMeiyouGestures();
  const [toast, showToast] = useToast();
  const [sp, setSp] = useSearchParams();
  const dayId = sp.get('d') ?? 'today';
  const focus = sp.get('focus');

  const periods = useMeiyouStore((s) => s.periods);
  const cycle = useMeiyouStore((s) => s.cycle);
  const togglePregProb = useMeiyouStore((s) => s.togglePregProb);
  const recordDailyReportView = useMeiyouStore((s) => s.recordDailyReportView);
  const hidePreg = !cycle.showPregProb;
  const pregRef = React.useRef<HTMLDivElement>(null);

  const off = DAY_TABS.find((t) => t.id === dayId)?.off ?? 0;
  const date = addDays(fmtDate(TimeService.now()), off);
  const info = dayInfo(date, periods, cycle);
  const phase = phaseName(date, periods, cycle);
  const prob = pregnancyProb(date, periods, cycle);
  const endDays = daysToPeriodEnd(date, periods, cycle);

  React.useEffect(() => {
    recordDailyReportView(dayId as 'yesterday' | 'today' | 'tomorrow', cycle.showPregProb);
  }, [cycle.showPregProb, dayId, recordDailyReportView]);

  React.useEffect(() => {
    if (focus === 'pregprob' && pregRef.current) pregRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [focus]);

  // SVG 圆环
  let acc = -90;
  const arcs = RING.map((seg) => {
    const start = acc; acc += seg.deg; const end = acc;
    const r = 52; const cx = 60; const cy = 60;
    const a1 = (start * Math.PI) / 180; const a2 = (end * Math.PI) / 180;
    const large = seg.deg > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(a1); const y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2); const y2 = cy + r * Math.sin(a2);
    return { d: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`, color: seg.color, name: seg.name };
  });

  return (
    <div className="flex flex-col h-full bg-[#F2F2F4] relative">
      <TopBar title="今日密报" />
      {/* 日期 tab */}
      <div className="flex justify-center gap-8 bg-white pb-2">
        {DAY_TABS.map((t) => (
          <button
            key={t.id}
            {...bindTap({ kind: 'action', id: 'dailyreport.date.select.target' }, { params: { target: t.id }, onTrigger: () => setSp((p) => { p.set('d', t.id); return p; }, { replace: true }) })}
            className="bg-transparent border-none cursor-pointer text-[14px] pb-1"
            style={{ color: dayId === t.id ? MY.primary : '#999', fontWeight: dayId === t.id ? 600 : 400, borderBottom: dayId === t.id ? `2px solid ${MY.primary}` : '2px solid transparent' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="daily-report-body" data-scroll-direction="vertical">
        {/* 周期环形图 */}
        <div className="bg-white rounded-xl mt-3 p-4 flex flex-col items-center">
          <div className="relative" style={{ width: 120, height: 120 }}>
            <svg width={120} height={120}>
              {arcs.map((a) => (
                <path key={a.name} d={a.d} stroke={a.color} strokeWidth={8} fill="none" strokeLinecap="round" />
              ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Img src="/@app-assets/Meiyou/gen/mascot_youzi.png" className="w-14 h-14 object-contain" />
            </div>
          </div>
          <div className="mt-2 text-[16px] font-bold text-[#1A1A1A]">
            {phase}{info.kind === 'period' ? `·第${info.periodDay}天` : ''}
          </div>
          {endDays !== null && <div className="text-[12px] text-[#999] mt-0.5">预计{endDays === 0 ? '今天' : `${endDays}天后`}结束</div>}
        </div>

        {/* 健康度横条 */}
        <button
          {...bindTap('meiyou.analysis-open')}
          className="w-full bg-white rounded-xl mt-3 px-4 py-3 flex items-center border-none cursor-pointer text-left"
        >
          <span className="flex-1 text-[14px] text-[#1A1A1A]">经期健康度已升级更新</span>
          <span className="text-[13px]" style={{ color: MY.primary }}>立即查看 ›</span>
        </button>

        {/* 症状预测 */}
        <div className="bg-white rounded-xl mt-3 p-4">
          <div className="text-[14px] font-semibold text-[#1A1A1A] mb-2">症状预测</div>
          <div className="flex flex-wrap gap-2">
            {['腰酸', '腹痛', '疲惫', '情绪波动'].map((s) => (
              <span key={s} className="px-2.5 h-7 rounded-full bg-[#FFF0F5] text-[12px] flex items-center" style={{ color: MY.primary }}>{s}</span>
            ))}
          </div>
        </div>

        {/* 血量变化 */}
        <div className="bg-white rounded-xl mt-3 p-4">
          <div className="text-[14px] font-semibold text-[#1A1A1A] mb-2">血量变化</div>
          <div className="flex gap-1 h-6">
            {[1, 2, 3, 2, 1].map((h, i) => (
              <div key={i} className="flex-1 rounded self-end" style={{ height: `${h * 30}%`, background: i === 4 ? MY.periodPredict : MY.periodBlock }} />
            ))}
          </div>
        </div>

        {/* 怀孕几率 */}
        <div ref={pregRef} className="bg-white rounded-xl mt-3 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[14px] font-semibold text-[#1A1A1A]">怀孕几率</span>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-[#999]">隐藏</span>
              <Switch on={hidePreg} bind={bindTap({ kind: 'action', id: 'dailyreport.pregprob.hide.toggle' }, { onTrigger: togglePregProb })} />
            </div>
          </div>
          {!hidePreg && (
            <div>
              <div className="text-[22px] font-bold" style={{ color: MY.primary }}>{prob.toFixed(1)}%</div>
              <svg width="100%" height="48" viewBox="0 0 300 48" preserveAspectRatio="none" className="mt-1">
                <polyline points="0,40 60,38 120,30 180,10 240,20 300,42" fill="none" stroke={MY.ovulation} strokeWidth="2" />
              </svg>
              <div className="text-[12px] text-[#999]">排卵日附近怀孕几率最高</div>
            </div>
          )}
        </div>

        {/* 生活指南 */}
        <div className="mt-3 text-[15px] font-bold text-[#1A1A1A]">月经期·生活指南</div>
        {GUIDE.map((g) => (
          <div key={g.k} className="bg-white rounded-xl mt-2 p-4">
            <div className="text-[12px] mb-1" style={{ color: MY.primary }}>{g.k}</div>
            <div className="text-[14px] font-semibold text-[#1A1A1A]">{g.t}</div>
            <div className="text-[13px] text-[#666] mt-1 leading-snug">{g.d}</div>
          </div>
        ))}

        {/* 视频/问医生卡 */}
        <button
          {...bindTap({ kind: 'action', id: 'dailyreport.misc.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="w-full bg-white rounded-xl mt-3 p-4 flex items-center border-none cursor-pointer text-left"
        >
          <span className="flex-1 text-[14px] text-[#1A1A1A]">健康小课堂 · 24h 问医生</span>
          <span className="text-[13px] text-[#999]">立即咨询 ›</span>
        </button>

        <div className="mt-4 text-[11px] text-[#BBB] text-center">参考文献:《妇产科学》第9版</div>
      </div>
      {toast}
    </div>
  );
}

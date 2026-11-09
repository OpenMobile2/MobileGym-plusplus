import React, { useRef, useState } from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { IcNavBack, IcCheck, IcFlame, IcArrowRight } from '../res/icons';
import {
  aerobicRatioForPlan,
  bmiAdvice,
  bmiBand,
  bmiNeedleAngle,
  bodytypeTip,
  cardioFromStairs,
} from '../store/planHelpers';

/** 计划生成结果页(BMI评估+会员拦截条)—— 节点 plan.result(证据 s049/s050) */
export default function PlanResultPage() {
  const { bindTap, bindBack } = useKeepGestures();
  const s = useKeepStrings();
  const user = useKeepStore((st) => st.user);
  const member = useKeepStore((st) => st.member);
  const quiz = useKeepStore((st) => st.quiz);
  const plans = useKeepStore((st) => st.plans);
  const schedule = useKeepStore((st) => st.schedule);
  const current = useKeepStore((st) => st.current);
  const startPlan = useKeepStore((st) => st.startPlan);

  // 商店点选 / 我的计划 / 问卷生成：按优先级取当前计划，禁止静默落到第一份计划
  const planId = current.planId ?? schedule.activePlanId ?? quiz.generatedPlanId;
  const plan = plans.find((p) => p.id === planId);
  const monthly = member.plans[0];
  const bodyType = (quiz.answers.bodytype as string) || '苹果型';
  const injuryAns = quiz.answers.injury;
  const hasInjury = Array.isArray(injuryAns) && injuryAns.length > 0;
  const stairs = typeof quiz.answers.stairs === 'string' ? quiz.answers.stairs : undefined;
  const band = bmiBand(user.bmi);
  const advice = bmiAdvice(band);
  const cardio = cardioFromStairs(stairs);
  const needle = bmiNeedleAngle(user.bmi);
  // 指针：从圆心 (100,100) 沿角度发射（0°=竖直向上，正值偏右）
  const rad = ((needle - 90) * Math.PI) / 180;
  const nx = 100 + Math.cos(rad) * 52;
  const ny = 100 + Math.sin(rad) * 52;
  const cardScroller = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  if (!plan) {
    return (
      <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
        <div className="flex items-center h-11 px-2">
          <button {...bindBack()} className="p-1 bg-transparent border-none text-app-text" aria-label={s.back}>
            <IcNavBack size={22} />
          </button>
          <div className="flex-1 text-center font-semibold">训练计划</div>
          <div className="w-10" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="text-[15px] font-medium text-app-text">未找到该计划</div>
          <p className="text-[13px] text-app-text-muted mt-2">请返回计划列表重新选择</p>
        </div>
      </div>
    );
  }

  const aerobic = aerobicRatioForPlan(plan.id, plan.tags);
  const anaerobic = 100 - aerobic;
  const bandColor = band === '偏高' ? '#F8586C' : band === '偏低' ? '#3C7CFC' : C.greenDeep;
  const cardioColor =
    cardio.tone === 'great' || cardio.tone === 'good'
      ? C.greenDeep
      : cardio.tone === 'ok'
        ? '#D8963C'
        : '#F8586C';

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="light">
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {/* 顶部深色封面 */}
        <div className="px-4 pt-2 pb-6" style={{ background: 'linear-gradient(180deg, #2E2837 0%, #3A3244 78%, #FFFFFF 100%)' }}>
          <div className="flex items-center h-10">
            <button {...bindBack()} className="p-1 bg-transparent border-none text-white" aria-label={s.back}>
              <IcNavBack size={22} />
            </button>
            <div className="flex-1" />
            <button {...bindTap('quiz.flow.open.fromResult')} className="bg-transparent border-none text-white text-[14px]">
              重新定制
            </button>
          </div>
          <div className="text-[15px] text-white/90 mt-3">Hi,{user.nickname} 已为你生成</div>
          <div className="text-[28px] font-bold text-white mt-1">{plan.title}</div>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {['官方计划', '智能定制', '真实效果'].map((t) => (
              <span key={t} className="flex items-center gap-1 text-[12px] text-white/80">
                <IcCheck size={12} /> {t}
              </span>
            ))}
            <span className="ml-auto px-2 py-1 rounded-full text-[11px] text-white/90 bg-white/10">
              {plan.practiced}参加了计划
            </span>
          </div>

          {/* 我的计划安排卡横滑 */}
          <div className="text-[17px] font-semibold text-white mt-6 mb-3">我的计划安排</div>
          <div
            ref={cardScroller}
            {...bindTap(
              { kind: 'action', id: 'plan.result.cards.swipe' },
              {
                onTrigger: () => {
                  const el = cardScroller.current;
                  if (!el) return;
                  const next = page === 0 ? 1 : 0;
                  el.scrollTo({ left: next * 200, behavior: 'smooth' });
                  setPage(next);
                },
              },
            )}
            onScroll={(e) => setPage(e.currentTarget.scrollLeft > 120 ? 1 : 0)}
            className="flex gap-3 overflow-x-auto pb-1"
            data-scroll-container="cards"
            data-scroll-direction="horizontal"
          >
            <div className="shrink-0 w-44 rounded-2xl bg-white px-4 py-4">
              <div className="flex items-center gap-1 text-[13px] text-app-text">
                预计消耗 <IcFlame size={14} style={{ color: C.green }} />
              </div>
              <div className="text-[30px] font-bold text-app-text mt-1 leading-none">
                {plan.kcal}<span className="text-[13px] font-normal ml-1">千卡</span>
              </div>
              <div className="text-[12px] text-app-text-muted mt-2 leading-relaxed">
                约等于有氧健走 {Math.max(20, Math.round(plan.kcal / 93))} 公里<br />
                消耗 {Math.max(8, Math.round(plan.kcal / 225))} 碗大米饭
              </div>
            </div>
            <div className="shrink-0 w-44 rounded-2xl bg-white px-4 py-4">
              <div className="text-[13px] text-app-text">训练难度</div>
              <div className="text-[30px] font-bold text-app-text mt-1 leading-none">
                {plan.level}<span className="text-[13px] font-normal ml-1">难度</span>
              </div>
              <div className="text-[12px] text-app-text-muted mt-2 leading-relaxed">
                {plan.level === 'K1' ? '初阶 · 动作简单' : plan.level === 'K2' ? '进阶 · 稳步提升' : '高阶 · 挑战突破'}
                <br />
                每周 {plan.daysPerWeek} 天
              </div>
            </div>
            <div className="shrink-0 w-44 rounded-2xl bg-white px-4 py-4">
              <div className="text-[13px] text-app-text">计划天数</div>
              <div className="text-[30px] font-bold text-app-text mt-1 leading-none">
                {plan.days}<span className="text-[13px] font-normal ml-1">天</span>
              </div>
              <div className="text-[12px] text-app-text-muted mt-2 leading-relaxed">
                {plan.weeks} 周专属方案<br />
                覆盖 {plan.tags.slice(0, 2).join(' · ')}
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-1 mt-2">
            <span className="h-1 rounded-full" style={{ width: page === 0 ? 14 : 6, background: page === 0 ? C.green : '#D9DBE0' }} />
            <span className="h-1 rounded-full" style={{ width: page === 1 ? 14 : 6, background: page === 1 ? C.green : '#D9DBE0' }} />
          </div>
        </div>

        {/* 有氧无氧占比 */}
        <div className="px-4 pt-2">
          <div className="text-[17px] font-semibold text-app-text">有氧无氧占比</div>
          <div className="flex gap-1.5 mt-3">
            <div className="h-2.5 rounded-full" style={{ width: `${aerobic}%`, background: 'linear-gradient(90deg,#FFAF7A,#FF7D41)' }} />
            <div className="h-2.5 rounded-full flex-1" style={{ background: 'linear-gradient(90deg,#7AA8FF,#3C7CFC)' }} />
          </div>
          <div className="flex justify-between mt-2 text-[13px]">
            <span style={{ color: C.orange }}>{aerobic}% <span className="text-app-text">有氧 燃脂类</span></span>
            <span style={{ color: C.blue }}>{anaerobic}% <span className="text-app-text">无氧 塑形类</span></span>
          </div>
        </div>

        {/* 我的评估结果:BMI 仪表盘 */}
        <div className="px-4 pt-6">
          <div className="text-[17px] font-semibold text-app-text">我的评估结果</div>
          <div className="rounded-2xl mt-3 pt-5 pb-4 px-4" style={{ background: 'linear-gradient(180deg,#F4F6FB,#FDFDFE)' }}>
            <svg viewBox="0 0 200 110" className="w-full max-w-[280px] mx-auto block">
              <path d="M 20 100 A 80 80 0 0 1 61 31" fill="none" stroke={band === '偏低' ? '#3C7CFC' : '#E4E7EE'} strokeWidth="26" strokeLinecap="round" />
              <path d="M 74 24 A 80 80 0 0 1 126 24" fill="none" stroke={band === '正常' ? C.green : '#D8DCE5'} strokeWidth="26" strokeLinecap="round" />
              <path d="M 139 31 A 80 80 0 0 1 180 100" fill="none" stroke={band === '偏高' ? '#F8586C' : '#E4E7EE'} strokeWidth="26" strokeLinecap="round" />
              <text x="42" y="76" fontSize="12" fill="#B0B4BC" textAnchor="middle">偏低</text>
              <text x="100" y="36" fontSize="12" fill="#8A8F99" textAnchor="middle">正常</text>
              <text x="158" y="76" fontSize="12" fill={band === '偏高' ? '#FFFFFF' : '#B0B4BC'} textAnchor="middle" fontWeight="600">偏高</text>
              <line x1="100" y1="100" x2={nx} y2={ny} stroke="#3B3A44" strokeWidth="3" strokeLinecap="round" />
              <circle cx="100" cy="100" r="5" fill="#3B3A44" />
            </svg>
            <div className="text-center text-[15px] mt-2">
              <span className="text-app-text">BMI </span>
              <span className="font-bold" style={{ color: bandColor }}>
                {band} {band === '正常' ? '' : band === '偏高' ? '↑' : '↓'}
              </span>
            </div>
            <div className="text-center text-[12px] text-app-text-muted mt-1">
              BMI {user.bmi} · {advice}
            </div>
          </div>

          {/* 四宫格评估 */}
          <div className="grid grid-cols-2 gap-3 mt-3 pb-4">
            <div className="rounded-2xl bg-app-bg px-4 py-4">
              <div className="text-[14px] text-app-text">体型 <span className="font-bold">{bodyType}</span></div>
              <div className="text-[12px] text-app-text-muted mt-1">{bodytypeTip(bodyType)}</div>
            </div>
            <div className="rounded-2xl bg-app-bg px-4 py-4">
              <div className="text-[14px] text-app-text">
                伤病部位 <span className="font-bold">{hasInjury ? (injuryAns as string[]).join('、') : '无伤病'}</span>
              </div>
              <div className="text-[12px] text-app-text-muted mt-1">
                {hasInjury ? '已为你去除不适合的动作' : '可以做任何动作'}
              </div>
            </div>
            <div className="rounded-2xl bg-app-bg px-4 py-4">
              <div className="text-[14px] text-app-text">
                BMI <span className="font-bold" style={{ color: bandColor }}>{band}</span>
              </div>
              <div className="text-[12px] text-app-text-muted mt-1">{advice}</div>
            </div>
            <div className="rounded-2xl px-4 py-4" style={{ background: cardio.tone === 'great' || cardio.tone === 'good' ? '#EDFBF4' : '#FFF7ED' }}>
              <div className="text-[14px] text-app-text">
                心肺能力 <span className="font-bold" style={{ color: cardioColor }}>{cardio.label}</span>
              </div>
              <div className="text-[12px] text-app-text-muted mt-1">{cardio.tip}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部拦截条 */}
      <div className="shrink-0 border-t border-app-border">
        <div className="flex items-center gap-2 px-4 py-2" style={{ background: '#F3EFFB' }}>
          <span className="px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: 'linear-gradient(90deg,#C465D8,#F8586C)' }}>
            青春特惠
          </span>
          <span className="text-[12px] text-app-text">认证成功,已享特惠</span>
        </div>
        {member.active ? (
          <div className="px-4 py-3">
            <button
              {...bindTap('schedule.home.open.fromPlanResult', {
                beforeTrigger: () => startPlan(plan.id),
              })}
              className="w-full py-3 rounded-full border-none text-[16px] font-semibold text-white"
              style={{ background: 'linear-gradient(90deg, #E4C088, #C9A05E)' }}
            >
              {s.startTraining}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              {...bindTap('member.center.open.fromPlanResultPrice')}
              className="bg-transparent border-none text-left shrink-0 p-0"
            >
              <div className="flex items-end gap-1">
                <span className="text-[24px] font-bold text-app-text leading-none">¥{monthly.price}</span>
                <span className="text-[12px] text-app-text-muted line-through">¥{monthly.origPrice}</span>
              </div>
              <div className="flex items-center text-[12px] text-app-text-muted mt-0.5">
                {monthly.label} <IcArrowRight size={12} />
              </div>
            </button>
            <button
              {...bindTap('member.center.open.fromPlanResult')}
              className="flex-1 py-3 rounded-full border-none text-[16px] font-semibold text-white"
              style={{ background: 'linear-gradient(90deg, #E4C088, #C9A05E)' }}
            >
              开通会员使用计划
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

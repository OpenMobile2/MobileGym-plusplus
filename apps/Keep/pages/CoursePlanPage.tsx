import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { Img } from '../res/images';
import { IcSearch, IcArrowRight } from '../res/icons';
import { bmiBand } from '../store/planHelpers';

const PLAN_CHIPS = ['全部', '瘦全身', '大体重掉秤', '练腹肌', '跑步'];

/** 课程 tab·计划子页（计划商店）—— 证据 s001/s037/s052/s053 */
export default function CoursePlanPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useKeepStore((st) => st.user);
  const plans = useKeepStore((st) => st.plans);
  const quiz = useKeepStore((st) => st.quiz);
  const schedule = useKeepStore((st) => st.schedule);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const hotwords = useKeepStore((st) => st.searchState.hotwords);

  const tag = searchParams.get('tag') ?? '全部';
  const filtered = tag === '全部' ? plans : plans.filter((p) => p.tags.includes(tag));
  const featured = plans.filter((p) => p.tags.includes('大体重掉秤') || p.tags.includes('瘦全身')).slice(0, 2);
  const recommend = plans.filter((p) => !featured.some((f) => f.id === p.id)).slice(0, 2);
  const previewPlan =
    plans.find((p) => p.id === (schedule.activePlanId ?? quiz.generatedPlanId)) ??
    plans.find((p) => p.id === 'p_student_slim') ??
    plans[0];
  const band = bmiBand(user.bmi);
  const bandColor = band === '偏高' ? '#F0C468' : band === '偏低' ? '#7AA8FF' : C.green;
  const goalHint =
    typeof quiz.answers.bodytype === 'string'
      ? quiz.answers.bodytype === '苹果型'
        ? '减脂、塑形'
        : quiz.answers.bodytype === '直筒型'
          ? '增肌、线条'
          : '塑形、紧致'
      : '减脂、塑形等';

  const customizeBinding = quiz.generatedPlanId
    ? bindTap('quiz.flow.open.fromSupplement')
    : bindTap('quiz.flow.open');

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      {/* 顶部搜索框 */}
      <div className="flex items-center gap-2 px-4 pt-1 pb-2 shrink-0">
        <button
          {...bindTap('course.search.open.fromPlan')}
          className="flex-1 flex items-center gap-2 h-10 px-3.5 rounded-full border-none text-left"
          style={{ background: '#F2F3F6' }}
        >
          <IcSearch size={18} className="text-app-text-muted" />
          <span className="text-[14px] text-app-text-muted truncate">{hotwords[0]}</span>
        </button>
        <span
          className="w-8 h-8 rounded-full shrink-0"
          style={{ background: 'conic-gradient(from 20deg, #7A5AF8, #B5A2FF, #7A5AF8)' }}
        />
      </div>

      {/* 子 tab：课程/计划（选中）/开练吧同学 */}
      <div className="flex items-end gap-5 px-4 pb-1.5 shrink-0">
        <button {...bindTap('course.home.open')} className="bg-transparent border-none p-0 text-[19px] text-app-text-muted">
          {s.courseSection}
        </button>
        <span className="text-[20px] font-bold text-app-text" style={{ borderBottom: `3px solid ${C.green}` }}>
          {s.planSection}
        </span>
        <button
          {...bindTap('course.buddies.open.fromPlan')}
          className="bg-transparent border-none p-0 text-[18px] font-bold"
          style={{ color: '#2B7BF3', fontStyle: 'italic' }}
        >
          {s.buddiesSection}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 补充信息获取个性计划 */}
        <div className="mx-4 mt-2 rounded-xl flex items-center px-4 py-3" style={{ background: '#F5F6F8' }}>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-app-text">✏️ 补充信息获取个性计划</div>
            <div className="text-[12px] text-app-text-muted mt-1">根据你的信息和偏好个性化编排</div>
          </div>
          <button
            {...bindTap('quiz.flow.open.fromSupplement')}
            className="shrink-0 px-3.5 py-2 rounded-full bg-white border-none text-[13px] font-medium text-app-text"
          >
            补充信息
          </button>
        </div>

        {/* 深色定制大卡 */}
        <div
          className="mx-4 mt-3 rounded-2xl overflow-hidden text-white relative"
          style={{ background: 'linear-gradient(135deg, #4A3B31 0%, #2E2620 60%, #241E19 100%)' }}
        >
          <span
            className="inline-block px-3 py-1.5 text-[12px] rounded-br-xl"
            style={{ background: 'linear-gradient(90deg, #F4D9A6, #E4BC79)', color: '#4A3520' }}
          >
            专为 {user.nickname} 打造
          </span>
          <div className="px-4 pt-3">
            <div className="text-[22px] font-bold">个性定制训练计划</div>
            <div className="text-[13px] text-white/60 mt-1">1 分钟问卷评估</div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[11px] text-white/60">针对你的目标训练</div>
                <div className="text-[17px] font-bold mt-1" style={{ color: C.green }}>{goalHint}</div>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[11px] text-white/60">根据你的身体状态安排训练</div>
                <div className="text-[17px] font-bold mt-1" style={{ color: bandColor }}>
                  {user.bmi} {band}
                </div>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[11px] text-white/60">规划你的训练节奏</div>
                <div className="text-[17px] font-bold mt-1">
                  {previewPlan.weeks} 周 × {previewPlan.daysPerWeek} 天/周
                </div>
              </div>
              <div className="rounded-lg px-3 py-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <div className="text-[11px] text-white/60">预计训练消耗</div>
                <div className="text-[17px] font-bold mt-1">
                  {previewPlan.kcal.toLocaleString()}+ 卡路里
                </div>
              </div>
            </div>
            <button
              {...customizeBinding}
              className="w-full my-4 py-3 rounded-full bg-white border-none text-[16px] font-semibold text-app-text"
            >
              {quiz.generatedPlanId ? s.customizeAgain : s.customizeForMe}
            </button>
          </div>
        </div>

        {/* 精选计划:刷脂必练清单 */}
        <div className="px-4 mt-5">
          <div className="text-[13px] text-app-text-muted">精选计划</div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-5 h-5 rounded flex items-center justify-center text-white text-[11px]" style={{ background: '#F4526A' }}>
              ★
            </span>
            <span className="text-[18px] font-bold text-app-text">刷脂必练清单</span>
          </div>
        </div>
        <div className="flex flex-col gap-3 px-4 mt-2">
          {featured.map((p) => (
            <button
              key={p.id}
              {...bindTap('plan.result.open.fromPlan', {
                params: { planId: p.id },
                beforeTrigger: () => setCurrent('planId', p.id),
              })}
              className="flex items-center gap-3 bg-transparent border-none p-0 text-left"
            >
              <Img id={p.cover} className="w-29 h-20 rounded-lg object-cover shrink-0" alt={p.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text truncate">{p.title.replace('·', ' · ')}</div>
                <div className="text-[12px] text-app-text-muted mt-1 truncate">
                  {p.level === 'K1' ? '零基础 不伤膝盖 巨暴汗' : '每天都能练'} · {p.practiced}练过
                </div>
                <div className="text-[12px] mt-1" style={{ color: '#D8963C' }}>万人亲测有效</div>
              </div>
            </button>
          ))}
        </div>

        {/* 计划筛选 chips */}
        <div className="flex gap-2 px-4 mt-5 overflow-x-auto" data-scroll-container="chips" data-scroll-direction="horizontal">
          {PLAN_CHIPS.map((c) => (
            <button
              key={c}
              {...bindTap(
                { kind: 'action', id: 'course.plan.filter.switch' },
                {
                  params: { tag: c },
                  onTrigger: () => setSearchParams((p) => { p.set('tag', c); return p; }, { replace: true }),
                },
              )}
              className="shrink-0 px-3.5 py-1.5 rounded-full text-[13px] border-none"
              style={tag === c ? { background: '#1F2229', color: '#fff', fontWeight: 600 } : { background: '#F2F3F6', color: '#666' }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 计划列表 */}
        <div className="flex flex-col gap-3 px-4 mt-3">
          {filtered.map((p) => (
            <button
              key={p.id}
              {...bindTap('plan.result.open.fromPlan', {
                params: { planId: p.id },
                beforeTrigger: () => setCurrent('planId', p.id),
              })}
              className="flex items-center gap-3 bg-transparent border-none p-0 text-left"
            >
              <Img id={p.cover} className="w-29 h-20 rounded-lg object-cover shrink-0" alt={p.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text truncate">{p.title}</div>
                <div className="text-[12px] text-app-text-muted mt-1">
                  {p.weeks}周 · 每周{p.daysPerWeek}天 · {p.practiced}练过
                </div>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="py-10 text-center text-[13px] text-app-text-muted">{s.emptyNoContent}</div>
          )}
        </div>

        {/* 你可能喜欢 */}
        <div className="flex items-center px-4 mt-5 mb-2">
          <span className="text-[18px] font-bold text-app-text">你可能喜欢</span>
          <div className="flex-1" />
          <button
            {...bindTap('plan.result.open.fromPlan', {
              params: { planId: recommend[0]?.id ?? previewPlan.id },
              beforeTrigger: () => setCurrent('planId', recommend[0]?.id ?? previewPlan.id),
            })}
            className="bg-transparent border-none p-0 flex items-center"
            aria-label="更多推荐"
          >
            <IcArrowRight size={18} className="text-app-text-muted" />
          </button>
        </div>
        <div className="flex flex-col gap-3 px-4 pb-6">
          {recommend.map((p) => (
            <button
              key={p.id}
              {...bindTap('plan.result.open.fromPlan', {
                params: { planId: p.id },
                beforeTrigger: () => setCurrent('planId', p.id),
              })}
              className="flex items-center gap-3 bg-transparent border-none p-0 text-left"
            >
              <Img id={p.cover} className="w-29 h-20 rounded-lg object-cover shrink-0" alt={p.title} />
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-app-text truncate">{p.title}</div>
                <div className="text-[12px] text-app-text-muted mt-1">
                  预计消耗 {p.kcal} 千卡 · {p.practiced}练过
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

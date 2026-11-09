import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { TopBar, C } from '../components/ui';
import { Img } from '../res/images';
import { IcArrowRight, IcArrowDown, IcPerson } from '../res/icons';
import type { KeepCourse } from '../types';

/** 左侧分类栏 14 项(证据 s015) */
const CATS = [
  '全部课程', '会员课', '免费课', '户外跑步', 'HIIT训练', '健身操', '热身放松',
  '跳绳燃脂', '健康改善', '瑜伽', '助眠冥想', '室内跑步', '单车燃脂', '健走燃脂',
];
/** 热门达人:HIIT训练 / 健身操 分类头部(证据 s025/s018) */
const HOT_COACHES: Record<string, string[]> = {
  HIIT训练: ['coach_maoshu', 'coach_cheng33'],
  健身操: ['coach_pamela', 'coach_ouyang'],
};
const FILTER_OPTIONS: Record<string, string[]> = {
  难度: ['全部', 'K1', 'K2', 'K3', 'K4'],
  部位: ['全部', '全身', '腹部', '腿部', '胸部'],
  时长: ['全部', '15分钟以内', '16-30分钟', '30分钟以上'],
};

function levelLabel(lv: string): string {
  return lv === 'K1' ? '零基础' : lv === 'K3' ? '进阶' : lv === 'K4' ? '强化' : '初学';
}

/** 全部课程 —— 证据 s015/s016/s018/s025/s032/s035/s036/recH@00:00 */
export default function CourseAllPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const courses = useKeepStore((st) => st.courses);
  const coaches = useKeepStore((st) => st.coaches);
  const current = useKeepStore((st) => st.current);

  const cat = searchParams.get('cat') ?? current.courseCat ?? '全部课程';
  const openFilter = searchParams.get('flt');
  const lv = searchParams.get('lv') ?? '全部';
  const part = searchParams.get('part') ?? '全部';
  const dur = searchParams.get('dur') ?? '全部';

  const byCat: KeepCourse[] =
    cat === '全部课程' ? courses : cat === '会员课' ? courses.filter((c) => c.isMember) : courses.filter((c) => c.category === cat);
  const partWords: Record<string, string[]> = { 全身: [''], 腹部: ['腹', '肚'], 腿部: ['腿', '深蹲', '跑'], 胸部: ['胸'] };
  const list = byCat
    .filter((c) => lv === '全部' || c.level === lv)
    .filter((c) => part === '全部' || (partWords[part] ?? ['']).some((w) => w === '' || c.title.includes(w)))
    .filter((c) => {
      if (dur === '全部') return true;
      if (dur === '15分钟以内') return c.minutes <= 15;
      if (dur === '16-30分钟') return c.minutes > 15 && c.minutes <= 30;
      return c.minutes > 30;
    });
  const hotCoaches = (HOT_COACHES[cat] ?? [])
    .map((id) => coaches.find((co) => co.id === id))
    .filter((co): co is NonNullable<typeof co> => Boolean(co));

  const setParam = (key: string, value: string) =>
    setSearchParams((p) => { p.set(key, value); p.delete('flt'); return p; }, { replace: true });
  const toggleFilter = (which: string) =>
    setSearchParams((p) => {
      if (openFilter === which) p.delete('flt');
      else p.set('flt', which);
      return p;
    }, { replace: true });

  return (
    <div className="flex flex-col h-full bg-app-surface" data-status-bar-foreground="dark">
      <TopBar title="全部课程" />

      {/* banner:你适合什么难度的课程 [测一测>] */}
      <button
        {...bindTap({ kind: 'action', id: 'course.all.levelTest.wontfix' }, { onTrigger: () => toast(s.notOpen) })}
        className="flex items-center mx-0 px-4 py-3 border-none text-left shrink-0"
        style={{ background: 'linear-gradient(90deg, #EFF6F0, #F7F9F7)' }}
      >
        <span className="w-7 h-7 rounded-md flex items-center justify-center text-white text-[13px] mr-2.5" style={{ background: '#6B8DF6' }}>
          ?
        </span>
        <span className="flex-1 text-[15px] font-semibold text-app-text">你适合什么难度的课程</span>
        <span className="text-[14px] font-medium" style={{ color: C.green }}>测一测</span>
        <IcArrowRight size={16} style={{ color: C.green }} />
      </button>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧分类栏 */}
        <div
          className="w-24 shrink-0 overflow-y-auto"
          style={{ background: '#F5F6F8' }}
          data-scroll-container="categories"
          data-scroll-direction="vertical"
        >
          {CATS.map((c) => {
            const sel = c === cat;
            return (
              <button
                key={c}
                {...bindTap(
                  { kind: 'action', id: 'course.all.category.switch' },
                  {
                    params: { cat: c },
                    onTrigger: () =>
                      setSearchParams((p) => { p.set('cat', c); p.delete('flt'); return p; }, { replace: true }),
                  },
                )}
                className="w-full py-4 text-[14px] border-none relative"
                style={{ background: sel ? '#fff' : 'transparent', color: sel ? '#1A1A1A' : '#6B6F78', fontWeight: sel ? 600 : 400 }}
              >
                {sel && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r" style={{ background: C.green }} />}
                {c}
              </button>
            );
          })}
        </div>

        {/* 右侧列表 */}
        <div className="flex-1 overflow-y-auto relative" data-scroll-container="main" data-scroll-direction="vertical">
          {/* 热门达人 */}
          {hotCoaches.length > 0 && (
            <div className="px-3 pt-3">
              <div className="text-[16px] font-bold text-app-text mb-2">热门达人</div>
              <div className="flex gap-2.5">
                {hotCoaches.map((co) => (
                  <button
                    key={co.id}
                    {...bindTap('coach.profile.open', {
                      params: { coachId: co.id },
                      beforeTrigger: () => setCurrent('coachId', co.id),
                    })}
                    className="flex-1 rounded-xl overflow-hidden border-none p-0 text-white relative"
                    style={{ background: 'linear-gradient(180deg, #3D3852, #26223A)' }}
                  >
                    <div className="flex flex-col items-center pt-3 pb-3 px-2">
                      <Img id={co.avatar} className="w-12 h-12 rounded-full object-cover" alt={co.name} />
                      <div className="text-[14px] font-semibold mt-1.5 truncate w-full text-center">{co.name}</div>
                      <div className="text-[10px] text-white/60 truncate w-full text-center">{co.certs[0]}</div>
                      <div className="flex w-full mt-2">
                        <div className="flex-1 text-center">
                          <div className="text-[14px] font-bold">{co.fans}</div>
                          <div className="text-[10px] text-white/60">粉丝</div>
                        </div>
                        <div className="flex-1 text-center">
                          <div className="text-[14px] font-bold">{co.monthly}</div>
                          <div className="text-[10px] text-white/60">月跟练人次</div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 筛选栏 */}
          <div className="flex items-center gap-2 px-3 pt-3 pb-1 sticky top-0 bg-app-surface z-10">
            <button
              {...bindTap(
                { kind: 'action', id: 'course.all.filter.open' },
                { params: { which: '难度' }, onTrigger: () => toggleFilter('难度') },
              )}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full border border-app-border bg-app-surface text-[13px] text-app-text"
            >
              {lv === '全部' ? '难度' : lv} <IcArrowDown size={14} />
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'course.all.filter.open' },
                { params: { which: '部位' }, onTrigger: () => toggleFilter('部位') },
              )}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full border border-app-border bg-app-surface text-[13px] text-app-text"
            >
              {part === '全部' ? '部位' : part} <IcArrowDown size={14} />
            </button>
            <button
              {...bindTap(
                { kind: 'action', id: 'course.all.filter.open' },
                { params: { which: '时长' }, onTrigger: () => toggleFilter('时长') },
              )}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-full border border-app-border bg-app-surface text-[13px] text-app-text"
            >
              {dur === '全部' ? '时长' : dur} <IcArrowDown size={14} />
            </button>
          </div>

          {/* 筛选下拉 */}
          {openFilter && FILTER_OPTIONS[openFilter] && (
            <div className="mx-3 mb-1 rounded-xl border border-app-border bg-app-surface flex flex-wrap gap-2 p-3">
              {FILTER_OPTIONS[openFilter].map((op) => {
                const key = openFilter === '难度' ? 'lv' : openFilter === '部位' ? 'part' : 'dur';
                const cur = openFilter === '难度' ? lv : openFilter === '部位' ? part : dur;
                return (
                  <button
                    key={op}
                    {...bindTap(
                      { kind: 'action', id: 'course.all.filter.open' },
                      { params: { which: openFilter, value: op }, onTrigger: () => setParam(key, op) },
                    )}
                    className="px-3 py-1.5 rounded-full text-[12px] border-none"
                    style={cur === op ? { background: '#E9FAF2', color: C.greenDeep, fontWeight: 600 } : { background: '#F2F3F6', color: '#666' }}
                  >
                    {op}
                  </button>
                );
              })}
            </div>
          )}

          {/* 课程卡列表 */}
          <div className="flex flex-col gap-3 px-3 pt-2 pb-6">
            {list.map((c) => (
              <button
                key={c.id}
                {...bindTap('course.detail.open', {
                  params: { courseId: c.id },
                  beforeTrigger: () => setCurrent('courseId', c.id),
                })}
                className="relative rounded-xl overflow-hidden border-none p-0 text-left w-full"
              >
                <Img id={c.cover} className="w-full h-40 object-cover" alt={c.title} />
                <span className="absolute left-2 top-2 flex items-center gap-1 px-1.5 py-1 rounded-full text-[11px] text-white" style={{ background: 'rgba(0,0,0,0.35)' }}>
                  <Img
                    id={coaches.find((co) => co.id === c.coachId)?.avatar ?? coaches.find((co) => c.coach.includes(co.name))?.avatar ?? 'avatar_me'}
                    className="w-4 h-4 rounded-full object-cover"
                    alt={c.coach}
                  />
                  {c.coach}
                </span>
                {c.isMember && (
                  <span className="absolute right-2 top-2 px-1.5 py-0.5 rounded text-[10px] text-white" style={{ background: '#7A5AF8' }}>
                    {c.seriesTotal ? '系列课' : '会员'}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 px-3 pb-2 pt-6 text-white" style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.65))' }}>
                  <div className="text-[16px] font-bold truncate">{c.title}</div>
                  <div className="text-[12px] text-white/85 mt-0.5">
                    {c.level} {levelLabel(c.level)} · {c.minutes} 分钟 · 评分 {c.rating.toFixed(1)}
                  </div>
                </div>
              </button>
            ))}
            {list.length === 0 && (
              <div className="flex flex-col items-center py-14">
                <IcPerson size={36} className="text-app-text-muted" />
                <div className="text-[13px] text-app-text-muted mt-3">{s.emptyNoContent}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

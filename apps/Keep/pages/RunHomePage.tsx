import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { MapCanvas } from '../components/MapCanvas';
import { Img } from '../res/images';
import { IcArrowDown, IcWatch, IcMusic, IcRoute } from '../res/icons';
import type { KeepRunMode } from '../types';

/** 运动tab·跑步准备页(目标跑/自由跑/课程跑/自定义)—— 证据 s056/s057/s058/s059/s061/s062 */

const MODES: KeepRunMode[] = ['目标跑', '自由跑', '课程跑', '自定义'];
const GOAL_TYPES = ['目标距离', '目标时长', '目标消耗'] as const;
const SPORT_SELECTABLE = ['户外跑步', '行走', '骑行', '室内跑步'];
const SPORT_OTHER = ['瑜伽', '冥想', '跳绳', '登山'];
const LEVEL_TEXT: Record<string, string> = { K1: '零基础', K2: '初学', K3: '进阶', K4: '挑战' };

/** 自定义训练组合卡(无种子数据源,单卡文案兜底,证据 s061/s062) */
const CUSTOM_COMBOS = [
  {
    name: '跑走适应 28min',
    sub: '时长 28 分钟·距离 4.55 公里',
    bars: [
      { label: '极限挑战', pct: 0 },
      { label: '冲刺突破', pct: 0 },
      { label: '进阶快跑', pct: 0 },
      { label: '轻盈慢跑', pct: 0 },
      { label: '轻松走路', pct: 100 },
    ],
  },
  {
    name: '轻松跑 2.7km',
    sub: '时长 20 分钟·距离 2.70 公里',
    bars: [
      { label: '进阶快跑', pct: 0 },
      { label: '轻盈慢跑', pct: 67 },
      { label: '轻松走路', pct: 33 },
    ],
  },
];

/** 绿底放射纹(目标跑,确定性伪随机) */
function RadialTicks() {
  const ticks = Array.from({ length: 72 }, (_, i) => {
    const x = (i * 53) % 360;
    const y = 14 + ((i * 97) % 520);
    const rot = ((i * 41) % 60) - 30;
    const h = 16 + ((i * 29) % 22);
    return { x, y, rot, h, key: i };
  });
  return (
    <svg viewBox="0 0 360 560" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
      {ticks.map((t) => (
        <rect
          key={t.key}
          x={t.x}
          y={t.y}
          width={7}
          height={t.h}
          rx={3}
          fill="#1FB57C"
          transform={`rotate(${t.rot} ${t.x} ${t.y})`}
        />
      ))}
    </svg>
  );
}

export default function RunHomePage() {
  const { bindTap, bindBack, back } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const setCurrent = useKeepStore((st) => st.setCurrent);
  const runState = useKeepStore((st) => st.runState);
  const courses = useKeepStore((st) => st.courses);
  const wishCourseIds = useKeepStore((st) => st.wishCourseIds);
  const wishCourses = useKeepStore((st) => st.wishCourses);
  const setSportType = useKeepStore((st) => st.setSportType);
  const setRunMode = useKeepStore((st) => st.setRunMode);
  const toggleRunCourseWish = useKeepStore((st) => st.toggleRunCourseWish);

  const mode = (searchParams.get('mode') as KeepRunMode) ?? runState.mode;
  const menuOpen = searchParams.get('menu') === '1';
  const goalTypeIdx = Number(searchParams.get('goalType') ?? 0) % GOAL_TYPES.length;
  const runCourses = courses.filter((c) => c.distanceKm != null);
  const ccIdx = Math.min(
    Math.max(0, Number(searchParams.get('cc') ?? Math.max(0, runCourses.findIndex((c) => c.id === 'c_fartlek5')))),
    Math.max(0, runCourses.length - 1),
  );
  const cuIdx = Math.min(Math.max(0, Number(searchParams.get('cu') ?? 0)), CUSTOM_COMBOS.length - 1);
  const curCourse = runCourses[ccIdx];
  const combo = CUSTOM_COMBOS[cuIdx];

  const setParam = (key: string, val: string) =>
    setSearchParams((p) => { p.set(key, val); return p; }, { replace: true });

  const wontfix = (id: string) => bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const goBinding = runState.voiceguideSeen ? bindTap('run.active.open.fromGo') : bindTap('run.voiceguide.open');

  return (
    <div className="flex flex-col h-full bg-app-bg" data-status-bar-foreground="dark">
      {/* 顶部栏:「户外跑步▼」+ 右侧图标组 */}
      <div className="flex items-center px-4 h-12 shrink-0 relative">
        <button
          {...bindTap(
            { kind: 'action', id: 'run.home.sportType.toggle' },
            {
              onTrigger: () =>
                menuOpen
                  ? back()
                  : setSearchParams((p) => { p.set('menu', '1'); return p; }),
            },
          )}
          className="flex items-center gap-1.5 bg-transparent border-none p-0"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="14" cy="5" r="2.4" fill="#1A1A1A" />
            <path
              d="M13 8.5 L9 11 L10.5 14 L7.5 19 M13 8.5 L15 12.5 L13 17 L14.5 20.5 M13 8.5 L17.5 10"
              stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          <span className="text-[19px] font-bold text-app-text">{runState.sportType}</span>
          <IcArrowDown size={16} className="text-app-text" />
        </button>
        {!menuOpen && !runState.voiceguideSeen && (
          <span className="ml-2 px-2.5 py-1 rounded-lg bg-black/85 text-white text-[12px]">更多运动可选</span>
        )}
        <div className="flex-1" />
        <button {...wontfix('run.home.topIcons.wontfix')} className="p-1.5 bg-transparent border-none text-app-text" aria-label="组队">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
            <circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" />
            <path d="M3 19c0-2.8 2.2-5 5-5m8 0c2.8 0 5 2.2 5 5" strokeLinecap="round" />
          </svg>
        </button>
        <button {...wontfix('run.home.topIcons.wontfix')} className="p-1.5 bg-transparent border-none text-app-text" aria-label="手表">
          <IcWatch size={20} />
        </button>
        <button {...wontfix('run.home.topIcons.wontfix')} className="p-1.5 bg-transparent border-none text-app-text" aria-label="六边形">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
            <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <button {...wontfix('run.home.topIcons.wontfix')} className="p-1.5 bg-transparent border-none" aria-label="光环">
          <span
            className="w-5 h-5 rounded-full inline-block"
            style={{ background: 'conic-gradient(#7A5AF8, #B69CFF, #7A5AF8)', maskImage: 'radial-gradient(circle, transparent 45%, black 50%)', WebkitMaskImage: 'radial-gradient(circle, transparent 45%, black 50%)' }}
          />
        </button>
      </div>

      {/* 二级模式 tab */}
      <div className="flex items-center gap-6 px-4 h-10 shrink-0">
        {MODES.map((m) => {
          const sel = m === mode;
          return (
            <button
              key={m}
              {...bindTap(
                { kind: 'action', id: 'run.home.modeTab.switch' },
                { params: { mode: m }, onTrigger: () => { setRunMode(m); setParam('mode', m); } },
              )}
              className="relative bg-transparent border-none p-0 text-[17px]"
              style={{ color: sel ? '#1A1A1A' : '#9AA0A8', fontWeight: sel ? 700 : 500 }}
            >
              {m}
              {sel && (
                <span className="absolute left-1/2 -translate-x-1/2 -bottom-1 w-6 h-1 rounded-full" style={{ background: C.green }} />
              )}
            </button>
          );
        })}
      </div>

      {/* 主区域 */}
      <div
        className="flex-1 overflow-y-auto px-3 pt-1"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div className="relative rounded-2xl overflow-hidden" style={{ height: 420 }}>
          {mode === '自由跑' && (
            <>
              <MapCanvas height={420} route />
              <VoiceCapsule showTip={!runState.voiceguideSeen} />
            </>
          )}

          {mode === '目标跑' && (
            <div className="absolute inset-0" style={{ background: '#35CE93' }}>
              <RadialTicks />
              <div className="absolute inset-x-0 top-20 flex flex-col items-center">
                <div className="flex items-center gap-5">
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'run.home.goalType.switch' },
                      { params: { dir: 'prev' }, onTrigger: () => setParam('goalType', String((goalTypeIdx + GOAL_TYPES.length - 1) % GOAL_TYPES.length)) },
                    )}
                    className="bg-transparent border-none text-white/90 text-[20px] px-2"
                  >
                    ‹
                  </button>
                  <span className="text-[19px] font-semibold text-app-text">{GOAL_TYPES[goalTypeIdx]}</span>
                  <button
                    {...bindTap(
                      { kind: 'action', id: 'run.home.goalType.switch' },
                      { params: { dir: 'next' }, onTrigger: () => setParam('goalType', String((goalTypeIdx + 1) % GOAL_TYPES.length)) },
                    )}
                    className="bg-transparent border-none text-white/90 text-[20px] px-2"
                  >
                    ›
                  </button>
                </div>
                <button {...bindTap('run.goalPicker.open')} className="bg-transparent border-none mt-5 flex flex-col items-center">
                  <span className="text-[72px] leading-none font-extrabold text-app-text border-b-4 border-app-text/70 pb-1">
                    {goalTypeIdx === 0 ? runState.goalKm.toFixed(2) : goalTypeIdx === 1 ? '30:00' : '300'}
                  </span>
                  <span className="text-[15px] text-app-text mt-3">
                    点击设定({goalTypeIdx === 0 ? '公里' : goalTypeIdx === 1 ? '分钟' : '千卡'})
                  </span>
                </button>
              </div>
              <VoiceCapsule showTip={false} />
            </div>
          )}

          {mode === '课程跑' && curCourse && (
            <div className="absolute inset-0 bg-black">
              <Img id={curCourse.cover} className="absolute inset-0 w-full h-full object-cover opacity-90" alt={curCourse.title} />
              <div className="absolute inset-x-0 bottom-0 h-44" style={{ background: 'linear-gradient(180deg, transparent, rgba(60,40,80,.85))' }} />
              <span className="absolute left-3 top-3 px-2 py-0.5 rounded bg-black/60 text-white text-[11px]">官方精品</span>
              {/* 卡本体 → 课程详情 */}
              <button
                {...bindTap('course.detail.open.fromRunHome', {
                  params: { courseId: curCourse.id },
                  beforeTrigger: () => setCurrent('courseId', curCourse.id),
                })}
                className="absolute inset-x-0 top-0 bottom-24 bg-transparent border-none"
                aria-label={curCourse.title}
              />
              {/* 轮播左右切换 */}
              <button
                {...bindTap(
                  { kind: 'action', id: 'run.home.courseCarousel.swipe' },
                  { params: { dir: 'prev' }, stopPropagation: true, onTrigger: () => setParam('cc', String((ccIdx + runCourses.length - 1) % runCourses.length)) },
                )}
                className="absolute left-0 top-16 bottom-24 w-10 bg-transparent border-none"
                aria-label="上一课程"
              />
              <button
                {...bindTap(
                  { kind: 'action', id: 'run.home.courseCarousel.swipe' },
                  { params: { dir: 'next' }, stopPropagation: true, onTrigger: () => setParam('cc', String((ccIdx + 1) % runCourses.length)) },
                )}
                className="absolute right-0 top-16 bottom-24 w-10 bg-transparent border-none"
                aria-label="下一课程"
              />
              <div className="absolute inset-x-0 bottom-5 flex flex-col items-center pointer-events-none">
                <div className="text-white text-[24px] font-bold px-4 text-center">
                  {curCourse.title}
                </div>
                <div className="text-white/85 text-[13px] mt-2">
                  {curCourse.level} {LEVEL_TEXT[curCourse.level]} · {curCourse.minutes} 分钟 · {curCourse.kcalRange}
                </div>
                <button
                  {...bindTap('course.all.open.fromRunHome', { stopPropagation: true })}
                  className="pointer-events-auto mt-2 bg-transparent border-none text-white text-[14px]"
                >
                  跑步课程 ›
                </button>
              </div>
            </div>
          )}

          {mode === '自定义' && (
            <div className="absolute inset-0" style={{ background: '#4A4553' }}>
              <span className="absolute left-3 top-3 px-2 py-0.5 rounded bg-black/50 text-white text-[11px] z-10">官方</span>
              <button
                {...bindTap(
                  { kind: 'action', id: 'run.home.customCarousel.swipe' },
                  { params: { dir: 'next' }, onTrigger: () => setParam('cu', String((cuIdx + 1) % CUSTOM_COMBOS.length)) },
                )}
                className="absolute inset-0 bg-transparent border-none"
                aria-label="切换训练组合"
              />
              <div className="absolute inset-x-0 top-10 px-6 pointer-events-none">
                <div className="h-6 rounded-full flex items-center justify-center text-white text-[13px]" style={{ background: '#5B8DEF' }}>
                  100%
                </div>
                <div className="mt-5 flex flex-col gap-3">
                  {combo.bars.map((b) => (
                    <div key={b.label} className="flex items-center gap-2 border-t border-dashed border-white/20 pt-2">
                      <span className="text-white/85 text-[13px] w-16 shrink-0">{b.label}</span>
                      <div className="flex-1 h-6">
                        {b.pct > 0 && (
                          <div className="h-6 rounded-sm" style={{ width: `${b.pct}%`, background: '#5B8DEF' }} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-6 flex flex-col items-center pointer-events-none">
                <div className="text-white text-[26px] font-bold">{combo.name}</div>
                <div className="text-white/80 text-[13px] mt-1.5">{combo.sub}</div>
                <button
                  {...bindTap(
                    { kind: 'action', id: 'run.home.customEditor.wontfix' },
                    { stopPropagation: true, onTrigger: () => toast(s.notOpen) },
                  )}
                  className="pointer-events-auto mt-2 bg-transparent border-none text-white text-[14px]"
                >
                  自定义训练组合 ›
                </button>
              </div>
            </div>
          )}

          {/* 右上悬浮:GPS / 路线 / 想练(课程跑) */}
          <div className="absolute right-3 top-3 flex flex-col items-center rounded-full bg-white/95 shadow px-1.5 py-2 gap-2">
            <button {...wontfix('run.home.gps.wontfix')} className="flex flex-col items-center bg-transparent border-none px-1">
              <svg width="18" height="14" viewBox="0 0 18 14">
                <rect x="1" y="8" width="3" height="5" rx="1" fill="#24C789" />
                <rect x="7" y="4" width="3" height="9" rx="1" fill="#24C789" />
                <rect x="13" y="0" width="3" height="13" rx="1" fill="#D9DBE0" />
              </svg>
              <span className="text-[11px] text-app-text mt-0.5">GPS</span>
            </button>
            <button {...bindTap('route.list.open.fromRunHome')} className="flex flex-col items-center bg-transparent border-none px-1 text-app-text">
              <IcRoute size={18} />
              <span className="text-[11px] mt-0.5">路线</span>
            </button>
            {mode === '课程跑' && curCourse && (
              <button
                {...bindTap(
                  { kind: 'action', id: 'run.home.courseWish.toggle' },
                  {
                    params: { courseId: curCourse.id },
                    onTrigger: () => {
                      toggleRunCourseWish(curCourse.id);
                    },
                  },
                )}
                className="flex flex-col items-center bg-transparent border-none px-1 text-app-text"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h10M4 12h10M4 18h6" />
                  <path d="M18 12v6M15 15h6" />
                </svg>
                <span className="text-[11px] mt-0.5">
                  {Array.from(new Set([...(wishCourseIds ?? []), ...(wishCourses ?? [])])).includes(curCourse.id) ? s.wished : s.wish}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* 轮播页码指示 */}
        {(mode === '课程跑' || mode === '自定义') && (
          <div className="flex justify-center gap-1.5 mt-2.5">
            {(mode === '课程跑' ? runCourses : CUSTOM_COMBOS).map((_, i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: 6, height: 6,
                  background: i === (mode === '课程跑' ? ccIdx : cuIdx) ? '#6B6F78' : '#D9DBE0',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* 底部操作排:音乐 / GO / 装备 */}
      <div className="flex items-center justify-center gap-5 px-4 pt-2 pb-3 shrink-0">
        <button {...wontfix('run.home.music.wontfix')} className="flex items-center gap-1.5 h-11 px-6 rounded-full bg-app-surface border border-app-border text-app-text text-[15px]">
          <IcMusic size={16} /> 音乐
        </button>
        <button
          {...goBinding}
          className="w-22 h-22 rounded-full border-none text-white font-extrabold italic text-[26px]"
          style={{ width: 88, height: 88, background: C.green, boxShadow: '0 6px 16px rgba(36,199,137,.4)' }}
        >
          {s.go}
        </button>
        <button {...wontfix('run.home.gear.wontfix')} className="flex items-center gap-1.5 h-11 px-6 rounded-full bg-app-surface border border-app-border text-app-text text-[15px]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round">
            <path d="M3 15c3-1 5-4 6-7l2-4 4 3-2 3c1.5 2 4 3 7 3v4c-4 1-8 1-11-1-2.5 1.5-4.5 2-6 2z" strokeLinejoin="round" />
          </svg>
          装备
        </button>
      </div>

      {/* 运动类型下拉(searchParams 推栈,背景 bindBack 关闭) */}
      {menuOpen && (
        <div className="absolute inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" {...bindBack()} />
          <div className="absolute left-3 right-3 top-12 rounded-2xl bg-app-surface p-2 shadow-lg">
            {SPORT_SELECTABLE.map((t) => (
              <button
                key={t}
                {...bindTap(
                  { kind: 'action', id: 'run.home.sportType.select' },
                  {
                    params: { type: t },
                    onTrigger: () => { setSportType(t); back(); },
                  },
                )}
                className="flex items-center w-full px-3 py-3 bg-transparent border-none text-left border-b border-app-border"
              >
                <span className="flex-1 text-[15px]" style={{ color: runState.sportType === t ? C.greenDeep : '#1A1A1A', fontWeight: runState.sportType === t ? 600 : 400 }}>
                  {t}
                </span>
                {runState.sportType === t && <span style={{ color: C.greenDeep }}>✓</span>}
              </button>
            ))}
            {SPORT_OTHER.map((t, i) => (
              <button
                key={t}
                {...bindTap(
                  { kind: 'action', id: 'run.home.sportTypeOther.wontfix' },
                  { params: { type: t }, onTrigger: () => toast(s.notOpen) },
                )}
                className={`flex items-center w-full px-3 py-3 bg-transparent border-none text-left ${i === SPORT_OTHER.length - 1 ? '' : 'border-b border-app-border'}`}
              >
                <span className="flex-1 text-[15px] text-app-text-muted">{t}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** 「语音陪跑 限免体验>」胶囊(+首次黑色说明气泡) */
function VoiceCapsule({ showTip }: { showTip: boolean }) {
  const { bindTap } = useKeepGestures();
  return (
    <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
      {showTip && (
        <div className="mx-10 mb-2 rounded-xl bg-black/85 text-white px-4 py-3 relative">
          <div className="text-[15px] font-semibold" style={{ color: '#E8DBFF' }}>语音陪跑限免中</div>
          <div className="text-[12px] text-white/85 mt-1">根据运动能力和状态,实时个性化指导</div>
          <span
            className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45"
            style={{ background: 'rgba(0,0,0,.85)' }}
          />
        </div>
      )}
      <button
        {...bindTap('run.voiceguide.open.fromCapsule')}
        className="flex items-center gap-2 h-10 px-4 rounded-full border-none bg-white/95 shadow"
      >
        <span className="text-[14px]" style={{ color: '#7A5AF8' }}>✦</span>
        <span className="text-[15px] font-semibold text-app-text">语音陪跑</span>
        <span className="px-1.5 py-0.5 rounded text-[11px]" style={{ background: '#F4E3C2', color: '#8A6420' }}>限免体验</span>
        <span className="text-app-text-muted">›</span>
      </button>
    </div>
  );
}

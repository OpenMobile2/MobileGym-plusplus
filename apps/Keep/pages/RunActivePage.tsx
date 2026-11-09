import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { realNow } from '@/os/TimeService';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { sessionDistanceM, sessionElapsedSec } from '../store/runSlice';
import { fmtMS, fmtPace } from '../components/recordFormat';
import { MapCanvas } from '../components/MapCanvas';
import { CenterDialog } from '../components/Sheet';
import { IcLock, IcMusic, IcPause, IcPlay, IcUnlock } from '../res/icons';

/** 跑步进行中(3-2-1倒计时→4页横滑数据面板+暂停/锁屏/长按结束)—— 证据 recB_f008~f029 */

const PANEL_BG = '#332C3E';
const LONG_PRESS_MS = 1200;
const ZONES = ['#8FA8F0', '#3D5CB8', '#2E9E6B', '#7A9E3D', '#B07A3D', '#B03D4E'];
const DRAG_THRESHOLD = 36;

function StatCell({ label, value, big = false }: { label: string; value: React.ReactNode; big?: boolean }) {
  return (
    <div>
      <div className={`text-white font-extrabold ${big ? 'text-[56px] leading-none' : 'text-[34px] leading-tight'}`}>{value}</div>
      <div className="text-white/55 text-[13px] mt-1">{label}</div>
    </div>
  );
}

/** 顶部白色横杠：下拉收起 / 上滑展开；轻点由 bindTap 切换（拖动时抑制 tap） */
function PanelHandle({
  collapsed,
  onCollapse,
  onExpand,
  bindCollapse,
}: {
  collapsed: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  bindCollapse: React.ButtonHTMLAttributes<HTMLButtonElement>;
}) {
  const startY = useRef<number | null>(null);
  const dragged = useRef(false);
  const { onClick: bindOnClick, ...bindRest } = bindCollapse;

  return (
    <button
      type="button"
      {...bindRest}
      onPointerDown={(e) => {
        startY.current = e.clientY;
        dragged.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (startY.current == null) return;
        if (Math.abs(e.clientY - startY.current) > 8) dragged.current = true;
      }}
      onPointerUp={(e) => {
        if (startY.current == null) return;
        const dy = e.clientY - startY.current;
        startY.current = null;
        if (dy > DRAG_THRESHOLD) {
          dragged.current = true;
          onCollapse();
          return;
        }
        if (dy < -DRAG_THRESHOLD) {
          dragged.current = true;
          onExpand();
        }
      }}
      onPointerCancel={() => {
        startY.current = null;
      }}
      onClick={(e) => {
        if (dragged.current) {
          dragged.current = false;
          e.preventDefault();
          e.stopPropagation();
          return;
        }
        bindOnClick?.(e);
      }}
      className="mx-auto mt-2 w-20 h-6 bg-transparent border-none shrink-0 flex items-center justify-center touch-none"
      aria-label={collapsed ? '上滑展开数据面板' : '下滑收起数据面板'}
    >
      <span className="block w-10 h-1 rounded-full bg-white/55" />
    </button>
  );
}

export default function RunActivePage() {
  const { bindTap, bindLongPress, back, go } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useKeepStore((st) => st.toast);
  const runState = useKeepStore((st) => st.runState);
  const ses = useKeepStore((st) => st.runSession);
  const beginRunning = useKeepStore((st) => st.beginRunning);
  const pauseRun = useKeepStore((st) => st.pauseRun);
  const resumeRun = useKeepStore((st) => st.resumeRun);
  const finishRun = useKeepStore((st) => st.finishRun);
  const recordRunPanelView = useKeepStore((st) => st.recordRunPanelView);

  const [nowMs, setNowMs] = useState(() => realNow());
  const [pressing, setPressing] = useState<null | 'stop' | 'unlock'>(null);
  const pressStartRef = useRef(0);
  const panelScrollerRef = useRef<HTMLDivElement>(null);

  /* 进入建立会话(3-2-1)；已结束的会话不再自动重开，避免结算返回误触发倒计时 */
  useEffect(() => {
    const st = useKeepStore.getState();
    if (!st.runSession) st.startRunSession();
  }, []);

  /* 秒级 ticker(realNow 差值驱动) */
  useEffect(() => {
    const t = window.setInterval(() => setNowMs(realNow()), 200);
    return () => window.clearInterval(t);
  }, []);

  /* 倒计时归零 → 自动开始计时 */
  useEffect(() => {
    if (ses && ses.status === 'countdown' && nowMs >= ses.countdownEndMs) beginRunning();
  }, [nowMs, ses, beginRunning]);

  const panelIdx = Math.min(3, Math.max(0, Number(searchParams.get('p') ?? 0)));
  const collapsed = searchParams.get('min') === '1';
  const locked = searchParams.get('lock') === '1';
  const shortDlg = searchParams.get('dlg') === 'short';

  const setParam = useCallback(
    (key: string, val: string | null) =>
      setSearchParams((p) => {
        if (val === null) p.delete(key);
        else p.set(key, val);
        return p;
      }, { replace: true }),
    [setSearchParams],
  );

  const goPanel = useCallback(
    (idx: number) => {
      const next = Math.min(3, Math.max(0, idx));
      recordRunPanelView(next);
      setParam('p', String(next));
      const el = panelScrollerRef.current;
      if (el) {
        const w = el.clientWidth || 1;
        el.scrollTo({ left: next * w, behavior: 'smooth' });
      }
    },
    [setParam, recordRunPanelView],
  );

  /* URL panelIdx → 滚动位置同步（边缘按钮/自动化） */
  useEffect(() => {
    if (collapsed) return;
    const el = panelScrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const target = panelIdx * w;
    if (Math.abs(el.scrollLeft - target) > 8) {
      el.scrollTo({ left: target, behavior: 'auto' });
    }
  }, [panelIdx, collapsed]);

  const elapsed = sessionElapsedSec(ses);
  const distM = sessionDistanceM(ses);
  const km = distM / 1000;
  const paceSec = km > 0.005 ? elapsed / km : null;
  const kcal = Math.round(km * 66);
  const running = ses?.status === 'running';
  const paused = ses?.status === 'paused';
  const heart = running ? 128 + ((Math.floor(elapsed / 5) * 7) % 38) : null;
  const cadence = 160 + ((Math.floor(elapsed / 7) * 5) % 16);

  const pressPct = pressing ? Math.min(1, (nowMs - pressStartRef.current) / LONG_PRESS_MS) : 0;

  const countdownLeft = ses && ses.status === 'countdown' ? Math.max(0, ses.countdownEndMs - nowMs) : 0;
  const showCountdown = ses?.status === 'countdown' && countdownLeft > 0;

  const ringPress = (kind: 'stop' | 'unlock') => ({
    onLongPressStart: () => { pressStartRef.current = realNow(); setPressing(kind); },
    onLongPressEnd: () => setPressing(null),
  });

  /* 红色停止:距离达标→结算;过短→dialog */
  const stopBind = km >= 0.5
    ? bindLongPress('run.summary.open', {
        duration: LONG_PRESS_MS,
        ...ringPress('stop'),
        onTrigger: () => {
          setPressing(null);
          finishRun();
          go('run.summary.open', {}, { popTo: '/sport' });
        },
      })
    : bindLongPress(
        { kind: 'action', id: 'run.active.stop.shortDialog' },
        {
          duration: LONG_PRESS_MS,
          ...ringPress('stop'),
          onTrigger: () => {
            setPressing(null);
            setSearchParams((p) => { p.set('dlg', 'short'); return p; }, { replace: true });
          },
        },
      );

  const wontfix = (id: string) => bindTap({ kind: 'action', id }, { onTrigger: () => toast(s.notOpen) });

  const collapseBind = bindTap<HTMLButtonElement>(
    { kind: 'action', id: 'run.active.panel.collapse' },
    {
      onTrigger: () => {
        if (collapsed) setParam('min', null);
        else setParam('min', '1');
      },
    },
  );

  const onPanelScroll = () => {
    const el = panelScrollerRef.current;
    if (!el) return;
    const w = el.clientWidth || 1;
    const idx = Math.min(3, Math.max(0, Math.round(el.scrollLeft / w)));
    if (idx !== panelIdx) {
      recordRunPanelView(idx);
      setParam('p', String(idx));
    }
  };

  const panels = [
    /* 页1 总览 */
    <div key="p0" className="flex flex-col gap-7 min-w-full w-full shrink-0 snap-center px-6 box-border">
      <StatCell label="总距离" value={km.toFixed(2)} big />
      <div className="grid grid-cols-2 gap-y-7">
        <StatCell label="总时长" value={fmtMS(elapsed)} />
        <StatCell label="实时配速" value={running ? fmtPace(paceSec) : "--'--''"} />
        <StatCell label="总消耗" value={kcal} />
        <StatCell label="实时心率" value={heart ?? <span>-- <span style={{ color: '#D06B7B' }}>♥</span></span>} />
      </div>
    </div>,
    /* 页2 配速区间 */
    <div key="p1" className="flex flex-col gap-6 min-w-full w-full shrink-0 snap-center px-6 box-border">
      <StatCell label="实时配速" value={running ? fmtPace(paceSec) : "--'--''"} big />
      <div className="flex items-center gap-1.5">
        <span className="px-3 py-1.5 rounded-full text-[13px] text-white" style={{ background: ZONES[0] }}>缓和热身</span>
        {ZONES.slice(1).map((c) => (
          <span key={c} className="flex-1 h-6 rounded-full" style={{ background: c, opacity: 0.85 }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-7">
        <StatCell label="平均步频" value={running || elapsed > 0 ? cadence : '--'} />
        <StatCell label="平均步幅" value="0.91" />
        <StatCell label="总距离" value={km.toFixed(2)} />
        <StatCell label="总消耗" value={kcal} />
      </div>
    </div>,
    /* 页3 心率 */
    <div key="p2" className="flex flex-col gap-6 min-w-full w-full shrink-0 snap-center px-6 box-border">
      <StatCell label="实时心率" value={heart ?? '--'} big />
      <div className="flex items-center gap-1.5">
        {ZONES.map((c, i) => (
          <span key={c} className="flex-1 h-6 rounded-full" style={{ background: c, opacity: i === 2 ? 1 : 0.55 }} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-y-7">
        <StatCell label="运动负荷" value={Math.max(0, Math.round(elapsed / 30))} />
        <StatCell label="爬升高度" value={Math.round(km * 2.2)} />
        <StatCell label="总时长" value={fmtMS(elapsed)} />
        <StatCell label="总消耗" value={kcal} />
      </div>
    </div>,
    /* 页4 每公里 */
    <div key="p3" className="flex flex-col gap-5 min-w-full w-full shrink-0 snap-center px-6 box-border">
      <StatCell label="实时配速" value={running ? fmtPace(paceSec) : "--'--''"} big />
      <svg viewBox="0 0 60 120" className="h-28 w-16">
        <line x1="30" y1="4" x2="30" y2="116" stroke="rgba(255,255,255,.5)" strokeWidth="5" strokeLinecap="round" />
        <path
          d={`M30 116 L30 ${116 - Math.min(100, elapsed / 3)} L${26 - (Math.floor(elapsed / 10) % 6)} ${112 - Math.min(100, elapsed / 3)}`}
          stroke="#37C978" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round"
        />
        <circle cx="30" cy={Math.max(6, 116 - Math.min(100, elapsed / 3) - 8)} r="5" fill="#fff" />
      </svg>
      <div className="grid grid-cols-2 gap-y-6 -mt-4">
        <StatCell label="每公里配速" value={running || paused ? fmtPace(paceSec != null ? paceSec * 1.04 : null) : "--'--''"} />
        <StatCell label="每公里心率" value={heart ?? <span>-- <span style={{ color: '#D06B7B' }}>♥</span></span>} />
        <StatCell label="每公里步频" value={cadence - 4} />
        <StatCell label="总距离" value={km.toFixed(2)} />
      </div>
    </div>,
  ];

  return (
    <div className="flex flex-col h-full relative overflow-hidden" style={{ background: '#F2F0EC' }} data-status-bar-foreground="dark">
      {/* 地图层：收起时占满可视区 */}
      <div className="absolute inset-0">
        <MapCanvas height={800} route={running || paused} />
      </div>

      {/* 顶部:标题/运动实况/GPS/AI胶囊 */}
      <div className="relative shrink-0 px-4 pt-1 z-20">
        <div className="flex items-center">
          {showCountdown ? (
            <span className="flex items-center gap-1.5 text-[16px] font-semibold text-app-text">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <circle cx="14" cy="5" r="2.4" fill="#1A1A1A" />
                <path d="M13 8.5 L9 11 L10.5 14 L7.5 19 M13 8.5 L15 12.5 L13 17 L14.5 20.5 M13 8.5 L17.5 10" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {runState.sportType}
            </span>
          ) : (
            <button {...wontfix('run.active.livecast.wontfix')} className="flex items-center gap-1.5 h-9 pl-1.5 pr-3 rounded-full bg-white shadow border-none">
              <span className="w-6 h-6 rounded-full" style={{ background: 'linear-gradient(135deg,#BFD8F0,#7FA8D0)' }} />
              <span className="text-[14px] text-app-text">运动实况</span>
            </button>
          )}
          <div className="flex-1" />
          <span className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/80 text-[12px] text-app-text-muted">
            <svg width="14" height="11" viewBox="0 0 18 14">
              <rect x="1" y="8" width="3" height="5" rx="1" fill="#FF4D4F" />
              <rect x="7" y="4" width="3" height="9" rx="1" fill="#FF4D4F" />
              <rect x="13" y="0" width="3" height="13" rx="1" fill="#D9DBE0" />
            </svg>
            GPS
          </span>
        </div>
        <button
          {...wontfix('run.active.voiceguideBadge.wontfix')}
          className="mt-2 flex items-center gap-1.5 h-8 px-3 rounded-full border-none text-white text-[12px]"
          style={{ background: '#3D3550' }}
        >
          <span style={{ color: '#C9B3FF' }}>◆</span> AI 语音陪跑限免体验中
        </button>
      </div>

      {/* 3-2-1 大数字倒计时(点击可跳过) */}
      {showCountdown && (
        <div
          {...bindTap({ kind: 'action', id: 'run.active.countdown.auto' }, { onTrigger: () => beginRunning() })}
          className="absolute inset-0 z-20 flex items-center justify-center"
        >
          <span className="font-extrabold italic" style={{ fontSize: 200, color: '#B7E4CE', WebkitTextStroke: '4px #24C789' }}>
            {Math.max(1, Math.ceil(countdownLeft / 1000))}
          </span>
        </div>
      )}

      {/* 返回拦截(左缘,跑步中不退出) */}
      {!showCountdown && (
        <div
          {...bindTap({ kind: 'action', id: 'run.active.back.intercept' }, { onTrigger: () => toast('长按停止按钮结束运动') })}
          className="absolute left-0 top-16 bottom-40 w-3 z-10"
        />
      )}

      {/* 面板收起:大地图 + 底部迷你数据一行 */}
      {!showCountdown && collapsed && (
        <>
          <button
            {...bindTap({ kind: 'action', id: 'run.active.map.recenter' }, { onTrigger: () => toast('已回到当前位置') })}
            className="absolute right-4 z-10 w-11 h-11 rounded-full bg-white shadow border-none flex items-center justify-center"
            style={{ bottom: 118 }}
            aria-label="回中"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1A1A" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute inset-x-0 bottom-0 z-10 rounded-t-2xl px-5 pt-0 pb-5 shadow-[0_-8px_24px_rgba(0,0,0,.18)]" style={{ background: PANEL_BG }}>
            <PanelHandle
              collapsed
              bindCollapse={collapseBind}
              onCollapse={() => setParam('min', '1')}
              onExpand={() => setParam('min', null)}
            />
            <div className="flex items-end justify-between mt-1 px-1">
              <StatCell label="总距离" value={km.toFixed(2)} />
              <StatCell label="总时长" value={fmtMS(elapsed)} />
              <StatCell label="实时配速" value={running ? fmtPace(paceSec) : "--'--''"} />
            </div>
          </div>
        </>
      )}

      {/* 深紫数据面板(4页真横滑) */}
      {!showCountdown && !collapsed && (
        <div className="absolute inset-x-0 top-24 bottom-0 z-10 rounded-t-3xl flex flex-col" style={{ background: PANEL_BG }}>
          <PanelHandle
            collapsed={false}
            bindCollapse={collapseBind}
            onCollapse={() => setParam('min', '1')}
            onExpand={() => setParam('min', null)}
          />

          {/* 默认音乐卡 */}
          <button
            {...wontfix('run.active.music.wontfix')}
            className="mx-5 mt-1 shrink-0 flex items-center gap-3 rounded-xl border-none px-3 py-2.5 text-left"
            style={{ background: 'rgba(255,255,255,.07)' }}
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,.1)' }}>
              <IcMusic size={16} className="text-white/70" />
            </span>
            <span>
              <span className="block text-white text-[14px] font-medium">默认音乐 ›</span>
              <span className="block text-white/50 text-[12px] mt-0.5">让音乐陪伴你的每一次运动</span>
            </span>
          </button>

          {/* 数据页:横滑切换 + 边缘点击兼容自动化 */}
          <div className="relative flex-1 min-h-0 pt-3 overflow-hidden">
            <button
              {...bindTap(
                { kind: 'action', id: 'run.active.panel.swipeRight' },
                { onTrigger: () => goPanel(panelIdx - 1) },
              )}
              className="absolute left-0 top-0 bottom-0 w-8 bg-transparent border-none z-10"
              aria-label="上一页"
            />
            <button
              {...bindTap(
                { kind: 'action', id: 'run.active.panel.swipeLeft' },
                { onTrigger: () => goPanel(panelIdx + 1) },
              )}
              className="absolute right-0 top-0 bottom-0 w-8 bg-transparent border-none z-10"
              aria-label="下一页"
            />
            <div
              ref={panelScrollerRef}
              onScroll={onPanelScroll}
              className="h-full flex overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-none"
              style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' }}
              data-scroll-container="panels"
              data-scroll-direction="horizontal"
            >
              {panels}
            </div>
          </div>

          {/* 页码指示点 */}
          <div className="flex justify-center gap-2 shrink-0 pb-2">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                type="button"
                {...bindTap(
                  { kind: 'action', id: i > panelIdx ? 'run.active.panel.swipeLeft' : 'run.active.panel.swipeRight' },
                  { onTrigger: () => goPanel(i) },
                )}
                className="w-1.5 h-1.5 rounded-full border-none p-0"
                style={{ background: i === panelIdx ? '#fff' : 'rgba(255,255,255,.3)' }}
                aria-label={`数据页 ${i + 1}`}
              />
            ))}
          </div>

          {/* 底部控制:锁屏 / 暂停(红停+绿续) / 设置 */}
          <div className="flex items-center justify-between px-8 pb-7 shrink-0">
            <button
              {...bindTap({ kind: 'action', id: 'run.active.lock' }, { onTrigger: () => setSearchParams((p) => { p.set('lock', '1'); return p; }) })}
              className="w-13 h-13 rounded-full border-none flex items-center justify-center"
              style={{ width: 52, height: 52, background: 'rgba(255,255,255,.1)' }}
              aria-label="锁屏"
            >
              <IcUnlock size={20} className="text-white/80" />
            </button>

            {paused ? (
              <div className="flex items-center gap-5">
                <div className="relative">
                  <button
                    {...stopBind}
                    className="w-20 h-20 rounded-full border-none flex items-center justify-center touch-none"
                    style={{ width: 78, height: 78, background: '#F35D5D' }}
                    aria-label="长按结束"
                  >
                    <span className="w-6 h-6 rounded bg-white" />
                  </button>
                  {pressing === 'stop' && (
                    <svg className="absolute -inset-1 pointer-events-none" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="5" />
                      <circle
                        cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round"
                        strokeDasharray={`${(pressPct * 289).toFixed(0)} 289`} transform="rotate(-90 50 50)"
                      />
                    </svg>
                  )}
                </div>
                <button
                  {...bindTap({ kind: 'action', id: 'run.active.resume' }, { onTrigger: () => resumeRun() })}
                  className="w-20 h-20 rounded-full border-none flex items-center justify-center"
                  style={{ width: 78, height: 78, background: '#24C789' }}
                  aria-label="继续"
                >
                  <IcPlay size={30} className="text-white" />
                </button>
              </div>
            ) : (
              <button
                {...bindTap(
                  { kind: 'action', id: 'run.active.pause' },
                  { onTrigger: () => { pauseRun(); toast('90 分钟后记录自动结束'); } },
                )}
                className="w-20 h-20 rounded-full border-none flex items-center justify-center bg-white shadow"
                style={{ width: 78, height: 78 }}
                aria-label="暂停"
              >
                <IcPause size={30} className="text-app-text" />
              </button>
            )}

            <button
              {...wontfix('run.active.settings.wontfix')}
              className="w-13 h-13 rounded-full border-none flex items-center justify-center"
              style={{ width: 52, height: 52, background: 'rgba(255,255,255,.1)' }}
              aria-label="设置"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="2">
                <path d="M12 2.5 20 7v10l-8 4.5L4 17V7z" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* 锁屏蒙层(长按≥1.2s 解锁) */}
      {locked && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-36" style={{ background: 'rgba(30,24,44,.55)' }}>
          {pressing === 'unlock' && (
            <span className="mb-2 px-2.5 py-1 rounded bg-black/80 text-white text-[12px]">长按解锁</span>
          )}
          <div className="relative">
            <button
              {...bindLongPress(
                { kind: 'action', id: 'run.active.unlock' },
                {
                  duration: LONG_PRESS_MS,
                  ...ringPress('unlock'),
                  onTrigger: () => { setPressing(null); back(); },
                },
              )}
              className="w-24 h-24 rounded-full border-none bg-white flex flex-col items-center justify-center gap-1 touch-none"
              style={{ width: 92, height: 92 }}
            >
              <IcLock size={20} className="text-app-text" />
              <span className="text-[13px] text-app-text">解锁</span>
            </button>
            {pressing === 'unlock' && (
              <svg className="absolute -inset-1.5 pointer-events-none" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="46" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(pressPct * 289).toFixed(0)} 289`} transform="rotate(-90 50 50)"
                />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* 时间/距离过短确认 dialog */}
      {shortDlg && (
        <CenterDialog
          footer={
            <>
              <button
                {...bindTap('run.summary.open.fromRunEndShort', {
                  onTrigger: () => {
                    finishRun();
                    go('run.summary.open.fromRunEndShort', {}, { popTo: '/sport' });
                  },
                })}
                className="flex-1 py-2.5 bg-transparent border-none text-[15px] text-app-text-muted"
              >
                结束并查看结果
              </button>
              <button
                {...bindTap({
                  kind: 'action',
                  id: 'run.active.shortDialog.dismiss',
                }, {
                  onTrigger: () => setSearchParams((p) => { p.delete('dlg'); return p; }, { replace: true }),
                })}
                className="flex-1 py-2.5 bg-transparent border-none text-[15px] font-semibold"
                style={{ color: '#24C789' }}
              >
                继续运动
              </button>
            </>
          }
        >
          本次运动时间或距离过短,无法保存记录,确定结束吗?
        </CenterDialog>
      )}
    </div>
  );
}

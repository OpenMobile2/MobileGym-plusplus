import React, { useEffect, useRef, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { IcClock, IcPlay, IcPause } from '../res/icons';

const FocusPage: React.FC = () => {
  const { t } = useI18n();
  const { action, bindTap, go } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const pomoMinutes = useDidaStore((s) => s.settings.pomoMinutes);
  const activeFocus = useDidaStore((s) => s._temp.activeFocus);
  const startFocus = useDidaStore((s) => s.startFocus);
  const pauseFocus = useDidaStore((s) => s.pauseFocus);
  const resumeFocus = useDidaStore((s) => s.resumeFocus);
  const stopFocus = useDidaStore((s) => s.stopFocus);
  const [mode, setMode] = useState<'pomo' | 'stopwatch'>('pomo');
  const modeRef = useRef<'pomo' | 'stopwatch'>('pomo');
  // 主页显示模式=本地选择;开始新会话时把本地模式同步到会话模式(收起回来默认落会话模式),
  // 但切换器仍可点——用户可切到另一种(见下)。effect 只依赖会话 type,不受暂停/继续影响。
  const activeType = activeFocus?.type;
  useEffect(() => {
    if (activeType) { setMode(activeType); modeRef.current = activeType; }
  }, [activeType]);
  const displayMode = mode;
  // 显示的模式正是运行中会话的模式 → 展示实时计时+小条;否则展示该模式待开始态+开始按钮
  const showRunningUI = !!activeFocus && displayMode === activeFocus.type;

  // 有运行中会话时,底部小条跟真实时钟刷新
  const [, force] = useState(0);
  useEffect(() => {
    if (!activeFocus) return;
    const timer = window.setInterval(() => force((x) => x + 1), 500);
    return () => window.clearInterval(timer);
  }, [activeFocus]);

  const runningLabel = (() => {
    if (!activeFocus) return '';
    const elapsedSec = activeFocus.paused
      ? activeFocus.accumSec
      : activeFocus.accumSec + (TimeService.realNow() - activeFocus.startedRealTs) / 1000;
    const total = pomoMinutes * 60;
    const shown = activeFocus.type === 'pomo' ? Math.max(0, Math.round(total - elapsedSec)) : Math.round(elapsedSec);
    return `${String(Math.floor(shown / 60)).padStart(2, '0')}:${String(shown % 60).padStart(2, '0')}`;
  })();

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      <div className="flex items-center justify-between px-4 py-2">
        <button {...bindTap('focus.stats')} aria-label="stats" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcClock size={18} /></button>
        <span className="text-[17px] font-semibold">{t('focus.title')}</span>
        <span className="w-10" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-8">
        <div className="flex gap-2 rounded-full bg-[#1C1C1E] p-1">
          {(['pomo', 'stopwatch'] as const).map((m) => (
            <button
              key={m}
              {...action('focus.mode.select.item', () => { modeRef.current = m; setMode(m); })}
              className="rounded-full px-5 py-1.5 text-[14px]"
              style={{ background: displayMode === m ? 'var(--dida-accent)' : 'transparent', color: displayMode === m ? '#fff' : '#8E8E93' }}
            >
              {t(m === 'pomo' ? 'focus.pomo' : 'focus.stopwatch')}
            </button>
          ))}
        </div>
        <div className="flex h-64 w-64 items-center justify-center rounded-full border-2 border-[color:var(--dida-divider)]">
          <span className="text-[56px] font-light tabular-nums">{showRunningUI ? runningLabel : (displayMode === 'pomo' ? `${pomoMinutes}:00` : '00:00')}</span>
        </div>
      </div>

      {/* 底部:运行中显示"专注中"小条(点开重进运行页);否则显示开始按钮 */}
      <div className="px-6 pb-28">
        {showRunningUI ? (
          <div className="flex w-full items-center gap-3 rounded-full bg-[#1C1C1E] px-5 py-4">
            {/* 主体:点开运行页 */}
            <button {...bindTap('focus.reopen')} className="flex flex-1 items-center justify-between bg-transparent text-left" aria-label="running">
              <span className="text-[16px] text-white">{t('focus.title')}</span>
              <span className="text-[20px] font-light tabular-nums" style={{ color: 'var(--dida-accent)' }}>{runningLabel}</span>
            </button>
            {/* 右侧图标:直接暂停/继续(暂停显示▶继续,运行显示‖) */}
            <button
              {...action('focus.mini.pause.toggle', () => (activeFocus.paused ? resumeFocus() : pauseFocus()))}
              aria-label="mini-pause"
              className="flex h-8 w-8 shrink-0 items-center justify-center bg-transparent"
              style={{ color: 'var(--dida-accent)' }}
            >
              {activeFocus.paused ? <IcPlay size={22} /> : <IcPause size={22} />}
            </button>
          </div>
        ) : (
          <button {...bindTap('focus.start', { params: { mode }, onTrigger: () => { if (activeFocus) stopFocus(); startFocus(modeRef.current, null); go('focus.start', { mode: modeRef.current }); } })} className="flex w-full items-center justify-center gap-2 rounded-full py-4 text-[17px] font-medium text-white" style={{ background: 'var(--dida-accent)' }}>
            <IcPlay size={20} color="#fff" /> {t('focus.start')}
          </button>
        )}
      </div>
    </div>
  );
};

export default FocusPage;

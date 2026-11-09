import React, { useEffect, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { IcChevronDown, IcBrightness, IcMore, IcMusic, IcPause, IcPlay, IcStop } from '../res/icons';

const FocusRunningPage: React.FC = () => {
  const { t } = useI18n();
  const { action, bindBack, back } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const pomoMinutes = useDidaStore((s) => s.settings.pomoMinutes);
  const activeFocus = useDidaStore((s) => s._temp.activeFocus);
  const pauseFocus = useDidaStore((s) => s.pauseFocus);
  const resumeFocus = useDidaStore((s) => s.resumeFocus);
  const stopFocus = useDidaStore((s) => s.stopFocus);
  const showToast = useDidaStore((s) => s.showToast);

  // 每 250ms 触发一次重渲染,让计时数字跟真实时钟走(计时真源在 store)
  const [, force] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => force((x) => x + 1), 250);
    return () => window.clearInterval(timer);
  }, []);

  // 会话已结束(在别处 stop):自动退回专注主页
  useEffect(() => {
    if (!activeFocus) back();
  }, [activeFocus, back]);

  if (!activeFocus) return <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page h-full pt-10" />;

  const mode = activeFocus.type;
  const paused = activeFocus.paused;
  const elapsedSec = paused
    ? activeFocus.accumSec
    : activeFocus.accumSec + (TimeService.realNow() - activeFocus.startedRealTs) / 1000;
  const totalSec = pomoMinutes * 60;
  const shownSec = mode === 'pomo' ? Math.max(0, Math.round(totalSec - elapsedSec)) : Math.round(elapsedSec);
  const mm = String(Math.floor(shownSec / 60)).padStart(2, '0');
  const ss = String(shownSec % 60).padStart(2, '0');

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      <div className="flex items-center justify-between px-4 py-2">
        {/* 收起:只导航离开,计时在 store 继续 */}
        <button {...bindBack()} aria-label="minimize" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcChevronDown size={20} /></button>
        <div className="flex items-center gap-1 rounded-full bg-[#1C1C1E] px-2 py-1.5">
          <button {...action('focusrun.brightness.toast', () => showToast(t('common.notAvailable')))} aria-label="brightness" className="flex h-7 w-7 items-center justify-center text-white"><IcBrightness size={18} /></button>
          <span className="flex h-7 w-7 items-center justify-center text-[#8E8E93]"><IcMore size={18} /></span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <span className="mb-10 text-[16px] text-[#8E8E93]">{t(mode === 'pomo' ? 'focus.pomo' : 'focus.stopwatch')}</span>
        <div className="flex h-72 w-72 items-center justify-center rounded-full border border-[color:var(--dida-divider)]">
          <span className="text-[64px] font-light tabular-nums">{mm}:{ss}</span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-10 pb-28">
        <button {...action('focusrun.music.toast', () => showToast(t('common.notAvailable')))} aria-label="music" className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--dida-border)] text-[#8E8E93]"><IcMusic size={20} /></button>
        <button {...action('focusrun.pause.toggle', () => (paused ? resumeFocus() : pauseFocus()))} aria-label="pause" className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'var(--dida-accent)' }}>
          {paused ? <IcPlay size={26} color="#fff" /> : <IcPause size={26} color="#fff" />}
        </button>
        <button {...action('focusrun.stop.action', () => { stopFocus(); back(); })} aria-label="stop" className="flex h-12 w-12 items-center justify-center rounded-full border border-[color:var(--dida-border)] text-[#8E8E93]"><IcStop size={20} /></button>
      </div>
    </div>
  );
};

export default FocusRunningPage;

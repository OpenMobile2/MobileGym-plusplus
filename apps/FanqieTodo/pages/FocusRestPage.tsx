import React from 'react';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { cardBgUrl } from '../assets';
import { IcReset, IcStop } from '../res/icons';

const QUOTE = '没有人是一座孤岛,每个人都是这块大陆的一部分。';

export default function FocusRestPage() {
  const { bindTap, action, back } = useFanqieTodoGestures();
  const { t } = useI18n();
  const restMin = useFanqieTodoStore((s) => s.settings.restDurationMin);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const bg = cardBgUrl('dawn');
  // 默认「不休息」(restMin=0):直接显示已完成;否则倒计时
  const [done, setDone] = React.useState(restMin === 0);
  const [left, setLeft] = React.useState(restMin * 60);
  React.useEffect(() => {
    if (restMin === 0) return;
    const id = window.setInterval(() => setLeft((v) => {
      if (v <= 1) { setDone(true); window.clearInterval(id); return 0; }
      return v - 1;
    }), 1000);
    return () => window.clearInterval(id);
  }, [restMin]);

  // 休息结束(含默认「不休息」→ 一进页面即 done)→ 停留 1 秒后自动返回待办。
  // 注意:不用 ref 守卫(StrictMode 会在挂载时双调用 effect,ref 守卫会吞掉定时器)。
  React.useEffect(() => {
    if (!done) return;
    const id = window.setTimeout(() => { showToast('专注已完成'); back(1); }, 1000);
    return () => window.clearTimeout(id);
  }, [done, back, showToast]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  return (
    <div className="relative flex h-full flex-col items-center" data-status-bar-foreground="light"
      style={{ background: bg ? `center/cover url(${bg})` : '#8FB0CF' }}>
      <div className="mt-16 w-full px-8 text-white/90">
        <div className="text-3xl">“</div>
        <div className="-mt-2 text-[17px] leading-relaxed">{QUOTE}</div>
      </div>
      <div className="mt-10 flex flex-col items-center">
        <div className="flex h-64 w-64 flex-col items-center justify-center rounded-full border-2 border-white/80">
          <span className={`font-bold text-white ${done ? 'text-3xl' : 'text-5xl'}`}>{done ? '专注已完成' : fmt(left)}</span>
          {!done && (
            <button {...bindTap('focus.rest.note.open')} className="mt-3 text-sm text-white/80">
              {t('focus.fillNote')}
            </button>
          )}
        </div>
        <div className="mt-6 text-lg text-white/90">{t('focus.resting')}</div>
        <div className="mt-1 text-sm text-white/70">{done ? '即将返回待办' : ''}</div>
      </div>

      <div className="mt-auto flex w-full items-center justify-around px-16 pb-10 text-white/85">
        <button {...action('focus.rest.reset.action', () => { setLeft(restMin * 60); setDone(restMin === 0); })} aria-label="重置"><IcReset size={24} /></button>
        {/* 结束休息 → 回到待办(栈已收起为 [待办, 休息]) */}
        <button {...action('focus.rest.stop.action', () => { back(1); })} aria-label="停止"><IcStop size={26} /></button>
      </div>
    </div>
  );
}

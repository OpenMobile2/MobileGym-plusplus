import React from 'react';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';

export default function BreathPage() {
  const { action, bindBack } = useFanqieTodoGestures();
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const { t } = useI18n();
  const [running, setRunning] = React.useState(false);

  return (
    <div className="relative flex h-full flex-col items-center justify-between bg-gradient-to-b from-[#3E5A82] to-[#B08A6E] py-16"
      data-status-bar-foreground="light">
      <button {...bindBack()} aria-label="关闭" className="absolute right-5 top-11 text-2xl text-white/80">✕</button>
      <div className="text-xl font-bold text-white">{running ? '跟着花瓣深呼吸' : t('lock.breathTitle')}</div>

      {/* 花瓣呼吸动画 */}
      <div className="relative flex h-56 w-56 items-center justify-center">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i}
            className="absolute h-32 w-32 rounded-full bg-white/25"
            style={{ transform: `rotate(${i * 60}deg) translateY(-28px)`, animation: running ? 'pulse 4s ease-in-out infinite' : undefined }} />
        ))}
        <span className="absolute h-16 w-16 rounded-full bg-white/60 blur-sm" />
      </div>

      <div className="flex flex-col items-center gap-4">
        {!running && (
          <button {...action('lock.breath.start.action', () => setRunning(true))}
            className="rounded-full bg-white/85 px-24 py-3 text-base font-semibold text-[#333]">
            {t('lock.breathStart')}
          </button>
        )}
        <button {...action('lock.breath.music.wontfixToast', () => showToast(t('toast.unavailable')))}
          className="text-white/80" aria-label="音乐">♪</button>
      </div>
    </div>
  );
}

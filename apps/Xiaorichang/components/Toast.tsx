import React, { useEffect, useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { colors } from '../res/colors';
import { IconRenderer, IcSun } from '../res/icons';

/**
 * 两种提示的宿主,挂在 Layout 一次即可:
 *  1. 光芒值横幅(R4 录屏):顶部横幅,左侧习惯图标 + 名称 + 「光芒上升啦!」+ 右侧黄色药丸「+10 ✦」
 *  2. wontfix「暂未开放」等一次性 toast:居中黑色胶囊
 */
const Toast: React.FC = () => {
  const toast = useXiaorichangStore((s) => s._temp.toast);
  const glowToast = useXiaorichangStore((s) => s._temp.glowToast);
  const seq = useXiaorichangStore((s) => s._temp.toastSeq);
  const banner = useXiaorichangStore((s) => s.settings.glowBanner);
  const habits = useXiaorichangStore((s) => s.habits);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (seq === 0) return;
    if (glowToast && !banner) return; // 设置页可关闭「光芒值变化横幅」
    if (!glowToast && !toast) return;
    setVisible(true);
    const startedAt = TimeService.realNow();
    const timer = window.setInterval(() => {
      if (TimeService.realNow() - startedAt >= 1800) {
        setVisible(false);
        window.clearInterval(timer);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [toast, glowToast, seq, banner]);

  if (!visible) return null;

  if (glowToast) {
    const habit = habits.find((h) => h.id === glowToast.habitId);
    const up = glowToast.delta > 0;
    return (
      <div className="pointer-events-none absolute inset-x-3 top-11 z-[999]">
        <div className="flex items-center gap-3 rounded-3xl p-3 shadow-[0_6px_20px_rgba(0,0,0,0.08)]"
          style={{ background: up ? colors.toastUpBg : colors.toastDownBg }}>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
            style={{ background: habit?.color ?? colors.brand, color: '#fff' }}>
            {habit ? <IconRenderer name={habit.icon} size={20} /> : <IcSun size={20} />}
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 truncate text-[15px] font-semibold text-[#212121]">
              {habit?.name ?? '光芒值'}
              <IcSun size={13} color={colors.brand} />
            </span>
            <span className="text-xs text-[#9AA5B1]">{up ? '光芒上升啦!' : '光芒下降了'}</span>
          </span>
          <span className="shrink-0 rounded-2xl px-4 py-2 text-lg font-bold"
            style={{
              background: up ? colors.toastUpPill : colors.toastDownPill,
              color: up ? '#8A6A1E' : '#A25151',
            }}>
            {up ? '+' : ''}{glowToast.delta} ✦
          </span>
        </div>
      </div>
    );
  }

  if (!toast) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-[999] flex items-center justify-center">
      <div className="max-w-[80%] rounded-2xl bg-black/78 px-5 py-3 text-center text-sm text-white shadow-lg">
        {toast}
      </div>
    </div>
  );
};

export default Toast;

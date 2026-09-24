import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcNavBack } from '../res/icons';

export default function ReviewNotifypushPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const on = useFlomoStore((s) => s.settings.dailyNotify);
  const setSetting = useFlomoStore((s) => s.setSetting);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-12 px-2 shrink-0">
        <button {...bindBack()} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer" style={{ color: C.text }} aria-label="返回">
          <IcNavBack size={22} />
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>App 通知提醒</div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mx-3 rounded-2xl px-4" style={{ background: C.surface }}>
          <button
            {...bindTap({ kind: 'action', id: 'review.notifyPush.toggle' }, { onTrigger: () => setSetting('dailyNotify', !on) })}
            className="w-full flex items-center bg-transparent border-none cursor-pointer"
            style={{ height: 56 }}
          >
            <span className="flex-1 text-left" style={{ color: C.text, fontSize: 15 }}>每日回顾推送</span>
            <span
              className="relative rounded-full transition-colors"
              style={{ width: 46, height: 28, background: on ? C.green : '#D8DCE0' }}
            >
              <span
                className="absolute top-0.5 rounded-full bg-white transition-all"
                style={{ width: 24, height: 24, left: on ? 20 : 2 }}
              />
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

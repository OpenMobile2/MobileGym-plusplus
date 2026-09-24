import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { IcBack, IcPlus } from '../res/icons';

function daysLeft(ts: number) {
  return Math.ceil((ts - TimeService.now()) / 86400000);
}

export default function FuturePage() {
  const { bindTap, bindBack, action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const futures = useFanqieTodoStore((s) => s.futures);
  const showToast = useFanqieTodoStore((s) => s.showToast);

  return (
    <div className="flex h-full flex-col bg-[#EAF2FB]" data-status-bar-foreground="dark">
      <div className="flex items-center justify-between px-4 pb-2 pt-10">
        <button {...bindBack()} aria-label="返回"><IcBack size={22} /></button>
        <span className="text-base font-semibold text-[#333]">{t('future.title')}</span>
        <div className="flex items-center gap-3">
          <button {...bindTap('future.add.open')} aria-label="添加"><IcPlus size={22} /></button>
          <button {...action('future.appearance.wontfixToast', () => showToast(t('toast.unavailable')))} aria-label="外观">👕</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3" data-scroll-container="main" data-scroll-direction="vertical">
        {futures.length === 0 ? (
          <div className="mt-24 text-center text-sm text-[#8A8F99]">{t('future.empty')}</div>
        ) : (
          futures.map((f) => (
            <button key={f.id} {...bindTap('future.detail.open', { params: { futureId: f.id } })}
              className="mb-3 flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left shadow-sm">
              <div><div className="font-semibold text-[#222]">{f.name}</div><div className="mt-0.5 text-xs text-[#8A8F99]">{f.remark}</div></div>
              <div className="text-right"><div className="text-2xl font-bold text-[#4A90D9]">{daysLeft(f.targetDate)}</div><div className="text-xs text-[#8A8F99]">天</div></div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

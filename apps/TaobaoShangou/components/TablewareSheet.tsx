import React from 'react';
import { Sheet } from './common';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';

const TABLEWARE_OPTIONS = [
  '无需餐具',
  '需要餐具,商家依据餐量提供',
  '1份',
  '2份',
  '3份',
];

/** 餐具份数弹层(spec checkout.tablewareSheet,证据 IMG_R038/frame:f_042) */
export function TablewareSheet({ onPick }: { onPick: (opt: string) => void }) {
  const { bindTap, back } = useTbsgGestures();
  const alwaysTableware = useTbsgStore((s) => s.settings.alwaysTableware);
  const updateSettings = useTbsgStore((s) => s.updateSettings);

  return (
    <Sheet maxH="72%">
      <div className="px-4 pt-4 pb-6 flex flex-col overflow-y-auto">
        <div className="text-[16px] font-semibold text-[#1A1A1A] text-center">选择餐具份数</div>
        <p className="mt-2 text-[11px] leading-4 text-[#999999]">
          根据《生活垃圾管理条例》等相关规定,平台及商家不得主动提供一次性餐具。请按实际用餐需求选择,选无需餐具可获得环保公益奖励。
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {TABLEWARE_OPTIONS.map((opt) => (
            <button
              key={opt}
              {...bindTap<HTMLButtonElement>(
                { kind: 'action', id: 'checkout.tableware.select' },
                {
                  params: { opt },
                  onTrigger: () => {
                    onPick(opt);
                    back();
                  },
                },
              )}
              className="w-full h-11 rounded-lg bg-[#F3F6F8] text-[14px] text-[#1A1A1A] border-none cursor-pointer px-3 text-center"
            >
              {opt}
            </button>
          ))}
        </div>
        {/* 以后都需要餐具 */}
        <button
          {...bindTap<HTMLButtonElement>(
            { kind: 'action', id: 'checkout.tableware.remember' },
            { onTrigger: () => updateSettings({ alwaysTableware: !alwaysTableware }) },
          )}
          className="mt-4 flex items-center justify-center gap-2 bg-transparent border-none cursor-pointer py-1"
        >
          <span
            className={`w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 ${
              alwaysTableware ? 'bg-[#ED6C2C]' : 'border border-[#CCCCCC] bg-white'
            }`}
          >
            {alwaysTableware && (
              <svg viewBox="0 0 12 12" width="10" height="10"><path d="M2 6.2 5 9l5-6" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
            )}
          </span>
          <span className="text-[13px] text-[#666666]">以后都需要餐具</span>
        </button>
      </div>
    </Sheet>
  );
}

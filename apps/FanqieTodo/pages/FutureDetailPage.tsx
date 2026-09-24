import React from 'react';
import { useLocation } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { IcBack } from '../res/icons';

export default function FutureDetailPage() {
  const { search } = useLocation();
  const fid = new URLSearchParams(search).get('futureId') ?? '';
  const { bindBack, action } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const f = useFanqieTodoStore((x) => x.futures.find((y) => y.id === fid) ?? x.futures[0]);
  const days = f ? Math.ceil((f.targetDate - TimeService.now()) / 86400000) : 0;

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#1E2A5A] to-[#2B3A72]" data-status-bar-foreground="light">
      <div className="flex items-center justify-between px-4 pb-2 pt-10 text-white">
        <button {...bindBack()} aria-label="返回"><IcBack size={22} /></button>
        <span className="font-semibold">{f?.name}</span>
        <button {...action('future.detail.edit.action', () => s.showToast('编辑'))}>编辑</button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-white">
        <div className="text-sm opacity-80">距 {f?.name}</div>
        <div className="my-2 text-7xl font-bold">{days}</div>
        <div className="text-sm opacity-80">天</div>
        <div className="mt-4 text-xs opacity-70">{f?.remark}</div>
      </div>
    </div>
  );
}

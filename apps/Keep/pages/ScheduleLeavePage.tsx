import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { C } from '../components/ui';
import { IcClose } from '../res/icons';

const DAY_OPTIONS = [1, 2, 3, 7];

/** 请假弹层(选天数,计划顺延;AI推断)—— 节点 schedule.leave(kind=sheet,锁定Q16A) */
export default function ScheduleLeavePage() {
  const { bindTap, back } = useKeepGestures();
  const s = useKeepStrings();
  const [searchParams, setSearchParams] = useSearchParams();
  const confirmLeave = useKeepStore((st) => st.confirmLeave);

  const days = Number(searchParams.get('days') ?? 0);
  const hasSelection = DAY_OPTIONS.includes(days);

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" data-status-bar-foreground="dark">
      {/* 遮罩:关闭不请假(spec: schedule.leave.close) */}
      <div
        {...bindTap({ kind: 'action', id: 'schedule.leave.close' }, { onTrigger: () => back() })}
        className="absolute inset-0 bg-black/45"
      />
      <div className="relative bg-app-surface rounded-t-2xl flex flex-col pb-4">
        <div className="flex items-center justify-center relative px-4 pt-4 pb-1 shrink-0">
          <div className="font-semibold text-[16px] text-app-text">请假</div>
          <button
            {...bindTap({ kind: 'action', id: 'schedule.leave.close' }, { onTrigger: () => back(), stopPropagation: true })}
            className="absolute right-3 top-3 p-1 bg-transparent border-none text-app-text-muted"
            aria-label="关闭"
          >
            <IcClose size={20} />
          </button>
        </div>
        <div className="px-4 text-[12px] text-app-text-muted text-center">
          请假期间计划自动顺延,回来接着练不断档
        </div>
        {/* 天数选项 */}
        <div className="flex gap-3 px-4 mt-5">
          {DAY_OPTIONS.map((d) => {
            const sel = days === d;
            return (
              <button
                key={d}
                {...bindTap(
                  { kind: 'action', id: 'schedule.leave.days.select' },
                  {
                    params: { days: d },
                    onTrigger: () =>
                      setSearchParams((p) => { p.set('days', String(d)); return p; }, { replace: true }),
                  },
                )}
                className="flex-1 py-3.5 rounded-xl text-[15px]"
                style={{
                  background: sel ? '#EDFBF4' : '#F5F6F8',
                  color: sel ? C.greenDeep : '#4A4E57',
                  border: sel ? `1.5px solid ${C.green}` : '1.5px solid transparent',
                  fontWeight: sel ? 600 : 400,
                }}
              >
                {d}天
              </button>
            );
          })}
        </div>
        {/* 确定:未选禁用 */}
        <div className="px-4 mt-6">
          <button
            {...bindTap(
              { kind: 'action', id: 'schedule.leave.confirm' },
              {
                params: { days },
                onTrigger: () => {
                  if (!hasSelection) return;
                  confirmLeave(days);
                  back();
                },
              },
            )}
            disabled={!hasSelection}
            className="w-full py-3 rounded-full border-none text-white text-[16px] font-medium"
            style={{ background: hasSelection ? C.green : '#A8E8CF' }}
          >
            {s.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

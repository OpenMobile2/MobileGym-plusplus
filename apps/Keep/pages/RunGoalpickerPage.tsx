import React, { useState } from 'react';
import { useKeepGestures } from '../hooks/useKeepGestures';
import { useKeepStrings } from '../hooks/useKeepStrings';
import { useKeepStore } from '../state';
import { BottomSheet } from '../components/Sheet';
import { WheelPicker } from '../components/WheelPicker';
import { PrimaryBtn } from '../components/ui';

/** 目标距离设定滚轮弹层(Q14=A:半屏弹层+公里滚轮+1/3/5/10快捷)—— 节点 run.goalPicker */

const KM_OPTIONS = Array.from({ length: 40 }, (_, i) => ((i + 1) * 0.5).toFixed(2));
const QUICK = [1, 3, 5, 10];

export default function RunGoalpickerPage() {
  const { bindTap } = useKeepGestures();
  const s = useKeepStrings();
  const goalKm = useKeepStore((st) => st.runState.goalKm);
  const setRunGoalKm = useKeepStore((st) => st.setRunGoalKm);
  const [sel, setSel] = useState<number>(goalKm);

  return (
    <BottomSheet title="目标距离">
      <div className="flex flex-col items-center pt-2">
        {/* 公里数滚轮(拖动选择;tap 兜底对齐 0.5 步进) */}
        <div
          {...bindTap(
            { kind: 'action', id: 'run.goalPicker.wheel.scroll' },
            {
              onTrigger: () =>
                setSel((v) => Math.min(20, Math.max(0.5, Math.round(v * 2) / 2))),
            },
          )}
          className="py-1"
        >
          <WheelPicker
            options={KM_OPTIONS}
            value={sel.toFixed(2)}
            onChange={(v) => setSel(Number(v))}
            unit="公里"
            widthClass="w-40"
          />
        </div>

        {/* 快捷选项 1 / 3 / 5 / 10 公里 */}
        <div className="flex gap-3 mt-4 w-full px-2">
          {QUICK.map((q) => {
            const active = Math.abs(sel - q) < 0.001;
            return (
              <button
                key={q}
                {...bindTap(
                  { kind: 'action', id: 'run.goalPicker.quick.select' },
                  { params: { km: q }, onTrigger: () => setSel(q) },
                )}
                className="flex-1 h-10 rounded-full text-[15px] border"
                style={{
                  background: active ? '#EDFBF4' : '#F5F6F8',
                  borderColor: active ? '#24C789' : 'transparent',
                  color: active ? '#0FB27A' : '#1A1A1A',
                  fontWeight: active ? 600 : 400,
                }}
              >
                {q}
              </button>
            );
          })}
        </div>

        <div className="w-full mt-6">
          <PrimaryBtn bind={bindTap('run.home.open.fromGoalPicker', { beforeTrigger: () => setRunGoalKm(sel) })}>
            {s.confirm}
          </PrimaryBtn>
        </div>
      </div>
    </BottomSheet>
  );
}

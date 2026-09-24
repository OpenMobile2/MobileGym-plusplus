/**
 * 备孕模式设置页:经期/周期长度 + 智能预测开关 + 确定(开启备孕模式回首页)。
 * spec: mode.prepSetup;证据 frame r6@6。
 * 注:声明未提供独立的"弹层打开/弹层确定" action id,行点击与滚轮点选共用
 * prepsetup.param.select.target(select),选中即写入 store,弹层「确定」仅关闭(bindBack)。
 */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, TopBar, Switch, WheelPicker, usePanel } from '../components/ui';
import { IcArrowRight } from '../res/icons';

const PERIOD_DAYS = Array.from({ length: 12 }, (_, i) => i + 3);   // 3-14天
const CYCLE_DAYS = Array.from({ length: 26 }, (_, i) => i + 20);   // 20-45天

export default function PrepSetupPage() {
  const { bindTap, bindBack, go } = useMeiyouGestures();
  const { value: panel, open: openPanel } = usePanel('sheet');

  const cycle = useMeiyouStore((st) => st.cycle);
  const setPeriodLen = useMeiyouStore((st) => st.setPeriodLen);
  const setCycleLen = useMeiyouStore((st) => st.setCycleLen);
  const toggleSmartPredict = useMeiyouStore((st) => st.toggleSmartPredict);
  const enablePrepMode = useMeiyouStore((st) => st.enablePrepMode);

  const isPeriodSheet = panel === 'periodlen';
  const sheetOpen = panel === 'periodlen' || panel === 'cyclelen';
  const days = isPeriodSheet ? PERIOD_DAYS : CYCLE_DAYS;
  const curLen = isPeriodSheet ? cycle.periodLen : cycle.cycleLen;

  return (
    <div className="flex flex-col h-full relative" style={{ background: MY.bg }}>
      <TopBar title="备孕模式设置" />

      <div className="flex-1 px-3 pt-3 flex flex-col">
        <div className="bg-white rounded-2xl px-3">
          <button
            {...bindTap({ kind: 'action', id: 'prepsetup.param.select.target' }, {
              params: { target: 'periodlen' },
              onTrigger: () => openPanel('periodlen'),
            })}
            className="w-full flex items-center bg-transparent border-none cursor-pointer text-left"
            style={{ height: 52 }}
          >
            <span className="flex-1 text-[15px] text-[#1A1A1A]">经期长度</span>
            <span className="text-[15px] text-[#333]">{cycle.periodLen}天</span>
            <IcArrowRight size={18} className="text-[#CCC]" />
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'prepsetup.param.select.target' }, {
              params: { target: 'cyclelen' },
              onTrigger: () => openPanel('cyclelen'),
            })}
            className="w-full flex items-center bg-transparent border-none cursor-pointer text-left border-t border-[#F5F5F7]"
            style={{ height: 52 }}
          >
            <span className="flex-1 text-[15px] text-[#1A1A1A]">周期长度</span>
            <span className="text-[15px] text-[#333]">{cycle.cycleLen}天</span>
            <IcArrowRight size={18} className="text-[#CCC]" />
          </button>
        </div>

        <div className="bg-white rounded-2xl px-3 mt-2.5 flex items-center" style={{ height: 52 }}>
          <span className="flex-1 text-[15px] text-[#1A1A1A]">使用智能预测</span>
          <Switch
            on={cycle.smartPredict}
            bind={bindTap({ kind: 'action', id: 'prepsetup.smartpredict.toggle' }, { onTrigger: toggleSmartPredict })}
          />
        </div>
        <div className="px-2 mt-2 text-[12px] text-[#999] leading-5">
          建议开启,开启后美柚会根据您设置的数据和之前的月经记录预测排卵日和下次的月经时间。
        </div>
      </div>

      {/* 底部确定:开启备孕模式并回首页(首页展示备孕变体即反馈) */}
      <div className="px-5 pb-6 shrink-0">
        <button
          {...bindTap({ kind: 'action', id: 'prepsetup.mode.confirm' }, {
            onTrigger: () => {
              enablePrepMode();
              go('meiyou.prep-done');
            },
          })}
          className="w-full h-12 rounded-full border-none cursor-pointer text-[16px] font-semibold text-white"
          style={{ background: MY.primary }}
        >
          确定
        </button>
      </div>

      {/* 天数滚轮弹层(选中即写入,确定=关闭) */}
      {sheetOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl flex flex-col pb-6">
            <div className="flex items-center justify-between px-4 h-12 shrink-0">
              <button {...bindBack()} className="text-[14px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
              <div className="text-[15px] font-semibold text-[#1A1A1A]">{isPeriodSheet ? '选择经期天数' : '选择周期天数'}</div>
              <button {...bindBack()} className="text-[14px] font-semibold bg-transparent border-none cursor-pointer" style={{ color: MY.primary }}>
                确定
              </button>
            </div>
            <WheelPicker
              options={days.map((n) => `${n}天`)}
              value={`${curLen}天`}
              bindFor={(o) =>
                bindTap({ kind: 'action', id: 'prepsetup.param.select.target' }, {
                  params: { target: o },
                  onTrigger: () => {
                    const n = parseInt(o, 10);
                    if (isPeriodSheet) setPeriodLen(n);
                    else setCycleLen(n);
                  },
                })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

/** 经期设置页。spec: settings.cycle */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { TopBar, Switch, MY, usePanel, useFlowerToast } from '../components/ui';
import { IcArrowRight, IcDrop, IcCalendar, IcAI } from '../res/icons';

const rangeArr = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

export default function CycleSettingsPage() {
  const { bindTap, bindBack, back } = useMeiyouGestures();
  const cycle = useMeiyouStore((s) => s.cycle);
  const setPeriodLen = useMeiyouStore((s) => s.setPeriodLen);
  const setCycleLen = useMeiyouStore((s) => s.setCycleLen);
  const toggleSmart = useMeiyouStore((s) => s.toggleSmartPredict);
  const togglePreg = useMeiyouStore((s) => s.togglePregProb);
  const { value: sheet, open: openSheet } = usePanel('sheet');
  const [flower, showFlower] = useFlowerToast();
  const [pick, setPick] = React.useState<number | null>(null);

  const isPeriod = sheet === 'periodlen';
  const isCycle = sheet === 'cyclelen';
  const options = isPeriod ? rangeArr(3, 14) : rangeArr(20, 45);
  const curVal = pick ?? (isPeriod ? cycle.periodLen : cycle.cycleLen);

  const confirm = () => {
    if (isPeriod) setPeriodLen(curVal);
    else setCycleLen(curVal);
    setPick(null);
    back();            // 关闭 ?sheet= 滚轮弹层
    showFlower('已更新');
  };

  return (
    <div className="flex flex-col h-full bg-[#F2F2F4] relative">
      <TopBar title="经期设置" />
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 pt-4 pb-1 text-[13px] text-[#999]">您的月经大概持续几天?</div>
        <button
          {...bindTap({ kind: 'action', id: 'cycle.periodlen.open' }, { onTrigger: () => openSheet('periodlen') })}
          className="w-full bg-white px-4 h-13 flex items-center border-none cursor-pointer"
          style={{ height: 52 }}
        >
          <IcDrop size={18} style={{ color: MY.primary }} />
          <span className="flex-1 text-left ml-3 text-[15px] text-[#1A1A1A]">经期长度</span>
          <span className="text-[14px]" style={{ color: MY.primary }}>{cycle.periodLen}天</span>
          <IcArrowRight size={16} className="text-[#CCC] ml-1" />
        </button>

        <div className="px-4 pt-4 pb-1 text-[13px] text-[#999]">两次月经开始日大概间隔多久?</div>
        <button
          {...bindTap({ kind: 'action', id: 'cycle.cyclelen.open' }, { onTrigger: () => openSheet('cyclelen') })}
          className="w-full bg-white px-4 flex items-center border-none cursor-pointer"
          style={{ height: 52 }}
        >
          <IcCalendar size={18} style={{ color: MY.primary }} />
          <span className="flex-1 text-left ml-3 text-[15px] text-[#1A1A1A]">周期长度</span>
          <span className="text-[14px]" style={{ color: MY.primary }}>{cycle.cycleLen}天</span>
          <IcArrowRight size={16} className="text-[#CCC] ml-1" />
        </button>

        <div className="bg-white mt-4 px-4 flex items-center" style={{ height: 52 }}>
          <IcAI size={18} style={{ color: MY.primary }} />
          <span className="flex-1 ml-3 text-[15px] text-[#1A1A1A]">使用智能预测</span>
          <Switch on={cycle.smartPredict} bind={bindTap({ kind: 'action', id: 'cycle.smartpredict.toggle' }, { onTrigger: toggleSmart })} />
        </div>
        <div className="px-4 py-2 text-[12px] text-[#999]">建议开启,开启后美柚会根据您设置的数据和之前的月经记录预测下次的月经时间。</div>

        <div className="bg-white mt-2 px-4 flex items-center" style={{ height: 52 }}>
          <span className="text-[15px]">🌸</span>
          <span className="flex-1 ml-3 text-[15px] text-[#1A1A1A]">显示怀孕几率</span>
          <Switch on={cycle.showPregProb} bind={bindTap({ kind: 'action', id: 'cycle.pregprob.toggle' }, { onTrigger: togglePreg })} />
        </div>

        <div className="px-4 py-6 text-[12px] text-[#999]">您所填写的生理信息将用于经期记录、分析及预测</div>
      </div>

      {(isPeriod || isCycle) && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative bg-white rounded-t-2xl flex flex-col pb-6">
            <div className="flex items-center justify-between px-4 h-12">
              <button {...bindBack()} className="text-[14px] text-[#666] bg-transparent border-none cursor-pointer">取消</button>
              <div className="text-[15px] font-semibold text-[#1A1A1A]">{isPeriod ? '选择经期天数' : '选择周期天数'}</div>
              <button
                {...bindTap({ kind: 'action', id: 'cycle.len.confirm' }, { onTrigger: () => { confirm(); } })}
                className="text-[14px] font-semibold bg-transparent border-none cursor-pointer"
                style={{ color: MY.primary }}
              >
                确定
              </button>
            </div>
            <div className="max-h-56 overflow-y-auto px-6" data-scroll-container="wheel" data-scroll-direction="vertical">
              {options.map((o) => (
                <button
                  key={o}
                  {...bindTap({ kind: 'action', id: 'cycle.len.select.target' }, { params: { target: String(o) }, onTrigger: () => setPick(o) })}
                  className={`w-full py-2.5 text-center border-none cursor-pointer rounded-lg ${
                    o === curVal ? 'bg-[#F7F7F9] text-[20px] font-semibold text-[#1A1A1A]' : 'bg-transparent text-[15px] text-[#999]'
                  }`}
                >
                  {o}天
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {flower}
    </div>
  );
}

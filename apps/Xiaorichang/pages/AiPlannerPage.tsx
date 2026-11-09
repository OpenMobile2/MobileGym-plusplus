import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcSparkles, IcClose } from '../res/icons';

const SAMPLES = [
  { id: 'writer', text: '三年后成为一个职业作家' },
  { id: 'weight', text: '一年内减重20斤' },
  { id: 'smoke', text: '两个月内戒烟' },
];

/**
 * AI 习惯设计师(Gate4 补拍 s252)。
 * 原裁定整页 wontfix,证明过头:输入框与示例 chip 完全可实现,
 * 只有「AI 生成习惯方案」需要真实 LLM 后端 —— 只把**那一个按钮**留 toast。
 */
export default function AiPlannerPage() {
  const st = useXiaorichangStore();
  const { action, bindBack } = useXiaorichangGestures();
  const s = useStrings();
  const [goal, setGoal] = useState('');

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-10">
        <button {...bindBack()} aria-label="关闭"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F7]"><IcClose size={18} /></button>
        <div className="text-base font-bold text-[#212121]">AI 习惯设计师</div>
        <span className="w-9" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="rounded-3xl p-4" style={{ background: colors.brandWash }}>
          <div className="flex items-center gap-2 text-base font-bold" style={{ color: '#8A6A1E' }}>
            <IcSparkles size={18} /> AI 帮你设计微习惯
          </div>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: '#B78A2F' }}>
            告诉我你的目标,我会根据微习惯原则,帮助您将远大目标拆解为每日可坚持的习惯。
            这些小而美的习惯足够简单、易于执行,长期坚持将祝您实现目标。
          </p>
          <div className="mt-3 inline-block rounded-full bg-white px-3 py-1 text-xs" style={{ color: '#8A6A1E' }}>
            ⚡ 今日剩余 30/30
          </div>
        </div>

        <div className="mt-4 text-xs text-[#9AA5B1]">我的目标</div>
        <div className="mt-2 rounded-2xl bg-[#F8F8F8] p-3">
          <textarea
            {...action('ai.planner.goal.input', () => {}, { params: { value: goal } })}
            value={goal} maxLength={50} onChange={(e) => setGoal(e.target.value)}
            placeholder="例如: 三年后成为一个职业作家"
            className="h-20 w-full resize-none rounded-xl bg-white p-3 text-sm outline-none" />
          <div className="mt-1 text-right text-xs text-[#C9CDD3]">{goal.length}/50</div>
          <div className="mt-1 text-xs text-[#9AA5B1]">试试这些目标:</div>
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {SAMPLES.map((sp) => (
              <button key={sp.id}
                {...action('ai.planner.sample.pick', () => setGoal(sp.text), { params: { sampleId: sp.id } })}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-xs text-[#424242]">
                {sp.text}
              </button>
            ))}
          </div>
        </div>

        {/* 唯一需要 LLM 的按钮 —— 可见即可点,给明确 toast(铁律①) */}
        <button {...action('ai.planner.generate.wontfixToast', () => st.showNotice(s.notAvailable))}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold"
          style={{ background: colors.brandSun, color: '#fff' }}>
          <IcSparkles size={18} /> AI 生成习惯方案
        </button>
      </div>
    </div>
  );
}

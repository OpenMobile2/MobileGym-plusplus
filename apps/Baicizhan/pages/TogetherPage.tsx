import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';

const LANDMARKS = ['组队打卡', '单词对战', '同桌', '小班', '小卖部', '招新广场'];

export default function TogetherPage() {
  const s = useStrings();
  const { action } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const [firstCoin, setFirstCoin] = useState(true);
  return (
    <div className="flex h-full flex-col" style={{ background: colors.mapGrass }} data-status-bar-foreground="dark">
      <div className="px-4 pt-12">
        <div className="inline-block rounded-full bg-[#FFF6D8] px-3 py-1 text-xs text-[#8A6A2A]">今日 647033 人 正在一起背</div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-y-auto p-4" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 右栏 */}
        <div className="absolute right-3 top-2 flex flex-col gap-2">
          {['校牌', '好友', '背包'].map((r) => (
            <button key={r} {...action('together.rail.wontfixToast', toast)} className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-white/70 text-[10px] text-[#5B6B85]">📇<span>{r}</span></button>
          ))}
        </div>
        {/* 地标 */}
        <div className="mt-2 grid grid-cols-2 gap-4 pr-16">
          {LANDMARKS.map((l) => (
            <button key={l} {...action('together.landmark.wontfixToast', toast)} className="flex h-24 flex-col items-center justify-center rounded-2xl bg-white/60 text-sm text-[#3A5540]">🏠<span className="mt-1">{l}</span></button>
          ))}
        </div>
        {/* mission 卡车 */}
        <button {...action('together.landmark.wontfixToast', toast)} className="mt-4 flex h-16 w-full items-center justify-center rounded-2xl bg-white/60 text-sm text-[#3A5540]">🚚 mission</button>
        {/* 散落铜币 */}
        <div className="mt-4 flex gap-6">
          <button {...action('together.coin.collect', () => { if (firstCoin) { st.claimTask('login'); st.showToast('铜板 +1'); setFirstCoin(false); } })}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5D06B] text-xs">{firstCoin ? '🪙' : '✓'}</button>
          {['x?', 'x?', 'x?'].map((c, i) => (
            <button key={i} {...action('together.coin.locked.wontfixToast', () => st.showToast('完成对应任务后可领'))} className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EAD9A0] text-[10px] text-[#8A6A2A]">🪙{c}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

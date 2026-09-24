import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcClose, IcCoin } from '../res/icons';

export default function CoinPage() {
  const s = useStrings();
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const get = [['📕', '拼写或复习'], ['🎯', '连对挑战'], ['🫙', '学习任务'], ['🚚', '一起背任务']];
  const use = [['⚔️', '训练场道具', true], ['🎭', '虚拟装扮', true], ['🎟️', '商城折扣', false]];
  return (
    <div className="flex h-full flex-col" style={{ background: '#C9DDF6' }} data-status-bar-foreground="dark">
      <div className="flex items-center px-4 pt-12">
        <div className="text-base font-semibold text-[#33405C]">{s.myCoin}</div>
        <button {...action('coin.rule.wontfixToast', toast)} className="ml-2 text-[#7B88A0]">ⓘ</button>
        <button {...bindBack()} className="ml-auto"><IcClose size={22} color="#5B6B85" /></button>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2"><IcCoin size={28} /><span className="text-4xl font-bold text-[#33405C]">{st.coins}</span></div>

      <div className="mx-4 mt-6 rounded-2xl bg-white/60 p-4">
        <div className="text-center text-sm font-bold text-[#33405C]">{s.howToGetCoin}</div>
        <div className="mt-3 flex justify-between">
          {get.map(([ic, t]) => <div key={t} className="flex w-16 flex-col items-center gap-1"><div className="text-2xl">{ic}</div><span className="text-center text-[10px] text-[#5B6B85]">{t}</span></div>)}
        </div>
      </div>

      <div className="mx-4 mt-4 rounded-2xl bg-white/60 p-4">
        <div className="text-center text-sm font-bold text-[#33405C]">{s.howToUseCoin}</div>
        <div className="mt-3 flex justify-around">
          {use.map(([ic, t, wf]) => (
            <button key={t as string} {...(wf ? action('coin.use.wontfixToast', toast) : bindTap('coin.usemall.open'))}
              className="flex w-20 flex-col items-center gap-1"><div className="text-2xl">{ic}</div><span className="text-center text-[10px] text-[#5B6B85]">{t}</span></button>
          ))}
        </div>
      </div>
      <div className="flex-1" style={{ background: colors.homeBg, opacity: 0 }} />
    </div>
  );
}

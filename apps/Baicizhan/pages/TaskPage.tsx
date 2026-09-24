import React from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcArrowLeft, IcCoin } from '../res/icons';

const TASKS = [
  { id: 'login', label: '登录', prog: '1/1', reward: 50, done: false },
  { id: 'setPlan', label: '设置新的学习计划', prog: '0/1', reward: 100, done: false, goto: 'plan' as const },
  { id: 'doPlan', label: '完成一次学习计划', prog: '0/1', reward: 150, done: false, goto: 'study' as const },
];

export default function TaskPage() {
  const s = useStrings();
  const { bindTap, action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  return (
    <div className="flex h-full flex-col" style={{ background: '#BFDAF5' }} data-status-bar-foreground="dark">
      <div className="flex items-center px-4 pt-12">
        <button {...bindBack()}><IcArrowLeft size={22} color="#33405C" /></button>
        <button {...action('task.help.wontfixToast', toast)} className="ml-auto text-[#5B6B85]">?</button>
        <button {...action('task.promo.wontfixToast', toast)} className="ml-3 text-[#5B6B85]">🎁</button>
      </div>
      <div className="mt-2 flex items-center px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg">🐶</div>
        <div className="ml-2 text-sm font-semibold text-[#33405C]">{st.profile.name}</div>
        <button {...bindTap('task.coin.open')} className="ml-auto flex items-center gap-1 rounded-full bg-white/60 px-3 py-1 text-sm text-[#33405C]"><IcCoin size={14} />{st.coins} ›</button>
      </div>

      <div className="mx-4 mt-4 flex flex-col items-center rounded-3xl bg-white/50 py-6">
        <button {...action('task.gift.open', () => st.showToast(st.stars >= 3 ? '开启礼包!' : '再集齐星星'))}
          className="flex h-32 w-24 items-center justify-center rounded-2xl border-4 border-white/70 bg-white/40 text-4xl font-black text-[#33405C]">{st.stars}/3</button>
        <div className="mt-3 text-xs text-[#5B6B85]">完成任务得星星,集齐 3 颗开礼包</div>
      </div>

      <div className="mx-4 mt-4 rounded-2xl bg-white p-3">
        <div className="text-sm font-bold text-[#33405C]">回归任务</div>
        {TASKS.map((t) => {
          const claimed = st.claimedTasks.includes(t.id);
          return (
            <div key={t.id} className="mt-3 flex items-center">
              <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-[#FFF0D8] text-[#E8912D]"><IcCoin size={16} /><span className="text-[8px]">x{t.reward}</span></div>
              <div className="ml-3 text-sm text-[#33405C]">{t.label}({t.prog})</div>
              {t.id === 'login' && !claimed && (
                <button {...action('task.reward.claim', () => st.claimTask('login'), { params: { taskId: 'login' } })} className="ml-auto rounded-full px-4 py-1.5 text-xs font-semibold text-white" style={{ background: colors.primary }}>点击领取</button>
              )}
              {claimed && <span className="ml-auto text-xs text-[#9AA5B1]">已领取</span>}
              {t.goto === 'plan' && <button {...bindTap('task.goto.plan')} className="ml-auto rounded-full bg-[#EAF0FF] px-4 py-1.5 text-xs text-[#5B78C8]">去完成</button>}
              {t.goto === 'study' && <button {...bindTap('task.goto.study')} className="ml-auto rounded-full bg-[#EAF0FF] px-4 py-1.5 text-xs text-[#5B78C8]">去完成</button>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

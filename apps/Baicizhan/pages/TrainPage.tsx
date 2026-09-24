import React from 'react';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';

export default function TrainPage() {
  const s = useStrings();
  const { bindTap } = useBaicizhanGestures();
  const games = ['抢词', '单词对战', '消消练', '一站到底'];
  const drills = ['听音选义', '读词填空']; // 需音频/暂无截图,保留 wontfix
  return (
    <div className="flex h-full flex-col bg-[#F3F6FB]" data-status-bar-foreground="dark">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 pt-12" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="text-xl font-bold text-[#212121]">{s.tabTrain}</div>
        <div className="text-xs text-[#9AA5B1]">碎片时间来一把,强化记忆</div>

        <div className="mt-4 text-sm font-bold text-[#33405C]">{s.trainGames}</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {games.map((g) => (
            <button key={g} {...bindTap('train.unavailable.open', { params: { feature: g } })} className="flex items-center justify-between rounded-2xl bg-white p-4">
              <span className="text-sm font-semibold text-[#33405C]">{g}</span><span className="text-xl">🎮</span>
            </button>
          ))}
        </div>

        <div className="mt-5 text-sm font-bold text-[#33405C]">{s.trainDrill}</div>
        <div className="mt-3 rounded-2xl bg-white p-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { bind: bindTap('train.choice.open'), label: s.trainChoice },
              { bind: bindTap('train.cnchoice.open'), label: '中文选词' },
              { bind: bindTap('train.spell.open'), label: s.trainSpell },
              { bind: bindTap('train.fillblank.open'), label: '填空拼写' },
              { bind: bindTap('train.assemble.open'), label: '组合拼写' },
            ].map(({ bind, label }) => (
              <button key={label} {...bind} className="rounded-xl bg-[#EAF0FF] py-3 text-center text-sm" style={{ color: colors.primary }}>{label}</button>
            ))}
            {drills.map((d) => <button key={d} {...bindTap('train.unavailable.open', { params: { feature: d } })} className="rounded-xl bg-[#F2F3F5] py-3 text-center text-sm text-[#5B6B85]">{d}</button>)}
          </div>
        </div>

        <div className="mt-5 text-sm font-bold text-[#33405C]">{s.trainQuick}</div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <button {...bindTap('train.selfcheck.open')} className="rounded-2xl bg-[#EAF0FF] py-5 text-center text-sm" style={{ color: colors.primary }}>单词自检</button>
          <button {...bindTap('train.unavailable.open', { params: { feature: '单词速听' } })} className="rounded-2xl bg-white py-5 text-center text-sm text-[#5B6B85]">单词速听</button>
        </div>

        <div className="mt-5 text-sm font-bold text-[#33405C]">单词拓展</div>
        <button {...bindTap('train.unavailable.open', { params: { feature: '单词视频' } })} className="mt-3 w-full rounded-2xl bg-white py-5 text-center text-sm text-[#5B6B85]">单词视频</button>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useXimalayaGestures } from '../hooks/useXimalayaGestures';
import { TopBar } from '../components/ui';

// 左类目 → 右侧名家/子类 chips(合成内容,保留分类结构)
const RAILS: { cat: string; chips: string[] }[] = [
  { cat: '相声', chips: ['逗哏堂', '捧哏社', '相声新势力', '经典对口', '群口相声', '逗趣专场'] },
  { cat: '评书', chips: ['醒木先生', '长篇评书', '英雄演义', '武侠评书', '历史评书', '公案传奇'] },
  { cat: '小品', chips: ['欢乐剧场', '爆笑小品', '舞台喜剧', '校园小品', '方言小品', '情景喜剧'] },
  { cat: '戏曲', chips: ['梨园客', '名段赏析', '地方戏曲', '经典唱段', '戏曲入门', '折子戏'] },
  { cat: '其他曲艺', chips: ['快板书', '单弦', '大鼓', '评弹', '数来宝', '琴书'] },
];

export function CategoryPage() {
  const { bindTap } = useXimalayaGestures();
  const [cat, setCat] = useState<string>(RAILS[0].cat);

  const active = RAILS.find((r) => r.cat === cat) ?? RAILS[0];

  return (
    <div className="h-full flex flex-col pt-10 bg-white" data-status-bar-foreground="dark">
      <TopBar title="相声评书分类" />
      <div className="flex-1 flex min-h-0">
        {/* 左类目栏 */}
        <div className="w-24 shrink-0 bg-[#F5F5F5] overflow-y-auto" data-scroll-container data-scroll-direction="vertical">
          {RAILS.map((r) => {
            const on = r.cat === cat;
            return (
              <button
                key={r.cat}
                {...bindTap({ kind: 'action', id: 'category.rail.select.opt' }, { params: { cat: r.cat }, onTrigger: () => setCat(r.cat) })}
                className={'w-full text-left px-3 py-3.5 text-[14px] ' + (on ? 'bg-white text-[#FE4543] font-medium' : 'text-[#666]')}
              >
                {r.cat}
              </button>
            );
          })}
        </div>

        {/* 右侧名家/子类 chips 宫格 */}
        <div className="flex-1 overflow-y-auto px-3 py-3" data-scroll-container data-scroll-direction="vertical">
          <div className="text-[15px] font-semibold text-[#333] mb-3">{active.cat}名家</div>
          <div className="grid grid-cols-3 gap-2.5">
            {active.chips.map((c) => (
              <button
                key={c}
                {...bindTap('category.chip-open')}
                className="h-10 rounded-lg bg-[#F5F5F5] text-[13px] text-[#333] flex items-center justify-center truncate px-1"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

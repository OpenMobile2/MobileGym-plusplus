import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar, Img } from '../components/ui';
import { useJingdongStore } from '../state';

// 话题动态卡:文案 + 商品图 + 时间,点进商品详情
const POSTS: { itemId: string; blurb: string; time: string }[] = [
  { itemId: 'i_thinkbook', blurb: '拯救者笔记本性能好,打游戏很有感觉', time: '11:12' },
  { itemId: 'i_phone_v', blurb: '我的这款手机太有质感啦', time: '昨天' },
  { itemId: 'i_phone_honor', blurb: '太喜欢我的这款手机了', time: '昨天' },
  { itemId: 'i_earbuds', blurb: '这副耳机降噪效果绝了,通勤必备', time: '星期二' },
  { itemId: 'i_watch', blurb: '入手这块手表,运动数据超准', time: '星期二' },
];

export function InteractivePage() {
  const { bindTap } = useJingdongGestures();
  const items = useJingdongStore((s) => s.items);

  const cards = POSTS.map((p) => ({ ...p, item: items.find((i) => i.id === p.itemId) })).filter((c) => c.item);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="互动动态" className="pt-10 bg-white" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="interactive-list" data-scroll-direction="vertical">
        <div className="flex flex-col">
          {cards.map((c) => (
            <button
              key={c.itemId}
              {...bindTap('interactive.item-open', { params: { itemId: c.itemId } })}
              className="text-left flex gap-3 px-4 py-4 bg-white border-b-8 border-[#F5F5F5] active:bg-[#FAFAFA]"
            >
              {/* 话题动态 图标 */}
              <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#FFD36E] to-[#FF7EB3] flex items-center justify-center text-white text-[24px] font-bold leading-none">
                #
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center">
                  <span className="text-[15px] font-semibold text-[#1A1A1A]">话题动态</span>
                  <span className="ml-auto text-[12px] text-[#B5B5B5]">{c.time}</span>
                  <span className="ml-2 text-[#CCC] text-[16px] leading-none">···</span>
                </div>
                <div className="mt-1.5 text-[15px] leading-relaxed text-[#1A1A1A]">
                  这篇真的不一样:<span className="text-[#333]">【{c.blurb}】</span>,忍不住分享给你!
                </div>
                <div className="mt-2.5 relative">
                  <Img src={c.item!.image} className="w-40 h-40 rounded-lg object-cover bg-[#F2F2F2]" />
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E1251B]" />
                </div>
              </div>
            </button>
          ))}
        </div>
        <div className="py-4 text-center text-[12px] text-[#BBB]">没有更多了</div>
      </div>
    </div>
  );
}

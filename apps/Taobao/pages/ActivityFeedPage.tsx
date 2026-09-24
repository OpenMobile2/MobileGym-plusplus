import React from 'react';
import { useTaobaoStore } from '../state';
import { TopBar, Img, Price, useToast } from '../components/ui';
import { IcSettings } from '../res/icons';

/** 活动优惠聚合(spec: message.activity,IMG_8718,P2 展示页) */
export default function ActivityFeedPage() {
  const items = useTaobaoStore((s) => s.items);
  const [toast, showToast] = useToast();
  const cards = [
    { source: '限时优惠', time: '09:06', title: '吃刻了人生吐司', item: items[9], action: '立即抢购' },
    { source: '淘金币', time: '星期日', title: '你感兴趣的鞋,金币可抵扣10.2元', item: items[14], action: '去购买' },
    { source: '搜索比价', time: '星期六', title: '你感兴趣的「顺手买」商品降价了', item: items[12], action: '找同款' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F7]">
      <TopBar
        title="活动优惠"
        rightContent={
          <button onClick={() => showToast('订阅设置暂未开放')} className="bg-transparent border-none cursor-pointer">
            <IcSettings size={17} className="text-[#333333]" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3" data-scroll-container="activity-list" data-scroll-direction="vertical">
        {cards.map((c, i) => (
          <div key={i} className="bg-white rounded-xl mt-2 p-3">
            <div className="flex justify-between text-[12px] text-[#999999]">
              <span className="flex items-center gap-1">
                <span className="w-4 h-4 rounded bg-[#FF5000] text-white text-[9px] flex items-center justify-center">淘</span>
                {c.source}
              </span>
              <span>{c.time}</span>
            </div>
            <div className="text-[14px] font-semibold mt-1.5">{c.title}</div>
            {c.item && (
              <div className="flex gap-2.5 mt-2 items-center">
                <Img src={c.item.image} className="w-14 h-14 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#666666] line-clamp-1">商品信息 {c.item.title}</div>
                  <div className="text-[11px] text-[#999999] mt-0.5">专属优惠即将过期,抓紧时间抢购!</div>
                </div>
              </div>
            )}
            <button className="mt-2 text-[12px] text-[#FF5000] border border-[#FF5000] rounded-full px-3 py-1 bg-white cursor-pointer">
              {c.action}
            </button>
          </div>
        ))}
        <div className="text-center text-[12px] text-[#999999] py-4">- 仅展示近30天消息 -</div>
      </div>
      {toast}
    </div>
  );
}

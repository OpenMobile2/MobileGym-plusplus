import React from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { TopBar, Img, wontfix } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { useJingdongStore } from '../state';
import { IcSearch, IcTicket } from '../res/icons';

const BENEFITS = [
  { title: '学生PLUS', sub: '买一年赠一年', bg: 'from-[#FFF4D6] to-[#FFE9B0]' },
  { title: 'Apple产品', sub: '高考生9折优惠', bg: 'from-[#EDEDED] to-[#DDDDDD]' },
  { title: '学生寄快递', sub: '享5折优惠', bg: 'from-[#FFE9EC] to-[#FFD3DA]' },
  { title: '学生省钱卡', sub: '花小钱省大钱', bg: 'from-[#FFF0DE] to-[#FFE0B8]' },
  { title: '海底捞69折', sub: '高考生8.8折', bg: 'from-[#FFE7E2] to-[#FFC9BE]' },
  { title: '学生专享', sub: '爆款低至7折', bg: 'from-[#E7F3FF] to-[#CFE6FF]' },
];

export function CampusPage() {
  const { bindTap } = useJingdongGestures();
  const items = useJingdongStore((s) => s.items);
  const feed = items.slice(0, 8);

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5] pt-10" data-status-bar-foreground="dark">
      <TopBar title="京东校园" />
      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="campus-feed"
        data-scroll-direction="vertical"
      >
        {/* 搜索条 + 频道 tab */}
        <div className="bg-white px-3 pt-1 pb-2">
          <div className="flex items-center h-9 rounded-full border border-[#E1251B] px-3 gap-2">
            <IcSearch size={16} className="text-[#E1251B]" />
            <span className="text-[13px] text-[#999] flex-1">thinkbook14+笔记本 2026</span>
            <span className="text-[14px] font-semibold text-[#E1251B]">搜索</span>
          </div>
          <div className="flex gap-4 mt-2 text-[14px] overflow-x-auto no-scrollbar">
            {['推荐', '领券中心', '京东校园', '秒杀', '指数交易'].map((t) => (
              <span
                key={t}
                className={`whitespace-nowrap py-1 ${
                  t === '京东校园'
                    ? 'text-white bg-[#2EA7E0] px-3 rounded-full font-semibold'
                    : 'text-[#333]'
                }`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* 每日领京豆 / 领餐补 / 抽大奖 */}
        <div className="mx-3 mt-3 grid grid-cols-2 gap-3">
          <button
            {...bindTap({ kind: 'action', id: 'campus.benefit.wontfix' }, { onTrigger: wontfix })}
            className="bg-white rounded-xl p-3 text-left"
          >
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#1A1A1A]">每日领京豆</span>
              <span className="text-[11px] text-[#999]">可抵¥0 ›</span>
            </div>
            <div className="flex items-center justify-between mt-3 text-[11px] text-[#B07A38]">
              <span>昨天</span>
              <span>今天</span>
              <span className="text-[#F0A020] font-semibold">+2 🪙</span>
            </div>
            <div className="mt-3 h-8 rounded-full bg-gradient-to-r from-[#F5B84E] to-[#F0A020] text-white text-[13px] font-semibold flex items-center justify-center">
              签到领京豆
            </div>
          </button>
          <div className="grid grid-rows-2 gap-3">
            <button
              {...bindTap({ kind: 'action', id: 'campus.benefit.wontfix' }, { onTrigger: wontfix })}
              className="bg-white rounded-xl p-3 flex items-center justify-between text-left"
            >
              <div>
                <div className="text-[14px] font-bold text-[#1A1A1A]">每日领餐补</div>
                <div className="text-[11px] text-[#E1251B] mt-0.5">最低领17元</div>
              </div>
              <span className="text-[18px] font-bold text-[#E1251B]">¥17</span>
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'campus.benefit.wontfix' }, { onTrigger: wontfix })}
              className="bg-white rounded-xl p-3 flex items-center justify-between text-left"
            >
              <div>
                <div className="text-[14px] font-bold text-[#1A1A1A]">每日抽大奖</div>
                <div className="text-[11px] text-[#E1251B] mt-0.5">得无门槛红包</div>
              </div>
              <span className="text-[20px]">🧧</span>
            </button>
          </div>
        </div>

        {/* 领券中心入口 */}
        <button
          {...bindTap('campus.couponcenter-open')}
          className="mx-3 mt-3 w-[calc(100%-1.5rem)] bg-white rounded-xl px-4 h-12 flex items-center justify-between"
        >
          <span className="flex items-center gap-2 text-[15px] font-semibold text-[#1A1A1A]">
            <IcTicket size={18} className="text-[#E1251B]" /> 领券中心
          </span>
          <span className="text-[12px] text-[#E1251B]">领学生专属券 ›</span>
        </button>

        {/* 学生权益卡 */}
        <div className="mx-3 mt-3 grid grid-cols-3 gap-2.5">
          {BENEFITS.map((b) => (
            <button
              key={b.title}
              {...bindTap({ kind: 'action', id: 'campus.benefit.wontfix' }, { onTrigger: wontfix })}
              className={`rounded-xl p-2.5 text-left bg-gradient-to-br ${b.bg}`}
            >
              <div className="text-[14px] font-bold text-[#1A1A1A] leading-tight">{b.title}</div>
              <div className="text-[10px] text-[#8A6A3A] mt-1 leading-tight">{b.sub}</div>
            </button>
          ))}
        </div>

        {/* 超级补贴 */}
        <div className="mx-3 mt-3 bg-white rounded-xl overflow-hidden flex">
          <button
            {...bindTap({ kind: 'action', id: 'campus.benefit.wontfix' }, { onTrigger: wontfix })}
            className="w-28 shrink-0 bg-[#E1251B] text-white flex flex-col items-center justify-center py-4"
          >
            <div className="text-[12px]">✦ 超级补贴 ✦</div>
            <div className="text-[26px] font-bold leading-none mt-1">¥10</div>
            <div className="text-[11px] mt-0.5">满10.1可用</div>
            <div className="mt-2 px-3 py-1 rounded-full bg-white text-[#E1251B] text-[12px] font-semibold">
              立即领取
            </div>
          </button>
          <div className="flex-1 flex gap-2 p-2 overflow-x-auto no-scrollbar">
            {feed.slice(0, 4).map((it) => (
              <button
                key={it.id}
                {...bindTap('campus.item-open', { params: { itemId: it.id } })}
                className="w-20 shrink-0 text-center"
              >
                <Img src={it.image} className="w-20 h-20 rounded-lg object-cover" />
                <div className="text-[11px] text-[#999] mt-1">热度飙升</div>
                <div className="text-[14px] font-bold text-[#E1251B]">¥{it.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 同学都在买 商品流 */}
        <div className="mx-3 mt-4 flex items-center gap-3 text-[16px] font-bold">
          <span className="text-[#1A1A1A] border-b-2 border-[#E1251B] pb-0.5">同学都在买</span>
          <span className="text-[#999] font-normal text-[14px]">拍拍二手</span>
          <span className="text-[#999] font-normal text-[14px]">1元试用</span>
          <span className="text-[#999] font-normal text-[14px]">生鲜水果</span>
        </div>
        <div className="grid grid-cols-2 gap-2 p-3 pt-2">
          {feed.map((it) => (
            <ItemCard
              key={it.id}
              item={it}
              openBind={bindTap('campus.item-open', { params: { itemId: it.id } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { useToast } from '../components/ui';
import { ItemCard } from '../components/ItemCard';
import { Avatar } from '../components/ItemImage';
import {
  IcSettings, IcArrowRight, IcHeart, IcFootprint, IcUsers, IcTicket, IcRecycle,
} from '../res/icons';

const TRADE = [
  { id: 'bought', label: '我买到的', tid: 'mine.ordersBought-open' },
  { id: 'sold', label: '我卖出的', tid: 'mine.ordersSold-open' },
  { id: 'published', label: '我发布的', tid: 'mine.published-open' },
] as const;

const QUICK = [
  { id: 'fav', label: '我的收藏', tid: 'mine.favorites-open', Icon: IcHeart },
  { id: 'foot', label: '历史浏览', tid: 'mine.footprint-open', Icon: IcFootprint },
  { id: 'follow', label: '我的关注', tid: 'mine.follow-open', Icon: IcUsers },
  { id: 'coupon', label: '红包卡券', tid: 'mine.coupons-open', Icon: IcTicket },
] as const;

const GRID = ['超级擦亮', '账号管理', '我的评价', '芝麻信用', '小法庭', '帮我卖', '借钱', '公益宝贝'];

export default function MinePage() {
  const { bindTap } = useXianyuGestures();
  const [toast, showToast] = useToast();
  const user = useXianyuStore((s) => s.user);
  const items = useXianyuStore((s) => s.items);
  const orders = useXianyuStore((s) => s.orders);
  const listings = useXianyuStore((s) => s.listings);

  const boughtN = orders.filter((o) => o.role === 'buyer').length;
  const soldN = orders.filter((o) => o.role === 'seller').length;
  const listN = listings.filter((l) => l.status === 'onSale').length;
  const counts: Record<string, number> = { bought: boughtN, sold: soldN, published: listN };
  const recommend = items.filter((i) => i.sellerId !== 'me');

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      {/* 顶部品牌黄头部 */}
      <div className="bg-[#FFE411] shrink-0 pt-2">
        <div className="flex justify-end px-3">
          <button {...bindTap('mine.settings-open')} aria-label="设置" className="bg-transparent border-none cursor-pointer p-1">
            <IcSettings size={22} className="text-[#111]" />
          </button>
        </div>
        <div className="flex items-center gap-3 px-4 pb-4">
          <button {...bindTap('mine.settings-open')} className="bg-transparent border-none p-0 cursor-pointer">
            <Avatar seed={user.id} name={user.name} size={56} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="text-[17px] font-bold text-[#111] truncate">{user.name}</div>
            <button
              onClick={() => showToast('信用分详情暂未开放')}
              className="mt-1 inline-flex items-center gap-1 bg-[#1CB854] text-white text-[11px] px-2 py-0.5 rounded-full border-none cursor-pointer"
            >
              鱼力值 {user.fishScore}
            </button>
          </div>
          <div className="flex gap-4 text-center">
            <div><div className="font-bold text-[15px] text-[#111]">{user.following}</div><div className="text-[11px] text-[#666]">关注</div></div>
            <div><div className="font-bold text-[15px] text-[#111]">{user.followers}</div><div className="text-[11px] text-[#666]">粉丝</div></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="MinePage-main" data-scroll-direction="vertical">
        {/* 交易入口 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-3">
          <div className="text-[14px] font-semibold text-[#111] mb-2">我的交易</div>
          <div className="flex">
            {TRADE.map((t) => (
              <button key={t.id} {...bindTap(t.tid)} className="flex-1 flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1">
                <span className="text-[18px] font-bold text-[#111]">{counts[t.id]}</span>
                <span className="text-[12px] text-[#666]">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 快捷入口 */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-3 grid grid-cols-4 gap-2">
          {QUICK.map((q) => (
            <button key={q.id} {...bindTap(q.tid)} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer py-1">
              <q.Icon size={22} className="text-[#FF8A00]" />
              <span className="text-[11px] text-[#666]">{q.label}</span>
            </button>
          ))}
        </div>

        {/* 闲鱼回收 */}
        <button {...bindTap('home.recycle-open')} className="bg-white mx-3 mt-3 rounded-xl p-3 flex items-center gap-2 w-[calc(100%-24px)] border-none cursor-pointer">
          <IcRecycle size={20} className="text-[#1CB854]" />
          <span className="text-[14px] text-[#111] flex-1 text-left">闲鱼回收 · 闲置换钱</span>
          <IcArrowRight size={16} className="text-[#999]" />
        </button>

        {/* 功能九宫格(wontfix toast) */}
        <div className="bg-white mx-3 mt-3 rounded-xl p-3">
          <div className="text-[14px] font-semibold text-[#111] mb-2">更多功能</div>
          <div className="grid grid-cols-4 gap-y-3">
            {GRID.map((g) => (
              <button key={g} onClick={() => showToast(`「${g}」暂未开放`)} className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer">
                <span className="w-9 h-9 rounded-full bg-[#F4F4F4] flex items-center justify-center text-[15px]">🐟</span>
                <span className="text-[11px] text-[#666]">{g}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 猜你喜欢 */}
        <div className="mt-3 px-2">
          <div className="text-center text-[13px] text-[#999] py-2">— 猜你喜欢 —</div>
          <div className="flex gap-2 items-start">
            <div className="flex-1 min-w-0">{recommend.filter((_, i) => i % 2 === 0).map((it) => <ItemCard key={it.id} item={it} />)}</div>
            <div className="flex-1 min-w-0">{recommend.filter((_, i) => i % 2 === 1).map((it) => <ItemCard key={it.id} item={it} />)}</div>
          </div>
        </div>
      </div>
      {toast}
    </div>
  );
}

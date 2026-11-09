import React, { useState } from 'react';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { Img, showToast } from '../components/ui';
import { IcNavBack, IcStar } from '../res/icons';

export function WaimaiReviewPage() {
  const { bindTap, bindBack, back } = useJingdongGestures();
  const orders = useJingdongStore((s) => s.orders);
  const lifeShops = useJingdongStore((s) => s.lifeShops);
  const submitReview = useJingdongStore((s) => s.submitReview);

  const order = orders.find((o) => o.channel === 'miaosong') ?? orders[0];
  const shop = lifeShops.find((s) => s.kind === 'restaurant') ?? lifeShops[0];
  const shopName = order?.shopName ?? shop?.name ?? '京东秒送';

  const [rating, setRating] = useState(0);
  const [mood, setMood] = useState<'' | 'bad' | 'good'>('');

  const submit = () => {
    if (order) submitReview(order.id, rating || 5);
    showToast('评价已提交,感谢您的反馈');
    back();
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F5F7]" data-status-bar-foreground="dark">
      {/* 头部 */}
      <div className="shrink-0 pt-10 bg-[#F4F5F7] flex items-center px-2 h-[calc(2.5rem+2.75rem)]">
        <button {...bindBack()} aria-label="返回" className="w-9 h-9 flex items-center justify-center -ml-1">
          <IcNavBack size={22} className="text-[#333]" />
        </button>
        <span className="flex-1 text-center text-[18px] font-semibold text-[#1A1A1A] pr-8">评价发布</span>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pt-2">
        {/* 对商家/菜品 */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold text-[#1A1A1A]">你对商家/菜品满意吗?</span>
            <span className="text-[12px] text-[#BBB]">已对商家匿名</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-[#F5F5F5] shrink-0"><Img src={shop?.logo ?? ''} className="w-full h-full object-cover" /></div>
            <span className="text-[15px] font-semibold text-[#1A1A1A] truncate">{shopName}</span>
          </div>
          <div className="mt-4 bg-[#F6F8FA] rounded-xl px-3 py-4 flex items-center gap-3">
            <span className="text-[13px] text-[#666] shrink-0">满意值</span>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  key={i}
                  {...bindTap({ kind: 'action', id: 'waimaireview.merchant.rate.set' }, { params: { value: i }, onTrigger: () => setRating(i) })}
                  aria-label={`${i}星`}
                >
                  <IcStar size={32} className={i <= rating ? 'text-[#FFB400] fill-current' : 'text-[#D8DCE0]'} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 对骑手 */}
        <div className="bg-white rounded-2xl p-4 mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[17px] font-bold text-[#1A1A1A]">你对骑手还满意吗?</span>
            <span className="text-[12px] text-[#BBB]">已对骑手匿名</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <div className="w-9 h-9 rounded-full bg-[#FF4E33] flex items-center justify-center text-white text-[16px] shrink-0">🛵</div>
            <div>
              <div className="text-[15px] font-semibold text-[#1A1A1A]">配送骑手</div>
              <div className="text-[11px] text-[#999]">07月05日19:12左右送达</div>
            </div>
          </div>
          <div className="flex gap-3 mt-3">
            <button
              {...bindTap({ kind: 'action', id: 'waimaireview.rider.select.mood' }, { params: { mood: 'bad' }, onTrigger: () => setMood('bad') })}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-[15px] ${mood === 'bad' ? 'bg-[#FFF1EE] text-[#FF2D2D] font-semibold' : 'bg-[#F6F8FA] text-[#666]'}`}
            >
              💔 不满意
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'waimaireview.rider.select.mood' }, { params: { mood: 'good' }, onTrigger: () => setMood('good') })}
              className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-1.5 text-[15px] ${mood === 'good' ? 'bg-[#FFF1EE] text-[#FF2D2D] font-semibold' : 'bg-[#F6F8FA] text-[#666]'}`}
            >
              ❤️ 满意
            </button>
          </div>
        </div>
      </div>

      {/* 提交 */}
      <div className="shrink-0 p-3" data-hide-on-keyboard>
        <button
          {...bindTap({ kind: 'action', id: 'waimaireview.form.submit' }, { onTrigger: submit })}
          className={`w-full h-12 rounded-full text-[16px] font-semibold ${rating > 0 || mood ? 'bg-[#FF2D2D] text-white' : 'bg-[#FFB0A6] text-white'}`}
        >
          请评价骑手和商家
        </button>
      </div>
    </div>
  );
}

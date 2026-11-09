import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJingdongGestures } from '../hooks/useJingdongGestures';
import { useJingdongStore } from '../state';
import { TopBar, Img, EmptyState, showToast } from '../components/ui';
import { IcStar, IcPlus } from '../res/icons';
import { pickImages } from '@/os/albumBridge';

const RATING_TEXT = ['', '非常差', '差', '一般', '满意', '非常满意'];

export function WriteReviewPage() {
  const { bindTap, back } = useJingdongGestures();
  const { orderId } = useParams();
  const orders = useJingdongStore((s) => s.orders);
  const submitReview = useJingdongStore((s) => s.submitReview);
  const order = orders.find((o) => o.id === orderId) || orders.find((o) => o.status === 'done') || orders[0];

  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
        <TopBar title="发布评价" className="pt-10" />
        <EmptyState text="订单不存在" />
      </div>
    );
  }

  const first = order.lines[0];

  const submit = () => {
    submitReview(order.id, rating);
    showToast('评价成功,感谢您的反馈');
    back();
  };

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <TopBar title="发布评价" className="pt-10" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="writereview-scroll" data-scroll-direction="vertical">
        {/* 商品行 */}
        <div className="mx-3 mt-2 bg-white rounded-xl p-4 flex items-center gap-2.5">
          <Img src={first.image} className="w-14 h-14 rounded-lg object-cover bg-[#F5F5F5] shrink-0" alt={first.title} />
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-[#1A1A1A] line-clamp-2 leading-[17px]">{first.title}</div>
            <div className="text-[12px] text-[#999] mt-1">{first.skuDesc}</div>
          </div>
        </div>

        {/* 评分 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-medium text-[#1A1A1A]">综合评分</span>
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    {...bindTap({ kind: 'action', id: 'writereview.rating.set' }, { params: { rating: n }, onTrigger: () => setRating(n) })}
                    aria-label={`${n}星`}
                  >
                    <IcStar size={26} className={n <= rating ? 'text-[#FF8A00]' : 'text-[#DDD]'} fill={n <= rating ? '#FF8A00' : 'none'} />
                  </button>
                ))}
              </div>
              <span className="text-[13px] text-[#FF8A00] w-14">{RATING_TEXT[rating]}</span>
            </div>
          </div>
        </div>

        {/* 文字输入 + 晒图 */}
        <div className="mx-3 mt-3 bg-white rounded-xl p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="宝贝满足你的期待吗?说说它的优点和不足吧~"
            className="w-full h-28 resize-none text-[14px] text-[#333] placeholder:text-[#BBB] outline-none"
          />
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((src) => (
              <Img key={src} src={src} className="w-20 h-20 rounded-lg object-cover" alt="" />
            ))}
            {images.length < 3 && (
              <button
                type="button"
                {...bindTap({ kind: 'action', id: 'writereview.media.pick' }, {
                  onTrigger: () => {
                    void pickImages({ multiple: true, maxSelect: 3 - images.length }).then((r) => {
                      if (r.cancelled || !r.selected.length) return;
                      setImages((prev) => [...prev, ...r.selected.map((x) => x.uri)].slice(0, 3));
                    });
                  },
                })}
                className="w-20 h-20 rounded-lg border border-dashed border-[#DDD] bg-[#FAFAFA] flex flex-col items-center justify-center text-[#BBB]"
              >
                <IcPlus size={22} />
                <span className="text-[11px] mt-1">添加图片</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 提交 */}
      <div className="shrink-0 bg-[#F5F5F5] px-3 py-2.5" data-keep-keyboard="true">
        <button
          {...bindTap({ kind: 'action', id: 'writereview.form.submit' }, { onTrigger: submit })}
          className="w-full h-11 rounded-full bg-[#E1251B] text-[16px] font-medium text-white"
        >
          提交评价
        </button>
      </div>
    </div>
  );
}

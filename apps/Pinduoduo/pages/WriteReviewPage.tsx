import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePinduoduoGestures } from '../hooks/usePinduoduoGestures';
import { usePinduoduoStore } from '../state';
import { Img, TopBar, showToast } from '../components/ui';
import { IcStar, IcCamera } from '../res/icons';

export function WriteReviewPage() {
  const { orderId } = useParams();
  const { bindTap, go } = usePinduoduoGestures();
  const order = usePinduoduoStore((s) => s.orders.find((o) => o.id === orderId));
  const submitReview = usePinduoduoStore((s) => s.submitReview);

  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');

  const line = order?.lines[0];

  return (
    <div className="h-full flex flex-col pt-10 bg-[#F5F5F5] overflow-hidden" data-status-bar-foreground="dark">
      <TopBar title="评价" className="bg-white" />

      <div className="flex-1 overflow-y-auto">
        {/* 商品行 */}
        {line && (
          <div className="mt-2 bg-white px-4 py-3 flex items-center gap-3">
            <Img src={line.image} className="w-14 h-14 rounded-lg object-cover shrink-0" alt={line.title} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#333] leading-snug line-clamp-2">{line.title}</div>
              <div className="text-[12px] text-[#999] mt-1 truncate">{line.skuDesc}</div>
            </div>
          </div>
        )}

        {/* 星级评分 */}
        <div className="mt-2 bg-white px-4 py-4 flex items-center gap-3">
          <span className="text-[13px] text-[#333]">商品评分</span>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                {...bindTap({ kind: 'action', id: 'writereview.rating.set' }, {
                  params: { rating: n },
                  onTrigger: () => setRating(n),
                })}
                aria-label={`${n}星`}
              >
                <IcStar
                  size={26}
                  className={n <= rating ? 'text-[#FFB400] fill-[#FFB400]' : 'text-[#DDD]'}
                />
              </button>
            ))}
          </div>
        </div>

        {/* 文字输入 */}
        <div className="mt-2 bg-white px-4 py-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="从多个角度评价宝贝,可以帮助更多想买的人哦~"
            className="w-full text-[14px] text-[#333] outline-none resize-none leading-relaxed"
          />
          {/* 加图占位 */}
          <div className="flex gap-2 mt-2">
            <div className="w-16 h-16 rounded-lg border border-dashed border-[#DDD] flex flex-col items-center justify-center text-[#BBB]">
              <IcCamera size={20} />
              <span className="text-[10px] mt-1">加图片</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部提交 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-4 py-2.5" data-hide-on-keyboard>
        <button
          {...bindTap({ kind: 'action', id: 'writereview.form.submit' }, {
            onTrigger: () => {
              if (orderId) submitReview(orderId, rating);
              showToast('评价成功');
              go('writereview.orders-open');
            },
          })}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF4D2E] to-[#E22E1F] text-white font-medium"
        >
          提交评价
        </button>
      </div>
    </div>
  );
}

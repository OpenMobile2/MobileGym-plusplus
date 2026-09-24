import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { ItemImage } from '../components/ItemImage';
import { useToast } from '../components/ui';
import { IcStar, IcImagePlus, IcCheck } from '../res/icons';

const RATING_LABEL = ['', '非常差', '差', '一般', '满意', '非常满意'];

export default function ReviewWritePage() {
  const { orderId = '' } = useParams();
  const { bindTap, back } = useXianyuGestures();
  const [toast, showToast] = useToast();

  const order = useXianyuStore((s) => s.orders.find((o) => o.id === orderId));
  const submitReview = useXianyuStore((s) => s.submitReview);

  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
        <TopBar title="发评价" />
        <div className="flex-1 flex items-center justify-center text-[#999] text-sm">订单不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="发评价" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="ReviewWritePage-main" data-scroll-direction="vertical">
        {/* 商品条 */}
        <div className="bg-white px-4 py-3 flex gap-2 items-center">
          <ItemImage seed={order.itemId} src={order.image} label={order.title} className="w-14 h-14 rounded-lg" />
          <div className="flex-1 min-w-0 text-[13px] text-[#1A1A1A] line-clamp-2">{order.title}</div>
        </div>

        {/* 总体评分 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-[#111]">总体评价</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  {...bindTap({ kind: 'action', id: 'review.rating.select.target' }, { params: { target: n }, onTrigger: () => setRating(n) })}
                  aria-label={`${n}星`}
                  className="bg-transparent border-none cursor-pointer p-0.5"
                >
                  <IcStar size={26} className={n <= rating ? 'text-[#FF8A00]' : 'text-[#DDD]'} fill={n <= rating ? '#FF8A00' : 'none'} />
                </button>
              ))}
            </div>
            <span className="text-[13px] text-[#FF8A00]">{RATING_LABEL[rating]}</span>
          </div>
        </div>

        {/* 评价文本 */}
        <div className="bg-white mt-2 px-4 py-3">
          <textarea
            {...bindTap({ kind: 'action', id: 'review.text.input' }, { onTrigger: () => {} })}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="宝贝质量如何?卖家服务怎么样?分享你的使用感受~"
            className="w-full h-24 text-[14px] text-[#1A1A1A] border-none outline-none resize-none bg-transparent"
          />
          {/* 晒图 */}
          <button
            {...bindTap({ kind: 'action', id: 'review.photo.add' }, { onTrigger: () => {
              void import('@/os/albumBridge').then(({ pickImages }) =>
                pickImages({ multiple: true, maxSelect: 3 }).then((result) => {
                  if (result.cancelled || !result.selected.length) return;
                  setImages(result.selected.map((image) => image.uri));
                  showToast(`已选择${result.selected.length}张图片`);
                }),
              );
            } })}
            className="mt-2 w-16 h-16 rounded-lg bg-[#F4F4F4] flex flex-col items-center justify-center gap-1 border-none cursor-pointer text-[#999]"
          >
            <IcImagePlus size={22} />
            <span className="text-[10px]">晒图</span>
          </button>
          {images.length > 0 && <div className="mt-1 text-[11px] text-[#FF8A00]">已选择 {images.length} 张图片</div>}
        </div>

        {/* 匿名开关 */}
        <button
          {...bindTap({ kind: 'action', id: 'review.anonymous.toggle' }, { onTrigger: () => setAnonymous((v) => !v) })}
          className="bg-white mt-2 w-full px-4 py-3.5 flex items-center border-none cursor-pointer"
        >
          <span className="text-[14px] text-[#111] flex-1 text-left">匿名评价</span>
          <span className={`w-5 h-5 rounded-full flex items-center justify-center ${anonymous ? 'bg-[#FF3B30] text-white' : 'border border-[#CCC]'}`}>
            {anonymous && <IcCheck size={14} />}
          </span>
        </button>
      </div>

      {/* 发布 */}
      <div className="shrink-0 bg-white border-t border-[#EEE] px-3 py-2" data-hide-on-keyboard>
        <button
          {...bindTap({ kind: 'action', id: 'review.submit.commit' }, { onTrigger: () => { submitReview(orderId, rating, content, anonymous, images); back(); } })}
          className="w-full h-11 rounded-full text-white font-semibold text-[15px] border-none cursor-pointer"
          style={{ background: 'linear-gradient(90deg,#FF6A00,#FF3000)' }}
        >发布</button>
      </div>
      {toast}
    </div>
  );
}

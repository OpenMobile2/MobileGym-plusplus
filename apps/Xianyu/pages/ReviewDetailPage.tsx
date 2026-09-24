import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useXianyuStore } from '../state';
import { useXianyuGestures } from '../hooks/useXianyuGestures';
import { TopBar } from '../components/TopBar';
import { ItemImage, Avatar } from '../components/ItemImage';
import { useToast, EmptyState } from '../components/ui';
import { IcStar, IcPraise } from '../res/icons';

export default function ReviewDetailPage() {
  const { orderId = '' } = useParams();
  const { bindTap } = useXianyuGestures();
  const [toast, showToast] = useToast();

  const order = useXianyuStore((s) => s.orders.find((o) => o.id === orderId));
  const review = useXianyuStore((s) => s.reviews.find((r) => r.orderId === orderId));
  const user = useXianyuStore((s) => s.user);
  const appendReview = useXianyuStore((s) => s.appendReview);

  const [showAppend, setShowAppend] = useState(false);
  const [appendText, setAppendText] = useState('');

  if (!order || !review) {
    return (
      <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
        <TopBar title="评价详情" />
        <EmptyState text="暂无评价" />
      </div>
    );
  }

  const submitAppend = () => {
    if (!appendText.trim()) { showToast('请输入追评内容'); return; }
    appendReview(orderId, appendText);
    setAppendText('');
    setShowAppend(false);
    showToast('追评已发布');
  };

  return (
    <div className="flex flex-col h-full bg-[#F4F4F4]" data-status-bar-foreground="dark">
      <TopBar title="评价详情" />

      <div className="flex-1 overflow-y-auto" data-scroll-container="ReviewDetailPage-main" data-scroll-direction="vertical">
        {/* 商品条 */}
        <div className="bg-white px-4 py-3 flex gap-2 items-center">
          <ItemImage seed={order.itemId} src={order.image} label={order.title} className="w-14 h-14 rounded-lg" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#1A1A1A] line-clamp-2">{order.title}</div>
            <div className="text-[12px] text-[#999] mt-1">{order.sellerName}</div>
          </div>
        </div>

        {/* 我的评价 */}
        <div className="bg-white mt-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <Avatar seed={review.anonymous ? 'anon' : user.id} name={review.anonymous ? '匿' : user.name} size={36} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] text-[#111]">{review.anonymous ? '匿名用户' : user.name}</div>
              <div className="flex items-center gap-0.5 mt-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <IcStar key={n} size={14} className={n <= review.rating ? 'text-[#FF8A00]' : 'text-[#DDD]'} fill={n <= review.rating ? '#FF8A00' : 'none'} />
                ))}
              </div>
            </div>
          </div>
          <div className="text-[14px] text-[#1A1A1A] mt-3 leading-relaxed">{review.content || '此用户没有填写评价内容'}</div>
          {review.images.length > 0 && (
            <div className="flex gap-2 mt-2">
              {review.images.map((img, i) => (
                <ItemImage key={i} seed={`${orderId}_${i}`} src={img} label="晒图" className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          )}
          {review.append && (
            <div className="mt-3 bg-[#F7F7F7] rounded-lg px-3 py-2">
              <div className="text-[12px] text-[#FF8A00] mb-1">追加评价</div>
              <div className="text-[14px] text-[#1A1A1A]">{review.append}</div>
            </div>
          )}
        </div>

        {/* 追加评价输入 */}
        {showAppend && !review.append && (
          <div className="bg-white mt-2 px-4 py-3">
            <textarea
              value={appendText}
              onChange={(e) => setAppendText(e.target.value)}
              placeholder="补充一下使用感受吧~"
              className="w-full h-20 text-[14px] text-[#1A1A1A] border-none outline-none resize-none bg-[#F7F7F7] rounded-lg p-2"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={submitAppend}
                className="text-[14px] text-[#111] font-semibold bg-[#FFE411] px-5 h-9 rounded-full border-none cursor-pointer"
              >发布追评</button>
            </div>
          </div>
        )}

        {/* 操作区 */}
        <div className="bg-white mt-2 px-4 py-3 flex gap-3">
          {!review.append && (
            <button
              {...bindTap({ kind: 'action', id: 'review.append.open' }, { onTrigger: () => setShowAppend(true) })}
              className="flex-1 h-10 rounded-full border border-[#DDD] bg-white text-[#333] text-[14px] cursor-pointer"
            >追加评价</button>
          )}
          <button
            {...bindTap({ kind: 'action', id: 'review.praise.send' }, { onTrigger: () => showToast('已夸夸Ta') })}
            className="flex-1 h-10 rounded-full border border-[#FF8A00] bg-white text-[#FF8A00] text-[14px] cursor-pointer inline-flex items-center justify-center gap-1"
          >
            <IcPraise size={16} /> 夸夸Ta
          </button>
        </div>
      </div>
      {toast}
    </div>
  );
}

import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useVipshopStore } from '../state';
import { useVipshopGestures } from '../hooks/useVipshopGestures';
import { TopBar, Img, useToast, EmptyState, VIP } from '../components/ui';
import { IcStar, IcCamera } from '../res/icons';

const REVIEW_TAGS = ['质量很好', '尺码标准', '物流快', '颜色正', '性价比高', '包装精美'];
const RATING_TEXT = ['', '很差', '一般', '还行', '满意', '非常好'];

export default function ReviewWritePage() {
  const { id = '' } = useParams();
  const { bindTap, back } = useVipshopGestures();
  const [toast, showToast] = useToast();

  const order = useVipshopStore((s) => s.orders.find((o) => o.id === id));
  const submitReview = useVipshopStore((s) => s.submitReview);

  const [rating, setRating] = useState(5);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const line = order?.lines[0];

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-[#F5F5F5]">
        <TopBar title="发表评价" />
        <EmptyState text="订单不存在" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#F5F5F5]">
      <TopBar title="发表评价" />

      <div className="flex-1 overflow-y-auto">
        {/* 商品 */}
        {line && (
          <div className="bg-white px-3 py-3 flex items-center gap-3">
            <Img src={line.image} className="w-14 h-14 rounded-lg object-cover shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-[#222222] line-clamp-2">{line.title}</div>
              <div className="text-[11px] text-[#888888] mt-0.5">{line.skuDesc}</div>
            </div>
          </div>
        )}

        {/* 评分 */}
        <div className="bg-white mt-2 px-3 py-4 flex flex-col items-center gap-2">
          <div className="text-[14px] text-[#222222]">商品满意度</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const on = star <= rating;
              return (
                <button
                  key={star}
                  {...bindTap({ kind: 'action', id: 'reviewWrite.rating.select.target' }, {
                    params: { target: String(star) },
                    onTrigger: () => setRating(star),
                  })}
                  className="bg-transparent border-none cursor-pointer p-0"
                  aria-label={`${star}星`}
                >
                  <IcStar
                    size={30}
                    className={on ? 'fill-current' : ''}
                    style={{ color: on ? VIP.orange : '#DDDDDD' }}
                  />
                </button>
              );
            })}
          </div>
          <div className="text-[12px]" style={{ color: VIP.orange }}>{RATING_TEXT[rating]}</div>
        </div>

        {/* 标签 chips */}
        <div className="bg-white mt-2 px-3 py-3">
          <div className="text-[13px] text-[#222222] mb-2">大家都在说</div>
          <div className="flex flex-wrap gap-2">
            {REVIEW_TAGS.map((t) => {
              const on = tags.includes(t);
              return (
                <button
                  key={t}
                  {...bindTap({ kind: 'action', id: 'reviewWrite.rating.select.target' }, {
                    params: { target: t },
                    onTrigger: () => setTags((a) => (a.includes(t) ? a.filter((x) => x !== t) : [...a, t])),
                  })}
                  className="text-[12px] rounded-full px-3 py-1.5 border cursor-pointer"
                  style={on ? { color: VIP.primary, borderColor: VIP.primary, background: '#FDECF5' } : { color: '#666', borderColor: '#EEE', background: '#fff' }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        {/* 文本 + 图片占位 */}
        <div className="bg-white mt-2 px-3 py-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="宝贝满足你的期待吗?说说你的使用心得吧~"
            className="w-full h-24 text-[13px] text-[#222222] border-none outline-none resize-none placeholder:text-[#BBBBBB]"
          />
          <div className="flex gap-2 mt-2">
            <div className="w-16 h-16 rounded-lg border border-dashed border-[#DDDDDD] flex flex-col items-center justify-center text-[#BBBBBB]">
              <IcCamera size={18} />
              <span className="text-[10px] mt-0.5">添加图片</span>
            </div>
          </div>
        </div>
      </div>

      {/* 底部发布 */}
      <div data-hide-on-keyboard className="shrink-0 bg-white border-t border-[#EEEEEE] flex items-center justify-center px-3 h-14">
        <button
          {...bindTap({ kind: 'action', id: 'reviewWrite.publish.submit' }, {
            onTrigger: () => { submitReview(order.id); showToast('评价发布成功'); back(); },
          })}
          className="w-full h-10 rounded-full border-none cursor-pointer text-white text-[15px] font-semibold"
          style={{ background: VIP.ctaBlack }}
        >
          发布评价
        </button>
      </div>
      {toast}
    </div>
  );
}

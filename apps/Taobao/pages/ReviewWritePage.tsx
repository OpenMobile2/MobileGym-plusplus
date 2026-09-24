import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { TopBar, Img, useToast } from '../components/ui';
import { IcImagePlus } from '../res/icons';

const SUGGEST_TAGS = ['外观设计很可爱', '不卡智', '质量很好', '声音很好听', '物流快'];

/** 评价填写(spec: orders.reviewWrite,IMG_8745;判题:reviews 含该订单文本) */
export default function ReviewWritePage() {
  const { orderId = '' } = useParams();
  const { bindTap, back } = useTaobaoGestures();
  const [toast, showToast] = useToast();

  const order = useTaobaoStore((s) => s.orders.find((o) => o.id === orderId));
  const submitReview = useTaobaoStore((s) => s.submitReview);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar title="发布评价" />
        <div className="flex-1 flex items-center justify-center text-[#999999]">订单不存在</div>
      </div>
    );
  }

  const need = Math.max(0, 15 - content.length);

  return (
    <div className="flex flex-col h-full bg-white">
      <TopBar title="发布评价" />
      <div className="flex-1 overflow-y-auto px-4">
        {need > 0 && (
          <div className="text-[12px] text-[#666666] bg-[#FFF7EC] rounded-lg px-3 py-2 mt-2">
            还差{need}字+1图/视频,会帮助更多人哦
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <Img src={order.lines[0].image} className="w-10 h-10 rounded-lg" />
          <span className="text-[13px] line-clamp-1 flex-1">{order.lines[0].title}</span>
          <span className="text-[11px] text-[#999999] shrink-0">{order.lines[0].skuDesc}</span>
        </div>

        {/* 描述相符 + 猜你想说 */}
        <div className="text-[13px] font-semibold mt-4">描述相符</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {SUGGEST_TAGS.map((t) => (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'review.tag.append' }, {
                params: { tag: t },
                onTrigger: () => setContent((c) => (c.includes(t) ? c : c + (c ? ',' : '') + t)),
              })}
              className="text-[12px] bg-[#F5F5F5] text-[#333333] rounded-full px-3 py-1.5 border-none cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>

        {/* 问答卡(展示) */}
        <div className="flex items-center justify-between bg-[#FAFAFA] rounded-lg px-3 py-2 mt-3 text-[12px]">
          <span className="text-[#666666]">大家想知道:质量咋样?</span>
          <span className="flex gap-2">
            <span className="border border-[#DDDDDD] rounded-full px-2 py-0.5">很好</span>
            <span className="border border-[#DDDDDD] rounded-full px-2 py-0.5">不好</span>
          </span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="描述相符?3270人正在求买家秀,带图评价能帮助更多人哦~"
          className="w-full h-32 mt-3 text-[14px] border-none outline-none resize-none bg-transparent"
          data-keep-keyboard="true"
        />

        <button className="flex flex-col items-center justify-center w-20 h-20 bg-[#F8F8F8] rounded-lg border border-dashed border-[#DDDDDD] cursor-pointer"
          onClick={() => showToast('相册功能未接入(wontfix)')}>
          <IcImagePlus size={22} className="text-[#999999]" />
          <span className="text-[11px] text-[#999999] mt-1">图/视频</span>
        </button>
      </div>

      <div className="shrink-0 border-t border-[#F5F5F5] px-4 py-2">
        <div className="flex items-center justify-between mb-2 text-[12px] text-[#666666]">
          <button
            onClick={() => setIsPublic((v) => !v)}
            className="bg-transparent border-none cursor-pointer text-[12px] text-[#666666]"
          >
            {isPublic ? '◉' : '○'} 公开
          </button>
          <span>评价发布小贴士</span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'review.form.submit' }, {
            onTrigger: () => {
              if (!content.trim()) { showToast('写点什么再发布吧'); return; }
              submitReview(order.id, order.lines[0].itemId, content.trim());
              showToast('发布成功');
              window.setTimeout(() => back(), 500);
            },
          })}
          disabled={!content.trim()}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[15px] border-none cursor-pointer disabled:opacity-40"
        >
          发布
        </button>
      </div>
      {toast}
    </div>
  );
}

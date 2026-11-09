import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTaobaoStore } from '../state';
import { useTaobaoGestures } from '../hooks/useTaobaoGestures';
import { useStrings } from '../hooks/useStrings';
import type { TaobaoStringKey } from '../res/strings';
import { TopBar, Img, useToast } from '../components/ui';
import { fmt } from '../utils/format';
import { IcImagePlus } from '../res/icons';
import { pickImages } from '@/os/albumBridge';

const SUGGEST_TAG_KEYS: TaobaoStringKey[] = ['tagCute', 'tagSmooth', 'tagGoodQuality', 'tagGoodSound', 'tagFastLogistics'];

/** 评价填写(spec: orders.reviewWrite,IMG_8745;判题:reviews 含该订单文本) */
export default function ReviewWritePage() {
  const { orderId = '' } = useParams();
  const { bindTap, back } = useTaobaoGestures();
  const s = useStrings();
  const [toast, showToast] = useToast();

  const order = useTaobaoStore((st) => st.orders.find((o) => o.id === orderId));
  const submitReview = useTaobaoStore((st) => st.submitReview);
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [images, setImages] = useState<string[]>([]);

  if (!order) {
    return (
      <div className="flex flex-col h-full bg-app-surface">
        <TopBar title={s.publishReviewTitle} />
        <div className="flex-1 flex items-center justify-center text-app-text-muted">{s.orderNotFound}</div>
      </div>
    );
  }

  const need = Math.max(0, 15 - content.length);

  return (
    <div className="flex flex-col h-full bg-app-surface">
      <TopBar title={s.publishReviewTitle} />
      <div className="flex-1 overflow-y-auto px-4">
        {need > 0 && (
          <div className="text-[12px] text-app-text-muted bg-[#FFF7EC] rounded-lg px-3 py-2 mt-2">
            {fmt(s.needMoreCharsFmt, { count: need })}
          </div>
        )}
        <div className="flex items-center gap-2 mt-3">
          <Img src={order.lines[0].image} className="w-10 h-10 rounded-lg" />
          <span className="text-[13px] line-clamp-1 flex-1">{order.lines[0].title}</span>
          <span className="text-[11px] text-app-text-muted shrink-0">{order.lines[0].skuDesc}</span>
        </div>

        {/* 描述相符 + 猜你想说 */}
        <div className="text-[13px] font-semibold mt-4">{s.descMatchLabel}</div>
        <div className="flex flex-wrap gap-2 mt-2">
          {SUGGEST_TAG_KEYS.map((k) => {
            const t = s[k];
            return (
              <button
                key={k}
                {...bindTap({ kind: 'action', id: 'review.tag.append' }, {
                  params: { tag: t },
                  onTrigger: () => setContent((c) => (c.includes(t) ? c : c + (c ? ',' : '') + t)),
                })}
                className="text-[12px] bg-[#F5F5F5] text-app-text rounded-full px-3 py-1.5 border-none cursor-pointer"
              >
                {t}
              </button>
            );
          })}
        </div>

        {/* 问答卡(展示) */}
        <div className="flex items-center justify-between bg-[#FAFAFA] rounded-lg px-3 py-2 mt-3 text-[12px]">
          <span className="text-app-text-muted">{s.qnaSampleQuestion}</span>
          <span className="flex gap-2">
            <span className="border border-[#DDDDDD] rounded-full px-2 py-0.5">{s.answerGood}</span>
            <span className="border border-[#DDDDDD] rounded-full px-2 py-0.5">{s.answerBad}</span>
          </span>
        </div>

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={s.reviewPlaceholder}
          className="w-full h-32 mt-3 text-[14px] border-none outline-none resize-none bg-transparent"
          data-keep-keyboard="true"
        />

        <div className="flex flex-wrap gap-2 mt-2">
          {images.map((src) => (
            <Img key={src} src={src} className="w-20 h-20 rounded-lg object-cover" />
          ))}
          {images.length < 9 && (
            <button
              className="flex flex-col items-center justify-center w-20 h-20 bg-app-bg rounded-lg border border-dashed border-[#DDDDDD] cursor-pointer"
              {...bindTap({ kind: 'action', id: 'review.media.pick' }, {
                onTrigger: () => {
                  void pickImages({ multiple: true, maxSelect: 9 - images.length }).then((r) => {
                    if (r.cancelled || !r.selected.length) return;
                    setImages((prev) => [...prev, ...r.selected.map((x) => x.uri)].slice(0, 9));
                  });
                },
              })}
            >
              <IcImagePlus size={22} className="text-app-text-muted" />
              <span className="text-[11px] text-app-text-muted mt-1">{s.mediaUploadLabel}</span>
            </button>
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-[#F5F5F5] px-4 py-2">
        <div className="flex items-center justify-between mb-2 text-[12px] text-app-text-muted">
          <button
            onClick={() => setIsPublic((v) => !v)}
            className="bg-transparent border-none cursor-pointer text-[12px] text-app-text-muted"
          >
            {isPublic ? '◉' : '○'} {s.publicLabel}
          </button>
          <span>{s.reviewTipsLabel}</span>
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'review.form.submit' }, {
            onTrigger: () => {
              if (!content.trim()) { showToast(s.writeSomethingToast); return; }
              submitReview(order.id, order.lines[0].itemId, content.trim());
              showToast(s.publishSuccessToast);
              window.setTimeout(() => back(), 500);
            },
          })}
          disabled={!content.trim()}
          className="w-full h-11 rounded-full bg-gradient-to-r from-[#FF9402] to-[#FF5000] text-white text-[15px] border-none cursor-pointer disabled:opacity-40"
        >
          {s.publishLabel}
        </button>
      </div>
      {toast}
    </div>
  );
}

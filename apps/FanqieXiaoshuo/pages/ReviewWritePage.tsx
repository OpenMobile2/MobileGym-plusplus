import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings } from '../components/ui';
import { STAR_LABELS } from '../constants';
import { IcClose, IcStar } from '../res/icons';

/** 话题区(可选中,r8@44 帧证:选中变橙底) */
const TOPICS = ['# 求华妃和宜修一起重生屠龙的!', '# 想安利给全世界的一本书'] as const;

export default function ReviewWritePage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, bindBack } = useFanqieGestures();
  const s = useFanqieStrings();
  const [text, setText] = useState('');
  const [topic, setTopic] = useState<string | null>(null);

  const submitReview = useFanqieStore((st) => st.submitReview);

  const rawStars = Number(searchParams.get('stars') ?? '5');
  const stars = Number.isFinite(rawStars) ? Math.min(5, Math.max(1, Math.round(rawStars))) : 5;
  const canSubmit = text.trim().length >= 20 && topic !== null;

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-card)">
      {/* 顶栏:× + 居中标题 + 发表胶囊 */}
      <div className="relative flex items-center h-12 px-2 shrink-0">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer z-10" aria-label="close">
          <IcClose size={22} className="text-(--app-c-text-primary)" />
        </button>
        <div className="absolute inset-x-0 text-center text-[17px] font-bold text-(--app-c-text-primary) pointer-events-none">
          {s.writeReview}
        </div>
        <span className="flex-1" />
        <button
          {...(canSubmit ? bindTap('reviewwrite.submit-open', {
            params: { id },
            beforeTrigger: () => submitReview(id, stars, text, topic ?? undefined),
          }) : {})}
          disabled={!canSubmit}
          aria-label={canSubmit ? '发表书评' : '书评至少20字并选择话题'}
          className={`z-10 h-8 px-4 rounded-full text-white text-[13px] font-semibold border-none ${canSubmit ? 'bg-(--app-c-brand) cursor-pointer' : 'bg-(--app-c-text-disabled)'}`}
        >
          {s.publish}
        </button>
      </div>

      {/* 星区 */}
      <div className="shrink-0 flex items-center justify-center gap-3 mt-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            {...bindTap({ kind: 'action', id: 'reviewwrite.star.select.target' }, {
              params: { target: String(i) },
              onTrigger: () => setSearchParams((p) => { p.set('stars', String(i)); return p; }, { replace: true }),
            })}
            className="bg-transparent border-none p-0 cursor-pointer"
            aria-label={`${i}星`}
          >
            <IcStar size={34} className={i <= stars ? 'text-[#E8442E] fill-[#E8442E]' : 'text-(--app-c-text-disabled)'} />
          </button>
        ))}
      </div>
      <div className="shrink-0 text-center text-[14px] font-medium text-(--app-c-brand) mt-2">
        {STAR_LABELS[stars]}
      </div>

      {/* 多行文本框 */}
      <textarea
        {...(bindTap({ kind: 'action', id: 'reviewwrite.text.input' }, { onTrigger: () => {} }) as any)}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="真实客观、多维描述、结构清晰、内容充实的书评,可以帮助到更多书友"
        className="flex-1 w-full resize-none bg-transparent border-none outline-none px-4 mt-4 text-[15px] leading-6 text-(--app-c-text-primary) placeholder:text-(--app-c-text-disabled)"
      />

      {/* 话题区(可选中) */}
      <div className="shrink-0 px-4 pb-3" data-keep-keyboard="true">
        <div className="text-[13px] text-(--app-c-text-tertiary)">选话题分享给书友</div>
        <div className="flex gap-2 mt-2 overflow-hidden">
          {TOPICS.map((t) => {
            const on = topic === t;
            return (
              <button
                key={t}
                {...bindTap({ kind: 'action', id: 'reviewwrite.topic.toggle' }, {
                  params: { target: t },
                  onTrigger: () => setTopic((cur) => (cur === t ? null : t)),
                })}
                className={`text-[12px] rounded-lg px-2.5 py-1.5 whitespace-nowrap border-none cursor-pointer ${on ? 'bg-(--app-c-brand-soft) text-(--app-c-brand)' : 'bg-(--app-c-bg-fill) text-(--app-c-text-regular)'}`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

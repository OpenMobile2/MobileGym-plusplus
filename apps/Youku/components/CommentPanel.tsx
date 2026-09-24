import React, { useState } from 'react';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { selectComments, useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { fmtCount } from './feedShared';
import { fmtMdHm } from '../utils/appTime';
import Img from './Img';
import { IcHeart } from './feedIcons';

/**
 * 短视频/短剧 feed 评论半屏面板(spec shorts.feed uiState comments / shorts.dramaList comments)。
 * 打开由页面用 URL search(?comments=1)驱动;关闭一律 bindBack(AGENTS 弹层合同)。
 * 评论 key:短视频=shortId;短剧=`${dramaId}:${ep}`(与 seedComments 一致)。
 * 注:spec 未给该面板冻结 发布/点赞 actionId,发送按钮为无标注实现(报告已记)。
 */
export default function CommentPanel({
  open,
  contentKey,
  countBase,
}: {
  open: boolean;
  contentKey: string;
  countBase: number;
}) {
  const { bindBack, action } = useYoukuGestures();
  const { t } = useI18n();
  const comments = useYoukuStore((s) => selectComments(s, contentKey));
  const publishComment = useYoukuStore((s) => s.publishComment);
  const toggleCommentLike = useYoukuStore((s) => s.toggleCommentLike);
  const [draft, setDraft] = useState('');

  if (!open) return null;

  const [contentId, epStr] = contentKey.split(':');
  const episode = epStr ? Number(epStr) : undefined;
  const send = () => {
    const text = draft.trim();
    if (!text) return;
    publishComment(contentKey, text, { contentId, episode });
    setDraft('');
  };

  return (
    <div className="absolute inset-0 z-30 flex flex-col">
      {/* 面板外区域:关闭 = back */}
      <div {...bindBack<HTMLDivElement>()} className="flex-1" />
      <div className="flex h-[58%] shrink-0 flex-col rounded-t-2xl bg-(--app-c-card-bg)">
        <div className="relative flex h-12 shrink-0 items-center justify-center">
          <span className="text-[15px] font-bold text-(--app-c-text-primary)">
            {t('shorts.comments.title')} {fmtCount(countBase)}
          </span>
          <button
            {...bindBack<HTMLButtonElement>()}
            aria-label={t('common.back')}
            className="absolute right-3 cursor-pointer border-none bg-transparent text-[18px] text-(--app-c-text-muted)"
          >
            ✕
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2.5 py-3">
              <Img src={c.avatar} label={c.user} ratio="square" className="h-8 w-8 shrink-0 rounded-full object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] text-(--app-c-text-muted)">{c.user}</span>
                  {c.vip && (
                    <span className="rounded-sm bg-[#3A2E1C] px-1 text-[9px] leading-4 text-[#E8C87E]">VIP</span>
                  )}
                </div>
                <div className="mt-1 text-[14px] leading-5 text-(--app-c-text-primary)">{c.text}</div>
                <div className="mt-1 text-[11px] text-(--app-c-text-muted)">
                  {fmtMdHm(c.ts)} · {c.ip}
                </div>
                {c.replies.length > 0 && (
                  <div className="mt-1.5 rounded-lg bg-(--app-c-chip-bg) px-2 py-1.5">
                    {c.replies.map((r) => (
                      <div key={r.id} className="py-0.5 text-[12px] leading-4 text-(--app-c-text-secondary)">
                        <span className="text-(--app-c-text-muted)">{r.user}:</span>
                        {r.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                {...action('shorts.comments.like.toggle', () => toggleCommentLike(contentKey, c.id), {
                  params: { commentId: c.id },
                })}
                className={`flex shrink-0 cursor-pointer flex-col items-center gap-0.5 border-none bg-transparent p-0 pt-0.5 ${
                  c.likedByMe ? 'text-[#F5265C]' : 'text-(--app-c-text-muted)'
                }`}
              >
                <IcHeart size={14} className={c.likedByMe ? 'fill-[#F5265C] text-[#F5265C]' : ''} />
                <span className="text-[10px]">{fmtCount(c.likes)}</span>
              </button>
            </div>
          ))}
          <div className="h-4" />
        </div>
        <div data-keep-keyboard="true" className="flex shrink-0 items-center gap-2 border-t border-(--app-c-border) px-3 py-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t('shorts.comments.placeholder')}
            className="h-9 min-w-0 flex-1 rounded-full border-none bg-(--app-c-chip-bg) px-3.5 text-[13px] text-(--app-c-text-primary) outline-none placeholder:text-(--app-c-text-muted)"
          />
          <button
            onClick={send}
            className={`shrink-0 cursor-pointer rounded-full border-none px-4 py-1.5 text-[13px] ${
              draft.trim() ? 'bg-[#0C7BFF] text-white' : 'bg-(--app-c-chip-bg) text-(--app-c-text-muted)'
            }`}
          >
            {t('shorts.comments.send')}
          </button>
        </div>
      </div>
    </div>
  );
}

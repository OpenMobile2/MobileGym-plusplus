import React, { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import * as TimeService from '../../../os/TimeService';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';

const KINDS = ['system', 'activity', 'likes', 'comment', 'fans'] as const;
type MsgKind = (typeof KINDS)[number];
function fmtTime(ts: number): string {
  const d = TimeService.fromTimestamp(ts);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}月${d.getDate()}日 ${p(d.getHours())}:${p(d.getMinutes())}`;
}
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcHeart } from '../res/icons';
import { DpAvatar } from '../components/DpAvatar';
import { reviewCommentsFor } from '../utils/reviewComments';

const LIKES = [
  { u: 'crescentwu', act: '赞了你的评价', obj: '“蔬菜水果都特别新鲜”', d: '7月26日' },
  { u: '小小', act: '觉得你的评价有帮助', obj: '“一家五口来吃的…”', d: '7月23日' },
  { u: '甜品控Mia', act: '收藏了你的笔记', obj: '“手绘蛋糕也太精致了”', d: '7月20日' },
];
const FANS = [
  { u: '爱吃喝玩乐的', d: '关注了你 · 7月25日' },
  { u: '考研搭子', d: '关注了你 · 7月19日' },
];

export default function MsgInteractPage() {
  const { kind = 'likes' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action } = useDianpingGestures();
  const showToast = useDianpingStore((st) => st.showToast);
  const systemMessages = useDianpingStore((st) => st.systemMessages);
  const userReviews = useDianpingStore((st) => st.userReviews);
  const markMsgRead = useDianpingStore((st) => st.markMsgRead);

  useEffect(() => {
    if ((KINDS as readonly string[]).includes(kind)) markMsgRead(kind as MsgKind);
  }, [kind, markMsgRead]);

  // 「评论/@」= 别人对我(已收录的)评价的所有评论,与评价详情里的评论一致
  const commentItems = useMemo(
    () =>
      userReviews
        .filter((r) => r.id.startsWith('ur_seed_'))
        .flatMap((r) =>
          reviewCommentsFor({
            reviewId: r.id,
            hasPhoto: (r.photos?.length ?? 0) > 0,
            shopShort: r.shopName.split('(')[0],
            reply: r.reply,
          }).map((c) => ({ ...c, review: r })),
        ),
    [userReviews],
  );

  const title =
    kind === 'comment'
      ? s.msgComment
      : kind === 'fans'
        ? s.msgFollower
        : kind === 'system'
          ? '系统消息'
          : s.msgInteract;

  return (
    <div className="flex h-full flex-col bg-[#F5F5F5]" data-status-bar-foreground="dark">
      <div className="relative flex h-11 items-center justify-center bg-white px-1">
        <button type="button" className="absolute left-1 border-none bg-transparent p-1.5 cursor-pointer" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-[16px] font-semibold text-[#222]">{title}</div>
        {kind === 'comment' ? (
          <button
            type="button"
            className="absolute right-3 border-none bg-transparent text-[14px] text-[#333] cursor-pointer"
            {...action('msg.item.open.disabled', () => showToast(s.notOpen))}
          >
            {s.commentAchieve}
          </button>
        ) : null}
      </div>

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="msg-interact"
        data-scroll-direction="vertical"
      >
        {kind === 'system' ? (
          <div className="bg-white">
            {systemMessages.length === 0 ? (
              <div className="py-16 text-center text-[13px] text-[#999]">暂无系统消息</div>
            ) : (
              [...systemMessages]
                .sort((a, b) => b.ts - a.ts)
                .map((m) => (
                  <div key={m.id} className="border-b border-[#F0F0F0] px-4 py-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-[#222]">{m.title}</span>
                      <span className="text-[11px] text-[#BBB]">{fmtTime(m.ts)}</span>
                    </div>
                    <div className="mt-1 text-[13px] leading-6 text-[#666]">{m.body}</div>
                  </div>
                ))
            )}
          </div>
        ) : kind === 'comment' ? (
          commentItems.length === 0 ? (
            <div className="py-16 text-center text-[13px] text-[#999]">暂无评论互动</div>
          ) : (
            <div className="bg-white">
              {commentItems.map((it, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex w-full gap-3 border-none border-b border-[#F0F0F0] bg-transparent px-3 py-3.5 text-left cursor-pointer"
                  {...bindTap('shop.review-open', { params: { shopId: it.review.shopId, reviewId: it.review.id } })}
                >
                  {it.merchant ? (
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FF6633] text-[15px] text-white">
                      商
                    </span>
                  ) : (
                    <DpAvatar seed={it.name} size={44} className="shrink-0 rounded-full" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className={`text-[14px] font-medium ${it.merchant ? 'text-[#2B6CB0]' : 'text-[#222]'}`}>
                      {it.name}
                    </div>
                    <div className="mt-0.5 truncate text-[12px] text-[#999]">
                      评论了你的评价“{it.review.body.slice(0, 12)}…”
                    </div>
                    <div className="mt-1.5 text-[14px] leading-6 text-[#333]">{it.body}</div>
                  </div>
                </button>
              ))}
            </div>
          )
        ) : kind === 'fans' ? (
          <div className="bg-white">
            {FANS.map((f, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[#F5F5F5] px-3 py-3">
                <DpAvatar seed={f.u} size={40} className="shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-[#222]">{f.u}</div>
                  <div className="text-[11px] text-[#999]">{f.d}</div>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full border border-[#FF6633] bg-white px-3 py-1 text-[12px] text-[#FF6633] cursor-pointer"
                  {...action('msg.item.open.disabled', () => showToast(s.notOpen))}
                >
                  回关
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white">
            {LIKES.map((l, i) => (
              <div key={i} className="flex items-center gap-3 border-b border-[#F5F5F5] px-3 py-3">
                <DpAvatar seed={l.u} size={40} className="shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] text-[#222]">
                    <span className="font-medium">{l.u}</span>
                    <span className="text-[#999]"> {l.act}</span>
                  </div>
                  <div className="mt-0.5 truncate text-[12px] text-[#999]">{l.obj}</div>
                  <div className="mt-0.5 text-[11px] text-[#BBB]">{l.d}</div>
                </div>
                <span className="h-3 w-3 shrink-0 text-[#FF8A00]">
                  <IcHeart size={13} className="text-[#FFB24D]" />
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useAppStrings } from '@/os/useAppStrings';
import { useDianpingGestures } from '../hooks/useDianpingGestures';
import { useDianpingStore } from '../state';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcBack, IcShare, IcMore, IcStar, IcStarOutline, IcHeart, IcComment, IcPear } from '../res/icons';
import { DpAvatar } from '../components/DpAvatar';
import { shopCoverUrl, dishImageUrl } from '../assets';
import { reviewCommentsFor } from '../utils/reviewComments';
import { sharePlainText } from '@/os/shareBridge';

export default function ReviewDetailPage() {
  const { shopId = '', reviewId = '' } = useParams();
  const s = useAppStrings(strings, stringsEn);
  const { bindBack, bindTap, action, back } = useDianpingGestures();
  const [sp] = useSearchParams();
  const replyOpen = sp.get('reply') === 'open';
  const shop = useDianpingStore((st) => st.shops.find((x) => x.id === shopId));
  const userReviews = useDianpingStore((st) => st.userReviews);
  const userProfile = useDianpingStore((st) => st.userProfile);
  const showToast = useDianpingStore((st) => st.showToast);
  const [helpful, setHelpful] = useState(false);
  const [faved, setFaved] = useState(false);
  const [myReplies, setMyReplies] = useState<string[]>([]);
  const [replyText, setReplyText] = useState('');

  const raw = shop?.reviews.find((r) => r.id === reviewId);
  const ur = userReviews.find((r) => r.id === reviewId);

  if (!shop || (!raw && !ur)) {
    return (
      <div className="flex h-full flex-col bg-white pt-10">
        <button type="button" className="cursor-pointer border-none bg-transparent p-3" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="text-center text-[13px] text-[#999]">评价不存在</div>
      </div>
    );
  }

  const fmtDate = (ts: number) => {
    const d = TimeService.fromTimestamp(ts);
    return `发布于${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const userName = raw?.userName ?? userProfile.nickname;
  const isMine = Boolean(ur || raw?.fromUser);
  const score = raw?.score ?? ur?.score ?? 5;
  const body = raw?.body ?? ur?.body ?? '';
  const taste = raw?.taste ?? ur?.taste ?? score;
  const env = raw?.env ?? ur?.env ?? score;
  const service = raw?.service ?? ur?.service ?? score;
  const dishNames = raw?.dishNames ?? ur?.dishNames ?? [];
  const dateText = ur ? fmtDate(ur.createdAt) : `发布于 ${raw?.dateLabel ?? ''}`;
  const photos = raw?.photos ?? ur?.photos ?? [];
  const dishPhotos = shop.dishes.map((d) => dishImageUrl(shop.id, d.id)).filter((u): u is string => Boolean(u));
  const showPhotos = photos.length > 0 ? photos : raw?.hasPhoto ? dishPhotos.slice(0, 6) : [];
  const lv = 1 + ((body.length + userName.length) % 8);
  const isFreshUserReview = isMine && !reviewId.startsWith('ur_seed_');
  const browseCount = isFreshUserReview ? 0 : 12 + (body.length % 40);
  const helpfulCount = (helpful ? 1 : 0) + (isFreshUserReview ? 0 : 1 + (body.length % 5));

  // 人均:优先用写评价页录入的人均(联动),否则确定性给部分评价一个派生人均
  const avgText =
    raw?.avgPriceText ??
    ur?.avgPriceText ??
    (Math.abs([...reviewId].reduce((a, c) => (a * 17 + c.charCodeAt(0)) | 0, 3)) % 3 === 0
      ? `¥${shop.avgPrice + ((body.length % 21) - 10)}/人`
      : undefined);

  // 自己「刚发表」的评价(运行时新增,id 非 ur_seed_)不出现回复/评论;种子评价仍可有商家回复
  const ownReview = isFreshUserReview;
  const explicitReply = raw?.reply ?? ur?.reply;
  const comments: { name: string; body: string; merchant: boolean; mine?: boolean }[] = ownReview
    ? []
    : reviewCommentsFor({
        reviewId,
        hasPhoto: showPhotos.length > 0,
        shopShort: shop.name.split('(')[0],
        reply: explicitReply,
      });
  // 我发出的回复(用本人头像 IcPear,与我的/主页一致)
  myReplies.forEach((body) => comments.push({ name: userProfile.nickname, body, merchant: false, mine: true }));
  const totalComments = comments.length;

  const sendReply = () => {
    const t = replyText.trim();
    if (!t) return;
    setMyReplies((p) => [...p, t]);
    setReplyText('');
    back();
  };

  const Metric = ({ label, value }: { label: string; value: number }) => (
    <span className="text-[13px] text-[#333]">
      {label}:<span className="font-medium">{value.toFixed(1)}</span>
    </span>
  );

  return (
    <div className="relative flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      {/* 顶栏 */}
      <div className="flex h-11 items-center px-1">
        <button type="button" className="cursor-pointer border-none bg-transparent p-2" {...bindBack()}>
          <IcBack size={22} />
        </button>
        <div className="ml-auto flex items-center gap-1 pr-1">
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-2 text-[#333]"
            {...action('review.share.open', () => {
              const text = `【大众点评】${userName}对${shop.name}的评价：${body} https://dianping.mock/review/${shop.id}/${reviewId}`;
              const launched = sharePlainText(text, {
                onResult: (result) => {
                  if (result.resultCode === 'OK') showToast('分享成功');
                },
              });
              if (!launched) showToast(s.notOpen);
            })}
          >
            <IcShare size={19} />
          </button>
          <button
            type="button"
            className="cursor-pointer border-none bg-transparent p-2 text-[#333]"
            {...action('review.comment.open.disabled', () => showToast(s.notOpen))}
          >
            <IcMore size={19} />
          </button>
        </div>
      </div>

      <div
        className="flex-1 overflow-y-auto px-4 pb-20"
        data-scroll-container="review-detail"
        data-scroll-direction="vertical"
      >
        {/* 用户 */}
        <div className="flex items-center gap-2.5">
          {isMine ? (
            <IcPear size={44} className="shrink-0 rounded-full" />
          ) : (
            <DpAvatar seed={userName} size={44} className="shrink-0 rounded-full" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[16px] font-semibold text-[#222]">{userName}</span>
              <span className="rounded bg-[#FFF3C4] px-1 text-[10px] text-[#B45309]">Lv{lv}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-[#999]">{dateText}</div>
          </div>
          {!isMine ? (
            <button
              type="button"
              className="shrink-0 cursor-pointer rounded-full border border-[#FF6633] bg-white px-4 py-1 text-[13px] font-medium text-[#FF6633]"
              {...action('review.comment.open.disabled', () => showToast(s.notOpen))}
            >
              关注
            </button>
          ) : null}
        </div>

        {/* 评分 */}
        <div className="mt-3 flex items-center gap-2">
          <span className="rounded bg-[#FFF1EA] px-1.5 py-0.5 text-[12px] font-medium text-[#FF6633]">
            🎉 超预期
          </span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((n) => (
              <IcStar key={n} size={16} className={n <= Math.round(score) ? 'text-[#FF6633]' : 'text-[#E0E0E0]'} />
            ))}
          </div>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <Metric label="口味" value={taste} />
          <Metric label="环境" value={env} />
          <Metric label="服务" value={service} />
          {avgText ? <span className="text-[13px] font-medium text-[#333]">{avgText}</span> : null}
        </div>

        {/* 正文 */}
        <div className="mt-3 text-[15px] leading-7 text-[#222]">{body}</div>

        {/* 推荐 */}
        {dishNames.length > 0 ? (
          <div className="mt-3 text-[13px] text-[#999]">推荐：{dishNames.join('、')}</div>
        ) : null}

        {/* 配图 */}
        {showPhotos.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {showPhotos.slice(0, 9).map((url, i) => (
              <div
                key={i}
                className="aspect-square overflow-hidden rounded-[6px]"
                style={{ background: shop.coverColor }}
              >
                {url ? <img src={url} alt="" className="h-full w-full object-cover" /> : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* 关联店铺卡 */}
        <button
          type="button"
          className="mt-4 flex w-full cursor-pointer items-center gap-2 rounded-[10px] border-none bg-[#F7F7F7] p-2.5 text-left"
          {...bindTap('food.shop-open', { params: { shopId: shop.id } })}
        >
          <div className="h-[46px] w-[46px] shrink-0 overflow-hidden rounded-[6px]" style={{ background: shop.coverColor }}>
            {shopCoverUrl(shop.id) ? <img src={shopCoverUrl(shop.id)} alt="" className="h-full w-full object-cover" /> : null}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium text-[#222]">{shop.name}</div>
            <div className="mt-0.5 text-[11px] text-[#FF6633]">{shop.score} 星 · ¥{shop.avgPrice}/人</div>
          </div>
          <IcStarOutline size={18} className="shrink-0 text-[#999]" />
        </button>

        <div className="mt-3 text-[12px] text-[#999]">浏览 {browseCount}</div>
        <div className="mt-2 flex items-center gap-1.5 border-b border-[#F0F0F0] pb-3 text-[12px] text-[#999]">
          <DpAvatar seed={shop.id} size={18} className="rounded-full" />
          {helpfulCount} 人认为有帮助
        </div>

        {/* 评论 */}
        <div className="mt-3 text-[15px] font-semibold text-[#222]">
          {totalComments > 0 ? `${totalComments} 条评论` : '暂无评论'}
        </div>
        {totalComments === 0 ? (
          <div className="mt-2 text-[13px] text-[#BBB]">来抢沙发，友善评论说点好听的~</div>
        ) : (
          comments.map((c, ci) => (
            <div key={ci} className="mt-3 flex gap-2">
              {c.merchant ? (
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FF6633] text-[13px] text-white">
                  商
                </span>
              ) : c.mine ? (
                <IcPear size={32} className="shrink-0 rounded-full" />
              ) : (
                <DpAvatar seed={c.name} size={32} className="shrink-0 rounded-full" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] text-[#999]">{c.name}</div>
                <div className="mt-1 text-[13px] leading-6 text-[#333]">{c.body}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底栏 */}
      <div className="flex h-14 items-center gap-2 border-t border-[#EEE] bg-white px-3">
        <button
          type="button"
          className="flex h-9 flex-1 items-center rounded-full border-none bg-[#F5F5F5] px-4 text-left text-[13px] text-[#999] cursor-pointer"
          {...bindTap('review.reply-open', { params: { shopId, reviewId } })}
        >
          说点什么吧~
        </button>
        <button
          type="button"
          className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 text-[10px] text-[#666]"
          {...action('review.helpful.toggle', () => setHelpful((v) => !v))}
        >
          <IcHeart size={20} className={helpful ? 'text-[#FF6633]' : 'text-[#666]'} />
          <span className={helpful ? 'text-[#FF6633]' : ''}>有帮助{helpfulCount}</span>
        </button>
        <button
          type="button"
          className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 text-[10px] text-[#666]"
          {...action('review.fav.toggle', () => setFaved((v) => !v))}
        >
          {faved ? <IcStar size={20} className="text-[#FF6633]" /> : <IcStarOutline size={20} />}
          <span className={faved ? 'text-[#FF6633]' : ''}>收藏</span>
        </button>
        <button
          type="button"
          className="flex cursor-pointer flex-col items-center border-none bg-transparent px-1 text-[10px] text-[#666]"
          {...bindTap('review.reply-open', { params: { shopId, reviewId } })}
        >
          <IcComment size={20} />
          评论{totalComments > 0 ? totalComments : ''}
        </button>
      </div>

      {/* 回复输入弹层 */}
      {replyOpen ? (
        <div className="absolute inset-0 z-30 flex flex-col justify-end">
          <button
            type="button"
            aria-label="close"
            className="absolute inset-0 border-none bg-black/40 cursor-pointer"
            {...bindBack()}
          />
          <div className="relative z-10 bg-white p-3" data-keep-keyboard="true">
            <textarea
              autoFocus
              className="h-20 w-full resize-none rounded-[10px] bg-[#F5F5F5] p-3 text-[14px] outline-none"
              placeholder="友善评论，说点儿好听的~"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                className="cursor-pointer rounded-full border-none bg-[#FF6633] px-6 py-2 text-[14px] font-semibold text-white disabled:opacity-40"
                disabled={!replyText.trim()}
                {...action('review.reply.send.action', sendReply)}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

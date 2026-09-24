import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { payWithSystem, pickImagesFromAlbum } from '../capabilities';
import { C, Avatar, Stars, MetaLine, RATING_LABELS, fmtAbsDateTime } from '../components/ui';
import {
  DetailTabStrip,
  DetailTabContent,
  DetailBottomBar,
  type DetailTab,
  type ReplySort,
} from '../components/DetailFive';
import { GiftSheet, GIFTS } from '../components/GiftSheet';
import { CollectSheet } from '../components/CollectSheet';
import { ReplyEditor } from '../components/ReplyEditor';
import { Sheet } from '../components/Sheet';

// 节点: review.detail —— 影评/书评/乐评详情(5子tab详情模板 review 实例 + 有用/没用互斥气泡)。
// evidence: frame:f60ef9@t0085/t0087/t0088/t0090
const SEED_IMG = '/@app-assets/Douban/images/bc_photo1.png';

export default function ReviewDetailPage() {
  const { bindBack, bindTap, back } = useDoubanGestures();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const reviews = useDoubanStore((s) => s.reviews);
  const subjects = useDoubanStore((s) => s.subjects);
  const users = useDoubanStore((s) => s.users);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const replies = useDoubanStore((s) => s.replies);
  const likes = useDoubanStore((s) => s.likes);
  const reposts = useDoubanStore((s) => s.reposts);
  const collects = useDoubanStore((s) => s.collects);
  const gifts = useDoubanStore((s) => s.gifts);
  const doulists = useDoubanStore((s) => s.doulists);
  const follows = useDoubanStore((s) => s.follows);
  const replyDraft = useDoubanStore((s) => s.replyDraft);

  const toggleLike = useDoubanStore((s) => s.toggleLike);
  const repostTarget = useDoubanStore((s) => s.repostTarget);
  const collectTarget = useDoubanStore((s) => s.collectTarget);
  const uncollectTarget = useDoubanStore((s) => s.uncollectTarget);
  const addReply = useDoubanStore((s) => s.addReply);
  const setReplyDraft = useDoubanStore((s) => s.setReplyDraft);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);
  const createDoulist = useDoubanStore((s) => s.createDoulist);
  const sendGift = useDoubanStore((s) => s.sendGift);

  const targetType = 'review' as const;
  const rId = routeParams.reviewId ?? reviews[0]?.id ?? 'rv1';
  const review = useMemo(() => reviews.find((r) => r.id === rId) ?? reviews[0], [reviews, rId]);
  const targetId = review?.id ?? rId;

  const me = currentUser.id;
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const userOf = (id: string) => userById.get(id);
  const author = userOf(review?.authorId ?? '');
  const subject = useMemo(() => subjects.find((s) => s.id === review?.subjectId), [subjects, review?.subjectId]);
  const nowTs = TimeService.now();

  const tab = (searchParams.get('tab') as DetailTab) || 'reply';
  const sort = (searchParams.get('sort') as ReplySort) || 'default';
  const sheet = searchParams.get('sheet');
  const editor = searchParams.get('editor');
  const giftTab = (searchParams.get('giftTab') as 'bag' | 'store') || 'store';
  const giftId = searchParams.get('giftId') || 'cake';
  const emojiOpen = searchParams.get('emoji') === 'open';
  const syncToFeed = searchParams.get('sync') !== 'off';
  const quoteReplyId = searchParams.get('quote');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [repostText, setRepostText] = useState('');
  // 有用/没用互斥气泡(易失态)
  const reviewVotes = useDoubanStore((s) => s.reviewVotes);
  const voteReview = useDoubanStore((s) => s.voteReview);
  const usefulVote = reviewVotes[targetId] ?? null;

  const setP = (mut: (p: URLSearchParams) => void, replace = false) =>
    setSearchParams((p) => { mut(p); return p; }, replace ? { replace: true } : undefined);

  const targetReplies = useMemo(() => {
    const list = replies.filter((r) => r.targetType === targetType && r.targetId === targetId);
    const top = list.filter((r) => !r.quoteReplyId);
    const sorted =
      sort === 'author'
        ? top.filter((r) => r.authorId === review?.authorId || r.deleted)
        : sort === 'latest'
          ? [...top].sort((a, b) => b.createdAt - a.createdAt)
          : [...top].sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) || b.likeCount - a.likeCount);
    return [...sorted, ...list.filter((r) => r.quoteReplyId)];
  }, [replies, targetId, sort, review?.authorId]);
  const replyById = (id: string) => replies.find((r) => r.id === id);

  const targetLikes = useMemo(() => likes.filter((l) => l.targetType === targetType && l.targetId === targetId), [likes, targetId]);
  const targetReposts = useMemo(() => reposts.filter((r) => r.targetType === targetType && r.targetId === targetId), [reposts, targetId]);
  const targetCollects = useMemo(() => collects.filter((c) => c.targetType === targetType && c.targetId === targetId), [collects, targetId]);
  const targetGifts = useMemo(() => gifts.filter((g) => g.targetType === targetType && g.targetId === targetId), [gifts, targetId]);
  const myDoulists = useMemo(() => doulists.filter((d) => d.ownerId === me), [doulists, me]);
  const checkedDoulistIds = useMemo(() => targetCollects.filter((c) => c.userId === me).map((c) => c.doulistId), [targetCollects, me]);

  const likedByMe = useMemo(() => targetLikes.some((l) => l.userId === me), [targetLikes, me]);
  const collectedByMe = checkedDoulistIds.length > 0;
  const followed = author ? follows.users.includes(author.id) : false;
  const doulistTitleOf = (id: string) => doulists.find((d) => d.id === id)?.title ?? '豆列';
  const quoteText = quoteReplyId
    ? (() => { const q = replyById(quoteReplyId); return q ? `${userOf(q.authorId)?.name ?? '豆友'}:${q.text}` : undefined; })()
    : undefined;

  const counts = {
    reply: review?.replyCount ?? 0,
    like: review?.likeCount ?? 0,
    repost: review?.repostCount ?? 0,
    collect: review?.collectCount ?? 0,
  };
  const usefulCount = review?.useful ?? 0;
  const uselessCount = review?.useless ?? 0;

  // 条目绿链/挂片 → review.detail.subject-open(字面量绑定;唯一条目落点)
  const subjectBind = () => bindTap('review.detail.subject-open', { params: { itemId: subject?.id ?? 'm1' } });

  if (!review) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>评论不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 bg-white" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1" />
        <div className="w-10 h-10 flex items-center justify-center relative" style={{ color: C.text }}>
          <span className="text-xl leading-none">⋯</span>
          <span className="absolute top-2 right-1.5 w-2 h-2 rounded-full" style={{ background: C.danger }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 长文态:作者块 → 状态行 → 大标题 → 正文 */}
        <div className="bg-white px-4 pt-1 pb-4">
          {/* 作者块 */}
          <div className="flex items-center gap-2.5">
            <button {...bindTap('review.detail.author-open', { params: { userId: author?.id ?? 'u2' } })} className="flex items-center gap-2.5 min-w-0 flex-1 bg-transparent border-none cursor-pointer p-0 text-left">
              <Avatar src={author?.avatar ?? ''} size={40} />
              <div className="min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{author?.name ?? '豆友'}</div>
                <div className="mt-0.5">
                  <MetaLine absolute time={`${fmtAbsDateTime(review.createdAt)} 已编辑`} ip={author?.ipLocation} />
                </div>
              </div>
            </button>
            {author?.id !== me && (
              <button
                {...bindTap({ kind: 'action', id: 'review.detail.follow.toggle' }, { onTrigger: () => {
                  if (!author) return;
                  if (followed) { unfollowUser(author.id); toast('已取消关注'); }
                  else { followUser(author.id); toast('关注成功'); }
                } })}
                className="px-2.5 h-6 rounded text-xs border-none cursor-pointer shrink-0"
                style={followed ? { background: '#F2F3F5', color: C.sub } : { background: C.greenSoft, color: C.green }}
              >
                {followed ? '已关注' : '+ 关注'}
              </button>
            )}
          </div>

          {/* 状态行:看过|很差 ★☆☆☆☆(状态词随条目类型) */}
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-xs" style={{ color: C.sub }}>
              {subject?.type === 'book' ? '读过' : subject?.type === 'music' || subject?.type === 'podcast' ? '听过' : '看过'}
            </span>
            <span className="text-xs" style={{ color: '#D8DCE1' }}>|</span>
            <span className="text-xs" style={{ color: C.orange }}>{RATING_LABELS[Math.max(0, Math.min(5, Math.round(review.rating)))]}</span>
            <Stars value={review.rating} scale="star" size={11} color={C.orange} />
          </div>

          <div className="mt-3 text-[20px] font-bold leading-snug" style={{ color: C.text }}>{review.title}</div>
          <div className="mt-3 text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: C.text }}>
            {review.text}
            {subject && (
              <span {...subjectBind()} className="cursor-pointer" style={{ color: C.link }}>
                {' '}《{subject.title}》
              </span>
            )}
          </div>

          {/* 文末条目挂片:小型灰 pill「▣《…》」 */}
          {subject && (
            <button
              {...subjectBind()}
              className="mt-4 inline-flex items-center gap-1 rounded px-2 py-1 border-none cursor-pointer"
              style={{ background: '#F2F3F5' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" className="shrink-0">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <rect x="8" y="8" width="8" height="8" fill={C.sub} stroke="none" />
              </svg>
              <span className="text-xs truncate" style={{ color: C.text }}>《{subject.title}》</span>
            </button>
          )}

          {/* 有用/没用 互斥气泡 */}
          <div className="mt-5 flex items-center justify-center gap-4">
            <button
              {...bindTap({ kind: 'action', id: 'review.detail.useful.select.useful' }, { onTrigger: () => voteReview(targetId, 'useful') })}
              className="px-5 h-9 rounded-full text-sm cursor-pointer flex items-center gap-1.5"
              style={{ background: usefulVote === 'useful' ? C.greenSoft : '#F2F3F5', color: usefulVote === 'useful' ? C.green : C.sub, border: 'none' }}
            >
              👍 有用 {usefulCount}
            </button>
            <button
              {...bindTap({ kind: 'action', id: 'review.detail.useful.select.useless' }, { onTrigger: () => voteReview(targetId, 'useless') })}
              className="px-5 h-9 rounded-full text-sm cursor-pointer flex items-center gap-1.5"
              style={{ background: usefulVote === 'useless' ? '#FDECEC' : '#F2F3F5', color: usefulVote === 'useless' ? C.danger : C.sub, border: 'none' }}
            >
              👎 没用 {uselessCount}
            </button>
          </div>
        </div>

        <div className="mt-2">
          <DetailTabStrip
            counts={counts}
            activeTab={tab}
            likeLabel="有用"
            bindTab={(t) => bindTap({ kind: 'action', id: 'review.detail.subTab.select.target' }, { params: { target: t }, onTrigger: () => setP((p) => p.set('tab', t), true) })}
          />
        </div>

        <DetailTabContent
          counts={counts}
          activeTab={tab}
          bindTab={() => ({})}
          replies={targetReplies}
          sort={sort}
          bindSort={(s) => bindTap({ kind: 'action', id: 'review.detail.subTab.select.target' }, { params: { target: s }, onTrigger: () => setP((p) => p.set('sort', s), true) })}
          userOf={userOf}
          authorId={review.authorId}
          replyById={replyById}
          bindReplyRow={(r) => bindTap({ kind: 'action', id: 'review.detail.floorReply.open' }, { onTrigger: () => setP((p) => { p.set('editor', 'reply'); p.set('quote', r.id); }) })}
          expandedThreadId={searchParams.get('thread')}
          bindThreadExpand={(r) => bindTap({ kind: 'action', id: 'review.detail.floorReply.open' }, { onTrigger: () => setP((p) => { if (p.get('thread') === r.id) p.delete('thread'); else p.set('thread', r.id); }, true) })}
          likes={targetLikes}
          reposts={targetReposts}
          collects={targetCollects}
          gifts={targetGifts}
          doulistTitleOf={doulistTitleOf}
          bindUserOpen={(userId) => bindTap('review.detail.author-open', { params: { userId } })}
          bindGiftOpen={bindTap({ kind: 'action', id: 'review.detail.gift.send' }, { onTrigger: () => setP((p) => { p.set('sheet', 'gift'); p.set('giftTab', 'store'); }) })}
          likedByMe={likedByMe}
          collectedByMe={collectedByMe}
          bindReplyBar={{}}
          bindLike={{}}
          bindRepost={{}}
          bindCollect={{}}
          currentUserId={me}
          now={nowTs}
        />
      </div>

      <DetailBottomBar
        mode={tab === 'reply' ? 'reply' : 'article'}
        counts={counts}
        likedByMe={likedByMe}
        collectedByMe={collectedByMe}
        bindReplyBar={bindTap({ kind: 'action', id: 'review.detail.replyEditor.open' }, { onTrigger: () => setP((p) => { p.set('editor', 'reply'); p.delete('quote'); }) })}
        bindLike={bindTap({ kind: 'action', id: 'review.detail.like.toggle' }, { onTrigger: () => toggleLike(targetType, targetId) })}
        bindRepost={bindTap({ kind: 'action', id: 'review.detail.repostEditor.open' }, { onTrigger: () => { setRepostText(''); setP((p) => p.set('sheet', 'repost')); } })}
        bindCollect={bindTap({ kind: 'action', id: 'review.detail.collectSheet.open' }, { onTrigger: () => setP((p) => p.set('sheet', 'collect')) })}
        bindGiftOpen={bindTap({ kind: 'action', id: 'review.detail.gift.send' }, { onTrigger: () => setP((p) => { p.set('sheet', 'gift'); p.set('giftTab', 'store'); }) })}
      />

      {sheet === 'gift' && (
        <GiftSheet
          tab={giftTab}
          activeGiftId={giftId}
          bindTabSelect={(t) => bindTap({ kind: 'action', id: 'review.detail.gift.send' }, { onTrigger: () => setP((p) => p.set('giftTab', t), true) })}
          bindGiftSelect={(gid) => bindTap({ kind: 'action', id: 'review.detail.gift.send' }, { onTrigger: () => setP((p) => p.set('giftId', gid), true) })}
          bindPurchase={bindTap({ kind: 'action', id: 'review.detail.gift.send' }, { onTrigger: () => {
            const gift = GIFTS.find((item) => item.id === giftId) ?? GIFTS[0];
            const launched = payWithSystem(
              { amount: gift.beans, orderId: `gift-${gift.id}`, subject: `购买并送出${gift.name}` },
              (result) => { if (result.resultCode === 'OK') { sendGift(targetType, targetId, gift.id); toast('礼物已送出'); } },
            );
            if (!launched) toast('无法打开系统支付');
          } })}
          closeProps={bindBack()}
        />
      )}

      {sheet === 'collect' && (
        <CollectSheet
          doulists={myDoulists}
          checkedIds={checkedDoulistIds}
          bindCreate={bindTap({ kind: 'action', id: 'review.detail.doulist.create' }, {
            onTrigger: () => { createDoulist('新建豆列', '', false); toast('已创建豆列'); },
          })}
          bindToggle={(did) => bindTap({ kind: 'action', id: 'review.detail.collectSheet.open' }, {
            onTrigger: () => {
              if (checkedDoulistIds.includes(did)) uncollectTarget(targetType, targetId, did);
              else { collectTarget(targetType, targetId, did); toast('收藏成功'); }
            },
          })}
          doneProps={bindBack()}
        />
      )}

      {sheet === 'repost' && (
        <Sheet title="转发评论">
          <div className="px-4 pb-2">
            <div className="rounded-lg p-2.5 mb-3 text-xs truncate" style={{ background: '#F2F3F5', color: C.sub }}>{review.title}</div>
            <textarea
              value={repostText}
              onChange={(e) => setRepostText(e.target.value.slice(0, 350))}
              placeholder="说说你的看法…"
              rows={3}
              className="w-full resize-none rounded-lg px-3 py-2 text-sm outline-none border-none"
              style={{ background: '#F2F3F5', color: C.text }}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className="text-[11px]" style={{ color: C.sub }}>{repostText.length}/350</span>
              <button
                {...bindTap({ kind: 'action', id: 'review.detail.repostEditor.open' }, { onTrigger: () => { repostTarget(targetType, targetId, repostText.trim() || '转发'); toast('转发成功'); back(); } })}
                className="px-4 h-8 rounded-full text-sm text-white border-none cursor-pointer"
                style={{ background: C.green }}
              >
                发布
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {editor === 'reply' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <ReplyEditor
            quoteText={quoteText}
            images={replyImages}
            emojiOpen={emojiOpen}
            syncToFeed={syncToFeed}
            bindPickImage={bindTap({ kind: 'action', id: 'review.detail.replyEditor.open' }, {
              onTrigger: () => {
                void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  setReplyImages((im) => [...im, r.selected[0].uri]);
                });
              },
            })}
            bindImageLongPress={(idx) => bindTap({ kind: 'action', id: 'review.detail.replyEditor.open' }, { onTrigger: () => setReplyImages((im) => im.filter((_, i) => i !== idx)) })}
            bindEmojiToggle={bindTap({ kind: 'action', id: 'review.detail.replyEditor.open' }, { onTrigger: () => setP((p) => (emojiOpen ? p.delete('emoji') : p.set('emoji', 'open')), true) })}
            bindEmojiPick={(e) => bindTap({ kind: 'action', id: 'review.detail.replyEditor.open' }, { onTrigger: () => setReplyDraft(replyDraft + e) })}
            bindSyncToggle={bindTap({ kind: 'action', id: 'review.detail.replyRepost.toggle' }, { onTrigger: () => setP((p) => (syncToFeed ? p.set('sync', 'off') : p.delete('sync')), true) })}
            bindPublish={bindTap({ kind: 'action', id: 'review.detail.reply.submit' }, {
              onTrigger: () => {
                if (!replyDraft.trim() && replyImages.length === 0) return;
                addReply(targetType, targetId, replyDraft.trim(), { images: replyImages, quoteReplyId: quoteReplyId ?? null, syncToFeed });
                setReplyImages([]);
                toast('回复成功');
                back();
              },
            })}
          />
        </div>
      )}
    </div>
  );
}

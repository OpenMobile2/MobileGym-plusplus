import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { payWithSystem, pickImagesFromAlbum } from '../capabilities';
import type { DoubanReply } from '../types';
import { C, Avatar, Img, MetaLine, Chip, EmptyState, TheEnd, fmtAbsDateTime, fmtCount, fmtShortDate } from '../components/ui';
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

// 节点: discussion.detail —— 条目讨论详情(5子tab详情模板 discussion 实例)。
// evidence: frame:f60ef9@t0046/t0048/t0050/t0055
const SEED_IMG = '/@app-assets/Douban/images/bc_photo1.png';

function relTime(ts: number, now: number): string {
  const diff = Math.max(0, now - ts);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return `${min}分钟前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 赞 tab 行时间:当天=「3小时前」;昨天=「昨天 20:40」;更早=「06-30」 */
function fmtLikeTime(ts: number, now: number): string {
  const dN = TimeService.fromTimestamp(now);
  const dT = TimeService.fromTimestamp(ts);
  const dayN = TimeService.fromLocalParts(dN.getFullYear(), dN.getMonth(), dN.getDate()).getTime();
  const dayT = TimeService.fromLocalParts(dT.getFullYear(), dT.getMonth(), dT.getDate()).getTime();
  const dd = Math.round((dayN - dayT) / 86400000);
  if (dd <= 0) return relTime(ts, now);
  if (dd === 1) return `昨天 ${pad2(dT.getHours())}:${pad2(dT.getMinutes())}`;
  return fmtShortDate(ts);
}

export default function DiscussionDetailPage() {
  const { bindBack, bindTap, back } = useDoubanGestures();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const discussions = useDoubanStore((s) => s.discussions);
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

  const targetType = 'discussion' as const;
  const dId = routeParams.discussionId ?? discussions[0]?.id ?? 'dc1';
  const disc = useMemo(() => discussions.find((d) => d.id === dId) ?? discussions[0], [discussions, dId]);
  const targetId = disc?.id ?? dId;

  const me = currentUser.id;
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const userOf = (id: string) => userById.get(id);
  const author = userOf(disc?.authorId ?? '');
  const subject = useMemo(() => subjects.find((s) => s.id === disc?.subjectId), [subjects, disc?.subjectId]);
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
  // 收藏成功 snackbar(易失反馈,自动消失;仿 Toast 模式)
  const [collectSnack, setCollectSnack] = useState(false);
  useEffect(() => {
    if (!collectSnack) return;
    const t = window.setTimeout(() => setCollectSnack(false), 2000);
    return () => window.clearTimeout(t);
  }, [collectSnack]);

  const setP = (mut: (p: URLSearchParams) => void, replace = false) =>
    setSearchParams((p) => { mut(p); return p; }, replace ? { replace: true } : undefined);

  const targetReplies = useMemo(() => {
    const list = replies.filter((r) => r.targetType === targetType && r.targetId === targetId);
    const top = list.filter((r) => !r.quoteReplyId);
    const sorted =
      sort === 'author'
        ? top.filter((r) => r.authorId === disc?.authorId || r.deleted)
        : sort === 'latest'
          ? [...top].sort((a, b) => b.createdAt - a.createdAt)
          : [...top].sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) || b.likeCount - a.likeCount);
    return [...sorted, ...list.filter((r) => r.quoteReplyId)];
  }, [replies, targetId, sort, disc?.authorId]);
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
    reply: disc?.replyCount ?? 0,
    like: disc?.likeCount ?? 0,
    repost: disc?.repostCount ?? 0,
    collect: disc?.collectCount ?? 0,
  };

  if (!disc) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>讨论不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-11 px-1 shrink-0 bg-white">
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div className="flex-1" />
        <div className="w-10 h-10 flex items-center justify-center relative" style={{ color: C.text }}>
          <span className="text-xl leading-none">⋯</span>
          <span className="absolute top-2 right-1.5 w-2 h-2 rounded-full" style={{ background: C.danger }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-white px-4 pt-1 pb-3">
          {/* 作者块(页面最顶部、标题之上) */}
          <div className="flex items-center gap-2.5">
            <button {...bindTap('discussion.detail.user-open', { params: { userId: author?.id ?? 'u2' } })} className="flex items-center gap-2.5 min-w-0 flex-1 bg-transparent border-none cursor-pointer p-0 text-left">
              <Avatar src={author?.avatar ?? ''} size={40} />
              <div className="min-w-0">
                <div className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{author?.name ?? '豆友'}</div>
                <div className="mt-0.5">
                  <MetaLine absolute time={fmtAbsDateTime(disc.createdAt)} ip={author?.ipLocation} />
                </div>
              </div>
            </button>
            {author?.id !== me && (
              <button
                {...bindTap({ kind: 'action', id: 'discussion.detail.follow.toggle' }, { onTrigger: () => {
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

          {/* 条目挂片:灰 pill + 小封面缩略图 + 深色《标题》 */}
          {subject && (
            <button
              {...bindTap('discussion.detail.subject-open', { params: { itemId: subject.id } })}
              className="inline-flex items-center gap-1.5 rounded px-2 py-1 mt-3 border-none cursor-pointer"
              style={{ background: '#F2F3F5' }}
            >
              <Img src={subject.cover} className="w-4 h-5 rounded-[2px] object-cover shrink-0" />
              <span className="text-xs truncate" style={{ color: C.text }}>《{subject.title}》</span>
            </button>
          )}

          <div className="mt-2.5 text-[18px] font-bold leading-snug" style={{ color: C.text }}>{disc.title}</div>
          <div className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: C.text }}>{disc.content}</div>
        </div>

        <div className="mt-2">
          <DetailTabStrip
            counts={counts}
            activeTab={tab}
            bindTab={(t) => bindTap({ kind: 'action', id: 'discussion.detail.subTab.select.target' }, { params: { target: t }, onTrigger: () => setP((p) => p.set('tab', t), true) })}
          />
        </div>

        {tab === 'like' ? (
          /* 赞 tab:页面自绘 —— 名字右侧灰色时间(真机 t0048) */
          <div className="bg-white">
            {targetLikes.length === 0 ? (
              <EmptyState text="还没有人点赞" icon="cat" />
            ) : (
              targetLikes.map((l) => {
                const u = userOf(l.userId);
                return (
                  <div key={l.id} {...bindTap('discussion.detail.user-open', { params: { userId: l.userId } })} className="flex items-center gap-3 px-4 py-3 cursor-pointer">
                    <Avatar src={u?.avatar ?? ''} size={36} />
                    <span className="text-sm" style={{ color: C.text }}>{u?.name ?? '豆友'}</span>
                    <span className="text-[11px]" style={{ color: '#B9BEC6' }}>{fmtLikeTime(l.createdAt, nowTs)}</span>
                  </div>
                );
              })
            )}
            {targetLikes.length > 0 && <TheEnd />}
          </div>
        ) : (
          <DetailTabContent
            counts={counts}
            activeTab={tab}
            bindTab={() => ({})}
            replies={targetReplies}
            sort={sort}
            bindSort={(s) => bindTap({ kind: 'action', id: 'discussion.detail.subTab.select.target' }, { params: { target: s }, onTrigger: () => setP((p) => p.set('sort', s), true) })}
            userOf={userOf}
            authorId={disc.authorId}
            replyById={replyById}
            bindReplyRow={(r) => bindTap({ kind: 'action', id: 'discussion.detail.floorReply.open' }, { onTrigger: () => setP((p) => { p.set('editor', 'reply'); p.set('quote', r.id); }) })}
            expandedThreadId={searchParams.get('thread')}
            bindThreadExpand={(r) => bindTap({ kind: 'action', id: 'discussion.detail.floorReply.open' }, { onTrigger: () => setP((p) => { if (p.get('thread') === r.id) p.delete('thread'); else p.set('thread', r.id); }, true) })}
            likes={targetLikes}
            reposts={targetReposts}
            collects={targetCollects}
            gifts={targetGifts}
            doulistTitleOf={doulistTitleOf}
            bindUserOpen={(userId) => bindTap('discussion.detail.user-open', { params: { userId } })}
            bindGiftOpen={bindTap({ kind: 'action', id: 'discussion.detail.gift.send' }, { onTrigger: () => setP((p) => { p.set('sheet', 'gift'); p.set('giftTab', 'store'); }) })}
            likedByMe={likedByMe}
            collectedByMe={collectedByMe}
            bindReplyBar={{}}
            bindLike={{}}
            bindRepost={{}}
            bindCollect={{}}
            currentUserId={me}
            now={nowTs}
          />
        )}
      </div>

      <DetailBottomBar
        mode={tab === 'reply' ? 'reply' : 'article'}
        counts={counts}
        likedByMe={likedByMe}
        collectedByMe={collectedByMe}
        bindReplyBar={bindTap({ kind: 'action', id: 'discussion.detail.replyEditor.open' }, { onTrigger: () => setP((p) => { p.set('editor', 'reply'); p.delete('quote'); }) })}
        bindLike={bindTap({ kind: 'action', id: 'discussion.detail.like.toggle' }, { onTrigger: () => toggleLike(targetType, targetId) })}
        bindRepost={bindTap({ kind: 'action', id: 'discussion.detail.repostEditor.open' }, { onTrigger: () => { setRepostText(''); setP((p) => p.set('sheet', 'repost')); } })}
        bindCollect={bindTap({ kind: 'action', id: 'discussion.detail.collectSheet.open' }, { onTrigger: () => setP((p) => p.set('sheet', 'collect')) })}
        bindGiftOpen={bindTap({ kind: 'action', id: 'discussion.detail.gift.send' }, { onTrigger: () => setP((p) => { p.set('sheet', 'gift'); p.set('giftTab', 'store'); }) })}
      />

      {sheet === 'gift' && (
        <GiftSheet
          tab={giftTab}
          activeGiftId={giftId}
          bindTabSelect={(t) => bindTap({ kind: 'action', id: 'discussion.detail.gift.send' }, { onTrigger: () => setP((p) => p.set('giftTab', t), true) })}
          bindGiftSelect={(gid) => bindTap({ kind: 'action', id: 'discussion.detail.gift.send' }, { onTrigger: () => setP((p) => p.set('giftId', gid), true) })}
          bindPurchase={bindTap({ kind: 'action', id: 'discussion.detail.gift.send' }, { onTrigger: () => {
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
          bindCreate={bindTap({ kind: 'action', id: 'discussion.detail.doulist.create' }, {
            onTrigger: () => { createDoulist('新建豆列', '', false); toast('已创建豆列'); },
          })}
          bindToggle={(did) => bindTap({ kind: 'action', id: 'discussion.detail.collectSheet.open' }, {
            onTrigger: () => {
              if (checkedDoulistIds.includes(did)) uncollectTarget(targetType, targetId, did);
              else { collectTarget(targetType, targetId, did); setCollectSnack(true); }
            },
          })}
          doneProps={bindBack()}
        />
      )}

      {sheet === 'repost' && (
        <Sheet title="转发讨论">
          <div className="px-4 pb-2">
            <div className="rounded-lg p-2.5 mb-3 text-xs truncate" style={{ background: '#F2F3F5', color: C.sub }}>{disc.title}</div>
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
                {...bindTap({ kind: 'action', id: 'discussion.detail.repostEditor.open' }, { onTrigger: () => { repostTarget(targetType, targetId, repostText.trim() || '转发'); toast('转发成功'); back(); } })}
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
            bindPickImage={bindTap({ kind: 'action', id: 'discussion.detail.replyEditor.open' }, {
              onTrigger: () => {
                void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  setReplyImages((im) => [...im, r.selected[0].uri]);
                });
              },
            })}
            bindImageLongPress={(idx) => bindTap({ kind: 'action', id: 'discussion.detail.replyEditor.open' }, { onTrigger: () => setReplyImages((im) => im.filter((_, i) => i !== idx)) })}
            bindEmojiToggle={bindTap({ kind: 'action', id: 'discussion.detail.replyEditor.open' }, { onTrigger: () => setP((p) => (emojiOpen ? p.delete('emoji') : p.set('emoji', 'open')), true) })}
            bindEmojiPick={(e) => bindTap({ kind: 'action', id: 'discussion.detail.replyEditor.open' }, { onTrigger: () => setReplyDraft(replyDraft + e) })}
            bindSyncToggle={bindTap({ kind: 'action', id: 'discussion.detail.replyRepost.toggle' }, { onTrigger: () => setP((p) => (syncToFeed ? p.set('sync', 'off') : p.delete('sync')), true) })}
            bindPublish={bindTap({ kind: 'action', id: 'discussion.detail.reply.submit' }, {
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

      {/* 收藏成功 snackbar:底部深色条「✓ 收藏成功 —— 添加收藏语 ›」(evidence t0055) */}
      {collectSnack && (
        <div className="absolute left-4 right-4 bottom-20 z-50 flex items-center gap-2 rounded-lg px-4 py-3" style={{ background: 'rgba(26,26,26,0.92)' }}>
          <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: C.green }}>
            <svg width="9" height="9" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" /></svg>
          </span>
          <span className="text-[13px] text-white">收藏成功</span>
          <button
            {...bindTap({ kind: 'action', id: 'discussion.detail.collectSheet.open' }, { onTrigger: () => { setCollectSnack(false); back(); } })}
            className="ml-auto text-[13px] bg-transparent border-none cursor-pointer shrink-0"
            style={{ color: '#F5C97A' }}
          >
            添加收藏语 ›
          </button>
        </div>
      )}
    </div>
  );
}

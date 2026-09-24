import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { payWithSystem, pickImagesFromAlbum } from '../capabilities';
import { C, Avatar, Img, MetaLine, fmtAbsDateTime } from '../components/ui';
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
import { Sheet, CenterDialog } from '../components/Sheet';
import { setImageViewerPayload } from './MediaImageviewerPage';

// 节点: broadcast.detail —— 广播详情(5子tab详情模板 broadcast 实例)。
// evidence: IMG_0214-0226 / frame:53ee31 / frame:944a47
const SEED_IMG = '/@app-assets/Douban/images/bc_photo1.png';

export default function BroadcastDetailPage() {
  const { bindBack, bindTap, back } = useDoubanGestures();
  const routeParams = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const broadcasts = useDoubanStore((s) => s.broadcasts);
  const users = useDoubanStore((s) => s.users);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const topics = useDoubanStore((s) => s.topics);
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
  const deleteReply = useDoubanStore((s) => s.deleteReply);
  const setReplyDraft = useDoubanStore((s) => s.setReplyDraft);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);
  const createDoulist = useDoubanStore((s) => s.createDoulist);
  const sendGift = useDoubanStore((s) => s.sendGift);

  const targetType = 'broadcast' as const;
  const bcId = routeParams.id ?? broadcasts[0]?.id ?? 'b_wushan';
  const bc = useMemo(() => broadcasts.find((b) => b.id === bcId) ?? broadcasts[0], [broadcasts, bcId]);
  const targetId = bc?.id ?? bcId;

  const me = currentUser.id;
  const userById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const userOf = (id: string) => userById.get(id);
  const author = userOf(bc?.authorId ?? '');
  const topic = useMemo(() => topics.find((t) => t.id === bc?.topicId), [topics, bc?.topicId]);
  const nowTs = TimeService.now();

  // ---- URL 驱动的 UI 态 ----
  const tab = (searchParams.get('tab') as DetailTab) || 'reply';
  const sort = (searchParams.get('sort') as ReplySort) || 'default';
  const sheet = searchParams.get('sheet'); // gift | collect | repost
  const editor = searchParams.get('editor'); // reply
  const giftTab = (searchParams.get('giftTab') as 'bag' | 'store') || 'store';
  const giftId = searchParams.get('giftId') || 'cake';
  const emojiOpen = searchParams.get('emoji') === 'open';
  const syncToFeed = searchParams.get('sync') !== 'off';
  const quoteReplyId = searchParams.get('quote');
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const setP = (mut: (p: URLSearchParams) => void, replace = false) =>
    setSearchParams((p) => { mut(p); return p; }, replace ? { replace: true } : undefined);

  // ---- 派生数据 ----
  const targetReplies = useMemo(() => {
    const list = replies.filter((r) => r.targetType === targetType && r.targetId === targetId);
    const top = list.filter((r) => !r.quoteReplyId);
    const sorted =
      sort === 'author'
        ? top.filter((r) => r.authorId === bc?.authorId || r.deleted)
        : sort === 'latest'
          ? [...top].sort((a, b) => b.createdAt - a.createdAt)
          : [...top].sort((a, b) => (b.isHot ? 1 : 0) - (a.isHot ? 1 : 0) || b.likeCount - a.likeCount);
    const children = list.filter((r) => r.quoteReplyId);
    return [...sorted, ...children];
  }, [replies, targetId, sort, bc?.authorId]);
  const replyById = (id: string) => replies.find((r) => r.id === id);

  const targetLikes = useMemo(() => likes.filter((l) => l.targetType === targetType && l.targetId === targetId), [likes, targetId]);
  const targetReposts = useMemo(() => reposts.filter((r) => r.targetType === targetType && r.targetId === targetId), [reposts, targetId]);
  const targetCollects = useMemo(() => collects.filter((c) => c.targetType === targetType && c.targetId === targetId), [collects, targetId]);
  const targetGifts = useMemo(() => gifts.filter((g) => g.targetType === targetType && g.targetId === targetId), [gifts, targetId]);
  const myDoulists = useMemo(() => doulists.filter((d) => d.ownerId === me), [doulists, me]);
  const checkedDoulistIds = useMemo(
    () => targetCollects.filter((c) => c.userId === me).map((c) => c.doulistId),
    [targetCollects, me],
  );

  const likedByMe = useMemo(() => targetLikes.some((l) => l.userId === me), [targetLikes, me]);
  const collectedByMe = checkedDoulistIds.length > 0;
  const followed = author ? follows.users.includes(author.id) : false;

  const counts = {
    reply: bc?.replyCount ?? 0,
    like: bc?.likeCount ?? 0,
    repost: bc?.repostCount ?? 0,
    collect: bc?.collectCount ?? 0,
  };

  const [repostText, setRepostText] = useState('');
  const doulistTitleOf = (id: string) => doulists.find((d) => d.id === id)?.title ?? '豆列';
  const quoteText = quoteReplyId
    ? (() => { const q = replyById(quoteReplyId); return q ? `${userOf(q.authorId)?.name ?? '豆友'}:${q.text}` : undefined; })()
    : undefined;

  if (!bc) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="h-11 flex items-center px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-10 h-10 text-2xl bg-transparent border-none" style={{ color: C.green }}>‹</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-sm" style={{ color: C.sub }}>广播不存在</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏:返回 / 作者头像昵称+关注 / 更多 */}
      <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
        <button {...bindBack()} className="w-10 h-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        <div
          {...bindTap('broadcast.author-open', { params: { userId: author?.id ?? 'u2' } })}
          className="flex-1 flex items-center gap-2 min-w-0 cursor-pointer"
        >
          <Avatar src={author?.avatar ?? ''} size={28} />
          <span className="text-[15px] font-semibold truncate" style={{ color: C.text }}>{author?.name ?? '豆友'}</span>
        </div>
        {author?.id !== me && (
          <button
            {...bindTap({ kind: 'action', id: 'broadcast.author.follow' }, { onTrigger: () => {
              if (!author) return;
              if (followed) { unfollowUser(author.id); toast('已取消关注'); }
              else { followUser(author.id); toast('关注成功'); }
            } })}
            className="px-3 h-7 rounded-full text-xs border-none cursor-pointer mr-1"
            style={followed ? { background: '#F2F3F5', color: C.sub } : { background: C.greenSoft, color: C.green }}
          >
            {followed ? '已关注' : '+ 关注'}
          </button>
        )}
      </div>

      {/* 主滚动区:正文 + 计数条 + tab内容 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 正文区 */}
        <div className="bg-white px-4 pt-3 pb-2">
          <div className="flex items-center gap-2.5">
            <Avatar src={author?.avatar ?? ''} size={48} />
            <div className="min-w-0">
              <div className="text-[15px] font-semibold" style={{ color: C.text }}>{author?.name ?? '豆友'}</div>
              {/* 绝对时间 + 空格 + 裸地名(无「IP属地」前缀、无「·」) */}
              <MetaLine absolute time={fmtAbsDateTime(bc.createdAt)} ip={bc.ipLocation} />
            </div>
          </div>
          <div className="mt-3 text-[20px] font-bold leading-relaxed whitespace-pre-wrap break-words" style={{ color: C.text }}>
            {bc.text}
          </div>
          {/* 行内话题:独立一行、与正文空行 */}
          {topic && (
            <div className="mt-2">
              <span
                {...bindTap('broadcast.topic-open', { params: { id: topic.id } })}
                className="cursor-pointer text-[15px]"
                style={{ color: C.link }}
              >
                #{topic.name}#
              </span>
            </div>
          )}
          {bc.images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-1.5">
              {bc.images.map((src, i) => (
                <div key={i} {...bindTap('broadcast.image-open', { beforeTrigger: () => setImageViewerPayload({ images: bc.images, index: i, caption: bc.text, likeCount: bc.likeCount, replyCount: bc.replyCount }) })} className="cursor-pointer">
                  <Img src={src} className="w-full aspect-square rounded object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5子tab计数条 */}
        <div className="mt-2">
          <DetailTabStrip
            counts={counts}
            activeTab={tab}
            bindTab={(t) =>
              bindTap({ kind: 'action', id: 'broadcast.tab.select.target' }, {
                params: { target: t },
                onTrigger: () => setP((p) => p.set('tab', t), true),
              })
            }
          />
        </div>

        {/* tab 内容 */}
        <DetailTabContent
          counts={counts}
          activeTab={tab}
          bindTab={() => ({})}
          replies={targetReplies}
          sort={sort}
          bindSort={(s) =>
            bindTap({ kind: 'action', id: 'broadcast.replySort.select.target' }, {
              params: { target: s },
              onTrigger: () => setP((p) => p.set('sort', s), true),
            })
          }
          userOf={userOf}
          authorId={bc.authorId}
          replyById={replyById}
          bindReplyRow={(r) =>
            bindTap({ kind: 'action', id: 'broadcast.reply.quote' }, {
              onTrigger: () => setP((p) => { p.set('editor', 'reply'); p.set('quote', r.id); }),
            })
          }
          bindOwnReplyRow={(r) =>
            bindTap({ kind: 'action', id: 'broadcast.ownReply.delete' }, {
              onTrigger: () => setDeleteTarget(r.id),
            })
          }
          expandedThreadId={searchParams.get('thread')}
          bindThreadExpand={(r) =>
            bindTap({ kind: 'action', id: 'broadcast.replyThread.expand' }, {
              onTrigger: () => setP((p) => {
                if (p.get('thread') === r.id) p.delete('thread');
                else p.set('thread', r.id);
              }, true),
            })
          }
          likes={targetLikes}
          reposts={targetReposts}
          collects={targetCollects}
          gifts={targetGifts}
          doulistTitleOf={doulistTitleOf}
          bindUserOpen={(userId) => bindTap('broadcast.author-open', { params: { userId } })}
          bindGiftOpen={bindTap({ kind: 'action', id: 'broadcast.gift.sheet' }, {
            onTrigger: () => setP((p) => { p.set('sheet', 'gift'); p.set('giftTab', 'store'); }),
          })}
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

      {/* 底部操作栏 */}
      <DetailBottomBar
        counts={counts}
        likedByMe={likedByMe}
        collectedByMe={collectedByMe}
        bindReplyBar={bindTap({ kind: 'action', id: 'broadcast.reply.compose' }, {
          onTrigger: () => setP((p) => { p.set('editor', 'reply'); p.delete('quote'); }),
        })}
        bindLike={bindTap({ kind: 'action', id: 'broadcast.like.toggle' }, {
          onTrigger: () => toggleLike(targetType, targetId),
        })}
        bindRepost={bindTap({ kind: 'action', id: 'broadcast.repost.compose' }, {
          onTrigger: () => { setRepostText(''); setP((p) => p.set('sheet', 'repost')); },
        })}
        bindCollect={bindTap({ kind: 'action', id: 'broadcast.collect.sheet' }, {
          onTrigger: () => setP((p) => p.set('sheet', 'collect')),
        })}
        bindGiftOpen={bindTap({ kind: 'action', id: 'broadcast.gift.sheet' }, {
          onTrigger: () => setP((p) => { p.set('sheet', 'gift'); p.set('giftTab', 'store'); }),
        })}
      />

      {/* 送礼物弹层 */}
      {sheet === 'gift' && (
        <GiftSheet
          tab={giftTab}
          activeGiftId={giftId}
          bindTabSelect={(t) => bindTap({ kind: 'action', id: 'broadcast.gift.sheet' }, { onTrigger: () => setP((p) => p.set('giftTab', t), true) })}
          bindGiftSelect={(gid) => bindTap({ kind: 'action', id: 'broadcast.gift.sheet' }, { onTrigger: () => setP((p) => p.set('giftId', gid), true) })}
          bindPurchase={bindTap({ kind: 'action', id: 'broadcast.gift.purchase' }, { onTrigger: () => {
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

      {/* 收藏到豆列弹层 */}
      {sheet === 'collect' && (
        <CollectSheet
          doulists={myDoulists}
          checkedIds={checkedDoulistIds}
          bindCreate={bindTap({ kind: 'action', id: 'broadcast.doulist.create' }, {
            onTrigger: () => { createDoulist('新建豆列', '', false); toast('已创建豆列'); },
          })}
          bindToggle={(did) =>
            bindTap({ kind: 'action', id: 'broadcast.collect.sheet' }, {
              onTrigger: () => {
                if (checkedDoulistIds.includes(did)) uncollectTarget(targetType, targetId, did);
                else { collectTarget(targetType, targetId, did); toast('收藏成功'); }
              },
            })
          }
          doneProps={bindBack()}
        />
      )}

      {/* 转发编辑器 */}
      {sheet === 'repost' && (
        <Sheet title="转发广播">
          <div className="px-4 pb-2">
            <div className="rounded-lg p-2.5 mb-3 text-xs truncate" style={{ background: '#F2F3F5', color: C.sub }}>
              {author?.name}:{bc.text}
            </div>
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
                {...bindTap({ kind: 'action', id: 'broadcast.repost.compose' }, {
                  onTrigger: () => { repostTarget(targetType, targetId, repostText.trim() || '转发'); toast('转发成功'); back(); },
                })}
                className="px-4 h-8 rounded-full text-sm text-white border-none cursor-pointer"
                style={{ background: C.green }}
              >
                发布
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {/* 回复编辑器 */}
      {editor === 'reply' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <ReplyEditor
            quoteText={quoteText}
            images={replyImages}
            emojiOpen={emojiOpen}
            syncToFeed={syncToFeed}
            bindPickImage={bindTap({ kind: 'action', id: 'broadcast.reply.compose' }, {
              onTrigger: () => {
                void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  setReplyImages((im) => [...im, r.selected[0].uri]);
                });
              },
            })}
            bindImageLongPress={(idx) => bindTap({ kind: 'action', id: 'broadcast.replyImage.longpress' }, { onTrigger: () => setReplyImages((im) => im.filter((_, i) => i !== idx)) })}
            bindEmojiToggle={bindTap({ kind: 'action', id: 'broadcast.reply.compose' }, { onTrigger: () => setP((p) => (emojiOpen ? p.delete('emoji') : p.set('emoji', 'open')), true) })}
            bindEmojiPick={(e) => bindTap({ kind: 'action', id: 'broadcast.reply.compose' }, { onTrigger: () => setReplyDraft(replyDraft + e) })}
            bindSyncToggle={bindTap({ kind: 'action', id: 'broadcast.reply.compose' }, { onTrigger: () => setP((p) => (syncToFeed ? p.set('sync', 'off') : p.delete('sync')), true) })}
            bindPublish={bindTap({ kind: 'action', id: 'broadcast.reply.compose' }, {
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

      {/* 删除回复二次确认 */}
      {deleteTarget && (
        <CenterDialog
          title="删除回复"
          buttons={[
            { label: '取消', bind: { onClick: () => setDeleteTarget(null) } },
            { label: '删除', danger: true, bind: { onClick: () => { deleteReply(deleteTarget); setDeleteTarget(null); toast('已删除'); } } },
          ]}
        >
          确定删除这条回复吗?
        </CenterDialog>
      )}
    </div>
  );
}

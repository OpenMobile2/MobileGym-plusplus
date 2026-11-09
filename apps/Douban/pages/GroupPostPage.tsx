// 小组帖子详情(group.post,IMG_0253,frame:7df5b5@t0042-0065):
// 正文 + 广告卡(可关)+ 5子tab(回复/赞/转发/收藏/礼物,DetailFive 同构)
// 回复tab:楼主筛选chip + 楼中楼引用 + 页码分页;底部操作栏(写回复/赞/转发/收藏/礼物)。
// 自己帖右上「…」→ 移出小组/删除(二次确认)。弹层一律 URL 驱动。
import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { payWithSystem, pickImagesFromAlbum } from '../capabilities';
import { Avatar, C, Img, Chip, MetaLine, fmtAbsDateTime } from '../components/ui';
import { Sheet, SheetRow, CenterDialog } from '../components/Sheet';
import { GiftSheet, GIFTS, type GiftTab } from '../components/GiftSheet';
import { CollectSheet } from '../components/CollectSheet';
import { ReplyEditor } from '../components/ReplyEditor';
import {
  DetailTabStrip,
  DetailTabContent,
  DetailBottomBar,
  type DetailTab,
  type ReplySort,
} from '../components/DetailFive';

const PAGE_SIZE = 20;
const SEED_IMG =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' fill='%23DDE3EA'/></svg>";

export default function GroupPostPage() {
  const { bindBack, bindTap, back } = useDoubanGestures();
  const { topicId = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const toast = useDoubanStore((s) => s.toast);
  const joinGroupDirect = useDoubanStore((s) => s.joinGroupDirect);
  const sendGift = useDoubanStore((s) => s.sendGift);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const follows = useDoubanStore((s) => s.follows);
  const followUser = useDoubanStore((s) => s.followUser);
  const unfollowUser = useDoubanStore((s) => s.unfollowUser);
  const users = useDoubanStore((s) => s.users);
  const groups = useDoubanStore((s) => s.groups);
  const groupPosts = useDoubanStore((s) => s.groupPosts);
  const replies = useDoubanStore((s) => s.replies);
  const likes = useDoubanStore((s) => s.likes);
  const reposts = useDoubanStore((s) => s.reposts);
  const collects = useDoubanStore((s) => s.collects);
  const gifts = useDoubanStore((s) => s.gifts);
  const doulists = useDoubanStore((s) => s.doulists);
  const replyDraft = useDoubanStore((s) => s.replyDraft);

  const toggleLike = useDoubanStore((s) => s.toggleLike);
  const repostTarget = useDoubanStore((s) => s.repostTarget);
  const collectTarget = useDoubanStore((s) => s.collectTarget);
  const uncollectTarget = useDoubanStore((s) => s.uncollectTarget);
  const addReply = useDoubanStore((s) => s.addReply);
  const setReplyDraft = useDoubanStore((s) => s.setReplyDraft);
  const deleteGroupPost = useDoubanStore((s) => s.deleteGroupPost);
  const detachGroupPost = useDoubanStore((s) => s.detachGroupPost);
  const createDoulist = useDoubanStore((s) => s.createDoulist);

  const post = useMemo(() => groupPosts.find((p) => p.id === topicId), [groupPosts, topicId]);
  const group = useMemo(() => groups.find((g) => g.id === post?.groupId), [groups, post]);
  const now = TimeService.now();

  const tab: DetailTab = (['reply', 'like', 'repost', 'collect', 'gift'] as const).includes(searchParams.get('tab') as DetailTab)
    ? (searchParams.get('tab') as DetailTab)
    : 'reply';
  const sort: ReplySort = (['author', 'default', 'latest'] as const).includes(searchParams.get('sort') as ReplySort)
    ? (searchParams.get('sort') as ReplySort)
    : 'default';
  const ownerOnly = searchParams.get('owner') === '1';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1);
  const sheet = searchParams.get('sheet'); // 'collect' | 'gift' | 'menu' | 'delete' | 'reply' | 'page'
  const giftTab: GiftTab = searchParams.get('giftTab') === 'store' ? 'store' : 'bag';
  const activeGiftId = searchParams.get('gift') ?? GIFTS[0].id;
  const emojiOpen = searchParams.get('emoji') === '1';
  const adClosed = searchParams.get('ad') === 'closed';
  const [syncFeed, setSyncFeed] = useState(true);
  const [replyImages, setReplyImages] = useState<string[]>([]);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  // 顶栏作者「+关注」:页面无已声明的关注 action,按规范做纯视觉本地态(不打 data-action)

  const setParam = (key: string, value: string | null, replace = true) =>
    setSearchParams(
      (p) => {
        if (value === null) p.delete(key);
        else p.set(key, value);
        return p;
      },
      { replace },
    );
  const openSheet = (name: string) =>
    setSearchParams((p) => {
      p.set('sheet', name);
      return p;
    });
  const closeSheet = () =>
    setSearchParams(
      (p) => {
        p.delete('sheet');
        p.delete('emoji');
        return p;
      },
      { replace: true },
    );

  const userOf = useMemo(() => {
    const m = new Map(users.map((u) => [u.id, u]));
    return (uid: string) => m.get(uid);
  }, [users]);
  const replyById = useMemo(() => {
    const m = new Map(replies.map((r) => [r.id, r]));
    return (id: string) => m.get(id);
  }, [replies]);
  const doulistTitleOf = useMemo(() => {
    const m = new Map(doulists.map((d) => [d.id, d.title]));
    return (id: string) => m.get(id) ?? '豆列';
  }, [doulists]);

  // 本帖回复(排序 + 楼主筛选 + 分页)
  const postReplies = useMemo(
    () => replies.filter((r) => r.targetType === 'groupPost' && r.targetId === topicId),
    [replies, topicId],
  );
  const sortedReplies = useMemo(() => {
    let list = [...postReplies];
    if (ownerOnly && post) list = list.filter((r) => r.authorId === post.authorId);
    if (sort === 'latest') list.sort((a, b) => b.createdAt - a.createdAt);
    else if (sort === 'author' && post) list.sort((a, b) => (a.authorId === post.authorId ? -1 : 1));
    return list;
  }, [postReplies, ownerOnly, sort, post]);

  const totalPages = Math.max(1, Math.ceil(sortedReplies.filter((r) => !r.quoteReplyId && !r.isHot).length / PAGE_SIZE));
  const pagedReplies = useMemo(() => {
    // 保留 hot + 楼中楼子层(供引用展开),仅对普通楼层分页
    const hot = sortedReplies.filter((r) => r.isHot);
    const children = sortedReplies.filter((r) => r.quoteReplyId);
    const normal = sortedReplies.filter((r) => !r.isHot && !r.quoteReplyId);
    const start = (page - 1) * PAGE_SIZE;
    return [...hot, ...normal.slice(start, start + PAGE_SIZE), ...children];
  }, [sortedReplies, page]);

  const isOwner = post?.authorId === currentUser.id;

  const counts = post
    ? { reply: post.replyCount, like: post.likeCount, repost: post.repostCount, collect: post.collectCount }
    : { reply: 0, like: 0, repost: 0, collect: 0 };

  const likedByMe = useMemo(
    () => likes.some((l) => l.targetType === 'groupPost' && l.targetId === topicId && l.userId === currentUser.id),
    [likes, topicId, currentUser.id],
  );
  const collectedIds = useMemo(
    () =>
      collects
        .filter((c) => c.targetType === 'groupPost' && c.targetId === topicId && c.userId === currentUser.id)
        .map((c) => c.doulistId),
    [collects, topicId, currentUser.id],
  );
  const collectedByMe = collectedIds.length > 0;

  const publishReply = () => {
    if (!replyDraft.trim() && replyImages.length === 0) return;
    addReply('groupPost', topicId, replyDraft.trim(), {
      images: replyImages,
      quoteReplyId: quoteId ?? undefined,
      syncToFeed: syncFeed,
    });
    setReplyImages([]);
    setQuoteId(null);
    closeSheet();
    toast('回复成功');
  };

  if (!post) {
    return (
      <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
        <div className="flex items-center h-11 px-1 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-12 text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
        </div>
        <div className="py-16 text-center text-sm" style={{ color: C.sub }}>该讨论已删除或不存在</div>
      </div>
    );
  }

  const author = userOf(post.authorId);
  const quotedReply = quoteId ? replyById(quoteId) : undefined;

  const detailProps = {
    counts,
    activeTab: tab,
    bindTab: (t: DetailTab) =>
      bindTap({ kind: 'action', id: 'groupPost.tab.select.target' }, { params: { target: t }, onTrigger: () => setParam('tab', t) }),
    replies: pagedReplies,
    sort,
    bindSort: (s: ReplySort) =>
      bindTap({ kind: 'action', id: 'groupPost.tab.select.target' }, { params: { sort: s }, onTrigger: () => setParam('sort', s) }),
    userOf,
    authorId: post.authorId,
    bindReplyRow: (r: { id: string }) =>
      bindTap({ kind: 'action', id: 'groupPost.reply.quoteCompose' }, {
        params: { replyId: r.id },
        onTrigger: () => {
          setQuoteId(r.id);
          openSheet('reply');
        },
      }),
    expandedThreadId: searchParams.get('thread'),
    bindThreadExpand: (r: { id: string }) =>
      bindTap({ kind: 'action', id: 'groupPost.replies.quote.expand' }, {
        params: { replyId: r.id },
        onTrigger: () => setParam('thread', searchParams.get('thread') === r.id ? null : r.id),
      }),
    replyById,
    likes: likes.filter((l) => l.targetType === 'groupPost' && l.targetId === topicId),
    reposts: reposts.filter((r) => r.targetType === 'groupPost' && r.targetId === topicId),
    collects: collects.filter((c) => c.targetType === 'groupPost' && c.targetId === topicId),
    gifts: gifts.filter((g) => g.targetType === 'groupPost' && g.targetId === topicId),
    doulistTitleOf,
    bindUserOpen: (uid: string) => bindTap('groupPost.author-open', { params: { userId: uid } }),
    bindGiftOpen: bindTap({ kind: 'action', id: 'groupPost.gift.sheet' }, { onTrigger: () => openSheet('gift') }),
    likedByMe,
    collectedByMe,
    bindReplyBar: bindTap({ kind: 'action', id: 'groupPost.reply.compose' }, {
      onTrigger: () => {
        setQuoteId(null);
        openSheet('reply');
      },
    }),
    bindLike: bindTap({ kind: 'action', id: 'groupPost.like.toggle' }, { onTrigger: () => toggleLike('groupPost', topicId) }),
    bindRepost: bindTap({ kind: 'action', id: 'groupPost.repost.compose' }, {
      onTrigger: () => {
        repostTarget('groupPost', topicId, '');
        toast('转发成功');
      },
    }),
    bindCollect: bindTap({ kind: 'action', id: 'groupPost.collect.sheet' }, { onTrigger: () => openSheet('collect') }),
    currentUserId: currentUser.id,
    now,
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      {/* 顶栏 */}
      {isOwner ? (
        // 自己帖:白底标题栏 + 右上「…」
        <div className="flex items-center h-11 px-1 shrink-0 bg-white border-b" style={{ borderColor: C.border }}>
          <button {...bindBack()} className="w-12 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: C.text }}>‹</button>
          <button
            {...bindTap({ kind: 'action', id: 'groupPost.title.scrollTop' }, { onTrigger: () => toast('回到原文顶部') })}
            className="flex-1 text-center bg-transparent border-none cursor-pointer"
          >
            <div className="text-sm font-semibold truncate" style={{ color: C.text }}>{group?.name ?? '小组'}</div>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'groupPost.ownerMenu.open' }, { onTrigger: () => openSheet('menu') })}
            className="w-12 flex items-center justify-center text-xl bg-transparent border-none cursor-pointer"
            style={{ color: C.text }}
          >
            …
          </button>
        </div>
      ) : (
        // 他人帖:小组主题色条(封面缩略 + 组名>[进组] + N人加入 + 加入态胶囊 + …)
        <div
          className="flex items-center h-11 px-1 shrink-0"
          style={{ background: group?.themeColor ?? C.green }}
          data-status-bar-foreground="light"
        >
          <button {...bindBack()} className="w-10 flex items-center justify-center text-2xl bg-transparent border-none cursor-pointer" style={{ color: '#fff' }}>‹</button>
          {/* 封面+组名 → 进入小组详情 */}
          <button
            {...(group ? bindTap('group.post.group-open', { params: { groupId: group.id } }) : {})}
            className="flex items-center gap-2 flex-1 min-w-0 bg-transparent border-none cursor-pointer text-left"
          >
            <Img src={group?.icon ?? ''} className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/40" />
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate text-white leading-tight">{group?.name ?? '小组'} ›</div>
              <div className="text-[10px] text-white/80 leading-tight">{group?.members ?? 0} 人加入</div>
            </div>
          </button>
          <div className="flex items-center gap-1 shrink-0 pr-1">
            {group?.joined ? (
              <span className="px-2.5 h-6 rounded-full text-xs font-medium flex items-center bg-white/25 text-white">已加入</span>
            ) : group?.joinType === 'direct' ? (
              <button
                {...bindTap({ kind: 'action', id: 'group.post.join' }, { onTrigger: () => { joinGroupDirect(group.id); toast('加入成功'); } })}
                className="px-2.5 h-6 rounded-full text-xs font-medium flex items-center bg-white border-none cursor-pointer"
                style={{ color: group.themeColor ?? C.green }}
              >
                + 加入
              </button>
            ) : (
              // 答题/申请组:跳组详情走对应流程
              <button
                {...(group ? bindTap('group.post.group-open', { params: { groupId: group.id } }) : {})}
                className="px-2.5 h-6 rounded-full text-xs font-medium flex items-center bg-white border-none cursor-pointer"
                style={{ color: group?.themeColor ?? C.green }}
              >
                + 加入
              </button>
            )}
            <span className="w-8 flex items-center justify-center text-lg text-white">⋯</span>
          </div>
        </div>
      )}

      {/* 滚动主体:正文 + tab 条 + tab 内容 */}
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 正文 */}
        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-2.5">
            <span {...bindTap('groupPost.author-open', { params: { userId: post.authorId } })} className="cursor-pointer">
              <Avatar src={author?.avatar ?? ''} size={36} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate" style={{ color: C.text }}>{author?.name ?? '豆友'}</span>
                {/* 作者身份 badge chip(虚构原创绿 chip) */}
                <span className="px-1 rounded text-[9px] shrink-0" style={{ background: C.greenSoft, color: C.green }}>常驻组员</span>
              </div>
              <MetaLine absolute time={fmtAbsDateTime(post.createdAt)} ip={author?.ipLocation} />
            </div>
            {!isOwner ? (
              (() => {
                const authorFollowed = author ? follows.users.includes(author.id) : false;
                return (
                  <button
                    {...bindTap({ kind: 'action', id: 'groupPost.author.follow.toggle' }, { onTrigger: () => {
                      if (!author) return;
                      if (authorFollowed) { unfollowUser(author.id); toast('已取消关注'); }
                      else { followUser(author.id); toast('关注成功'); }
                    } })}
                    className="text-xs bg-transparent border-none cursor-pointer shrink-0 self-start pt-0.5"
                    style={{ color: authorFollowed ? C.sub : C.green, fontWeight: authorFollowed ? 400 : 600 }}
                  >
                    {authorFollowed ? '已关注' : '+ 关注'}
                  </button>
                );
              })()
            ) : (
              <button
                {...bindTap({ kind: 'action', id: 'groupPost.ownerMenu.open' }, { params: { edit: 1 }, onTrigger: () => openSheet('menu') })}
                className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0 self-start"
                style={{ color: C.sub }}
                aria-label="编辑"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4z" />
                </svg>
              </button>
            )}
          </div>
          <div className="mt-3 text-[17px] font-bold leading-snug" style={{ color: C.text }}>
            {post.tab && <span style={{ color: C.text }}>{post.tab}|</span>}
            {post.title}
          </div>
          <div className="mt-2 text-[15px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: C.text }}>{post.content}</div>
          {post.images.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {post.images.map((src, i) => (
                <Img key={i} src={src} className="w-full rounded-lg" style={{ height: 'auto', objectFit: 'contain' }} />
              ))}
            </div>
          )}
        </div>

        {/* 广告卡(可关):大图在上 + 文案 +「广告 …」行 + 蓝色「立即下载」+ × */}
        {!adClosed && (
          <div className="mx-4 mt-2 rounded-xl bg-white overflow-hidden border" style={{ borderColor: '#F2F3F5' }}>
            <Img src={SEED_IMG} className="w-full object-cover" style={{ height: 128 }} />
            <div className="px-3 py-2.5">
              <div className="text-sm font-medium" style={{ color: C.text }}>畅游山海,清凉一夏</div>
              <div className="flex items-center mt-1.5">
                <span className="text-[11px]" style={{ color: '#B9BEC6' }}>广告 · 携程旅行</span>
                <div className="flex-1" />
                <button
                  {...bindTap({ kind: 'action', id: 'groupPost.ad.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
                  className="text-xs bg-transparent border-none cursor-pointer flex items-center gap-0.5"
                  style={{ color: '#3E7BF2' }}
                >
                  立即下载 →
                </button>
                <button
                  {...bindTap({ kind: 'action', id: 'groupPost.ad.close' }, { onTrigger: () => setParam('ad', 'closed') })}
                  className="w-6 h-6 ml-1 flex items-center justify-center bg-transparent border-none cursor-pointer text-sm shrink-0"
                  style={{ color: C.sub }}
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5子tab 条 */}
        <div className="mt-2 sticky top-0 z-10">
          <DetailTabStrip counts={counts} activeTab={tab} bindTab={detailProps.bindTab} />
        </div>

        {/* 回复 tab 上方:楼主筛选 + 页码 */}
        {tab === 'reply' && (
          <div className="flex items-center gap-2 px-4 py-2 bg-white border-b" style={{ borderColor: '#F2F3F5' }}>
            <Chip
              label="只看楼主"
              active={ownerOnly}
              bind={bindTap({ kind: 'action', id: 'groupPost.replies.filterOwner' }, {
                onTrigger: () => setParam('owner', ownerOnly ? null : '1'),
              })}
            />
            <div className="flex-1" />
            <button
              {...bindTap({ kind: 'action', id: 'groupPost.replies.page.select.target' }, {
                params: { target: String(page) },
                onTrigger: () => openSheet('page'),
              })}
              className="text-xs bg-transparent border-none cursor-pointer"
              style={{ color: C.sub }}
            >
              {page}/{totalPages}页 ▾
            </button>
          </div>
        )}

        {/* tab 内容 */}
        <DetailTabContent {...detailProps} />
      </div>

      {/* 底部操作栏:他人帖 = 5 图标带计数(article),自己帖 = 写回复条 + 4 图标(reply) */}
      <DetailBottomBar
        counts={counts}
        likedByMe={likedByMe}
        collectedByMe={collectedByMe}
        bindReplyBar={detailProps.bindReplyBar}
        bindLike={detailProps.bindLike}
        bindRepost={detailProps.bindRepost}
        bindCollect={detailProps.bindCollect}
        bindGiftOpen={detailProps.bindGiftOpen}
        mode={isOwner ? 'reply' : 'article'}
      />

      {/* 回复编辑器 */}
      {sheet === 'reply' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" style={{ background: 'rgba(0,0,0,0.4)' }} />
          <ReplyEditor
            quoteText={quotedReply ? `${userOf(quotedReply.authorId)?.name ?? '豆友'}:${quotedReply.text}` : undefined}
            images={replyImages}
            emojiOpen={emojiOpen}
            syncToFeed={syncFeed}
            bindPickImage={bindTap({ kind: 'action', id: 'groupPost.reply.compose' }, {
              params: { pic: 1 },
              onTrigger: () => {
                if (replyImages.length >= 3) return;
                void pickImagesFromAlbum({ multiple: false, maxSelect: 1 }).then((r) => {
                  if (r.cancelled || !r.selected.length) return;
                  setReplyImages((imgs) => (imgs.length >= 3 ? imgs : [...imgs, r.selected[0].uri]));
                });
              },
            })}
            bindEmojiToggle={bindTap({ kind: 'action', id: 'groupPost.reply.compose' }, {
              params: { emoji: 1 },
              onTrigger: () => setParam('emoji', emojiOpen ? null : '1'),
            })}
            bindEmojiPick={(e: string) =>
              bindTap({ kind: 'action', id: 'groupPost.reply.compose' }, {
                params: { emojiChar: e },
                onTrigger: () => setReplyDraft(replyDraft + e),
              })}
            bindSyncToggle={bindTap({ kind: 'action', id: 'groupPost.reply.compose' }, {
              params: { sync: 1 },
              onTrigger: () => setSyncFeed((v) => !v),
            })}
            bindPublish={bindTap({ kind: 'action', id: quoteId ? 'groupPost.reply.quoteCompose' : 'groupPost.reply.compose' }, {
              params: { submit: 1 },
              onTrigger: publishReply,
            })}
          />
        </div>
      )}

      {/* 收藏到豆列 sheet */}
      {sheet === 'collect' && (
        <CollectSheet
          doulists={doulists.filter((d) => d.ownerId === currentUser.id)}
          checkedIds={collectedIds}
          bindCreate={bindTap({ kind: 'action', id: 'groupPost.collect.sheet' }, {
            params: { create: 1 },
            onTrigger: () => {
              createDoulist('新建豆列', '', false);
              toast('已创建豆列');
            },
          })}
          bindToggle={(dlId: string) =>
            bindTap({ kind: 'action', id: 'groupPost.collect.sheet' }, {
              params: { doulistId: dlId },
              onTrigger: () => {
                if (collectedIds.includes(dlId)) uncollectTarget('groupPost', topicId, dlId);
                else {
                  collectTarget('groupPost', topicId, dlId);
                  toast('已收藏');
                }
              },
            })}
          doneProps={bindBack()}
        />
      )}

      {/* 送礼物 sheet */}
      {sheet === 'gift' && (
        <GiftSheet
          tab={giftTab}
          activeGiftId={activeGiftId}
          bindTabSelect={(t: GiftTab) =>
            bindTap({ kind: 'action', id: 'groupPost.gift.sheet' }, { params: { giftTab: t }, onTrigger: () => setParam('giftTab', t) })}
          bindGiftSelect={(gid: string) =>
            bindTap({ kind: 'action', id: 'groupPost.gift.sheet' }, { params: { gift: gid }, onTrigger: () => setParam('gift', gid) })}
          bindPurchase={bindTap({ kind: 'action', id: 'groupPost.gift.sheet' }, { params: { buy: 1 }, onTrigger: () => {
            const gift = GIFTS.find((item) => item.id === activeGiftId) ?? GIFTS[0];
            const launched = payWithSystem(
              { amount: gift.beans, orderId: `gift-${gift.id}`, subject: `购买并送出${gift.name}` },
              (result) => { if (result.resultCode === 'OK') { sendGift('groupPost', topicId, gift.id); toast('礼物已送出'); } },
            );
            if (!launched) toast('无法打开系统支付');
          } })}
          closeProps={bindBack()}
        />
      )}

      {/* 页码选择 sheet */}
      {sheet === 'page' && (
        <Sheet title="跳转到">
          <div className="px-4 pb-3 grid grid-cols-5 gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={pg}
                {...bindTap({ kind: 'action', id: 'groupPost.replies.page.select.target' }, {
                  params: { target: String(pg) },
                  onTrigger: () => {
                    setSearchParams((p) => {
                      p.set('page', String(pg));
                      p.delete('sheet');
                      return p;
                    }, { replace: true });
                  },
                })}
                className="h-10 rounded-lg text-sm border cursor-pointer"
                style={{ background: page === pg ? C.greenSoft : '#F7F7F7', color: page === pg ? C.green : C.text, borderColor: 'transparent' }}
              >
                {pg}
              </button>
            ))}
          </div>
        </Sheet>
      )}

      {/* 楼主帖操作菜单 */}
      {sheet === 'menu' && (
        <Sheet>
          <SheetRow
            label="移出小组"
            bind={bindTap({ kind: 'action', id: 'groupPost.ownerMenu.removeFromGroup' }, {
              onTrigger: () => {
                detachGroupPost(topicId);
                closeSheet();
                toast('已移出小组');
              },
            })}
          />
          <SheetRow
            label="删除"
            danger
            bind={bindTap({ kind: 'action', id: 'groupPost.ownerMenu.deleteConfirm' }, { onTrigger: () => openSheet('delete') })}
          />
        </Sheet>
      )}

      {/* 删除二次确认 */}
      {sheet === 'delete' && (
        <CenterDialog
          title="确认删除该讨论?"
          buttons={[
            { label: '取消', bind: bindBack() },
            {
              label: '删除',
              danger: true,
              bind: bindTap({ kind: 'action', id: 'groupPost.ownerMenu.deleteConfirm' }, {
                params: { confirm: 1 },
                onTrigger: () => {
                  deleteGroupPost(topicId);
                  toast('已删除');
                  back(2);
                },
              }),
            },
          ]}
        />
      )}
    </div>
  );
}

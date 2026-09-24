/**
 * 帖子详情页(spec post.detail):作者区+正文+配图+评论区+底部互动栏。
 * 弹层:?panel=comment 评论输入面板;?panel=viewer 配图全屏大图(URL驱动,返回键可关)。
 * 证据 anchor 111。
 */
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, Img, TopBar, useToast, usePanel } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcMoreH, IcHeart, IcStar, IcComment, IcClose, IcEmoji, IcImage, IcSend } from '../res/icons';
import { timeAgo } from '../components/PostCard';
import type { Comment } from '../types';

const REPLY_GOAL = 10; // 「再评N字可被更多回复」阈值

export default function PostDetailPage() {
  const { id = '' } = useParams();
  const { bindTap, bindBack, back } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const { value: panel, open: openPanel } = usePanel('panel');

  const posts = useMeiyouStore((st) => st.posts);
  const comments = useMeiyouStore((st) => st.comments);
  const likedPostIds = useMeiyouStore((st) => st.likedPostIds);
  const likedCommentIds = useMeiyouStore((st) => st.likedCommentIds);
  const favPostIds = useMeiyouStore((st) => st.favPostIds);
  const followedAuthors = useMeiyouStore((st) => st.followedAuthors);
  const likePost = useMeiyouStore((st) => st.likePost);
  const likeComment = useMeiyouStore((st) => st.likeComment);
  const favPost = useMeiyouStore((st) => st.favPost);
  const followAuthor = useMeiyouStore((st) => st.followAuthor);
  const addComment = useMeiyouStore((st) => st.addComment);

  const [draft, setDraft] = React.useState('');
  const [expandedFloors, setExpandedFloors] = React.useState<string[]>([]);
  const [viewerImg, setViewerImg] = React.useState('');

  const post = posts.find((p) => p.id === id);

  if (!post) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <TopBar title="帖子" />
        <div className="flex-1 flex items-center justify-center text-[13px] text-[#999]">{s.emptyList}</div>
      </div>
    );
  }

  const floors = comments[post.id] ?? [];
  const liked = likedPostIds.includes(post.id);
  const faved = favPostIds.includes(post.id);
  const followed = followedAuthors.includes(post.author.name);
  const remain = Math.max(0, REPLY_GOAL - draft.length);

  const sendComment = () => {
    const text = draft.trim();
    if (!text) return;
    addComment(post.id, text);
    setDraft('');
    back();
    showToast('感谢你的热心回复');
  };

  const renderComment = (c: Comment, isReply: boolean) => {
    const cLiked = likedCommentIds.includes(c.id);
    return (
      <div key={c.id} className={`flex gap-2.5 ${isReply ? 'mt-2.5' : 'py-3 border-b border-[#F5F5F5]'}`}>
        <Img src={c.author.avatar} className={`${isReply ? 'w-6 h-6' : 'w-8 h-8'} rounded-full object-cover shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] text-[#999] truncate">{c.author.name}</span>
            {c.isAuthor && (
              <span className="text-[9px] px-1 rounded shrink-0" style={{ color: MY.primary, background: '#FFE3ED' }}>作者</span>
            )}
          </div>
          <div className="mt-1 text-[14px] leading-snug text-[#1A1A1A]">{c.text}</div>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-[#999]">
            <span>{timeAgo(c.createdAt)}·{c.region}</span>
            <span>回复</span>
          </div>
          {c.replies.map((r) => renderComment(r, true))}
          {!isReply && !!c.hiddenReplies && (
            expandedFloors.includes(c.id) ? (
              <div className="mt-2 text-[11px] text-[#999]">更多回复暂未同步,仅展示部分热门回复</div>
            ) : (
              <button
                {...bindTap({ kind: 'action', id: 'post.replies.expand' }, {
                  params: { target: c.id },
                  onTrigger: () => setExpandedFloors((prev) => [...prev, c.id]),
                })}
                className="mt-2 text-[12px] bg-transparent border-none cursor-pointer p-0"
                style={{ color: '#5B7BB4' }}
              >
                — 展开{c.hiddenReplies}条回复 ∨
              </button>
            )
          )}
        </div>
        <button
          {...bindTap({ kind: 'action', id: 'post.comment.like' }, {
            params: { target: c.id },
            onTrigger: () => likeComment(c.id),
          })}
          className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer shrink-0 text-[11px]"
          style={{ color: cLiked ? MY.primary : '#999999' }}
          aria-label="赞"
        >
          <IcHeart size={15} fill={cLiked ? MY.primary : 'none'} />
          {c.likes + (cLiked ? 1 : 0)}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full relative bg-white">
      <TopBar
        rightContent={(
          <button
            {...bindTap({ kind: 'action', id: 'post.more.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
            className="w-9 h-9 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="更多"
          >
            <IcMoreH size={20} className="text-[#1A1A1A]" />
          </button>
        )}
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="post-body" data-scroll-direction="vertical">
        {/* 作者区 */}
        <div className="flex items-center gap-2.5 px-4 pt-3">
          <Img src={post.author.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-medium text-[#1A1A1A] truncate">{post.author.name}</span>
              {post.author.tag && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0" style={{ color: MY.ovulation, background: '#F0EBFC' }}>
                  {post.author.tag}
                </span>
              )}
            </div>
            <div className="text-[11px] text-[#999] mt-0.5">{timeAgo(post.createdAt)} 发布于 {post.region}</div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'post.follow.toggle' }, { onTrigger: () => followAuthor(post.author.name) })}
            className="px-3.5 h-7 rounded-full text-[12px] cursor-pointer shrink-0"
            style={followed
              ? { background: '#F2F2F4', color: '#999999', border: 'none' }
              : { background: 'transparent', color: MY.primary, border: `1px solid ${MY.primary}` }}
          >
            {followed ? s.followed : s.follow}
          </button>
        </div>

        {/* 正文+话题+配图 */}
        <div className="px-4 mt-3 text-[15.5px] leading-relaxed text-[#1A1A1A]">
          {post.text}
          {post.topics.map((t) => (
            <span key={t} className="ml-1" style={{ color: '#FF6E96' }}>{t}</span>
          ))}
        </div>
        {post.images.map((img) => (
          /* 配图点击开全屏大图:declaration 缺配图 open 动作 id,暂不打 data-action 标(见缺口清单) */
          <div key={img} className="px-4 mt-3 cursor-pointer" onClick={() => { setViewerImg(img); openPanel('viewer'); }}>
            <Img src={img} className="w-full rounded-xl object-cover" />
          </div>
        ))}

        {/* 评论区 */}
        <div className="mt-4 px-4 pb-6">
          <div className="text-[14px] font-semibold text-[#1A1A1A] py-2 border-b border-[#F5F5F5]">
            {post.commentCount}条回复
          </div>
          {floors.map((c) => renderComment(c, false))}
          {floors.length === 0 && (
            <div className="py-10 text-center text-[13px] text-[#999]">暂无回复,快来抢沙发</div>
          )}
        </div>
      </div>

      {/* 底部互动栏 */}
      <div className="shrink-0 bg-white border-t border-[#EEEEEE] px-3 flex items-center gap-4" style={{ height: 52 }}>
        <button
          {...bindTap({ kind: 'action', id: 'post.comment.input' }, { onTrigger: () => openPanel('comment') })}
          className="flex-1 h-9 rounded-full bg-[#F2F2F4] text-left px-3.5 text-[13px] text-[#999] border-none cursor-pointer truncate"
        >
          {s.commentPlaceholder}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'post.like.toggle' }, { onTrigger: () => likePost(post.id) })}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[12px]"
          style={{ color: liked ? MY.primary : '#666666' }}
          aria-label="赞"
        >
          <IcHeart size={19} fill={liked ? MY.primary : 'none'} />
          {post.likes}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'post.fav.toggle' }, { onTrigger: () => favPost(post.id) })}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[12px]"
          style={{ color: faved ? MY.primary : '#666666' }}
          aria-label="收藏"
        >
          <IcStar size={19} fill={faved ? MY.primary : 'none'} />
          收藏
        </button>
        <span className="flex items-center gap-1 text-[12px] text-[#666]">
          <IcComment size={19} />
          {post.commentCount}
        </span>
      </div>

      {/* 评论输入面板(?panel=comment) */}
      {panel === 'comment' && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" {...bindBack()} />
          <div className="relative bg-white rounded-t-2xl p-3" data-keep-keyboard="true">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={s.commentPlaceholder}
              data-action="post.comment.input"
              data-action-type="input"
              className="w-full h-20 bg-[#F5F5F7] rounded-lg p-2.5 text-[14px] text-[#1A1A1A] outline-none resize-none border-none box-border"
            />
            <div className="flex items-center mt-2" data-keep-keyboard="true">
              <span className="text-[11px] text-[#999]">
                {remain > 0 ? `再评${remain}字可被更多回复` : '棒!这条回复很有内容'}
              </span>
              <div className="flex-1" />
              <button
                {...bindTap({ kind: 'action', id: 'post.more.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
                aria-label="表情"
              >
                <IcEmoji size={20} className="text-[#666]" />
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'post.more.disabled' }, { onTrigger: () => showToast(NOT_OPEN) })}
                className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
                aria-label="图片"
              >
                <IcImage size={20} className="text-[#666]" />
              </button>
              <button
                {...bindTap({ kind: 'action', id: 'post.comment.send' }, { onTrigger: sendComment })}
                disabled={!draft.trim()}
                className="ml-1 px-3.5 h-8 rounded-full text-[13px] text-white border-none cursor-pointer flex items-center gap-1"
                style={{ background: draft.trim() ? MY.primary : '#FBC7D9' }}
              >
                <IcSend size={13} />
                {s.send}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 配图全屏大图(?panel=viewer) */}
      {panel === 'viewer' && (
        <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
          <Img src={viewerImg || post.images[0]} className="w-full max-h-full object-contain" />
          <button
            {...bindBack()}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 flex items-center justify-center border-none cursor-pointer"
            aria-label="关闭"
          >
            <IcClose size={20} className="text-white" />
          </button>
        </div>
      )}

      {toast}
    </div>
  );
}

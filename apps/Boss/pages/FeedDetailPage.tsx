import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useStrings } from '../hooks/useStrings';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { FEED_IMGS } from '../assets';
import { Avatar, MissingContent, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcChat, IcHeart, IcStar, IcShare, IcPlus } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';
import AsyncFsImage from '@/os/components/AsyncFsImage';

const C = BOSS_CONFIG;

/** 有了内容详情(IMG_8488/8489):全文 + 关注 + 底部评论输入 */
const FeedDetailPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const t = useStrings();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const postId = searchParams.get('postId') ?? '';
  const myPosts = useBossStore((s) => s.myPosts);
  const post = [...myPosts, ...C.feedPosts].find((p) => p.id === postId);
  const liked = useBossStore((s) => s.likedPostIds.includes(postId));
  const starred = useBossStore((s) => s.favoritePostIds.includes(postId));
  const followed = useBossStore((s) => s.followedAuthors.includes(post?.author.name ?? ''));
  const addedCommentCount = useBossStore((s) => s.myComments.filter((c) => c.postId === postId).length);
  const [comment, setComment] = useState('');

  if (!post) return <MissingContent text="动态不存在或已被移除" />;

  const submitComment = () => {
    const text = comment.trim();
    if (!text) return;
    store.addComment(post.id, text);
    store.showToast('评论已发布');
    setComment('');
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader
        title={
          <span className="flex items-center justify-center gap-2">
            <Avatar imgKey={post.author.avatar} name={post.author.name} size={28} />
            <span className="max-w-[140px] truncate text-[15px]">{post.author.name}</span>
          </span>
        }
        right={
          <button
            {...action('feeddetail.follow.toggle', () => store.toggleFollowAuthor(post.author.name), { params: {} })}
            className="flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full border px-3 py-1 text-[13px]"
            style={followed ? { borderColor: '#D1D5DB', color: '#9CA3AF' } : { borderColor: COLORS.primary, color: COLORS.primary }}
          >
            {followed ? '已关注' : <><IcPlus size={13} />关注</>}
          </button>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        <p className="whitespace-pre-wrap text-[17px] leading-relaxed text-gray-900">{post.fullText}</p>
        {post.topics.map((topic) => (
          <div key={topic} className="mt-3 text-[14px]" style={{ color: COLORS.accent }}># {topic}</div>
        ))}
        {post.img && FEED_IMGS[post.img] && (
          <img src={FEED_IMGS[post.img]} alt="" className="mt-3 w-full rounded-xl object-cover" />
        )}
        {(post.imageUris?.length ?? 0) > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            {post.imageUris!.map((src) => (
              src.startsWith('/sdcard/')
                ? <AsyncFsImage key={src} path={src} alt="" className="w-full rounded-xl object-cover" />
                : <img key={src} src={src} alt="" className="w-full rounded-xl object-cover" />
            ))}
          </div>
        )}
        {post.aiDeclared && <div className="mt-3 text-[12px] text-gray-400">作者声明：内容含 AI 合成</div>}
        <button {...bindTap('feeddetail.comments-open', { params: { postId: post.id } })} className="mt-4 w-full rounded-xl bg-[#F5F6F7] py-3 text-center text-[14px] text-gray-600">
          查看全部 {post.comments + addedCommentCount} 条评论
        </button>
      </div>

      {/* 底部:评论输入 + 三连 */}
      <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 bg-white px-4 py-2.5" data-keep-keyboard="true">
        <input
          {...({ 'data-action': 'feeddetail.comment.input', 'data-action-type': 'input' } as object)}
          data-keep-keyboard="true"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submitComment(); }}
          placeholder="我来说两句..."
          className="h-9 min-w-0 flex-1 rounded-full bg-[#F5F5F5] px-4 text-[14px] outline-none"
        />
        {comment ? (
          <button
            {...action('feeddetail.comment.send', submitComment, { params: { value: comment } })}
            data-keep-keyboard="true"
            className="shrink-0 rounded-full px-4 py-1.5 text-[14px] text-white"
            style={{ backgroundColor: COLORS.primaryBtn }}
          >
            发送
          </button>
        ) : (
          <>
            <span className="flex flex-col items-center text-gray-600"><IcChat size={20} /><span className="text-[11px]">{post.comments + addedCommentCount}</span></span>
            <button
              {...action('feeddetail.like.toggle', () => store.toggleLikePost(post.id), { params: {} })}
              className="flex flex-col items-center"
              style={liked ? { color: '#EB5757' } : { color: '#4B5563' }}
            >
              <IcHeart size={20} fill={liked ? '#EB5757' : 'none'} /><span className="text-[11px]">{post.likes + (liked ? 1 : 0)}</span>
            </button>
            <button
              {...action('feeddetail.like.toggle', () => store.toggleFavoritePost(post.id), { params: {} })}
              className="flex flex-col items-center"
              style={starred ? { color: '#F7B733' } : { color: '#4B5563' }}
            >
              <IcStar size={20} fill={starred ? '#F7B733' : 'none'} /><span className="text-[11px]">{post.stars + (starred ? 1 : 0)}</span>
            </button>
            <button {...action('feeddetail.share.system', () => {
              const launched = sharePlainText(`【BOSS直聘·有了】${post.author.name}：${post.fullText}`, {
                onResult: (r) => { if (r.resultCode === 'OK') store.showToast(t.shareSuccess); },
              });
              if (!launched) store.showNotice('当前环境无法打开系统分享，请点击“我知道了”返回。');
            }, { params: {} })} className="flex flex-col items-center text-gray-600">
              <IcShare size={20} /><span className="text-[11px]">分享</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedDetailPage;

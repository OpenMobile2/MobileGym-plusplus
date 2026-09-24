/** 帖子卡(feed/圈子/个人主页复用)。广告卡带×与CTA(toast)。 */
import React from 'react';
import * as TimeService from '@/os/TimeService';
import type { Post } from '../types';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, NOT_OPEN, Img } from './ui';
import { IcHeart, IcComment, IcClose, IcMoreV } from '../res/icons';

export function timeAgo(ts: number): string {
  const diff = TimeService.now() - ts;
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return '刚刚';
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

export function PostCard({
  post, showToast, likeActionId = 'home.post.like', dismissActionId = 'home.ad.dismiss', adActionId = 'circle.ad.disabled',
}: {
  post: Post;
  showToast: (m: string) => void;
  likeActionId?: string;
  dismissActionId?: string;
  adActionId?: string;
}) {
  const { bindTap } = useMeiyouGestures();
  const likePost = useMeiyouStore((s) => s.likePost);
  const dismissAd = useMeiyouStore((s) => s.dismissAd);
  const liked = useMeiyouStore((s) => s.likedPostIds).includes(post.id);

  if (post.isAd) {
    return (
      <div className="bg-white rounded-xl p-3 relative">
        <button
          {...bindTap({ kind: 'action', id: dismissActionId }, { params: { target: post.id }, onTrigger: () => dismissAd(post.id), stopPropagation: true })}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-transparent border-none cursor-pointer z-10"
          aria-label="关闭广告"
        >
          <IcClose size={14} className="text-[#BBB]" />
        </button>
        <div className="flex items-center gap-2">
          <Img src={post.author.avatar} className="w-8 h-8 rounded-full object-cover" />
          <span className="text-[13px] text-[#666]">{post.adBrand}</span>
          <span className="text-[9px] text-[#999] border border-[#DDD] rounded px-1">广告</span>
        </div>
        <div className="mt-2 text-[14px] text-[#1A1A1A]">{post.text}</div>
        {post.images[0] && <Img src={post.images[0]} className="mt-2 w-full h-36 object-cover rounded-lg" />}
        <button
          {...bindTap({ kind: 'action', id: adActionId }, { onTrigger: () => showToast(NOT_OPEN) })}
          className="mt-2 px-3 h-7 rounded-full text-[12px] text-white border-none cursor-pointer"
          style={{ background: MY.primary }}
        >
          {post.adCta ?? '查看详情'}
        </button>
      </div>
    );
  }

  return (
    <div
      {...bindTap('meiyou.postdetail-open', { params: { id: post.id } })}
      className="bg-white rounded-xl p-3 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <Img src={post.author.avatar} className="w-9 h-9 rounded-full object-cover" />
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-[#1A1A1A] truncate">{post.author.name}</div>
          {post.author.tag && <div className="text-[10px]" style={{ color: MY.ovulation }}>{post.author.tag}</div>}
        </div>
        <IcMoreV size={16} className="text-[#CCC]" />
      </div>
      <div className="mt-2 text-[14.5px] leading-snug text-[#1A1A1A] line-clamp-3">
        {post.text}
        {post.topics.map((t) => (
          <span key={t} className="ml-1" style={{ color: '#FF6E96' }}>{t}</span>
        ))}
      </div>
      {post.images.length > 0 && (
        <div className="mt-2 flex gap-1.5">
          {post.images.slice(0, 3).map((img) => (
            <Img key={img} src={img} className="flex-1 h-28 object-cover rounded-lg min-w-0" />
          ))}
        </div>
      )}
      {post.replyPreview && (
        <div className="mt-2 bg-[#F7F7F9] rounded-lg px-2.5 py-2 text-[12px] text-[#666] line-clamp-2">
          <span className="font-medium" style={{ color: MY.primary }}>姐妹回复 </span>
          {post.replyPreview}
        </div>
      )}
      <div className="mt-2.5 flex items-center justify-end gap-5 text-[#999]">
        <button
          {...bindTap({ kind: 'action', id: likeActionId }, { params: { target: post.id }, onTrigger: () => likePost(post.id), stopPropagation: true })}
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-[12px]"
          style={{ color: liked ? MY.primary : '#999' }}
        >
          <IcHeart size={16} fill={liked ? MY.primary : 'none'} />
          {post.likes}
        </button>
        <span className="flex items-center gap-1 text-[12px]">
          <IcComment size={16} />
          {post.commentCount}
        </span>
      </div>
    </div>
  );
}

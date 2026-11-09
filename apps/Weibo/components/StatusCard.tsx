import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { Img, VBadge, VipCrown, fmtCount, FollowBtn, useToast, useStrings } from './ui';
import { IcRepost, IcComment, IcLike, IcDown } from '../res/icons';
import * as TimeService from '@/os/TimeService';
import type { WbStatus, WbUser } from '../types';
import type { TransitionId } from '../navigation.declaration';

export function fmtTime(ts: number): string {
  const diff = TimeService.now() - ts;
  if (diff < 60_000) return '刚刚';
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}分钟前`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}小时前`;
  if (diff < 172800_000) return '昨天';
  const d = TimeService.fromTimestamp(ts);
  return `${d.getMonth() + 1}-${d.getDate()}`;
}

/** 正文富文本:#话题# @人 ◇超话 着色(蓝链) */
export function RichText({ text, className }: { text: string; className?: string }) {
  const parts = text.split(/(#[^#\s]{1,30}#|@[\w一-龥_-]{1,20}|◇[^\s,,。!!??]{1,20})/g);
  return (
    <span className={className}>
      {parts.map((p, i) => {
        if (/^#.+#$/.test(p) || /^@/.test(p)) {
          return <span key={i} className="text-[#5077BE]">{p}</span>;
        }
        if (/^◇/.test(p)) {
          return <span key={i} className="text-[#E68A3C]">{p}</span>;
        }
        return <React.Fragment key={i}>{p}</React.Fragment>;
      })}
    </span>
  );
}

/** 图片宫格(1/3/9) */
export function ImageGrid({
  images, statusId, tappable,
}: {
  images: string[];
  statusId?: string;
  tappable?: boolean;
}) {
  const { bindTap } = useWeiboGestures();
  if (!images.length) return null;
  const cols = images.length === 1 ? 1 : images.length === 2 || images.length === 4 ? 2 : 3;
  return (
    <div
      className={`grid gap-1 mt-2 ${cols === 1 ? 'grid-cols-1 max-w-[240px]' : cols === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
    >
      {images.slice(0, 9).map((src, i) => {
        const binding = tappable && statusId
          ? bindTap('status.image-open' as TransitionId, { params: { id: statusId, idx: i }, stopPropagation: true })
          : {};
        return (
          <div key={i} {...binding} className={`${cols === 1 ? 'aspect-[4/3]' : 'aspect-square'} overflow-hidden rounded-md bg-[#F5F5F5]`}>
            <Img src={src} label="图" className="w-full h-full object-cover" />
          </div>
        );
      })}
    </div>
  );
}

/**
 * 微博卡片。openTransition 指定「点正文进详情」的 transitionId(随来源页不同)。
 * showFollow=未关注作者时显示 +关注(卡片流形态)。
 */
/** ID 必须字符串字面量(AGENTS 合同):按来源页逐字面量绑定 */
function useOpenBinding() {
  const { bindTap } = useWeiboGestures();
  return (tid: TransitionId, params: Record<string, string | number>) => {
    switch (tid) {
      case 'home.status-open': return bindTap('home.status-open', { params });
      case 'discover.status-open': return bindTap('discover.status-open', { params });
      case 'searchResult.status-open': return bindTap('searchResult.status-open', { params });
      case 'supertopic.status-open': return bindTap('supertopic.status-open', { params });
      case 'supertopicSquare.status-open': return bindTap('supertopicSquare.status-open', { params });
      case 'profileOther.status-open': return bindTap('profileOther.status-open', { params });
      case 'profileSelf.status-open': return bindTap('profileSelf.status-open', { params });
      case 'myPosts.status-open': return bindTap('myPosts.status-open', { params });
      case 'myLikes.status-open': return bindTap('myLikes.status-open', { params });
      case 'history.status-open': return bindTap('history.status-open', { params });
      case 'home.user-open': return bindTap('home.user-open', { params, stopPropagation: true });
      case 'searchResult.user-open': return bindTap('searchResult.user-open', { params, stopPropagation: true });
      case 'supertopic.user-open': return bindTap('supertopic.user-open', { params, stopPropagation: true });
      default: return bindTap('home.status-open', { params });
    }
  };
}

export function StatusCard({
  status, openTransition, userTransition, showFollow = true, hideActions = false,
}: {
  status: WbStatus;
  openTransition: TransitionId;
  userTransition?: TransitionId;
  showFollow?: boolean;
  hideActions?: boolean;
}) {
  const { bindTap } = useWeiboGestures();
  const openBind = useOpenBinding();
  const sx = useStrings();
  const [toastNode, toast] = useToast();
  const users = useWeiboStore((s) => s.users);
  const me = useWeiboStore((s) => s.me);
  const likedIds = useWeiboStore((s) => s.likedStatusIds);
  const toggleLike = useWeiboStore((s) => s.toggleLikeStatus);
  const followUser = useWeiboStore((s) => s.followUser);
  const statuses = useWeiboStore((s) => s.statuses);

  const author: WbUser | undefined =
    status.userId === 'me' ? ({ ...me, followedByMe: true } as unknown as WbUser) : users.find((u) => u.id === status.userId);
  const liked = likedIds.includes(status.id) || status.likedByMe;
  const original = status.repostOf ? statuses.find((x) => x.id === status.repostOf) : undefined;
  const origAuthor = original ? users.find((u) => u.id === original.userId) : undefined;

  return (
    <div className="bg-white px-3 pt-3 pb-1 mb-2 relative">
      {/* 头部 */}
      <div className="flex items-start gap-2">
        <div
          {...(userTransition && status.userId !== 'me'
            ? openBind(userTransition, { id: status.userId })
            : {})}
          className="shrink-0"
        >
          <Img src={author?.avatar} label={author?.name?.[0] ?? '博'} className="w-11 h-11 rounded-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[15px] font-medium text-[#E68A3C] truncate">{author?.name}</span>
            <VBadge type={author?.verified} />
            <VipCrown level={author?.vipLevel} />
          </div>
          <div className="text-[12px] text-[#9A9A9A] mt-0.5">
            {fmtTime(status.timestamp)} · 来自{status.source}
            {status.edited && ' · 已编辑'}
          </div>
        </div>
        {showFollow && author && status.userId !== 'me' && !author.followedByMe ? (
          <FollowBtn
            binding={bindTap({ kind: 'action', id: 'home.card.follow.toggle' }, {
              params: { userId: status.userId },
              stopPropagation: true,
              onTrigger: () => followUser(status.userId),
            })}
          />
        ) : (
          <button
            {...bindTap({ kind: 'action', id: 'home.card.fold.stub' }, { stopPropagation: true, onTrigger: () => toast(sx.notOpen) })}
            className="text-[#BBBBBB] bg-transparent border-none p-1 cursor-pointer"
          >
            <IcDown size={16} />
          </button>
        )}
      </div>

      {/* 正文(点击进详情) */}
      <div {...openBind(openTransition, { id: status.id })} className="cursor-pointer">
        <RichText text={status.text} className="block text-[16px] leading-[1.55] text-[#1A1A1A] mt-2 break-words" />
        {original && (
          <div className="mt-2 bg-[#F7F7F7] rounded-md p-2">
            <RichText
              text={`@${origAuthor?.name ?? '微博用户'}:${original.text.slice(0, 60)}${original.text.length > 60 ? '…' : ''}`}
              className="text-[14px] text-[#5B5B5B] leading-snug"
            />
            {original.images.length > 0 && (
              <div className="w-16 h-16 mt-1 rounded overflow-hidden">
                <Img src={original.images[0]} label="图" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}
        <ImageGrid images={status.images} statusId={status.id} />
        {status.isVideo && status.images.length > 0 && (
          <div className="text-[11px] text-[#9A9A9A] mt-1">▶ 视频 · {fmtCount(status.likes * 3)}次观看</div>
        )}
        {status.hotComment && (
          <div className="flex items-center gap-1.5 bg-[#FFF7F0] rounded-md px-2 py-1.5 mt-2">
            <span className="text-[10px] text-white bg-[#FF6533] rounded px-1 leading-4 shrink-0">热评</span>
            <span className="text-[13px] text-[#5B5B5B] truncate flex-1">{status.hotComment.text}</span>
            <span className="text-[12px] text-[#9A9A9A] shrink-0">👍{fmtCount(status.hotComment.likes)}</span>
          </div>
        )}
      </div>

      {/* 操作条 */}
      {!hideActions && (
        <div className="flex items-center mt-1 border-t border-[#FAFAFA]">
          <button
            {...(openTransition === 'home.status-open'
              ? bindTap('home.status-open-tab', { params: { id: status.id, tab: 'reposts' } })
              : openBind(openTransition, { id: status.id }))}
            className="flex-1 flex items-center justify-center gap-1 h-9 text-[#7F7F7F] text-[13px] bg-transparent border-none cursor-pointer"
            data-role="card-repost"
          >
            <IcRepost size={17} />
            {status.reposts > 0 ? fmtCount(status.reposts) : '转发'}
          </button>
          <button
            {...(openTransition === 'home.status-open'
              ? bindTap('home.status-open-tab', { params: { id: status.id, tab: 'comments' } })
              : openBind(openTransition, { id: status.id }))}
            className="flex-1 flex items-center justify-center gap-1 h-9 text-[#7F7F7F] text-[13px] bg-transparent border-none cursor-pointer"
            data-role="card-comment"
          >
            <IcComment size={17} />
            {status.comments > 0 ? fmtCount(status.comments) : '评论'}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'home.card.like.toggle' }, {
              params: { statusId: status.id },
              stopPropagation: true,
              onTrigger: () => toggleLike(status.id),
            })}
            className={`flex-1 flex items-center justify-center gap-1 h-9 text-[13px] bg-transparent border-none cursor-pointer ${liked ? 'text-[#FF6533]' : 'text-[#7F7F7F]'}`}
          >
            <IcLike size={17} fill={liked ? '#FF6533' : 'none'} />
            {status.likes > 0 ? fmtCount(status.likes) : '赞'}
          </button>
        </div>
      )}
      {toastNode}
    </div>
  );
}

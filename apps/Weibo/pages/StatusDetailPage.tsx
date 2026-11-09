import React, { useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { RichText, ImageGrid, fmtTime } from '../components/StatusCard';
import { useStrings, useToast, Img, VBadge, VipCrown, fmtCount, FollowBtn, TopBar } from '../components/ui';
import { RELATED_SEARCH } from '../constants';
import {
  IcRepost, IcComment, IcLike, IcStar, IcMore, IcListen, IcRefresh, IcClose, IcEmoji, IcImage, IcAt,
} from '../res/icons';
import type { WbComment } from '../types';
import { sharePlainText } from '@/os/shareBridge';
import * as TimeService from '@/os/TimeService';

function CommentRow({
  c, statusId, depth = 0,
}: {
  c: WbComment;
  statusId: string;
  depth?: number;
}) {
  const { bindTap } = useWeiboGestures();
  const users = useWeiboStore((s) => s.users);
  const me = useWeiboStore((s) => s.me);
  const toggleLikeComment = useWeiboStore((s) => s.toggleLikeComment);
  const [, setSearchParams] = useSearchParams();
  const u = c.userId === 'me' ? me : users.find((x) => x.id === c.userId);

  return (
    <div className={`flex gap-2 ${depth ? 'mt-2' : 'px-3 py-2.5 border-b border-[#FAFAFA]'}`}>
      <Img src={u?.avatar} label={u?.name?.[0] ?? '评'} className={`${depth ? 'w-6 h-6' : 'w-9 h-9'} rounded-full object-cover shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-[13px] text-[#E68A3C]">{u?.name}</span>
          {c.fanBadge && <span className="text-[9px] text-[#8A5A00] bg-[#FFE9B8] rounded px-1">{c.fanBadge}</span>}
          {c.hot && <span className="text-[9px] text-white bg-[#FF6533] rounded px-1">热评</span>}
        </div>
        <div
          {...bindTap({ kind: 'action', id: 'status.replyPanel.open' }, {
            params: { commentId: c.id },
            onTrigger: () => setSearchParams((p) => { p.set('panel', 'comment'); p.set('cid', c.id); return p; }, { replace: true }),
          })}
          className="cursor-pointer"
        >
          <RichText
            text={c.replyTo ? `回复@${c.replyTo}:${c.text}` : c.text}
            className="block text-[15px] text-[#1A1A1A] leading-snug mt-0.5"
          />
        </div>
        <div className="flex items-center gap-3 mt-1 text-[11px] text-[#9A9A9A]">
          <span>{fmtTime(c.timestamp)} {c.region}</span>
          <span className="flex-1" />
          <button
            aria-label={c.likedByMe ? '取消点赞评论' : '点赞评论'}
            {...bindTap({ kind: 'action', id: 'status.comment.like.toggle' }, {
              params: { commentId: c.id },
              stopPropagation: true,
              onTrigger: () => toggleLikeComment(statusId, c.id),
            })}
            className={`flex items-center gap-0.5 bg-transparent border-none cursor-pointer ${c.likedByMe ? 'text-[#FF6533]' : 'text-[#9A9A9A]'}`}
          >
            <IcLike size={13} fill={c.likedByMe ? '#FF6533' : 'none'} />
            {c.likes > 0 ? fmtCount(c.likes) : ''}
          </button>
        </div>
        {depth === 0 && c.replies.length > 0 && (
          <div className="bg-[#F7F7F7] rounded-md px-2 py-1.5 mt-1.5">
            {c.replies.slice(0, 2).map((r) => (
              <CommentRow key={r.id} c={r} statusId={statusId} depth={1} />
            ))}
            <button
              {...bindTap('status.replies-open', { params: { id: statusId, cid: c.id } })}
              className="text-[12px] text-[#5077BE] bg-transparent border-none cursor-pointer mt-1 pl-8"
            >
              共{c.replies.length}条回复 &gt;
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function StatusDetailPage() {
  const s = useStrings();
  const { id = '' } = useParams();
  const { bindTap, bindBack } = useWeiboGestures();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toastNode, toast] = useToast();

  const statuses = useWeiboStore((st) => st.statuses);
  const users = useWeiboStore((st) => st.users);
  const me = useWeiboStore((st) => st.me);
  const likedIds = useWeiboStore((st) => st.likedStatusIds);
  const favorites = useWeiboStore((st) => st.favorites);
  const toggleLike = useWeiboStore((st) => st.toggleLikeStatus);
  const toggleFavorite = useWeiboStore((st) => st.toggleFavorite);
  const followUser = useWeiboStore((st) => st.followUser);
  const addComment = useWeiboStore((st) => st.addComment);

  const status = statuses.find((x) => x.id === id);
  const author = status?.userId === 'me' ? me : users.find((u) => u.id === status?.userId);

  const tab = (searchParams.get('tab') as 'reposts' | 'comments' | 'likes') || 'comments';
  const panelOpen = searchParams.get('panel') === 'comment';
  const replyCid = searchParams.get('cid');

  const [sortHot, setSortHot] = useState(true);
  const [followBarVisible, setFollowBarVisible] = useState(true);
  const [likeAnim, setLikeAnim] = useState(false);
  const [draft, setDraft] = useState('');
  const [alsoRepost, setAlsoRepost] = useState(false);

  const liked = !!status && (likedIds.includes(status.id) || status.likedByMe);
  const faved = !!status && (favorites.includes(status.id) || status.favoritedByMe);

  const comments = useMemo(() => {
    if (!status) return [];
    const list = [...status.commentList];
    return sortHot ? list.sort((a, b) => b.likes - a.likes) : list.sort((a, b) => b.timestamp - a.timestamp);
  }, [status, sortHot]);

  if (!status) {
    return (
      <div className="flex flex-col h-full bg-white">
        <TopBar backBinding={bindBack()} title="微博正文" />
        <div className="flex-1 flex items-center justify-center text-[#9A9A9A]">抱歉,此微博已被删除。</div>
      </div>
    );
  }

  const replyTarget = replyCid
    ? status.commentList.flatMap((c) => [c, ...c.replies]).find((c) => c.id === replyCid)
    : undefined;
  const replyUser = replyTarget ? (replyTarget.userId === 'me' ? me : users.find((u) => u.id === replyTarget.userId)) : undefined;

  const closePanel = () => setSearchParams((p) => { p.delete('panel'); p.delete('cid'); return p; }, { replace: true });

  const submitComment = () => {
    if (!draft.trim()) return;
    addComment(status.id, draft.trim(), replyCid ?? undefined, alsoRepost);
    setDraft('');
    setAlsoRepost(false);
    closePanel();
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <TopBar
        backBinding={bindBack()}
        center={
          <div className="flex flex-col items-center leading-tight">
            <span className="text-[15px] font-semibold">微博正文</span>
          </div>
        }
        right={
          <>
            <IcListen size={18} className="text-[#5B5B5B]" />
            <IcRefresh size={16} className="text-[#5B5B5B]" />
            <button
              {...bindTap({ kind: 'action', id: 'status.moreMenu.stub' }, { onTrigger: () => toast(s.notOpen) })}
              className="bg-transparent border-none cursor-pointer text-[#5B5B5B] p-0"
            >
              <IcMore size={18} />
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto" data-scroll-container="status-detail" data-scroll-direction="vertical">
        {/* 博主区 */}
        <div className="flex items-center gap-2 px-3 pt-3">
          <div {...bindTap('status.user-open', { params: { id: status.userId } })}>
            <Img src={author?.avatar} label={author?.name?.[0] ?? '博'} className="w-10 h-10 rounded-full object-cover" />
          </div>
          <div className="flex-1 min-w-0" {...bindTap('status.user-open', { params: { id: status.userId } })}>
            <div className="flex items-center gap-1">
              <span className="text-[15px] font-medium text-[#E68A3C] truncate">{author?.name}</span>
              <VBadge type={(author as { verified?: 'person' | 'org' })?.verified} />
              <VipCrown level={(author as { vipLevel?: number })?.vipLevel} />
            </div>
            <div className="text-[11px] text-[#9A9A9A]">
              {fmtTime(status.timestamp)} · 来自{status.source} · 发布于 江苏
            </div>
          </div>
          <button
            aria-label={faved ? '取消收藏微博' : '收藏微博'}
            {...bindTap({ kind: 'action', id: 'status.favorite.toggle' }, {
              params: { statusId: status.id },
              onTrigger: () => { toggleFavorite(status.id); toast(faved ? '已取消收藏' : s.favSuccess); },
            })}
            className={`bg-transparent border-none cursor-pointer p-1 ${faved ? 'text-[#FFB300]' : 'text-[#9A9A9A]'}`}
          >
            <IcStar size={20} fill={faved ? '#FFB300' : 'none'} />
          </button>
          {status.userId !== 'me' && !(author as { followedByMe?: boolean })?.followedByMe && (
            <FollowBtn
              binding={bindTap({ kind: 'action', id: 'status.author.follow.toggle' }, {
                params: { userId: status.userId },
                onTrigger: () => { followUser(status.userId); setFollowBarVisible(false); },
              })}
            />
          )}
        </div>

        {/* 正文 */}
        <div className="px-3 mt-2">
          <div className="text-[17px] leading-[1.6] text-[#1A1A1A] break-words">
            {status.text.split(/(#[^#\s]{1,30}#)/g).map((part, i) =>
              /^#.+#$/.test(part) ? (
                <span
                  key={i}
                  {...bindTap('status.topiclink-open', { params: { q: part } })}
                  className="text-[#5077BE] cursor-pointer"
                >
                  {part}
                </span>
              ) : (
                <RichText key={i} text={part} />
              ),
            )}
          </div>
          <ImageGrid images={status.images} statusId={status.id} tappable />
        </div>

        {/* 大家都在搜 */}
        <div className="flex gap-2 px-3 mt-3 overflow-x-auto" data-scroll-container="related-search" data-scroll-direction="horizontal">
          {RELATED_SEARCH.map((w) => (
            <button
              key={w}
              {...bindTap('status.searchword-open', { params: { q: w } })}
              className="shrink-0 text-[12px] text-[#5B5B5B] bg-[#F5F5F5] rounded-full px-2.5 py-1 border-none cursor-pointer"
            >
              🔍 {w}
            </button>
          ))}
        </div>

        {/* 分享图标行 */}
        <div className="flex justify-around px-3 py-3 border-b border-[#F7F7F7] mt-1">
          {['智搜', '微信', '朋友圈', 'QQ', '保存图片'].map((name) => (
            <button
              key={name}
              {...bindTap({ kind: 'action', id: name === '保存图片' ? 'status.share.saveImage' : 'status.share.stub' }, {
                onTrigger: () => {
                  if (name === '保存图片') {
                    const src = status?.images?.[0];
                    if (!src) { toast(s.notOpen); return; }
                    void import('@/os/albumBridge').then(({ saveImageToAlbum }) =>
                      saveImageToAlbum(src, {
                        album: 'Saved',
                        fileName: `weibo_${status?.id || 'x'}_${TimeService.now()}.jpg`,
                        mimeType: 'image/jpeg',
                      }).then((saved) => toast(saved ? '已保存到系统相册' : s.notOpen)),
                    );
                    return;
                  }
                  const launched = sharePlainText('【微博】动态分享', { onResult: (r) => { if (r.resultCode === 'OK') toast('分享成功'); } });
                  if (!launched) toast(s.notOpen);
                },
              })}
              className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer"
            >
              <span className="w-9 h-9 rounded-full bg-[#F5F5F5] flex items-center justify-center text-[16px]">
                {name === '智搜' ? '✨' : name === '微信' ? '💬' : name === '朋友圈' ? '🌐' : name === 'QQ' ? '🐧' : '💾'}
              </span>
              <span className="text-[10px] text-[#7F7F7F]">{name}</span>
            </button>
          ))}
        </div>

        {/* 关注推荐横滑 */}
        <div className="px-3 py-2 border-b border-[#F7F7F7]">
          <div className="text-[13px] text-[#7F7F7F] mb-2">关注推荐</div>
          <div className="flex gap-2 overflow-x-auto" data-scroll-container="reco-follow" data-scroll-direction="horizontal">
            {users.filter((u) => !u.followedByMe).slice(0, 5).map((u) => (
              <div key={u.id} className="shrink-0 w-24 bg-[#FAFAFA] rounded-lg p-2 flex flex-col items-center gap-1">
                <Img src={u.avatar} label={u.name[0]} className="w-10 h-10 rounded-full object-cover" />
                <span className="text-[11px] text-[#1A1A1A] truncate w-full text-center">{u.name}</span>
                <FollowBtn
                  size="sm"
                  binding={bindTap({ kind: 'action', id: 'status.recoFollow.toggle' }, {
                    params: { userId: u.id },
                    onTrigger: () => followUser(u.id),
                  })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 相关视频横滑 */}
        <div className="px-3 py-2 border-b border-[#F7F7F7]">
          <div className="text-[13px] text-[#7F7F7F] mb-2">相关视频</div>
          <div className="flex gap-2 overflow-x-auto" data-scroll-container="related-videos" data-scroll-direction="horizontal">
            {statuses.filter((x) => x.isVideo && x.id !== status.id).slice(0, 3).map((v) => (
              <button
                key={v.id}
                {...bindTap({ kind: 'action', id: 'status.relatedVideo.stub' }, { onTrigger: () => toast(s.notOpen) })}
                className="shrink-0 w-32 bg-transparent border-none cursor-pointer p-0 text-left"
              >
                <div className="w-32 h-20 rounded-lg overflow-hidden relative">
                  <Img src={v.images[0]} label="视" className="w-full h-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center text-white/80 text-[20px]">▶</span>
                </div>
                <div className="text-[11px] text-[#5B5B5B] truncate mt-1">{v.text.slice(0, 18)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 互动 tab 条 */}
        <div className="flex items-center px-3 h-10 border-b border-[#F7F7F7] sticky top-0 bg-white z-10">
          {([['reposts', `${s.repost} ${fmtCount(status.reposts)}`], ['comments', `${s.comment} ${fmtCount(status.comments)}`], ['likes', `${s.like} ${fmtCount(status.likes)}`]] as const).map(([t, label]) => (
            <button
              key={t}
              {...bindTap({ kind: 'action', id: 'status.tab.select.target' }, {
                params: { target: t },
                onTrigger: () => setSearchParams((p) => { t === 'comments' ? p.delete('tab') : p.set('tab', t); return p; }, { replace: true }),
              })}
              className={`mr-5 text-[14px] bg-transparent border-none cursor-pointer relative pb-1 ${tab === t ? 'font-bold text-[#1A1A1A]' : 'text-[#7F7F7F]'}`}
            >
              {label}
              {tab === t && <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-5 h-0.5 rounded bg-[#FF8200]" />}
            </button>
          ))}
          <span className="flex-1" />
          {tab === 'comments' && (
            <button
              {...bindTap({ kind: 'action', id: 'status.commentSort.toggle' }, { onTrigger: () => setSortHot((v) => !v) })}
              className="text-[12px] text-[#7F7F7F] bg-transparent border-none cursor-pointer"
            >
              按{sortHot ? '热度' : '时间'} ∨
            </button>
          )}
          {liked && <Img src={me.avatar} label="我" className="w-5 h-5 rounded-full ml-2" />}
        </div>

        {/* 列表区 */}
        {tab === 'comments' && comments.map((c) => <CommentRow key={c.id} c={c} statusId={status.id} />)}
        {tab === 'reposts' && (
          statuses.filter((x) => x.repostOf === status.id).length
            ? statuses.filter((x) => x.repostOf === status.id).map((r) => (
              <div key={r.id} className="flex gap-2 px-3 py-2.5 border-b border-[#FAFAFA]">
                <Img src={me.avatar} label="我" className="w-9 h-9 rounded-full object-cover" />
                <div>
                  <div className="text-[13px] text-[#E68A3C]">{r.userId === 'me' ? me.name : users.find((u) => u.id === r.userId)?.name}</div>
                  <RichText text={r.text} className="text-[14px] text-[#1A1A1A]" />
                  <div className="text-[11px] text-[#9A9A9A] mt-0.5">{fmtTime(r.timestamp)}</div>
                </div>
              </div>
            ))
            : <div className="text-center text-[13px] text-[#9A9A9A] py-10">还没有人转发</div>
        )}
        {tab === 'likes' && (
          <div className="px-3 py-3 flex flex-wrap gap-2">
            {(liked ? [me, ...users.slice(0, 8)] : users.slice(0, 8)).map((u, i) => (
              <div key={i} className="flex flex-col items-center w-14">
                <Img src={u.avatar} label={u.name[0]} className="w-10 h-10 rounded-full object-cover" />
                <span className="text-[10px] text-[#7F7F7F] truncate w-full text-center mt-1">{u.name}</span>
              </div>
            ))}
          </div>
        )}
        <div className="h-4" />
      </div>

      {/* 悬浮关注条 */}
      {followBarVisible && status.userId !== 'me' && !(author as { followedByMe?: boolean })?.followedByMe && (
        <div className="absolute bottom-14 left-3 right-3 bg-white rounded-full shadow-lg flex items-center gap-2 px-3 py-1.5 z-20">
          <Img src={author?.avatar} label={author?.name?.[0] ?? '博'} className="w-7 h-7 rounded-full object-cover" />
          <span className="flex-1 text-[13px] text-[#1A1A1A] truncate">{author?.name}</span>
          <FollowBtn
            binding={bindTap({ kind: 'action', id: 'status.author.follow.toggle' }, {
              params: { userId: status.userId },
              onTrigger: () => { followUser(status.userId); setFollowBarVisible(false); },
            })}
          />
          <button
            {...bindTap({ kind: 'action', id: 'status.followBar.close' }, { onTrigger: () => setFollowBarVisible(false) })}
            className="bg-transparent border-none cursor-pointer text-[#BBBBBB] p-0.5"
          >
            <IcClose size={16} />
          </button>
        </div>
      )}

      {/* 底部固定操作栏 */}
      <div className="flex items-center gap-2 px-3 h-12 border-t border-[#F2F2F2] bg-white shrink-0" data-keep-keyboard="true">
        <button
          {...bindTap('status.repost-open', { params: { id: status.id } })}
          className="flex items-center gap-1 text-[#5B5B5B] text-[13px] bg-transparent border-none cursor-pointer"
        >
          <IcRepost size={19} />
          {fmtCount(status.reposts)}
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'status.commentPanel.open' }, {
            onTrigger: () => setSearchParams((p) => { p.set('panel', 'comment'); return p; }, { replace: true }),
          })}
          className="flex-1 h-8 rounded-full bg-[#F5F5F5] text-left px-3 text-[13px] text-[#9A9A9A] border-none cursor-pointer"
        >
          {s.comment}…
        </button>
        <button
          aria-label={liked ? '取消点赞微博' : '点赞微博'}
          {...bindTap({ kind: 'action', id: 'status.like.toggle' }, {
            params: { statusId: status.id },
            onTrigger: () => {
              if (!liked) { setLikeAnim(true); window.setTimeout(() => setLikeAnim(false), 700); }
              toggleLike(status.id);
            },
          })}
          className={`flex items-center gap-1 text-[13px] bg-transparent border-none cursor-pointer ${liked ? 'text-[#FF6533]' : 'text-[#5B5B5B]'}`}
        >
          <IcLike size={19} fill={liked ? '#FF6533' : 'none'} />
          {fmtCount(status.likes)}
        </button>
      </div>

      {/* 点赞爆裂动画 */}
      {likeAnim && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center">
          <span className="text-[64px] animate-ping">👍</span>
        </div>
      )}

      {/* 评论/回复输入面板 */}
      {panelOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" {...bindTap({ kind: 'action', id: 'commentPanel.panel.close' }, { onTrigger: closePanel })} />
          <div className="relative bg-white rounded-t-2xl p-3" data-keep-keyboard="true">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={replyUser ? `回复@${replyUser.name}` : s.commentPlaceholder}
              data-action="commentPanel.text.input"
              data-action-type="input"
              className="w-full h-20 text-[15px] outline-none resize-none bg-[#F7F7F7] rounded-lg p-2"
            />
            <div className="flex items-center gap-3 mt-2">
              <label
                {...bindTap({ kind: 'action', id: 'commentPanel.alsoRepost.toggle' }, { onTrigger: () => setAlsoRepost((v) => !v) })}
                className="flex items-center gap-1 text-[12px] text-[#5B5B5B] cursor-pointer"
              >
                <span className={`w-4 h-4 rounded-sm border flex items-center justify-center text-[10px] ${alsoRepost ? 'bg-[#FF8200] border-[#FF8200] text-white' : 'border-[#CCCCCC]'}`}>
                  {alsoRepost ? '✓' : ''}
                </span>
                {s.alsoRepost}
              </label>
              <button
                {...bindTap({ kind: 'action', id: 'commentPanel.tools.stub' }, { onTrigger: () => toast(s.notOpen) })}
                className="flex items-center gap-2 bg-transparent border-none cursor-pointer text-[#7F7F7F]"
              >
                <IcImage size={18} />
                <IcAt size={18} />
              </button>
              <span className="flex-1" />
              <button
                {...bindTap({ kind: 'action', id: 'commentPanel.comment.submit' }, { onTrigger: submitComment })}
                disabled={!draft.trim()}
                className={`h-8 px-4 rounded-full text-white text-[13px] border-none cursor-pointer ${draft.trim() ? 'bg-[#FF8200]' : 'bg-[#FFCC99]'}`}
              >
                {s.comment}
              </button>
            </div>
            <div className="flex gap-2 mt-2 overflow-x-auto">
              {['😀', '😂', '🥹', '❤️', '👍', '🔥', '🎉', '😭'].map((e) => (
                <button
                  key={e}
                  {...bindTap({ kind: 'action', id: 'commentPanel.emoji.insert' }, { onTrigger: () => setDraft((d) => d + e) })}
                  className="text-[20px] bg-transparent border-none cursor-pointer shrink-0"
                >
                  {e}
                </button>
              ))}
              <IcEmoji size={20} className="text-[#9A9A9A] shrink-0 self-center" />
            </div>
          </div>
        </div>
      )}

      {toastNode}
    </div>
  );
}

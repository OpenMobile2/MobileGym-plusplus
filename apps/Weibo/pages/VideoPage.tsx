import React, { useState } from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useStrings, useToast, Img, fmtCount } from '../components/ui';
import { IcLike, IcComment, IcRepost, IcMore } from '../res/icons';

export default function VideoPage() {
  const s = useStrings();
  const { bindTap } = useWeiboGestures();
  const [toastNode, toast] = useToast();

  const statuses = useWeiboStore((st) => st.statuses);
  const users = useWeiboStore((st) => st.users);
  const likedIds = useWeiboStore((st) => st.likedStatusIds);
  const toggleLike = useWeiboStore((st) => st.toggleLikeStatus);
  const followUser = useWeiboStore((st) => st.followUser);

  const videos = statuses.filter((x) => x.isVideo && x.images.length);
  const [cur, setCur] = useState(0);
  const dragStart = React.useRef<number | null>(null);
  const video = videos[cur % Math.max(videos.length, 1)];
  const author = video ? users.find((u) => u.id === video.userId) : undefined;
  const liked = video ? likedIds.includes(video.id) || video.likedByMe : false;

  if (!video) return <div className="h-full bg-black" />;

  return (
    <div
      className="flex flex-col h-full bg-black relative"
      data-scroll-container="video-feed"
      data-scroll-direction="vertical"
      data-action="video.feed.next"
      data-action-type="other"
      onPointerDown={(e) => { dragStart.current = e.clientY; }}
      onPointerUp={(e) => {
        if (dragStart.current === null) return;
        const dy = e.clientY - dragStart.current;
        if (dy < -60) setCur((c) => (c + 1) % videos.length);
        else if (dy > 60) setCur((c) => (c - 1 + videos.length) % videos.length);
        dragStart.current = null;
      }}
    >
      {/* 顶部 tab */}
      <div className="flex items-center justify-center gap-5 h-10 shrink-0 z-10">
        {['推荐', '短剧', '播客'].map((t, i) => (
          <button
            key={t}
            {...bindTap({ kind: 'action', id: 'video.misc.stub' }, { onTrigger: () => (i === 0 ? undefined : toast(s.notOpen)) })}
            className={`text-[15px] bg-transparent border-none cursor-pointer ${i === 0 ? 'text-white font-bold' : 'text-white/60'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 视频画面(静态帧 mock) */}
      <div className="flex-1 relative overflow-hidden">
        <Img src={video.images[0]} label="视" className="w-full h-full object-cover" />
        <span className="absolute inset-0 flex items-center justify-center text-white/70 text-[48px]">▶</span>

        {/* 右侧操作栏 */}
        <div className="absolute right-2 bottom-24 flex flex-col items-center gap-4">
          <button
            {...bindTap({ kind: 'action', id: 'video.like.toggle' }, {
              params: { videoId: video.id },
              onTrigger: () => toggleLike(video.id),
            })}
            className={`flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer ${liked ? 'text-[#FF6533]' : 'text-white'}`}
          >
            <IcLike size={28} fill={liked ? '#FF6533' : 'none'} />
            <span className="text-[11px]">{fmtCount(video.likes)}</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'video.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="flex flex-col items-center gap-0.5 text-white bg-transparent border-none cursor-pointer"
          >
            <IcComment size={26} />
            <span className="text-[11px]">抢首评</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'video.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="flex flex-col items-center gap-0.5 text-white bg-transparent border-none cursor-pointer"
          >
            <IcRepost size={26} />
            <span className="text-[11px]">{s.repost}</span>
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'video.misc.stub' }, { onTrigger: () => toast(s.notOpen) })}
            className="text-white bg-transparent border-none cursor-pointer"
          >
            <IcMore size={24} />
          </button>
        </div>

        {/* 左下博主信息 */}
        <div className="absolute left-3 bottom-6 right-16">
          <div className="flex items-center gap-2">
            <Img src={author?.avatar} label={author?.name?.[0] ?? '博'} className="w-9 h-9 rounded-full object-cover border border-white/50" />
            <span className="text-[14px] text-white font-medium">{author?.name}</span>
            <span className="text-[11px] text-white/70">{fmtCount(author?.fans ?? 0)}粉丝</span>
            {!author?.followedByMe && (
              <button
                {...bindTap({ kind: 'action', id: 'video.follow.toggle' }, {
                  params: { userId: video.userId },
                  onTrigger: () => followUser(video.userId),
                })}
                className="h-6 px-2.5 rounded-full bg-[#FF8200] text-white text-[11px] border-none cursor-pointer"
              >
                {s.follow}
              </button>
            )}
          </div>
          <div className="text-[13px] text-white/90 mt-1.5 line-clamp-2">{video.text}</div>
        </div>
      </div>
      {toastNode}
    </div>
  );
}

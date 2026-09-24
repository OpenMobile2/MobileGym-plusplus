/**
 * 圈子页(spec circle.main):彩色渐变头图 + tab(热门/最新发帖/最新回复)+ 帖子流 + 发帖FAB + 发布横幅。
 * 证据 anchor 110;tab 状态走 ?tab=(replace)。
 */
import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useAppStrings } from '@/os/useAppStrings';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { MY, Img, TopBar, useToast } from '../components/ui';
import { strings } from '../res/strings';
import { stringsEn } from '../res/strings.en';
import { IcNavBack, IcSearch, IcPen, IcCheck } from '../res/icons';
import { PostCard } from '../components/PostCard';
import type { Post } from '../types';

const TAB_DEFS = [
  { id: 'hot', label: 'hotTab' },
  { id: 'new', label: 'newPostTab' },
  { id: 'reply', label: 'newReplyTab' },
] as const;

/** 最新回复 tab 的骨架屏 */
function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="bg-white rounded-xl p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-[#EEEEEE]" />
            <div className="h-3 w-24 rounded bg-[#EEEEEE]" />
          </div>
          <div className="mt-3 h-3 w-full rounded bg-[#F2F2F4]" />
          <div className="mt-2 h-3 w-2/3 rounded bg-[#F2F2F4]" />
        </div>
      ))}
    </div>
  );
}

export default function CirclePage() {
  const { id = '' } = useParams();
  const { bindTap, bindBack, go } = useMeiyouGestures();
  const s = useAppStrings(strings, stringsEn);
  const [toast, showToast] = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'hot';

  const circles = useMeiyouStore((st) => st.circles);
  const posts = useMeiyouStore((st) => st.posts);
  const dismissedAds = useMeiyouStore((st) => st.dismissedAds);
  const joinedCircles = useMeiyouStore((st) => st.joinedCircles);
  const joinCircle = useMeiyouStore((st) => st.joinCircle);
  const publishBanner = useMeiyouStore((st) => st.publishBanner);
  const setPublishBanner = useMeiyouStore((st) => st.setPublishBanner);

  const circle = circles.find((c) => c.id === id);
  const joined = joinedCircles.includes(id);

  // 最新回复:先短暂骨架屏再显示
  const [replyLoading, setReplyLoading] = React.useState(false);
  React.useEffect(() => {
    if (tab !== 'reply') {
      setReplyLoading(false);
      return;
    }
    setReplyLoading(true);
    const t = setTimeout(() => setReplyLoading(false), 700);
    return () => clearTimeout(t);
  }, [tab]);

  // 发布横幅:进度 1 秒后置为成功
  const bannerState = publishBanner?.state ?? null;
  React.useEffect(() => {
    if (bannerState !== 'progress') return;
    const t = setTimeout(() => setPublishBanner({ state: 'done', pct: 100 }), 1000);
    return () => clearTimeout(t);
  }, [bannerState, setPublishBanner]);

  const feed = React.useMemo(() => {
    const list = posts.filter((p) => p.circleId === id && !dismissedAds.includes(p.id));
    const normal = list.filter((p) => !p.isAd);
    const ad = list.find((p) => p.isAd);
    let sorted: Post[];
    if (tab === 'new') sorted = [...normal].sort((a, b) => b.createdAt - a.createdAt);
    else if (tab === 'reply') sorted = [...normal].sort((a, b) => b.commentCount - a.commentCount);
    else sorted = [...normal].sort((a, b) => b.likes - a.likes);
    if (ad) sorted = sorted.length > 1 ? [sorted[0], ad, ...sorted.slice(1)] : [...sorted, ad];
    return sorted;
  }, [posts, dismissedAds, id, tab]);

  if (!circle) {
    return (
      <div className="flex flex-col h-full bg-white relative">
        <TopBar title="圈子" />
        <div className="flex-1 flex items-center justify-center text-[13px] text-[#999]">{s.emptyList}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: MY.bg }}>
      {/* 彩色渐变头图(沉浸式,状态栏前景浅色) */}
      <div
        className="shrink-0 pb-3"
        style={{ background: `linear-gradient(180deg, ${circle.headerColor}, ${circle.headerColor}CC)` }}
        data-status-bar-foreground="light"
      >
        <div className="flex items-center h-11 px-1">
          <button
            {...bindBack()}
            className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label="返回"
          >
            <IcNavBack size={24} className="text-white" />
          </button>
          <div className="flex-1" />
          <button
            {...bindTap('meiyou.search-open')}
            className="w-10 h-10 flex items-center justify-center bg-transparent border-none cursor-pointer"
            aria-label={s.search}
          >
            <IcSearch size={20} className="text-white" />
          </button>
        </div>
        <div className="flex items-center px-4 gap-3">
          <Img src={circle.icon} className="w-12 h-12 rounded-xl object-cover shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-[17px] truncate">{circle.name}</div>
            <div className="text-white/85 text-[11px] mt-0.5">
              {circle.members}小柚子 · {circle.discussions}讨论
            </div>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'circle.join.toggle' }, { onTrigger: () => joinCircle(id) })}
            className="px-4 h-8 rounded-full text-[13px] font-medium border-none cursor-pointer shrink-0"
            style={joined
              ? { background: 'rgba(255,255,255,0.3)', color: '#FFFFFF' }
              : { background: '#FFFFFF', color: circle.headerColor }}
          >
            {joined ? s.joined : s.join}
          </button>
        </div>
      </div>

      {/* 发布进度/成功横幅 */}
      {publishBanner && (
        <div className="shrink-0 bg-white px-4 h-11 flex items-center border-b border-[#F0F0F0]">
          {publishBanner.state === 'progress' ? (
            <span className="text-[13px] text-[#666]">内容发布中({publishBanner.pct}%)</span>
          ) : (
            <>
              <span
                className="w-4.5 h-4.5 rounded-full flex items-center justify-center"
                style={{ background: MY.primary, width: 18, height: 18 }}
              >
                <IcCheck size={12} className="text-white" />
              </span>
              <span className="flex-1 ml-1.5 text-[13px] text-[#1A1A1A]">内容发布成功</span>
              <button
                {...bindTap('meiyou.profile-open', {
                  onTrigger: () => {
                    setPublishBanner(null);
                    go('meiyou.profile-open');
                  },
                })}
                className="px-3 h-7 rounded-full text-[12px] text-white border-none cursor-pointer"
                style={{ background: MY.primary }}
              >
                去看看
              </button>
            </>
          )}
        </div>
      )}

      {/* tab 行 */}
      <div className="shrink-0 bg-white flex items-center gap-2 px-3 h-11">
        {TAB_DEFS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              {...bindTap({ kind: 'action', id: 'circle.tab.select.target' }, {
                params: { target: t.id },
                onTrigger: () => setSearchParams((p) => { p.set('tab', t.id); return p; }, { replace: true }),
              })}
              className="px-3 h-7 rounded-full text-[13px] border-none cursor-pointer"
              style={active
                ? { background: '#FFE3ED', color: MY.primary, fontWeight: 600 }
                : { background: 'transparent', color: '#666666' }}
            >
              {s[t.label]}
            </button>
          );
        })}
      </div>

      {/* 帖子流 */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5" data-scroll-container="circle-feed" data-scroll-direction="vertical">
        {replyLoading ? (
          <FeedSkeleton />
        ) : (
          <div className="flex flex-col gap-2.5">
            {feed.map((p) => (
              <PostCard key={p.id} post={p} showToast={showToast} likeActionId="circle.post.like" />
            ))}
            {feed.length === 0 && (
              <div className="py-16 text-center text-[13px] text-[#999]">{s.emptyList}</div>
            )}
          </div>
        )}
      </div>

      {/* 悬浮发帖 FAB */}
      <button
        {...bindTap('meiyou.publish-open', { params: { circle: id } })}
        className="absolute right-4 bottom-5 rounded-full flex items-center justify-center border-none cursor-pointer shadow-lg"
        style={{ background: MY.primary, width: 52, height: 52 }}
        aria-label={s.publish}
      >
        <IcPen size={22} className="text-white" />
      </button>

      {toast}
    </div>
  );
}

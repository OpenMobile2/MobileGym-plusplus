import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { FEED_IMGS } from '../assets';
import { Avatar } from '../components/common';
import { COLORS } from '../res/colors';
import { IcSearch, IcAi, IcPlus, IcStar, IcHeart, IcChat, IcMore, IcClose, IcResume } from '../res/icons';
import type { FeedPost } from '../types';
import AsyncFsImage from '@/os/components/AsyncFsImage';

const C = BOSS_CONFIG;

function fmtCount(n: number): string {
  return n >= 10000 ? `${(n / 10000).toFixed(1).replace(/\.0$/, '')}万` : String(n);
}

/** 有了 tab(IMG_8486/8487/8496):关注/推荐信息流 + 发布FAB */
const FeedPage: React.FC = () => {
  const { bindTap, action } = useBossGestures();
  const store = useBossStore();
  const feedTab = useBossStore((s) => s.feedTab);
  const likedPostIds = useBossStore((s) => s.likedPostIds);
  const favoritePostIds = useBossStore((s) => s.favoritePostIds);
  const followedAuthors = useBossStore((s) => s.followedAuthors);
  const myPosts = useBossStore((s) => s.myPosts);
  const myComments = useBossStore((s) => s.myComments);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const publishOpen = searchParams.get('publish') === 'open';

  const posts: FeedPost[] = feedTab === 'follow'
    ? C.feedPosts.filter((p) => followedAuthors.includes(p.author.name))
    : [...myPosts, ...C.feedPosts];

  return (
    <div className="relative flex h-full flex-col" style={{ background: `linear-gradient(180deg, ${COLORS.headerTint} 0%, #FDEEE6 30%, #F5F6F7 130px)` }}>
      {/* 顶栏:头像 + 关注/推荐 + AI/搜索 */}
      <div className="grid grid-cols-[44px_1fr_76px] items-center px-3 pt-12">
        <button {...bindTap('feed.profile-open')} aria-label="个人主页">
          <Avatar imgKey="u_me" name={store.user.nickname} size={34} />
        </button>
        <div className="flex items-center justify-center gap-6">
          {(['follow', 'recommend'] as const).map((v) => (
            <button
              key={v}
              {...action('feed.select.tab', () => store.setFeedTab(v), { params: { value: v } })}
              className="relative pb-1"
            >
              <span className={feedTab === v ? 'text-[17px] font-bold text-gray-900' : 'text-[16px] text-gray-600'}>
                {v === 'follow' ? '关注' : '推荐'}
              </span>
              {feedTab === v && <span className="absolute inset-x-1 bottom-0 h-[3px] rounded-full" style={{ backgroundColor: COLORS.primary }} />}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-end gap-3">
          <button {...action('feed.ai.toast', () => store.showNotice('社区 AI 暂未开放，请点击“我知道了”返回。'), { params: {} })} aria-label="AI">
            <IcAi size={22} color="#5B8DEF" />
          </button>
          <button {...bindTap('feed.search-open', { onTrigger: () => store.showNotice('社区内容搜索暂未开放，请点击“我知道了”返回。') })} aria-label="搜索"><IcSearch size={21} className="text-gray-800" /></button>
        </div>
      </div>

      {/* 帖子流 */}
      <div className="relative mt-2 min-h-0 flex-1 overflow-y-auto px-3 pb-3" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex flex-col gap-2.5">
          {posts.map((post) => {
            const liked = likedPostIds.includes(post.id);
            const starred = favoritePostIds.includes(post.id);
            return (
              <div key={post.id} className="rounded-2xl bg-white p-4">
                <div className="flex items-center justify-between">
                  <button {...bindTap('feed.detail-open', { params: { postId: post.id } })} className="flex min-w-0 items-center gap-2.5 text-left">
                    <Avatar imgKey={post.author.avatar} name={post.author.name} size={38} />
                    <span className="min-w-0">
                      <span className="block truncate text-[15px] font-medium text-gray-900">{post.author.name}</span>
                      {post.author.title && <span className="block truncate text-[12px] text-gray-400">{post.author.title}</span>}
                    </span>
                  </button>
                  <IcMore size={18} className="shrink-0 text-gray-400" />
                </div>
                <button {...bindTap('feed.detail-open', { params: { postId: post.id } })} className="mt-2.5 block w-full text-left">
                  <p className="whitespace-pre-wrap text-[16px] leading-relaxed text-gray-900">
                    {post.text}…<span style={{ color: COLORS.accent }}>全文</span>
                  </p>
                  {post.img && FEED_IMGS[post.img] && (
                    <img src={FEED_IMGS[post.img]} alt="" className="mt-2.5 h-44 w-44 rounded-xl object-cover" />
                  )}
                  {(post.imageUris?.length ?? 0) > 0 && (
                    <span className="mt-2.5 grid grid-cols-3 gap-2">
                      {post.imageUris!.slice(0, 9).map((src) => (
                        src.startsWith('/sdcard/')
                          ? <AsyncFsImage key={src} path={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                          : <img key={src} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
                      ))}
                    </span>
                  )}
                  {post.aiDeclared && <span className="mt-2 block text-[11px] text-gray-400">作者声明：内容含 AI 合成</span>}
                  {post.qaCard && (
                    <span className="mt-2.5 flex items-center gap-2.5 rounded-xl bg-[#F5F6F7] p-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg text-white" style={{ backgroundColor: COLORS.primaryBtn }}>?</span>
                      <span className="text-[14px] font-medium text-gray-800">{post.qaCard}</span>
                    </span>
                  )}
                </button>
                {post.topics.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {post.topics.map((topic) => (
                      <button
                        key={topic}
                        {...action('feed.topic.toast', () => store.showNotice('话题聚合页暂未开放，请点击“我知道了”返回。'), { params: { value: topic } })}
                        className="flex items-center gap-1 rounded-full bg-[#EAF6F5] px-2.5 py-1 text-[12px]"
                        style={{ color: COLORS.accent }}
                      >
                        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white" style={{ backgroundColor: COLORS.primary }}>#</span>
                        {topic}
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 flex items-center justify-between px-1 text-[14px] text-gray-500">
                  <button {...bindTap('feed.comments-open', { params: { postId: post.id } })} className="flex items-center gap-1.5">
                    <IcChat size={18} />{fmtCount(post.comments + myComments.filter((c) => c.postId === post.id).length)}
                  </button>
                  <button
                    {...action('feed.post.favorite', () => store.toggleFavoritePost(post.id), { params: { postId: post.id } })}
                    className="flex items-center gap-1.5"
                    style={starred ? { color: '#F7B733' } : undefined}
                  >
                    <IcStar size={18} fill={starred ? '#F7B733' : 'none'} />{fmtCount(post.stars + (starred ? 1 : 0))}
                  </button>
                  <button
                    {...action('feed.post.like', () => store.toggleLikePost(post.id), { params: { postId: post.id } })}
                    className="flex items-center gap-1.5"
                    style={liked ? { color: '#EB5757' } : undefined}
                  >
                    <IcHeart size={18} fill={liked ? '#EB5757' : 'none'} />{fmtCount(post.likes + (liked ? 1 : 0))}
                  </button>
                </div>
              </div>
            );
          })}
          {posts.length === 0 && <div className="py-20 text-center text-sm text-gray-400">关注的人还没有发布内容</div>}
        </div>
      </div>

      {/* 发布 FAB:固定在可视区右下(挂页面根,不随内容滚) */}
      <button
        {...bindTap('feed.publish-open')}
        data-hide-on-keyboard
        className="absolute bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
        style={{ backgroundColor: COLORS.primaryBtn }}
        aria-label="发布"
      >
        <IcPlus size={28} />
      </button>

      {/* 发布面板(补拍17_30,URL 驱动) */}
      {publishOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-black/40" onClick={() => navigate(-1)}>
          <div className="rounded-t-2xl bg-white px-4 pb-8 pt-3" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between rounded-2xl px-4 py-3" style={{ background: 'linear-gradient(90deg,#EAF6FF,#F5EEFF)' }}>
              <span>
                <span className="block text-[15px] font-semibold text-gray-900">聊聊“复合型人才”</span>
                <span className="mt-0.5 block text-[12px] text-gray-500">发动态,瓜分20万流量</span>
              </span>
              <button {...bindTap('publishpanel.banner-open', { nav: { mode: 'replace' } })} className="rounded-full px-3.5 py-1.5 text-[13px] text-white" style={{ backgroundColor: COLORS.primaryBtn }}>✈ 去发布</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button {...bindTap('publishpanel.compose-open', { nav: { mode: 'replace' } })} className="flex flex-col items-center gap-2 rounded-2xl bg-[#F8F9FA] py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#4A9BEB] text-[20px] text-white">✈</span>
                <span className="text-[15px] font-medium text-gray-800">发图文动态</span>
              </button>
              <button {...action('publishpanel.video.toast', () => store.showNotice('视频发布暂未开放，请点击“我知道了”返回。'), { params: {} })} className="flex flex-col items-center gap-2 rounded-2xl bg-[#F8F9FA] py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#9B6BE0] text-[20px] text-white">🎬</span>
                <span className="text-[15px] font-medium text-gray-800">发视频</span>
              </button>
              <button {...bindTap('publishpanel.answer-open', { nav: { mode: 'replace' } })} className="flex flex-col items-center gap-2 rounded-2xl bg-[#F8F9FA] py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7C5CF0] text-[20px] text-white">📝</span>
                <span className="text-[15px] font-medium text-gray-800">写回答</span>
              </button>
              <button {...bindTap('publishpanel.ask-open', { nav: { mode: 'replace' } })} className="flex flex-col items-center gap-2 rounded-2xl bg-[#F8F9FA] py-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF8A5C] text-[20px] text-white">?</span>
                <span className="text-[15px] font-medium text-gray-800">去提问</span>
              </button>
            </div>
            <button onClick={() => navigate(-1)} className="mx-auto mt-4 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500" aria-label="关闭"><IcClose size={18} /></button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedPage;

import React, { Suspense, useCallback, useContext, useMemo, useState } from 'react';
import {
  MemoryRouter,
  Navigate,
  Route,
  Routes,
  UNSAFE_NavigationContext,
  useLocation,
  useSearchParams,
} from 'react-router-dom';
import * as TimeService from '@/os/TimeService';
import { useAppNavigationHandler } from '@/os/hooks/useAppNavigationHandler';
import { CHANNELS, COVER_PALETTES } from './constants';
import { manifest } from './manifest';
import {
  IcBell,
  IcChevronRight,
  IcCoin,
  IcDownload,
  IcDynamic,
  IcGame,
  IcHome,
  IcHot,
  IcMail,
  IcMe,
  IcMessage,
  IcMore,
  IcMovie,
  IcPlay,
  IcPublish,
  IcSearch,
  IcSend,
  IcSettings,
  IcShare,
  IcStar,
  IcThumb,
  IcTv,
  IcVip,
  IcWallet,
} from './res/icons';
import { useAppNavigate } from './navigation';
import {
  selectUnreadCount,
  selectUser,
  selectVideo,
  useBilibiliV2Store,
} from './state';
import type { BiliComment, BiliUser, BiliVideo } from './types';

const MAIN_TABS = ['/', '/hot', '/dynamic', '/message', '/me'];

function formatCompact(value: number) {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1)}亿`;
  if (value >= 10000) return `${(value / 10000).toFixed(1)}万`;
  return String(value);
}

function relativeTime(ts: number) {
  const diff = Math.max(0, TimeService.now() - ts);
  const minute = 60000;
  const hour = minute * 60;
  const day = hour * 24;
  if (diff < hour) return `${Math.max(1, Math.floor(diff / minute))}分钟前`;
  if (diff < day) return `${Math.floor(diff / hour)}小时前`;
  return `${Math.floor(diff / day)}天前`;
}

function getInitials(name: string) {
  return name.slice(0, 2);
}

function findUser(users: BiliUser[], me: BiliUser, userId: string) {
  return userId === 'me' ? me : users.find(user => user.id === userId) || me;
}

function Avatar({ user, size = 36 }: { user: BiliUser; size?: number }) {
  return (
    <div
      className="shrink-0 grid place-items-center rounded-full text-white font-semibold shadow-sm"
      style={{ width: size, height: size, background: user.avatarTone, fontSize: Math.max(11, size / 3.2) }}
      aria-label={`${user.name} avatar`}
    >
      {getInitials(user.name)}
    </div>
  );
}

function Cover({
  video,
  className = '',
  large = false,
}: {
  video: BiliVideo;
  className?: string;
  large?: boolean;
}) {
  const palette = COVER_PALETTES[video.paletteIndex % COVER_PALETTES.length];
  return (
    <div
      className={`relative overflow-hidden bg-black ${className}`}
      style={{
        background: `
          radial-gradient(circle at 18% 18%, rgba(255,255,255,.46), transparent 22%),
          radial-gradient(circle at 84% 24%, rgba(255,255,255,.26), transparent 24%),
          linear-gradient(135deg, ${palette[0]}, ${palette[1]} 56%, ${palette[2]})
        `,
      }}
    >
      <div className="absolute inset-0 opacity-35">
        <div className="absolute left-4 top-5 h-12 w-20 rotate-[-8deg] rounded-xl bg-white/35" />
        <div className="absolute right-4 top-7 h-16 w-24 rotate-6 rounded-2xl border border-white/35 bg-black/20" />
        <div className="absolute bottom-9 left-8 h-8 w-24 rounded-full bg-white/25" />
        <div className="absolute bottom-14 right-10 h-5 w-16 rounded-full bg-white/20" />
      </div>
      {large && (
        <div className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm">
          <IcPlay size={24} fill="currentColor" />
        </div>
      )}
      <div className="absolute left-2 top-2 rounded bg-black/35 px-1.5 py-0.5 text-[10px] font-medium text-white">
        {video.bvid}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/75 via-black/25 to-transparent px-2 pb-1.5 pt-7 text-white">
        <span className="flex min-w-0 items-center gap-1 text-[11px]">
          <IcPlay size={12} fill="currentColor" />
          {formatCompact(video.views)}
          <span className="ml-1">弹幕 {formatCompact(video.danmaku)}</span>
        </span>
        <span className="rounded bg-black/45 px-1.5 py-0.5 text-[11px]">{video.duration}</span>
      </div>
    </div>
  );
}

function TopBar({
  title,
  showBack,
  right,
}: {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}) {
  const { back } = useAppNavigate();
  return (
    <div className="flex h-11 shrink-0 items-center border-b border-app-border bg-app-surface px-3">
      <div className="flex w-16 items-center">
        {showBack && (
          <button
            data-trigger="bilibili2.home.open"
            data-trigger-type="back"
            onClick={() => back()}
            className="rounded px-1 py-2 text-sm font-medium text-app-primary"
          >
            返回
          </button>
        )}
      </div>
      <div className="flex-1 truncate text-center text-[15px] font-semibold text-app-text">{title}</div>
      <div className="flex w-16 items-center justify-end gap-2">{right}</div>
    </div>
  );
}

function SearchPill({ compact = false }: { compact?: boolean }) {
  const { go } = useAppNavigate();
  return (
    <button
      data-trigger="search.open"
      data-trigger-type="tap"
      onClick={() => go('search.open')}
      className={`${compact ? 'h-8 w-8 justify-center rounded-full px-0' : 'h-8 flex-1 justify-start rounded-full px-3'} flex items-center gap-1.5 bg-gray-100 text-app-text-muted`}
      aria-label="搜索"
    >
      <IcSearch size={17} />
      {!compact && <span className="truncate text-xs">搜索视频、番剧、UP主</span>}
    </button>
  );
}

function filterByChannel(videos: BiliVideo[], channel: string) {
  if (channel === 'recommend' || channel === 'live' || channel === 'movie') return videos;
  if (channel === 'hot') return [...videos].sort((a, b) => b.views + b.likes - (a.views + a.likes));
  return videos.filter(video => video.channel === channel);
}

function VideoCard({ video, dense = false }: { video: BiliVideo; dense?: boolean }) {
  const users = useBilibiliV2Store(s => s.users);
  const me = useBilibiliV2Store(s => s.me);
  const author = findUser(users, me, video.authorId);
  const { go } = useAppNavigate();

  return (
    <button
      data-trigger="video.open"
      data-trigger-type="tap"
      data-trigger-params={JSON.stringify({ videoId: video.id })}
      onClick={() => go('video.open', { videoId: video.id })}
      className="min-w-0 bg-app-surface text-left"
    >
      <Cover video={video} className="aspect-video rounded-md" />
      <div className={dense ? 'pt-1.5' : 'pt-2'}>
        <div className="line-clamp-2 min-h-[38px] text-[13px] font-medium leading-[19px] text-app-text">
          {video.title}
        </div>
        <div className="mt-1 flex items-center gap-1 text-[11px] text-app-text-muted">
          <span className="truncate">{author.name}</span>
          <span>·</span>
          <span>{formatCompact(video.likes)}点赞</span>
          <IcMore className="ml-auto shrink-0" size={14} />
        </div>
      </div>
    </button>
  );
}

function HomePage() {
  const [params] = useSearchParams();
  const currentChannel = params.get('channel') || 'recommend';
  const videos = useBilibiliV2Store(s => s.videos);
  const me = useBilibiliV2Store(s => s.me);
  const unread = useBilibiliV2Store(selectUnreadCount);
  const { go } = useAppNavigate();
  const filtered = filterByChannel(videos, currentChannel);
  const hero = filtered[0] || videos[0];
  const feed = filtered.slice(1);

  return (
    <div className="flex h-full flex-col bg-app-surface" data-status-bar-foreground="dark">
      <div className="shrink-0 border-b border-app-border bg-app-surface">
        <div className="flex items-center gap-2 px-3 py-2">
          <button
            data-trigger="tab.me"
            data-trigger-type="tap"
            onClick={() => go('tab.me')}
            className="shrink-0"
            aria-label="我的"
          >
            <Avatar user={me} size={32} />
          </button>
          <SearchPill />
          <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-app-text-muted" aria-label="游戏中心">
            <IcGame size={19} />
          </button>
          <button
            data-trigger="tab.message"
            data-trigger-type="tap"
            onClick={() => go('tab.message')}
            className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full text-app-text-muted"
            aria-label="消息"
          >
            <IcMail size={19} />
            {unread > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-app-primary" />}
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto px-3" data-scroll-container="channels" data-scroll-direction="horizontal">
          {CHANNELS.map(channel => {
            const active = currentChannel === channel.id;
            return (
              <button
                key={channel.id}
                data-trigger="home.channel.switch"
                data-trigger-type="tap"
                data-trigger-params={JSON.stringify({ channel: channel.id })}
                onClick={() => go('home.channel.switch', { channel: channel.id })}
                className={`relative shrink-0 pb-2 pt-1 text-[14px] ${active ? 'font-semibold text-app-text' : 'text-app-text-muted'}`}
              >
                {channel.label}
                {active && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-app-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-app-surface px-3 pb-3 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        <button
          data-trigger="video.open"
          data-trigger-type="tap"
          data-trigger-params={JSON.stringify({ videoId: hero.id })}
          onClick={() => go('video.open', { videoId: hero.id })}
          className="mb-3 w-full overflow-hidden rounded-md bg-app-surface text-left"
        >
          <Cover video={hero} className="h-[166px] rounded-md" large />
          <div className="pt-2">
            <div className="line-clamp-2 text-[15px] font-semibold leading-5 text-app-text">{hero.title}</div>
            <div className="mt-1 flex items-center text-xs text-app-text-muted">
              <span>综合热门</span>
              <span className="mx-1">·</span>
              <span>{formatCompact(hero.views)}播放</span>
              <IcMore className="ml-auto" size={15} />
            </div>
          </div>
        </button>

        <div className="grid grid-cols-2 gap-x-2.5 gap-y-4">
          {feed.map(video => <VideoCard key={video.id} video={video} dense />)}
        </div>
      </div>
    </div>
  );
}

function HotPage() {
  const videos = useBilibiliV2Store(s => s.videos);
  const ranked = [...videos].sort((a, b) => b.views + b.likes - (a.views + a.likes));
  const { go } = useAppNavigate();
  return (
    <Page title="热门" right={<SearchPill compact />}>
      <div className="space-y-2 p-3">
        <div className="rounded-lg bg-gradient-to-r from-app-primary to-sky-400 p-3 text-white shadow-sm">
          <div className="text-lg font-bold">全站排行榜</div>
          <div className="mt-1 text-xs text-white/85">综合播放、互动和收藏热度排序</div>
        </div>
        {ranked.map((video, index) => (
          <button
            key={video.id}
            data-trigger="video.open"
            data-trigger-type="tap"
            data-trigger-params={JSON.stringify({ videoId: video.id })}
            onClick={() => go('video.open', { videoId: video.id })}
            className="flex w-full gap-3 rounded-lg bg-app-surface p-2 text-left shadow-sm"
          >
            <div className={`w-7 pt-1 text-center text-lg font-black ${index < 3 ? 'text-app-primary' : 'text-app-text-muted'}`}>
              {index + 1}
            </div>
            <Cover video={video} className="h-20 w-32 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <div className="line-clamp-2 text-sm font-medium text-app-text">{video.title}</div>
              <div className="mt-2 text-xs text-app-text-muted">{formatCompact(video.views)}播放 · {formatCompact(video.likes)}点赞</div>
            </div>
          </button>
        ))}
      </div>
    </Page>
  );
}

function DynamicPage() {
  const dynamics = useBilibiliV2Store(s => s.dynamics);
  const users = useBilibiliV2Store(s => s.users);
  const me = useBilibiliV2Store(s => s.me);
  const videos = useBilibiliV2Store(s => s.videos);
  const likedIds = useBilibiliV2Store(s => s.likedDynamicIds);
  const toggleDynamicLike = useBilibiliV2Store(s => s.toggleDynamicLike);
  const { go } = useAppNavigate();

  return (
    <Page title="动态" right={<SearchPill compact />}>
      <div className="bg-app-surface px-3 pt-2">
        <div className="flex gap-5 border-b border-app-border text-[14px]">
          <span className="border-b-2 border-app-primary pb-2 font-semibold text-app-text">视频</span>
          <span className="pb-2 text-app-text-muted">综合</span>
        </div>
        <div className="flex gap-3 overflow-x-auto py-3" data-scroll-container="following" data-scroll-direction="horizontal">
          {[me, ...users].slice(0, 6).map(user => (
            <button
              key={user.id}
              data-trigger="user.open"
              data-trigger-type="tap"
              data-trigger-params={JSON.stringify({ userId: user.id })}
              onClick={() => go('user.open', { userId: user.id })}
              className="flex w-14 shrink-0 flex-col items-center gap-1 text-center"
            >
              <Avatar user={user} size={42} />
              <span className="line-clamp-1 w-full text-[11px] text-app-text-muted">{user.name}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2 p-3">
        {dynamics.map(item => {
          const user = findUser(users, me, item.userId);
          const video = videos.find(v => v.id === item.videoId);
          const liked = likedIds.includes(item.id);
          return (
            <article key={item.id} className="rounded-lg bg-app-surface p-3 shadow-sm">
              <button
                data-trigger="user.open"
                data-trigger-type="tap"
                data-trigger-params={JSON.stringify({ userId: user.id })}
                onClick={() => go('user.open', { userId: user.id })}
                className="flex w-full items-center gap-2 text-left"
              >
                <Avatar user={user} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-app-text">{user.name}</div>
                  <div className="text-xs text-app-text-muted">{relativeTime(item.createdAt)} · 投稿了视频</div>
                </div>
                <IcMore size={18} className="text-app-text-muted" />
              </button>
              <p className="mt-3 text-sm leading-6 text-app-text">{item.content}</p>
              {video && (
                <button
                  data-trigger="video.open"
                  data-trigger-type="tap"
                  data-trigger-params={JSON.stringify({ videoId: video.id })}
                  onClick={() => go('video.open', { videoId: video.id })}
                  className="mt-3 flex w-full gap-2 rounded-md bg-gray-50 p-2 text-left"
                >
                  <Cover video={video} className="h-16 w-28 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-xs font-medium leading-5 text-app-text">{video.title}</div>
                    <div className="mt-1 text-[11px] text-app-text-muted">{formatCompact(video.views)}播放</div>
                  </div>
                </button>
              )}
              <div className="mt-3 flex items-center justify-around border-t border-app-border pt-2 text-xs text-app-text-muted">
                <button className="flex items-center gap-1"><IcShare size={15} />转发</button>
                <span className="flex items-center gap-1"><IcMessage size={15} />{formatCompact(item.comments)}</span>
                <button
                  data-action="dynamic.like.toggle"
                  data-action-type="tap"
                  data-action-params={JSON.stringify({ dynamicId: item.id })}
                  onClick={() => toggleDynamicLike(item.id)}
                  className={`flex items-center gap-1 ${liked ? 'text-app-primary' : ''}`}
                >
                  <IcThumb size={15} fill={liked ? 'currentColor' : 'none'} />
                  {formatCompact(item.likes)}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Page>
  );
}

function MessagePage() {
  const messages = useBilibiliV2Store(s => s.messages);
  const markAllMessagesRead = useBilibiliV2Store(s => s.markAllMessagesRead);
  return (
    <Page
      title="消息"
      right={(
        <button
          data-action="message.readAll.submit"
          data-action-type="tap"
          onClick={markAllMessagesRead}
          className="text-xs text-app-primary"
        >
          已读
        </button>
      )}
    >
      <div className="space-y-2 p-3">
        {messages.map(message => (
          <div key={message.id} className="flex gap-3 rounded-lg bg-app-surface p-3 shadow-sm">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink-50 text-app-primary">
              <IcBell size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-app-text">{message.title}</div>
                <div className="text-xs text-app-text-muted">{relativeTime(message.createdAt)}</div>
              </div>
              <div className="mt-1 truncate text-sm text-app-text-muted">{message.body}</div>
            </div>
            {message.unread > 0 && (
              <div className="h-5 min-w-5 rounded-full bg-app-primary px-1.5 text-center text-[11px] leading-5 text-white">
                {message.unread}
              </div>
            )}
          </div>
        ))}
      </div>
    </Page>
  );
}

function MePage() {
  const me = useBilibiliV2Store(s => s.me);
  const favoriteCount = useBilibiliV2Store(s => s.favoriteVideoIds.length);
  const { go } = useAppNavigate();

  return (
    <Page
      title="我的"
      right={<button data-trigger="settings.open" data-trigger-type="tap" onClick={() => go('settings.open')} className="text-app-text-muted"><IcSettings size={19} /></button>}
    >
      <div className="space-y-3 p-3">
        <button
          data-trigger="profile.edit.open"
          data-trigger-type="tap"
          onClick={() => go('profile.edit.open')}
          className="flex w-full items-center gap-3 rounded-lg bg-app-surface p-4 text-left shadow-sm"
        >
          <Avatar user={me} size={62} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-xl font-bold text-app-text">{me.name}</span>
              <span className="rounded bg-app-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-app-primary">LV{me.level}</span>
            </div>
            <div className="mt-1 line-clamp-1 text-xs text-app-text-muted">{me.sign}</div>
          </div>
          <IcChevronRight size={18} className="text-app-text-muted" />
        </button>

        <div className="grid grid-cols-4 rounded-lg bg-app-surface p-3 text-center shadow-sm">
          <Metric label="动态" value="12" />
          <Metric label="关注" value={formatCompact(me.following)} />
          <Metric label="粉丝" value={formatCompact(me.followers)} />
          <Metric label="获赞" value="8.8万" />
        </div>

        <div className="rounded-lg bg-gradient-to-r from-[#2f3340] via-[#3b3f4c] to-[#20232d] p-3 text-white shadow-sm">
          <div className="flex items-center gap-2">
            <IcVip size={18} />
            <span className="font-semibold">大会员中心</span>
            <span className="ml-auto rounded-full bg-white/15 px-2 py-1 text-[11px]">立即查看</span>
          </div>
          <div className="mt-1 text-xs text-white/70">专属挂件、会员购优惠与追番权益</div>
        </div>

        <div className="rounded-lg bg-app-surface p-3 shadow-sm">
          <div className="grid grid-cols-4 gap-y-4 text-center">
            <ServiceButton icon={<IcStar size={21} />} label="收藏" value={`${favoriteCount}`} trigger="favorites.open" onClick={() => go('favorites.open')} />
            <ServiceButton icon={<IcDownload size={21} />} label="离线缓存" value="" trigger="settings.open" onClick={() => go('settings.open')} />
            <ServiceButton icon={<IcTv size={21} />} label="追番" value="" trigger="tab.hot" onClick={() => go('tab.hot')} />
            <ServiceButton icon={<IcWallet size={21} />} label="钱包" value="" trigger="settings.open" onClick={() => go('settings.open')} />
            <ServiceButton icon={<IcDynamic size={21} />} label="动态" value="" trigger="tab.dynamic" onClick={() => go('tab.dynamic')} />
            <ServiceButton icon={<IcPublish size={21} />} label="创作中心" value="" trigger="publish.open" onClick={() => go('publish.open')} />
            <ServiceButton icon={<IcMovie size={21} />} label="放映厅" value="" trigger="tab.hot" onClick={() => go('tab.hot')} />
            <ServiceButton icon={<IcSettings size={21} />} label="设置" value="" trigger="settings.open" onClick={() => go('settings.open')} />
          </div>
        </div>
      </div>
    </Page>
  );
}

function SearchPage() {
  const [params] = useSearchParams();
  const initial = params.get('q') || '';
  const [query, setQuery] = useState(initial);
  const videos = useBilibiliV2Store(s => s.videos);
  const history = useBilibiliV2Store(s => s.searchHistory);
  const recordSearch = useBilibiliV2Store(s => s.recordSearch);
  const filtered = query.trim()
    ? videos.filter(video => `${video.title} ${video.tags.join(' ')}`.toLowerCase().includes(query.trim().toLowerCase()))
    : videos.slice(0, 4);

  return (
    <Page title="搜索" showBack>
      <div className="p-3">
        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
          <IcSearch size={18} className="text-app-text-muted" />
          <input
            data-action="search.query.input"
            data-action-type="input"
            value={query}
            onChange={event => setQuery(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') recordSearch(query);
            }}
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            placeholder="搜索视频、番剧、UP 主"
          />
          <button data-action="search.query.input" data-action-type="tap" onClick={() => recordSearch(query)} className="text-sm text-app-primary">
            搜索
          </button>
        </div>
        <div className="mt-4">
          <div className="mb-2 text-sm font-semibold text-app-text">历史搜索</div>
          <div className="flex flex-wrap gap-2">
            {history.map(item => (
              <button key={item} onClick={() => setQuery(item)} className="rounded-full bg-white px-3 py-1.5 text-xs text-app-text-muted">
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {filtered.map(video => <VideoCard key={video.id} video={video} />)}
        </div>
      </div>
    </Page>
  );
}

function VideoDetailPage() {
  const location = useLocation();
  const [params] = useSearchParams();
  const videoId = location.pathname.split('/').pop() || '';
  const tab = params.get('tab') || 'intro';
  const video = useBilibiliV2Store(selectVideo(videoId));
  const users = useBilibiliV2Store(s => s.users);
  const me = useBilibiliV2Store(s => s.me);
  const comments = useBilibiliV2Store(s => s.comments.filter(comment => comment.videoId === videoId));
  const likedIds = useBilibiliV2Store(s => s.likedVideoIds);
  const coinedIds = useBilibiliV2Store(s => s.coinedVideoIds);
  const favoriteIds = useBilibiliV2Store(s => s.favoriteVideoIds);
  const toggleVideoLike = useBilibiliV2Store(s => s.toggleVideoLike);
  const coinVideo = useBilibiliV2Store(s => s.coinVideo);
  const toggleFavorite = useBilibiliV2Store(s => s.toggleFavorite);
  const submitComment = useBilibiliV2Store(s => s.submitComment);
  const [commentText, setCommentText] = useState('');
  const { go } = useAppNavigate();
  const author = video ? findUser(users, me, video.authorId) : me;
  const related = useBilibiliV2Store(s => s.videos.filter(item => item.id !== videoId).slice(0, 4));

  if (!video) return <NotFound title="视频不存在" />;

  const liked = likedIds.includes(video.id);
  const coined = coinedIds.includes(video.id);
  const favored = favoriteIds.includes(video.id);

  return (
    <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="light">
      <div className="relative shrink-0 bg-black">
        <Cover video={video} className="h-[208px]" large />
        <button
          data-trigger="bilibili2.home.open"
          data-trigger-type="back"
          onClick={() => go('bilibili2.home.open')}
          className="absolute left-3 top-3 rounded-full bg-black/35 px-2.5 py-1.5 text-xs font-medium text-white"
        >
          返回
        </button>
        <div className="absolute inset-x-0 bottom-0 px-3 pb-2 text-white">
          <div className="mb-2 flex items-center gap-2 text-[11px] text-white/85">
            <span>00:12</span>
            <div className="h-1 flex-1 rounded-full bg-white/25">
              <div className="h-full w-1/3 rounded-full bg-app-primary" />
            </div>
            <span>{video.duration}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <section className="bg-app-surface p-3">
          <h1 className="text-[17px] font-bold leading-6 text-app-text">{video.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-app-text-muted">
            <span>{formatCompact(video.views)}播放</span>
            <span>{formatCompact(video.danmaku)}弹幕</span>
            <span>{relativeTime(video.publishedAt)}</span>
            <span>{video.bvid}</span>
          </div>
          <div className="mt-3 flex justify-around border-y border-app-border py-2">
            <ActionPill
              icon={<IcThumb size={21} fill={liked ? 'currentColor' : 'none'} />}
              active={liked}
              label={liked ? '已赞' : '点赞'}
              value={formatCompact(video.likes)}
              action="video.like.toggle"
              params={{ videoId: video.id }}
              onClick={() => toggleVideoLike(video.id)}
            />
            <ActionPill
              icon={<IcCoin size={21} />}
              active={coined}
              label={coined ? '已投币' : '投币'}
              value={formatCompact(video.coins)}
              action="video.coin.add"
              params={{ videoId: video.id }}
              onClick={() => coinVideo(video.id)}
            />
            <ActionPill
              icon={<IcStar size={21} fill={favored ? 'currentColor' : 'none'} />}
              active={favored}
              label={favored ? '已收藏' : '收藏'}
              value={formatCompact(video.favorites)}
              action="video.favorite.toggle"
              params={{ videoId: video.id }}
              onClick={() => toggleFavorite(video.id)}
            />
            <div className="flex min-w-0 flex-col items-center gap-0.5 px-2 text-xs text-app-text-muted">
              <IcShare size={21} />
              <span>分享</span>
              <span>转发</span>
            </div>
          </div>

          <button
            data-trigger="user.open"
            data-trigger-type="tap"
            data-trigger-params={JSON.stringify({ userId: author.id })}
            onClick={() => go('user.open', { userId: author.id })}
            className="mt-3 flex w-full items-center gap-3 text-left"
          >
            <Avatar user={author} size={42} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-semibold text-app-text">{author.name}</div>
              <div className="truncate text-xs text-app-text-muted">{formatCompact(author.followers)}粉丝 · {author.sign}</div>
            </div>
            <span className="rounded-full bg-app-primary px-3 py-1.5 text-xs font-medium text-white">+ 关注</span>
          </button>

          <div className="mt-3 flex gap-1.5 overflow-x-auto" data-scroll-container="tags" data-scroll-direction="horizontal">
            {video.tags.map(tag => <span key={tag} className="shrink-0 rounded bg-gray-100 px-2 py-1 text-[11px] text-app-text-muted">{tag}</span>)}
          </div>
        </section>

        <section className="mt-2 bg-app-surface">
          <div className="flex border-b border-app-border px-3 text-sm">
            <button
              data-trigger="video.tab.switch"
              data-trigger-type="tap"
              data-trigger-params={JSON.stringify({ videoId: video.id, tab: 'intro' })}
              onClick={() => go('video.tab.switch', { videoId: video.id, tab: 'intro' })}
              className={`relative mr-6 py-3 ${tab === 'intro' ? 'font-semibold text-app-text' : 'text-app-text-muted'}`}
            >
              简介
              {tab === 'intro' && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-app-primary" />}
            </button>
            <button
              data-trigger="video.tab.switch"
              data-trigger-type="tap"
              data-trigger-params={JSON.stringify({ videoId: video.id, tab: 'comments' })}
              onClick={() => go('video.tab.switch', { videoId: video.id, tab: 'comments' })}
              className={`relative py-3 ${tab === 'comments' ? 'font-semibold text-app-text' : 'text-app-text-muted'}`}
            >
              评论 {formatCompact(video.comments)}
              {tab === 'comments' && <span className="absolute bottom-0 left-1/2 h-0.5 w-5 -translate-x-1/2 rounded-full bg-app-primary" />}
            </button>
          </div>

          {tab === 'comments' ? (
            <CommentPanel
              comments={comments}
              users={users}
              me={me}
              video={video}
              commentText={commentText}
              setCommentText={setCommentText}
              submitComment={submitComment}
            />
          ) : (
            <div className="p-3">
              <p className="text-sm leading-6 text-app-text-muted">{video.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {related.map(item => <VideoCard key={item.id} video={item} dense />)}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function CommentPanel({
  comments,
  users,
  me,
  video,
  commentText,
  setCommentText,
  submitComment,
}: {
  comments: BiliComment[];
  users: BiliUser[];
  me: BiliUser;
  video: BiliVideo;
  commentText: string;
  setCommentText: (value: string) => void;
  submitComment: (videoId: string, content: string) => void;
}) {
  return (
    <div className="p-3">
      <div className="mb-3 flex gap-2">
        <Avatar user={me} size={30} />
        <input
          value={commentText}
          onChange={event => setCommentText(event.target.value)}
          className="min-w-0 flex-1 rounded-full bg-gray-100 px-3 py-2 text-sm outline-none"
          placeholder="发一条友善的评论"
        />
        <button
          data-action="video.comment.submit"
          data-action-type="tap"
          data-action-params={JSON.stringify({ videoId: video.id })}
          onClick={() => {
            submitComment(video.id, commentText);
            setCommentText('');
          }}
          className="grid h-9 w-9 place-items-center rounded-full bg-app-primary text-white"
          aria-label="发送评论"
        >
          <IcSend size={17} />
        </button>
      </div>
      <div className="space-y-4">
        {comments.map(comment => {
          const user = findUser(users, me, comment.userId);
          return (
            <div key={comment.id} className="flex gap-2">
              <Avatar user={user} size={32} />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-app-text-muted">{user.name} · {relativeTime(comment.createdAt)}</div>
                <div className="mt-1 text-sm leading-6 text-app-text">{comment.content}</div>
              </div>
              <div className="text-xs text-app-text-muted">{formatCompact(comment.likes)}赞</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function UserProfilePage() {
  const location = useLocation();
  const userId = location.pathname.split('/').pop() || '';
  const user = useBilibiliV2Store(selectUser(userId));
  const videos = useBilibiliV2Store(s => s.videos.filter(video => video.authorId === userId));
  const followed = useBilibiliV2Store(s => s.followedUserIds.includes(userId));
  const toggleFollow = useBilibiliV2Store(s => s.toggleFollow);
  if (!user) return <NotFound title="UP 主不存在" />;

  return (
    <Page title="UP 主空间" showBack>
      <div className="bg-app-surface">
        <div className="h-28 bg-gradient-to-br from-sky-300 via-pink-300 to-indigo-700" />
        <div className="-mt-8 p-4">
          <div className="flex items-end gap-3">
            <Avatar user={user} size={68} />
            <button
              data-action="user.follow.toggle"
              data-action-type="tap"
              data-action-params={JSON.stringify({ userId: user.id })}
              onClick={() => toggleFollow(user.id)}
              className={`ml-auto rounded-full px-4 py-2 text-sm ${followed ? 'bg-gray-100 text-app-text-muted' : 'bg-app-primary text-white'}`}
            >
              {followed ? '已关注' : '+ 关注'}
            </button>
          </div>
          <div className="mt-3 text-xl font-bold text-app-text">{user.name}</div>
          <div className="mt-1 text-xs text-app-text-muted">Lv.{user.level} · {formatCompact(user.followers)}粉丝</div>
          <p className="mt-3 text-sm text-app-text-muted">{user.sign}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 p-3">
        {videos.map(video => <VideoCard key={video.id} video={video} />)}
      </div>
    </Page>
  );
}

function CategoryPage() {
  const location = useLocation();
  const channel = decodeURIComponent(location.pathname.split('/').pop() || 'recommend');
  const channelLabel = CHANNELS.find(item => item.id === channel)?.label || '分区';
  const videos = useBilibiliV2Store(s => filterByChannel(s.videos, channel));
  return (
    <Page title={`${channelLabel}分区`} showBack right={<SearchPill compact />}>
      <div className="grid grid-cols-2 gap-2.5 p-3">
        {videos.map(video => <VideoCard key={video.id} video={video} />)}
      </div>
    </Page>
  );
}

function FavoritesPage() {
  const ids = useBilibiliV2Store(s => s.favoriteVideoIds);
  const videos = useBilibiliV2Store(s => s.videos.filter(video => ids.includes(video.id)));
  return (
    <Page title="我的收藏" showBack>
      <div className="grid grid-cols-2 gap-2.5 p-3">
        {videos.map(video => <VideoCard key={video.id} video={video} />)}
      </div>
    </Page>
  );
}

function PublishPage() {
  const [content, setContent] = useState('');
  const publishDynamic = useBilibiliV2Store(s => s.publishDynamic);
  const { go } = useAppNavigate();
  return (
    <Page title="发布动态" showBack>
      <div className="p-3">
        <textarea
          value={content}
          onChange={event => setContent(event.target.value)}
          className="h-44 w-full resize-none rounded-lg bg-app-surface p-3 text-sm leading-6 outline-none shadow-sm"
          placeholder="分享此刻正在看的内容..."
        />
        <button
          data-action="publish.dynamic.submit"
          data-action-type="tap"
          onClick={() => {
            publishDynamic(content);
            go('tab.dynamic');
          }}
          className="mt-3 w-full rounded-full bg-app-primary py-3 text-sm font-semibold text-white"
        >
          发布
        </button>
      </div>
    </Page>
  );
}

function ProfileEditPage() {
  const me = useBilibiliV2Store(s => s.me);
  const saveSignature = useBilibiliV2Store(s => s.saveSignature);
  const [sign, setSign] = useState(me.sign);
  const { back } = useAppNavigate();
  return (
    <Page title="编辑资料" showBack>
      <div className="space-y-3 p-3">
        <div className="rounded-lg bg-app-surface p-3 shadow-sm">
          <div className="mb-2 text-xs text-app-text-muted">昵称</div>
          <div className="text-app-text">{me.name}</div>
        </div>
        <div className="rounded-lg bg-app-surface p-3 shadow-sm">
          <label className="mb-2 block text-xs text-app-text-muted">个性签名</label>
          <textarea value={sign} onChange={event => setSign(event.target.value)} className="h-24 w-full resize-none bg-transparent text-sm outline-none" />
        </div>
        <button
          data-action="profile.sign.save"
          data-action-type="tap"
          onClick={() => {
            saveSignature(sign);
            back();
          }}
          className="w-full rounded-full bg-app-primary py-3 text-sm font-semibold text-white"
        >
          保存
        </button>
      </div>
    </Page>
  );
}

function SettingsPage() {
  const rows = ['首页推荐设置', '播放设置', '弹幕设置', '推送提醒', '隐私权限', '缓存管理', '关于哔哩哔哩'];
  return (
    <Page title="设置" showBack>
      <div className="p-3">
        <div className="overflow-hidden rounded-lg bg-app-surface shadow-sm">
          {rows.map(row => (
            <div key={row} className="flex items-center justify-between border-b border-app-border px-3 py-3 last:border-b-0">
              <span className="text-sm text-app-text">{row}</span>
              <IcChevronRight size={16} className="text-app-text-muted" />
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}

function Page({
  title,
  showBack,
  right,
  children,
}: {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col bg-app-bg" data-status-bar-foreground="dark">
      <TopBar title={title} showBack={showBack} right={right} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {children}
      </div>
    </div>
  );
}

function ActionPill({
  icon,
  active,
  label,
  value,
  action,
  params,
  onClick,
}: {
  icon: React.ReactNode;
  active: boolean;
  label: string;
  value: string;
  action: string;
  params: Record<string, string>;
  onClick: () => void;
}) {
  return (
    <button
      data-action={action}
      data-action-type="tap"
      data-action-params={JSON.stringify(params)}
      onClick={onClick}
      className={`flex min-w-0 flex-col items-center gap-0.5 px-2 text-xs ${active ? 'text-app-primary' : 'text-app-text-muted'}`}
    >
      {icon}
      <span>{label}</span>
      <span>{value}</span>
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-base font-bold text-app-text">{value}</div>
      <div className="text-xs text-app-text-muted">{label}</div>
    </div>
  );
}

function ServiceButton({
  icon,
  label,
  value,
  trigger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trigger: string;
  onClick: () => void;
}) {
  return (
    <button
      data-trigger={trigger}
      data-trigger-type="tap"
      onClick={onClick}
      className="flex flex-col items-center gap-1 text-center"
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-pink-50 text-app-primary">{icon}</span>
      <span className="text-[11px] text-app-text">{label}</span>
      {value && <span className="-mt-1 text-[10px] text-app-text-muted">{value}</span>}
    </button>
  );
}

function NotFound({ title }: { title: string }) {
  return (
    <Page title={title} showBack>
      <div className="grid h-full place-items-center p-6 text-center text-app-text-muted">{title}</div>
    </Page>
  );
}

function TabBar({ currentPath }: { currentPath: string }) {
  const { go } = useAppNavigate();
  const unread = useBilibiliV2Store(selectUnreadCount);
  const items = useMemo(() => [
    { id: 'tab.home' as const, path: '/', label: '首页', icon: IcHome },
    { id: 'tab.hot' as const, path: '/hot', label: '热门', icon: IcHot },
    { id: 'publish.open' as const, path: '/publish', label: '发布', icon: IcPublish, big: true },
    { id: 'tab.dynamic' as const, path: '/dynamic', label: '动态', icon: IcDynamic },
    { id: 'tab.me' as const, path: '/me', label: '我的', icon: IcMe },
  ], []);

  return (
    <div data-hide-on-keyboard className="shrink-0 border-t border-app-border bg-app-surface">
      <div className="flex h-[58px] items-center px-1">
        {items.map(item => {
          const active = currentPath === item.path;
          const Icon = item.icon;
          const isMessagePath = currentPath === '/message';
          return (
            <button
              key={item.id}
              data-trigger={item.id}
              data-trigger-type="tap"
              onClick={() => go(item.id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] ${
                active ? 'text-app-primary' : 'text-app-text-muted'
              }`}
            >
              {item.big ? (
                <span className="grid h-9 w-11 place-items-center rounded-xl bg-app-primary text-white shadow-sm">
                  <Icon size={22} />
                </span>
              ) : (
                <Icon size={22} strokeWidth={active ? 2.6 : 2} />
              )}
              {!item.big && <span>{item.label}</span>}
              {item.id === 'tab.dynamic' && unread > 0 && !isMessagePath && (
                <span className="absolute right-5 top-1 h-2 w-2 rounded-full bg-app-primary" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AppNavigationHandler() {
  const location = useLocation();
  const { back } = useAppNavigate();
  const { navigator } = useContext(UNSAFE_NavigationContext);

  const handleBackPress = useCallback((): boolean => {
    const index = (navigator as { index?: number }).index || 0;
    if (index > 0) {
      back();
      return true;
    }
    if (location.pathname !== '/' || location.search) {
      back();
      return true;
    }
    return false;
  }, [back, location.pathname, location.search, navigator]);

  useAppNavigationHandler(manifest.id, {
    onBack: handleBackPress,
    onNavigate: (path, navigateToPath) => {
      navigateToPath(path.startsWith('/') ? path : `/${path}`);
    },
  });

  return null;
}

function AppShell() {
  const location = useLocation();
  const isMainTab = MAIN_TABS.includes(location.pathname);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-app-bg text-app-text">
      <div className="h-10 shrink-0 bg-app-surface" />
      <div className="relative flex-1 overflow-hidden">
        <Suspense fallback={<div className="grid h-full place-items-center text-sm text-app-text-muted">加载中...</div>}>
          {isMainTab ? (
            <>
              <div style={{ display: location.pathname === '/' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}><HomePage /></div>
              <div style={{ display: location.pathname === '/hot' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}><HotPage /></div>
              <div style={{ display: location.pathname === '/dynamic' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}><DynamicPage /></div>
              <div style={{ display: location.pathname === '/message' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}><MessagePage /></div>
              <div style={{ display: location.pathname === '/me' ? 'flex' : 'none', height: '100%', flexDirection: 'column' }}><MePage /></div>
            </>
          ) : (
            <Routes>
              <Route path="/search" element={<SearchPage />} />
              <Route path="/video/:videoId" element={<VideoDetailPage />} />
              <Route path="/user/:userId" element={<UserProfilePage />} />
              <Route path="/category/:channel" element={<CategoryPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/publish" element={<PublishPage />} />
              <Route path="/profile/edit" element={<ProfileEditPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
        </Suspense>
      </div>
      {isMainTab && <TabBar currentPath={location.pathname} />}
      <div className="h-4 shrink-0 bg-app-surface" />
    </div>
  );
}

export default function BilibiliV2App() {
  return (
    <MemoryRouter initialEntries={['/']}>
      <AppNavigationHandler />
      <AppShell />
    </MemoryRouter>
  );
}

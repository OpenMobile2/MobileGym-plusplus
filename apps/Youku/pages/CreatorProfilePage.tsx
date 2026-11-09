import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { WONTFIX_TOAST } from '../constants';
import { fromSeedAt, dayGroupLabel } from '../utils/appTime';
import { sharePlainText } from '@/os/shareBridge';
import { copyToClipboard } from '../utils/clipboard';
import {
  IcBack, IcChevronDown, IcCirclePlay, IcDm, IcHeart, IcSearch, IcShare, SHORTS,
  EmptyBox, creatorById, fmtCount, mmss,
} from './me/meShared';
import type { ShortVideo } from '../types';

type CreatorTab = 'video' | 'dynamic' | 'like';

/**
 * spec 节点 creator.profile(route /user/:userId)—— 创作者主页(a270/a271/a272)。
 * 三tab(视频/动态/喜欢);已关注 toggle 与 me.following 双向联动;
 * 私信/合集/∨下拉 wontfix;视频卡 → shorts feed 定位该条。粉丝(f_*)复用同构壳,内容空态。
 */
export default function CreatorProfilePage() {
  const { userId = '' } = useParams();
  const { bindTap, action, bindBack } = useYoukuGestures();
  const followingCreators = useYoukuStore((s) => s.followingCreators);
  const fans = useYoukuStore((s) => s.fans);
  const likedDynamics = useYoukuStore((s) => s.likedDynamics);
  const toggleFollowCreator = useYoukuStore((s) => s.toggleFollowCreator);
  const toggleDynamicLike = useYoukuStore((s) => s.toggleDynamicLike);
  const showToast = useYoukuStore((s) => s.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  const creator = creatorById(userId);
  const fan = fans.find((f) => f.userId === userId);

  const name = creator?.name ?? fan?.name ?? '优酷用户';
  const avatar = creator?.avatar ?? fan?.avatar ?? '';
  const bio = creator?.bio ?? fan?.sign ?? '';
  const ipRegion = creator?.ipRegion ?? 'IP属地:未知';
  const likesTotal = creator?.likesTotal ?? '0';
  const fansText = creator?.fansText ?? '0';
  const followed = followingCreators.includes(userId);

  // 分享创作者主页:走系统分享(ACTION_SEND),未接通再回落系统剪贴板复制
  const shareCreator = () => {
    const link = `https://youku.mock/u/${userId}`;
    const launched = sharePlainText(`优酷 @${name} 的主页 ${link}`, {
      onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); },
    });
    if (!launched) {
      copyToClipboard(link);
      showToast('链接已复制');
    }
  };

  const [tab, setTab] = useState<CreatorTab>('video');
  const [sort, setSort] = useState<'latest' | 'mostplayed'>('latest');

  const videos: ShortVideo[] = (creator?.videoIds ?? [])
    .map((id) => SHORTS.find((s) => s.id === id))
    .filter((s): s is ShortVideo => s != null);
  const sortedVideos = sort === 'latest' ? videos : [...videos].sort((a, b) => b.likes - a.likes);
  const likeVideos: ShortVideo[] = (creator?.likeShortIds ?? [])
    .map((id) => SHORTS.find((s) => s.id === id))
    .filter((s): s is ShortVideo => s != null);
  const collection = creator?.collections[0];

  const videoCard = (sv: ShortVideo, transition: 'video' | 'like') => {
    const inner = (
      <div className="overflow-hidden rounded-xl bg-(--app-c-card-bg)">
        <div className="relative aspect-video bg-(--app-c-card-bg)">
          <Img src={sv.cover} label={sv.title} ratio="landscape" className="h-full w-full object-cover" />
          <span className="absolute bottom-1 left-1.5 flex items-center gap-1 text-[11px] text-(--app-c-text-primary) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            <IcCirclePlay size={12} />
            {fmtCount(sv.likes)}
          </span>
          <span className="absolute bottom-1 right-1.5 text-[11px] text-(--app-c-text-primary) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
            {mmss(sv.durationSec)}
          </span>
        </div>
        <div className="p-2">
          <div className="line-clamp-2 text-[13px] leading-snug text-(--app-c-text-primary)">{sv.title}</div>
        </div>
      </div>
    );
    if (transition === 'video') {
      return (
        <div key={sv.id} {...bindTap('creator.profile.video.open', { params: { shortId: sv.id } })} className="cursor-pointer">
          {inner}
        </div>
      );
    }
    return (
      <div key={sv.id} {...bindTap('creator.profile.like.open', { params: { shortId: sv.id } })} className="cursor-pointer">
        {inner}
      </div>
    );
  };

  return (
    <div className="relative flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶部渐变背景 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-52"
        style={{ background: 'linear-gradient(115deg,#3A2B4F 0%,#241833 40%,rgba(0,0,0,0) 75%),radial-gradient(circle at 88% 12%,rgba(200,90,40,0.5),transparent 55%)' }}
      />

      {/* 顶栏:返回 + 私信 + 搜索 + 分享 */}
      <div className="relative z-10 flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <div className="ml-auto flex items-center gap-2.5">
          <button {...action('creator.profile.dm.wontfixToast', wontfix)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 p-0 text-(--app-c-text-primary)">
            <IcDm size={18} />
          </button>
          <button {...action('creator.profile.search.wontfixToast', wontfix)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 p-0 text-(--app-c-text-primary)">
            <IcSearch size={18} />
          </button>
          <button {...action('creator.profile.share.copiedToast', shareCreator)} className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 p-0 text-(--app-c-text-primary)">
            <IcShare size={17} />
          </button>
        </div>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="relative z-10 min-h-0 flex-1 overflow-y-auto pb-6">
        {/* 头部:大头像 + 计数 */}
        <div className="flex items-center px-4 pt-3">
          <Img src={avatar} label={name} ratio="square" className="h-[88px] w-[88px] shrink-0 rounded-full bg-(--app-c-chip-bg) object-cover" />
          <div className="ml-4 flex flex-1 items-start justify-around pt-1">
            <div className="text-center">
              <div className="text-[22px] font-bold leading-none">{likesTotal}</div>
              <div className="mt-1.5 text-[13px] text-[#999999]">获赞</div>
            </div>
            <div className="text-center">
              <div className="text-[22px] font-bold leading-none">1</div>
              <div className="mt-1.5 text-[13px] text-[#999999]">关注</div>
            </div>
            <div className="text-center">
              <div className="text-[22px] font-bold leading-none">{fansText}</div>
              <div className="mt-1.5 text-[13px] text-[#999999]">粉丝</div>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center px-4">
          <span className="min-w-0 truncate text-[24px] font-bold">{name}</span>
          <button
            {...action('creator.profile.follow.toggle', () => toggleFollowCreator(userId))}
            className={`ml-auto shrink-0 cursor-pointer rounded-lg border-none px-5 py-2 text-[14px] font-medium ${
              followed ? 'bg-(--app-c-chip-bg) text-[#CCCCCC]' : 'bg-[#0C7BFF] text-(--app-c-text-primary)'
            }`}
          >
            {followed ? '已关注' : '关注'}
          </button>
          <button
            {...action('creator.profile.dropdown.wontfixToast', wontfix)}
            className="ml-2 flex h-9 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-none bg-(--app-c-chip-bg) p-0 text-(--app-c-text-primary)"
          >
            <IcChevronDown size={18} />
          </button>
        </div>

        {/* 资料行:IP + 认证 + 简介 */}
        <div className="mt-3 px-4">
          <span className="rounded-full bg-(--app-c-chip-bg) px-2.5 py-1 text-[12px] text-[#CCCCCC]">
            {ipRegion.replace('IP属地:', 'IP: ')}
          </span>
          {creator?.verify && (
            <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[#CCCCCC]">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#FF8A00] text-[10px] text-(--app-c-text-primary)">V</span>
              {creator.verify}
            </div>
          )}
          <div className="mt-2 text-[14px] text-[#CCCCCC]">{bio}</div>
        </div>

        {/* tab行:视频 / 动态 / 喜欢 */}
        <div className="mt-4 flex items-baseline gap-8 px-4">
          {(['video', 'dynamic', 'like'] as const).map((tb) => (
            <button
              key={tb}
              {...action('creator.profile.tab.select.option', () => setTab(tb), { params: { value: tb } })}
              className={`cursor-pointer border-none bg-transparent p-0 ${
                tab === tb ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[17px] text-[#8A8A8A]'
              }`}
            >
              {tb === 'video' ? '视频' : tb === 'dynamic' ? '动态' : '喜欢'}
            </button>
          ))}
        </div>

        {/* ---------------- 视频tab(a270) ---------------- */}
        {tab === 'video' && (
          <div className="px-3 pt-3">
            {collection && (
              <div
                {...action('creator.profile.collection.wontfixToast', wontfix)}
                className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-(--app-c-card-bg) p-2"
              >
                <div className="h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-(--app-c-chip-bg)">
                  {videos[0] && <Img src={videos[0].cover} label={collection.name} ratio="landscape" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] text-(--app-c-text-primary)">{collection.name}</div>
                  <div className="mt-0.5 text-[12px] text-[#999999]">合集 · {collection.count}集 最近更新</div>
                </div>
                <span className="shrink-0 rounded-full bg-(--app-c-chip-bg) px-3 py-1.5 text-[13px] text-[#CCCCCC]">全部&gt;</span>
              </div>
            )}
            {videos.length > 0 ? (
              <>
                <div className="mt-3 flex items-center px-1">
                  <span className="text-[15px] font-medium">全部{videos.length}个视频</span>
                  <button
                    {...action(
                      'creator.profile.sort.select.option',
                      () => setSort(sort === 'latest' ? 'mostplayed' : 'latest'),
                      { params: { value: sort === 'latest' ? 'mostplayed' : 'latest' } },
                    )}
                    className="ml-auto flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[14px] text-[#CCCCCC]"
                  >
                    ☰ {sort === 'latest' ? '最新发布' : '最多播放'}
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2.5">{sortedVideos.map((sv) => videoCard(sv, 'video'))}</div>
              </>
            ) : (
              <EmptyBox text="TA还没有发布视频" />
            )}
          </div>
        )}

        {/* ---------------- 动态tab(a271) ---------------- */}
        {tab === 'dynamic' && (
          <div className="px-4 pt-2">
            {(creator?.dynamics ?? []).map((dy) => {
              const sv = dy.shortId ? SHORTS.find((s) => s.id === dy.shortId) : undefined;
              const liked = likedDynamics.includes(dy.id);
              return (
                <div key={dy.id} className="border-b border-[#222222] py-4">
                  <div className="flex items-center gap-2.5">
                    <Img src={avatar} label={name} ratio="square" className="h-10 w-10 rounded-full bg-(--app-c-chip-bg) object-cover" />
                    <div>
                      <div className="text-[15px] font-medium">{name}</div>
                      <div className="mt-0.5 text-[12px] text-[#666666]">{dayGroupLabel(fromSeedAt(dy.at))}</div>
                    </div>
                  </div>
                  <div className="mt-2.5 text-[16px] leading-6 text-(--app-c-text-primary)">{dy.text}</div>
                  {sv && (
                    <div
                      {...bindTap('creator.profile.dynamic.open', { params: { shortId: sv.id } })}
                      className="mt-3 cursor-pointer overflow-hidden rounded-xl bg-(--app-c-card-bg)"
                    >
                      <div className="relative aspect-video">
                        <Img src={sv.cover} label={sv.title} ratio="landscape" className="h-full w-full object-cover" />
                        <span className="absolute bottom-1.5 right-2 text-[12px] text-(--app-c-text-primary) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                          {mmss(sv.durationSec)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 flex items-center justify-between px-2 text-[14px] text-[#CCCCCC]">
                    <button
                      {...action('creator.profile.dynamic.misc.copiedToast', shareCreator)}
                      className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[#CCCCCC]"
                    >
                      <IcShare size={17} />
                      分享
                    </button>
                    <button
                      {...action('creator.profile.dynamic.misc.copiedToast', () => showToast('到视频内和大家一起讨论吧'))}
                      className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[#CCCCCC]"
                    >
                      <IcDm size={17} />
                      评论
                    </button>
                    <button
                      {...action('creator.profile.dynamic.like.toggle', () => toggleDynamicLike(dy.id), {
                        params: { dynamicId: dy.id },
                      })}
                      className={`flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 ${
                        liked ? 'text-[#F5265C]' : 'text-[#CCCCCC]'
                      }`}
                    >
                      <IcHeart size={17} fill={liked ? '#F5265C' : 'none'} />
                      {fmtCount(dy.likes + (liked ? 1 : 0))}
                    </button>
                  </div>
                </div>
              );
            })}
            {(creator?.dynamics ?? []).length === 0 && <EmptyBox text="TA还没有发布动态" />}
          </div>
        )}

        {/* ---------------- 喜欢tab(a272) ---------------- */}
        {tab === 'like' && (
          <div className="px-3 pt-3">
            {likeVideos.length > 0 ? (
              <div className="grid grid-cols-2 gap-2.5">{likeVideos.map((sv) => videoCard(sv, 'like'))}</div>
            ) : (
              <EmptyBox text="TA还没有喜欢的视频" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

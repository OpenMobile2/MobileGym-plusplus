// 短视频频道竖屏流。节点 home.shortvideo(spec v1.3.0,12 条交互)。
// 视觉证据 760:顶部搜索条 + 频道 tab(短视频选中)压在纯黑页上;中部 16:9 视频居中留黑边 +
// 烧录字幕;「全屏观看」深色胶囊;右栏纵列 头像/关注 → 赞2.72万 → 评论345 → 分享 → 追;
// 左下 #有奖征稿话题 chip + 文案 + 关联影片条(海报 + 片名 + 年代题材主演 + 「看正片」)。
// 页面深色(/home/short-video 已登记在 TencentvideoApp 的 DARK_ROUTES),顶栏同步转黑底白字。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTencentvideoStore } from '../state';
import {
  CHANNEL_FULL_TABS,
  CHANNEL_LITE_TABS,
  CHANNEL_SHORTVIDEO_TAB,
  CHANNEL_HOME_TAB,
  TV_COLORS as C,
} from '../constants';
import { ChannelHeader } from '../components/cards';
import { TvImg } from '../components/Img';
import { SwipeVerticalFeed } from '../components/SwipeVerticalFeed';
import type { BindProps } from '../components/ui';
import type { TvShortVideoItem } from '../types';
import { shareEpisodeToWechat } from '../capabilities';
import {
  IcClose,
  IcComment,
  IcFollow,
  IcFullscreen,
  IcHeart,
  IcShare,
} from '../res/icons';

const UI_INDEX = 'home.shortvideo.index';
const UI_COMMENTS = 'home.shortvideo.comments';

export default function HomeShortvideoPage() {
  const { bindTap } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const channels = useTencentvideoStore((st) => st.channels);
  const channelTabs = useTencentvideoStore((st) => st.channelTabs);
  const contents = useTencentvideoStore((st) => st.contents);
  const comments = useTencentvideoStore((st) => st.comments);
  const chasing = useTencentvideoStore((st) => st.chasing);
  const likedContentIds = useTencentvideoStore((st) => st.likedContentIds);
  const followedAuthors = useTencentvideoStore((st) => st.followedAuthors);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);
  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const likeToggle = useTencentvideoStore((st) => st.likeToggle);
  const chaseToggle = useTencentvideoStore((st) => st.chaseToggle);
  const followAuthorToggle = useTencentvideoStore((st) => st.followAuthorToggle);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);

  const items = useMemo(
    () => (channels.shortvideo?.items ?? []) as TvShortVideoItem[],
    [channels.shortvideo?.items],
  );
  const rawIndex = typeof ui[UI_INDEX] === 'number' ? (ui[UI_INDEX] as number) : 0;
  const index = items.length > 0 ? Math.min(Math.max(0, rawIndex), items.length - 1) : 0;
  const commentsOpen = ui[UI_COMMENTS] === true;

  const current = items[index];
  const linkedFilm = current?.linkedFilm
    ? contents.find((c) => c.id === current.linkedFilm)
    : undefined;

  /** 评论按短视频 id 隔离；没有独立线程时才借用关联正片，绝不轮转全站评论。 */
  const thread = useMemo(() => {
    if (!current) return undefined;
    return comments[`sv_${current.id}`] ?? (current.linkedFilm ? comments[current.linkedFilm] : undefined);
  }, [comments, current]);

  const tabBind = (tab: string): BindProps => {
    if (tab === CHANNEL_HOME_TAB) return bindTap('home.feed.switch.fromShortvideo');
    if (CHANNEL_FULL_TABS.includes(tab) || CHANNEL_LITE_TABS.includes(tab)) {
      return bindTap('home.channel.full.switch.fromShortvideo', { params: { channel: tab } });
    }
    // 当前频道自身:无去向,保持选中态
    return {};
  };

  const goNext = () => setUi(UI_INDEX, Math.min(index + 1, Math.max(0, items.length - 1)));
  const goPrev = () => setUi(UI_INDEX, Math.max(index - 1, 0));

  const renderItem = (i: number) => {
    const item = items[i];
    if (!item) return null;
    const liked = likedContentIds.includes(item.id);
    const followedAuthor = followedAuthors.includes(item.author);
    const filmId = item.linkedFilm ?? '';
    const chasingFilm = chasing.some((c) => c.contentId === filmId);
    const film = contents.find((c) => c.id === filmId);
    return (
      <div className="relative h-full w-full" style={{ background: C.darkBg }}>
        {/* 视频画面:竖屏页里横屏素材上下留黑(证据 760) */}
        <div className="absolute inset-x-0 top-[16%] aspect-video">
          <TvImg id={item.cover} alt={item.title} className="w-full h-full object-cover" />
        </div>

        {/* 烧录字幕 + 全屏观看(证据 760:画面正下方) */}
        <div className="absolute inset-x-0 top-[16%] mt-[57%] flex flex-col items-center gap-3">
          <div className="text-white text-[16px] font-bold px-6 text-center truncate max-w-full">
            {item.title.slice(0, 12)}
          </div>
          {film && (
            <button
              {...bindTap('player.fullscreen.open.fromShortvideo', {
                params: { contentId: film.id },
                beforeTrigger: () => openPlayback(film.id, 1),
              })}
              className="inline-flex items-center gap-1 px-3 h-7 rounded-md border-none text-[12px]"
              style={{ background: 'rgba(255,255,255,0.16)', color: '#FFFFFF' }}
            >
              <IcFullscreen size={13} />
              全屏观看
            </button>
          )}
        </div>

        {/* 右侧操作纵列 */}
        <div className="absolute right-2 bottom-[132px] flex flex-col items-center gap-4">
          <div className="relative mb-1">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/80">
              <TvImg id={item.avatar} alt={item.author} className="w-full h-full object-cover" />
            </div>
            <button
              {...bindTap({ kind: 'action', id: 'home.shortvideo.follow.author' }, {
                params: { author: item.author },
                onTrigger: () => followAuthorToggle(item.author),
              })}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-1.5 h-[15px] rounded-full border-none text-[9px] leading-[15px] whitespace-nowrap"
              style={
                followedAuthor
                  ? { background: C.darkCard, color: C.darkTextSub }
                  : { background: C.primary, color: '#FFFFFF' }
              }
            >
              {followedAuthor ? '已关注' : '关注'}
            </button>
          </div>

          <button
            {...bindTap({ kind: 'action', id: 'home.shortvideo.like.toggle' }, {
              params: { videoId: item.id },
              onTrigger: () => likeToggle(item.id),
            })}
            className="flex flex-col items-center gap-0.5 bg-transparent border-none p-0"
            style={{ color: liked ? C.unlockRed : '#FFFFFF' }}
          >
            <IcHeart size={28} />
            <span className="text-[11px]">{item.likesText}</span>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'home.shortvideo.comments.open' }, {
              onTrigger: () => setUi(UI_COMMENTS, true),
            })}
            className="flex flex-col items-center gap-0.5 bg-transparent border-none p-0 text-white"
          >
            <IcComment size={28} />
            <span className="text-[11px]">{item.comments}</span>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'home.shortvideo.share' }, {
              onTrigger: () => {
                const launched = shareEpisodeToWechat(
                  {
                    contentId: film?.id ?? item.id,
                    episode: 1,
                    title: film?.title ?? item.title,
                    subtitle: item.title,
                    cover: film?.poster ?? item.cover,
                    text: `【腾讯视频】${item.title}`,
                  },
                  (result) => toast(result.resultCode === 'OK' ? s.shareSuccess : s.shareCanceled),
                );
                if (!launched) toast(s.shareCanceled);
              },
            })}
            className="flex flex-col items-center gap-0.5 bg-transparent border-none p-0 text-white"
          >
            <IcShare size={26} />
            <span className="text-[11px]">{s.share}</span>
          </button>

          <button
            {...bindTap({ kind: 'action', id: 'home.shortvideo.follow.toggle' }, {
              params: { contentId: filmId },
              onTrigger: () => chaseToggle(filmId),
            })}
            className="flex flex-col items-center gap-0.5 bg-transparent border-none p-0"
            style={{ color: chasingFilm ? C.primary : '#FFFFFF' }}
          >
            <IcFollow size={26} />
            <span className="text-[11px]">{chasingFilm ? '在追' : '追'}</span>
          </button>
        </div>

        {/* 左下:话题 + 文案 + 关联影片条 */}
        <div className="absolute left-3 right-[64px] bottom-3 flex flex-col gap-2">
          {item.topic && (
            <button
              {...bindTap({ kind: 'action', id: 'home.shortvideo.topic.wontfix' }, {
                onTrigger: () => toast(s.notOpen),
              })}
              className="self-start px-2 h-[22px] rounded border-none text-[11px]"
              style={{ background: 'rgba(255,255,255,0.14)', color: '#FFFFFF' }}
            >
              {item.topic}
            </button>
          )}
          <div className="text-white text-[13px] leading-[19px] line-clamp-2">{item.title}</div>
          {film && (
            <div
              className="flex items-center gap-2 p-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.12)' }}
            >
              <div className="w-8 h-11 rounded overflow-hidden shrink-0">
                <TvImg id={film.poster} alt={film.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white text-[13px] font-medium truncate">{film.title}</div>
                <div className="text-[11px] truncate" style={{ color: C.darkTextSub }}>
                  {[film.year, ...film.tags, ...(film.cast ?? []).slice(0, 2).map((m) => m.name)]
                    .filter((t) => t !== undefined)
                    .join(' ')}
                </div>
              </div>
              <button
                {...bindTap('detail.series.open.fromShortvideo', {
                  params: { contentId: film.id },
                  stopPropagation: true,
                })}
                className="shrink-0 px-2.5 h-7 rounded-full border-none text-[12px]"
                style={{ background: '#FFFFFF', color: C.text }}
              >
                看正片
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.darkBg }}>
      <ChannelHeader
        placeholder={channels.home?.searchPlaceholder ?? ''}
        tabs={channelTabs}
        activeTab={CHANNEL_SHORTVIDEO_TAB}
        getTabBind={tabBind}
        filterLabel=""
        immersive
        themeColor={C.darkBg}
      />

      <div className="flex-1 relative overflow-hidden">
        <SwipeVerticalFeed
          index={index}
          count={items.length}
          onNext={goNext}
          onPrev={goPrev}
          renderItem={renderItem}
          dataProps={bindTap({ kind: 'action', id: 'home.shortvideo.swipe.next' }, {
            onTrigger: goNext,
          })}
        />

        {/* 评论半屏面板(uiState「评论半屏面板展开」;视觉参照 ef5586@86 短剧评论面板) */}
        {commentsOpen && (
          <div className="absolute inset-0 z-40 flex flex-col justify-end">
            <div
              {...bindTap({ kind: 'action', id: 'home.shortvideo.comments.open' }, {
                onTrigger: () => setUi(UI_COMMENTS, false),
              })}
              className="absolute inset-0 bg-black/45"
            />
            <div
              className="relative rounded-t-2xl flex flex-col max-h-[62%]"
              style={{ background: C.darkCard }}
            >
              <div className="flex items-center justify-center relative px-4 pt-3 pb-2 shrink-0">
                <span className="text-[14px] font-semibold" style={{ color: C.darkText }}>
                  {`${current?.comments ?? 0}条评论`}
                </span>
                <button
                  {...bindTap({ kind: 'action', id: 'home.shortvideo.comments.open' }, {
                    onTrigger: () => setUi(UI_COMMENTS, false),
                  })}
                  className="absolute right-3 top-2.5 p-1 bg-transparent border-none"
                  style={{ color: C.darkTextSub }}
                  aria-label="关闭"
                >
                  <IcClose size={18} />
                </button>
              </div>
              <div
                className="flex-1 overflow-y-auto px-4 pb-4"
                data-scroll-container="comments"
                data-scroll-direction="vertical"
              >
                {(thread?.items ?? []).map((cmt) => (
                  <div key={cmt.id} className="flex gap-2 py-2">
                    <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
                      <TvImg id={cmt.avatar} alt={cmt.author} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px]" style={{ color: C.darkTextSub }}>
                        {cmt.author}
                      </div>
                      <div className="text-[13px] leading-[19px]" style={{ color: C.darkText }}>
                        {cmt.content}
                      </div>
                      <div className="text-[11px] mt-0.5" style={{ color: C.darkTextSub }}>
                        {`${cmt.date} · ${cmt.region} · ${cmt.likes}赞`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

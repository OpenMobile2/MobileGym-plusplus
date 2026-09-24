// 竖屏沉浸播放器(短剧/短番)。节点 shortdrama.player(spec v1.0.0,19 条交互)。
// 视觉证据:f_006/f_010(播放态:顶栏返回+「第N集」;右侧操作纵列 红心/评论/分享/追;左下
// 广告胶囊 + 片名 + 简介;底栏 #2A2A2A「全集·选集(1/64)·免费 ∧ | 倍速 | 全屏」)、
// f_034(付费锁定态:中央锁 icon +「应片方要求需解锁观看」+ 通栏红色「解锁本集」+ AI 提示)、
// f_044(评论半屏:白底「评论N」+ ∨ 收起 + 楼层列表 + 底部输入框)、756(短番形态共用本页)。
// 面板类交互按 spec 归 uiState 内 state:关闭 = 收起面板,不是 back(只有顶栏返回键才 bindBack)。
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { usePlaybackTicker } from '../hooks/usePlaybackTicker';
import { useTvQuery } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { SideRail, type RailItem } from '../components/shortdrama';
import { SwipeVerticalFeed } from '../components/SwipeVerticalFeed';
import { DanmakuLayer } from '../components/DanmakuLayer';
import { TvImg } from '../components/Img';
import { SimulatedStreamStill } from '../components/SimulatedStreamStill';
import { EmptyState } from '../components/ui';
import { shareEpisodeToWechat } from '../capabilities';
import {
  IcArrowDown, IcArrowUp, IcComment, IcEpisodes, IcFullscreen, IcHeart,
  IcLock, IcNavBack, IcPlay, IcSend, IcShare, IcSpeed,
} from '../res/icons';

/** 竖屏短剧单集时长(真机一集 2~3 分钟;store.openPlayback 对 sd_ 前缀也是这个默认值) */
const EPISODE_SEC = 180;
/** 选集分段每段集数(证据 f_006 底栏「选集(1/64)」,64 集按 30 一段切三段) */
const SEGMENT_SIZE = 30;

const UI_PANEL = 'shortdrama.player.panel'; // '' | 'episodes' | 'comments' | 'speed'
const UI_SEGMENT = 'shortdrama.player.segment';

export default function ShortdramaPlayerPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();
  const requestedContentId = useTvQuery('contentId');
  usePlaybackTicker();

  const contents = useTencentvideoStore((st) => st.contents);
  const playback = useTencentvideoStore((st) => st.playback);
  const player = useTencentvideoStore((st) => st.player);
  const comments = useTencentvideoStore((st) => st.comments);
  const unlockPage = useTencentvideoStore((st) => st.unlockPage);
  const chasing = useTencentvideoStore((st) => st.chasing);
  const likedContentIds = useTencentvideoStore((st) => st.likedContentIds);
  const followedAuthors = useTencentvideoStore((st) => st.followedAuthors);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const openPlayback = useTencentvideoStore((st) => st.openPlayback);
  const playToggle = useTencentvideoStore((st) => st.playToggle);
  const nextEpisode = useTencentvideoStore((st) => st.nextEpisode);
  const selectEpisode = useTencentvideoStore((st) => st.selectEpisode);
  const likeToggle = useTencentvideoStore((st) => st.likeToggle);
  const chaseToggle = useTencentvideoStore((st) => st.chaseToggle);
  const followAuthorToggle = useTencentvideoStore((st) => st.followAuthorToggle);
  const setSpeed = useTencentvideoStore((st) => st.setSpeed);
  const postComment = useTencentvideoStore((st) => st.postComment);
  const sendDanmaku = useTencentvideoStore((st) => st.sendDanmaku);

  const [draft, setDraft] = useState('');
  const [danmakuDraft, setDanmakuDraft] = useState('');
  // 输入后立刻点发送时，React 可能尚未用最新 draft 重渲染按钮闭包。
  // 同步 ref 保留 DOM 最新值，避免快速操作把空字符串提交后又清空输入框。
  const draftRef = useRef('');

  /** 竖屏流只吃短剧/短番;播放上下文没建立(直接敲 URL)时回落到第一部短剧 */
  const verticalPool = useMemo(
    () => contents.filter((c) => c.category === '短剧' || c.category === '短番'),
    [contents],
  );
  const requested = requestedContentId
    ? verticalPool.find((c) => c.id === requestedContentId)
    : undefined;
  const current = playback.contentId ? contents.find((c) => c.id === playback.contentId) : undefined;
  const content = requested ?? (current && verticalPool.includes(current) ? current : verticalPool[0]);
  const contentId = content?.id ?? '';

  useEffect(() => {
    if (!contentId || playback.contentId === contentId) return;
    openPlayback(contentId, 1, EPISODE_SEC);
  }, [contentId, playback.contentId, openPlayback]);

  const panel = (ui[UI_PANEL] as string) ?? '';
  const total = content?.episodes ?? 1;
  const episode = Math.min(playback.episodeIndex, total);
  // 付费锁定:种子 freeUpTo 之后的集数需要解锁(证据 f_034「应片方要求需解锁观看」)
  const freeUpTo = typeof content?.freeUpTo === 'number' ? content.freeUpTo : total;
  const locked = episode > freeUpTo;

  const segments = useMemo(() => {
    const out: { key: string; from: number; to: number }[] = [];
    for (let from = 1; from <= total; from += SEGMENT_SIZE) {
      const to = Math.min(from + SEGMENT_SIZE - 1, total);
      out.push({ key: `${from}-${to}`, from, to });
    }
    return out;
  }, [total]);
  const activeSegment =
    (ui[UI_SEGMENT] as string) ||
    segments.find((sg) => episode >= sg.from && episode <= sg.to)?.key ||
    segments[0]?.key ||
    '';
  const segment = segments.find((sg) => sg.key === activeSegment) ?? segments[0];

  /** 周边视频:同族其他竖屏内容(证据 f_012 详情面板下半区) */
  const peripheral = useMemo(
    () => verticalPool.filter((c) => c.id !== contentId).slice(0, 6),
    [verticalPool, contentId],
  );

  const thread = comments[contentId];
  const sideStats = content?.sideStats as
    | { like?: string; comment?: number; share?: number }
    | undefined;
  const author = content?.director ?? content?.title ?? '';
  const isChasing = chasing.some((x) => x.contentId === contentId);
  const isLiked = likedContentIds.includes(contentId);
  const isFollowing = followedAuthors.includes(author);

  if (!content) return <EmptyState text="暂无竖屏内容" dark />;

  /* ---------- 画面层 ---------- */

  // 单击画面 = 播放/暂停;stopPropagation 拦住冒泡,避免同时触发容器上的上滑翻集
  const surfaceBind = bindTap({ kind: 'action', id: 'shortdrama.player.play.toggle' }, {
    stopPropagation: true,
    onTrigger: playToggle,
  });
  // 上滑切下一集:action 打在滑动容器上(brief §2 swipe 落地惯例),真实滑动走 onNext
  const swipeBind = bindTap({ kind: 'action', id: 'shortdrama.player.swipe.next' }, {
    onTrigger: nextEpisode,
  });

  const rail: RailItem[] = [
    {
      key: 'author',
      ariaLabel: isFollowing ? '已关注' : '关注',
      icon: (
        <span className="relative block mb-1.5">
          <TvImg
            id={content.poster}
            alt={author}
            className="w-9 h-9 rounded-full object-cover border border-white/70"
          />
          <span
            className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 px-1 rounded-full text-[9px] leading-[13px] text-white whitespace-nowrap"
            style={{ background: isFollowing ? C.textTertiary : C.unlockRed }}
          >
            {isFollowing ? '已关注' : '关注'}
          </span>
        </span>
      ),
      bind: bindTap({ kind: 'action', id: 'shortdrama.player.follow.author' }, {
        onTrigger: () => followAuthorToggle(author),
      }),
    },
    {
      key: 'like',
      ariaLabel: '点赞',
      icon: <IcHeart size={30} />,
      // 点亮后计数 +1(证据「红心 1.07万」→ 1.07万+1)
      label: sideStats?.like ? bumpCount(sideStats.like, isLiked ? 1 : 0) : undefined,
      active: isLiked,
      bind: bindTap({ kind: 'action', id: 'shortdrama.player.like.toggle' }, {
        onTrigger: () => likeToggle(contentId),
      }),
    },
    {
      key: 'comment',
      ariaLabel: '评论',
      icon: <IcComment size={30} />,
      label: thread ? String(thread.total) : sideStats?.comment ? String(sideStats.comment) : undefined,
      bind: bindTap({ kind: 'action', id: 'shortdrama.player.comments.open' }, {
        onTrigger: () => setUi(UI_PANEL, 'comments'),
      }),
    },
    {
      key: 'share',
      ariaLabel: '分享',
      icon: <IcShare size={30} />,
      label: '分享',
      bind: bindTap({ kind: 'action', id: 'shortdrama.player.share' }, {
        onTrigger: () => {
          const launched = shareEpisodeToWechat(
            {
              contentId: content.id,
              episode,
              title: content.title,
              cover: content.poster,
            },
            (result) => toast(result.resultCode === 'OK' ? s.shareSuccess : s.shareCanceled),
          );
          if (!launched) toast(s.shareCanceled);
        },
      }),
    },
    {
      key: 'chase',
      ariaLabel: isChasing ? '在追' : '追',
      icon: <IcEpisodes size={30} />,
      label: isChasing ? '在追' : '追',
      active: isChasing,
      bind: bindTap({ kind: 'action', id: 'shortdrama.player.follow.toggle' }, {
        onTrigger: () => chaseToggle(contentId),
      }),
    },
  ];

  /* ---------- 面板 ---------- */

  const episodesPanel = panel === 'episodes' && segment && (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        {...bindTap({ kind: 'action', id: 'shortdrama.player.episodes.open' }, {
          onTrigger: () => setUi(UI_PANEL, ''),
        })}
        className="absolute inset-0 bg-black/45"
      />
      <div
        className="relative rounded-t-2xl max-h-[70%] flex flex-col"
        style={{ background: '#1C1C1C' }}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <span className="text-[16px] font-semibold" style={{ color: C.darkText }}>
            {content.title}
          </span>
          <span className="text-[12px]" style={{ color: C.darkTextSub }}>
            全{total}集 · {content.badge}
          </span>
        </div>
        <div
          className="flex gap-2 overflow-x-auto px-4 pb-2 shrink-0 scrollbar-none"
          data-scroll-container="segments"
          data-scroll-direction="horizontal"
        >
          {segments.map((sg) => (
            <button
              key={sg.key}
              {...bindTap({ kind: 'action', id: 'shortdrama.player.segment.switch' }, {
                onTrigger: () => setUi(UI_SEGMENT, sg.key),
              })}
              className="shrink-0 px-3 py-1 rounded-full border-none text-[13px]"
              style={
                sg.key === activeSegment
                  ? { background: 'rgba(6,191,184,0.20)', color: C.primary }
                  : { background: 'rgba(255,255,255,0.12)', color: C.darkTextSub }
              }
            >
              {sg.key}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="episodeGrid">
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: segment.to - segment.from + 1 }, (_, i) => segment.from + i).map(
              (ep) => {
                const epLocked = ep > freeUpTo;
                const playing = ep === episode;
                return (
                  <button
                    key={ep}
                    {...bindTap({ kind: 'action', id: 'shortdrama.player.episode.select' }, {
                      onTrigger: () => {
                        selectEpisode(ep);
                        setUi(UI_PANEL, '');
                      },
                    })}
                    className="relative h-10 rounded-md border-none text-[14px]"
                    style={{
                      background: playing ? 'rgba(6,191,184,0.20)' : 'rgba(255,255,255,0.12)',
                      color: playing ? C.primary : C.darkText,
                    }}
                  >
                    {ep}
                    {epLocked && (
                      <span
                        className="absolute top-0.5 right-0.5"
                        style={{ color: C.vipBadgeBg }}
                        aria-hidden
                      >
                        <IcLock size={9} />
                      </span>
                    )}
                  </button>
                );
              },
            )}
          </div>
          <div className="pt-4 pb-1 text-[14px] font-semibold" style={{ color: C.darkText }}>
            周边视频
          </div>
          <div
            className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
            data-scroll-container="peripheral"
            data-scroll-direction="horizontal"
          >
            {peripheral.map((p) => (
              <button
                key={p.id}
                {...bindTap({ kind: 'action', id: 'shortdrama.player.peripheral.open' }, {
                  params: { contentId: p.id },
                  onTrigger: () => {
                    openPlayback(p.id, 1, EPISODE_SEC);
                    setUi(UI_PANEL, '');
                  },
                })}
                className="shrink-0 w-[86px] bg-transparent border-none p-0 text-left"
              >
                <TvImg
                  id={p.poster}
                  alt={p.title}
                  className="w-full aspect-[3/4] rounded-lg object-cover"
                />
                <span
                  className="block mt-1 text-[12px] truncate"
                  style={{ color: C.darkText }}
                >
                  {p.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const commentsPanel = panel === 'comments' && (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        {...bindTap({ kind: 'action', id: 'shortdrama.player.comments.close' }, {
          onTrigger: () => setUi(UI_PANEL, ''),
        })}
        className="absolute inset-0 bg-black/45"
      />
      <div
        className="relative rounded-t-2xl h-[68%] flex flex-col"
        style={{ background: C.pageBg }}
      >
        <div className="flex items-center justify-between px-4 pt-3.5 pb-2 shrink-0">
          <span className="text-[15px] font-semibold" style={{ color: C.text }}>
            评论{thread ? thread.total : 0}
          </span>
          <button
            {...bindTap({ kind: 'action', id: 'shortdrama.player.comments.close' }, {
              onTrigger: () => setUi(UI_PANEL, ''),
            })}
            className="bg-transparent border-none p-1"
            style={{ color: C.textSub }}
            aria-label="收起评论"
          >
            <IcArrowDown size={20} />
          </button>
        </div>
        <div
          className="flex-1 overflow-y-auto px-4"
          data-scroll-container="comments"
          data-scroll-direction="vertical"
        >
          {thread ? (
            thread.items.map((c) => (
              <div key={c.id} className="flex gap-2.5 py-2.5">
                <TvImg
                  id={c.avatar}
                  alt={c.author}
                  className="shrink-0 w-8 h-8 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px]" style={{ color: C.textSub }}>
                      {c.author}
                    </span>
                    {c.badges.map((b) => (
                      <span
                        key={b}
                        className="px-1 rounded-[3px] text-[9px] leading-[14px]"
                        style={{ background: C.vipBadgeBg, color: C.vipBadgeText }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="text-[14px] leading-[20px] mt-0.5" style={{ color: C.text }}>
                    {c.content}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: C.textTertiary }}>
                    {c.date} {c.region}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState text="还没有评论,来说两句" />
          )}
        </div>
        <div
          className="shrink-0 flex items-center gap-2 px-4 py-2.5 border-t"
          style={{ borderColor: C.chipGray }}
          // 键盘配件:点发送时键盘别收,收了输入条会掉回底部把这一下吃掉
          data-keep-keyboard="true"
        >
          <input
            value={draft}
            onChange={(e) => {
              draftRef.current = e.target.value;
              setDraft(e.target.value);
            }}
            placeholder="我来说两句"
            className="flex-1 min-w-0 h-9 rounded-full px-3 text-[13px] border-none outline-none"
            style={{ background: C.chipGray, color: C.text }}
          />
          <button
            {...bindTap({ kind: 'action', id: 'shortdrama.player.comment.post' }, {
              onTrigger: () => {
                postComment(contentId, draftRef.current);
                draftRef.current = '';
                setDraft('');
              },
            })}
            className="shrink-0 bg-transparent border-none p-1"
            style={{ color: draft.trim() ? C.primary : C.textTertiary }}
            aria-label={s.send}
          >
            <IcSend size={20} />
          </button>
        </div>
      </div>
    </div>
  );

  const speedPanel = panel === 'speed' && (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div
        {...bindTap({ kind: 'action', id: 'shortdrama.player.speed.open' }, {
          onTrigger: () => setUi(UI_PANEL, ''),
        })}
        className="absolute inset-0 bg-black/45"
      />
      <div className="relative rounded-t-2xl px-4 pt-4 pb-6" style={{ background: '#1C1C1C' }}>
        <div className="text-[15px] font-semibold pb-3" style={{ color: C.darkText }}>
          {s.sheetSpeed}
        </div>
        <div className="flex gap-2 flex-wrap">
          {player.speeds.map((v) => (
            <button
              key={v}
              {...bindTap({ kind: 'action', id: 'shortdrama.player.speed.open' }, {
                onTrigger: () => {
                  setSpeed(v);
                  setUi(UI_PANEL, '');
                },
              })}
              className="px-4 py-1.5 rounded-full border-none text-[14px]"
              style={
                v === playback.speed
                  ? { background: 'rgba(6,191,184,0.20)', color: C.primary }
                  : { background: 'rgba(255,255,255,0.12)', color: C.darkText }
              }
            >
              {v}X
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  /* ---------- 页面 ---------- */

  const progressPct =
    playback.durationSec > 0 ? (playback.positionSec / playback.durationSec) * 100 : 0;

  return (
    <div
      className="relative flex flex-col h-full"
      style={{ background: C.darkBg }}
      data-status-bar-foreground="light"
    >
      {/* 竖屏画面:上下滑切集 */}
      <div className="flex-1 relative overflow-hidden">
        <SwipeVerticalFeed
          index={episode - 1}
          count={total}
          onNext={nextEpisode}
          onPrev={() => selectEpisode(Math.max(1, episode - 1))}
          dataProps={swipeBind}
          renderItem={(i) => (
            <div {...surfaceBind} className="absolute inset-0">
              <SimulatedStreamStill
                stillId={content.still ?? content.poster}
                alt={content.title}
                contentKey={`${contentId}:ep${i + 1}`}
                positionSec={i === episode - 1 ? playback.positionSec : 0}
                extraFilter={locked && i === episode - 1 ? 'brightness(0.45)' : undefined}
              />
              <span className="absolute inset-x-0 bottom-[22%] text-center text-[10px] text-white/45">
                (腾讯)网微剧备字(2026)
              </span>
            </div>
          )}
        />

        <DanmakuLayer className="top-12" />

        {/* 顶栏:返回 + 第N集 */}
        <div className="absolute inset-x-0 top-0 z-20 flex items-center h-11 px-2">
          <button
            {...bindBack()}
            className="bg-transparent border-none p-1 text-white"
            aria-label={s.back}
          >
            <IcNavBack size={22} />
          </button>
          <div className="flex-1 text-center text-[15px] text-white">第{episode}集</div>
          <div className="w-8" />
        </div>

        {/* 暂停态大播放键 */}
        {!playback.playing && !locked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <span className="text-white/85">
              <IcPlay size={54} />
            </span>
          </div>
        )}

        {/* 付费锁定态(证据 f_034) */}
        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 pointer-events-none">
            <span className="text-white/90">
              <IcLock size={30} />
            </span>
            <span className="text-[14px] text-white/90">{unlockPage.title}</span>
          </div>
        )}

        <SideRail items={rail} className="absolute right-3 bottom-[26%] z-20" />

        {/* 左下角:广告胶囊 + 片名 + 简介 + AI 提示 */}
        <div className="absolute left-3 right-[64px] bottom-3 z-20">
          <button
            {...bindTap({ kind: 'action', id: 'shortdrama.player.ad.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="inline-flex items-center gap-1 px-2 h-6 rounded-md border-none text-[11px] text-white mb-1.5"
            style={{ background: 'rgba(255,255,255,0.20)' }}
          >
            <TvImg id="banner_game.png" alt="" className="w-3.5 h-3.5 rounded-sm object-cover" />
            万部高燃漫剧免费看
          </button>
          <div className="text-[15px] font-semibold text-white truncate">{content.title}</div>
          <div className="text-[12px] leading-[17px] text-white/75 line-clamp-2">{content.desc}</div>
          {typeof content.aiNote === 'string' && (
            <div className="text-[10px] mt-1 text-white/50">{content.aiNote}</div>
          )}
        </div>
      </div>

      {/* 解锁 CTA:锁定态压在底栏之上的通栏红胶囊(证据 f_034) */}
      {locked && (
        <button
          {...bindTap({ kind: 'action', id: 'shortdrama.player.unlock.wontfix' }, {
            onTrigger: () => toast(s.notOpen),
          })}
          className="shrink-0 mx-3 mb-2 h-11 rounded-lg border-none text-[16px] font-semibold text-white"
          style={{ background: C.unlockRed }}
        >
          {unlockPage.btn}
        </button>
      )}

      {/* 进度条:竖屏流只做展示(本节点未申报拖动交互) */}
      {!locked && (
        <div className="shrink-0 flex items-center gap-2 px-3 py-1.5" style={{ background: C.darkEpisodeBar }}>
          <input
            value={danmakuDraft}
            onChange={(event) => setDanmakuDraft(event.target.value)}
            data-action="shortdrama.player.danmaku.input"
            data-action-type="input"
            placeholder="发个友善的弹幕吧"
            className="min-w-0 flex-1 h-8 rounded-full border-none px-3 text-[12px]"
          />
          <button
            {...bindTap({ kind: 'action', id: 'shortdrama.player.danmaku.send' }, {
              onTrigger: () => {
                sendDanmaku(danmakuDraft);
                setDanmakuDraft('');
              },
            })}
            disabled={!danmakuDraft.trim()}
            className="border-none bg-transparent text-[13px] disabled:opacity-40"
            style={{ color: C.primary }}
          >发送</button>
        </div>
      )}
      <div className="shrink-0 h-[2px] mx-3" style={{ background: C.progressRest }}>
        <div className="h-full" style={{ width: `${progressPct}%`, background: C.primarySoft }} />
      </div>

      {/* 底栏:选集 / 倍速 / 全屏 */}
      <div
        className="shrink-0 flex items-center gap-2 px-3 h-12"
        style={{ background: C.darkEpisodeBar }}
      >
        <button
          {...bindTap({ kind: 'action', id: 'shortdrama.player.episodes.open' }, {
            onTrigger: () => setUi(UI_PANEL, panel === 'episodes' ? '' : 'episodes'),
          })}
          className="flex-1 min-w-0 flex items-center gap-1.5 bg-transparent border-none p-0 text-left"
        >
          <TvImg
            id={content.poster}
            alt={content.title}
            className="shrink-0 w-6 h-8 rounded object-cover"
          />
          <span className="flex-1 min-w-0 text-[13px] text-white truncate">
            全集 · 选集({episode}/{total}) · {content.badge}
          </span>
          <span style={{ color: C.darkTextSub }}>
            <IcArrowUp size={16} />
          </span>
        </button>
        <button
          {...bindTap({ kind: 'action', id: 'shortdrama.player.speed.open' }, {
            onTrigger: () => setUi(UI_PANEL, panel === 'speed' ? '' : 'speed'),
          })}
          className="shrink-0 flex items-center gap-1 bg-transparent border-none px-1 text-[13px] text-white"
        >
          <IcSpeed size={15} />
          {playback.speed === 1 ? s.speed : `${playback.speed}X`}
        </button>
        <button
          {...bindTap('player.fullscreen.open.fromShortdrama', {
            params: { contentId },
            beforeTrigger: () => openPlayback(contentId, episode, EPISODE_SEC),
          })}
          className="shrink-0 bg-transparent border-none px-1 text-white"
          aria-label="全屏"
        >
          <IcFullscreen size={16} />
        </button>
      </div>

      {episodesPanel}
      {commentsPanel}
      {speedPanel}
    </div>
  );
}

/**
 * 计数文案 +N。种子里的赞数可能是「1.07万」这种口径(sideStats.like),
 * 点亮后要跟着 +1 又不能改口径,所以还原成整数再按原口径格式化。
 */
function bumpCount(text: string, delta: number): string {
  const wan = text.endsWith('万');
  const base = wan ? Math.round(Number(text.slice(0, -1)) * 10000) : Number(text);
  if (!Number.isFinite(base)) return text;
  const next = base + delta;
  return wan ? `${(next / 10000).toFixed(2)}万` : String(next);
}

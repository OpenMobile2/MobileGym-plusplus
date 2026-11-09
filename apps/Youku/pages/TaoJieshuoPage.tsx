import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { selectComments, useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import { fmtDuration, fmtMdHm } from '../utils/appTime';
import Img from '../components/Img';
import TaoSubTabs from '../components/TaoSubTabs';
import {
  SHORTS, JIESHUO_IDS, catalogById, creatorById, fmtCount, jieshuoLocator, taoDraft, typeLabel, useSwipe,
} from '../components/feedShared';
import { IcCheck, IcComment, IcHeart, IcPlay, IcPlus, IcStar, IcTimeTag } from '../components/feedIcons';

/**
 * spec 节点 taohaopian.jieshuo(route /taohaopian/jieshuo)—— 热门解说竖屏feed(s190~s194)。
 * uiStates:feed(半屏解说+右侧操作栏+关联影片卡)/ followedItem(『你关注的』标签,条件渲染)/
 * discussion(?discussion=1 URL 驱动,AGENTS 弹层合同:action handler push search,收起=back)。
 * 跨路由易失态:发布面板草稿走 feedShared.taoDraft;『看解说』定位走 jieshuoLocator;
 * feed 位置用模块级单例(发布面板往返后不丢条目)。
 */

/** feed 位置(模块级易失单例:publish sheet 往返/子tab互切回来保持当前条目) */
const feedPos = { idx: 0 };

/** 投票基数(spec s194 百万级『x万次』;域数据无种子,按条目点赞数确定性推导) */
const voteBase = (likes: number): Record<string, number> => ({
  xihuan: likes * 81,
  youyisi: likes * 54,
  luguo: likes * 29,
});
const VOTE_EMOJI: Record<string, string> = { xihuan: '🤩', youyisi: '🤣', luguo: '🍉' };

export default function TaoJieshuoPage() {
  const { bindTap, action, back } = useYoukuGestures();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const discussionOpen = searchParams.get('discussion') === '1';

  const feed = JIESHUO_IDS
    .map((id) => SHORTS.find((s) => s.id === id))
    .filter((s): s is (typeof SHORTS)[number] => !!s);

  const [idx, setIdx] = useState(() => {
    if (jieshuoLocator.contentId) {
      const i = feed.findIndex((s) => s.linkedContentId === jieshuoLocator.contentId);
      if (i >= 0) return i;
    }
    return Math.min(feedPos.idx, feed.length - 1);
  });
  const [paused, setPaused] = useState(false);
  // 『标时间』草稿变更后触发重渲(taoDraft 为非响应式单例)
  const [, setDraftTick] = useState(0);

  // 消费定位单例 + 回写位置单例(effect 幂等,StrictMode 安全)
  useEffect(() => {
    jieshuoLocator.contentId = null;
    feedPos.idx = idx;
  }, [idx]);

  const item = feed[idx] ?? feed[0];
  const creator = creatorById(item.creatorId);
  const linked = catalogById(item.linkedContentId);

  const showToast = useYoukuStore((s) => s.showToast);
  const toggleLike = useYoukuStore((s) => s.toggleLike);
  const toggleFavorite = useYoukuStore((s) => s.toggleFavorite);
  const toggleFollowCreator = useYoukuStore((s) => s.toggleFollowCreator);
  const toggleCommentLike = useYoukuStore((s) => s.toggleCommentLike);
  const voteJieshuo = useYoukuStore((s) => s.voteJieshuo);
  const writeProgress = useYoukuStore((s) => s.writeProgress);
  const liked = useYoukuStore((s) => s.likes.some((e) => e.id === item.id));
  const faved = useYoukuStore((s) => s.favorites.some((e) => e.id === item.id));
  const following = useYoukuStore((s) => s.followingCreators.includes(item.creatorId));
  const voted = useYoukuStore((s) => s.votes[item.id]);
  const comments = useYoukuStore((s) => selectComments(s, item.id));
  const userAvatar = useYoukuStore((s) => s.user.avatar);

  // 观看进度写历史(00-scope Q2,与 shorts.feed 同构;upsert 幂等)
  useEffect(() => {
    writeProgress({
      id: item.id,
      ctype: 'short',
      progressSec: Math.min(60, item.durationSec),
      durationSec: item.durationSec,
    });
  }, [item.id, item.durationSec, writeProgress]);

  const switchTo = (next: number) => {
    if (next < 0 || next >= feed.length) return;
    setIdx(next);
    setPaused(false);
  };
  const feedSwipe = useSwipe<HTMLDivElement>('v', () => switchTo(idx + 1), () => switchTo(idx - 1));

  const toggleDiscussion = () => {
    if (discussionOpen) {
      back();
      return;
    }
    setSearchParams((p) => {
      p.set('discussion', '1');
      return p;
    });
  };
  // discussion 态:视频区/把手 下滑收起(swipe-down = onPrev)
  const collapseSwipe = useSwipe<HTMLDivElement>('v', () => undefined, () => {
    if (discussionOpen) back();
  });
  // feed 态:底部视频信息区上滑展开讨论区(spec『视频信息区 swipe-up』);
  // 信息区嵌在 feed 滑动容器内,pointer 事件需截断以免同时触发切条
  const infoSwipeRaw = useSwipe<HTMLDivElement>('v', () => {
    if (!discussionOpen) toggleDiscussion();
  }, () => undefined);
  const infoSwipe: typeof infoSwipeRaw = {
    onPointerDown: (e) => {
      e.stopPropagation();
      infoSwipeRaw.onPointerDown?.(e);
    },
    onPointerUp: (e) => {
      e.stopPropagation();
      infoSwipeRaw.onPointerUp?.(e);
    },
    onPointerCancel: (e) => {
      e.stopPropagation();
      infoSwipeRaw.onPointerCancel?.(e);
    },
    onClickCapture: infoSwipeRaw.onClickCapture,
  };

  /** 『标时间』:把当前播放时间点插入评论输入框文本(qa:Q5答案B;静态帧方案取 1/3 时长) */
  const insertTimeTag = () => {
    taoDraft.shortId = item.id;
    taoDraft.text = `${taoDraft.text}${fmtDuration(Math.floor(item.durationSec / 3))} `;
    setDraftTick((n) => n + 1);
  };

  const base = voteBase(item.likes);

  const videoBlock = (
    <div
      {...action('taohaopian.jieshuo.playToggle', () => setPaused((p) => !p))}
      className="relative w-full cursor-pointer"
    >
      <Img src={item.cover} label={item.title} ratio="landscape" className="aspect-video w-full object-cover" />
      <div className="absolute inset-x-0 bottom-2 px-4 text-center text-[15px] font-bold text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
        {item.title}
      </div>
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IcPlay size={44} className="fill-white/85 text-white/85" />
        </div>
      )}
    </div>
  );

  return (
    <div
      data-status-bar-foreground="light"
      className="relative flex h-full w-full flex-col overflow-hidden bg-black pt-10"
    >
      <TaoSubTabs
        active="jieshuo"
        toHot={bindTap('taohaopian.jieshuo.hot.open')}
        toUpcoming={bindTap('taohaopian.jieshuo.upcoming.open')}
        search={bindTap('taohaopian.jieshuo.search.open')}
      />

      {!discussionOpen ? (
        /* ---- feed 态(s190~s193):上下滑切条 ---- */
        <div
          data-action="taohaopian.jieshuo.feed.switch"
          data-action-type="swipe"
          data-scroll-container="main"
          data-scroll-direction="vertical"
          {...feedSwipe}
          className="relative min-h-0 flex-1 touch-none select-none overflow-hidden"
        >
          <div className="flex h-full flex-col">
            <div className="flex min-h-0 flex-1 items-center justify-center">{videoBlock}</div>
            <div className="flex shrink-0 justify-center pb-44 pt-3">
              <button
                {...action('taohaopian.jieshuo.fullscreen.wontfixToast', () => showToast(WONTFIX_TOAST))}
                className="cursor-pointer rounded-full border border-[#555555] bg-black/40 px-4 py-1.5 text-[13px] text-white"
              >
                {t('shorts.feed.fullscreen')}
              </button>
            </div>
          </div>

          {/* 右侧操作栏:头像+关注 / 点赞 / 评论 / 收藏 */}
          <div className="absolute bottom-36 right-3 z-10 flex flex-col items-center gap-5">
            <div className="relative">
              <button
                {...bindTap('taohaopian.jieshuo.author.open', { params: { userId: item.creatorId } })}
                aria-label={creator?.name}
                className="block cursor-pointer rounded-full border-2 border-white/80 bg-transparent p-0"
              >
                <Img src={creator?.avatar} label={creator?.name ?? ''} ratio="square" className="h-11 w-11 rounded-full object-cover" />
              </button>
              {/* followedItem 态:已关注头像无 + 号(s193) */}
              <button
                {...action('taohaopian.jieshuo.follow.toggle', () => toggleFollowCreator(item.creatorId), { stopPropagation: true })}
                aria-label={following ? '已关注' : '关注'}
                className={`absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 cursor-pointer items-center justify-center rounded-full border-none text-white ${
                  following ? 'bg-[#666666]' : 'bg-[#F5265C]'
                }`}
              >
                {following ? <IcCheck size={12} /> : <IcPlus size={14} />}
              </button>
            </div>
            <button
              {...action('taohaopian.jieshuo.like.toggle', () => toggleLike(item.id, 'short'))}
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white"
            >
              <IcHeart size={30} className={liked ? 'fill-[#F5265C] text-[#F5265C]' : ''} />
              <span className="text-[12px]">{fmtCount(item.likes + (liked ? 1 : 0))}</span>
            </button>
            <button
              {...action('taohaopian.jieshuo.discussion.toggle', toggleDiscussion)}
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white"
            >
              <IcComment size={28} />
              <span className="text-[12px]">{t('tao.jieshuo.commentLabel')}</span>
            </button>
            <button
              {...action('taohaopian.jieshuo.fav.toggle', () => toggleFavorite(item.id, 'short'))}
              className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 text-white"
            >
              <IcStar size={28} className={faved ? 'fill-[#F7CE45] text-[#F7CE45]' : ''} />
              <span className="text-[12px]">{t('tao.jieshuo.favLabel')}</span>
            </button>
          </div>

          {/* 底部:『你关注的』标签 + @解说号文案 + 关联影片卡(swipe-up 展开讨论区) */}
          <div
            data-action="taohaopian.jieshuo.discussion.toggle"
            data-action-type="swipe"
            {...infoSwipe}
            className="absolute inset-x-0 bottom-0 z-10 px-3 pb-2"
          >
            <div className="flex items-start gap-1.5 pr-16">
              {following && (
                <span className="mt-0.5 shrink-0 rounded bg-[#3A3A3A]/90 px-1.5 py-0.5 text-[11px] text-[#CCCCCC]">
                  {t('tao.jieshuo.followed')}
                </span>
              )}
              <span className="min-w-0 text-[14px] leading-5 text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                @{creator?.name}:{item.title}
              </span>
            </div>
            {linked && (
              <div
                {...bindTap('taohaopian.jieshuo.player.open', { params: contentNavParams(linked) })}
                className="mt-2.5 flex cursor-pointer items-center gap-2.5 rounded-xl bg-[#2A2A2A]/85 p-2"
              >
                <Img src={linked.poster} label={linked.title} ratio="poster" className="h-14 w-10 shrink-0 rounded-md object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-white">{linked.title}</div>
                  <div className="truncate text-[12px] text-[#999999]">
                    {typeLabel(String(linked.type))}|{linked.actors.slice(0, 2).join(' ')}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-[#4A4A4A] px-3.5 py-1.5 text-[13px] text-white">
                  {t('shorts.feed.gowatch')}
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ---- discussion 态(s194):视频缩顶部 + 大家都在讨论 + 投票卡 + 评论列表 + 底部输入 ---- */
        <div className="flex min-h-0 flex-1 flex-col">
          <div
            data-action="taohaopian.jieshuo.discussion.toggle"
            data-action-type="swipe"
            {...collapseSwipe}
            className="shrink-0 touch-none select-none"
          >
            {videoBlock}
            {/* 拖动把手:下滑/点按收起 */}
            <div
              {...action('taohaopian.jieshuo.discussion.toggle', toggleDiscussion)}
              className="flex cursor-pointer justify-center py-2"
            >
              <div className="h-1 w-9 rounded-full bg-[#3A3A3A]" />
            </div>
          </div>

          <div
            data-scroll-container="main"
            data-scroll-direction="vertical"
            className="min-h-0 flex-1 overflow-y-auto px-3"
          >
            <div className="text-[18px] font-bold text-white">{t('tao.jieshuo.discussTitle')}</div>
            {/* 评论课代表引导卡 */}
            <div className="mt-3 flex items-center gap-2.5">
              <Img src="" label={t('tao.jieshuo.guideName')} ratio="square" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              <div className="min-w-0">
                <div className="text-[13px] text-[#999999]">{t('tao.jieshuo.guideName')}</div>
                <div className="mt-0.5 text-[15px] text-white">{t('tao.jieshuo.guideText')}</div>
              </div>
            </div>
            {/* 投票卡(单选一次;spec 拍板 option:xihuan/youyisi/luguo) */}
            <div className="ml-[50px] mt-2.5 rounded-xl bg-[#1F1F1F] p-3.5">
              <div className="text-[14px] font-bold text-white">💬 {t('tao.jieshuo.voteTitle')}</div>
              <div className="mt-3 flex justify-between px-1">
                {(['xihuan', 'youyisi', 'luguo'] as const).map((op) => {
                  const cnt = base[op] + (voted === op ? 1 : 0);
                  const cls = `flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent p-0 ${
                    voted && voted !== op ? 'opacity-40' : ''
                  }`;
                  const body = (
                    <>
                      <span className="text-[32px] leading-9">{VOTE_EMOJI[op]}</span>
                      <span className={`text-[13px] ${voted === op ? 'font-bold text-white' : 'text-[#CCCCCC]'}`}>
                        {t(`tao.jieshuo.vote.${op}`)}
                      </span>
                      <span className="text-[11px] text-[#666666]">
                        {t('tao.jieshuo.voteCount', { n: fmtCount(cnt) })}
                      </span>
                    </>
                  );
                  if (op === 'xihuan')
                    return (
                      <button
                        key={op}
                        {...action('taohaopian.jieshuo.vote.select.xihuan', () => voteJieshuo(item.id, 'xihuan'), { params: { shortId: item.id } })}
                        className={cls}
                      >
                        {body}
                      </button>
                    );
                  if (op === 'youyisi')
                    return (
                      <button
                        key={op}
                        {...action('taohaopian.jieshuo.vote.select.youyisi', () => voteJieshuo(item.id, 'youyisi'), { params: { shortId: item.id } })}
                        className={cls}
                      >
                        {body}
                      </button>
                    );
                  return (
                    <button
                      key={op}
                      {...action('taohaopian.jieshuo.vote.select.luguo', () => voteJieshuo(item.id, 'luguo'), { params: { shortId: item.id } })}
                      className={cls}
                    >
                      {body}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 评论列表(交互同播放页讨论tab,点赞 P2) */}
            <div className="mt-2">
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2.5 py-3">
                  <Img src={c.avatar} label={c.user} ratio="square" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px] text-[#999999]">{c.user}</span>
                      {c.vip && (
                        <span className="rounded-sm bg-[#3A2E1C] px-1 text-[9px] leading-4 text-[#E8C87E]">VIP</span>
                      )}
                    </div>
                    <div className="mt-1 text-[14px] leading-5 text-white">{c.text}</div>
                    <div className="mt-1 text-[11px] text-[#666666]">
                      {fmtMdHm(c.ts)} · {c.ip}
                    </div>
                  </div>
                  <button
                    {...action('taohaopian.jieshuo.comment.like.toggle', () => toggleCommentLike(item.id, c.id), { params: { commentId: c.id } })}
                    className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5 border-none bg-transparent p-0 pt-0.5 text-[#999999]"
                  >
                    <IcHeart size={14} className={c.likedByMe ? 'fill-[#F5265C] text-[#F5265C]' : ''} />
                    <span className="text-[10px]">{fmtCount(c.likes)}</span>
                  </button>
                </div>
              ))}
              <div className="h-4" />
            </div>
          </div>

          {/* 底部评论输入框 + 标时间(输入框 tap → 发布面板,携带 taoDraft) */}
          <div
            data-hide-on-keyboard
            className="flex shrink-0 items-center gap-2.5 border-t border-[#2A2A2A] px-3 py-2"
          >
            <Img src={userAvatar} label="我" ratio="square" className="h-8 w-8 shrink-0 rounded-full object-cover" />
            <div
              {...bindTap('taohaopian.jieshuo.publish.open', {
                beforeTrigger: () => {
                  taoDraft.shortId = item.id;
                },
              })}
              className="flex h-9 min-w-0 flex-1 cursor-pointer items-center rounded-full bg-[#1F1F1F] px-3.5"
            >
              <span className={`truncate text-[13px] ${taoDraft.text ? 'text-white' : 'text-[#666666]'}`}>
                {taoDraft.text || t('tao.jieshuo.inputPlaceholder')}
              </span>
            </div>
            <button
              {...action('taohaopian.jieshuo.timetag.insert', insertTimeTag)}
              className="flex shrink-0 cursor-pointer flex-col items-center border-none bg-transparent p-0 text-white"
            >
              <IcTimeTag size={20} />
              <span className="text-[10px]">{t('tao.jieshuo.timeTag')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

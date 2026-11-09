import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuDark } from '../hooks/useYoukuDark';
import { useYoukuStore } from '../state';
import { useI18n } from '../i18n';
import { WONTFIX_TOAST } from '../constants';
import { contentNavParams } from '../utils/openContent';
import { fmtCount } from '../components/feedShared';
import { sharePlainText } from '@/os/shareBridge';
import { copyToClipboard } from '../utils/clipboard';
import {
  IcBack, IcHeart, IcMore, IcPlus, IcSearch, IcShare, IcDm, EmptyZhenhuan, catalogById, mmss, pad2, relTime, resolveContent,
} from './me/meShared';
import type { LikeEntry } from '../types';

type ProfileTab = 'video' | 'moments' | 'interact' | 'likes';

/**
 * spec 节点 me.profile(route /me/profile)—— 个人主页(s198/s199/s209/s210/s252/s253)。
 * 4tab:视频恒空态 / 动态(发布联动) / 互动(评论卡) / 喜欢(点赞联动);计数联动关注·粉丝。
 */
export default function MyProfilePage() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const [sp] = useSearchParams();
  const { t, s } = useI18n();
  const isDark = useYoukuDark();
  const tabs: Array<{ id: ProfileTab; label: string }> = [
    { id: 'video', label: s.profileTabVideo },
    { id: 'moments', label: s.profileTabMoments },
    { id: 'interact', label: s.profileTabInteract },
    { id: 'likes', label: s.profileTabLikes },
  ];
  const user = useYoukuStore((st) => st.user);
  const followingCreators = useYoukuStore((st) => st.followingCreators);
  const fans = useYoukuStore((st) => st.fans);
  const likes = useYoukuStore((st) => st.likes);
  const moments = useYoukuStore((st) => st.moments);
  const interactions = useYoukuStore((st) => st.interactions);
  const likedDynamics = useYoukuStore((st) => st.likedDynamics);
  const toggleDynamicLike = useYoukuStore((st) => st.toggleDynamicLike);
  const toggleInteractionLike = useYoukuStore((st) => st.toggleInteractionLike);
  const publishComment = useYoukuStore((st) => st.publishComment);
  const commentsByKey = useYoukuStore((st) => st.commentsByKey);
  const profileTabHint = useYoukuStore((st) => st._temp.profileTabHint);
  const setTemp = useYoukuStore((st) => st.setTemp);
  const showToast = useYoukuStore((st) => st.showToast);
  const wontfix = () => showToast(WONTFIX_TOAST);

  // 分享我的主页:走系统分享(ACTION_SEND),未接通再回落系统剪贴板复制
  const shareProfile = () => {
    const link = 'https://youku.mock/u/me';
    const launched = sharePlainText(`优酷 @${user.nickname} 的主页 ${link}`, {
      onResult: (r) => { if (r.resultCode === 'OK') showToast('分享成功'); },
    });
    if (!launched) {
      copyToClipboard(link);
      showToast('链接已复制');
    }
  };

  const tabFromUrl = sp.get('tab');
  const momentIdFocus = sp.get('momentId');
  const [tab, setTab] = useState<ProfileTab>(
    tabFromUrl === 'moments' || tabFromUrl === 'interact' || tabFromUrl === 'likes' || tabFromUrl === 'video'
      ? tabFromUrl
      : 'video',
  );
  const [commentingId, setCommentingId] = useState<string | null>(null);
  const [momentDraft, setMomentDraft] = useState('');

  // 通知深链 /?tab=moments&momentId=
  useEffect(() => {
    if (tabFromUrl === 'moments' || tabFromUrl === 'interact' || tabFromUrl === 'likes' || tabFromUrl === 'video') {
      setTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  useEffect(() => {
    if (!momentIdFocus) return;
    setTab('moments');
    const t = window.setTimeout(() => {
      document.getElementById(`yk-mm-${momentIdFocus}`)?.scrollIntoView({ block: 'center' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [momentIdFocus]);

  // 发布动态后回此页时切到「动态」tab
  useEffect(() => {
    if (!profileTabHint) return;
    setTab(profileTabHint);
    setTemp({ profileTabHint: null });
  }, [profileTabHint, setTemp]);

  /** 喜欢tab内容卡(封面/时长/标题/发布者),按类型分流字面量 */
  const likeCard = (e: LikeEntry) => {
    const r = resolveContent(e.id, String(e.ctype));
    if (!r) return null;
    const short = e.ctype === 'short' || e.ctype === 'drama';
    const inner = (
      <div className="overflow-hidden rounded-xl bg-(--app-c-card-bg)">
        <div className="relative aspect-video bg-(--app-c-card-bg)">
          <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
          {r.durationSec != null && (
            <span className="absolute bottom-1 right-1.5 text-[11px] font-medium text-(--app-c-text-primary) [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
              {mmss(r.durationSec)}
            </span>
          )}
          {r.episodeCount != null && (
            <span className="absolute bottom-1 right-1.5 rounded bg-black/45 px-1 py-0.5 text-[10px] leading-none text-white">
              {r.updatedTo != null && r.updatedTo < r.episodeCount
                ? t('meEpUpdated', { n: r.updatedTo })
                : t('meEpAll', { n: r.episodeCount })}
            </span>
          )}
        </div>
        <div className="p-2">
          <div className="line-clamp-2 text-[13px] leading-snug text-(--app-c-text-primary)">{r.title}</div>
          <div className="mt-1.5 truncate text-[11px] text-[#999999]">{r.typeText}</div>
        </div>
      </div>
    );
    if (short) {
      return (
        <div key={e.id} {...bindTap('me.profile.like.shorts.open', { params: { shortId: e.id } })} className="cursor-pointer">
          {inner}
        </div>
      );
    }
    if (e.ctype === 'series' || e.ctype === 'variety' || e.ctype === 'anime' || e.ctype === 'kids') {
      return (
        <div
          key={e.id}
          {...bindTap('me.profile.like.series.open', { params: contentNavParams({ id: e.id, type: e.ctype }) })}
          className="cursor-pointer"
        >
          {inner}
        </div>
      );
    }
    return (
      <div
        key={e.id}
        {...bindTap('me.profile.like.open', { params: contentNavParams({ id: e.id, type: e.ctype }) })}
        className="cursor-pointer"
      >
        {inner}
      </div>
    );
  };

  return (
    <div
      data-status-bar-foreground={isDark ? 'light' : 'dark'}
      className="relative flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)"
    >
      {/* 顶部渐变背景(s198 紫橙晕染) */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{ background: 'linear-gradient(115deg,#3A2B4F 0%,#241833 40%,rgba(0,0,0,0) 75%),radial-gradient(circle at 88% 12%,rgba(200,90,40,0.55),transparent 55%)' }}
      />

      {/* 顶栏:返回 / 背景横幅胶囊 / 搜索 / 分享 */}
      <div className="relative z-10 flex h-12 shrink-0 items-center gap-2 px-3">
        <button {...bindBack()} aria-label={s.commonBack} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <button
          {...action('me.profile.banner.wontfixToast', wontfix)}
          className="h-9 min-w-0 flex-1 cursor-pointer truncate rounded-full border border-white/25 bg-white/10 px-4 text-left text-[13px] text-[#DDDDDD]"
        >
          {s.profileBannerHint}
        </button>
        <button {...action('me.profile.search.wontfixToast', wontfix)} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 p-0 text-(--app-c-text-primary)">
          <IcSearch size={18} />
        </button>
        <button {...action('me.profile.share.wontfixToast', shareProfile)} className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-none bg-white/10 p-0 text-(--app-c-text-primary)">
          <IcShare size={17} />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="relative z-10 min-h-0 flex-1 overflow-y-auto pb-28">
        {/* 用户信息区:头像 + 计数 + 编辑资料 */}
        <div className="flex items-center px-4 pt-3">
          <div {...action('me.profile.avatar.wontfixToast', wontfix)} className="cursor-pointer">
            <Img src={user.avatar} label={user.nickname} ratio="square" className="h-[88px] w-[88px] rounded-full bg-[#DDDDDD] object-cover" />
          </div>
          <div className="ml-6 flex flex-1 items-start justify-around pt-1">
            <button
              {...action('me.profile.likecount.toast', () => showToast(t('profileLikeTotal', { n: user.likeCount })))}
              className="cursor-pointer border-none bg-transparent p-0 text-center text-(--app-c-text-primary)"
            >
              <div className="text-[24px] font-bold leading-none">{user.likeCount}</div>
              <div className="mt-1.5 text-[13px] text-[#999999]">{s.profileLikes}</div>
            </button>
            <button {...bindTap('me.profile.following.open')} className="cursor-pointer border-none bg-transparent p-0 text-center text-(--app-c-text-primary)">
              <div className="text-[24px] font-bold leading-none">{followingCreators.length}</div>
              <div className="mt-1.5 text-[13px] text-[#999999]">{s.profileFollowing}</div>
            </button>
            <button {...bindTap('me.profile.fans.open')} className="cursor-pointer border-none bg-transparent p-0 text-center text-(--app-c-text-primary)">
              <div className="text-[24px] font-bold leading-none">{fans.length}</div>
              <div className="mt-1.5 text-[13px] text-[#999999]">{s.profileFans}</div>
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center px-4">
          <span className="min-w-0 truncate text-[26px] font-bold text-(--app-c-text-primary)">{user.nickname}</span>
          <button
            {...bindTap('me.profile.edit.open')}
            className="ml-auto shrink-0 cursor-pointer rounded-lg border-none bg-white px-4 py-2 text-[14px] font-medium text-black"
          >
            {s.profileEdit}
          </button>
        </div>

        {/* 标签行:性别 + IP属地 + 简介 */}
        <div className="mt-3 flex items-center gap-2 px-4">
          <span className="rounded-full bg-(--app-c-chip-bg) px-2.5 py-1 text-[12px] text-[#CCCCCC]">
            {user.gender === '男' ? '♂' : '♀'}
          </span>
          <span className="rounded-full bg-(--app-c-chip-bg) px-2.5 py-1 text-[12px] text-[#CCCCCC]">
            {user.ip.replace('IP属地:', 'IP: ')}
          </span>
        </div>
        <div {...bindTap('me.profile.bio.open')} className="mt-2.5 cursor-pointer px-4 text-[15px] text-[#CCCCCC]">
          {user.bio || s.profileBioEmpty}
        </div>

        {/* tab行:视频/动态/互动/喜欢 */}
        <div className="mt-4 flex items-baseline gap-8 px-4">
          {tabs.map((tb) => {
            const bind =
              tb.id === 'video'
                ? action('me.profile.tab.select.video', () => setTab('video'))
                : tb.id === 'moments'
                  ? action('me.profile.tab.select.moments', () => setTab('moments'))
                  : tb.id === 'interact'
                    ? action('me.profile.tab.select.interact', () => setTab('interact'))
                    : action('me.profile.tab.select.likes', () => setTab('likes'));
            return (
              <button
                key={tb.id}
                {...bind}
                className={`cursor-pointer border-none bg-transparent p-0 ${
                  tab === tb.id ? 'text-[20px] font-bold text-(--app-c-text-primary)' : 'text-[17px] text-[#8A8A8A]'
                }`}
              >
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* ---------------- 视频tab:恒空态(s198) ---------------- */}
        {tab === 'video' && (
          <div className="pt-16">
            <EmptyZhenhuan text={s.profileEmpty} />
          </div>
        )}

        {/* ---------------- 动态tab(s199 空态气泡 / 发布后置顶) ---------------- */}
        {tab === 'moments' && (
          <div>
            {moments.length === 0 ? (
              <div className="flex h-[420px] flex-col justify-end px-4 pb-4">
                <div
                  {...bindTap('me.profile.publishTip.open')}
                  className="relative cursor-pointer rounded-3xl bg-gradient-to-r from-[#EAF4FF] to-[#F5FBFF] px-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-16 shrink-0 items-center justify-center">
                      <div className="relative">
                        <div className="flex h-12 w-12 rotate-[-8deg] items-center justify-center rounded-xl bg-gradient-to-br from-[#F050A0] to-[#E02870]">
                          <div className="ml-0.5 h-0 w-0 border-y-[7px] border-l-[11px] border-y-transparent border-l-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-2 flex h-7 w-8 items-center justify-center rounded-lg bg-[#28C8E8]">
                          <div className="h-3.5 w-3.5 rounded-full bg-[#7A3AE8]" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-[17px] font-bold text-[#1A1A1A]">抓住你的创作灵感</div>
                      <div className="mt-0.5 text-[14px] text-[#556]">上传你的第一条视频吧</div>
                    </div>
                  </div>
                  <div className="absolute -bottom-2 right-16 h-4 w-4 rotate-45 bg-[#F5FBFF]" />
                </div>
              </div>
            ) : (
              <div className="px-4 pt-4">
                {moments.map((m) => {
                  const liked = likedDynamics.includes(m.id);
                  const ckey = `mm:${m.id}`;
                  const mComments = commentsByKey[ckey] ?? [];
                  const openCmt = commentingId === m.id;
                  return (
                  <div
                    key={m.id}
                    id={`yk-mm-${m.id}`}
                    className={`border-b border-(--app-c-border) py-4 ${momentIdFocus === m.id ? 'bg-(--app-c-brand-soft)' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Img src={user.avatar} label={user.nickname} ratio="square" className="h-9 w-9 rounded-full object-cover" />
                      <div>
                        <div className="text-[14px] font-medium">{user.nickname}</div>
                        <div className="mt-0.5 text-[11px] text-[#666666]">{relTime(m.ts)}</div>
                      </div>
                    </div>
                    {m.text && <div className="mt-2.5 text-[15px] leading-6 text-(--app-c-text-primary)">{m.text}</div>}
                    {m.topicName && <div className="mt-1.5 text-[13px] text-[#3D8BFF]">#{m.topicName}</div>}
                    {m.images.length > 0 && (
                      <div className={`mt-2 grid gap-1.5 ${m.images.length === 1 ? 'w-40 grid-cols-1' : 'w-full max-w-[280px] grid-cols-3'}`}>
                        {m.images.map((src, i) => (
                          <div key={`${src}-${i}`} className={`overflow-hidden rounded-lg ${m.images.length === 1 ? '' : 'aspect-square'}`}>
                            <Img src={src} label={m.text} ratio={m.images.length === 1 ? 'landscape' : 'square'} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    {m.showTitle && (
                      m.showId && catalogById(m.showId) ? (
                        <div
                          {...bindTap('me.profile.like.open', {
                            params: contentNavParams(catalogById(m.showId)!),
                          })}
                          className="mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-(--app-c-chip-bg) px-2.5 py-1.5 text-[13px] text-[#CCCCCC]"
                        >
                          <span className="text-[#3D8BFF]">▶</span>
                          {m.showTitle}
                        </div>
                      ) : (
                        <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-(--app-c-chip-bg) px-2.5 py-1.5 text-[13px] text-[#CCCCCC]">
                          <span className="text-[#3D8BFF]">▶</span>
                          {m.showTitle}
                        </div>
                      )
                    )}
                    {m.aiDeclared && <div className="mt-1.5 text-[11px] text-[#666666]">作品含AI合成内容</div>}
                    <div className="mt-3 flex items-center justify-between px-1 text-[14px] text-[#CCCCCC]">
                      <button
                        {...action('me.profile.moment.share.open', shareProfile, { params: { momentId: m.id } })}
                        className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[#CCCCCC]"
                      >
                        <IcShare size={17} />
                        分享
                      </button>
                      <div className="flex items-center gap-6">
                        <button
                        {...action('me.profile.moment.comment.open', () => {
                          setCommentingId(openCmt ? null : m.id);
                          setMomentDraft('');
                        }, { params: { momentId: m.id } })}
                        className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[#CCCCCC]"
                      >
                        <IcDm size={17} />
                        {s.profileCommentCount}{mComments.length > 0 ? ` ${fmtCount(mComments.length)}` : ''}
                        </button>
                        <button
                        {...action('me.profile.moment.like.toggle', () => toggleDynamicLike(m.id), {
                          params: { momentId: m.id },
                        })}
                        className={`flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 ${
                          liked ? 'text-[#F5265C]' : 'text-[#CCCCCC]'
                        }`}
                      >
                        <IcHeart size={17} fill={liked ? '#F5265C' : 'none'} />
                        {fmtCount(m.likes)}
                        </button>
                      </div>
                    </div>
                    {openCmt && (
                      <div className="mt-3 rounded-xl bg-(--app-c-card-bg) p-3">
                        {mComments.length > 0 && (
                          <div className="mb-2 max-h-40 space-y-2 overflow-y-auto">
                            {mComments.map((c) => (
                              <div key={c.id} className="text-[13px] leading-5 text-[#CCCCCC]">
                                <span className="text-[#999999]">{c.user}: </span>
                                {c.text}
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            data-action="me.profile.moment.comment.input"
                            data-action-type="input"
                            value={momentDraft}
                            onChange={(e) => setMomentDraft(e.target.value)}
                            placeholder={s.profileCommentPlaceholder}
                            className="min-w-0 flex-1 rounded-full border-none bg-(--app-c-chip-bg) px-3 py-2 text-[13px] text-(--app-c-text-primary) outline-none"
                          />
                          <button
                            {...action('me.profile.moment.comment.publish', () => {
                              const text = momentDraft.trim();
                              if (!text) return;
                              publishComment(ckey, text, { contentId: m.id });
                              setMomentDraft('');
                            })}
                            className="shrink-0 cursor-pointer rounded-full border-none bg-[#0C7BFF] px-3.5 py-1.5 text-[13px] text-(--app-c-text-primary)"
                          >
                            {s.profileSend}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- 互动tab(s209 空态 / s252 评论卡) ---------------- */}
        {tab === 'interact' && (
          <div>
            {interactions.length === 0 ? (
              <div className="pt-16">
                <EmptyZhenhuan text={s.profileEmpty} />
              </div>
            ) : (
              <div className="px-4 pt-3">
                {interactions.map((it) => {
                  const r = resolveContent(it.contentId, 'series') ?? resolveContent(it.contentId, 'movie');
                  const quoteTitle = r ? `${r.title} ${it.episode != null ? pad2(it.episode) : ''}`.trim() : it.contentId;
                  return (
                    <div key={it.id} className="border-b border-(--app-c-border) py-4">
                      <div className="flex items-center">
                        <span className="text-[12px] text-[#999999]">{relTime(it.ts)} | {s.profileCommentAction}</span>
                        <button
                          {...action('me.profile.commentmore.wontfixToast', wontfix)}
                          className="ml-auto cursor-pointer border-none bg-transparent p-0 text-[#999999]"
                        >
                          <IcMore size={16} />
                        </button>
                      </div>
                      <div className="mt-2 text-[17px] leading-6 text-(--app-c-text-primary)">{it.text}</div>
                      {r && (
                        <div
                          {...bindTap('me.profile.interact.open', { params: { showId: it.contentId, ep: it.episode ?? 1 } })}
                          className="mt-3 flex cursor-pointer items-center gap-2.5 rounded-xl bg-(--app-c-card-bg) p-2"
                        >
                          <div className="relative h-12 w-20 shrink-0 overflow-hidden rounded-lg bg-(--app-c-chip-bg)">
                            <Img src={r.cover} label={r.title} ratio="landscape" className="h-full w-full object-cover" />
                            <span className="absolute inset-0 m-auto h-5 w-5 rounded-full bg-black/45 pl-[7px] pt-[3px] text-[10px] text-white">▶</span>
                          </div>
                          <span className="min-w-0 truncate text-[15px] text-(--app-c-text-primary)">{quoteTitle}</span>
                        </div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <button
                          {...action('me.profile.commentlike.toggle', () => toggleInteractionLike(it.id), {
                            params: { interactionId: it.id },
                          })}
                          className={`flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[14px] ${
                            it.liked ? 'text-[#F5265C]' : 'text-[#CCCCCC]'
                          }`}
                        >
                          <IcHeart size={18} fill={it.liked ? '#F5265C' : 'none'} />
                          {s.profileLike}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ---------------- 喜欢tab(s210/s253 有数据 / 取消全部点赞后空态) ---------------- */}
        {tab === 'likes' && (
          <div>
            {likes.length === 0 ? (
              <div className="pt-16">
                <EmptyZhenhuan text={s.profileEmpty} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 px-3 pt-4">{likes.map(likeCard)}</div>
            )}
          </div>
        )}
      </div>

      {/* 右下+悬浮发布按钮 */}
      <button
        {...bindTap('me.profile.publish.open')}
        aria-label="发布"
        className="absolute bottom-10 right-5 z-20 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border-none bg-[#1B6BF0] text-(--app-c-text-primary) shadow-lg"
      >
        <IcPlus size={30} strokeWidth={2.4} />
      </button>
    </div>
  );
}

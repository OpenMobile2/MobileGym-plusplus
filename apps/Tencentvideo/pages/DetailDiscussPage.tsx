// 讨论 tab(表情条 / AI 小助理 mock)。节点 detail.discuss(spec v1.2.0,13 条交互)。
// 视觉证据:808(沿用宿主详情页黑条 + tab 行 + 热门/最新 chips + 帖子卡:头像徽章行 /
// 正文带「展开」/ 内嵌视频卡 / 灰底内嵌热评两行 /「我来评论下」+ 👍💬↗ 操作行 +
// 长按 👍 弹五档表情泡 + 底部「@AI小助理 问一问」输入条)、809(同族滚动态)、
// frame:467997@66(大剧形态:chips 多出 角色墙/互动数据/明星说)。
//
// 本节点是详情页内 tab,返回沿用宿主详情页返回键(spec note),tab 行「详情」= bindBack()。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvContent } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { EmptyState } from '../components/ui';
import { CommentInputBar, DetailHostBar, DetailSubTabRow } from '../components/detailExtra';
import type { TvDiscussion, TvReactionKey } from '../types';
import { IcComment, IcPlay, IcPlus, IcShare, IcThumbsUp } from '../res/icons';
import { shareEpisodeToWechat } from '../capabilities';

const UI_SORT = 'detail.discuss.sort';
const UI_EMOJIBAR = 'detail.discuss.emojiBarFor';
const UI_TEXT_EXPANDED = 'detail.discuss.textExpandedFor';
const UI_COMMENTS_FOR = 'detail.discuss.commentsFor';

/** 排序 chips 内部键(证据 808) */
const SORT_HOT = '热门';
const SORT_LATEST = '最新';
/** 大剧形态多出的 chips(证据 frame:467997@66),一律 wontfix — 内容标签保持中文 */
const BIG_DRAMA_CHIPS = ['角色墙', '互动数据', '明星说'];
/** 五档表情(证据 808 弹泡;emoji 标签为内容态,保持中文) */
const EMOJIS: { key: TvReactionKey; label: string; glyph: string }[] = [
  { key: 'awesome', label: '真棒', glyph: '👍' },
  { key: 'angry', label: '生气', glyph: '😡' },
  { key: 'heartbroken', label: '心碎', glyph: '💔' },
  { key: 'melon', label: '吃瓜', glyph: '🍉' },
  { key: 'worship', label: '膜拜', glyph: '🙌' },
];

export default function DetailDiscussPage() {
  const { bindTap, bindLongPress, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const content = useTvContent('tv_');
  const detail = useTencentvideoStore((st) => st.detail);
  const user = useTencentvideoStore((st) => st.user);
  const discussions = useTencentvideoStore((st) => st.discussions);
  const comments = useTencentvideoStore((st) => st.comments);
  const likedDiscussionIds = useTencentvideoStore((st) => st.likedDiscussionIds);
  const discussReactions = useTencentvideoStore((st) => st.discussReactions);
  const wontfixToast = useTencentvideoStore((st) => st.wontfixToast);
  const ui = useTencentvideoStore((st) => st.ui);

  const toast = useTencentvideoStore((st) => st.toast);
  const setUi = useTencentvideoStore((st) => st.setUi);
  const discussLikeTap = useTencentvideoStore((st) => st.discussLikeTap);
  const discussEmojiReact = useTencentvideoStore((st) => st.discussEmojiReact);

  const contentId = content?.id ?? '';
  const tabs = useMemo(() => detail.tabs.slice(0, 3), [detail.tabs]);
  const sort = (ui[UI_SORT] as string) || SORT_HOT;
  const sortChips = [SORT_HOT, SORT_LATEST];
  const sortLabel = (chip: string) =>
    chip === SORT_HOT ? s.discussHot : chip === SORT_LATEST ? s.discussLatest : chip;
  const emojiBarFor = (ui[UI_EMOJIBAR] as string) || '';
  const expandedFor = (ui[UI_TEXT_EXPANDED] as string) || '';
  const commentsFor = (ui[UI_COMMENTS_FOR] as string) || '';

  /** 大剧形态:有「讨论千万+」这类量级文案的片子(证据 frame:467997@66) */
  const bigDrama = typeof content?.discussText === 'string';
  const chips = bigDrama ? [...sortChips, ...BIG_DRAMA_CHIPS] : sortChips;

  const posts = useMemo<TvDiscussion[]>(() => {
    const mine = discussions.filter((d) => d.contentId === contentId);
    const scored = [...mine];
    if (sort === SORT_HOT) {
      scored.sort((a, b) => b.reactions.awesome - a.reactions.awesome);
    } else {
      scored.sort((a, b) => (a.date < b.date ? 1 : -1));
    }
    return scored;
  }, [discussions, contentId, sort]);

  /** 帖子卡里内嵌的两行热评复用本片评论线程首两条(证据 808 灰底两行) */
  const hotComments = useMemo(
    () => (comments[contentId]?.items ?? []).slice(0, 2),
    [comments, contentId],
  );
  const threadComments = comments[contentId]?.items ?? [];

  const chipBind = (chip: string) =>
    sortChips.includes(chip)
      ? bindTap({ kind: 'action', id: 'detail.discuss.sort.switch' }, {
        onTrigger: () => setUi(UI_SORT, chip),
      })
      : bindTap({ kind: 'action', id: 'detail.discuss.chips.wontfix' }, {
        onTrigger: () => toast(s.notOpen),
      });

  const renderPost = (d: TvDiscussion) => {
    const liked = likedDiscussionIds.includes(d.id);
    const reacted = discussReactions[d.id];
    const barOpen = emojiBarFor === d.id;
    const textOpen = expandedFor === d.id;
    const commentsOpen = commentsFor === d.id;
    return (
      <div key={d.id} className="pt-3 pb-2 border-b" style={{ borderColor: C.chipGray }}>
        <div className="flex items-start gap-2 px-3">
          <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
            <TvImg id={d.avatar} alt={d.author} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] truncate" style={{ color: C.text }}>
                {d.author}
              </span>
              {d.badge && (
                <span
                  className="shrink-0 rounded px-1 py-[1px] text-[10px] leading-[13px]"
                  style={{ background: C.chipGray, color: C.rankChipText }}
                >
                  {d.badge}
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 text-[11px]" style={{ color: C.textSub }}>
            {d.date} {d.region}
          </div>
        </div>

        <div className="px-3 pt-2">
          <div className="text-[15px] font-semibold leading-[21px]" style={{ color: C.text }}>
            {d.title}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'detail.discuss.text.expand' }, {
              onTrigger: () => setUi(UI_TEXT_EXPANDED, textOpen ? '' : d.id),
            })}
            className={`mt-1 block w-full text-left bg-transparent border-none p-0 text-[13px] leading-[20px] ${
              textOpen ? '' : 'line-clamp-2'
            }`}
            style={{ color: C.text }}
          >
            {d.content}
          </button>
        </div>

        {/* 内嵌视频卡(证据 808 第三帖) */}
        <div className="px-3 pt-2">
          <button
            {...bindTap({ kind: 'action', id: 'detail.discuss.videoCard.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="relative block w-[152px] aspect-video rounded-md overflow-hidden border-none p-0"
          >
            <TvImg id={content?.still ?? content?.poster} alt={d.title} className="w-full h-full object-cover" />
            <span className="absolute inset-0 flex items-center justify-center text-white/90">
              <IcPlay size={22} />
            </span>
          </button>
        </div>

        {/* 内嵌热评两行 */}
        {hotComments.length > 0 && (
          <div className="mx-3 mt-2 rounded-md px-2.5 py-2" style={{ background: C.chipGray }}>
            {hotComments.map((c) => (
              <div key={c.id} className="text-[12px] leading-[19px] truncate" style={{ color: C.textSub }}>
                <span style={{ color: C.text }}>{c.author}:</span> {c.content}
              </div>
            ))}
          </div>
        )}

        {/* 操作行 */}
        <div className="relative flex items-center gap-2 px-3 pt-2.5">
          <button
            {...bindTap({ kind: 'action', id: 'detail.discuss.commentInput.focus' }, {
              onTrigger: () => setUi(UI_COMMENTS_FOR, d.id),
            })}
            className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] bg-transparent"
            style={{ borderColor: C.divider, color: C.textSub }}
          >
            <IcComment size={13} />
            {s.discussCommentEntry}
          </button>
          <div className="flex-1" />
          <div
            {...bindLongPress({ kind: 'action', id: 'detail.discuss.emojiBar.open' }, {
              onTrigger: () => setUi(UI_EMOJIBAR, barOpen ? '' : d.id),
            })}
            className="shrink-0"
          >
            <button
              {...bindTap({ kind: 'action', id: 'detail.discuss.like.tap' }, {
                onTrigger: () => discussLikeTap(d.id),
              })}
              className="flex items-center gap-1 bg-transparent border-none p-0 text-[12px]"
              style={{ color: liked ? C.unlockRed : C.textSub }}
            >
              <IcThumbsUp size={15} />
              {d.reactions.awesome + (liked ? 1 : 0)}
            </button>
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'detail.discuss.postComments.expand' }, {
              onTrigger: () => setUi(UI_COMMENTS_FOR, commentsOpen ? '' : d.id),
            })}
            className="shrink-0 flex items-center gap-1 bg-transparent border-none p-0 text-[12px]"
            style={{ color: C.textSub }}
          >
            <IcComment size={15} />
            {d.comments}
          </button>
          <button
            {...bindTap({ kind: 'action', id: 'detail.discuss.repost' }, {
              onTrigger: () => {
                const launched = shareEpisodeToWechat(
                  {
                    contentId: contentId || d.contentId,
                    episode: 1,
                    title: content?.title ?? d.title,
                    subtitle: d.title,
                    cover: content?.poster,
                    text: `【腾讯视频】${content?.title ?? ''} · ${d.author}\n${d.title}\n${d.content}`,
                  },
                  (result) => toast(result.resultCode === 'OK' ? s.shareSuccess : s.shareCanceled),
                );
                if (!launched) toast(s.shareCanceled);
              },
            })}
            className="shrink-0 flex items-center gap-1 bg-transparent border-none p-0 text-[12px]"
            style={{ color: C.textSub }}
          >
            <IcShare size={15} />
            {d.shares}
          </button>

          {barOpen && (
            <div
              className="absolute right-3 -top-14 z-20 flex gap-3 rounded-xl px-3 py-2 shadow-lg"
              style={{ background: C.pageBg }}
            >
              {EMOJIS.map((e) => (
                <button
                  key={e.key}
                  {...bindTap({ kind: 'action', id: 'detail.discuss.emoji.react' }, {
                    onTrigger: () => {
                      discussEmojiReact(d.id, e.key);
                      setUi(UI_EMOJIBAR, '');
                    },
                  })}
                  className="flex flex-col items-center bg-transparent border-none p-0"
                >
                  <span className="text-[22px] leading-none">{e.glyph}</span>
                  <span
                    className="text-[11px] mt-0.5"
                    style={{ color: reacted === e.key ? C.unlockRed : C.text }}
                  >
                    {e.label}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: reacted === e.key ? C.unlockRed : C.textSub }}
                  >
                    {d.reactions[e.key]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 就地展开的帖子评论(qa:Q6 统一内嵌口径) */}
        {commentsOpen && threadComments.length > 0 && (
          <div className="mx-3 mt-2 rounded-md px-2.5 py-2" style={{ background: C.chipGray }}>
            {threadComments.map((c) => (
              <div key={c.id} className="flex gap-2 py-1">
                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
                  <TvImg id={c.avatar} alt={c.author} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0 text-[12px] leading-[18px]" style={{ color: C.text }}>
                  <span style={{ color: C.textSub }}>{c.author}:</span> {c.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg }}>
      <DetailHostBar backBind={bindBack()} playLabel={s.playNowBar} />
      <DetailSubTabRow
        tabs={tabs}
        activeTab="讨论"
        badges={{ 讨论: typeof content?.discussCount === 'number' ? String(content.discussCount) : undefined }}
        getTabBind={(tab) => (tab === '详情' ? bindBack() : undefined)}
      />

      <div
        className="flex-1 overflow-y-auto"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        <div
          className="flex items-center gap-2 px-3 py-2 overflow-x-auto scrollbar-none"
          data-scroll-container="sortChips"
          data-scroll-direction="horizontal"
        >
          {chips.map((chip) => {
            const active = chip === sort;
            return (
              <button
                key={chip}
                {...chipBind(chip)}
                className="shrink-0 rounded-full border-none px-3 py-1 text-[13px]"
                style={{
                  background: active ? C.primaryBg : C.chipGray,
                  color: active ? C.primary : C.textSub,
                }}
              >
                {sortLabel(chip)}
              </button>
            );
          })}
        </div>

        {posts.length > 0 ? (
          posts.map(renderPost)
        ) : (
          <EmptyState text={s.discussEmpty} />
        )}

        {/* 广告卡 */}
        <div className="px-3 py-4">
          <button
            {...bindTap({ kind: 'action', id: 'detail.discuss.ad.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="relative block w-full aspect-[16/9] rounded-lg overflow-hidden border-none p-0"
            style={{ background: C.chipGray }}
          >
            <TvImg id={detail.adCard.img} alt={detail.adCard.badge} className="w-full h-full object-cover" />
            <span
              className="absolute bottom-1 right-1 rounded px-1 text-[10px] leading-[14px] text-white"
              style={{ background: C.maskBadge }}
            >
              {detail.adCard.badge}
            </span>
          </button>
        </div>
      </div>

      <CommentInputBar
        avatar={user.avatar}
        placeholder={s.discussAiPlaceholder}
        inputBind={bindTap({ kind: 'action', id: 'detail.discuss.aiAsk.wontfix' }, {
          onTrigger: () => toast(s.notOpen),
        })}
        rightSlot={<span className="shrink-0 text-[15px] leading-none">🙂</span>}
        trailing={
          <button
            {...bindTap({ kind: 'action', id: 'detail.discuss.post.wontfix' }, {
              onTrigger: () => toast(s.notOpen),
            })}
            className="shrink-0 w-8 h-8 rounded-full border flex items-center justify-center bg-transparent"
            style={{ borderColor: C.divider, color: C.text }}
            aria-label="发帖"
          >
            <IcPlus size={18} />
          </button>
        }
      />
    </div>
  );
}

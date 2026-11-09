// 评论弹层(楼中楼内嵌 + 发评论)。节点 detail.comments(spec v1.2.0,8 条交互)。
// 视觉证据:806(顶部蒙层 +「评论 4」+ ∨ 收起 + 头像/昵称/徽章组/正文/日期属地/「回复」+
// 右侧心形点赞数 + 底部「回复.」输入条带表情 icon)、frame:467997@84(楼中楼:一级评论下内嵌
// 子回复 +「∨ 展开12条回复」)、frame:467997@88(点赞后心形变红 +1)。
//
// qa:Q6 锁定:回复一律就地内嵌,不另开回复页。
import React, { useMemo } from 'react';
import { useTencentvideoGestures } from '../hooks/useTencentvideoGestures';
import { useTencentvideoStrings } from '../hooks/useTencentvideoStrings';
import { useTvQuery } from '../hooks/useTvParams';
import { useTencentvideoStore } from '../state';
import { TV_COLORS as C } from '../constants';
import { TvImg } from '../components/Img';
import { CommentInputBar, PanelHeader } from '../components/detailExtra';
import type { TvComment, TvCommentReply } from '../types';
import { IcArrowDown, IcHeart } from '../res/icons';

const UI_DRAFT = 'detail.comments.draft';
const UI_REPLY_TO = 'detail.comments.replyTo';
const UI_TEXT_EXPANDED = 'detail.comments.textExpandedFor';
const UI_EMOJI = 'detail.comments.emojiPanel';
/** 每条评论的楼中楼展开态,key = 前缀 + commentId */
const UI_REPLIES_PREFIX = 'detail.comments.repliesOpen.';

/** 结构性标签(证据 806;res/strings.ts 暂无对应键,已列入共享文件诉求) */
const COMMENTS_LABEL = '评论';
const REPLY_LABEL = '回复';
const COLLAPSE_LABEL = '收起';

/** 表情面板(证据 806 输入条右侧表情 icon;面板未实拍,按通用表情面板给一屏常用表情) */
const EMOJI_PANEL = ['😀', '😂', '🥹', '😍', '🤔', '😭', '😡', '👍', '🙌', '💔', '🎉', '🔥', '🍉', '❤️', '⭐', '👀'];

export default function DetailCommentsPage() {
  const { bindTap, bindBack } = useTencentvideoGestures();
  const s = useTencentvideoStrings();

  const contentIdParam = useTvQuery('contentId');
  const contents = useTencentvideoStore((st) => st.contents);
  const detail = useTencentvideoStore((st) => st.detail);
  const user = useTencentvideoStore((st) => st.user);
  const comments = useTencentvideoStore((st) => st.comments);
  const playback = useTencentvideoStore((st) => st.playback);
  const likedCommentIds = useTencentvideoStore((st) => st.likedCommentIds);
  const ui = useTencentvideoStore((st) => st.ui);

  const setUi = useTencentvideoStore((st) => st.setUi);
  const commentLikeToggle = useTencentvideoStore((st) => st.commentLikeToggle);
  const postComment = useTencentvideoStore((st) => st.postComment);

  const contentId = contentIdParam ?? playback.contentId ?? '';
  const content = contents.find((item) => item.id === contentId);
  const activePlayback = playback.contentId === contentId ? playback : undefined;
  const episodeIdentity = activePlayback?.season !== null && activePlayback?.season !== undefined
    ? `s${activePlayback.season}-${activePlayback.subTab ?? '正片'}-ep${activePlayback.episodeIndex}`
    : `ep${activePlayback?.episodeIndex ?? 1}`;
  const threadKey = (content?.episodes ?? 1) > 1 || (
    activePlayback?.season !== null && activePlayback?.season !== undefined
  )
    ? `${contentId}#${episodeIdentity}`
    : contentId;
  const thread = comments[threadKey] ?? comments[contentId];
  const items = useMemo<TvComment[]>(() => thread?.items ?? [], [thread]);
  const draft = (ui[UI_DRAFT] as string) ?? '';
  const replyTo = (ui[UI_REPLY_TO] as string) ?? '';
  const textExpandedFor = (ui[UI_TEXT_EXPANDED] as string) ?? '';
  const emojiOpen = ui[UI_EMOJI] === true;

  const badgeChip = (text: string) => (
    <span
      key={text}
      className="shrink-0 rounded px-1 py-[1px] text-[10px] leading-[13px]"
      style={{ background: C.chipGray, color: C.rankChipText }}
    >
      {text}
    </span>
  );

  const renderReply = (r: TvCommentReply) => (
    <div key={r.id} className="flex gap-2 pt-2">
      <div className="w-5 h-5 rounded-full overflow-hidden shrink-0">
        <TvImg id={r.avatar} alt={r.author} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px]" style={{ color: C.textSub }}>
          {r.author}
        </div>
        <div className="text-[12px] leading-[18px]" style={{ color: C.text }}>
          {r.content}
        </div>
        <div className="text-[11px] pt-0.5" style={{ color: C.textSub }}>
          {r.date} {r.region}
        </div>
      </div>
    </div>
  );

  const renderComment = (c: TvComment) => {
    const liked = likedCommentIds.includes(c.id);
    const textOpen = textExpandedFor === c.id;
    const repliesOpen = ui[UI_REPLIES_PREFIX + c.id] === true;
    const more = c.moreReplies ?? 0;
    const shown = repliesOpen ? c.replies : c.replies.slice(0, 1);
    return (
      <div key={c.id} className="flex gap-2.5 py-3">
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
          <TvImg id={c.avatar} alt={c.author} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-[12px]" style={{ color: C.textSub }}>
              {c.author}
            </span>
            {c.badges.map(badgeChip)}
          </div>
          <button
            {...bindTap({ kind: 'action', id: 'detail.comments.text.expand' }, {
              onTrigger: () => setUi(UI_TEXT_EXPANDED, textOpen ? '' : c.id),
            })}
            className={`mt-1 block w-full text-left bg-transparent border-none p-0 text-[14px] leading-[20px] ${
              textOpen ? '' : 'line-clamp-3'
            }`}
            style={{ color: C.text }}
          >
            {c.content}
          </button>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px]" style={{ color: C.textSub }}>
              {c.date} {c.region}
            </span>
            <button
              {...bindTap({ kind: 'action', id: 'detail.comments.replyInput.focus' }, {
                onTrigger: () => setUi(UI_REPLY_TO, c.author),
              })}
              className="bg-transparent border-none p-0 text-[11px]"
              style={{ color: C.textSub }}
            >
              {REPLY_LABEL}
            </button>
          </div>

          {shown.length > 0 && (
            <div className="mt-1.5 rounded-md px-2.5 py-1.5" style={{ background: C.chipGray }}>
              {shown.map(renderReply)}
              {(more > 0 || c.replies.length > 1) && (
                <button
                  {...bindTap({ kind: 'action', id: 'detail.comments.replies.expand' }, {
                    onTrigger: () => setUi(UI_REPLIES_PREFIX + c.id, !repliesOpen),
                  })}
                  className="flex items-center gap-0.5 mt-1 bg-transparent border-none p-0 text-[12px]"
                  style={{ color: C.textSub }}
                >
                  <IcArrowDown size={13} />
                  {repliesOpen ? COLLAPSE_LABEL : `展开${more || c.replies.length}条回复`}
                </button>
              )}
            </div>
          )}
        </div>

        <button
          {...bindTap({ kind: 'action', id: 'detail.comments.like.toggle' }, {
            onTrigger: () => commentLikeToggle(c.id),
          })}
          className="shrink-0 flex flex-col items-center gap-0.5 bg-transparent border-none p-0 pt-1 text-[11px]"
          style={{ color: liked ? C.unlockRed : C.textSub }}
        >
          <IcHeart size={16} fill={liked ? C.unlockRed : 'none'} />
          {c.likes + (liked ? 1 : 0)}
        </button>
      </div>
    );
  };

  if (!content) return null;

  const total = thread?.total ?? items.length;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/45" {...bindBack()} />
      <div
        className="relative rounded-t-2xl flex flex-col max-h-[78%]"
        style={{ background: C.pageBg }}
      >
        <PanelHeader title={`${COMMENTS_LABEL} ${total}`} closeBind={bindBack()} />

        <div
          className="flex-1 overflow-y-auto px-3"
          data-scroll-container="comments"
          data-scroll-direction="vertical"
        >
          {items.map(renderComment)}
          <div className="h-2" />
        </div>

        {emojiOpen && (
          <div className="shrink-0 grid grid-cols-8 gap-2 px-3 py-3" style={{ background: C.chipGray }}>
            {EMOJI_PANEL.map((e) => (
              <button
                key={e}
                {...bindTap({ kind: 'action', id: 'detail.comments.emojiPanel.toggle' }, {
                  onTrigger: () => {
                    setUi(UI_DRAFT, draft + e);
                    setUi(UI_EMOJI, false);
                  },
                })}
                className="text-[20px] leading-none bg-transparent border-none p-0"
              >
                {e}
              </button>
            ))}
          </div>
        )}

        <CommentInputBar
          avatar={user.avatar}
          placeholder={replyTo ? `${REPLY_LABEL} @${replyTo}` : detail.commentEntry}
          value={draft}
          onChangeValue={(v) => setUi(UI_DRAFT, v)}
          rightSlot={
            <button
              {...bindTap({ kind: 'action', id: 'detail.comments.emojiPanel.toggle' }, {
                onTrigger: () => setUi(UI_EMOJI, !emojiOpen),
              })}
              className="shrink-0 bg-transparent border-none p-0 text-[16px] leading-none"
              aria-label="表情"
            >
              🙂
            </button>
          }
          trailing={
            <button
              {...bindTap({ kind: 'action', id: 'detail.comments.post.submit' }, {
                onTrigger: () => {
                  if (!draft.trim()) return;
                  postComment(threadKey, draft);
                  setUi(UI_DRAFT, '');
                  setUi(UI_REPLY_TO, '');
                },
              })}
              className="shrink-0 bg-transparent border-none p-0 text-[13px]"
              style={{ color: draft.trim() ? C.primary : C.textSub }}
            >
              {s.send}
            </button>
          }
        />
      </div>
    </div>
  );
}

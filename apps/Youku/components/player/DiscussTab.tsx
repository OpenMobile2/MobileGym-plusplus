import React, { useEffect, useRef, useState } from 'react';
import { useYoukuGestures } from '../../hooks/useYoukuGestures';
import { selectComments, useYoukuStore } from '../../state';
import { useI18n } from '../../i18n';
import { fmtSlashDate, fmtDuration } from '../../utils/appTime';
import { placeholderKey } from './playerLib';
import Img from '../Img';
import { IcHeart, IcChevronDown, IcChevronUp, IcClose, IcTimer as IcTimeTag } from './playerIcons';

type SortId = 'hot' | 'latest' | 'review';
const SORTS: SortId[] = ['hot', 'latest', 'review'];
/** 长评折叠阈值(s258 全文) */
const FOLD_LEN = 76;

/**
 * 讨论tab(player.main.discussTab / player.series.main.discussTab 共用):
 * 排序行(热门/最新/影评)+ 评论列表(点赞/回复/展开回复/长评全文)+ 底部输入条(发布上屏/标时间)。
 * 评论 key:电影=videoId,剧集=`${showId}:${ep}`(每集独立)。
 * 评分入口仅电影页声明(player.rating.open),由页面以字面量绑好经 ratingEntry 传入。
 */
export default function DiscussTab({
  contentKey,
  contentId,
  episode,
  currentSec,
  ratingEntry,
  focusCommentId,
}: {
  contentKey: string;
  contentId: string;
  episode?: number;
  /** 当前播放秒(『标时间』插入 qa:Q5 答案B) */
  currentSec: number;
  /** 电影页评分入口(未评/已评橙色),含 player.rating.open 绑定 */
  ratingEntry?: React.ReactNode;
  /** 赞通知定位评论(?commentId=) */
  focusCommentId?: string;
}) {
  const { action } = useYoukuGestures();
  const { t } = useI18n();
  const comments = useYoukuStore((s) => selectComments(s, contentKey));
  const publishComment = useYoukuStore((s) => s.publishComment);
  const showToast = useYoukuStore((s) => s.showToast);
  const toggleCommentLike = useYoukuStore((s) => s.toggleCommentLike);
  const userAvatar = useYoukuStore((s) => s.user.avatar);
  const nickname = useYoukuStore((s) => s.user.nickname);

  const [sort, setSort] = useState<SortId>('hot');
  const [expandedReplies, setExpandedReplies] = useState<string[]>([]);
  const [expandedFull, setExpandedFull] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; user: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 本人评论若有回复默认展开,便于对照消息通知
  useEffect(() => {
    const mineWithReplies = comments.filter((c) => c.byMe && c.replies.length > 0).map((c) => c.id);
    if (mineWithReplies.length === 0) return;
    setExpandedReplies((l) => {
      const next = [...l];
      for (const id of mineWithReplies) if (!next.includes(id)) next.push(id);
      return next;
    });
  }, [comments]);

  // 赞/评通知深链:定位到该评论并展开其回复
  useEffect(() => {
    if (!focusCommentId) return;
    setExpandedReplies((l) => (l.includes(focusCommentId) ? l : [...l, focusCommentId]));
    const el = document.getElementById(`yk-cmt-${focusCommentId}`);
    el?.scrollIntoView({ block: 'center' });
  }, [focusCommentId]);

  const sorted =
    sort === 'review'
      ? comments.filter((c) => c.isReview)
      : [...comments].sort((a, b) => (sort === 'hot' ? b.likes - a.likes : b.ts - a.ts));

  const publish = () => {
    const text = draft.trim();
    if (!text) return;
    publishComment(contentKey, text, {
      replyToCommentId: replyTo?.id,
      contentId,
      episode,
    });
    showToast('评论已发送');
    setDraft('');
    if (replyTo) {
      setExpandedReplies((l) => (l.includes(replyTo.id) ? l : [...l, replyTo.id]));
      setReplyTo(null);
    } else {
      // 发布后实时上屏:最新排序下置顶(spec)
      setSort('latest');
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-4">
        {/* 排序行 */}
        <div className="flex gap-2 px-3 pt-3">
          {SORTS.map((sid) => (
            <button
              key={sid}
              {...action('player.discussSort.select.option', () => setSort(sid), { params: { value: sid } })}
              className={`cursor-pointer rounded-full border-none px-4 py-1.5 text-[14px] ${
                sort === sid ? 'bg-[#2A2A2A] font-bold text-white' : 'bg-transparent text-[#8A8A8A]'
              }`}
            >
              {t(`player.sort.${sid}`)}
            </button>
          ))}
        </div>

        {/* 评论列表 */}
        {sorted.map((c) => {
          const folded = c.text.length > FOLD_LEN && !expandedFull.includes(c.id);
          const repliesOpen = expandedReplies.includes(c.id);
          const name = c.byMe ? nickname : c.user;
          const avatar = c.byMe ? userAvatar : c.avatar;
          return (
            <div key={c.id} id={`yk-cmt-${c.id}`} className={`px-3 pt-4 ${c.id === focusCommentId ? 'bg-[#101820]' : ''}`}>
              <div className="flex gap-2.5">
                <Img src={avatar} label={name} ratio="square" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] text-[#999999]">{name}</span>
                    {c.vip && (
                      <span className="rounded-sm bg-[#3A2E1C] px-1 text-[9px] leading-4 text-[#E8C87E]">SVIP</span>
                    )}
                    {c.isReview && (
                      <span className="rounded-sm border border-[#FF6000] px-1 text-[9px] leading-4 text-[#FF6000]">
                        {t('player.sort.review')}
                      </span>
                    )}
                  </div>
                  <div className={`mt-1.5 text-[15px] leading-[22px] text-white ${folded ? 'line-clamp-3' : ''}`}>
                    {c.text}
                  </div>
                  {c.text.length > FOLD_LEN && (
                    <button
                      {...action(
                        'player.comment.fulltext.expand',
                        () =>
                          setExpandedFull((l) => (l.includes(c.id) ? l.filter((x) => x !== c.id) : [...l, c.id])),
                        { params: { commentId: c.id } },
                      )}
                      className="mt-0.5 cursor-pointer border-none bg-transparent p-0 text-[14px] text-[#999999]"
                    >
                      {folded ? t('player.comment.fulltext') : t('player.comment.collapse')}
                    </button>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[12px] text-[#666666]">
                    <span>
                      {fmtSlashDate(c.ts).slice(5)} {c.ip}
                    </span>
                    <button
                      {...action('player.comment.reply.start', () => {
                        setReplyTo({ id: c.id, user: c.user });
                        inputRef.current?.focus();
                      }, { params: { commentId: c.id } })}
                      className="cursor-pointer border-none bg-transparent p-0 text-[12px] text-[#999999]"
                    >
                      {t('player.comment.reply')}
                    </button>
                    <button
                      {...action('player.comment.like.toggle', () => toggleCommentLike(contentKey, c.id), {
                        params: { commentId: c.id },
                      })}
                      className={`ml-auto flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[12px] ${
                        c.likedByMe ? 'text-[#F5265C]' : 'text-[#999999]'
                      }`}
                    >
                      <IcHeart size={14} className={c.likedByMe ? 'fill-[#F5265C]' : ''} />
                      <span>{c.likes}</span>
                    </button>
                  </div>

                  {/* 子回复(展开N条回复/收起) */}
                  {c.replies.length > 0 && (
                    <div className="mt-2">
                      {repliesOpen &&
                        c.replies.map((r) => (
                          <div key={r.id} className="py-1.5">
                            <span className="text-[13px] text-[#999999]">{r.user}:</span>
                            <span className="text-[13px] leading-5 text-[#DDDDDD]">{r.text}</span>
                            <div className="mt-0.5 text-[11px] text-[#666666]">
                              {fmtSlashDate(r.ts).slice(5)} {r.ip} · {t('player.comment.reply')} · ♡{r.likes}
                            </div>
                          </div>
                        ))}
                      <button
                        {...action(
                          'player.comment.replies.expand',
                          () =>
                            setExpandedReplies((l) =>
                              l.includes(c.id) ? l.filter((x) => x !== c.id) : [...l, c.id],
                            ),
                          { params: { commentId: c.id } },
                        )}
                        className="flex cursor-pointer items-center gap-1 border-none bg-transparent p-0 text-[13px] text-[#999999]"
                      >
                        <span className="mr-1 inline-block h-px w-6 bg-[#3A3A3A]" />
                        {repliesOpen
                          ? t('player.comment.collapse')
                          : t('player.comment.expand', { n: c.replies.length })}
                        {repliesOpen ? <IcChevronUp size={13} /> : <IcChevronDown size={13} />}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && (
          <div className="pt-16 text-center text-[13px] text-[#666666]">{t('player.discuss.empty')}</div>
        )}
      </div>

      {/* 底部输入条:发布 / 评分入口(电影) / 标时间 */}
      <div
        data-keep-keyboard="true"
        className="flex shrink-0 items-center gap-2.5 border-t border-[#1A1A1A] bg-black px-3 py-2"
      >
        <Img src={userAvatar} label={nickname} ratio="square" className="h-9 w-9 shrink-0 rounded-full object-cover" />
        <div className="flex h-9 min-w-0 flex-1 items-center gap-1 rounded-full bg-[#1F1F1F] px-3">
          {replyTo && (
            <button
              onClick={() => setReplyTo(null)}
              className="flex shrink-0 cursor-pointer items-center gap-0.5 rounded-full border-none bg-[#2A2A2A] px-1.5 py-0.5 text-[11px] text-[#3D8BFF]"
            >
              {t('player.comment.replyTo', { name: replyTo.user })}
              <IcClose size={11} />
            </button>
          )}
          <input
            ref={inputRef}
            data-action="player.comment.publish"
            data-action-type="input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') publish();
            }}
            placeholder={t(placeholderKey(contentKey))}
            className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-white outline-none placeholder:text-[#666666]"
          />
          {draft.trim() && (
            <button
              {...action('player.comment.publish.submit', publish, { params: { contentKey, text: draft } })}
              className="shrink-0 cursor-pointer border-none bg-transparent p-0 text-[13px] font-medium text-[#0C7BFF]"
            >
              {t('player.danmaku.send')}
            </button>
          )}
        </div>
        {ratingEntry}
        <button
          {...action('player.timeTag.insert', () => {
            setDraft((d) => `${d}${d && !d.endsWith(' ') ? ' ' : ''}${fmtDuration(currentSec)} `);
            inputRef.current?.focus();
          })}
          className="flex shrink-0 cursor-pointer flex-col items-center gap-0.5 border-none bg-transparent p-0 text-[#CCCCCC]"
        >
          <IcTimeTag size={20} />
          <span className="text-[10px]">{t('player.comment.timeTag')}</span>
        </button>
      </div>
    </div>
  );
}

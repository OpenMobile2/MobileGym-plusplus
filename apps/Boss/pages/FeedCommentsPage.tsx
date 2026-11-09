import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { BOSS_CONFIG } from '../data';
import { Avatar, MissingContent, PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcHeart } from '../res/icons';

const C = BOSS_CONFIG;

/** 有了评论列表(IMG_8490):最热/最新 + 楼中楼(展开数=实际条数) + 回复他人 + 底部输入 */
const FeedCommentsPage: React.FC = () => {
  const { action } = useBossGestures();
  const [searchParams] = useSearchParams();
  const store = useBossStore();
  const postId = searchParams.get('postId') ?? '';
  const allPosts = [...store.myPosts, ...C.feedPosts];
  const post = allPosts.find((p) => p.id === postId);
  const likedCommentIds = useBossStore((s) => s.likedCommentIds);
  const myCommentsAll = useBossStore((s) => s.myComments);
  const commentReplies = useBossStore((s) => s.commentReplies);
  const myComments = myCommentsAll.filter((c) => c.postId === postId);
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: string; author: string } | null>(null);

  if (!post) return <MissingContent text="评论对应的动态不存在或已被移除" />;

  const seed = C.feedComments.filter((c) => c.postId === postId);
  const comments = sort === 'new' ? [...myComments, ...seed] : [...seed, ...myComments];
  // 某条评论的全部回复 = 种子回复 + 用户新增回复
  const repliesOf = (id: string, seedReplies: typeof seed[number]['replies'] = []) =>
    [...seedReplies, ...(commentReplies[id] ?? [])];
  const totalComments = post.comments + myComments.length;

  const submit = () => {
    const text = comment.trim();
    if (!text) return;
    if (replyTo) {
      store.replyComment(replyTo.id, text);
      setExpandedIds((e) => (e.includes(replyTo.id) ? e : [...e, replyTo.id]));
      store.showToast('回复已发布');
      setReplyTo(null);
    } else {
      store.addComment(postId, text);
      store.showToast('评论已发布');
    }
    setComment('');
  };

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={`${post.author.name}`} />
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[17px] font-bold text-gray-900">{totalComments} 条评论</span>
        <div className="flex overflow-hidden rounded-full bg-[#F0F1F3] text-[13px]">
          {(['hot', 'new'] as const).map((v) => (
            <button
              key={v}
              {...action('comments.select.sort', () => { setSort(v); store.recordTaskAudit('commentsSort', { postId, sort: v }); }, { params: { value: v } })}
              className={`px-3.5 py-1.5 ${sort === v ? 'rounded-full bg-white font-medium text-gray-900 shadow' : 'text-gray-500'}`}
            >
              {v === 'hot' ? '最热' : '最新'}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4" data-scroll-container="main" data-scroll-direction="vertical">
        {comments.length === 0 && <div className="py-16 text-center text-sm text-gray-400">还没有评论,来抢沙发~</div>}
        {comments.map((c) => {
          const liked = likedCommentIds.includes(c.id);
          const expanded = expandedIds.includes(c.id);
          const replies = repliesOf(c.id, 'replies' in c ? c.replies : []);
          return (
            <div key={c.id} className="border-b border-gray-50 py-4">
              <div className="flex items-start gap-2.5">
                <Avatar name={c.author} size={36} imgKey={undefined} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="text-[14px] font-medium text-gray-800">{c.author}</span>
                      {c.hot && <span className="rounded-full bg-[#FFEDE3] px-1.5 py-0.5 text-[10px] text-[#FF5F2E]">🔥 热评</span>}
                    </span>
                    <button
                      {...action('comments.item.like', () => store.toggleLikeComment(c.id), { params: { id: c.id } })}
                      className="flex items-center gap-1 text-[13px]"
                      style={liked ? { color: '#EB5757' } : { color: '#9CA3AF' }}
                    >
                      <IcHeart size={15} fill={liked ? '#EB5757' : 'none'} />{c.likes + (liked ? 1 : 0)}
                    </button>
                  </div>
                  {c.authorTag && <div className="mt-0.5 text-[11px] text-gray-400">{c.authorTag}</div>}
                  <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-gray-900">{c.text}</p>
                  <div className="mt-1 flex items-center gap-4 text-[12px] text-gray-400">
                    <span>{c.timeLabel}</span>
                    <button
                      {...action('comments.reply.start', () => { setReplyTo({ id: c.id, author: c.author }); }, { params: { id: c.id } })}
                      className="font-medium"
                    >
                      回复
                    </button>
                  </div>
                  {expanded && replies.map((r, i) => (
                    <div key={i} className="mt-3 flex items-start gap-2">
                      <Avatar name={r.author} size={26} imgKey={undefined} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[13px] font-medium text-gray-700">{r.author}</span>
                          <span className="flex items-center gap-1 text-[12px] text-gray-400"><IcHeart size={13} />{r.likes}</span>
                        </div>
                        <p className="mt-1 text-[13px] leading-relaxed text-gray-800">{r.text}</p>
                        <div className="mt-0.5 text-[11px] text-gray-400">{r.timeLabel}</div>
                      </div>
                    </div>
                  ))}
                  {replies.length > 0 && (
                    <button
                      {...action('comments.replies.expand', () => setExpandedIds((e) => (expanded ? e.filter((x) => x !== c.id) : [...e, c.id])), { params: { id: c.id } })}
                      className="mt-2 text-[13px] font-medium"
                      style={{ color: COLORS.accent }}
                    >
                      {expanded ? '收起回复 ⌃' : `展开 ${replies.length} 条回复 ⌄`}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex shrink-0 items-center gap-3 border-t border-gray-100 bg-white px-4 py-2.5" data-keep-keyboard="true">
        <input
          {...({ 'data-action': replyTo ? 'comments.reply.send' : 'comments.input.text', 'data-action-type': 'input' } as object)}
          data-keep-keyboard="true"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder={replyTo ? `回复 @${replyTo.author}` : '我来说两句...'}
          className="h-9 min-w-0 flex-1 rounded-full bg-[#F5F5F5] px-4 text-[14px] outline-none"
        />
        {comment.trim() && (
          <button
            {...action(replyTo ? 'comments.reply.send' : 'comments.input.text', submit, { params: replyTo ? { id: replyTo.id, value: comment } : { value: comment } })}
            data-keep-keyboard="true"
            className="shrink-0 rounded-full px-4 py-1.5 text-[14px] text-white"
            style={{ backgroundColor: COLORS.primaryBtn }}
          >
            {replyTo ? '回复' : '发送'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FeedCommentsPage;

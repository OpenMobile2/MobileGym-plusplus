import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Cover, useToast, ConfirmDialog, WY } from '../components/ui';
import { COMMENT_SORTS } from '../constants';
import { IcHeart } from '../res/icons';

const SORT_LABEL: Record<string, string> = { rec: '推荐', hot: '最热', new: '最新' };

function fmtLikes(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '')}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}千`;
  return String(n);
}

export default function CommentPage() {
  const { id = '' } = useParams();
  const { bindTap, bindLongPress } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const [sort, setSort] = React.useState<'rec' | 'hot' | 'new'>('rec');
  const [tab, setTab] = React.useState<'comment' | 'note'>('comment');
  const [text, setText] = React.useState('');
  const [replyTo, setReplyTo] = React.useState<string | null>(null);
  const [delId, setDelId] = React.useState<string | null>(null);
  const [expanded, setExpanded] = React.useState<string[]>([]);

  const songs = useWangyiyunStore((s) => s.songs);
  const comments = useWangyiyunStore((s) => s.comments);
  const notes = useWangyiyunStore((s) => s.notes);
  const toggleLike = useWangyiyunStore((s) => s.toggleCommentLike);
  const publish = useWangyiyunStore((s) => s.publishComment);
  const del = useWangyiyunStore((s) => s.deleteComment);

  const song = songs.find((x) => x.id === id);
  const list = comments.filter((c) => c.targetId === id && !c.parentId);
  const sorted = sort === 'hot' ? [...list].sort((a, b) => b.likes - a.likes) : sort === 'new' ? [...list].sort((a, b) => (a.date < b.date ? 1 : -1)) : list;
  const songNotes = notes.filter((n) => n.songId === id);
  const noteCount = songNotes.length;

  const doPublish = () => {
    if (!text.trim()) return;
    publish(id, text.trim(), replyTo ?? undefined);
    setText(''); setReplyTo(null);
    showToast('发布成功');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: WY.pageBg }} data-status-bar-foreground="dark">
      {toast}
      <div className="h-10" />
      <TopBar
        title={
          <div className="flex items-center justify-center gap-5">
            <button onClick={() => setTab('comment')} className="bg-transparent border-none cursor-pointer p-0 relative pb-1"
              style={{ color: tab === 'comment' ? WY.textPrimary : WY.textSecondary, fontWeight: tab === 'comment' ? 600 : 400 }}>
              评论
              {tab === 'comment' && <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded" style={{ background: WY.primary }} />}
            </button>
            <button {...bindTap('comment.notes-open', { params: { id }, onTrigger: () => setTab('note') })}
              className="bg-transparent border-none cursor-pointer p-0 relative pb-1"
              style={{ color: tab === 'note' ? WY.textPrimary : WY.textSecondary, fontWeight: tab === 'note' ? 600 : 400 }}>
              笔记 {noteCount || ''}
              {tab === 'note' && <span className="absolute left-0 right-0 -bottom-0.5 h-0.5 rounded" style={{ background: WY.primary }} />}
            </button>
          </div>
        }
      />

      {tab === 'note' ? (
        <div className="flex-1 overflow-y-auto px-4" data-scroll-container="note-list" data-scroll-direction="vertical">
          <div className="text-[13px] py-2" style={{ color: WY.textPrimary }}>相关笔记({noteCount})</div>
          {noteCount === 0 && (
            <div className="py-16 text-center text-[13px]" style={{ color: WY.textSecondary }}>还没有相关笔记，来发一条吧</div>
          )}
          {songNotes.map((n) => (
            <button key={n.id} {...bindTap('songnotes.detail-open', { params: { id: n.id } })}
              className="flex gap-3 w-full py-3 border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: WY.divider }}>
              <Cover seed={n.coverSeed || n.seed} className="w-16 h-16 shrink-0" />
              <div className="flex-1 min-w-0">
                {n.title && <div className="text-[14px] font-medium mb-0.5" style={{ color: WY.textPrimary }}>{n.title}</div>}
                <div className="text-[14px] line-clamp-2" style={{ color: WY.textPrimary }}>{n.body}</div>
                <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: WY.textSecondary }}>
                  <Cover seed={n.seed} className="w-4 h-4" rounded={8} />
                  <span className="flex-1 truncate">{n.author}</span>
                  <IcHeart size={13} fill={n.liked ? WY.primary : 'none'} style={{ color: n.liked ? WY.primary : 'currentColor' }} />{n.likes}
                </div>
              </div>
            </button>
          ))}
          <div className="h-4" />
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4" data-scroll-container="comment-list" data-scroll-direction="vertical">
            <div className="flex items-center gap-2 text-[13px] py-2" style={{ color: WY.textPrimary }}>
              {song && <Cover seed={song.seed} className="w-7 h-7" rounded={14} />}
              <span className="truncate">{song?.title} - {song?.artist}</span>
            </div>
            <div className="flex items-center gap-3 text-[13px] py-1">
              <span style={{ color: WY.textPrimary }}>评论({song?.commentW || sorted.length})</span>
              <div className="ml-auto flex gap-2">
                {COMMENT_SORTS.map((k) => (
                  <button key={k} {...bindTap({ kind: 'action', id: 'comment.sort.select.target' }, {
                    params: { target: k },
                    onTrigger: () => setSort(k),
                  })} className="bg-transparent border-none cursor-pointer p-0"
                    style={{ color: sort === k ? WY.primary : WY.textSecondary }}>{SORT_LABEL[k]}</button>
                ))}
              </div>
            </div>
            {sorted.length === 0 && (
              <div className="py-16 text-center text-[13px]" style={{ color: WY.textSecondary }}>还没有评论，来抢沙发吧</div>
            )}
            {sorted.map((c) => {
              const replies = comments.filter((r) => r.parentId === c.id);
              return (
                <div key={c.id} className="flex gap-2 py-3 border-b" style={{ borderColor: WY.divider }}
                  {...(c.mine
                    ? bindLongPress({ kind: 'action', id: 'comment.longpress.menu' }, {
                        params: { commentId: c.id },
                        onTrigger: () => setDelId(c.id),
                      })
                    : bindTap({ kind: 'action', id: 'comment.reply.target' }, {
                        params: { commentId: c.id },
                        onTrigger: () => setReplyTo(c.id),
                      }))}>
                  <Cover seed={c.seed} className="w-8 h-8 shrink-0" rounded={16} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px]" style={{ color: WY.textSecondary }}>{c.user}{c.badges.length ? ` · ${c.badges[0]}` : ''}</div>
                    <div className="text-[10px]" style={{ color: WY.textTertiary }}>{c.date} {c.ip}</div>
                    <div className="text-[14px] mt-1" style={{ color: WY.textPrimary }}>{c.text}</div>
                    {replies.slice(0, expanded.includes(c.id) ? undefined : 1).map((r) => (
                      <div key={r.id} className="text-[13px] mt-1.5 pl-2 border-l-2" style={{ color: WY.textSecondary, borderColor: WY.divider }}>{r.user}:{r.text}</div>
                    ))}
                    {replies.length > 1 && !expanded.includes(c.id) && (
                      <button {...bindTap({ kind: 'action', id: 'comment.replies.expand' }, {
                        stopPropagation: true,
                        params: { commentId: c.id },
                        onTrigger: () => setExpanded((xs) => [...xs, c.id]),
                      })} className="mt-2 bg-transparent border-none cursor-pointer text-[12px]" style={{ color: WY.primary }}>
                        展开{replies.length}条回复
                      </button>
                    )}
                  </div>
                  <button {...bindTap({ kind: 'action', id: 'comment.like.toggle' }, {
                    stopPropagation: true,
                    params: { commentId: c.id },
                    onTrigger: () => toggleLike(c.id),
                  })} className="flex flex-col items-center bg-transparent border-none cursor-pointer shrink-0" style={{ color: c.liked ? WY.primary : WY.textTertiary }}>
                    <IcHeart size={16} fill={c.liked ? WY.primary : 'none'} /><span className="text-[10px]">{fmtLikes(c.likes)}</span>
                  </button>
                </div>
              );
            })}
            <div className="h-4" />
          </div>
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 bg-white border-t" style={{ borderColor: WY.divider }} data-keep-keyboard="true">
            <input value={text}
              {...bindTap({ kind: 'action', id: 'comment.compose.focus' }, { onTrigger: () => setReplyTo(replyTo) })}
              onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') doPublish(); }}
              placeholder={replyTo ? '回复评论' : '这一次也许就是你上热评了'}
              className="flex-1 h-9 rounded-full px-3 text-[13px] border-none outline-none" style={{ background: WY.pageBg, color: WY.textPrimary }} />
            <button {...bindTap({ kind: 'action', id: 'comment.compose.submit' }, { onTrigger: doPublish })}
              className="text-[14px] bg-transparent border-none cursor-pointer" style={{ color: text.trim() ? WY.primary : WY.textTertiary }}>发送</button>
          </div>
        </>
      )}
      <ConfirmDialog open={!!delId} title="删除这条评论?" onClose={() => setDelId(null)}
        options={[{ label: '删除', danger: true, onTap: () => { if (delId) { del(delId); showToast('已删除'); } } }, { label: '取消', onTap: () => {} }]} />
    </div>
  );
}

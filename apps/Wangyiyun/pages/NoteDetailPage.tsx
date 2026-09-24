import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Cover, useToast, useSheets, ConfirmDialog, WY } from '../components/ui';
import { IcHeart, IcComment, IcShare } from '../res/icons';

export default function NoteDetailPage() {
  const { id = '' } = useParams();
  const { bindTap, go, back } = useWangyiyunGestures();
  const { open } = useSheets();
  const [toast, showToast] = useToast();
  const [del, setDel] = React.useState(false);
  const [comment, setComment] = React.useState('');
  const note = useWangyiyunStore((s) => s.notes.find((n) => n.id === id));
  const song = useWangyiyunStore((s) => s.songs.find((x) => x.id === note?.songId));
  const toggleLike = useWangyiyunStore((s) => s.toggleNoteLike);
  const publishComment = useWangyiyunStore((s) => s.publishNoteComment);
  const delNote = useWangyiyunStore((s) => s.deleteNote);
  const playSong = useWangyiyunStore((s) => s.playSong);
  if (!note) return <div className="h-full flex items-center justify-center" style={{ background: WY.pageBg }}>笔记不存在</div>;
  return (
    <div className="flex flex-col h-full" style={{ background: WY.noteBg }} data-status-bar-foreground="light">
      {toast}
      <div className="h-10" />
      <TopBar dark right={note.mine ? <button onClick={() => setDel(true)} className="bg-transparent border-none cursor-pointer text-white text-[18px]">···</button> : undefined} />
      <div className="flex-1 overflow-y-auto">
        <Cover seed={note.coverSeed || note.seed} className="w-full aspect-square" rounded={0} />
        <div className="px-4 py-3 text-white">
          <button onClick={() => go('note.author-open', { id: note.authorId })} className="flex items-center gap-2 mb-2 w-full bg-transparent border-none cursor-pointer text-left text-white">
            <Cover seed={note.seed} className="w-8 h-8" rounded={16} />
            <span className="text-[13px] flex-1">{note.author}</span>
            <span className="text-[10px] text-white/50">{note.date} {note.ip}</span>
          </button>
          {note.title && <div className="text-[16px] font-semibold mb-1">{note.title}</div>}
          <div className="text-[14px] leading-relaxed">{note.body}</div>
          {note.topic && <div className="text-[13px] mt-2" style={{ color: WY.primary }}>#{note.topic}</div>}
          {song && (
            <button onClick={() => playSong(song.id, undefined, `笔记`)} className="flex items-center gap-2 mt-3 w-full rounded-lg p-2 border-none cursor-pointer text-left" style={{ background: WY.noteCard }}>
              <Cover seed={song.seed} className="w-9 h-9" />
              <div className="text-[12px] text-white">♫ {song.title} - {song.artist}</div>
            </button>
          )}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-t" style={{ borderColor: '#2A2A30' }}>
        <input value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="说点什么…" className="flex-1 min-w-0 bg-white/10 rounded-full px-3 py-2 text-[13px] text-white border-none outline-none" />
        <button {...bindTap({ kind: 'action', id: 'note.comment.publish' }, {
          onTrigger: () => {
            if (!comment.trim()) return;
            publishComment(note.id, comment);
            setComment('');
            showToast('评论成功');
          },
        })} className="text-[12px] bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>发送</button>
        <button {...bindTap({ kind: 'action', id: 'note.like.toggle' }, {
          params: { noteId: note.id },
          onTrigger: () => toggleLike(note.id),
        })} className="flex items-center gap-1 bg-transparent border-none cursor-pointer" style={{ color: note.liked ? WY.primary : 'rgba(255,255,255,0.7)' }}>
          <IcHeart size={20} fill={note.liked ? WY.primary : 'none'} /><span className="text-[12px]">{note.likes}</span>
        </button>
        <span className="flex items-center gap-1 text-white/70"><IcComment size={20} /><span className="text-[12px]">{note.comments}</span></span>
        <button onClick={() => open('share', `note:${note.id}`)} className="bg-transparent border-none cursor-pointer text-white/70" aria-label="分享"><IcShare size={20} /></button>
      </div>
      <ConfirmDialog open={del} title="确定要删除此动态?" onClose={() => setDel(false)}
        options={[{ label: '删除', danger: true, onTap: () => { delNote(note.id); back(); } }, { label: '取消', onTap: () => {} }]} />
    </div>
  );
}

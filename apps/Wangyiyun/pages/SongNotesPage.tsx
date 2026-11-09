import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, Cover, WY } from '../components/ui';
import { IcHeart } from '../res/icons';

export default function SongNotesPage() {
  const { id = '' } = useParams();
  const { bindTap } = useWangyiyunGestures();
  const notes = useWangyiyunStore((s) => s.notes);
  const toggleLike = useWangyiyunStore((s) => s.toggleNoteLike);
  const list = notes.filter((n) => n.songId === id);
  return (
    <Screen>
      <TopBar title="相关笔记" right={<button {...bindTap('songnotes.compose-open')} className="text-[13px] bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>发笔记</button>} />
      <div className="flex-1 overflow-y-auto">
        {list.length === 0 && (
          <div className="py-16 text-center text-[13px]" style={{ color: WY.textSecondary }}>还没有相关笔记，来发一条吧</div>
        )}
        {list.map((n) => (
          <div key={n.id} className="flex gap-3 px-4 py-3 border-b items-stretch" style={{ borderColor: WY.divider }}>
            <button
              type="button"
              {...bindTap('songnotes.detail-open', { params: { id: n.id } })}
              className="bg-transparent border-none cursor-pointer p-0 text-left"
            >
              <Cover seed={n.coverSeed || n.seed} className="w-16 h-16 rounded-lg" />
            </button>
            <div className="flex-1 min-w-0 flex flex-col">
              <button
                type="button"
                {...bindTap('songnotes.detail-open', { params: { id: n.id } })}
                className="bg-transparent border-none cursor-pointer p-0 text-left"
              >
                {n.title && <div className="text-[14px] font-medium mb-0.5" style={{ color: WY.textPrimary }}>{n.title}</div>}
                <div className="text-[14px] line-clamp-2" style={{ color: WY.textPrimary }}>{n.body}</div>
              </button>
              <div className="flex items-center gap-1 mt-2 text-[11px]" style={{ color: WY.textSecondary }}>
                <Cover seed={n.seed} className="w-4 h-4" rounded={8} />
                <span className="flex-1 truncate">{n.author}</span>
                <button
                  type="button"
                  {...bindTap({ kind: 'action', id: 'songnotes.like.toggle' }, {
                    params: { noteId: n.id },
                    onTrigger: () => toggleLike(n.id),
                  })}
                  className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
                  style={{ color: n.liked ? WY.primary : WY.textSecondary }}
                  aria-label="点赞"
                >
                  <IcHeart size={14} fill={n.liked ? WY.primary : 'none'} style={{ color: n.liked ? WY.primary : 'currentColor' }} />
                  {n.likes}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Screen>
  );
}

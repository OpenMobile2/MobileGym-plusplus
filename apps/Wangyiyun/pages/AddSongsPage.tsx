import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { TopBar, Screen, Cover, useToast, WY } from '../components/ui';
import { IcPlus, IcCheck } from '../res/icons';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';

const TABS = ['最近播放', '本地音乐', '已购'] as const;

export default function AddSongsPage() {
  const { id = '' } = useParams();
  const { bindTap, go } = useWangyiyunGestures();
  const [tab, setTab] = React.useState<(typeof TABS)[number]>('最近播放');
  const [toast, showToast] = useToast();
  const songs = useWangyiyunStore((s) => s.songs);
  const history = useWangyiyunStore((s) => s.historyQueue);
  const playlist = useWangyiyunStore((s) => s.playlists.find((p) => p.id === id));
  const addSong = useWangyiyunStore((s) => s.addSongToPlaylist);
  const added = playlist?.songIds || [];

  const list = React.useMemo(() => {
    if (tab === '最近播放') {
      const ids = history.length ? history : songs.slice(0, 8).map((s) => s.id);
      return ids.map((sid) => songs.find((s) => s.id === sid)).filter(Boolean) as typeof songs;
    }
    if (tab === '本地音乐') return songs.filter((_, i) => i % 2 === 0);
    return songs.filter((s) => s.tags?.includes('VIP') || s.tags?.includes('原唱'));
  }, [tab, songs, history]);

  const finish = () => {
    showToast(added.length ? `已添加 ${added.length} 首到歌单` : '已创建歌单');
    go('addsongs.done', { id });
  };

  return (
    <Screen>
      <TopBar
        title="添加音乐到歌单"
        right={<button onClick={finish} className="text-[14px] bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>完成</button>}
      />
      <div className="flex-1 overflow-y-auto px-3">
        {toast}
        <div className="flex gap-4 py-2 sticky top-0 bg-white z-10">
          {TABS.map((name) => (
            <button key={name} {...bindTap({ kind: 'action', id: 'addsongs.tab.select.target' }, {
              params: { target: name },
              onTrigger: () => setTab(name),
            })} className="bg-transparent border-none cursor-pointer text-[13px]"
              style={{ color: tab === name ? WY.primary : WY.textSecondary }}>{name}</button>
          ))}
        </div>
        {list.length === 0 && (
          <div className="py-16 text-center text-[13px]" style={{ color: WY.textSecondary }}>该分类暂无歌曲</div>
        )}
        {list.map((s) => {
          const on = added.includes(s.id);
          return (
            <div key={s.id} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: WY.divider }}>
              <Cover seed={s.seed} className="w-10 h-10" />
              <div className="flex-1 min-w-0">
                <div className="text-[14px] truncate" style={{ color: WY.textPrimary }}>{s.title}</div>
                <div className="text-[11px] truncate" style={{ color: WY.textSecondary }}>{s.artist}{tab === '本地音乐' ? ' · 本地' : tab === '已购' ? ' · 已购' : ''}</div>
              </div>
              <button {...bindTap({ kind: 'action', id: 'playlist.song.add' }, {
                params: { playlistId: id, songId: s.id },
                onTrigger: () => { if (!on) { addSong(id, s.id); showToast('已添加到歌单'); } },
              })} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" style={{ color: on ? WY.primary : WY.textTertiary }} aria-label="添加">
                {on ? <IcCheck size={20} /> : <IcPlus size={20} />}
              </button>
            </div>
          );
        })}
      </div>
    </Screen>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Cover, coverBg, useToast, WY } from '../components/ui';
import { TrackList } from '../components/parts';
import { playerGradient } from '../res/colors';

export default function ArtistDetailPage() {
  const { id = '' } = useParams();
  const { bindTap } = useWangyiyunGestures();
  const [tab, setTab] = React.useState<'home' | 'songs' | 'albums' | 'notes'>('songs');
  const artist = useWangyiyunStore((s) => s.artists.find((a) => a.id === id));
  const albums = useWangyiyunStore((s) => s.albums);
  const toggleFollow = useWangyiyunStore((s) => s.toggleFollowArtist);
  const [toast] = useToast();
  if (!artist) return <div className="h-full flex items-center justify-center" style={{ background: WY.pageBg }}>歌手不存在</div>;
  const grad = playerGradient(artist.seed);
  const artAlbums = albums.filter((a) => a.artistId === id);
  return (
    <div className="flex flex-col h-full" data-status-bar-foreground="light" style={{ background: WY.pageBg }}>
      {toast}
      <div style={{ background: `linear-gradient(180deg, ${grad.from}, ${grad.to})` }} className="shrink-0">
        <div className="h-10" />
        <TopBar dark />
        <div className="flex items-center gap-3 px-4 pb-3 text-white">
          <div className="w-16 h-16 rounded-full" style={{ background: coverBg(artist.seed) }} />
          <div className="flex-1">
            <div className="text-[18px] font-bold">{artist.name}{artist.alias ? ` (${artist.alias})` : ''}</div>
            <div className="text-[12px] opacity-80 mt-0.5">{artist.fans}粉丝</div>
          </div>
          <button {...bindTap({ kind: 'action', id: 'artist.follow.toggle' }, {
            params: { artistId: id },
            onTrigger: () => toggleFollow(id),
          })} className="px-4 py-1.5 rounded-full text-[13px] border cursor-pointer"
            style={{ borderColor: '#fff', background: artist.followed ? 'transparent' : '#fff', color: artist.followed ? '#fff' : WY.textPrimary }}>
            {artist.followed ? '已关注' : '关注'}
          </button>
        </div>
        <div className="flex gap-5 px-4 pb-2 text-white text-[14px]">
          {([['home', '主页'], ['songs', '歌曲'], ['albums', `专辑${artAlbums.length}`], ['notes', `笔记${artist.noteIds.length}`]] as const).map(([k, l]) => (
            <button key={k} {...bindTap({ kind: 'action', id: 'artist.tab.select.target' }, {
              params: { target: k },
              onTrigger: () => setTab(k),
            })} className="bg-transparent border-none cursor-pointer p-0"
              style={{ fontWeight: tab === k ? 700 : 400, borderBottom: tab === k ? '2px solid #fff' : 'none' }}>{l}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'songs' && <TrackList songIds={artist.hotSongIds} source={`歌手:${artist.name}`} showIndex playAllTransition="artist.playall" />}
        {tab === 'albums' && (
          <div className="bg-white">
            {artAlbums.map((a) => (
              <button key={a.id} {...bindTap('artist.album-open', { params: { id: a.id } })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
                <Cover seed={a.seed} className="w-12 h-12" />
                <div><div className="text-[14px]" style={{ color: WY.textPrimary }}>{a.title}</div><div className="text-[11px]" style={{ color: WY.textSecondary }}>{a.date} · {a.songIds.length}首</div></div>
              </button>
            ))}
          </div>
        )}
        {tab === 'home' && <div className="p-6 text-center text-[13px]" style={{ color: WY.textSecondary }}>{artist.bio}</div>}
        {tab === 'notes' && <div className="p-6 text-center text-[13px]" style={{ color: WY.textSecondary }}>TA 的笔记</div>}
      </div>
    </div>
  );
}

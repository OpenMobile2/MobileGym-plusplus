import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, coverBg, useToast, WY } from '../components/ui';

export default function SongWikiPage() {
  const { id = '' } = useParams();
  const { bindTap, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const song = useWangyiyunStore((s) => s.songs.find((x) => x.id === id));
  const artist = useWangyiyunStore((s) => s.artists.find((a) => a.id === song?.artistId));
  const insertNext = useWangyiyunStore((s) => s.insertNext);
  const songs = useWangyiyunStore((s) => s.songs);
  if (!song) return <Screen><div className="p-8 text-center" style={{ color: WY.textSecondary }}>歌曲不存在</div></Screen>;
  const Row = ({ k, v }: { k: string; v: string }) => <div className="flex text-[13px] py-1.5"><span className="w-16 shrink-0" style={{ color: WY.textTertiary }}>{k}</span><span style={{ color: WY.textPrimary }}>{v}</span></div>;
  return (
    <Screen>
      <TopBar title="歌曲百科" right={<button onClick={() => showToast('参与百科共建')} className="bg-transparent border-none cursor-pointer text-[18px]" style={{ color: WY.textPrimary }}>···</button>} />
      <div className="flex-1 overflow-y-auto px-4" data-scroll-container="wiki" data-scroll-direction="vertical">
        <div className="bg-white rounded-xl p-3 my-2">
          <Row k="曲风" v="流行-华语流行" /><Row k="专辑" v={song.album} /><Row k="语种" v="国语" /><Row k="时长" v={`${Math.floor(song.durationSec / 60)}分${song.durationSec % 60}秒`} />
          <button onClick={() => go('wiki.sheet-open', { id })} className="block w-full text-left text-[13px] py-1.5 bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>乐谱 2 ›</button>
        </div>
        {artist && (
          <button onClick={() => go('artist.open', { id: artist.id })} className="flex items-center gap-3 w-full bg-white rounded-xl p-3 my-2 border-none cursor-pointer text-left">
            <div className="w-12 h-12 rounded-full" style={{ background: coverBg(artist.seed) }} />
            <div className="flex-1"><div className="text-[14px]" style={{ color: WY.textPrimary }}>{artist.name}</div><div className="text-[11px]" style={{ color: WY.textSecondary }}>{artist.fans}粉丝</div></div>
          </button>
        )}
        <button onClick={() => go('wiki.comment-open', { id })} className="block w-full text-left bg-white rounded-xl p-3 my-2 text-[14px] border-none cursor-pointer" style={{ color: WY.textPrimary }}>查看 {song.commentW} 条评论 ›</button>
        <div className="bg-white rounded-xl p-3 my-2">
          <div className="text-[14px] mb-2" style={{ color: WY.textPrimary }}>喜欢这首歌的人也爱听</div>
          <button {...bindTap({ kind: 'action', id: 'queue.song.insert' }, {
            onTrigger: () => {
              insertNext([songs[(songs.indexOf(song) + 1) % songs.length].id]);
              showToast('已添加到播放列表,将于下一首播放');
            },
          })} className="text-[12px] bg-transparent border-none cursor-pointer" style={{ color: WY.primary }}>插播全部</button>
        </div>
        <button onClick={() => go('wiki.mv-open', { id })} className="block w-full text-left bg-white rounded-xl p-3 my-2 text-[14px] border-none cursor-pointer" style={{ color: WY.textPrimary }}>相关视频 · MV ›</button>
        <button {...bindTap('wiki.playlist-open', { params: { id: 'pl_radar' } })} className="block w-full text-left bg-white rounded-xl p-3 my-2 text-[14px] border-none cursor-pointer" style={{ color: WY.textPrimary }}>相关歌单 ›</button>
        <button {...bindTap('wiki.podcast-open', { params: { id: 'ep_001' } })} className="block w-full text-left bg-white rounded-xl p-3 my-2 text-[14px] border-none cursor-pointer" style={{ color: WY.textPrimary }}>相关播客 ›</button>
        {toast}
      </div>
    </Screen>
  );
}

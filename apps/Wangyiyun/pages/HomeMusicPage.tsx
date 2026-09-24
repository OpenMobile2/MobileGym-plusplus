import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { Screen, Cover, useToast, WY } from '../components/ui';
import { HomeTopTabs, SectionTitle } from '../components/parts';

const CHIPS = ['排行榜', '歌单', '华语', '情歌', '原创', 'VIP', '国风', '经典'] as const;

export default function HomeMusicPage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const [chip, setChip] = React.useState<string | null>(null);
  const playlists = useWangyiyunStore((s) => s.playlists);
  const albums = useWangyiyunStore((s) => s.albums);

  const shown = React.useMemo(() => {
    if (!chip || chip === '歌单' || chip === '排行榜') return playlists.filter((p) => !p.isLiked);
    return playlists.filter((p) => (p.tag === chip) || p.title.includes(chip) || (!p.mine && !p.isLiked));
  }, [chip, playlists]);

  const onChip = (c: (typeof CHIPS)[number]) => {
    if (c === '排行榜') { go('music.rank-open'); return; }
    if (c === '歌单') { go('music.square-open'); return; }
    setChip(c);
    showToast(`${c}歌单`);
  };

  return (
    <Screen>
      <HomeTopTabs />
      <div className="flex-1 overflow-y-auto px-3">
        <div className="flex gap-2 flex-wrap py-2">
          {CHIPS.map((c) => (
            <button key={c} {...bindTap({ kind: 'action', id: 'music.chip.select.target' }, {
              params: { target: c },
              onTrigger: () => onChip(c),
            })}
              className="text-[12px] px-3 py-1.5 rounded-full border-none cursor-pointer"
              style={{ color: chip === c ? '#fff' : WY.textPrimary, background: chip === c ? WY.primary : '#fff' }}>{c}</button>
          ))}
        </div>
        <SectionTitle title={chip ? `${chip}歌单` : '甄选歌单'} onMore={() => go('music.square-open')} />
        <div className="grid grid-cols-3 gap-2">
          {shown.slice(0, 9).map((p) => (
            <button key={p.id} {...bindTap('music.playlist-open', { params: { id: p.id } })}
              className="bg-transparent border-none cursor-pointer p-0 text-left">
              <Cover seed={p.seed} className="w-full aspect-square" />
              <div className="text-[11px] mt-1 line-clamp-2" style={{ color: WY.textPrimary }}>{p.title}</div>
            </button>
          ))}
        </div>
        <SectionTitle title="新碟上架" />
        <div className="grid grid-cols-3 gap-2 mb-2">
          {albums.slice(0, 3).map((a) => (
            <button key={a.id} {...bindTap('music.album-open', { params: { id: a.id } })}
              className="bg-transparent border-none cursor-pointer p-0 text-left">
              <Cover seed={a.seed} className="w-full aspect-square" />
              <div className="text-[11px] mt-1 line-clamp-2" style={{ color: WY.textPrimary }}>{a.title}</div>
            </button>
          ))}
        </div>
        <SectionTitle title="探索更多" />
        <button {...bindTap('search.styles-open')} className="block w-full text-left py-3 text-[14px] border-b bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary, borderColor: WY.divider }}>按曲风浏览 ›</button>
        <button {...bindTap('search.artists-open')} className="block w-full text-left py-3 text-[14px] border-b bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary, borderColor: WY.divider }}>按歌手浏览 ›</button>
        <button {...bindTap('search.zones-open')} className="block w-full text-left py-3 text-[14px] border-b bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary, borderColor: WY.divider }}>音乐专区 ›</button>
        <button {...bindTap('music.square-open')} className="block w-full text-left py-3 text-[14px] border-b bg-transparent border-none cursor-pointer" style={{ color: WY.textPrimary, borderColor: WY.divider }}>歌单广场 ›</button>
        {toast}
      </div>
    </Screen>
  );
}

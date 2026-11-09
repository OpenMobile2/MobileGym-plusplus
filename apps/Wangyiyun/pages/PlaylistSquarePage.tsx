import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, Cover, WY } from '../components/ui';
import { SQUARE_CATS } from '../constants';

export default function PlaylistSquarePage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [cat, setCat] = React.useState('华语');
  const playlists = useWangyiyunStore((s) => s.playlists);
  const shown = playlists.filter((p) => !p.isLiked && (p.tag === cat || p.title.includes(cat) || SQUARE_CATS.indexOf(cat as typeof SQUARE_CATS[number]) >= 0));
  const list = shown.length ? shown : playlists.filter((p) => !p.isLiked);
  return (
    <Screen>
      <TopBar title="歌单广场" />
      <div className="flex gap-3 px-3 py-2 overflow-x-auto text-[13px] shrink-0">
        {SQUARE_CATS.map((c) => (
          <button key={c} {...bindTap({ kind: 'action', id: 'square.cat.select.target' }, {
            params: { target: c },
            onTrigger: () => setCat(c),
          })} className="whitespace-nowrap bg-transparent border-none cursor-pointer p-0" style={{ color: cat === c ? WY.primary : WY.textSecondary, fontWeight: cat === c ? 600 : 400 }}>{c}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3">
        <div className="grid grid-cols-3 gap-2 py-2">
          {list.map((p, i) => (
            <button key={`${p.id}-${cat}-${i}`} onClick={() => go('square.playlist-open', { id: p.id })} className="bg-transparent border-none cursor-pointer p-0 text-left">
              <div className="relative">
                <Cover seed={p.seed} className="w-full aspect-square" />
                <span className="absolute top-1 right-1 text-white text-[10px] drop-shadow">▶{p.playCount}</span>
              </div>
              <div className="text-[11px] mt-1 line-clamp-2" style={{ color: WY.textPrimary }}>{cat !== '精品' && !p.title.includes(cat) ? `${cat} · ${p.title}` : p.title}</div>
            </button>
          ))}
        </div>
      </div>
    </Screen>
  );
}

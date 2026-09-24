import React from 'react';
import { useParams } from 'react-router-dom';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Cover, useToast, fmtTime, WY } from '../components/ui';
import { playerGradient } from '../res/colors';
import { IcPlay, IcPause } from '../res/icons';

export default function EpisodePage() {
  const { id = '' } = useParams();
  const { bindTap } = useWangyiyunGestures();
  const [toast, showToast] = useToast();
  const [playing, setPlaying] = React.useState(false);
  const [pos, setPos] = React.useState(1);
  const ep = useWangyiyunStore((s) => s.episodes.find((e) => e.id === id));
  const subscribed = useWangyiyunStore((s) => s.subscribedShowIds.includes(ep?.showId || ''));
  const subscribe = useWangyiyunStore((s) => s.subscribePodcast);

  React.useEffect(() => {
    if (!playing || !ep) return;
    const t = setInterval(() => {
      setPos((p) => {
        if (p + 1 >= ep.durationSec) {
          setPlaying(false);
          return ep.durationSec;
        }
        return p + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [playing, ep]);

  if (!ep) return <div className="h-full flex items-center justify-center" style={{ background: WY.pageBg }}>单集不存在</div>;
  const grad = playerGradient(ep.seed);
  return (
    <div className="flex flex-col h-full" style={{ background: `linear-gradient(180deg,${grad.from},${grad.to})` }} data-status-bar-foreground="light">
      {toast}
      <div className="h-10" /><TopBar dark />
      <div className="flex-1 overflow-y-auto px-4 text-white">
        <div className="flex gap-3 items-start">
          <Cover seed={ep.seed} className="w-16 h-16 shrink-0" />
          <div className="flex-1">
            <div className="text-[15px] font-semibold line-clamp-2">{ep.title}</div>
            <div className="text-[12px] opacity-70 mt-1">来自:{ep.showTitle}</div>
          </div>
          <button onClick={() => { subscribe(ep.showId); showToast(subscribed ? '已取消订阅' : '已订阅'); }} className="px-3 py-1 rounded-full text-[12px] border cursor-pointer" style={{ borderColor: '#fff', background: subscribed ? 'transparent' : '#fff', color: subscribed ? '#fff' : WY.textPrimary }}>{subscribed ? '已订阅' : '订阅播客'}</button>
        </div>
        <div className="text-[13px] opacity-80 mt-4 leading-relaxed">{ep.desc}</div>
        <div className="mt-4">
          {ep.timestamps.map((t) => (
            <button key={t.at} {...bindTap({ kind: 'action', id: 'episode.seek.card' }, {
              params: { seconds: t.at },
              onTrigger: () => { setPos(t.at); setPlaying(true); showToast(`跳转到 ${fmtTime(t.at)}`); },
            })} className="flex items-center gap-3 w-full py-2 border-b bg-transparent border-none cursor-pointer text-left" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              <span className="text-[12px] opacity-70">{fmtTime(t.at)}</span>
              <span className="text-[13px] flex-1">{t.song} - {t.artist}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="shrink-0 flex items-center gap-2 px-6 py-4 text-white/80 text-[11px]">
        <span>{fmtTime(pos)}</span>
        <input type="range" min={0} max={ep.durationSec} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="flex-1" style={{ accentColor: '#fff' }} />
        <span>{fmtTime(ep.durationSec)}</span>
      </div>
      <div className="shrink-0 flex justify-center pb-5">
        <button {...bindTap({ kind: 'action', id: 'episode.seek.step' }, {
          params: { seconds: -15 },
          onTrigger: () => setPos((p) => Math.max(0, p - 15)),
        })} className="mr-7 bg-transparent border-none cursor-pointer text-white/80">-15s</button>
        <button {...bindTap({ kind: 'action', id: 'episode.play.toggle' }, {
          onTrigger: () => setPlaying((p) => !p),
        })} className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center border-none cursor-pointer text-white" aria-label="播放">{playing ? <IcPause size={28} /> : <IcPlay size={28} />}</button>
        <button {...bindTap({ kind: 'action', id: 'episode.seek.step' }, {
          params: { seconds: 30 },
          onTrigger: () => setPos((p) => Math.min(ep.durationSec, p + 30)),
        })} className="ml-7 bg-transparent border-none cursor-pointer text-white/80">+30s</button>
      </div>
    </div>
  );
}

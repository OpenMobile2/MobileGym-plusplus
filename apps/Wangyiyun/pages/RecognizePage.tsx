import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, coverBg, WY } from '../components/ui';
import { recognizeRed } from '../res/colors';
import { IcMic, IcHeart, IcPlay } from '../res/icons';

type Phase = 'idle' | 'recording' | 'searching' | 'result' | 'fail';
export default function RecognizePage() {
  const { bindTap, go } = useWangyiyunGestures();
  const [phase, setPhase] = React.useState<Phase>('idle');
  const [tick, setTick] = React.useState(0);
  const songs = useWangyiyunStore((s) => s.songs);
  const bump = useWangyiyunStore((s) => s.bumpRecognize);
  const playSong = useWangyiyunStore((s) => s.playSong);
  const results = songs.slice(6, 9);

  const start = () => {
    const n = bump();
    setPhase('recording'); setTick(0);
    const succeed = n % 2 === 1;
    let t = 0;
    const iv = setInterval(() => {
      t += 1; setTick(t);
      if (t === 3) setPhase('searching');
      if (t >= (succeed ? 5 : 8)) { clearInterval(iv); setPhase(succeed ? 'result' : 'fail'); }
    }, 700);
  };

  if (phase === 'result') {
    return (
      <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg,#2E5E4E,#14231D)' }} data-status-bar-foreground="light">
        <div className="h-10" /><TopBar dark title="识别结果 (3个)" />
        <div className="flex-1 overflow-y-auto px-4">
          <div className="w-40 h-40 rounded-full mx-auto my-6" style={{ background: coverBg(results[0].seed) }} />
          {results.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
              <div className="flex-1"><div className="text-[15px] text-white">{s.title}</div><div className="text-[12px] text-white/60">{s.artist}</div></div>
              <IcHeart size={20} className="text-white/70" />
              <button {...bindTap({ kind: 'action', id: 'recognize.result.play' }, {
                params: { songId: s.id },
                onTrigger: () => { playSong(s.id, undefined, '听歌识曲'); go('recognize.player-open'); },
              })} className="bg-transparent border-none cursor-pointer text-white" aria-label="播放"><IcPlay size={24} /></button>
            </div>
          ))}
        </div>
        <button {...bindTap({ kind: 'action', id: 'recognize.scan.retry' }, { onTrigger: () => setPhase('idle') })}
          className="m-4 py-3 rounded-full text-white text-[15px] border-none cursor-pointer" style={{ background: recognizeRed }}>重新识别</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: WY.pageBg }} data-status-bar-foreground="dark">
      <div className="h-10" /><TopBar title="听歌识曲" />
      <div className="flex-1 flex flex-col items-center justify-center">
        <button {...bindTap({ kind: 'action', id: 'recognize.scan.toggle' }, {
          onTrigger: () => phase === 'idle' || phase === 'fail' ? start() : setPhase('idle'),
        })}
          className="w-32 h-32 rounded-full flex items-center justify-center border-none cursor-pointer text-white"
          style={{ background: recognizeRed, boxShadow: phase !== 'idle' ? `0 0 0 12px ${recognizeRed}22` : 'none' }} aria-label="识曲">
          <IcMic size={44} />
        </button>
        <div className="mt-6 text-[14px]" style={{ color: WY.textSecondary }}>
          {phase === 'idle' && '点击开始识曲'}
          {phase === 'recording' && `录音中 (${tick}s)`}
          {phase === 'searching' && (tick < 6 ? `搜索中 (${tick}s)` : `扩大范围识别 (${tick}s)`)}
          {phase === 'fail' && '识别无结果 / 请检查音源后再试'}
        </div>
        {phase === 'fail' && <button {...bindTap({ kind: 'action', id: 'recognize.scan.retry' }, { onTrigger: start })}
          className="mt-4 px-6 py-2.5 rounded-full text-white text-[14px] border-none cursor-pointer" style={{ background: recognizeRed }}>重新识别</button>}
      </div>
      <div className="flex justify-center gap-8 pb-6 text-[14px]">
        <span style={{ color: WY.textPrimary, fontWeight: 600 }}>听歌识曲</span>
        <span style={{ color: WY.textTertiary }}>哼唱识曲</span>
      </div>
    </div>
  );
}

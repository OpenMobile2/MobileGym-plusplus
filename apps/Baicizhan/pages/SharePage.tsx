import React, { useState } from 'react';
import { useBaicizhanStore } from '../state';
import { useBaicizhanGestures } from '../hooks/useBaicizhanGestures';
import { useStrings } from '../hooks/useStrings';
import { IcClose } from '../res/icons';
import { sharePlainText } from '@/os/shareBridge';

const CHANNELS = [['🟢', '朋友圈'], ['💬', '微信好友'], ['📕', '小红书'], ['🐦', '新浪微博'], ['⭐', 'QQ空间']];

export default function SharePage() {
  const s = useStrings();
  const { action, bindBack } = useBaicizhanGestures();
  const st = useBaicizhanStore();
  const toast = () => st.showToast(s.notAvailable);
  const [card, setCard] = useState(0);
  const grads = ['linear-gradient(135deg,#B18CF0,#8B5CF6)', 'linear-gradient(135deg,#6FB1F0,#3B82F6)', 'linear-gradient(135deg,#F0A6C0,#EC4899)'];
  return (
    <div className="flex h-full flex-col bg-[#F3F4F6]" data-status-bar-foreground="dark">
      <div className="flex items-center px-4 pt-12">
        <button {...bindBack()}><IcClose size={22} color="#5B6B85" /></button>
        <button {...action('share.info.toast', toast)} className="ml-auto text-[#9AA5B1]">ⓘ</button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center px-8">
        <button {...action('share.card.swipe', () => setCard((c) => (c + 1) % 3))}
          className="flex aspect-[3/4] w-full flex-col items-center justify-center rounded-3xl text-white" style={{ background: grads[card] }}>
          <div className="text-xs opacity-90">连续学习 · 不断电 ⚡</div>
          <div className="my-2 text-6xl font-black">{st.streakDays || 1}</div>
          <div className="text-sm opacity-90">DAYS</div>
          <div className="mt-6 text-xs opacity-80">{st.profile.name}</div>
        </button>
      </div>
      <div className="mb-2 flex justify-center gap-1">{[0, 1, 2].map((i) => <span key={i} className={`h-1.5 rounded-full ${i === card ? 'w-4 bg-[#8B5CF6]' : 'w-1.5 bg-[#D0D0D0]'}`} />)}</div>
      <div className="border-t border-[#E8E8E8] bg-white px-4 py-4">
        <div className="mb-3 text-center text-xs text-[#9AA5B1]">分享到</div>
        <div className="flex justify-around">
          {CHANNELS.map(([ic, t]) => (
            <button
              key={t}
              {...action('share.channel.system', () => {
                const launched = sharePlainText(`【百词斩】连续学习 ${st.streakDays || 1} 天`, {
                  onResult: (result) => { if (result.resultCode === 'OK') st.showToast(s.shareSuccess); },
                });
                if (!launched) toast();
              })}
              className="flex flex-col items-center gap-1"
            >
              <div className="text-2xl">{ic}</div><span className="text-[10px] text-[#5B6B85]">{t}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

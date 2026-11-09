import React, { useEffect, useState } from 'react';
import { useBaicizhanStore } from '../state';
import { IcBolt } from '../res/icons';

/** 普通 toast(底部黑条)+ 顶部奖励横幅(连对/不断电到账)。 */
const Toast: React.FC = () => {
  const toast = useBaicizhanStore((s) => s._temp.toast);
  const toastSeq = useBaicizhanStore((s) => s._temp.toastSeq);
  const reward = useBaicizhanStore((s) => s._temp.reward);

  const [msg, setMsg] = useState('');
  const [rewardText, setRewardText] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    setMsg(toast);
    const t = setTimeout(() => setMsg(''), 1600);
    return () => clearTimeout(t);
  }, [toast, toastSeq]);

  useEffect(() => {
    if (!reward) return;
    setRewardText(reward.text);
    const t = setTimeout(() => setRewardText(null), 1600);
    return () => clearTimeout(t);
  }, [reward]);

  return (
    <>
      {rewardText && (
        <div className="pointer-events-none absolute left-1/2 top-6 z-50 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full bg-[#6C4BF0] px-4 py-2 text-sm font-semibold text-white shadow-lg">
            <IcBolt size={16} color="#FFD84D" />
            {rewardText}
          </div>
        </div>
      )}
      {msg && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2">
          <div className="max-w-[70vw] rounded-xl bg-black/75 px-4 py-2.5 text-center text-sm text-white">{msg}</div>
        </div>
      )}
    </>
  );
};

export default Toast;

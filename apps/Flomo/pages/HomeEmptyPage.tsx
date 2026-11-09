import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcDoc, IcPlus } from '../res/icons';

export default function HomeEmptyPage() {
  const { bindTap } = useFlomoGestures();
  const setCompose = useFlomoStore((s) => s.setCompose);

  return (
    <div className="flex flex-col h-full items-center justify-center px-10" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6" style={{ background: C.surface }}>
        <IcDoc size={44} color={C.sub} />
      </div>
      <div className="font-semibold mb-2" style={{ color: C.text, fontSize: 17 }}>还没有任何笔记</div>
      <div className="text-center mb-8" style={{ color: C.sub, fontSize: 14, lineHeight: 1.6 }}>
        flomo 是你的第二大脑,<br />从记录第一个想法开始吧。
      </div>
      <button
        {...bindTap('home.empty.compose', { beforeTrigger: () => setCompose('new', null) })}
        className="flex items-center gap-2 px-6 h-11 rounded-full border-none cursor-pointer font-semibold"
        style={{ background: C.green, color: '#fff', fontSize: 15 }}
      >
        <IcPlus size={18} />
        写第一条笔记
      </button>
    </div>
  );
}

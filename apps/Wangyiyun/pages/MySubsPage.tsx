import React from 'react';
import { useWangyiyunStore } from '../state';
import { useWangyiyunGestures } from '../hooks/useWangyiyunGestures';
import { TopBar, Screen, coverBg, WY } from '../components/ui';

export default function MySubsPage() {
  const { bindTap } = useWangyiyunGestures();
  const subs = useWangyiyunStore((s) => s.subscribedShowIds);
  const podcasts = useWangyiyunStore((s) => s.podcasts.filter((p) => subs.includes(p.id)));
  return (
    <Screen>
      <TopBar title="我的播客" />
      <div className="flex-1 overflow-y-auto">
        {podcasts.length === 0 && <div className="p-10 text-center text-[13px]" style={{ color: WY.textSecondary }}>还没有订阅的播客</div>}
        {podcasts.map((p) => (
          <button key={p.id} {...bindTap('mysubs.show-open', { params: { id: p.id } })} className="flex items-center gap-3 w-full px-4 py-3 bg-transparent border-none border-b cursor-pointer text-left" style={{ borderColor: WY.divider }}>
            <div className="w-12 h-12 rounded" style={{ background: coverBg(p.seed) }} />
            <div><div className="text-[14px]" style={{ color: WY.textPrimary }}>{p.title}</div><div className="text-[11px]" style={{ color: WY.textSecondary }}>{p.host}</div></div>
          </button>
        ))}
      </div>
    </Screen>
  );
}

// apps/Douban/components/FakePlayerBar.tsx —— 假迷你音频播放条(FOUNDATION,qa:Q1/Q2)。
// 行为:出现/暂停切换/关闭;进度条【不真走】(静止装饰)。跨页驻留:
// GlobalFakePlayerBar 已挂在 DoubanApp AppShell,读 store.player,player=null 时不渲染。
//
// 页面侧启动方式(字面量 id 规则 —— actions 字段名必须是 id):
//   startPlayer({
//     title: '大厂小民', sub: '面基', cover, remainingText: '剩余 1小时56分', playing: true,
//     actions: { toggle: { id: 'podcast.detail.fakePlayer.toggle' }, close: { id: 'podcast.detail.fakePlayer.close' } },
//   });
// 组件内部按共享 chrome 规则从 store 转发绑定(声明见 docs/platform/navigation/declaration.md)。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Img } from './ui';

export function GlobalFakePlayerBar() {
  const player = useDoubanStore((s) => s.player);
  const togglePlayer = useDoubanStore((s) => s.togglePlayer);
  const closePlayer = useDoubanStore((s) => s.closePlayer);
  const { bindTap } = useDoubanGestures();
  if (!player) return null;
  return (
    <div
      className="absolute left-3 right-3 bottom-16 z-30 flex items-center gap-2.5 rounded-full pl-1.5 pr-2 py-1.5 shadow-lg"
      style={{ background: 'rgba(30,30,32,0.95)' }}
      data-hide-on-keyboard="true"
    >
      <Img src={player.cover} className="w-9 h-9 rounded-full object-cover shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-xs text-white truncate">{player.title}</div>
        <div className="text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.55)' }}>
          {player.sub}{player.sub && ' · '}{player.remainingText}
        </div>
        {/* 静止进度条(不真走) */}
        <div className="mt-1 h-0.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
          <div className="h-full w-[8%] rounded-full" style={{ background: C.green }} />
        </div>
      </div>
      <button
        {...bindTap({ kind: 'action', id: player.actions.toggle.id }, { onTrigger: () => togglePlayer() })}
        className="w-8 h-8 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
        style={{ color: '#fff' }}
      >
        {player.playing ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>
      <button
        {...bindTap({ kind: 'action', id: player.actions.close.id }, { onTrigger: () => closePlayer() })}
        className="w-7 h-7 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
        style={{ color: 'rgba(255,255,255,0.6)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

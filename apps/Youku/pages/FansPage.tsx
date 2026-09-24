import React from 'react';
import Img from '../components/Img';
import { useYoukuGestures } from '../hooks/useYoukuGestures';
import { useYoukuStore } from '../state';
import { IcBack, EmptyUfo } from './me/meShared';

/**
 * spec 节点 me.fans(route /me/fans)—— 我的粉丝(s213 空态 + 审核加种子粉丝列表)。
 * 回关 toggle 联动;条目行 → creator.profile(粉丝主页同构)。
 */
export default function FansPage() {
  const { bindTap, action, bindBack } = useYoukuGestures();
  const fans = useYoukuStore((s) => s.fans);
  const toggleFanFollowBack = useYoukuStore((s) => s.toggleFanFollowBack);

  return (
    <div className="flex h-full w-full flex-col bg-(--app-c-page-bg) pt-10 text-(--app-c-text-primary)">
      {/* 顶栏 */}
      <div className="flex h-12 shrink-0 items-center px-3">
        <button {...bindBack()} aria-label="返回" className="flex h-9 w-9 cursor-pointer items-center justify-center border-none bg-transparent p-0 text-(--app-c-text-primary)">
          <IcBack size={24} strokeWidth={2.2} />
        </button>
        <span className="flex-1 text-center text-[18px] font-bold">我的粉丝</span>
        <span className="w-9" />
      </div>
      <div className="h-px shrink-0 bg-(--app-c-card-bg)" />

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto pb-6">
        {fans.length === 0 ? (
          <EmptyUfo text="你还没有粉丝哦~" />
        ) : (
          fans.map((f) => (
            <div key={f.userId} className="flex items-center gap-3 border-b border-[#1F1F1F] px-4 py-4">
              <div
                {...bindTap('me.fans.user.open', { params: { userId: f.userId } })}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
              >
                <Img src={f.avatar} label={f.name} ratio="square" className="h-[52px] w-[52px] shrink-0 rounded-full bg-(--app-c-chip-bg) object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[16px] font-medium">{f.name}</div>
                  <div className="mt-1 truncate text-[13px] text-[#999999]">{f.sign}</div>
                </div>
              </div>
              <button
                {...action('me.fans.followback.toggle', () => toggleFanFollowBack(f.userId), {
                  params: { userId: f.userId },
                })}
                className={`shrink-0 cursor-pointer rounded-full border-none px-4 py-2 text-[13px] ${
                  f.followedBack ? 'bg-(--app-c-chip-bg) text-[#999999]' : 'bg-[#0C7BFF] text-(--app-c-text-primary)'
                }`}
              >
                {f.followedBack ? '互相关注' : '回关'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

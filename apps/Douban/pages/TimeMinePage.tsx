import React, { useMemo } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, Avatar, Img, TopBar } from '../components/ui';
import { shareWithSystem } from '../capabilities';

// 节点: time.mine —— 我的时间。用户卡 + 礼物/下载双入口 + 历史空态 + 大家都在听横滑。
// 「已订阅N个专栏」联动 time.course 0元订阅(复用 podcastSubscriptions)。evidence: IMG_0329

export default function TimeMinePage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const currentUser = useDoubanStore((s) => s.currentUser);
  const courses = useDoubanStore((s) => s.courses);
  const podcastSubscriptions = useDoubanStore((s) => s.podcastSubscriptions);

  const subscribedCount = useMemo(() => {
    const courseIds = new Set(courses.map((c) => c.id));
    return podcastSubscriptions.filter((id) => courseIds.has(id)).length;
  }, [courses, podcastSubscriptions]);

  const recommend = useMemo(() => courses, [courses]);

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar
        title="我的时间"
        right={
          <button
            {...bindTap({ kind: 'action', id: 'time.mine.share.wontfix' }, { onTrigger: () => { const launched = shareWithSystem('【豆瓣】时间的朋友', (r) => { if (r.resultCode === 'OK') toast('分享成功'); }); if (!launched) toast('无法打开系统分享'); } })}
            className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer"
            style={{ color: C.text }}
            aria-label="分享"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
              <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
            </svg>
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 用户卡 */}
        <div className="flex items-center gap-3 p-4 bg-white">
          <Avatar src={currentUser.avatar} size={52} />
          <div className="flex-1 min-w-0">
            <div className="text-base font-bold truncate" style={{ color: C.text }}>{currentUser.name}</div>
            <div className="mt-1 text-xs" style={{ color: C.sub }}>已订阅{subscribedCount}个专栏</div>
          </div>
          <button
            {...bindTap('time.mine.home-open')}
            className="px-3.5 h-7 rounded-full text-xs font-medium cursor-pointer text-white"
            style={{ background: C.green, border: 'none' }}
          >
            时间首页
          </button>
        </div>

        {/* 礼物 / 下载 双入口(图标在上/文字在下,无分隔线) */}
        <div className="mt-2 grid grid-cols-2 bg-white py-3">
          <button
            {...bindTap({ kind: 'action', id: 'time.mine.gift.wontfix' }, { onTrigger: () => toast('该功能暂未开放') })}
            className="flex flex-col items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#E8912E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="9" width="16" height="11" rx="1" /><path d="M4 13h16M12 9v11" />
              <path d="M12 9c-1.5-3-6-2.5-6 0M12 9c1.5-3 6-2.5 6 0" />
            </svg>
            <span className="text-xs" style={{ color: C.text }}>礼物</span>
          </button>
          <button
            {...bindTap('time.mine.downloads-open')}
            className="flex flex-col items-center justify-center gap-1.5 bg-transparent border-none cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4C9AF0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
            </svg>
            <span className="text-xs" style={{ color: C.text }}>下载</span>
          </button>
        </div>

        {/* 历史记录(空态:仅灰字,无插画) */}
        <div className="mt-2 bg-white">
          <div className="px-4 pt-3 text-sm font-bold" style={{ color: C.text }}>历史记录</div>
          <div className="py-10 text-center text-sm" style={{ color: C.sub }}>还没有内容</div>
        </div>

        {/* 大家都在听(横滑) */}
        <div className="mt-2">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="text-base font-bold" style={{ color: C.text }}>大家都在听</div>
            <button {...bindTap('time.mine.home-open')} className="text-xs bg-transparent border-none cursor-pointer" style={{ color: C.sub }}>
              全部 ›
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto px-4 pb-2" data-scroll-container="recommend" data-scroll-direction="horizontal">
            {recommend.map((c) => (
              <div
                key={c.id}
                {...bindTap('time.mine.course-open', { params: { courseId: c.id } })}
                className="w-28 shrink-0 cursor-pointer"
              >
                <div className="relative">
                  <Img src={c.cover} className="w-28 h-36 rounded-lg object-cover" />
                  <span className="absolute bottom-1.5 right-1.5 px-1 rounded text-[9px] text-white" style={{ background: 'rgba(0,0,0,0.55)' }}>
                    {c.kind === 'video' ? '视频' : '音频'}
                  </span>
                </div>
                <div className="mt-1.5 text-xs font-medium leading-snug line-clamp-2" style={{ color: C.text }}>{c.title}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

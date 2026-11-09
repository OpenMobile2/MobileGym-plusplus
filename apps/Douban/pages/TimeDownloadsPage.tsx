import React, { useState } from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { C, TopBar, EmptyState } from '../components/ui';

// 节点: time.downloads —— 下载(离线专栏)。双tab 已下载/下载中,均空态。evidence: IMG_0330

type Tab = 'done' | 'doing';

export default function TimeDownloadsPage() {
  const { bindTap } = useDoubanGestures();
  const [tab, setTab] = useState<Tab>('done');

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <TopBar title="下载" />

      {/* 双tab */}
      <div className="flex bg-white shrink-0 border-b" style={{ borderColor: C.border }}>
        {([
          ['done', '已下载'],
          ['doing', '下载中'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            {...bindTap(
              { kind: 'action', id: 'time.downloads.tab.select.target' },
              { params: { tab: id }, onTrigger: () => setTab(id) },
            )}
            className="flex-1 h-11 relative bg-transparent border-none cursor-pointer text-sm"
            style={{ color: tab === id ? C.text : C.sub, fontWeight: tab === id ? 700 : 400 }}
          >
            {label}
            {tab === id && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-0 w-6 h-0.5 rounded" style={{ background: C.green }} />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {tab === 'done' ? (
          <EmptyState text="还没有已下载的内容" sub="订阅后可缓存课程离线收听" icon="box" />
        ) : (
          <EmptyState text="没有正在下载的任务" icon="box" />
        )}
      </div>
    </div>
  );
}

// apps/Tencentvideo/hooks/useDownloadTicker.ts —— 下载进度推进定时器
// (download.running.task.autoprogress)。下载相关页挂载时调用;
// 每秒 store.tickDownloads():按同时下载个数推进进行中任务、补位排队任务、完成转 done。
import { useEffect } from 'react';
import { useTencentvideoStore } from '../state';

export function useDownloadTicker(): void {
  const hasActive = useTencentvideoStore((s) =>
    s.downloads.items.some((t) => t.status === 'downloading' || t.status === 'queued'),
  );
  const pausedAll = useTencentvideoStore((s) => s.downloadPausedAll);
  const tickDownloads = useTencentvideoStore((s) => s.tickDownloads);
  useEffect(() => {
    if (!hasActive || pausedAll) return;
    const timer = window.setInterval(() => {
      tickDownloads();
    }, 1000);
    return () => window.clearInterval(timer);
  }, [hasActive, pausedAll, tickDownloads]);
}

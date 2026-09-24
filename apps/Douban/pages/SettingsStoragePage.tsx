// 节点: settings.storage —— 清理存储空间(evidence IMG_0299/frame:1ad80c)。
// 缓存行(250.42M)+ 删除图标 → 清零 + toast「清理完成」(与 settings.main 行联动);
// 豆瓣时间下载占用行删除 → wontfix。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { useSettingsLocalStore } from './settingsShared';

/** 存储行:标题 + 容量数值 + 删除图标按钮。 */
function StorageRow({
  label,
  value,
  bind,
}: {
  label: string;
  value: string;
  bind: object;
}) {
  return (
    <div className="w-full flex items-center gap-3 px-4 bg-white" style={{ height: 60 }}>
      <div className="flex-1 min-w-0 text-[16px]" style={{ color: C.text }}>{label}</div>
      <span className="text-[15px] shrink-0" style={{ color: C.sub }}>{value}</span>
      <button
        {...bind}
        className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer shrink-0"
        style={{ color: '#B9BEC6' }}
        aria-label="删除"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
          <path d="M10 11v6M14 11v6" />
        </svg>
      </button>
    </div>
  );
}

export default function SettingsStoragePage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const cacheM = useSettingsLocalStore((s) => s.cacheM);
  const clearCache = useSettingsLocalStore((s) => s.clearCache);

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="清理存储空间" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2">
          <StorageRow
            label="缓存"
            value={`${cacheM.toFixed(2)}M`}
            bind={bindTap(
              { kind: 'action', id: 'settings.storage.cache.clear' },
              {
                onTrigger: () => {
                  clearCache();
                  toast('清理完成');
                },
              },
            )}
          />
        </div>
        <div className="px-4 pt-2 pb-1 text-xs" style={{ color: '#B9BEC6' }}>
          清理缓存不会删除你的收藏与下载内容
        </div>

        <div className="mt-3">
          <StorageRow
            label="豆瓣时间已下载内容"
            value="1.28G"
            bind={bindTap(
              { kind: 'action', id: 'settings.storage.timeDownloads.wontfix' },
              { onTrigger: () => toast('该功能暂未开放') },
            )}
          />
        </div>
      </div>
    </div>
  );
}

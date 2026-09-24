import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useToast, TopBar } from '../components/ui';
import { NavRow } from '../components/SettingsRow';

const ITEMS = [
  { label: '图片缓存', size: '86.2 MB' },
  { label: '视频缓存', size: '38.7 MB' },
  { label: '其他缓存', size: '3.7 MB' },
];

export default function StorageSettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const [cleared, setCleared] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="存储空间" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="storage-list" data-scroll-direction="vertical">
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="text-[32px] font-bold text-[#FF8200]">{cleared ? '0 B' : '128.6 MB'}</div>
          <div className="text-[12px] text-[#9A9A9A] mt-1">当前缓存占用</div>
        </div>
        <div className="bg-white">
          {ITEMS.map((it) => (
            <div key={it.label} className="flex items-center px-4 py-3.5 border-b border-[#FAFAFA]">
              <span className="flex-1 text-[15px] text-[#1A1A1A]">{it.label}</span>
              <span className="text-[13px] text-[#9A9A9A]">{cleared ? '0 B' : it.size}</span>
            </div>
          ))}
        </div>
        <div className="bg-white mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'storage.clearCache.submit' }, {
              onTrigger: () => {
                if (cleared) { toast('缓存已清空'); return; }
                setCleared(true);
                toast('已清理 128.6 MB 缓存');
              },
            })}
            className="block w-full py-3.5 text-center text-[15px] text-[#FF8200] bg-transparent border-none cursor-pointer"
          >
            清理全部缓存
          </button>
        </div>
        <NavRow label="仅保留最近3天缓存"
          binding={bindTap({ kind: 'action', id: 'storage.item.stub' }, { onTrigger: () => toast('该功能暂未开放') })} />
      </div>
      {toastNode}
    </div>
  );
}

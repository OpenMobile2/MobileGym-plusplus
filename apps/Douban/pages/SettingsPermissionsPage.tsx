// 节点: settings.permissions —— 系统权限管理(evidence IMG_0303/frame:1ad80c,静态样式页)。
// 权限行列表(相册/相机/麦克风/定位…),每行权限名+当前状态+「前往系统设置」→ wontfix。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';

const PERMS: { name: string; desc: string; granted: boolean }[] = [
  { name: '相册', desc: '用于上传头像、发布图片广播', granted: true },
  { name: '相机', desc: '用于拍照上传', granted: true },
  { name: '麦克风', desc: '用于发布语音、播客录制', granted: false },
  { name: '定位', desc: '用于同城活动、IP属地展示', granted: true },
  { name: '通知', desc: '用于接收推送消息', granted: true },
  { name: '日历', desc: '用于添加上映/开播提醒', granted: false },
];

export default function SettingsPermissionsPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="系统权限管理" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-4 py-2.5 text-xs" style={{ color: '#B9BEC6' }}>
          你可在系统设置中管理豆瓣使用以下权限
        </div>
        <div className="bg-white">
          {PERMS.map((p, i) => (
            <button
              key={p.name}
              {...bindTap(
                { kind: 'action', id: 'settings.permissions.goSystem.wontfix' },
                { onTrigger: () => toast('该功能暂未开放') },
              )}
              className="w-full flex items-center gap-3 px-4 text-left bg-white border-none cursor-pointer"
              style={{ minHeight: 60, borderTop: i === 0 ? 'none' : `0.5px solid ${C.border}` }}
            >
              <div className="flex-1 min-w-0 py-2">
                <div className="text-[16px]" style={{ color: C.text }}>{p.name}</div>
                <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>{p.desc}</div>
              </div>
              <span className="text-[13px] shrink-0" style={{ color: p.granted ? C.sub : C.green }}>
                {p.granted ? '已允许' : '去开启'}
              </span>
              <span className="text-lg shrink-0" style={{ color: '#C7CCD4' }}>›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

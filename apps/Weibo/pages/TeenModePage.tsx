import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { TopBar } from '../components/ui';
import { ToggleRow } from '../components/SettingsRow';

export default function TeenModePage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const g = useWeiboStore((st) => st.settings);
  const setSetting = useWeiboStore((st) => st.setSetting);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="未成年人模式" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="teen-list" data-scroll-direction="vertical">
        <div className="flex flex-col items-center pt-8 pb-4 px-8">
          <span className="text-[40px]">🛡️</span>
          <div className="text-[13px] text-[#7F7F7F] text-center mt-3 leading-relaxed">
            开启后,将过滤不适宜内容,每日使用时长与打赏充值受限,22:00-06:00 无法使用。
          </div>
        </div>
        <div className="bg-white">
          <ToggleRow
            label="开启未成年人模式"
            value={g.teenMode}
            binding={bindTap({ kind: 'action', id: 'teen.mode.toggle' }, { onTrigger: () => setSetting('teenMode', !g.teenMode) })}
          />
        </div>
        {g.teenMode && (
          <div className="px-4 py-3 text-[12px] text-[#41C468]">✓ 未成年人模式已开启,内容与时长已受保护</div>
        )}
      </div>
    </div>
  );
}

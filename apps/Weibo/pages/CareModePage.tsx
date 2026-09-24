import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { TopBar } from '../components/ui';
import { ToggleRow } from '../components/SettingsRow';

export default function CareModePage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const g = useWeiboStore((st) => st.settings);
  const setSetting = useWeiboStore((st) => st.setSetting);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="关爱模式" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="care-list" data-scroll-direction="vertical">
        <div className="flex flex-col items-center pt-8 pb-4 px-8">
          <span className="text-[40px]">💚</span>
          <div className="text-[13px] text-[#7F7F7F] text-center mt-3 leading-relaxed">
            关爱模式采用更大字号、更简洁的界面,方便长辈使用。
          </div>
        </div>
        <div className="bg-white">
          <ToggleRow
            label="开启关爱模式(大字版)"
            value={g.careMode}
            binding={bindTap({ kind: 'action', id: 'care.mode.toggle' }, { onTrigger: () => setSetting('careMode', !g.careMode) })}
          />
        </div>
        <div className={`px-4 py-4 ${g.careMode ? 'text-[20px]' : 'text-[15px]'} text-[#1A1A1A] bg-white mt-2 transition-all`}>
          示例文字:今天天气不错,出去走走吧 ☀️
        </div>
      </div>
    </div>
  );
}

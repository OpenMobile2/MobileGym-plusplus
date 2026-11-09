import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { useToast, TopBar } from '../components/ui';
import { ToggleRow, SelectRow } from '../components/SettingsRow';
import { IcRight } from '../res/icons';

const FONT_PREVIEW: Record<string, string> = { small: 'text-[13px]', normal: 'text-[15px]', large: 'text-[18px]' };

export default function GeneralSettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const [toastNode, toast] = useToast();
  const settings = useWeiboStore((st) => st.settings);
  const setSetting = useWeiboStore((st) => st.setSetting);
  const [cacheCleared, setCacheCleared] = React.useState(false);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="通用设置" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="general-list" data-scroll-direction="vertical">
        {/* 字号(带实时预览) */}
        <div className="bg-white mt-2">
          <SelectRow
            label="字体大小"
            value={settings.fontSize}
            options={[
              { id: 'small', label: '小' },
              { id: 'normal', label: '标准' },
              { id: 'large', label: '大' },
            ]}
            binding={(id) => bindTap({ kind: 'action', id: 'general.fontSize.select.target' }, { params: { target: id }, onTrigger: () => setSetting('fontSize', id) })}
          />
          <div className={`px-4 py-3 text-[#5B5B5B] ${FONT_PREVIEW[settings.fontSize]}`}>
            预览:今天也是元气满满的一天 ☀️
          </div>
        </div>

        <div className="bg-white mt-2">
          <SelectRow
            label="深色模式"
            value={settings.darkMode}
            options={[
              { id: 'system', label: '跟随系统' },
              { id: 'on', label: '开启' },
              { id: 'off', label: '关闭' },
            ]}
            binding={(id) => bindTap({ kind: 'action', id: 'general.darkMode.select.target' }, { params: { target: id }, onTrigger: () => setSetting('darkMode', id) })}
          />
        </div>

        <div className="bg-white mt-2">
          <SelectRow
            label="视频自动播放"
            value={settings.videoAutoplay}
            options={[
              { id: 'wifi', label: '仅 Wi-Fi 下' },
              { id: 'always', label: '总是' },
              { id: 'off', label: '关闭' },
            ]}
            binding={(id) => bindTap({ kind: 'action', id: 'general.videoAutoplay.select.target' }, { params: { target: id }, onTrigger: () => setSetting('videoAutoplay', id) })}
          />
          <ToggleRow
            label="非 Wi-Fi 播放提醒"
            value={settings.trafficReminder}
            binding={bindTap({ kind: 'action', id: 'general.trafficReminder.toggle' }, { onTrigger: () => setSetting('trafficReminder', !settings.trafficReminder) })}
          />
        </div>

        <div className="bg-white mt-2">
          <button
            {...bindTap({ kind: 'action', id: 'general.clearCache.submit' }, {
              onTrigger: () => {
                if (cacheCleared) { toast('缓存已是最新'); return; }
                setCacheCleared(true);
                toast('已清理 128.6 MB 缓存');
              },
            })}
            className="flex items-center w-full px-4 py-3.5 bg-transparent border-none cursor-pointer text-left"
          >
            <span className="flex-1 text-[15px] text-[#1A1A1A]">清理缓存</span>
            <span className="text-[13px] text-[#9A9A9A] mr-1">{cacheCleared ? '0 B' : '128.6 MB'}</span>
            <IcRight size={16} className="text-[#CCCCCC]" />
          </button>
        </div>
      </div>
      {toastNode}
    </div>
  );
}

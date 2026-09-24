import React from 'react';
import { useTbsgGestures } from '../hooks/useTbsgGestures';
import { useTbsgStore } from '../state';
import { TopBar, showToast } from '../components/common';
import { IcRight } from '../res/icons';

/** 通用设置页(spec settings.general,推断页) */
export default function GeneralSettingsPage() {
  const { bindTap } = useTbsgGestures();
  const settings = useTbsgStore((st) => st.settings);
  const updateSettings = useTbsgStore((st) => st.updateSettings);
  const clearCache = useTbsgStore((st) => st.clearCache);

  return (
    <div className="flex flex-col h-full bg-[#F3F6F8]">
      <TopBar title="通用设置" titleLeft />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto">
        <div className="bg-white mt-2.5">
          {/* 清理缓存 */}
          <button
            {...bindTap<HTMLButtonElement>(
              { kind: 'action', id: 'general.cache.clear' },
              { onTrigger: () => { clearCache(); showToast('已清理'); } },
            )}
            className="w-full flex items-center px-4 py-4 bg-transparent border-x-0 border-t-0 border-b border-solid border-[#F5F5F5] cursor-pointer text-left"
          >
            <span className="text-[16px] text-[#1A1A1A]">清理缓存</span>
            <div className="flex-1" />
            <span className="text-[13px] text-[#999999] mr-1">{settings.cacheMB}MB</span>
            <IcRight size={16} className="text-[#BBBBBB]" />
          </button>

          {/* 图片质量 */}
          <div className="flex items-center px-4 py-4 border-b border-[#F5F5F5]">
            <span className="text-[16px] text-[#1A1A1A]">图片质量</span>
            <div className="flex-1" />
            {([
              ['high', '高清'],
              ['low', '省流量'],
            ] as const).map(([q, label]) => (
              <button
                key={q}
                {...bindTap<HTMLButtonElement>(
                  { kind: 'action', id: 'general.imgquality.select' },
                  { params: { quality: q }, onTrigger: () => updateSettings({ imgQuality: q }) },
                )}
                className={`ml-2 h-8 px-3 rounded-full text-[13px] border-none cursor-pointer ${
                  settings.imgQuality === q
                    ? 'bg-[#FDEEE3] text-[#ED6C2C] font-semibold'
                    : 'bg-[#F3F6F8] text-[#666666]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* 深色模式 */}
          <div className="flex items-center px-4 py-4">
            <span className="text-[16px] text-[#1A1A1A]">深色模式</span>
            <div className="flex-1" />
            <span className="text-[13px] text-[#999999]">跟随系统</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 节点: settings.watermark —— 图片水印设置(evidence IMG_0298/frame:1ad80c)。
// 主开关「带个人水印」(personal):关时联动隐藏子行;开时显示「保存到相册的图片带水印」子开关。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { Toggle } from './settingsShared';

function ToggleRow({ label, on, bind }: { label: string; on: boolean; bind: object }) {
  return (
    <div className="w-full flex items-center gap-3 px-4 bg-white" style={{ minHeight: 56 }}>
      <div className="flex-1 min-w-0 py-2 text-[16px]" style={{ color: C.text }}>{label}</div>
      <Toggle on={on} bind={bind} />
    </div>
  );
}

export default function SettingsWatermarkPage() {
  const { bindTap } = useDoubanGestures();
  const watermark = useDoubanStore((s) => s.settings.watermark);
  const updateSettings = useDoubanStore((s) => s.updateSettings);

  const master = watermark.personal;

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="图片水印设置" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2">
          <ToggleRow
            label="带个人水印"
            on={master}
            bind={bindTap(
              { kind: 'action', id: 'settings.watermark.master.toggle' },
              { onTrigger: () => updateSettings('watermark', { personal: !master }) },
            )}
          />
        </div>
        <div className="px-4 pt-2 pb-1 text-xs leading-5" style={{ color: '#B9BEC6' }}>
          开启后,你分享的图片将带上你的豆瓣昵称与头像水印
        </div>

        {master && (
          <div className="mt-3">
            <ToggleRow
              label="保存到相册的图片带水印"
              on={watermark.saveWithWatermark}
              bind={bindTap(
                { kind: 'action', id: 'settings.watermark.save.toggle' },
                {
                  onTrigger: () =>
                    updateSettings('watermark', { saveWithWatermark: !watermark.saveWithWatermark }),
                },
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { useParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { TopBar, Switch, ListRow, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 聊天信息(spec hotel.csInfo)。进入店铺;置顶/推送/黑名单开关。 */
export default function HotelCsInfoPage() {
  const { id = '' } = useParams();
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const settings = useCtripStore((s) => s.settings);
  const toggleSetting = useCtripStore((s) => s.toggleSetting);
  const hotels = useCtripStore((s) => s.hotels);
  const hotel = hotels.find((h) => h.id === id) ?? hotels[0];

  const SWITCHES = [
    { key: 'csTop', label: '聊天置顶' },
    { key: 'csPush', label: '接收推送' },
    { key: 'csBlock', label: '加入黑名单' },
  ];

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title="聊天信息" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="mt-2">
          <ListRow label="进入店铺" value={hotel.name} onClick={() => showToast(WONTFIX_TOAST)} />
        </div>
        <div className="mt-2">
          {SWITCHES.map((s) => (
            <div key={s.key} className="flex items-center justify-between px-4 py-3.5 bg-white border-b border-[#F2F2F2]">
              <span className="text-[15px] text-[#222222]">{s.label}</span>
              <Switch
                on={!!settings[s.key]}
                onToggle={() => toggleSetting(s.key)}
                binding={bindTap({ kind: 'action', id: 'csInfo.switch.toggle.top' }, { params: { key: s.key }, onTrigger: () => toggleSetting(s.key) })}
              />
            </div>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}

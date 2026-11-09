/** 消息通知设置页(补拍G3)。spec: settings.notification */
import React from 'react';
import { useMeiyouStore } from '../state';
import { useMeiyouGestures } from '../hooks/useMeiyouGestures';
import { TopBar, Switch } from '../components/ui';

const ITEMS = [
  { key: 'night', label: '夜间免打扰', sub: '22:00 - 8:00 期间不推送通知' },
  { key: 'sound', label: '声音', sub: '' },
  { key: 'vibrate', label: '震动', sub: '' },
] as const;

export default function NotifSettingsPage() {
  const { bindTap } = useMeiyouGestures();
  const notif = useMeiyouStore((s) => s.notifSettings);
  const toggleNotif = useMeiyouStore((s) => s.toggleNotif);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F4]">
      <TopBar title="消息通知" />
      <div className="flex-1 overflow-y-auto">
        <div className="bg-white mt-2 px-4 py-3 flex items-center">
          <div className="flex-1">
            <div className="text-[15px] text-[#1A1A1A]">允许通知</div>
            <div className="text-[12px] text-[#999] mt-0.5">接收经期提醒、社区互动等通知</div>
          </div>
          <Switch on={notif.master} bind={bindTap({ kind: 'action', id: 'notif.master.toggle' }, { onTrigger: () => toggleNotif('master') })} />
        </div>

        <div className="mt-3 px-4 py-1 text-[12px] text-[#999]">夜间和声音</div>
        <div className="bg-white" style={{ opacity: notif.master ? 1 : 0.4 }}>
          {ITEMS.map((it) => (
            <div key={it.key} className="px-4 py-3 flex items-center border-b border-[#F5F5F5]">
              <div className="flex-1">
                <div className="text-[15px] text-[#1A1A1A]">{it.label}</div>
                {it.sub && <div className="text-[12px] text-[#999] mt-0.5">{it.sub}</div>}
              </div>
              <Switch
                on={notif[it.key]}
                bind={bindTap({ kind: 'action', id: 'notif.item.toggle' }, { params: { target: it.key }, onTrigger: () => toggleNotif(it.key) })}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { TopBar } from '../components/ui';
import { ToggleRow } from '../components/SettingsRow';

export default function NotificationSettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const g = useWeiboStore((st) => st.settings);
  const setSetting = useWeiboStore((st) => st.setSetting);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="通知设置" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="notif-list" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          <ToggleRow
            label="接收推送通知"
            sub="关闭后将不再收到任何推送"
            value={g.pushEnabled}
            binding={bindTap({ kind: 'action', id: 'notif.push.toggle' }, { onTrigger: () => setSetting('pushEnabled', !g.pushEnabled) })}
          />
        </div>
        {g.pushEnabled && (
          <>
            <div className="px-4 pt-4 pb-1 text-[13px] text-[#9A9A9A]">互动通知</div>
            <div className="bg-white">
              <ToggleRow label="评论" value={g.notifComment}
                binding={bindTap({ kind: 'action', id: 'notif.comment.toggle' }, { onTrigger: () => setSetting('notifComment', !g.notifComment) })} />
              <ToggleRow label="赞" value={g.notifLike}
                binding={bindTap({ kind: 'action', id: 'notif.like.toggle' }, { onTrigger: () => setSetting('notifLike', !g.notifLike) })} />
              <ToggleRow label="@我的" value={g.notifAt}
                binding={bindTap({ kind: 'action', id: 'notif.at.toggle' }, { onTrigger: () => setSetting('notifAt', !g.notifAt) })} />
              <ToggleRow label="私信" value={g.notifDM}
                binding={bindTap({ kind: 'action', id: 'notif.dm.toggle' }, { onTrigger: () => setSetting('notifDM', !g.notifDM) })} />
              <ToggleRow label="新增粉丝" value={g.notifFans}
                binding={bindTap({ kind: 'action', id: 'notif.fans.toggle' }, { onTrigger: () => setSetting('notifFans', !g.notifFans) })} />
            </div>
            <div className="px-4 pt-4 pb-1 text-[13px] text-[#9A9A9A]">免打扰</div>
            <div className="bg-white">
              <ToggleRow label="夜间免打扰" sub="23:00 - 08:00 静音推送" value={g.dndEnabled}
                binding={bindTap({ kind: 'action', id: 'notif.dnd.toggle' }, { onTrigger: () => setSetting('dndEnabled', !g.dndEnabled) })} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

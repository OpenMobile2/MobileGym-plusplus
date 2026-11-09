import React from 'react';
import { useWeiboGestures } from '../hooks/useWeiboGestures';
import { useWeiboStore } from '../state';
import { TopBar } from '../components/ui';
import { ToggleRow, SelectRow } from '../components/SettingsRow';

export default function PrivacySettingsPage() {
  const { bindTap, bindBack } = useWeiboGestures();
  const settings = useWeiboStore((st) => st.settings);
  const setSetting = useWeiboStore((st) => st.setSetting);

  return (
    <div className="flex flex-col h-full bg-[#F2F2F2]">
      <TopBar backBinding={bindBack()} title="隐私设置" />
      <div className="flex-1 overflow-y-auto" data-scroll-container="privacy-list" data-scroll-direction="vertical">
        <div className="bg-white mt-2">
          <SelectRow
            label="谁可以看我的微博"
            value={settings.whoCanSeePosts}
            options={[
              { id: 'all', label: '所有人' },
              { id: 'following', label: '我关注的人' },
              { id: 'fans', label: '我的粉丝' },
            ]}
            binding={(id) => bindTap({ kind: 'action', id: 'privacy.visibility.select.target' }, { params: { target: id }, onTrigger: () => setSetting('whoCanSeePosts', id) })}
          />
        </div>
        <div className="bg-white mt-2">
          <ToggleRow
            label="允许通过手机号找到我"
            sub="关闭后他人无法通过手机号搜索到你"
            value={settings.findByPhone}
            binding={bindTap({ kind: 'action', id: 'privacy.findByPhone.toggle' }, { onTrigger: () => setSetting('findByPhone', !settings.findByPhone) })}
          />
          <ToggleRow
            label="公开我的赞"
            value={settings.showLikes}
            binding={bindTap({ kind: 'action', id: 'privacy.showLikes.toggle' }, { onTrigger: () => setSetting('showLikes', !settings.showLikes) })}
          />
          <ToggleRow
            label="允许陌生人给我发私信"
            value={settings.allowStrangerDM}
            binding={bindTap({ kind: 'action', id: 'privacy.allowStrangerDM.toggle' }, { onTrigger: () => setSetting('allowStrangerDM', !settings.allowStrangerDM) })}
          />
          <ToggleRow
            label="微博展示我的IP属地"
            value={settings.showRegion}
            binding={bindTap({ kind: 'action', id: 'privacy.showRegion.toggle' }, { onTrigger: () => setSetting('showRegion', !settings.showRegion) })}
          />
          <ToggleRow
            label="公开我的关注列表"
            value={settings.publicFollowing}
            binding={bindTap({ kind: 'action', id: 'privacy.publicFollowing.toggle' }, { onTrigger: () => setSetting('publicFollowing', !settings.publicFollowing) })}
          />
        </div>
      </div>
    </div>
  );
}

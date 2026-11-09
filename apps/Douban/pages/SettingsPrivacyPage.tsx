// 节点: settings.privacy —— 隐私设置(evidence IMG_0295/frame:1ad80c)。
// 5 组:个人主页(主页可见性 toggle + 隐藏小组)/互动(私信设置 + 黑名单)/
// 同步到动态(3 个同步 toggle)/隐私防护(应急防护模式)/个人信息与权限(2 行跳转)。
import React from 'react';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { GroupGap, SettingRow, Toggle, useSettingsLocalStore } from './settingsShared';

/** 开关行:标题 + 副说明 + 右侧开关。 */
function ToggleRow({ label, sub, on, bind }: { label: string; sub?: string; on: boolean; bind: object }) {
  return (
    <div className="w-full flex items-center gap-3 px-4 bg-white" style={{ minHeight: 56 }}>
      <div className="flex-1 min-w-0 py-2">
        <div className="text-[16px]" style={{ color: C.text }}>{label}</div>
        {sub && <div className="mt-0.5 text-xs" style={{ color: '#B9BEC6' }}>{sub}</div>}
      </div>
      <Toggle on={on} bind={bind} />
    </div>
  );
}

export default function SettingsPrivacyPage() {
  const { bindTap } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const privacy = useDoubanStore((s) => s.settings.privacy);
  const updateSettings = useDoubanStore((s) => s.updateSettings);
  const extra = useSettingsLocalStore((s) => s.extraToggles);
  const toggleExtra = useSettingsLocalStore((s) => s.toggleExtra);

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id: id as never }, { onTrigger: () => toast('该功能暂未开放') });

  return (
    <div className="flex flex-col h-full bg-[#F7F7F8]" data-status-bar-foreground="dark">
      <TopBar title="隐私" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 个人主页(IMG_0295:主页可见性 toggle + 对他人隐藏我加入的小组) */}
        <div className="px-4 pt-3 pb-1 text-[13px]" style={{ color: '#B9BEC6' }}>个人主页</div>
        <ToggleRow
          label="仅展示我主页部分内容"
          sub="开启后,他人访问主页时仅可见你选择公开的内容"
          on={privacy.homepageVisible !== 'all'}
          bind={bindTap(
            { kind: 'action', id: 'settings.privacy.homepageVisible.toggle' },
            {
              onTrigger: () =>
                updateSettings('privacy', {
                  homepageVisible: privacy.homepageVisible === 'all' ? 'self' : 'all',
                }),
            },
          )}
        />
        <SettingRow label="对他人隐藏我加入的小组" bind={wontfix('settings.privacy.hideGroups.wontfix')} />

        {/* 互动(IMG_0295:私信设置 + 黑名单管理) */}
        <GroupGap />
        <div className="px-4 pt-3 pb-1 text-[13px]" style={{ color: '#B9BEC6' }}>互动</div>
        <SettingRow label="私信设置" value="接收所有人私信" bind={wontfix('settings.privacy.visibility.wontfix')} />
        <SettingRow label="黑名单管理" bind={wontfix('settings.privacy.blacklist.wontfix')} />

        {/* 同步到动态(IMG_0295:组头 + 3 个同步开关) */}
        <GroupGap />
        <div className="px-4 pt-3 pb-1 text-[13px]" style={{ color: '#B9BEC6' }}>同步到动态</div>
        <ToggleRow
          label="关注他人时发动态"
          on={extra['privacy.syncFollow']}
          bind={bindTap(
            { kind: 'action', id: 'settings.privacy.syncFeed.toggle' },
            { onTrigger: () => toggleExtra('privacy.syncFollow') },
          )}
        />
        <ToggleRow
          label="加入小组时发动态"
          on={extra['privacy.syncJoinGroup']}
          bind={bindTap(
            { kind: 'action', id: 'settings.privacy.syncFeed.toggle' },
            { onTrigger: () => toggleExtra('privacy.syncJoinGroup') },
          )}
        />
        <ToggleRow
          label="向豆列添加内容时发动态"
          on={privacy.syncFeed}
          bind={bindTap(
            { kind: 'action', id: 'settings.privacy.syncFeed.toggle' },
            { onTrigger: () => updateSettings('privacy', { syncFeed: !privacy.syncFeed }) },
          )}
        />

        {/* 隐私防护(IMG_0295:组头 + 应急防护模式,右值「未开启 ›」) */}
        <GroupGap />
        <div className="px-4 pt-3 pb-1 text-[13px]" style={{ color: '#B9BEC6' }}>隐私防护</div>
        <SettingRow label="应急防护模式" value="未开启" bind={wontfix('settings.privacy.visibility.wontfix')} />

        {/* 个人信息与权限(IMG_0295:组头 + 两行均为跳转 ›) */}
        <GroupGap />
        <div className="px-4 pt-3 pb-1 text-[13px]" style={{ color: '#B9BEC6' }}>个人信息与权限</div>
        <SettingRow label="个性化内容推荐" bind={wontfix('settings.privacy.adPush.toggle')} />
        <SettingRow label="了解与管理广告推送" bind={wontfix('settings.privacy.adPush.toggle')} />
        <div className="h-8" />
      </div>
    </div>
  );
}

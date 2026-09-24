// 节点: settings.main —— 设置主页(evidence IMG_0292/IMG_0304)。
// 分组菜单树:账号设置/通用/个人信息保护/关于 + 退出登录。
// 清理存储空间行右侧实时显示缓存量(与 settings.storage 页联动,清理后 0.00M)。
// 退出登录 → 确认弹窗(URL 驱动 ?dialog=logout)→ 确定跳 auth.login。
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDoubanGestures } from '../hooks/useDoubanGestures';
import { useDoubanStore } from '../state';
import { C, TopBar } from '../components/ui';
import { CenterDialog } from '../components/Sheet';
import { GroupHeader, GroupGap, SettingRow, useSettingsLocalStore } from './settingsShared';

export default function SettingsMainPage() {
  const { bindTap, back } = useDoubanGestures();
  const toast = useDoubanStore((s) => s.toast);
  const cacheM = useSettingsLocalStore((s) => s.cacheM);
  const [searchParams, setSearchParams] = useSearchParams();
  const logoutDialogOpen = searchParams.get('dialog') === 'logout';

  const wontfix = (id: string) =>
    bindTap({ kind: 'action', id: id as never }, { onTrigger: () => toast('该功能暂未开放') });

  return (
    <div className="flex flex-col h-full bg-white relative" data-status-bar-foreground="dark">
      <TopBar title="设置" borderless />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <GroupHeader label="账号设置" />
        <SettingRow label="资料与账号" bind={bindTap('settings.main.account-open')} />
        <SettingRow label="推送通知" value="打开消息通知" bind={bindTap('settings.main.push-open')} />
        <SettingRow label="隐私设置" bind={bindTap('settings.main.privacy-open')} />

        <GroupGap />
        <GroupHeader label="通用" />
        <SettingRow label="图片水印设置" bind={bindTap('settings.main.watermark-open')} />
        <SettingRow
          label="清理存储空间"
          value={`${cacheM.toFixed(2)}M`}
          bind={bindTap('settings.main.storage-open')}
        />
        <SettingRow label="网络诊断" bind={bindTap('settings.main.netdiag-open')} />
        <SettingRow label="实验室" bind={bindTap('settings.main.lab-open')} />
        <SettingRow label="豆瓣App小组件" bind={bindTap('settings.main.widget-open')} />

        <GroupGap />
        <GroupHeader label="个人信息保护" />
        <SettingRow label="系统权限管理" bind={bindTap('settings.main.permissions-open')} />
        <SettingRow label="个人信息管理" bind={wontfix('settings.main.infoManage.wontfix')} />
        <SettingRow label="已收集个人信息" bind={wontfix('settings.main.infoManage.wontfix')} />
        <SettingRow label="第三方共享信息" bind={wontfix('settings.main.infoManage.wontfix')} />
        <SettingRow label="算法公示" bind={wontfix('settings.main.algorithm.wontfix')} />

        <GroupGap />
        <GroupHeader label="关于" />
        <SettingRow label="隐私政策摘要" bind={wontfix('settings.main.privacyDigest.wontfix')} />
        <SettingRow
          label="关于豆瓣"
          value="版本 7.128.0"
          bind={bindTap('settings.main.about-open')}
        />

        {/* 退出登录 */}
        <div className="px-4 pt-6 pb-10">
          <button
            {...bindTap(
              { kind: 'action', id: 'settings.main.logout.confirm' },
              {
                onTrigger: () =>
                  setSearchParams((p) => {
                    p.set('dialog', 'logout');
                    return p;
                  }),
              },
            )}
            className="w-full h-12 rounded-xl border-none cursor-pointer text-[16px] font-medium"
            style={{ background: '#F5F5F6', color: C.text }}
          >
            退出登录
          </button>
        </div>
      </div>

      {/* 退出确认弹窗(uiState=logout.confirm,frame:1ad80c@t0060) */}
      {logoutDialogOpen && (
        <CenterDialog
          title="确认退出登录?"
          buttons={[
            {
              label: '取消',
              bind: bindTap(
                { kind: 'action', id: 'settings.main.logout.cancel' },
                { onTrigger: () => back() },
              ),
            },
            {
              label: '确定',
              primary: true,
              bind: bindTap('settings.main.logout-open'),
            },
          ]}
        />
      )}
    </div>
  );
}

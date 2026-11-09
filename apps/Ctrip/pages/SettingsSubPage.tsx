import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCtripStore } from '../state';
import { useCtripGestures } from '../hooks/useCtripGestures';
import { useCtripStrings } from '../hooks/useCtripStrings';
import { TopBar, Switch, useToast } from '../components/ui';
import { WONTFIX_TOAST } from '../constants';

/** 设置二级页：按 type 区分 个人信息 / 账号安全 / 支付 / 隐私。 */
export default function SettingsSubPage() {
  const s = useCtripStrings();
  const [sp] = useSearchParams();
  const type = sp.get('type') || 'account';
  const { bindTap } = useCtripGestures();
  const [toast, showToast] = useToast();
  const settings = useCtripStore((st) => st.settings);
  const toggleSetting = useCtripStore((st) => st.toggleSetting);
  const user = useCtripStore((st) => st.user);

  const META: Record<string, { title: string; toggles: { key: string; label: string }[]; links: string[]; profile?: boolean }> = {
    profile: {
      title: s.t('个人信息'),
      toggles: [],
      links: [s.t('修改昵称'), s.t('更换头像'), s.t('绑定邮箱')],
      profile: true,
    },
    account: {
      title: s.t('账号与安全'),
      toggles: [{ key: 'subRealname', label: s.t('实名认证展示') }],
      links: [s.t('修改密码'), s.t('绑定手机'), s.t('第三方账号'), s.t('注销账号')],
    },
    pay: {
      title: s.t('支付设置'),
      toggles: [
        { key: 'payFingerprint', label: s.t('指纹/面容支付') },
        { key: 'payDefaultWx', label: s.t('默认微信支付') },
      ],
      links: [s.t('常用银行卡'), s.t('支付密码'), s.t('免密支付额度')],
    },
    privacy: {
      title: s.t('隐私设置'),
      toggles: [
        { key: 'subLocation', label: s.t('允许获取位置') },
        { key: 'subPersonalized', label: s.t('个性化推荐') },
      ],
      links: [s.t('系统权限管理'), s.t('广告偏好'), s.t('下载个人信息副本')],
    },
  };
  const cfg = META[type] || META.account;

  return (
    <div className="flex flex-col h-full bg-[#F5F6F8]">
      <TopBar title={cfg.title} />
      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {cfg.profile && (
          <div className="bg-white mt-2 px-4 py-4">
            <div className="text-[15px] font-semibold text-[#222222]">{user.name}</div>
            <div className="text-[12px] text-[#999999] mt-1">{user.memberLevel} · {user.points}积分</div>
          </div>
        )}
        {cfg.toggles.length > 0 && (
          <div className="bg-white mt-2">
            {cfg.toggles.map((t) => (
              <div key={t.key} className="flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2]">
                <span className="text-[15px] text-[#222222]">{t.label}</span>
                <Switch on={!!settings[t.key]} onToggle={() => toggleSetting(t.key)} binding={bindTap({ kind: 'action', id: 'settingsSub.item.toggle' }, { params: { key: t.key }, onTrigger: () => toggleSetting(t.key) })} />
              </div>
            ))}
          </div>
        )}
        <div className="bg-white mt-2">
          {cfg.links.map((l) => (
            <button key={l} {...bindTap({ kind: 'action', id: 'settingsSub.item.toggle' }, { params: { link: l }, onTrigger: () => showToast(WONTFIX_TOAST) })} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-[#F2F2F2] bg-transparent border-x-0 border-t-0 cursor-pointer">
              <span className="text-[15px] text-[#222222]">{l}</span>
              <span className="text-[#CCCCCC]">›</span>
            </button>
          ))}
        </div>
      </div>
      {toast}
    </div>
  );
}

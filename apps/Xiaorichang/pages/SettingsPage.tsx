import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useDialogs } from '../hooks/useDialogs';
import { PageHeader, SettingRow, Switch } from '../components/common';
import { IcRight } from '../res/icons';

/** 设置(s200)。语言三档 + 跟随系统暗黑 是保真硬约束(§10.2 / design-tokens §6)。 */
export default function SettingsPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const notice = () => st.showNotice(s.notAvailable);
  const { dialogs, confirm } = useDialogs();
  const set = st.updateSettings;
  const v = st.settings;

  const SegBtn = ({ on, label, bind }: { on: boolean; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="rounded-full px-3 py-1 text-xs"
      style={on ? { background: '#424242', color: '#fff' } : { background: '#F2F3F5', color: '#9AA5B1' }}>
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.settings} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="overflow-hidden rounded-2xl">
          <SettingRow label="密码锁定">
            <Switch on={false} {...action('settings.passlock.wontfixToast', notice)} />
          </SettingRow>
          <button {...bindTap('settings.tabbar.open')}
            className="flex w-full items-center justify-between border-b border-[#F2F2F2] bg-white px-4 py-3.5 text-sm text-[#424242]">
            底部栏设置<IcRight size={15} className="text-[#C9CDD3]" />
          </button>
          <button {...bindTap('settings.home.open')}
            className="flex w-full items-center justify-between bg-white px-4 py-3.5 text-sm text-[#424242]">
            首页功能设置<IcRight size={15} className="text-[#C9CDD3]" />
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl">
          <SettingRow label="每日提醒">
            <Switch on={v.dailyReminder} {...action('settings.dailyReminder.toggle', () => set({ dailyReminder: !v.dailyReminder }))} />
          </SettingRow>
          <SettingRow label="提醒时间">
            <input type="time" value={v.reminderTime}
              {...action('settings.reminderTime.pick', () => {})}
              onChange={(e) => set({ reminderTime: e.target.value })}
              className="rounded-full bg-[#F2F3F5] px-3 py-1 text-xs text-[#424242]" />
          </SettingRow>
          <SettingRow label="一周的开始" hint="影响统计周视图与月历列序">
            <div className="flex gap-1.5">
              <SegBtn on={v.weekStart === 'mon'} label="周一" bind={action('settings.weekStart.select.mon', () => set({ weekStart: 'mon' }))} />
              <SegBtn on={v.weekStart === 'sun'} label="周日" bind={action('settings.weekStart.select.sun', () => set({ weekStart: 'sun' }))} />
            </div>
          </SettingRow>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl">
          <SettingRow label="按键声音">
            <Switch on={v.keySound} {...action('settings.keySound.toggle', () => set({ keySound: !v.keySound }))} />
          </SettingRow>
          <SettingRow label="按键震动">
            <Switch on={v.haptic} {...action('settings.haptic.toggle', () => set({ haptic: !v.haptic }))} />
          </SettingRow>
          <SettingRow label="光芒值变化横幅" hint="关闭后打卡不再弹光芒提示">
            <Switch on={v.glowBanner} {...action('settings.glowBanner.toggle', () => set({ glowBanner: !v.glowBanner }))} />
          </SettingRow>
          <SettingRow label={s.followSystemDark}>
            <Switch on={v.followSystemDark} {...action('settings.darkMode.toggle', () => set({ followSystemDark: !v.followSystemDark }))} />
          </SettingRow>
          <SettingRow label="关闭通知角标">
            <Switch on={v.badge} {...action('settings.badge.toggle', () => set({ badge: !v.badge }))} />
          </SettingRow>
          <SettingRow label={s.language}>
            <div className="flex gap-1.5">
              <SegBtn on={v.language === 'system'} label={s.languageSystem} bind={action('settings.locale.select.system', () => set({ language: 'system' }))} />
              <SegBtn on={v.language === 'zh'} label={s.languageZh} bind={action('settings.locale.select.zh', () => set({ language: 'zh' }))} />
              <SegBtn on={v.language === 'en'} label="EN" bind={action('settings.locale.select.en', () => set({ language: 'en' }))} />
            </div>
          </SettingRow>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl">
          <button {...action('settings.cache.clear', () => confirm({
            title: '清空本地缓存图片?', onConfirm: () => st.showNotice(s.notAvailable),
          }))}
            className="w-full border-b border-[#F2F2F2] bg-white px-4 py-3.5 text-left text-sm text-[#424242]">清空本地缓存图片</button>
          <button {...action('settings.data.reset', () => confirm({
            title: '重置清零习惯记录?', desc: '所有打卡记录与光芒值都会被清零,此操作不可恢复', danger: true,
            onConfirm: () => { st.resetAllLogs(); st.showToast('已重置'); },
          }))}
            className="w-full border-b border-[#F2F2F2] bg-white px-4 py-3.5 text-left text-sm text-[#DE4A3F]">重置清零习惯记录</button>
          <button {...action('settings.account.delete.wontfixToast', notice)}
            className="w-full bg-white px-4 py-3.5 text-left text-sm text-[#DE4A3F]">注销账户</button>
        </div>
      </div>
      {dialogs}
    </div>
  );
}

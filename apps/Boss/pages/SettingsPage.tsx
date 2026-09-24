import React, { useState } from 'react';
import { useBossGestures } from '../hooks/useBossGestures';
import { useBossStore } from '../state';
import { PageHeader } from '../components/common';
import { COLORS } from '../res/colors';
import { IcChevronRight } from '../res/icons';

/** 设置(❌ 无截图,按 BOSS 直聘标准设置外推)。开关真做写 store;边角 wontfix toast(铁律①)。 */
const SettingsPage: React.FC = () => {
  const { action } = useBossGestures();
  const store = useBossStore();
  const settings = useBossStore((s) => s.settings);
  const cacheSizeMb = useBossStore((s) => s.cacheSizeMb);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const Toggle: React.FC<{ on: boolean; actionId: string; onToggle: () => void; label: string; hint?: string }> = ({ on, actionId, onToggle, label, hint }) => (
    <div className="flex items-center justify-between px-4 py-3.5">
      <span>
        <span className="block text-[16px] text-gray-900">{label}</span>
        {hint && <span className="mt-0.5 block text-[12px] text-gray-400">{hint}</span>}
      </span>
      <button {...action(actionId, onToggle, { params: {} })} className="h-7 w-12 rounded-full p-0.5 transition-colors" style={{ backgroundColor: on ? COLORS.primaryBtn : '#E5E7EB' }} aria-label={label}>
        <span className={`block h-6 w-6 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  );

  const Row: React.FC<{ label: string; actionId: string; onTap: () => void; value?: string }> = ({ label, actionId, onTap, value }) => (
    <button {...action(actionId, onTap, { params: {} })} className="flex w-full items-center justify-between px-4 py-3.5 text-left">
      <span className="text-[16px] text-gray-900">{label}</span>
      <span className="flex items-center gap-1 text-[14px] text-gray-400">{value}<IcChevronRight size={17} className="text-gray-300" /></span>
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-[#F5F6F7]">
      <div className="bg-white"><PageHeader title="设置" /></div>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 账号 */}
        <div className="mt-3 bg-white">
          <Row label="账号与安全" actionId="settings.account.toast" onTap={() => store.showNotice('账号与安全设置暂未开放，请点击“我知道了”返回。')} />
        </div>

        {/* 通知 */}
        <div className="mt-3 bg-white">
          <div className="border-b border-gray-50">
            <Toggle on={settings.notifyMsg} actionId="settings.notifymsg.toggle" onToggle={() => store.toggleSetting('notifyMsg')} label="新消息通知" hint="Boss 回复时通知你" />
          </div>
          <div className="border-b border-gray-50">
            <Toggle on={settings.notifySys} actionId="settings.notifysys.toggle" onToggle={() => store.toggleSetting('notifySys')} label="系统通知" />
          </div>
          <Toggle on={settings.soundOn} actionId="settings.sound.toggle" onToggle={() => store.toggleSetting('soundOn')} label="声音与振动" />
        </div>

        {/* 隐私 */}
        <div className="mt-3 bg-white">
          <div className="border-b border-gray-50">
            <Toggle on={settings.resumeVisible} actionId="settings.resumevisible.toggle" onToggle={() => store.toggleSetting('resumeVisible')} label="简历对已沟通 Boss 可见" hint="关闭后仅你主动发送时对方可见" />
          </div>
          <Row label="隐私设置" actionId="settings.privacy.toast" onTap={() => store.showNotice('更多隐私设置暂未开放，请点击“我知道了”返回。')} />
        </div>

        {/* 通用 */}
        <div className="mt-3 bg-white">
          <div className="border-b border-gray-50">
            <Row label="多语言" actionId="settings.language.toast" onTap={() => store.showToast('跟随系统语言,请在系统设置切换')} value="跟随系统" />
          </div>
          <div className="border-b border-gray-50">
            <Row label="清除缓存" actionId="settings.clearcache.done" onTap={() => { store.clearCache(); store.showToast('已清除缓存'); }} value={cacheSizeMb > 0 ? `${cacheSizeMb.toFixed(1)} MB` : '0 B'} />
          </div>
          <Row label="关于 BOSS 直聘" actionId="settings.about.toast" onTap={() => store.showToast('BOSS直聘 复刻版 v1.0.0')} value="v1.0.0" />
        </div>

        {/* 退出 */}
        <button
          {...action('settings.logout.confirm', () => setLogoutOpen(true), { params: {} })}
          className="mt-3 w-full bg-white py-4 text-center text-[16px] font-medium text-[#EB5757]"
        >
          退出登录
        </button>
      </div>

      {/* 退出确认 */}
      {logoutOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full rounded-2xl bg-white p-5">
            <div className="text-center text-[16px] font-semibold text-gray-900">确认退出登录?</div>
            <div className="mt-4 flex gap-3">
              <button onClick={() => setLogoutOpen(false)} className="flex-1 rounded-full bg-[#F0F1F3] py-2.5 text-[15px] text-gray-700">取消</button>
              <button
                onClick={() => { setLogoutOpen(false); store.showNotice('当前模拟环境不执行账号退出，请点击“我知道了”返回。'); }}
                className="flex-1 rounded-full py-2.5 text-[15px] font-medium text-white"
                style={{ backgroundColor: '#EB5757' }}
              >
                退出
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

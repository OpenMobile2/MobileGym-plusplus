import React from 'react';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { avatarUrl } from '../assets';

export default function ProfilePage() {
  const { bindTap, action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const user = useFanqieTodoStore((s) => s.user);
  const stats = useFanqieTodoStore((s) => s.stats);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const toast = () => showToast(t('toast.unavailable'));
  const avatar = avatarUrl('user');

  const Row = ({ id, label }: { id: string; label: string }) => (
    <button {...action(id, toast)} className="flex w-full items-center justify-between border-b border-[#F0F0F0] bg-white px-4 py-3.5 text-left text-sm text-[#333]">
      <span>{label}</span><span className="text-[#C8CDD4]">›</span>
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-[#F4F6F8]" data-status-bar-foreground="light">
      {/* 用户卡(深蓝星空) */}
      <button {...bindTap('profile.account.open')} className="block w-full bg-gradient-to-b from-[#1E2A5A] to-[#2B3A72] px-4 pb-5 pt-10 text-left">
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-full bg-white/20" style={avatar ? { background: `center/cover url(${avatar})` } : undefined} />
          <div>
            <div className="text-lg font-bold text-white">{user.name}</div>
            <div className="text-sm text-white/80">{user.signature}</div>
          </div>
        </div>
        <div className="mt-3 flex gap-2 text-xs">
          <span className="rounded-full bg-white/15 px-2 py-1 text-orange-200">共专注{stats.totalDays}天</span>
          <span className="rounded-full bg-white/15 px-2 py-1 text-orange-200">连续专注{stats.streakDays}天</span>
        </div>
      </button>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 双入口 */}
        <div className="flex gap-3 p-3">
          <button {...bindTap('profile.future.open')} className="flex-1 rounded-2xl bg-white py-4 text-center text-sm font-medium text-[#333] shadow-sm">未来倒计时</button>
          <button {...action('profile.studyroom.wontfixToast', toast)} className="flex-1 rounded-2xl bg-white py-4 text-center text-sm font-medium text-[#333] shadow-sm">自习室|许愿墙</button>
        </div>

        <div className="mx-3 overflow-hidden rounded-2xl">
          <Row id="profile.vip.wontfixToast" label="VIP 季度卡" />
          <Row id="profile.backup.wontfixToast" label="备份 | 恢复 | 云同步" />
        </div>

        <div className="mx-3 mt-3 overflow-hidden rounded-2xl">
          <button {...bindTap('profile.settings.open')} className="flex w-full items-center justify-between border-b border-[#F0F0F0] bg-white px-4 py-3.5 text-left text-sm text-[#333]">
            <span>{t('profile.settings')}</span><span className="text-[#C8CDD4]">›</span>
          </button>
          <Row id="profile.appearance.wontfixToast" label="海报背景和外观" />
          <Row id="profile.customtabs.wontfixToast" label="自定义底栏模块" />
          <Row id="profile.themecolor.wontfixToast" label="主题颜色搭配" />
          <Row id="profile.widget.wontfixToast" label="桌面小组件选项" />
          <Row id="profile.pc.wontfixToast" label="连接电脑端专注助手" />
        </div>
        <div className="h-4" />
      </div>
    </div>
  );
}

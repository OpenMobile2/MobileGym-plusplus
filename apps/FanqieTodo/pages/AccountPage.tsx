import React from 'react';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { Switch } from '../components/Switch';
import { IcBack, IcCheck } from '../res/icons';

export default function AccountPage() {
  const { bindBack, action } = useFanqieTodoGestures();
  const { locale } = useI18n();
  const user = useFanqieTodoStore((s) => s.user);
  const focusVisible = useFanqieTodoStore((s) => s.settings.focusVisible);
  const wakeVisible = useFanqieTodoStore((s) => s.settings.wakeVisible);
  const s = useFanqieTodoStore();
  const toast = () => s.showToast('该功能暂未开放');

  const [editing, setEditing] = React.useState<'name' | 'signature' | null>(null);
  const [draft, setDraft] = React.useState('');
  const startEdit = (field: 'name' | 'signature') => { setEditing(field); setDraft(field === 'name' ? user.name : user.signature); };
  const saveEdit = () => {
    if (editing === 'name') s.setUser({ name: draft.trim() || user.name });
    else if (editing === 'signature') s.setUser({ signature: draft.trim() });
    setEditing(null);
  };

  return (
    <div className="flex h-full flex-col bg-[#F4F6F8]" data-status-bar-foreground="light">
      {/* 头图 */}
      <div className="bg-gradient-to-b from-[#3E7CB1] to-[#4A90D9] px-4 pb-6 pt-10">
        <button {...bindBack()} aria-label="返回" className="mb-2 text-white"><IcBack size={24} /></button>
        <div className="flex items-center gap-3">
          <div className="h-16 w-16 rounded-full bg-white/25" />
          <div className="min-w-0 text-white">
            <div className="truncate text-xs opacity-80">账号:{user.account}</div>
            <div className="text-lg font-bold">昵称:{user.name}</div>
            <div className="text-sm opacity-90">{user.signature}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
        <button {...action('profile.account.wechat.wontfixToast', toast)} className="block w-full border-b border-[#F0F0F0] px-4 py-4 text-left text-sm">已绑定微信</button>

        {editing === 'name' ? (
          <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-4 py-3">
            <input {...action('profile.account.nickname.input', () => {}, { params: { value: draft } })}
              autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder={locale === 'en' ? 'Enter nickname' : '输入昵称'}
              className="flex-1 border-b border-[#DCEBFB] pb-1 text-sm outline-none" />
            <button onClick={saveEdit} aria-label="保存" className="text-[#4A90D9]"><IcCheck size={20} /></button>
          </div>
        ) : (
          <button {...action('profile.account.nickname.input', () => startEdit('name'))} className="flex w-full items-center justify-between border-b border-[#F0F0F0] px-4 py-4 text-left text-sm">修改昵称<span className="text-[#8A8F99]">{user.name}</span></button>
        )}

        {editing === 'signature' ? (
          <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-4 py-3">
            <input {...action('profile.account.signature.input', () => {}, { params: { value: draft } })}
              autoFocus value={draft} onChange={(e) => setDraft(e.target.value)}
              placeholder={locale === 'en' ? 'Enter signature' : '输入个性签名'}
              className="flex-1 border-b border-[#DCEBFB] pb-1 text-sm outline-none" />
            <button onClick={saveEdit} aria-label="保存" className="text-[#4A90D9]"><IcCheck size={20} /></button>
          </div>
        ) : (
          <button {...action('profile.account.signature.input', () => startEdit('signature'))} className="flex w-full items-center justify-between border-b border-[#F0F0F0] px-4 py-4 text-left text-sm">修改个性签名<span className="max-w-[55%] truncate text-[#8A8F99]">{user.signature}</span></button>
        )}

        <label {...action('profile.account.focusVisible.toggle', () => s.toggleSetting('focusVisible'))} className="flex w-full items-center justify-between border-b border-[#F0F0F0] px-4 py-4 text-sm">专注内容对自习室成员可见<Switch on={focusVisible} /></label>
        <label {...action('profile.account.wakeVisible.toggle', () => s.toggleSetting('wakeVisible'))} className="flex w-full items-center justify-between border-b border-[#F0F0F0] px-4 py-4 text-sm">起床打卡对自习室成员可见<Switch on={wakeVisible} /></label>
        <button {...action('profile.account.logout.wontfixToast', toast)} className="block w-full px-4 py-4 text-left text-sm">退出登录</button>
      </div>
    </div>
  );
}

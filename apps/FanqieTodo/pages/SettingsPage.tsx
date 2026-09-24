import React from 'react';
import { useLocation } from 'react-router-dom';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { Switch } from '../components/Switch';
import { IcBack, IcCheck } from '../res/icons';

export default function SettingsPage() {
  const { search } = useLocation();
  void search;
  const { bindBack, action } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const settings = useFanqieTodoStore((x) => x.settings);
  const toast = () => s.showToast('该功能暂未开放');
  const [tab, setTab] = React.useState<'pomodoro' | 'lock'>('pomodoro');
  const [editRest, setEditRest] = React.useState(false);
  const [restInput, setRestInput] = React.useState('');
  const saveRest = () => {
    const n = parseInt(restInput, 10);
    if (Number.isFinite(n) && n >= 0) s.setSetting('restDurationMin', n);
    setEditRest(false);
  };

  const Toggle = Switch;
  const Item = ({ children }: { children: React.ReactNode }) => (
    <div className="border-b border-[#F0F0F0] px-4 py-3.5 text-sm">{children}</div>
  );

  return (
    <div className="flex h-full flex-col bg-[#F4F6F8]" data-status-bar-foreground="dark">
      <div className="flex items-center gap-2 bg-[#EAF2FB] px-4 pb-2 pt-10">
        <button {...bindBack()} aria-label="返回"><IcBack size={22} /></button>
        <span className="text-base font-semibold text-[#333]">专注计时设置</span>
      </div>

      <div className="flex-1 overflow-y-auto bg-white" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="px-4 py-2 text-sm font-bold text-[#4A90D9]">基础设置</div>
        <Item><button {...action('settings.focus.ringtone.action', toast)} className="w-full text-left">🔔 铃声震动设置</button></Item>
        <Item><button {...action('settings.focus.music.wontfixToast', toast)} className="w-full text-left">🎵 默认背景音乐 | 白噪音</button></Item>
        {editRest ? (
          <div className="flex items-center gap-2 border-b border-[#F0F0F0] px-4 py-3 text-sm">
            <span className="shrink-0">默认休息时长</span>
            <input type="number" inputMode="numeric" autoFocus value={restInput}
              onChange={(e) => setRestInput(e.target.value)}
              placeholder="分钟(0=不休息)"
              className="flex-1 border-b border-[#DCEBFB] pb-1 text-right outline-none" />
            <span className="shrink-0 text-[#8A8F99]">分钟</span>
            <button onClick={saveRest} aria-label="保存" className="text-[#4A90D9]"><IcCheck size={20} /></button>
          </div>
        ) : (
          <Item><button {...action('settings.focus.restDuration.action', () => { setEditRest(true); setRestInput(String(settings.restDurationMin)); })} className="flex w-full justify-between text-left">默认休息时长<span className="text-[#4A90D9]">{settings.restDurationMin === 0 ? '不休息' : settings.restDurationMin + '分钟'}</span></button></Item>
        )}
        <Item><button {...action('settings.focus.motto.input', toast)} className="w-full text-left">💬 自定义番茄格言</button></Item>

        <div className="px-4 pb-2 pt-4 text-sm font-bold text-[#4A90D9]">高级设置</div>
        <div className="mb-2 flex gap-2 px-4">
          <button {...action('settings.focus.tab.select.pomodoro', () => setTab('pomodoro'))} className={`rounded-lg px-3 py-1 text-sm ${tab === 'pomodoro' ? 'bg-[#DCEBFB] text-[#4A90D9]' : 'bg-[#F1F3F5] text-[#666]'}`}>番茄钟设置</button>
          <button {...action('settings.focus.tab.select.lock', () => setTab('lock'))} className={`rounded-lg px-3 py-1 text-sm ${tab === 'lock' ? 'bg-[#DCEBFB] text-[#4A90D9]' : 'bg-[#F1F3F5] text-[#666]'}`}>锁机设置</button>
        </div>

        <label {...action('settings.focus.midnight.toggle', () => s.toggleSetting('midnightMode'))} className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3.5 text-sm">🌙 午夜模式<Toggle on={settings.midnightMode} /></label>
        <label {...action('settings.focus.noStrike.toggle', () => s.toggleSetting('noStrikethrough'))} className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3.5 text-sm">不在待办名称上划完成线<Toggle on={settings.noStrikethrough} /></label>
        <label {...action('settings.focus.fixedOrder.toggle', () => s.toggleSetting('fixedOrder'))} className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3.5 text-sm">📌 固定排序<Toggle on={settings.fixedOrder} /></label>
        <label {...action('settings.focus.pullSearch.toggle', () => s.toggleSetting('pullSearch'))} className="flex items-center justify-between border-b border-[#F0F0F0] px-4 py-3.5 text-sm">🔍 待办较多时可下拉搜索<Toggle on={settings.pullSearch} /></label>
        <div className="h-6" />
      </div>
    </div>
  );
}

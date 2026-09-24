import React, { useState } from 'react';
import { useKapiStore } from '../state';
import { useKapiGestures } from '../hooks/useKapiGestures';
import { TopBar, Card, Row, Switch } from '../components/ui';
import { toast } from '../components/toast';

const FLAGS: Array<{ key: 'autoScreenshot' | 'location' | 'coupon' | 'push'; label: string }> = [
  { key: 'autoScreenshot', label: '自动记账截图识别' },
  { key: 'location', label: '账单地点展示' },
  { key: 'coupon', label: '优惠推荐' },
  { key: 'push', label: '推送服务' },
];

const PUSH_ITEMS: Array<{ key: string; label: string }> = [
  { key: 'budgetAlert', label: '预算超支提醒' },
  { key: 'billRemind', label: '记账提醒' },
  { key: 'weeklyReport', label: '每周账单报告' },
];

export default function SettingsPage() {
  const { bindBack, bindAction, back } = useKapiGestures();
  const settings = useKapiStore((s) => s.settings);
  const toggleSettingFlag = useKapiStore((s) => s.toggleSettingFlag);
  const togglePushItem = useKapiStore((s) => s.togglePushItem);
  const purgeAllBills = useKapiStore((s) => s.purgeAllBills);
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <TopBar title="设置" backBind={bindBack()} />
      <div className="flex-1 overflow-y-auto px-3 pb-6" data-scroll-container="settings" data-scroll-direction="vertical">
        <Card className="mt-2">
          <Row label="月统计起始日" value={`每月 ${settings.monthStartDay} 日`} bind={bindAction('settings.entry.noop', () => toast('该功能暂未开放'))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="胖咔回复风格" value={settings.catReplyStyle} bind={bindAction('settings.entry.noop', () => toast('该功能暂未开放'))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="货币单位" value={settings.currency} bind={bindAction('settings.entry.noop', () => toast('该功能暂未开放'))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="应用图标" value="默认" bind={bindAction('settings.entry.noop', () => toast('该功能暂未开放'))} />
        </Card>

        <Card className="mt-3">
          {FLAGS.map((f, i) => (
            <div key={f.key}>
              {i > 0 && <div className="h-px bg-[#EDEFF4] mx-4" />}
              <Row label={f.label} chevron={false} value={<Switch on={settings.flags[f.key]} bind={bindAction('settings.flag.toggle.option', () => toggleSettingFlag(f.key), { value: f.key })} />} />
            </div>
          ))}
        </Card>

        <div className="text-[13px] text-[#8A92A6] mt-4 mb-1 px-1">推送子项</div>
        <Card>
          {PUSH_ITEMS.map((p, i) => (
            <div key={p.key}>
              {i > 0 && <div className="h-px bg-[#EDEFF4] mx-4" />}
              <Row label={p.label} chevron={false} value={<Switch on={!!settings.pushItems[p.key]} bind={bindAction('settings.pushItem.toggle.option', () => togglePushItem(p.key), { value: p.key })} />} />
            </div>
          ))}
        </Card>

        <Card className="mt-3">
          <Row label="帮助与反馈" bind={bindAction('settings.help.noop', () => toast('该功能暂未开放'))} />
          <div className="h-px bg-[#EDEFF4] mx-4" />
          <Row label="关于卡皮记账" bind={bindAction('settings.help.noop', () => toast('该功能暂未开放'))} />
        </Card>

        <button
          {...bindAction('settings.purge.confirm.delete', () => setConfirming(true))}
          className="w-full mt-4 py-3 rounded-xl bg-white text-[#F0524B] text-[15px] border-none cursor-pointer"
        >
          删除所有历史账单数据
        </button>
      </div>

      {confirming && (
        <div className="absolute inset-0 z-[130] flex items-center justify-center bg-black/40" onClick={() => setConfirming(false)}>
          <div className="bg-white rounded-2xl w-64 p-5 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="text-[16px] text-[#1A1D26] mb-1">删除所有账单?</div>
            <div className="text-[13px] text-[#8A92A6] mb-4">此操作不可恢复</div>
            <div className="flex gap-3">
              <button onClick={() => setConfirming(false)} className="flex-1 py-2 rounded-xl bg-[#F0F2F8] text-[#5A6172] border-none cursor-pointer">取消</button>
              <button onClick={() => { purgeAllBills(); setConfirming(false); toast('已清空'); back(); }} className="flex-1 py-2 rounded-xl bg-[#F0524B] text-white border-none cursor-pointer">删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

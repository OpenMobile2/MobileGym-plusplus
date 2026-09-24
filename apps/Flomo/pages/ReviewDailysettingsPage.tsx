import React from 'react';
import { useFlomoStore } from '../state';
import { useFlomoGestures } from '../hooks/useFlomoGestures';
import { C } from '../components/ui';
import { IcClose, IcArrowRight } from '../res/icons';

function SetRow({ label, value, bind }: { label: string; value?: string; bind: object }) {
  return (
    <button
      {...bind}
      className="w-full flex items-center px-4 bg-transparent border-none cursor-pointer"
      style={{ color: C.text, fontSize: 15, height: 52 }}
    >
      <span className="flex-1 text-left">{label}</span>
      {value && <span style={{ color: C.sub, fontSize: 14 }}>{value}</span>}
      <IcArrowRight size={16} style={{ color: C.sub, marginLeft: 6 }} />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="px-4 pb-1.5 text-xs" style={{ color: C.sub }}>{title}</div>
      <div className="mx-3 rounded-2xl overflow-hidden" style={{ background: C.surface }}>{children}</div>
    </div>
  );
}

export default function ReviewDailysettingsPage() {
  const { bindTap, bindBack } = useFlomoGestures();
  const settings = useFlomoStore((s) => s.settings);
  const setSetting = useFlomoStore((s) => s.setSetting);
  const toast = useFlomoStore((s) => s.toast);

  const act = (id: string, fn: () => void) =>
    bindTap({ kind: 'action', id }, { onTrigger: fn });
  const divider = <div className="h-px mx-4" style={{ background: '#F0F0F0' }} />;

  return (
    <div className="flex flex-col h-full" style={{ background: C.bg }} data-status-bar-foreground="dark">
      <div className="flex items-center h-12 px-3 shrink-0">
        <button {...bindBack()} className="w-9 h-9 rounded-full flex items-center justify-center bg-black/5 border-none cursor-pointer" style={{ color: C.text }} aria-label="关闭">
          <IcClose size={18} />
        </button>
        <div className="flex-1 text-center font-semibold text-base" style={{ color: C.text }}>每日回顾设置</div>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto pt-2 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {/* PRO 卡 */}
        <div className="mx-3 mb-5 rounded-2xl px-4 py-3.5" style={{ background: C.surface }}>
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: C.text }}>每日回顾</span>
            <span className="px-1.5 rounded text-white text-[10px]" style={{ background: '#2A2A2A' }}>PRO</span>
          </div>
          <div className="mt-1 text-sm" style={{ color: C.sub }}>
            每日最多 24 条回顾,<span style={{ color: C.linkBlue }}>点此查看使用教程</span>
          </div>
        </div>

        {/* 回顾范围 */}
        <Section title="回顾范围">
          <SetRow label="回顾条件" value="全部内容" bind={act('review.dailySettings.condition.select', () => toast('该功能暂未开放'))} />
          {divider}
          <SetRow label="时间范围" value="所有时间" bind={act('review.dailySettings.timerange.select', () => toast('该功能暂未开放'))} />
          {divider}
          <SetRow
            label="回顾条数"
            value={`${settings.dailyReviewCount} 条/天`}
            bind={act('review.dailySettings.count.select', () => {
              const opts = [5, 8, 12, 24];
              const next = opts[(opts.indexOf(settings.dailyReviewCount) + 1) % opts.length];
              setSetting('dailyReviewCount', next);
              toast(`回顾条数:${next} 条/天`);
            })}
          />
        </Section>

        {/* 每日更新提醒 */}
        <Section title="每日更新提醒">
          <SetRow
            label="App 通知提醒"
            value={settings.dailyNotify ? '已开启' : '不提醒'}
            bind={bindTap('review.notifyPush.open')}
          />
          {divider}
          <SetRow label="微信提醒" value="不提醒" bind={act('review.dailySettings.wxnotify.toggle', () => toast('该功能暂未开放'))} />
        </Section>

        {/* 小组件 */}
        <Section title="小组件">
          <SetRow label="添加小组件" bind={act('review.dailySettings.widget.add', () => toast('该功能暂未开放'))} />
          {divider}
          <SetRow label="自定义小组件" bind={act('review.dailySettings.widget.custom', () => toast('该功能暂未开放'))} />
        </Section>
      </div>
    </div>
  );
}

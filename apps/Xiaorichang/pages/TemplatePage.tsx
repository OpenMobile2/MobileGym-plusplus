import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { IconRenderer } from '../res/icons';
import { PageHeader } from '../components/common';

/** 挑选习惯模板库(s217 顶栏+菜单入口)。整节点低证据,模板按常见习惯外推。 */
const TEMPLATES = [
  { id: 'tpl_water', name: '喝八杯水', icon: 'IcDroplet', color: '#6BAED6' },
  { id: 'tpl_read', name: '阅读', icon: 'IcBookOpen', color: '#9B8FD1' },
  { id: 'tpl_run', name: '跑步', icon: 'IcRun', color: '#7FB685' },
  { id: 'tpl_sleep', name: '早睡', icon: 'IcMoon', color: '#7C9EDB' },
  { id: 'tpl_stretch', name: '拉伸 10 分钟', icon: 'IcWind', color: '#6FB1A0' },
  { id: 'tpl_diary', name: '写日记', icon: 'IcPen', color: '#DE8FA6' },
  { id: 'tpl_meditate', name: '冥想', icon: 'IcBrain', color: '#C08FC8' },
  { id: 'tpl_coffee', name: '少喝咖啡', icon: 'IcCoffee', color: '#B2967D' },
];

export default function TemplatePage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.habitTemplates} />
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {TEMPLATES.map((t) => (
          <button key={t.id}
            {...action('habit.template.pick', () => {
              st.addHabit({ name: t.name, icon: t.icon, color: t.color });
              st.showToast(`已添加「${t.name}」`);
              back();
            }, { params: { templateId: t.id } })}
            className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-white shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ background: t.color, color: '#fff' }}>
              <IconRenderer name={t.icon} size={22} />
            </span>
            <span className="text-sm text-[#424242]">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

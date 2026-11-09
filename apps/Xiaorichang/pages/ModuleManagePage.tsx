import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcEye, IcEyeOff } from '../res/icons';
import { PageHeader } from '../components/common';

const MODULE_NAMES: Record<string, string> = {
  stats: '统计', habits: '打卡管理', todos: '小事', notes: '碎念笔记', focus: '专注空间',
  timeline: '时间线', contexts: '习惯情境', archived: '归档习惯', personalize: '个性化',
  widget: '小组件', export: '数据导出', lab: '实验室', modules: '模块设置', aiplanner: 'AI 规划师',
};

/** 功能块管理(s185)。显隐 + 上移/下移(裁定1:重排不做拖拽)。 */
export default function ModuleManagePage() {
  const st = useXiaorichangStore();
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const [sortMode, setSortMode] = useState(false);
  const modules = [...st.settings.modules].sort((a, b) => a.order - b.order);

  const toggle = (id: string) =>
    st.updateSettings({ modules: st.settings.modules.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)) });

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.moduleManage}
        right={<button {...action('module.sort.mode', () => setSortMode((v) => !v))}
          className="rounded-full px-4 py-1.5 text-sm shadow-sm"
          style={sortMode ? { background: colors.brand, color: '#5B4718', fontWeight: 700 } : { background: '#fff', color: '#424242' }}>
          排序
        </button>} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {modules.map((m) => (
          <div key={m.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
            <span className="flex-1 text-sm" style={{ color: m.enabled ? '#424242' : '#B9BEC7' }}>
              {MODULE_NAMES[m.id] ?? m.id}
            </span>
            {sortMode ? (
              <>
                <button {...action('module.row.moveUp', () => st.moveModule(m.id, -1), { params: { moduleId: m.id } })}
                  className="px-2 text-[#9AA5B1]">↑ {s.moveUp}</button>
                <button {...action('module.row.moveDown', () => st.moveModule(m.id, 1), { params: { moduleId: m.id } })}
                  className="px-2 text-[#9AA5B1]">↓ {s.moveDown}</button>
              </>
            ) : (
              <button {...action('module.visibility.toggle', () => toggle(m.id), { params: { moduleId: m.id } })}
                aria-label="显隐" className="p-1" style={{ color: m.enabled ? colors.vip : '#C9CDD3' }}>
                {m.enabled ? <IcEye size={18} /> : <IcEyeOff size={18} />}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

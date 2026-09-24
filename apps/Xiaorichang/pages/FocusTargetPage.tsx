import React, { useState } from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { IconRenderer } from '../res/icons';
import { PageHeader, Segmented } from '../components/common';

/** 选择专注项目(s171)。选中后带 targetId 回番茄主页。 */
export default function FocusTargetPage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const [tab, setTab] = useState<'habits' | 'todos'>('habits');
  const [keyword, setKeyword] = useState('');

  const items = tab === 'habits'
    ? st.habits.filter((h) => !h.archived && (!keyword || h.name.includes(keyword)))
      .map((h) => ({ id: h.id, name: h.name, icon: h.icon, color: h.color }))
    : st.todos.filter((t) => !t.done && (!keyword || t.title.includes(keyword)))
      .map((t) => ({ id: t.id, name: t.title, icon: 'IcCheck', color: '#9AA5B1' }));

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.focusTarget} />
      <div className="px-4">
        <Segmented value={tab} options={[
          { key: 'habits', label: '习惯', bind: action('focus.target.tab.select.habits', () => setTab('habits')) },
          { key: 'todos', label: '小事', bind: action('focus.target.tab.select.todos', () => setTab('todos')) },
        ]} />
        <input
          {...action('focus.target.search.input', () => {}, { params: { value: keyword } })}
          value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="搜索"
          className="mt-2 w-full rounded-xl bg-[#F5F6F7] px-3 py-2 text-sm outline-none" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8 pt-2" data-scroll-container="main" data-scroll-direction="vertical">
        {items.map((it) => (
          <button key={it.id}
            {...action('focus.target.pick', () => { st.setDraft({ focusTargetId: it.id }); back(); }, { params: { targetId: it.id } })}
            className="flex w-full items-center gap-3 border-b border-[#F5F5F5] py-3 text-left">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: it.color, color: '#fff' }}>
              <IconRenderer name={it.icon} size={18} />
            </span>
            <span className="text-sm text-[#424242]">{it.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

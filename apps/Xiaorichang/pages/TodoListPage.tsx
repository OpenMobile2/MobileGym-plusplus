import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { IcPlus, IcMoreH } from '../res/icons';
import { PageHeader } from '../components/common';
import { toDateKey, todayKey } from '../utils/appTime';

/** 我的小事(s204/s205/s234)。Q11:完成不给光芒值。 */
export default function TodoListPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const [tab, setTab] = useState<'undone' | 'done'>('undone');
  const [keyword, setKeyword] = useState('');

  const sortKey = st.settings.todoSort;
  const shown = st.todos
    .filter((t) => (tab === 'done' ? t.done : !t.done))
    .filter((t) => !keyword || t.title.includes(keyword))
    .sort((a, b) => sortKey === 'dueAt'
      ? (a.dueAt ?? Infinity) - (b.dueAt ?? Infinity)
      : sortKey === 'manual' ? a.order - b.order
        : (a.createdAt ?? 0) - (b.createdAt ?? 0));

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.todosTitle} right={
        <>
          <button {...bindTap('todo.list.menu.open')} aria-label="菜单"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F7]"><IcMoreH size={17} /></button>
          <button {...bindTap('todo.list.create')} aria-label="新建"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F7]"><IcPlus size={18} /></button>
        </>
      } />

      <div className="flex items-center gap-3 px-4 pb-2">
        <input
          {...action('todo.list.search.input', () => {}, { params: { value: keyword } })}
          value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={s.todoSearchPlaceholder}
          className="min-w-0 flex-1 rounded-xl border border-dashed border-[#DDD] px-3 py-2 text-sm outline-none" />
        <div className="flex rounded-full bg-[#F2F3F5] p-0.5 text-[13px]">
          <button {...action('todo.list.tab.select.undone', () => setTab('undone'))}
            className="rounded-full px-3 py-1.5"
            style={tab === 'undone' ? { background: '#fff', fontWeight: 600 } : { color: '#9AA5B1' }}>{s.todoUndone}</button>
          <button {...action('todo.list.tab.select.done', () => setTab('done'))}
            className="rounded-full px-3 py-1.5"
            style={tab === 'done' ? { background: '#fff', fontWeight: 600 } : { color: '#9AA5B1' }}>{s.todoDone}</button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {shown.length === 0 ? (
          <div className="flex flex-col items-center pt-24 text-center">
            <div className="text-4xl text-[#E3E5E8]">🗃</div>
            <div className="mt-3 text-sm text-[#9AA5B1]">{s.todoEmpty}</div>
            <div className="mt-1 text-xs text-[#C9CDD3]">{s.todoEmptyHint}</div>
          </div>
        ) : (
          shown.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-[#F5F5F5] py-3">
              <button
                {...action('todo.list.item.toggle', () => st.toggleTodo(t.id), { params: { todoId: t.id } })}
                className="flex h-6 w-6 items-center justify-center rounded-md border-2 text-sm"
                style={t.done ? { background: '#C9CDD3', borderColor: '#C9CDD3', color: '#fff' } : { borderColor: '#C9CDD3', borderStyle: 'dashed' }}>
                {t.done ? '✓' : ''}
              </button>
              <span className="flex-1 text-sm" style={{ color: t.done ? '#B9BEC7' : '#424242' }}>{t.title}</span>
              <span className="text-xs text-[#C9CDD3]">
                {t.done
                  ? (t.doneAt && toDateKey(TimeService.fromTimestamp(t.doneAt)) === todayKey() ? s.todoDoneToday : '')
                  : (t.dueAt && toDateKey(TimeService.fromTimestamp(t.dueAt)) === todayKey() ? '今日' : '')}
              </span>
              <button {...bindTap('todo.list.item.menu.open', { params: { todoId: t.id } })}
                className="p-1 text-[#C9CDD3]"><IcMoreH size={16} /></button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

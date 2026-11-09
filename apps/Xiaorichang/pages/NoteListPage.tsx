import React, { useState } from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { IcPlus, IcMoreH, IcMoreV } from '../res/icons';
import { PageHeader } from '../components/common';
import { toDateKey } from '../utils/appTime';

/** 碎念笔记列表(s208)。按日期分组。 */
export default function NoteListPage() {
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const [keyword, setKeyword] = useState('');

  const notes = st.notes.filter((n) => !keyword || n.body.includes(keyword) || n.title?.includes(keyword));
  const groups = notes.reduce<Record<string, typeof notes>>((acc, n) => {
    const k = toDateKey(TimeService.fromTimestamp(n.createdAt));
    (acc[k] = acc[k] ?? []).push(n);
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.notesTitle} right={
        <>
          <button {...bindTap('note.list.menu.open')} aria-label="菜单"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcMoreH size={17} /></button>
          <button {...bindTap('note.list.create')} aria-label="新建"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"><IcPlus size={18} /></button>
        </>
      } />

      <div className="px-4 pb-2">
        <input
          {...action('note.list.search.input', () => {}, { params: { value: keyword } })}
          value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder={s.noteSearchPlaceholder}
          className="w-full rounded-xl border border-dashed border-[#DDD] bg-white px-3 py-2 text-sm outline-none" />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0])).map(([date, list]) => (
          <div key={date}>
            <div className="py-2 text-xs font-semibold text-[#9AA5B1]">{date}</div>
            {list.map((n) => (
              <div key={n.id} className="relative mb-2 rounded-2xl bg-white p-3 shadow-sm">
                <button {...bindTap('note.list.open', { params: { noteId: n.id } })} className="block w-full text-left">
                  <div className="flex items-center gap-2 text-xs text-[#9AA5B1]">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: n.color }} />
                    {TimeService.formatDateTimeForLocale(TimeService.fromTimestamp(n.createdAt), { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  {n.title && <div className="mt-1 text-sm font-semibold text-[#E69F4B]">{n.title}</div>}
                  <div className="mt-1 line-clamp-3 whitespace-pre-wrap text-sm text-[#424242]">{n.body}</div>
                </button>
                <button {...bindTap('note.list.card.menu.open', { params: { noteId: n.id } })}
                  className="absolute right-2 top-2 p-1 text-[#C9CDD3]"><IcMoreV size={16} /></button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

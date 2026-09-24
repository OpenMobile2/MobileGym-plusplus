import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useDialogs } from '../hooks/useDialogs';
import { colors } from '../res/colors';
import { IcTrash } from '../res/icons';
import { MissingContent, PageHeader } from '../components/common';

/** 碎念笔记编辑(s153)。新建与编辑共用(noteId 有值 = 编辑)。 */
export default function NoteEditorPage() {
  const [sp] = useSearchParams();
  const noteId = sp.get('noteId');
  const st = useXiaorichangStore();
  const editing = st.notes.find((n) => n.id === noteId);
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { dialogs, confirm } = useDialogs();
  const [title, setTitle] = useState(editing?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? '');
  const [createdAt, setCreatedAt] = useState(editing?.createdAt ?? TimeService.now());

  const d = TimeService.fromTimestamp(createdAt);
  const dateValue = `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}-${`${d.getDate()}`.padStart(2, '0')}`;
  const timeValue = `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
  const updateDate = (value: string) => {
    const [year, month, day] = value.split('-').map(Number);
    if (!year || !month || !day) return;
    setCreatedAt(TimeService.fromLocalParts(year, month - 1, day, d.getHours(), d.getMinutes()).getTime());
  };
  const updateTime = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number);
    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;
    setCreatedAt(TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate(), hours, minutes).getTime());
  };

  const commit = () => {
    if (editing) st.updateNote(editing.id, { title: title || undefined, body, createdAt });
    else if (body.trim()) st.addNote(body, title || undefined, createdAt);
    back();
  };

  if (noteId && !editing) return <MissingContent />;

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.notesTitle}
        right={<button {...action('note.editor.commit', commit)}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          完成
        </button>} />

      <div className="min-h-0 flex-1 overflow-y-auto px-4" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="flex items-center gap-2">
          <input
            {...action('note.editor.title.input', () => {}, { params: { value: title } })}
            value={title} onChange={(e) => setTitle(e.target.value)} placeholder="标题(可选)"
            className="flex-1 bg-transparent text-base font-semibold outline-none" />
          <button {...action('note.editor.aititle.wontfixToast', () => st.showNotice(s.notAvailable))}
            className="rounded-full bg-[#F2F3F5] px-3 py-1 text-xs text-[#B9BEC7]">AI 标题</button>
        </div>

        <div className="mt-2 flex gap-2 text-xs text-[#9AA5B1]">
          <input type="date" value={dateValue}
            {...action('note.editor.date.pick', () => {})}
            onChange={(e) => updateDate(e.target.value)}
            className="rounded-full bg-[#F5F6F7] px-3 py-1" />
          <input type="time" value={timeValue}
            {...action('note.editor.time.pick', () => {})}
            onChange={(e) => updateTime(e.target.value)}
            className="rounded-full bg-[#F5F6F7] px-3 py-1" />
        </div>

        <textarea
          {...action('note.editor.body.input', () => {}, { params: { value: body } })}
          value={body} onChange={(e) => setBody(e.target.value)} placeholder={s.noteWriteSomething}
          className="mt-3 h-64 w-full resize-none bg-transparent text-sm leading-relaxed outline-none" />
      </div>

      <div className="flex shrink-0 items-center gap-4 px-5 pb-8 text-[#9AA5B1]" data-keep-keyboard="true">
        <button {...action('note.editor.list.toggle', () => setBody((b) => `${b}${b.endsWith('\n') || !b ? '' : '\n'}• `))}
          aria-label="列表">≡</button>
        {editing && (
          <button {...action('note.editor.delete', () => confirm({
            title: `${s.noteDelete}?`, danger: true,
            onConfirm: () => { st.deleteNote(editing.id); back(); },
          }))} aria-label="删除"><IcTrash size={17} /></button>
        )}
      </div>
      {dialogs}
    </div>
  );
}

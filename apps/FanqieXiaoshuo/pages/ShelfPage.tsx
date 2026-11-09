import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFanqieStore } from '../state';
import { useFanqieGestures } from '../hooks/useFanqieGestures';
import { useFanqieStrings, useToast, useNotOpenToast, BookCover, ConfirmDialog } from '../components/ui';
import { IcSearch, IcMore } from '../res/icons';
import type { FanqieBook } from '../types';

/** 结构常量只放 id,文案走 strings(i18n 合同) */
const SHELF_TABS = [
  { id: 'shelf', key: 'shelfTabShelf' },
  { id: 'history', key: 'shelfTabHistory' },
  { id: 'collect', key: 'shelfTabCollect' },
  { id: 'circle', key: 'shelfTabCircle' },
] as const;

const FILTERS = [
  { v: 'all', key: 'all' },
  { v: 'reading', key: 'reading' },
] as const;

const EDIT_ACTIONS = ['findSimilar', 'moveToGroup', 'addToBooklist', 'addToDesktop'] as const;

export default function ShelfPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { bindTap, bindLongPress } = useFanqieGestures();
  const s = useFanqieStrings();
  const [toastNode, showToast] = useToast();
  const [notOpenNode, showNotOpen] = useNotOpenToast();

  const books = useFanqieStore((st) => st.books);
  const shelf = useFanqieStore((st) => st.shelf);
  const todayReadMinutes = useFanqieStore((st) => st.todayReadMinutes);
  const removeFromShelf = useFanqieStore((st) => st.removeFromShelf);
  const recordTaskAudit = useFanqieStore((st) => st.recordTaskAudit);

  const editing = searchParams.get('edit') === '1';
  const deleteOpen = searchParams.get('dialog') === 'delete';
  const filter = searchParams.get('filter') || 'all';
  const [selected, setSelected] = useState<string[]>([]);

  const bookOf = (bid: string): FanqieBook | undefined => books.find((b) => b.id === bid);
  const entries = shelf
    .map((e) => ({ e, b: bookOf(e.bookId) }))
    .filter((x): x is { e: typeof shelf[number]; b: FanqieBook } => !!x.b)
    .filter((x) => (filter === 'reading' ? x.e.chapterIdx >= 0 : true));

  const exitEdit = () => setSearchParams((p) => { p.delete('edit'); p.delete('dialog'); return p; }, { replace: true });
  const toggleSelect = (bid: string) =>
    setSelected((a) => (a.includes(bid) ? a.filter((x) => x !== bid) : [...a, bid]));
  const doDelete = () => {
    removeFromShelf(selected);
    setSelected([]);
    exitEdit();
    showToast(s.deleted);
  };

  return (
    <div className="flex flex-col h-full bg-(--app-c-bg-page-alt) relative">
      {/* 顶栏:tab / 搜索 / ⋮ 或 编辑态全选/完成 */}
      {editing ? (
        <div className="flex items-center h-11 px-3 bg-(--app-c-bg-card) shrink-0">
          <button
            {...bindTap({ kind: 'action', id: 'shelf.edit.selectall.toggle' }, {
              onTrigger: () => setSelected(selected.length === entries.length ? [] : entries.map((x) => x.b.id)),
            })}
            className="text-[14px] text-(--app-c-text-primary) bg-transparent border-none cursor-pointer"
          >
            {s.selectAll}
          </button>
          <span className="flex-1 text-center text-[15px] font-semibold text-(--app-c-text-primary)">
            {s.selectedBooks.replace('{n}', String(selected.length))}
          </span>
          <button onClick={exitEdit} className="text-[14px] text-(--app-c-brand) bg-transparent border-none cursor-pointer">
            {s.done}
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center h-11 px-3 bg-(--app-c-bg-card) shrink-0">
            <div className="flex-1 flex items-center gap-4 overflow-x-auto no-scrollbar">
              {SHELF_TABS.map((t) => {
                const on = t.id === 'shelf';
                if (t.id === 'history') {
                  return (
                    <button key={t.id} {...bindTap('shelf.history-open')} className="shrink-0 text-[16px] text-(--app-c-text-secondary) bg-transparent border-none cursor-pointer">
                      {s[t.key]}
                    </button>
                  );
                }
                if (on) {
                  return <span key={t.id} className="shrink-0 text-[18px] font-bold text-(--app-c-text-primary)">{s[t.key]}</span>;
                }
                return (
                  <button
                    key={t.id}
                    {...bindTap({ kind: 'action', id: 'shelf.tab.disabled' }, { onTrigger: showNotOpen })}
                    className="shrink-0 text-[16px] text-(--app-c-text-secondary) bg-transparent border-none cursor-pointer"
                  >
                    {s[t.key]}
                  </button>
                );
              })}
            </div>
            <button {...bindTap({ kind: 'action', id: 'shelf.tab.disabled' }, { onTrigger: showNotOpen })} className="w-8 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label={s.search}>
              <IcSearch size={19} className="text-(--app-c-text-regular)" />
            </button>
            <button {...bindTap({ kind: 'action', id: 'shelf.tab.disabled' }, { onTrigger: showNotOpen })} className="w-7 h-8 flex items-center justify-center bg-transparent border-none cursor-pointer" aria-label={s.more}>
              <IcMore size={19} className="text-(--app-c-text-regular)" />
            </button>
          </div>
          {/* 今日已看读 + 编辑 */}
          <div className="flex items-center px-3 py-1.5 bg-(--app-c-bg-card) shrink-0">
            <span className="text-[11px] text-(--app-c-brand) bg-(--app-c-brand-soft-alt) rounded-full px-2 py-0.5">{s.todayReadMinutes.replace('{n}', String(todayReadMinutes))}</span>
            <span className="flex-1" />
            <button {...bindTap('shelf.edit-open')} className="text-[13px] text-(--app-c-text-regular) bg-transparent border-none cursor-pointer">
              {s.edit}
            </button>
          </div>
          {/* 筛选 chips */}
          <div className="flex items-center gap-2 px-3 py-2 bg-(--app-c-bg-card) shrink-0 border-b border-(--app-c-divider)">
            {FILTERS.map((f) => {
              const on = filter === f.v;
              return (
                <button
                  key={f.v}
                  {...bindTap({ kind: 'action', id: 'shelf.filter.select.target' }, {
                    params: { target: f.v },
                    onTrigger: () => {
                      recordTaskAudit({ shelfFilter: f.v });
                      setSearchParams((p) => { p.set('filter', f.v); return p; }, { replace: true });
                    },
                  })}
                  className={`text-[12px] rounded-full px-3 py-1 border-none cursor-pointer ${on ? 'bg-(--app-c-brand-soft) text-(--app-c-brand) font-semibold' : 'bg-(--app-c-bg-fill-weak) text-(--app-c-text-regular)'}`}
                >
                  {s[f.key]}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 书籍网格 */}
      <div className="flex-1 overflow-y-auto p-3" data-scroll-container="shelf-grid" data-scroll-direction="vertical">
        {entries.length === 0 ? (
          <div className="text-center text-[13px] text-(--app-c-text-tertiary) py-20">{s.emptyShelf}</div>
        ) : (
          <div className="grid grid-cols-3 gap-x-3 gap-y-4">
            {entries.map(({ e, b }) => {
              const progressText = e.chapterIdx >= 0 ? s.chapterProgress.replace('{cur}', String(e.chapterIdx + 1)).replace('{total}', String(b.chapters)) : s.neverRead;
              if (editing) {
                const sel = selected.includes(b.id);
                return (
                  <button
                    key={b.id}
                    {...bindTap({ kind: 'action', id: 'shelf.edit.select.target' }, {
                      params: { target: b.id },
                      onTrigger: () => toggleSelect(b.id),
                    })}
                    className="text-left bg-transparent border-none cursor-pointer p-0"
                  >
                    <div className="relative">
                      <BookCover book={b} className="w-full aspect-[3/4]" />
                      <span className={`absolute top-1 right-1 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[11px] ${sel ? 'bg-(--app-c-brand) border-[#FA6E3D] text-white' : 'bg-(--app-c-bg-card)/70 border-white'}`}>
                        {sel ? '✓' : ''}
                      </span>
                    </div>
                    <div className="text-[12px] text-(--app-c-text-primary) mt-1 line-clamp-1">{b.title}</div>
                    <div className="text-[10px] text-(--app-c-text-tertiary) mt-0.5">{progressText}</div>
                  </button>
                );
              }
              // 普通态:外层长按进编辑(Q2),内层点击进阅读器续读
              return (
                <div key={b.id} {...bindLongPress('shelf.edit-open')}>
                  <div
                    {...bindTap('shelf.reader-open', { params: { id: b.id, ch: String(Math.max(0, e.chapterIdx)) } })}
                    className="cursor-pointer"
                  >
                    <BookCover book={b} className="w-full aspect-[3/4]" />
                    <div className="text-[12px] text-(--app-c-text-primary) mt-1 line-clamp-1">{b.title}</div>
                    <div className="text-[10px] text-(--app-c-text-tertiary) mt-0.5">{progressText}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 编辑态底部操作栏 */}
      {editing && (
        <div className="shrink-0 flex items-stretch bg-(--app-c-bg-card) border-t border-(--app-c-border) pb-1">
          {EDIT_ACTIONS.map((a) => (
            <button
              key={a}
              {...bindTap({ kind: 'action', id: 'shelf.edit.misc.disabled' }, { onTrigger: showNotOpen })}
              className="flex-1 py-2 text-[11px] text-(--app-c-text-regular) bg-transparent border-none cursor-pointer"
            >
              {s[a]}
            </button>
          ))}
          <button
            {...bindTap('shelf.deletedialog-open')}
            disabled={selected.length === 0}
            className={`flex-1 py-2 text-[11px] bg-transparent border-none ${selected.length ? 'text-(--app-c-badge-red) cursor-pointer' : 'text-(--app-c-text-disabled)'}`}
          >
            {s.del}
          </button>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteOpen && (
        <ConfirmDialog
          title={s.deleteConfirmTitle}
          body={s.deleteConfirmBody}
          cancelText={s.cancel}
          confirmText={s.del}
          confirmDanger
          onCancel={() => setSearchParams((p) => { p.delete('dialog'); return p; }, { replace: true })}
          onConfirm={doDelete}
          confirmBinding={bindTap({ kind: 'action', id: 'shelf.edit.delete' }, { onTrigger: () => {} })}
        />
      )}

      {toastNode}
      {notOpenNode}
    </div>
  );
}

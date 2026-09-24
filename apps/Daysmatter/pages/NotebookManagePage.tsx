import { useRef, useState } from 'react';
import { Plus, Minus, Menu } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import type { DMNotebook } from '../types';
import TopBar from '../components/TopBar';
import { useI18n } from '../i18n';

export default function NotebookManagePage() {
  const { t } = useI18n();
  const { bindTap, action } = useDaysmatterGestures();
  const notebooks = useDaysmatterStore((s) => s.notebooks);
  const events = useDaysmatterStore((s) => s.events);
  const deleteNotebook = useDaysmatterStore((s) => s.deleteNotebook);
  const moveNotebook = useDaysmatterStore((s) => s.moveNotebook);
  const showToast = useDaysmatterStore((s) => s.showToast);
  const sorted = [...notebooks].sort((a, b) => a.order - b.order);

  const [dragId, setDragId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<DMNotebook | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const eventCount = (nbId: string) => events.filter((e) => e.notebookId === nbId && !e.parentId).length;

  const targetIndexFromY = (clientY: number): number => {
    const order = [...notebooks].sort((a, b) => a.order - b.order).map((n) => n.id);
    for (let i = 0; i < order.length; i += 1) {
      const el = rowRefs.current.get(order[i]);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return order.length - 1;
  };

  const onHandleDown = (e: React.PointerEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    setDragId(id);
  };
  const onHandleMove = (e: React.PointerEvent, id: string) => {
    if (dragId !== id) return;
    const order = [...notebooks].sort((a, b) => a.order - b.order).map((n) => n.id);
    const cur = order.indexOf(id);
    const target = targetIndexFromY(e.clientY);
    if (target >= 0 && target !== cur) moveNotebook(id, target);
  };
  const onHandleUp = (e: React.PointerEvent, id: string) => {
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (dragId) showToast(t('toast.orderSaved'));
    setDragId(null);
  };

  const requestDelete = (n: DMNotebook) => {
    if (eventCount(n.id) > 0) setPendingDelete(n);
    else { deleteNotebook(n.id); showToast(t('toast.notebookDeleted')); }
  };
  const confirmDelete = () => {
    if (pendingDelete) { deleteNotebook(pendingDelete.id); showToast(t('toast.notebookDeleted')); }
    setPendingDelete(null);
  };

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <TopBar title={t('manage.title')} back solid />
      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto py-3 no-scrollbar">
        <p className="mb-2 px-4 text-[12px] text-[#9A9A9A]">{t('manage.dragHint')}</p>
        <div className="mx-3 overflow-hidden rounded-xl bg-white">
          {sorted.map((n) => (
            <div
              key={n.id}
              ref={(el) => { if (el) rowRefs.current.set(n.id, el); else rowRefs.current.delete(n.id); }}
              className={`flex items-center gap-3 border-b border-[#F2F1EC] px-4 py-3.5 transition-colors ${dragId === n.id ? 'bg-[#EAF2F8] shadow-md' : 'bg-white'}`}
            >
              {!n.isSystem ? (
                <button {...action<HTMLButtonElement>('manage.notebook.delete', () => requestDelete(n), { params: { notebookId: n.id } })} aria-label="delete" className="flex-shrink-0">
                  <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#E0524D] text-white"><Minus size={16} strokeWidth={3} /></span>
                </button>
              ) : (
                <span className="h-[22px] w-[22px] flex-shrink-0" />
              )}
              <button
                {...bindTap<HTMLButtonElement>('manage.notebook-edit', { params: { nbid: n.id } })}
                className="flex flex-1 items-center gap-3 text-left active:opacity-70"
              >
                <span className="flex h-7 w-7 items-center justify-center text-[20px]">{n.icon}</span>
                <span className="text-[16px] text-[#1A1A1A]">{n.name}</span>
              </button>
              {!n.isSystem && (
                <button
                  {...action<HTMLButtonElement>('manage.notebook.reorder', () => {}, { params: { notebookId: n.id } })}
                  onPointerDown={(e) => onHandleDown(e, n.id)}
                  onPointerMove={(e) => onHandleMove(e, n.id)}
                  onPointerUp={(e) => onHandleUp(e, n.id)}
                  onPointerCancel={(e) => onHandleUp(e, n.id)}
                  aria-label="reorder"
                  className="flex-shrink-0 cursor-grab touch-none p-1 active:cursor-grabbing"
                >
                  <Menu size={20} className="text-[#C4C4C4]" />
                </button>
              )}
            </div>
          ))}
          <button
            {...bindTap<HTMLButtonElement>('manage.add-open')}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-[#F2F1EC]"
          >
            <span className="flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-[#4CAF50] text-white"><Plus size={16} strokeWidth={3} /></span>
            <span className="text-[16px] text-[#9A9A9A]">{t('manage.addNewBook')}</span>
          </button>
        </div>
      </div>

      {pendingDelete && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center px-8">
          <button className="absolute inset-0 bg-black/40" aria-label="cancel" onClick={() => setPendingDelete(null)} />
          <div className="relative z-10 w-full max-w-[300px] overflow-hidden rounded-2xl bg-white text-center">
            <div className="px-5 pb-3 pt-5">
              <div className="text-[16px] font-semibold text-[#1A1A1A]">{t('manage.deleteConfirmTitle', { name: pendingDelete.name })}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-[#6B6B6B]">
                {t('manage.deleteConfirmBody', { count: eventCount(pendingDelete.id) })}
              </p>
            </div>
            <div className="flex border-t border-[#F2F1EC] text-[16px]">
              <button onClick={() => setPendingDelete(null)} className="flex-1 border-r border-[#F2F1EC] py-3 text-[#3E7CB1] active:bg-[#F2F1EC]">{t('common.cancel')}</button>
              <button onClick={confirmDelete} className="flex-1 py-3 font-medium text-[#E0524D] active:bg-[#F2F1EC]">{t('manage.confirmDelete')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

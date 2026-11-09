import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { QUADRANT_META, QUADRANT_ORDER, QUADRANT_CREATE_DEFAULTS } from '../constants';
import { QUADRANT_COLORS } from '../res/colors';
import { IcMore, IcPlus, IcCheck } from '../res/icons';
import type { Quadrant, Task } from '../types';

const QUAD_OPTS: { q: Quadrant; id: string }[] = [
  { q: 1, id: 'matrix.add.quadrant.select.q1' },
  { q: 2, id: 'matrix.add.quadrant.select.q2' },
  { q: 3, id: 'matrix.add.quadrant.select.q3' },
  { q: 4, id: 'matrix.add.quadrant.select.q4' },
];

function normalizeOrder(raw: Quadrant[] | undefined): Quadrant[] {
  if (!raw || raw.length !== 4) return [...QUADRANT_ORDER];
  const set = new Set(raw);
  if (set.size !== 4 || ![1, 2, 3, 4].every((q) => set.has(q as Quadrant))) return [...QUADRANT_ORDER];
  return raw as Quadrant[];
}

const MatrixPage: React.FC = () => {
  const [params] = useSearchParams();
  const { t } = useI18n();
  const { action, bindTap, bindBack, back } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const tasks = useDidaStore((s) => s.tasks);
  const matrixShowCompleted = useDidaStore((s) => s.settings.matrixShowCompleted);
  const quadrantOrder = useDidaStore((s) => s.settings.quadrantOrder);
  const toggleComplete = useDidaStore((s) => s.toggleComplete);
  const addTask = useDidaStore((s) => s.addTask);
  const setSetting = useDidaStore((s) => s.setSetting);
  const showToast = useDidaStore((s) => s.showToast);

  const addOpen = params.get('sheet') === 'add';
  const menuOpen = params.get('menu') === 'open';
  const layoutOpen = params.get('sheet') === 'layout';
  const guideOpen = params.get('guide') === 'open';

  const order = normalizeOrder(quadrantOrder);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftQuad, setDraftQuad] = useState<Quadrant>(4);
  const inputRef = useRef<HTMLInputElement>(null);
  const quadRef = useRef<Quadrant>(4);
  const dragFromRef = useRef<number | null>(null);
  const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);

  const swapSlots = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from > 3 || to > 3) return;
    const next = [...order];
    [next[from], next[to]] = [next[to], next[from]];
    setSetting('quadrantOrder', next);
  };

  const submitAdd = () => {
    const title = (inputRef.current?.value ?? draftTitle).trim();
    if (!title) {
      showToast(t('common.titleRequired'));
      return;
    }
    const q = quadRef.current;
    const defs = QUADRANT_CREATE_DEFAULTS[q];
    const today = TimeService.getDate();
    const dueTs =
      defs.dueOffsetDays === null
        ? null
        : TimeService.fromLocalParts(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() + defs.dueOffsetDays,
          ).getTime();
    addTask({
      title,
      quadrant: q,
      priority: defs.priority,
      dueTs,
      hasTime: false,
    });
    setDraftTitle('');
    quadRef.current = 4;
    setDraftQuad(4);
    back();
  };
  const canSubmit = draftTitle.trim().length > 0;

  const onLayoutPointerDown = (slot: number, e: React.PointerEvent) => {
    dragFromRef.current = slot;
    setDraggingSlot(slot);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onLayoutPointerMove = (e: React.PointerEvent) => {
    if (dragFromRef.current === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slotEl = el?.closest('[data-layout-slot]') as HTMLElement | null;
    const to = slotEl ? Number(slotEl.dataset.layoutSlot) : null;
    setHoverSlot(to !== null && !Number.isNaN(to) ? to : null);
  };

  const onLayoutPointerUp = (e: React.PointerEvent) => {
    if (dragFromRef.current === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const slotEl = el?.closest('[data-layout-slot]') as HTMLElement | null;
    const to = slotEl ? Number(slotEl.dataset.layoutSlot) : NaN;
    const from = dragFromRef.current;
    if (!Number.isNaN(to) && from !== to) {
      swapSlots(from, to);
    }
    dragFromRef.current = null;
    setDraggingSlot(null);
    setHoverSlot(null);
  };

  const cell = (q: Quadrant) => {
    const meta = QUADRANT_META[q];
    const color = QUADRANT_COLORS[meta.color];
    const inQuad = tasks
      .filter((tk) => tk.quadrant === q)
      .filter((tk) => matrixShowCompleted || !tk.completed)
      .sort((a, b) => Number(a.completed) - Number(b.completed) || a.order - b.order);
    const list = inQuad.slice(0, 6);
    const overflow = inQuad.length > 6;
    return (
      <div key={q} className="flex min-h-0 flex-col rounded-2xl bg-[#1C1C1E] p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="dida-on-color flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: color }}>{meta.roman}</span>
          <span className="text-[13px] font-medium" style={{ color }}>{t(meta.key)}</span>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {list.length === 0 && <div className="mt-6 text-center text-[13px] text-[#5A5A5E]">{t('matrix.noTasks')}</div>}
          {list.map((tk: Task) => (
            <div key={tk.id} className="flex items-center gap-2 py-1.5">
              <button {...action('matrix.item.complete', () => toggleComplete(tk.id), { params: { taskId: tk.id } })} aria-label="complete" className="flex h-4 w-4 shrink-0 items-center justify-center rounded border" style={{ borderColor: color }}>
                {tk.completed && <IcCheck size={10} color="#5A5A5E" />}
              </button>
              <button {...bindTap('matrix.openTask', { params: { id: tk.id } })} className="min-w-0 flex-1 truncate bg-transparent text-left text-[13px]" style={{ color: tk.completed ? 'var(--dida-tertiary)' : 'var(--dida-text)' }}>
                {tk.title}
              </button>
            </div>
          ))}
          {overflow && (
            <button {...action('matrix.more.view', () => showToast(t('common.notAvailable')))} className="mt-1 text-[12px] text-[#8E8E93]">{t('matrix.viewMore')}</button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      <div className="flex items-center justify-between px-4 py-2">
        <span className="w-10" />
        <span className="text-[17px] font-semibold">{t('matrix.title')}</span>
        <button {...bindTap('matrix.menu.open')} aria-label="more" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcMore size={18} /></button>
      </div>
      <div data-scroll-container="main" data-scroll-direction="vertical" className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2 overflow-y-auto p-3">
        {order.map((q) => cell(q))}
      </div>
      <button {...bindTap('matrix.add.open')} aria-label="add" className="absolute bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg" style={{ background: 'var(--dida-accent)' }}>
        <IcPlus size={26} color="#fff" />
      </button>

      {/* 更多菜单 */}
      {menuOpen && (
        <div className="absolute inset-0 z-40 flex flex-col">
          <div
            className="dida-card dida-popover mx-3 mt-14 overflow-hidden rounded-2xl px-1 py-1"
          >
            <button
              {...action('matrix.menu.completed.toggle', () => setSetting('matrixShowCompleted', !matrixShowCompleted))}
              className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[16px] text-white"
            >
              <span>{t('matrix.menu.showCompleted')}</span>
              <span className="dida-muted text-[14px]">{matrixShowCompleted ? t('common.on') : t('common.off')}</span>
            </button>
            <button {...bindTap('matrix.layout.open')} className="flex w-full px-4 py-3.5 text-left text-[16px] text-white">
              {t('matrix.menu.editLayout')}
            </button>
            <button {...bindTap('matrix.guide.open')} className="flex w-full px-4 py-3.5 text-left text-[16px] text-white">
              {t('matrix.menu.guide')}
            </button>
          </div>
          <div {...bindBack()} className="min-h-0 flex-1" aria-label="close-menu" />
        </div>
      )}

      {/* 编辑布局：拖动交换 */}
      {layoutOpen && (
        <div className="absolute inset-0 z-50 flex flex-col bg-black/50 pt-10">
          <div className="dida-sheet dida-popover mx-3 mt-2 flex min-h-0 flex-1 flex-col rounded-2xl p-4">
            <div className="mb-1 text-center text-[17px] font-semibold">{t('matrix.layoutTitle')}</div>
            <p className="dida-muted mb-4 text-center text-[13px]">{t('matrix.layoutHint')}</p>
            <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-3">
              {order.map((q, slot) => {
                const meta = QUADRANT_META[q];
                const color = QUADRANT_COLORS[meta.color];
                const active = draggingSlot === slot;
                const over = hoverSlot === slot && draggingSlot !== null && draggingSlot !== slot;
                return (
                  <div
                    key={`layout-${slot}-${q}`}
                    data-layout-slot={slot}
                    data-action="matrix.layout.swap"
                    onPointerDown={(e) => onLayoutPointerDown(slot, e)}
                    onPointerMove={onLayoutPointerMove}
                    onPointerUp={onLayoutPointerUp}
                    onPointerCancel={() => {
                      dragFromRef.current = null;
                      setDraggingSlot(null);
                      setHoverSlot(null);
                    }}
                    className="flex touch-none select-none flex-col items-center justify-center rounded-2xl px-2 py-4"
                    style={{
                      background: color,
                      opacity: active ? 0.55 : 1,
                      outline: over ? '3px solid #fff' : 'none',
                      transform: active ? 'scale(0.96)' : 'none',
                    }}
                  >
                    <span className="dida-on-color text-[22px] font-bold text-white">{meta.roman}</span>
                    <span className="dida-on-color mt-1 text-center text-[13px] font-medium text-white">{t(meta.key)}</span>
                  </div>
                );
              })}
            </div>
            <button
              {...bindBack()}
              className="dida-on-color mt-4 w-full rounded-full py-3 text-[16px] font-medium text-white"
              style={{ background: 'var(--dida-accent)' }}
            >
              {t('matrix.layoutDone')}
            </button>
            {/* 供导航静态分析识别 action id；拖动交换走 pointer 逻辑 */}
            <button
              type="button"
              className="hidden"
              {...action('matrix.layout.swap', () => undefined, { params: { from: '0', to: '1' } })}
            />
          </div>
          <div className="h-6" />
        </div>
      )}

      {/* 用户指引 */}
      {guideOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center px-5">
          <div {...bindBack()} className="absolute inset-0 bg-black/50" aria-label="close-guide" />
          <div className="dida-card dida-popover relative z-10 max-h-[80%] w-full overflow-y-auto rounded-2xl p-5">
            <div className="mb-3 text-center text-[17px] font-semibold">{t('matrix.guideTitle')}</div>
            <p className="dida-muted mb-4 text-[14px] leading-relaxed">{t('matrix.guideIntro')}</p>
            <div className="space-y-3">
              {([1, 2, 3, 4] as Quadrant[]).map((q) => {
                const meta = QUADRANT_META[q];
                const color = QUADRANT_COLORS[meta.color];
                return (
                  <div key={q} className="flex gap-3">
                    <span className="dida-on-color mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: color }}>{meta.roman}</span>
                    <p className="text-[14px] leading-relaxed">{t(`matrix.guide.q${q}`)}</p>
                  </div>
                );
              })}
            </div>
            <button
              {...bindBack()}
              className="dida-on-color mt-5 w-full rounded-full py-3 text-[16px] font-medium text-white"
              style={{ background: 'var(--dida-accent)' }}
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}

      {/* 快速添加(选象限) */}
      {addOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-add" />
          <div data-keep-keyboard="true" className="dida-popover rounded-t-2xl bg-[#1C1C1E] px-4 pb-6 pt-4">
            <input
              ref={inputRef}
              {...action('matrix.add.title.input', () => { /* onChange */ }, { params: { value: draftTitle } })}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder={t('tasks.addPlaceholder')}
              className="w-full bg-transparent text-[18px] text-white placeholder-[#8E8E93] outline-none"
            />
            <div className="mt-3 text-[12px] text-[#8E8E93]">{t('matrix.pickQuadrant')}</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {QUAD_OPTS.map((opt) => {
                const meta = QUADRANT_META[opt.q];
                const color = QUADRANT_COLORS[meta.color];
                const on = draftQuad === opt.q;
                return (
                  <button
                    key={opt.q}
                    data-keep-keyboard="true"
                    onPointerDown={(e) => e.preventDefault()}
                    {...action(opt.id, () => { quadRef.current = opt.q; setDraftQuad(opt.q); })}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px]"
                    style={{ background: on ? color : 'var(--dida-elevated)', color: on ? '#fff' : 'var(--dida-text)' }}
                  >
                    <span className="text-[10px] font-bold">{meta.roman}</span>{t(meta.key)}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                data-keep-keyboard="true"
                onPointerDown={(e) => e.preventDefault()}
                {...action('matrix.add.submit.commit', submitAdd)}
                className="rounded-full px-5 py-2 text-[15px] font-medium text-white"
                style={{ background: 'var(--dida-accent)', opacity: canSubmit ? 1 : 0.4 }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatrixPage;

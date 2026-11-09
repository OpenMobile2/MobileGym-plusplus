import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Img from '../components/Img';
import {
  IcNavBack, IcTrash, IcMore, IcCart, IcStar, IcPlus, IcCheck, IcChevronDown, IcChevronUp,
} from '../res/icons';
import { useSuningGestures } from '../hooks/useSuningGestures';
import { useSuningStore } from '../state';
import { useStrings } from '../i18n';
import { productOf } from '../utils/detail';
import { dayStart, fmtYmd } from '../utils/appTime';
import * as TimeService from '../../../os/TimeService';
import type { Product, RuntimeHistoryEntry } from '../types';

const EMPTY_LION = '/@app-assets/Suning/me/empty-lion.png';

/**
 * 足迹(spec me.history,s326/s327)。
 * cal/edit/date/month 全走 queryParam(v1.9.0);编辑态勾选 + 删除补漏三条 action。
 */
export default function HistoryPage() {
  const { bindTap, action, bindBack } = useSuningGestures();
  const S = useStrings();
  const [searchParams, setSearchParams] = useSearchParams();

  const history = useSuningStore((s) => s.history);
  const cartItems = useSuningStore((s) => s.cartItems);
  const followedProducts = useSuningStore((s) => s.followedProducts);
  const multiSelect = useSuningStore((s) => s._temp.multiSelect);
  const setTemp = useSuningStore((s) => s.setTemp);
  const removeHistory = useSuningStore((s) => s.removeHistory);
  const toggleFollowProduct = useSuningStore((s) => s.toggleFollowProduct);
  const showToast = useSuningStore((s) => s.showToast);

  const today = fmtYmd(TimeService.now());
  const todayDate = TimeService.getDate();
  const defaultMonth = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}`;
  const cal = searchParams.get('cal') === 'month' ? 'month' : 'week';
  const editMode = searchParams.get('edit') === '1';
  const selectedDate = searchParams.get('date') || today;
  const monthKey = searchParams.get('month') || defaultMonth;

  const wontfix = () => showToast(S.toastNotOpen);
  const cartCount = cartItems.reduce((n, i) => n + i.qty, 0);

  const patch = (next: Record<string, string | null>) => {
    const p = new URLSearchParams(searchParams);
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === '') p.delete(k);
      else p.set(k, v);
    }
    setSearchParams(p, { replace: true });
  };

  const rows = useMemo(
    () =>
      history
        .map((e) => ({ entry: e, product: productOf(e.productId) }))
        .filter((r): r is { entry: RuntimeHistoryEntry; product: Product } => r.product != null),
    [history],
  );

  const byDay = useMemo(() => {
    const map = new Map<string, typeof rows>();
    for (const r of rows) {
      const key = fmtYmd(r.entry.ts);
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [rows]);

  const daysWithHistory = useMemo(() => new Set(byDay.map(([d]) => d)), [byDay]);
  const visibleList = byDay.find(([d]) => d === selectedDate)?.[1] ?? [];
  const emptyDay = visibleList.length === 0;
  const visibleIds = visibleList.map((r) => r.product.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => multiSelect.includes(id));

  const [my, mm] = monthKey.split('-').map((x) => parseInt(x, 10));
  const monthStart = TimeService.fromLocalParts(my, mm - 1, 1, 0, 0, 0);
  // fromLocalParts 月份 0-based:传 mm(=1-based) + day0 → 当月最后一天
  const daysInMonth = TimeService.fromLocalParts(my, mm, 0, 0, 0, 0).getDate();
  const startWeekday = monthStart.getDay();
  const padBefore = startWeekday === 0 ? 6 : startWeekday - 1;

  const weekDays = (() => {
    const base = TimeService.fromTimestamp(dayStart(TimeService.now()));
    const wd = base.getDay();
    const mondayOffset = wd === 0 ? -6 : 1 - wd;
    return Array.from({ length: 7 }, (_, i) => {
      const ts = dayStart(TimeService.now()) + (mondayOffset + i) * 86400000;
      return { key: fmtYmd(ts), day: TimeService.fromTimestamp(ts).getDate() };
    });
  })();

  const dateBind = (key: string) =>
    action('me.history.date.select', () => patch({ date: key }), { params: { date: key } });

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-bg)]">
      <div className="flex shrink-0 items-center gap-1 bg-[var(--app-surface)] px-2 pb-2 pt-10">
        <button {...bindBack()} className="cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]">
          <IcNavBack size={24} />
        </button>
        <span className="min-w-0 flex-1 text-center text-[16px] font-bold text-[var(--app-text)]">
          {S.historyTitle}
        </span>
        <button
          {...action('me.history.editMode.toggle', () => {
            setTemp({ multiSelect: [] });
            patch({ edit: editMode ? null : '1' });
          })}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcTrash size={19} />
        </button>
        <button
          {...action('me.history.wontfix.toast', wontfix)}
          className="shrink-0 cursor-pointer border-none bg-transparent p-1 text-[var(--app-text)]"
        >
          <IcMore size={19} />
        </button>
      </div>

      <div className="shrink-0 bg-[var(--app-surface)] px-3 pb-2">
        <div className="flex items-center justify-center gap-4 py-1">
          <button
            {...action(
              'me.history.month.switch',
              () => {
                const d = TimeService.fromLocalParts(my, mm - 2, 1, 0, 0, 0);
                patch({
                  month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                });
              },
              { params: { dir: 'prev' } },
            )}
            className="cursor-pointer border-none bg-transparent px-2 text-[16px] text-[var(--app-text-muted)]"
          >
            ‹
          </button>
          <span className="text-[14px] font-bold text-[var(--app-text)]">
            {my}
            {S.historyYear}
            {mm}
            {S.historyMonth}
          </span>
          <button
            {...action(
              'me.history.month.switch',
              () => {
                const d = TimeService.fromLocalParts(my, mm, 1, 0, 0, 0);
                patch({
                  month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
                });
              },
              { params: { dir: 'next' } },
            )}
            className="cursor-pointer border-none bg-transparent px-2 text-[16px] text-[var(--app-text-muted)]"
          >
            ›
          </button>
        </div>

        {cal === 'week' ? (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((d) => (
              <button
                key={d.key}
                {...dateBind(d.key)}
                className={`relative mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none text-[12px] ${
                  d.key === selectedDate
                    ? 'bg-[var(--app-primary)] font-bold text-white'
                    : 'bg-transparent text-[var(--app-text)]'
                }`}
              >
                {d.day}
                {daysWithHistory.has(d.key) && d.key !== selectedDate && (
                  <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[var(--app-primary)]" />
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: padBefore }).map((_, i) => (
              <span key={`pad-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const key = `${my}-${String(mm).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <button
                  key={key}
                  {...dateBind(key)}
                  className={`relative mx-auto flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-none text-[12px] ${
                    key === selectedDate
                      ? 'bg-[var(--app-primary)] font-bold text-white'
                      : 'bg-transparent text-[var(--app-text)]'
                  }`}
                >
                  {day}
                  {daysWithHistory.has(key) && key !== selectedDate && (
                    <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[var(--app-primary)]" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          {...action('me.history.calendar.toggle', () =>
            patch({ cal: cal === 'week' ? 'month' : 'week' }),
          )}
          className="mx-auto mt-1 flex cursor-pointer items-center border-none bg-transparent p-1 text-[var(--app-c-text-muted)]"
        >
          {cal === 'week' ? <IcChevronDown size={16} /> : <IcChevronUp size={16} />}
        </button>
      </div>

      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2.5 pb-20 pt-2"
        data-scroll-container="main"
        data-scroll-direction="vertical"
      >
        {emptyDay ? (
          <div className="flex flex-col items-center py-16">
            <span className="h-24 w-24 overflow-hidden">
              <Img src={EMPTY_LION} className="h-full w-full object-contain" />
            </span>
            <span className="mt-2 text-[14px] text-[var(--app-text-muted)]">{S.historyEmpty}</span>
          </div>
        ) : (
          <div>
            <div className="pb-1.5 text-[12px] text-[var(--app-c-text-muted)]">
              {selectedDate === today ? S.historyToday : selectedDate}
            </div>
            <div className="overflow-hidden rounded-xl bg-[var(--app-surface)]">
              {visibleList.map(({ product }) => {
                const fav = followedProducts.some((f) => f.productId === product.id);
                const selected = multiSelect.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className="flex items-center gap-2 border-b border-[var(--app-border)] px-2.5 py-2.5 last:border-b-0"
                  >
                    {editMode && (
                      <button
                        {...action(
                          'me.history.item.select.toggle',
                          () =>
                            setTemp({
                              multiSelect: selected
                                ? multiSelect.filter((id) => id !== product.id)
                                : [...multiSelect, product.id],
                            }),
                          { params: { productId: product.id } },
                        )}
                        className={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-full border-none ${
                          selected ? 'bg-[var(--app-primary)] text-white' : 'bg-[#EEE] text-transparent'
                        }`}
                      >
                        <IcCheck size={12} />
                      </button>
                    )}
                    {editMode ? (
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                          <Img src={product.image} className="h-full w-full object-contain" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">
                            {product.title}
                          </span>
                          <span className="mt-1 block text-[14px] font-bold text-[var(--app-c-danger)]">
                            <span className="text-[10px]">¥</span>
                            {product.price}
                          </span>
                        </span>
                      </div>
                    ) : (
                      <button
                        {...bindTap('me.history.productDetail.open', {
                          params: { productId: product.id },
                        })}
                        className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 border-none bg-transparent p-0 text-left"
                      >
                        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[var(--app-c-chip-bg)]">
                          <Img src={product.image} className="h-full w-full object-contain" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="line-clamp-2 block text-[12px] leading-4 text-[var(--app-text)]">
                            {product.title}
                          </span>
                          <span className="mt-1 block text-[14px] font-bold text-[var(--app-c-danger)]">
                            <span className="text-[10px]">¥</span>
                            {product.price}
                          </span>
                        </span>
                      </button>
                    )}
                    {!editMode && (
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <button
                          {...bindTap('me.history.similar.open', {
                            params: { productId: product.id },
                          })}
                          className="cursor-pointer rounded-full border border-[var(--app-border)] bg-[var(--app-surface)] px-2 py-0.5 text-[10px] text-[var(--app-text-muted)]"
                        >
                          {S.findSimilar}
                        </button>
                        <div className="flex items-center gap-2">
                          <button
                            {...action(
                              'me.history.favorite.toggle',
                              () => toggleFollowProduct(product.id),
                              { params: { productId: product.id } },
                            )}
                            className={`cursor-pointer border-none bg-transparent p-0 ${
                              fav ? 'text-[var(--app-primary)]' : 'text-[#CCC]'
                            }`}
                          >
                            <IcStar size={16} fill={fav ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            {...bindTap('me.history.skuAdd.open', {
                              params: { productId: product.id },
                              beforeTrigger: () => setTemp({ skuEntryHint: 'add' }),
                            })}
                            className="cursor-pointer rounded-full border-none bg-[#FFF3E8] p-1 text-[var(--app-primary)]"
                          >
                            <IcPlus size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {!editMode && (
        <button
          {...bindTap('me.history.cart.open')}
          className="absolute bottom-6 right-4 flex cursor-pointer items-center justify-center rounded-full border-none bg-[var(--app-surface)] p-3 text-[var(--app-primary)] shadow-lg"
        >
          <IcCart size={22} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-[16px] rounded-full bg-[var(--app-c-danger)] px-1 text-center text-[9px] leading-[16px] text-white">
              {cartCount}
            </span>
          )}
        </button>
      )}

      {editMode && (
        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center gap-3 bg-[var(--app-surface)] px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.06)]">
          <button
            {...action('me.history.selectAll.toggle', () =>
              setTemp({ multiSelect: allSelected ? [] : [...visibleIds] }),
            )}
            className="flex cursor-pointer items-center gap-1.5 border-none bg-transparent p-0 text-[13px] text-[var(--app-text-muted)]"
          >
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full ${
                allSelected ? 'bg-[var(--app-primary)] text-white' : 'bg-[#EEE] text-transparent'
              }`}
            >
              <IcCheck size={12} />
            </span>
            {S.selectAll}
          </button>
          <span className="min-w-0 flex-1" />
          {multiSelect.length > 0 ? (
            <button
              {...action('me.history.delete.submit', () => {
                removeHistory([...multiSelect]);
                showToast(S.toastHistoryDeleted);
                patch({ edit: null });
              })}
              className="cursor-pointer rounded-full border-none bg-[var(--app-c-danger)] px-5 py-2 text-[13px] font-bold text-white"
            >
              {S.deleteBtn}({multiSelect.length})
            </button>
          ) : (
            <button
              disabled
              className="cursor-not-allowed rounded-full border-none bg-[#F5B5A8] px-5 py-2 text-[13px] font-bold text-white"
            >
              {S.deleteBtn}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { useDialogs } from '../hooks/useDialogs';
import { colors } from '../res/colors';
import { IconRenderer, IcPlus, IcMoreH, IcMoreV, IcSearch, IcPen, IcEyeOff, IcEye, IcCrown, IcSun, IcDown, IcUp, IcClock, IcHelp, IcTomato } from '../res/icons';
import { Sheet, Dialog } from '../components/Sheet';
import { MenuRow } from '../components/common';
import { dateKeyAt, toDateKey, todayKey } from '../utils/appTime';
import { scheduledHabits, todayProgress } from '../utils/metrics';
import { LAYOUT_COLUMNS } from '../constants';
import type { CheckinStatus, Habit } from '../types';
import { sharePlainText } from '@/os/shareBridge';

const DAY_MS = 86400000;

// 今日页会在进入习惯编辑页时卸载。把滚动位置留在运行时内存中，返回后优先
// 定位到刚编辑的习惯；若该习惯因筛选不可见，则恢复离开前的 scrollTop。
const todayScrollMemory: { top: number; editedHabitId: string | null } = {
  top: 0,
  editedHabitId: null,
};

function rememberEditedHabit(habitId: string) {
  todayScrollMemory.editedHabitId = habitId;
}

export default function TodayPage() {
  const [sp, setSp] = useSearchParams();
  const { bindTap, action, bindBack, back } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const st = useXiaorichangStore();
  const mainScrollRef = useRef<HTMLDivElement>(null);

  const [dayOffset, setDayOffset] = useState(0);
  const [stripOpen, setStripOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState('');

  const dateKey = dateKeyAt(dayOffset);
  const dateObj = TimeService.fromTimestamp(TimeService.now() + dayOffset * DAY_MS);
  const isToday = dayOffset === 0;
  const titleDate = isToday
    ? s.todayTitle
    : dayOffset === 1
      ? s.tomorrow
      : dayOffset === -1
        ? s.yesterday
        : TimeService.formatDateTimeForLocale(dateObj, { month: 'short', day: 'numeric' });
  const weekday = TimeService.formatDateTimeForLocale(dateObj, { weekday: 'short' });

  const planning = st._temp.planning;
  const contexts = [...st.contexts].sort((a, b) => a.order - b.order);
  const sched = scheduledHabits(st.habits, dateObj, st.logs)
    .filter((h) => !keyword || h.name.includes(keyword));
  const { earned, total } = todayProgress(st.habits, st.logs, dateObj);
  const statusOf = (h: Habit): CheckinStatus | null =>
    st.logs.find((l) => l.habitId === h.id && l.date === dateKey)?.status ?? null;

  const todayTodos = st.todos.filter((t) => !t.done || (t.doneAt && toDateKey(TimeService.fromTimestamp(t.doneAt)) === dateKey));
  const todayNotes = st.notes.filter((n) => toDateKey(TimeService.fromTimestamp(n.createdAt)) === dateKey);
  const todayFocusMin = st.records
    .filter((r) => toDateKey(TimeService.fromTimestamp(r.startTs)) === dateKey)
    .reduce((a, r) => a + r.minutes, 0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const purchasePremium = () => {
    const launched = window.__OS__?.startActivityForResult?.(
      {
        action: 'ACTION_PAY',
        scheme: 'alipays',
        data: {
          amount: 18,
          orderId: `xiaorichang-vip-${TimeService.now()}`,
          merchantName: s.paymentMerchant,
          subject: s.paymentPremiumSubject,
          source: 'xiaorichang',
        },
      },
      (result) => {
        if (result.resultCode !== 'OK') return;
        st.updateUser({ vip: true });
        st.showToast(s.paymentSuccess);
      },
    );
    if (!launched) st.showNotice(s.notAvailable);
  };

  useEffect(() => {
    const scroller = mainScrollRef.current;
    let frame = window.requestAnimationFrame(() => {
      frame = window.requestAnimationFrame(() => {
        if (!scroller) return;
        const editedHabitId = todayScrollMemory.editedHabitId;
        const editedHabit = editedHabitId
          ? Array.from(scroller.querySelectorAll<HTMLElement>('[data-habit-id]'))
              .find((el) => el.dataset.habitId === editedHabitId)
          : null;
        if (editedHabit) {
          editedHabit.scrollIntoView({ block: 'center' });
        } else {
          scroller.scrollTop = todayScrollMemory.top;
        }
        todayScrollMemory.editedHabitId = null;
      });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      if (scroller) todayScrollMemory.top = scroller.scrollTop;
    };
  }, []);

  /**
   * R4:一键打卡后,习惯先以「已完成」形态停留约 1.2 秒(实心圆 + 名下 +N ☀),
   * 然后才随 hideCompleted 隐藏。graceIds 就是这段停留期里仍要渲染的习惯。
   */
  // 个性化 → 边框 / 版式(s258/s259):列数越多,格子越小
  const cols = LAYOUT_COLUMNS[st.settings.layoutDensity] ?? 4;
  const tileSize = cols === 3 ? 68 : cols === 4 ? 60 : 50;
  const tileRadius = st.settings.iconShape === 'squircle' ? tileSize * 0.28 : 9999;

  const [graceIds, setGraceIds] = useState<string[]>([]);
  const checkinWithGrace = (habitId: string) => {
    st.setCheckin(habitId, dateKey, 'done');
    setGraceIds((ids) => [...ids, habitId]);
    window.setTimeout(() => setGraceIds((ids) => ids.filter((x) => x !== habitId)), 1200);
  };

  // (自动)当日全部习惯完成 → 庆祝弹窗。仅今天、仅一次。
  const celebrated = useRef(false);
  const allDone = isToday && sched.length > 0 && sched.every((h) => statusOf(h) === 'done');
  useEffect(() => {
    if (allDone && !celebrated.current && sp.get('dialog') !== 'alldone') {
      celebrated.current = true;
      setSp((p) => { p.set('dialog', 'alldone'); return p; });
    }
  }, [allDone, sp, setSp]);

  const sheet = sp.get('sheet');
  const dialog = sp.get('dialog');
  const sheetHabitId = sp.get('habitId') ?? '';

  // 长按拖动习惯到其它情境(裁定1:唯一保留的真拖拽)
  const drag = useRef<{ habitId: string; startY: number; active: boolean } | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const onTilePointerDown = (habitId: string) => (e: React.PointerEvent) => {
    drag.current = { habitId, startY: e.clientY, active: false };
    const el = e.currentTarget as HTMLElement;
    window.setTimeout(() => {
      if (drag.current?.habitId === habitId) {
        drag.current.active = true;
        setDragging(habitId);
        el.setPointerCapture?.(e.pointerId);
      }
    }, 400);
  };
  const onTilePointerUp = (e: React.PointerEvent) => {
    const d = drag.current;
    drag.current = null;
    setDragging(null);
    if (!d?.active) return;
    const target = document.elementFromPoint(e.clientX, e.clientY)?.closest('[data-ctx-drop]');
    const toContextId = target?.getAttribute('data-ctx-drop');
    if (toContextId) st.updateHabit(d.habitId, { contextId: toContextId });
  };

  return (
    <div className="flex h-full flex-col text-app-text" style={{ background: 'var(--app-c-brand-wash)' }}>
      {/* 顶栏 */}
      <div className="flex shrink-0 items-start justify-between px-4 pb-1 pt-10">
        <button {...action('today.upgrade.pay', purchasePremium)}
          className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-[#E69F4B]">
          <IcCrown size={16} />
        </button>
        <button {...action('today.dateStrip.toggle', () => setStripOpen((v) => !v))} className="text-center">
          <div className="flex items-center gap-1 text-lg font-bold text-app-text">
            {titleDate}·{weekday}
            {stripOpen ? <IcUp size={16} /> : <IcDown size={16} />}
          </div>
          <div className="text-xs text-app-text-muted">{s.todaySubtitle}</div>
        </button>
        <button {...bindTap('today.addmenu.open')} aria-label="新增"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-app-surface shadow-sm">
          <IcPlus size={22} />
        </button>
      </div>

      {/* 日期条(标题 ^ 展开的内嵌横向滑条,不是独立页 —— 审核订正 s216) */}
      {stripOpen && (
        <div {...action('today.dateStrip.scroll', () => {})}
          className="flex shrink-0 gap-2 overflow-x-auto px-4 py-2"
          data-scroll-container="dateStrip" data-scroll-direction="horizontal">
          {Array.from({ length: 15 }, (_, i) => i - 7).map((off) => {
            const d = TimeService.fromTimestamp(TimeService.now() + off * DAY_MS);
            const sel = off === dayOffset;
            return (
              <button key={off}
                {...action('today.dateStrip.pick', () => setDayOffset(off), { params: { date: dateKeyAt(off) } })}
                className="flex w-11 shrink-0 flex-col items-center rounded-xl py-1.5"
                style={sel ? { background: colors.inkStrong, color: '#fff' } : { background: '#fff', color: '#424242' }}>
                <span className="text-[10px]">{TimeService.formatDateTimeForLocale(d, { weekday: 'short' })}</span>
                <span className="text-base font-semibold">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 快捷条 */}
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-2">
        <QuickChip label={s.quickTodayCard} bind={bindTap('today.quick.card')} />
        <QuickChip label={s.quickTodo} bind={bindTap('today.quick.todo')} />
        <QuickChip label={s.quickNote} bind={bindTap('today.quick.note')} />
        <QuickChip label={s.quickFocus} bind={bindTap('today.quick.focus')} />
        <QuickChip label={s.quickTimeline} bind={bindTap('today.quick.timeline')} />
      </div>

      <div ref={mainScrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {/* 今日专注 chip */}
        {todayFocusMin > 0 && (
          <button {...bindTap('today.focus.chip.open')}
            className="mb-2 flex items-center gap-1 rounded-full bg-app-surface px-3 py-1.5 text-sm text-app-text shadow-sm">
            <IcTomato size={15} color={colors.focusStop} /> {todayFocusMin} {s.minutesUnit}
          </button>
        )}

        {/* 小事区 */}
        {st.settings.todoHomeDisplay && (
          <section className="mb-3">
            <div className="flex items-center justify-between py-1">
              <div className="text-[15px] font-bold text-[#212121]">{s.sectionTodos} {todayTodos.filter((t) => !t.done).length}</div>
              <div className="flex gap-2">
                <RoundBtn bind={bindTap('today.todo.sectionmenu.open')}><IcMoreH size={16} /></RoundBtn>
                <RoundBtn bind={bindTap('today.todo.create')}><IcPlus size={16} /></RoundBtn>
              </div>
            </div>
            {todayTodos.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2">
                <button
                  {...action('today.todo.item.toggle', () => st.toggleTodo(t.id), { params: { todoId: t.id } })}
                  className="flex h-6 w-6 items-center justify-center rounded-md border-2"
                  style={t.done ? { background: '#C9CDD3', borderColor: '#C9CDD3', color: '#fff' } : { borderColor: '#C9CDD3' }}>
                  {t.done ? '✓' : ''}
                </button>
                <span className="flex-1 text-sm" style={{ color: t.done ? '#B9BEC7' : '#424242' }}>{text(t.title)}</span>
                {t.done && <span className="text-xs text-[#C9CDD3]">{s.todoDoneToday}</span>}
                <button {...bindTap('today.todo.item.menu.open', { params: { todoId: t.id } })}
                  className="text-[#C9CDD3]"><IcMoreH size={16} /></button>
              </div>
            ))}
          </section>
        )}

        {/* 笔记区 */}
        <section className="mb-3">
          <div className="flex items-center justify-between py-1">
            <div className="text-[15px] font-bold text-[#212121]">{s.sectionNotes} {todayNotes.length}</div>
            <div className="flex gap-2">
              <RoundBtn bind={bindTap('today.note.sectionmenu.open')}><IcMoreH size={16} /></RoundBtn>
              <RoundBtn bind={bindTap('today.note.create')}><IcPlus size={16} /></RoundBtn>
            </div>
          </div>
          {todayNotes.map((n) => (
            <div key={n.id} className="relative mb-2 rounded-2xl bg-app-surface p-3 shadow-sm">
              <button {...bindTap('today.note.open', { params: { noteId: n.id } })} className="block w-full text-left">
                <div className="flex items-center gap-2 text-xs text-[#9AA5B1]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: n.color }} />
                  {TimeService.formatDateTimeForLocale(TimeService.fromTimestamp(n.createdAt), { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
                {n.title && <div className="mt-1 text-sm font-semibold" style={{ color: colors.vip }}>{text(n.title)}</div>}
                <div className="mt-1 line-clamp-4 whitespace-pre-wrap text-sm leading-relaxed text-app-text">{text(n.body)}</div>
              </button>
              <button {...bindTap('today.note.cardmenu.open', { params: { noteId: n.id } })}
                className="absolute right-2 top-2 p-1 text-[#C9CDD3]"><IcMoreV size={16} /></button>
            </div>
          ))}
        </section>

        {/* 日常打卡区 */}
        <section>
          {planning && (
            <div className="mb-2 flex items-center justify-between rounded-xl px-3 py-2 text-sm text-white" style={{ background: colors.vip }}>
              <span>{s.planningBanner}</span>
              <button {...action('today.planning.exit', () => st.setPlanning(false))}
                className="rounded-full bg-white/25 px-3 py-1 text-xs">{s.planningExit}</button>
            </div>
          )}
          <div className="flex items-center justify-between py-1">
            <div className="text-[15px] font-bold text-[#212121]">{s.sectionDailyCheckin}</div>
            <div className="flex items-center gap-2">
              <button {...bindTap('today.glow.open')}
                className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-semibold"
                style={{ background: colors.brandSoft, color: colors.vip }}>
                <IcSun size={14} /> {earned}<span className="font-normal text-[#C9A86A]">/{total}</span>
              </button>
              <RoundBtn bind={action('today.search.toggle', () => setSearchOpen((v) => !v))}><IcSearch size={15} /></RoundBtn>
              <RoundBtn bind={action('today.planning.enter', () => st.setPlanning(true))}><IcPen size={15} /></RoundBtn>
              {/* R4:默认隐藏已完成,此时图标是「划掉的眼睛」;点开后变成普通眼睛 */}
              <RoundBtn bind={action('today.hideDone.toggle', () => st.updateSettings({ hideCompleted: !st.settings.hideCompleted }))}>
                {st.settings.hideCompleted ? <IcEyeOff size={15} /> : <IcEye size={15} />}
              </RoundBtn>
            </div>
          </div>
          {searchOpen && (
            <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
              placeholder={s.todoSearchPlaceholder}
              className="mb-2 w-full rounded-xl border border-dashed border-[#DDD] bg-white px-3 py-2 text-sm outline-none" />
          )}

          {contexts.map((ctx) => {
            const inCtx = sched.filter((h) => h.contextId === ctx.id).sort((a, b) => a.order - b.order);
            // R4:hideCompleted 默认 true;刚完成的习惯先留 ~1.2s(grace)再消失
            const mine = inCtx.filter((h) =>
              !st.settings.hideCompleted || statusOf(h) !== 'done' || graceIds.includes(h.id));
            // R4:chip 上的数字是**未完成数**,不是该组总数
            const remaining = inCtx.filter((h) => statusOf(h) !== 'done').length;
            if (!mine.length && !planning) return null;
            const isCollapsed = collapsed[ctx.id];
            return (
              <div key={ctx.id} className="mb-3" data-ctx-drop={ctx.id}>
                <div className="flex items-center gap-2 py-1">
                  <button
                    {...action('today.context.collapse', () => setCollapsed((c) => ({ ...c, [ctx.id]: !c[ctx.id] })), { params: { contextId: ctx.id } })}
                    className="flex items-center gap-1 rounded-full bg-[#F5F5F5] px-3 py-1.5 text-[13px] text-[#424242]">
                    {text(ctx.name)}{remaining > 0 ? ` · ${remaining}` : ''}
                    {isCollapsed ? <IcDown size={13} className="text-[#C9CDD3]" /> : <IcUp size={13} className="text-[#C9CDD3]" />}
                  </button>
                  {/* R4:『+』在情境 chip 旁边,不是网格末尾 */}
                  {planning ? (
                    <button {...bindTap('today.planning.habit.create', { params: { contextId: ctx.id } })}
                      className="p-1 text-[#C9CDD3]"><IcPlus size={16} /></button>
                  ) : (
                    <button {...bindTap('today.habit.create.inContext', { params: { contextId: ctx.id } })}
                      className="p-1 text-[#C9CDD3]"><IcPlus size={16} /></button>
                  )}
                </div>
                {!isCollapsed && (
                  // 列数由「个性化 → 版式」驱动(s259):舒适3 / 紧凑4 / 紧密5
                  <div className="grid gap-y-3 pt-1"
                    style={{ gridTemplateColumns: `repeat(${LAYOUT_COLUMNS[st.settings.layoutDensity] ?? 4}, minmax(0,1fr))` }}>
                    {mine.map((h) => {
                      const status = statusOf(h);
                      const done = status === 'done';
                      const prepareCheckinDraft = () => st.setDraft({
                        checkinHabitId: h.id,
                        status: undefined,
                        note: undefined,
                        quantity: undefined,
                        checkinStampTs: undefined,
                      });
                      const tileBind = status !== null
                        ? bindTap('today.checkin.open', { params: { habitId: h.id }, beforeTrigger: prepareCheckinDraft })
                        : h.oneTap && !h.quantify?.enabled
                          ? action('today.habit.oneTapDone', () => checkinWithGrace(h.id), { params: { habitId: h.id } })
                          : bindTap('today.checkin.open.noOneTap', { params: { habitId: h.id }, beforeTrigger: prepareCheckinDraft });
                      return (
                        <div key={h.id} data-habit-id={h.id}
                          {...action('today.habit.drag.toContext', () => {}, { params: { habitId: h.id, toContextId: ctx.id } })}
                          onPointerDown={onTilePointerDown(h.id)} onPointerUp={onTilePointerUp}
                          onPointerCancel={onTilePointerUp}
                          className="flex flex-col items-center"
                          style={dragging === h.id ? { opacity: 0.5, transform: 'scale(1.08)' } : undefined}>
                          {/* R4:未打卡=虚线边,已完成=实心。
                              形状由「个性化 → 边框」驱动(s258):圆形 / 圆角矩形 */}
                          <button {...tileBind}
                            className="relative flex items-center justify-center"
                            style={{
                              width: tileSize, height: tileSize, borderRadius: tileRadius,
                              ...(done
                                ? { background: h.color, color: '#fff' }
                                : { border: `2px dashed ${h.color}55`, color: h.color }),
                            }}>
                            {h.iconStyle === 'text' && h.iconText
                              ? <span className="text-xl">{h.iconText}</span>
                              : <IconRenderer name={h.icon} size={tileSize * 0.44} />}
                            {status === 'failed' && (
                              <span className="absolute inset-0 flex items-center justify-center text-2xl"
                                style={{ background: '#fff', color: colors.stateFail, borderRadius: tileRadius }}>／</span>
                            )}
                          </button>
                          <span className="mt-1.5 max-w-full truncate text-xs text-app-text">{text(h.name)}</span>
                          {done && (
                            <span className="mt-0.5 flex items-center gap-0.5 text-[11px]" style={{ color: colors.vip }}>
                              +{h.reward} <IcSun size={10} />
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </section>
      </div>

      {/* ===== URL 驱动弹层 ===== */}
      {sheet === 'addmenu' && <AddMenuSheet />}
      {sheet === 'checkin' && <CheckinSheet habitId={sheetHabitId} dateKey={dateKey} />}
      {sheet === 'checkintime' && <TimePickerSheet dateKey={dateKey} />}
      {sheet === 'checkinmore' && <CheckinMoreSheet habitId={sheetHabitId} onBack={back} />}
      {dialog === 'alldone' && (
        <Dialog>
          <div className="pb-2 pt-1 text-center">
            <div className="text-3xl">🎉</div>
            <div className="mt-2 text-base font-bold text-[#212121]">You are the BEST!</div>
            <div className="mt-1 text-sm text-[#9AA5B1]">{s.allDoneTitle}</div>
            <button {...bindTap('today.alldone.card')}
              className="mt-4 w-full rounded-full py-2.5 text-sm font-semibold text-[#5B4718]" style={{ background: colors.brand }}>
              领取{s.quickTodayCard}
            </button>
            <button {...action('today.alldone.share', () => {
              const habitNames = sched.map((habit) => text(habit.name)).join('、');
              const launched = sharePlainText(`【${s.todayTitle}】${habitNames}`, {
                onResult: (result) => { if (result.resultCode === 'OK') st.showToast(s.shareSuccess); },
              });
              if (!launched) st.showNotice(s.notAvailable);
            })}
              className="mt-2 w-full rounded-full bg-[#F2F3F5] py-2.5 text-sm text-[#424242]">分享习惯模板</button>
            <button {...bindBack()} className="mt-3 text-xs text-[#B9BEC7]">关闭</button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

const QuickChip: React.FC<{ label: string; bind: Record<string, any> }> = ({ label, bind }) => (
  <button {...bind} className="shrink-0 rounded-xl bg-app-surface px-3.5 py-2 text-[13px] text-app-text shadow-sm">
    {label}
  </button>
);

const RoundBtn: React.FC<{ bind: Record<string, any>; children: React.ReactNode }> = ({ bind, children }) => (
  <button {...bind} className="flex h-8 w-8 items-center justify-center rounded-full bg-app-surface text-app-text-muted shadow-sm">
    {children}
  </button>
);

/** 顶栏 + 菜单(9 项,s217) */
function AddMenuSheet() {
  const { bindTap } = useXiaorichangGestures();
  const s = useStrings();
  return (
    <Sheet>
      <MenuRow label={`+ ${s.habitNew}`} {...bindTap('today.addmenu.habit')} />
      <MenuRow label={`+ ${s.habitTemplates}`} {...bindTap('today.addmenu.template')} />
      <MenuRow label={`+ ${s.habitGroupNew}`} {...bindTap('today.addmenu.group')} />
      <MenuRow label={`+ ${s.quickTodo}`} {...bindTap('today.addmenu.todo')} />
      <MenuRow label={`+ ${s.quickNote}`} {...bindTap('today.addmenu.note')} />
      <MenuRow label={`+ ${s.focusStart}`} {...bindTap('today.addmenu.focus')} />
      <div className="mx-6 my-1 border-t border-[#F2F2F2]" />
      <MenuRow label={s.quickTimeline} {...bindTap('today.addmenu.timeline')} />
      <MenuRow label={s.moduleManage} {...bindTap('today.addmenu.modules')} />
      <MenuRow label={s.personalize} {...bindTap('today.addmenu.theme')} />
    </Sheet>
  );
}

/** 打卡弹层(s158-s161)。三态计分:done=+r / fail=−r / pending=0(R1+R2+s222)。 */
function CheckinSheet({ habitId, dateKey }: { habitId: string; dateKey: string }) {
  const { bindTap, action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const st = useXiaorichangStore();
  const habit = st.habits.find((h) => h.id === habitId);
  const log = st.logs.find((l) => l.habitId === habitId && l.date === dateKey);
  const rawDraft = (st._temp.draft ?? {}) as {
    checkinHabitId?: string; status?: CheckinStatus; note?: string; quantity?: number; checkinStampTs?: number;
  };
  const draft = rawDraft.checkinHabitId === habitId ? rawDraft : {};
  const status: CheckinStatus = draft.status ?? log?.status ?? 'done';
  const note = draft.note ?? log?.note ?? '';
  const quantity = draft.quantity ?? log?.quantity ?? habit?.quantify?.target ?? 0;
  const checkinDate = TimeService.fromTimestamp(TimeService.parseToTimestamp(dateKey));
  const currentTime = TimeService.getDate();
  const defaultStampTs = TimeService.fromLocalParts(
    checkinDate.getFullYear(), checkinDate.getMonth(), checkinDate.getDate(),
    currentTime.getHours(), currentTime.getMinutes(),
  ).getTime();
  const selectedStamp = TimeService.fromTimestamp(draft.checkinStampTs ?? defaultStampTs);
  if (!habit) return null;

  const stamp = () => {
    const d = TimeService.getDate();
    const hhmm = `【${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}】`;
    st.setDraft({ note: note + hhmm }); // 追加,不覆盖(R1)
  };
  const StateBtn = ({ v, id, label, bind }: { v: CheckinStatus; id: string; label: string; bind: Record<string, any> }) => {
    void id;
    return (
      <button {...bind} className="flex-1 rounded-2xl py-3 text-sm font-semibold"
        style={status === v
          ? { background: v === 'failed' ? colors.stateFail : v === 'done' ? habit.color : '#9AA5B1', color: '#fff' }
          : { background: '#F5F6F7', color: '#9AA5B1' }}>
        {label}
      </button>
    );
  };

  return (
    <Sheet>
      <div className="px-5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: habit.color, color: '#fff' }}>
              <IconRenderer name={habit.icon} size={18} />
            </span>
            <span className="text-base font-bold text-[#212121]">{text(habit.name)}</span>
          </div>
          <div className="flex items-center gap-2 text-[#9AA5B1]">
            <button {...bindTap('checkin.focus.open', { params: { habitId } })} aria-label="番茄钟"><IcTomato size={18} /></button>
            <button {...bindTap('checkin.focus.customDuration.open')} aria-label="自定义时长"><IcPlus size={16} /></button>
            <button {...bindTap('checkin.habit.edit', {
              params: { habitId },
              beforeTrigger: () => rememberEditedHabit(habitId),
            })} aria-label="编辑"><IcPen size={16} /></button>
            <button {...bindTap('checkin.tutorial.open')} aria-label="教程"><IcHelp size={17} /></button>
            <button {...bindTap('checkin.moremenu.open')} aria-label="更多"><IcMoreH size={18} /></button>
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <StateBtn v="done" id="checkin.state.select.done" label={s.statusDone}
            bind={action('checkin.state.select.done', () => st.setDraft({ status: 'done' }))} />
          <StateBtn v="pending" id="checkin.state.select.undone" label={s.statusPending}
            bind={action('checkin.state.select.undone', () => st.setDraft({ status: 'pending' }))} />
          <StateBtn v="failed" id="checkin.state.select.fail" label={s.statusFailed}
            bind={action('checkin.state.select.fail', () => st.setDraft({ status: 'failed' }))} />
        </div>

        {habit.quantify?.enabled && (
          <label className="mt-3 flex items-center gap-3 rounded-2xl bg-[#F8F8F8] px-4 py-3 text-sm text-[#424242]">
            <span className="shrink-0">完成数量</span>
            <input
              {...action('checkin.quantity.input', () => {}, { params: { value: quantity } })}
              aria-label={`完成数量（${habit.quantify.unit}）`}
              type="number"
              min="0"
              step="0.1"
              value={quantity}
              onChange={(e) => st.setDraft({ quantity: Number(e.target.value) })}
              className="min-w-0 flex-1 rounded-xl bg-white px-3 py-2 text-right outline-none"
            />
            <span className="shrink-0 text-[#9AA5B1]">{habit.quantify.unit}</span>
          </label>
        )}

        <div className="mt-3 rounded-2xl bg-[#F8F8F8] p-3">
          <textarea
            {...action('checkin.log.input', () => {}, { params: { value: note } })}
            value={note} onChange={(e) => st.setDraft({ note: e.target.value })}
            placeholder={s.noteWriteSomething}
            className="h-16 w-full resize-none bg-transparent text-sm outline-none" />
          <div className="flex items-center justify-between text-[#9AA5B1]">
            <div className="flex gap-3">
              <button {...action('checkin.log.stamp', stamp)} aria-label="插入时间戳"><IcClock size={17} /></button>
              <button {...bindTap('checkin.timepicker.open')}
                className="rounded-full bg-white px-2 py-0.5 text-xs">
                {`${selectedStamp.getHours()}`.padStart(2, '0')}:{`${selectedStamp.getMinutes()}`.padStart(2, '0')} / {`${selectedStamp.getMonth() + 1}`.padStart(2, '0')}月{`${selectedStamp.getDate()}`.padStart(2, '0')}日
              </button>
            </div>
            <button {...bindTap('checkin.note.expand', {
              beforeTrigger: () => st.setDraft({ checkinHabitId: habitId }),
            })} className="text-xs">↗ 全屏</button>
          </div>
        </div>

        <button
          {...action('checkin.sheet.commit', () => {
            st.setCheckin(habitId, dateKey, status, {
              note: note || undefined,
              quantity: habit.quantify?.enabled ? quantity : undefined,
              stampTs: draft.checkinStampTs,
            });
            st.setDraft(null);
            back();
          })}
          className="mt-4 w-full rounded-full py-3 text-[15px] font-bold text-[#5B4718]"
          style={{ background: colors.brand }}>
          {s.confirm}
        </button>
      </div>
    </Sheet>
  );
}

/** 打卡时间点(s160 双滚轮) */
function TimePickerSheet({ dateKey }: { dateKey: string }) {
  const { action } = useXiaorichangGestures();
  const s = useStrings();
  const st = useXiaorichangStore();
  const draft = (st._temp.draft ?? {}) as { checkinStampTs?: number };
  const checkinDate = TimeService.fromTimestamp(TimeService.parseToTimestamp(dateKey));
  const currentTime = TimeService.getDate();
  const defaultStampTs = TimeService.fromLocalParts(
    checkinDate.getFullYear(), checkinDate.getMonth(), checkinDate.getDate(),
    currentTime.getHours(), currentTime.getMinutes(),
  ).getTime();
  const d = TimeService.fromTimestamp(draft.checkinStampTs ?? defaultStampTs);
  const [hour, setHour] = useState(d.getHours());
  const [minute, setMinute] = useState(d.getMinutes());
  const updateStamp = (nextHour: number, nextMinute: number) => {
    st.setDraft({
      checkinStampTs: TimeService.fromLocalParts(
        d.getFullYear(), d.getMonth(), d.getDate(), nextHour, nextMinute,
      ).getTime(),
    });
  };
  return (
    <Sheet title={s.checkinTime}>
      <div className="flex justify-center gap-6 px-8 py-4">
        <select {...action('checkin.time.hour', () => {}, { params: { value: hour } })}
          value={hour} onChange={(e) => {
            const value = Number(e.target.value);
            setHour(value);
            updateStamp(value, minute);
          }}
          className="rounded-xl bg-[#F5F6F7] px-4 py-2 text-lg" size={5}>
          {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{`${i}`.padStart(2, '0')}</option>)}
        </select>
        <select {...action('checkin.time.minute', () => {}, { params: { value: minute } })}
          value={minute} onChange={(e) => {
            const value = Number(e.target.value);
            setMinute(value);
            updateStamp(hour, value);
          }}
          className="rounded-xl bg-[#F5F6F7] px-4 py-2 text-lg" size={5}>
          {Array.from({ length: 60 }, (_, i) => <option key={i} value={i}>{`${i}`.padStart(2, '0')}</option>)}
        </select>
      </div>
    </Sheet>
  );
}

/** 打卡弹层 ⋯ 菜单(s218) */
function CheckinMoreSheet({ habitId, onBack }: { habitId: string; onBack: (n?: number) => void }) {
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const st = useXiaorichangStore();
  const { dialogs, confirm } = useDialogs();
  return (
    <Sheet>
      <MenuRow label={s.habitEdit} {...bindTap('checkin.more.edit', {
        params: { habitId },
        beforeTrigger: () => rememberEditedHabit(habitId),
      })} />
      <MenuRow label={s.habitViewLogs} {...bindTap('checkin.more.logs', { params: { habitId } })} />
      <MenuRow label={s.habitDelete} danger
        {...action('checkin.more.deleteHabit', () => confirm({
          title: `${s.habitDelete}?`, desc: '该习惯及其全部打卡记录都会被删除', danger: true,
          onConfirm: () => { st.deleteHabit(habitId); onBack(2); },
        }), { params: { habitId } })} />
      {dialogs}
    </Sheet>
  );
}

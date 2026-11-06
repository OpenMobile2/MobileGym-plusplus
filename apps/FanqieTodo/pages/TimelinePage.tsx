import React from 'react';
import { useLocation } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import {
  appTodayDay,
  appTodayMonth,
  appTodayYear,
  dayKey,
  dayStartMs,
  getAppTodayMs,
} from '../utils/appTime';
import {
  IcBack, IcCheck, IcChevronRight, IcClose, IcGrid, IcPlus, IcShare, IcSort, IcToday, IcWeek,
} from '../res/icons';

const WEEK = ['一', '二', '三', '四', '五', '六', '日'];

function hm(ts: number) {
  const d = TimeService.fromTimestamp(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function TimelinePage() {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const sheet = sp.get('sheet');
  const recordId = sp.get('recordId') ?? '';
  const records = useFanqieTodoStore((s) => s.records);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const { bindTap, action } = useFanqieTodoGestures();
  const { t } = useI18n();

  const todayDay = appTodayDay();
  const todayMonth = appTodayMonth();
  const todayYear = appTodayYear();
  const [viewYear, setViewYear] = React.useState(todayYear);
  const [viewMonth, setViewMonth] = React.useState(todayMonth); // 0-11
  const [selectedDay, setSelectedDay] = React.useState(todayDay);
  const [sortAsc, setSortAsc] = React.useState(false);

  const daysInMonth = TimeService.fromLocalParts(viewYear, viewMonth + 1, 0).getDate();
  // 月初是周几(把周日=0 转为网格:周一为首列)
  const firstDow = TimeService.fromLocalParts(viewYear, viewMonth, 1).getDay();
  const leading = firstDow === 0 ? 6 : firstDow - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const selectedMs = TimeService.fromLocalParts(viewYear, viewMonth, selectedDay).getTime();
  const selectedKey = dayKey(selectedMs);
  const todayMs = getAppTodayMs();

  const dayRecords = records
    .filter((r) => dayKey(r.startTs) === selectedKey)
    .slice()
    .sort((a, b) => (sortAsc ? a.startTs - b.startTs : b.startTs - a.startTs));

  const goToday = () => {
    setViewYear(todayYear);
    setViewMonth(todayMonth);
    setSelectedDay(todayDay);
    showToast('跳转至今日');
  };

  const shiftMonth = (dir: -1 | 1) => {
    const d = TimeService.fromLocalParts(viewYear, viewMonth + dir, 1);
    const y = d.getFullYear();
    const m = d.getMonth();
    // 不允许翻到未来月
    if (y > todayYear || (y === todayYear && m > todayMonth)) return;
    setViewYear(y);
    setViewMonth(m);
    const maxD = TimeService.fromLocalParts(y, m + 1, 0).getDate();
    // 优先停在该月有记录的一天
    const monthRecs = records.filter((r) => {
      const rd = TimeService.fromTimestamp(r.startTs);
      return rd.getFullYear() === y && rd.getMonth() === m;
    });
    if (monthRecs.length > 0) {
      const daysWith = [...new Set(monthRecs.map((r) => TimeService.fromTimestamp(r.startTs).getDate()))].sort((a, b) => b - a);
      setSelectedDay(daysWith[0]);
    } else {
      setSelectedDay(Math.min(selectedDay, maxD));
    }
  };

  const monthRecCount = records.filter((r) => {
    const rd = TimeService.fromTimestamp(r.startTs);
    return rd.getFullYear() === viewYear && rd.getMonth() === viewMonth;
  }).length;

  return (
    <div className="relative flex h-full flex-col bg-[var(--app-c-page-tint)]" data-status-bar-foreground="dark">
      <div className="flex items-center justify-between px-3 pb-1 pt-10">
        <div className="flex items-center gap-1">
          <button {...action('timeline.month.prev.action', () => shiftMonth(-1))} aria-label="上一月" className="p-1 text-[var(--app-text-muted)]">
            <IcBack size={20} />
          </button>
          <button
            {...bindTap('timeline.month.open')}
            className="min-w-[120px] text-center text-lg font-bold text-[var(--app-text)]"
          >
            {viewYear}年{viewMonth + 1}月
          </button>
          <button {...action('timeline.month.next.action', () => shiftMonth(1))} aria-label="下一月" className="p-1 text-[var(--app-text-muted)]">
            <IcChevronRight size={20} />
          </button>
        </div>
        <span className="pr-1 text-[11px] text-[var(--app-text-muted)]">{monthRecCount > 0 ? `${monthRecCount}条记录` : '无记录'}</span>
      </div>

      <div className="flex-1 overflow-y-auto" data-scroll-container="main" data-scroll-direction="vertical">
        <div className="bg-gradient-to-b from-[#EAF2FB] to-white px-3 pb-2">
          <div className="grid grid-cols-7 text-center text-xs text-[#8A8F99]">{WEEK.map((w) => <div key={w} className="py-1">{w}</div>)}</div>
          <div className="grid grid-cols-7 text-center text-sm">
            {Array.from({ length: leading }).map((_, i) => <div key={`pad-${i}`} className="py-1.5" />)}
            {days.map((d) => {
              const sel = d === selectedDay;
              const cellMs = TimeService.fromLocalParts(viewYear, viewMonth, d).getTime();
              const hasRec = records.some((r) => dayKey(r.startTs) === dayKey(cellMs));
              const isToday = sameDayMs(cellMs, todayMs);
              return (
                <button key={d} {...action('timeline.date.select.action', () => setSelectedDay(d), { params: { day: d } })}
                  className={`py-1.5 ${sel ? 'font-bold text-white' : isToday ? 'font-semibold text-[#4A90D9]' : 'text-[#333]'}`}>
                  <span className={`relative inline-flex h-7 w-7 items-center justify-center ${
                    sel ? 'rounded-full bg-[#4A90D9]' : isToday && !sel ? 'rounded-full border border-[#4A90D9]' : ''
                  }`}>
                    {d}
                    {!sel && hasRec && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#4A90D9]" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 工具行:点阵 / 今 / 一周总结 / 补记 / 分享 / 排序 */}
        <div className="flex items-center justify-around border-b border-[var(--app-border)] bg-[var(--app-surface)] px-1 py-2.5 text-[var(--app-text)]">
          <button {...action('timeline.grid.wontfixToast', () => showToast('点阵时间轴功能暂未开放'))} aria-label="点阵时间轴">
            <IcGrid size={20} />
          </button>
          <button {...action('timeline.today.action', goToday)} aria-label="跳转至今日" className="text-[#4A90D9]">
            <IcToday size={22} />
          </button>
          <button {...bindTap('timeline.week.open')} aria-label="一周总结">
            <IcWeek size={20} />
          </button>
          <button {...bindTap('timeline.add.open')} aria-label="补记" className="text-[#4A90D9]">
            <IcPlus size={26} strokeWidth={2.2} />
          </button>
          <button {...bindTap('timeline.share.open')} aria-label="分享">
            <IcShare size={20} />
          </button>
          <button
            {...action('timeline.sort.toggle.action', () => {
              setSortAsc((v) => !v);
              showToast(sortAsc ? '已切换为倒序' : '已切换为正序');
            })}
            aria-label="排序"
            className={sortAsc ? 'text-[#4A90D9]' : 'text-[#555]'}
          >
            <IcSort size={20} />
          </button>
        </div>

        <div className="p-3">
          {dayRecords.length === 0 ? (
            <div className="mt-16 text-center text-sm text-[#8A8F99]">{t('timeline.noRecord')}</div>
          ) : (
            dayRecords.map((r) => (
              <button key={r.id} {...bindTap('timeline.record.open', { params: { recordId: r.id } })}
                className="mb-2 flex w-full items-start gap-3 rounded-xl bg-white p-3 text-left">
                <div className="w-14 shrink-0 text-xs text-[#8A8F99]">{hm(r.startTs)}<br />{hm(r.endTs)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between"><span className="font-semibold text-[#222]">{r.todoName}</span><span className="text-xs text-[#8A8F99]">{t('timeline.done')}</span></div>
                  <div className="mt-1 text-xs text-[#B8BCC4]">{r.reflection || t('timeline.fillNote')}</div>
                  {r.durationMin > 0 && <div className="mt-1 text-xs text-[#8A8F99]">{r.durationMin >= 60 ? `${Math.floor(r.durationMin / 60)} 小时 ${r.durationMin % 60} 分钟` : `${r.durationMin} 分钟`} · {r.percent ?? 100}%</div>}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {sheet === 'record' && <RecordDetail recordId={recordId} />}
      {sheet === 'note' && <NoteDialog recordId={recordId} />}
      {sheet === 'addrecord' && <AddRecordSheet selectedDayMs={selectedMs} />}
      {sheet === 'monthpick' && (
        <MonthPicker
          year={viewYear}
          month={viewMonth}
          onConfirm={(y, m) => {
            setViewYear(y);
            setViewMonth(m);
            const maxD = TimeService.fromLocalParts(y, m + 1, 0).getDate();
            setSelectedDay((d) => Math.min(d, maxD));
          }}
        />
      )}
    </div>
  );
}

function sameDayMs(a: number, b: number) {
  return dayKey(a) === dayKey(b);
}

const WHEEL_ITEM_H = 40;
const WHEEL_VISIBLE = 5; // 奇数,中间为选中

/** 滚轮列:PointerEvent 拖动 + 滚轮,吸附到选项(对齐真机「选择月份」) */
function WheelColumn({
  values,
  value,
  onChange,
  suffix,
  scrollName,
}: {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  suffix: string;
  scrollName: string;
}) {
  const viewportH = WHEEL_ITEM_H * WHEEL_VISIBLE;
  const pad = Math.floor(WHEEL_VISIBLE / 2) * WHEEL_ITEM_H;
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const dragRef = React.useRef<{ active: boolean; startY: number; startScroll: number; pointerId: number } | null>(null);
  const snapTimer = React.useRef<number | null>(null);
  const [visual, setVisual] = React.useState(value);
  const indexOf = (v: number) => Math.max(0, values.indexOf(v));

  const scrollToIndex = React.useCallback((idx: number, smooth = false) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ top: idx * WHEEL_ITEM_H, behavior: smooth ? 'smooth' : 'auto' });
  }, []);

  const idxFromScroll = () => {
    const el = scrollerRef.current;
    if (!el) return 0;
    return Math.max(0, Math.min(values.length - 1, Math.round(el.scrollTop / WHEEL_ITEM_H)));
  };

  const snapFromScroll = React.useCallback(() => {
    const idx = idxFromScroll();
    scrollToIndex(idx, true);
    const next = values[idx];
    setVisual(next);
    if (next !== value) onChange(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onChange, scrollToIndex, value, values]);

  React.useEffect(() => {
    scrollToIndex(indexOf(value), false);
    setVisual(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (snapTimer.current != null) window.clearTimeout(snapTimer.current);
    el.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startY: e.clientY, startScroll: el.scrollTop, pointerId: e.pointerId };
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (!drag?.active || !el) return;
    el.scrollTop = drag.startScroll - (e.clientY - drag.startY);
    setVisual(values[idxFromScroll()]);
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (!drag?.active || !el) return;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    snapFromScroll();
  };

  return (
    <div className="relative flex flex-1 items-center">
      <div
        ref={scrollerRef}
        className="w-full overflow-y-auto overscroll-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ height: viewportH, touchAction: 'none' }}
        data-scroll-container={scrollName}
        data-scroll-direction="vertical"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={() => {
          if (snapTimer.current != null) window.clearTimeout(snapTimer.current);
          snapTimer.current = window.setTimeout(() => snapFromScroll(), 100);
        }}
        onScroll={() => {
          if (dragRef.current?.active) return;
          setVisual(values[idxFromScroll()]);
        }}
      >
        <div style={{ height: pad }} />
        {values.map((v) => {
          const selected = v === visual;
          return (
            <div
              key={v}
              className={`flex items-center justify-center text-[17px] ${selected ? 'font-semibold text-[#222]' : 'text-[#C0C4CC]'}`}
              style={{ height: WHEEL_ITEM_H }}
            >
              {v}
            </div>
          );
        })}
        <div style={{ height: pad }} />
      </div>
      <span className="pointer-events-none absolute right-2 text-[15px] text-[#222]">{suffix}</span>
      <div
        className="pointer-events-none absolute inset-x-3 border-y border-[#E5E5E5]"
        style={{ top: pad, height: WHEEL_ITEM_H }}
      />
    </div>
  );
}

function MonthPicker({
  year, month, onConfirm,
}: {
  year: number; month: number; onConfirm: (y: number, m: number) => void;
}) {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const [y, setY] = React.useState(year);
  const [m, setM] = React.useState(month); // 0-11
  const years = Array.from({ length: 11 }, (_, i) => year - 5 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // 显示 1-12

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 mx-8 w-full max-w-[300px] rounded-2xl bg-white px-4 pb-4 pt-5 shadow-xl">
        <div className="mb-2 text-[16px] font-semibold text-[#222]">选择月份</div>
        <div className="flex items-stretch px-2">
          <WheelColumn
            values={years}
            value={y}
            onChange={setY}
            suffix="年"
            scrollName="monthYear"
          />
          <WheelColumn
            values={months}
            value={m + 1}
            onChange={(mm) => setM(mm - 1)}
            suffix="月"
            scrollName="monthNum"
          />
        </div>
        <div className="mt-4 flex justify-end gap-8 px-2 text-[15px] text-[#4A90D9]">
          <button {...action('timeline.month.cancel.action', () => back())}>取消</button>
          <button {...action('timeline.month.confirm.action', () => { onConfirm(y, m); back(); })}>确定</button>
        </div>
      </div>
    </div>
  );
}

function AddRecordSheet({ selectedDayMs }: { selectedDayMs: number }) {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const todos = useFanqieTodoStore((s) => s.todos);
  const addManualRecord = useFanqieTodoStore((s) => s.addManualRecord);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const now = TimeService.getDate();
  const [hour, setHour] = React.useState(now.getHours());
  const [minute, setMinute] = React.useState(now.getMinutes());
  const [duration, setDuration] = React.useState<number | null>(null);
  const [todoId, setTodoId] = React.useState('');
  const [pick, setPick] = React.useState<'time' | 'duration' | 'todo' | null>(null);
  const [durInput, setDurInput] = React.useState('');
  const [todoQuery, setTodoQuery] = React.useState('');

  const timeLabel = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  const todoName = todos.find((t) => t.id === todoId)?.name;
  const filteredTodos = todos.filter((t) => !todoQuery || t.name.includes(todoQuery));

  const submit = () => {
    if (duration == null || duration <= 0) {
      showToast('请设置专注时长');
      return;
    }
    if (!todoId) {
      showToast('请选择待办');
      return;
    }
    const startTs = dayStartMs(selectedDayMs) + hour * 3600000 + minute * 60000;
    addManualRecord({ todoId, startTs, durationMin: duration });
    showToast('已添加补记');
    back();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-4 w-full max-w-[340px] rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-4 text-center text-base font-semibold text-[#222]">补记专注记录</div>
        <Row label="专注开始时间" value={timeLabel} placeholder="点击选择" actionId="timeline.add.startTime.action" onClick={() => setPick('time')} />
        <Row
          label="专注时长"
          value={duration != null ? `${duration} 分钟` : ''}
          placeholder="点击设置"
          actionId="timeline.add.duration.action"
          onClick={() => { setDurInput(duration != null ? String(duration) : ''); setPick('duration'); }}
        />
        <Row label="专注于哪个待办" value={todoName ?? ''} placeholder="点击选择" actionId="timeline.add.todo.action" onClick={() => setPick('todo')} />
        <p className="mt-3 text-[11px] leading-relaxed text-[#8A8F99]">
          本功能仅作为计时数据的补充以供自我回顾，因此有以下限制：
          <br />*手动添加的记录不会参与自习室排名
        </p>
        <button
          {...action('timeline.add.submit.commit', submit)}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-[#F8E4E6] py-3 text-sm font-semibold text-[#E5533C]"
        >
          添加记录
        </button>
      </div>

      {pick === 'time' && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-[#4A90D9] px-4 py-2.5 text-sm text-white">
            <button {...action('timeline.add.time.cancel.action', () => setPick(null))}>取消</button>
            <span>选择时间(24小时制)</span>
            <button {...action('timeline.add.time.confirm.action', () => setPick(null))}>确定</button>
          </div>
          <div className="flex h-48">
            <div className="flex-1 overflow-y-auto" data-scroll-container="timeHour" data-scroll-direction="vertical">
              {Array.from({ length: 24 }, (_, h) => (
                <button key={h} type="button" onClick={() => setHour(h)}
                  className={`block w-full py-2 text-center text-sm ${h === hour ? 'font-semibold text-[#4A90D9]' : 'text-[#555]'}`}>
                  {h} 点
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto" data-scroll-container="timeMinute" data-scroll-direction="vertical">
              {Array.from({ length: 60 }, (_, m) => (
                <button key={m} type="button" onClick={() => setMinute(m)}
                  className={`block w-full py-2 text-center text-sm ${m === minute ? 'font-semibold text-[#4A90D9]' : 'text-[#555]'}`}>
                  {m} 分
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {pick === 'duration' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setPick(null)} />
          <div className="relative z-10 mx-8 w-full max-w-[280px] rounded-2xl bg-white p-4 shadow-xl">
            <input
              autoFocus type="number" inputMode="numeric" value={durInput}
              onChange={(e) => setDurInput(e.target.value)}
              placeholder="专注时长(分钟)"
              className="w-full border-b border-[#DCEBFB] pb-2 text-center text-sm outline-none"
            />
            <div className="mt-2 text-center text-[11px] text-[#8A8F99]">您可以添加不超过480分钟的记录</div>
            <div className="mt-4 flex gap-3">
              <button {...action('timeline.add.duration.cancel.action', () => setPick(null))} className="flex-1 rounded-lg bg-[#F1F3F5] py-2 text-sm">取消</button>
              <button
                {...action('timeline.add.duration.confirm.action', () => {
                  const n = parseInt(durInput, 10);
                  if (!Number.isFinite(n) || n <= 0) { showToast('请输入有效时长'); return; }
                  setDuration(Math.min(480, n));
                  setPick(null);
                })}
                className="flex-1 rounded-lg bg-[#F1F3F5] py-2 text-sm text-[#4A90D9]"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {pick === 'todo' && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <div {...action('timeline.add.todo.cancel.action', () => setPick(null))} className="absolute inset-0 bg-black/30" />
          <div className="relative z-10 mx-6 flex max-h-[70%] w-full max-w-[320px] flex-col rounded-2xl bg-white p-4 shadow-xl">
            <div className="mb-3 text-center text-base font-semibold">选择待办</div>
            <input
              value={todoQuery}
              onChange={(e) => setTodoQuery(e.target.value)}
              placeholder="搜索待办..."
              className="mb-3 rounded-lg bg-[#F1F3F5] px-3 py-2 text-sm outline-none"
            />
            <div className="min-h-0 flex-1 overflow-y-auto" data-scroll-container="todoPick" data-scroll-direction="vertical">
              {filteredTodos.map((todo) => (
                <button
                  key={todo.id}
                  {...action('timeline.add.todo.select.action', () => { setTodoId(todo.id); setPick(null); }, { params: { todoId: todo.id } })}
                  className="mb-2 block w-full rounded-lg bg-[#F7F8FA] px-3 py-2.5 text-left text-sm"
                >
                  {todo.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({
  label, value, placeholder, actionId, onClick,
}: {
  label: string; value: string; placeholder: string; actionId: string; onClick: () => void;
}) {
  const { action } = useFanqieTodoGestures();
  return (
    <div className="flex items-center justify-between border-b border-[#F0F0F0] py-3 text-sm">
      <span className="text-[#333]">{label}</span>
      <button {...action(actionId, onClick)} className="rounded-full bg-[#EAF2FB] px-3 py-1 text-[#4A90D9]">
        {value || placeholder}
      </button>
    </div>
  );
}

function RecordDetail({ recordId }: { recordId: string }) {
  const { bindTap, bindBack, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const rec = useFanqieTodoStore((x) => x.records.find((r) => r.id === recordId));
  const [editing, setEditing] = React.useState(false);
  const [name, setName] = React.useState('');
  const [dur, setDur] = React.useState('');
  const startEdit = () => { setName(rec?.todoName ?? ''); setDur(String(rec?.durationMin ?? 0)); setEditing(true); };
  const saveEdit = () => {
    const n = parseInt(dur, 10);
    s.updateRecord(recordId, { todoName: name.trim() || rec?.todoName || '', durationMin: Number.isFinite(n) && n >= 0 ? n : (rec?.durationMin ?? 0) });
    setEditing(false);
  };
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-3 w-full max-w-[340px] rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-semibold">{editing ? '修改记录' : (rec?.todoName ?? '记录')}</span>
          {editing ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(false)} aria-label="取消"><IcClose size={20} /></button>
              <button onClick={saveEdit} aria-label="保存" className="text-[#4A90D9]"><IcCheck size={22} /></button>
            </div>
          ) : (
            <button {...bindBack()} aria-label="关闭"><IcClose size={20} /></button>
          )}
        </div>
        {editing ? (
          <div className="mb-3 flex flex-col gap-2">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="待办名称"
              className="border-b border-[#DCEBFB] pb-1 text-sm outline-none" />
            <div className="flex items-center gap-2">
              <input type="number" inputMode="numeric" value={dur} onChange={(e) => setDur(e.target.value)} placeholder="专注时长"
                className="flex-1 border-b border-[#DCEBFB] pb-1 text-sm outline-none" />
              <span className="text-sm text-[#8A8F99]">分钟</span>
            </div>
          </div>
        ) : (
          <div className="mb-3 flex gap-2">
            <button {...action('timeline.record.edit.action', startEdit)} className="flex-1 rounded-lg bg-[#EAF2FB] py-2 text-sm text-[#4A90D9]">修改记录</button>
            <button {...action('timeline.record.delete.action', () => { s.deleteRecord(recordId); back(); })} className="flex-1 rounded-lg bg-[#FDECEC] py-2 text-sm text-[#E5533C]">删除</button>
          </div>
        )}
        <div className="mb-3 rounded-lg bg-[#F7F8FA] p-3 text-sm text-[#555]">
          <div className="flex justify-between py-0.5"><span>专注时长</span><span>{rec?.durationMin ?? 0} 分钟</span></div>
          <div className="flex justify-between py-0.5"><span>计时状态</span><span>已完成</span></div>
        </div>
        <button {...bindTap('timeline.record.note', { params: { recordId } })} className="w-full rounded-lg bg-[#F7F8FA] py-3 text-center text-sm font-medium text-[#222]">点击填写心得</button>
      </div>
    </div>
  );
}

function NoteDialog({ recordId }: { recordId: string }) {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const { t } = useI18n();
  const [text, setText] = React.useState('');
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-3 w-full max-w-[340px] rounded-2xl bg-white p-4 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-base font-semibold">{t('note.title')}</span>
          <button {...action('timeline.note.commit.action', () => { if (recordId) s.addRecordNote(recordId, text); back(); })} aria-label="保存"><IcCheck size={22} /></button>
        </div>
        <textarea {...action('timeline.note.input', () => {}, { params: { value: text } })}
          value={text} onChange={(e) => setText(e.target.value)}
          placeholder={t('note.placeholder')} rows={5}
          className="w-full resize-none border-b border-[#DCEBFB] pb-1 text-sm text-[#4A90D9] outline-none" />
      </div>
    </div>
  );
}

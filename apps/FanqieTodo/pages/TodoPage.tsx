import React from 'react';
import { useLocation } from 'react-router-dom';
import { useFanqieTodoStore } from '../state';
import { useFanqieTodoGestures } from '../hooks/useFanqieTodoGestures';
import { useI18n } from '../i18n';
import { cardBgUrl } from '../assets';
import { IcPlus, IcMore, IcClock, IcCheck, IcClose, IcTrash } from '../res/icons';
import { Switch } from '../components/Switch';
import type { Todo, TodoType, TimingMode } from '../types';

const TYPE_LABEL: Record<TodoType, string> = { normal: 'type.normal', goal: 'type.goal', habit: 'type.habit' };
const TIMING_LABEL: Record<TimingMode, string> = {
  countdown: 'timing.countdown', countup: 'timing.countup', none: 'timing.none',
};

/** 待办卡片 */
function TodoCard({ todo }: { todo: Todo }) {
  const { bindTap, bindLongPress } = useFanqieTodoGestures();
  const { t, locale } = useI18n();
  const bg = cardBgUrl(todo.bgKey);
  const isNoTiming = todo.timing === 'none';
  const subtitle =
    todo.type === 'habit'
      ? `${t(TIMING_LABEL[todo.timing])}-${t('type.habit')}`
      : todo.timing === 'countdown' && todo.durationMin
        ? `${todo.durationMin} ${locale === 'en' ? 'min' : '分钟'}`
        : t(TIMING_LABEL[todo.timing]);

  const lp = bindLongPress('todo.card.menu.open', { params: { todoId: todo.id } });
  return (
    <div
      {...bindTap('todo.card.open', { params: { todoId: todo.id } })}
      {...lp}
      className="relative h-[76px] overflow-hidden rounded-2xl"
      style={{ background: bg ? `center/cover url(${bg})` : todo.bgColor }}
    >
      <div className="absolute inset-0 bg-black/15" />
      <div className="relative flex h-full items-center justify-between px-4">
        <div className="min-w-0">
          <div className="truncate text-[17px] font-semibold text-white drop-shadow">{todo.name}</div>
          <div className="mt-1 text-xs text-white/85 drop-shadow">{subtitle}</div>
        </div>
        <div className="flex flex-col items-end">
          {isNoTiming ? (
            <button {...bindTap('todo.checkin.confirm.open', { params: { todoId: todo.id }, stopPropagation: true })}
              className="border-none bg-transparent text-[19px] font-medium text-white drop-shadow">{t('todo.start')}</button>
          ) : (
            <button {...bindTap('todo.focus.start', { params: { todoId: todo.id }, stopPropagation: true })}
              className="border-none bg-transparent text-[19px] font-medium text-white drop-shadow">{t('todo.start')}</button>
          )}
          {todo.todayFocusCount > 0 && (
            <span className="mt-0.5 text-[11px] text-white/85">{t('todo.todayFocused', { n: todo.todayFocusCount })}</span>
          )}
          {todo.todayDoneCount > 0 && (
            <span className="mt-0.5 text-[11px] text-white/85">{t('todo.todayDone', { n: todo.todayDoneCount })}</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TodoPage() {
  const { search } = useLocation();
  const sp = new URLSearchParams(search);
  const sheet = sp.get('sheet');
  const dialog = sp.get('dialog');
  const todoId = sp.get('todoId') ?? '';
  const todos = useFanqieTodoStore((s) => s.todos);
  const showToast = useFanqieTodoStore((s) => s.showToast);
  const { bindTap, action } = useFanqieTodoGestures();
  const { t } = useI18n();

  const sorted = [...todos].sort((a, b) => a.order - b.order);

  return (
    <div className="flex h-full flex-col bg-[#F4F6F8]" data-status-bar-foreground="light">
      {/* 顶栏(番茄蓝) */}
      <div className="shrink-0 bg-gradient-to-b from-[#5CA4E0] to-[#7FB8E8] px-4 pb-3 pt-10">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[22px] font-bold text-white">{t('todo.title')}</div>
            <button
              {...bindTap('todo.studymode.open.action')}
              className="mt-1 rounded-md bg-white/25 px-2 py-1 text-[12px] text-white"
            >
              {t('todo.studyMode')}
            </button>
          </div>
          <div className="flex items-center gap-3 pt-1 text-white">
            <button {...action('todo.studyroom.wontfixToast', () => showToast(t('toast.studyroom')))}
              aria-label="自习室">
              <span className="inline-flex items-end gap-[2px]">
                <i className="inline-block h-2 w-[3px] rounded-sm bg-white/90" />
                <i className="inline-block h-3.5 w-[3px] rounded-sm bg-white/90" />
                <i className="inline-block h-2.5 w-[3px] rounded-sm bg-white/90" />
              </span>
            </button>
            <button {...bindTap('todo.checkin.open')} aria-label="打卡"><IcClock size={22} /></button>
            <button {...bindTap('todo.add.open')} aria-label="添加"><IcPlus size={24} /></button>
            <button {...bindTap('todo.quickmenu.open')} aria-label="更多"><IcMore size={22} /></button>
          </div>
        </div>
      </div>

      {/* 待办列表 */}
      <div className="flex-1 overflow-y-auto p-3" data-scroll-container="main" data-scroll-direction="vertical">
        {sorted.length === 0 ? (
          <div className="mt-24 text-center text-sm text-[#8A8F99]">{t('todo.empty')}</div>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((todo) => <TodoCard key={todo.id} todo={todo} />)}
          </div>
        )}
      </div>

      {/* 弹窗层(searchParam 驱动) */}
      {sheet === 'add' && <AddDialog mode="add" />}
      {sheet === 'edit' && <AddDialog mode="edit" todoId={todoId} />}
      {sheet === 'addadv' && <AdvancedDialog />}
      {sheet === 'studymode' && <StudyModeDialog />}
      {sheet === 'quickmenu' && <QuickMenuDialog />}
      {sheet === 'cardmenu' && <CardMenuDialog todoId={todoId} />}
      {sheet === 'reorder' && <ReorderDialog />}
      {sheet === 'help' && <HelpDialog />}
      {dialog === 'checkin' && <CheckinConfirmDialog todoId={todoId} />}
    </div>
  );
}

/* ---------------- 弹窗组件 ---------------- */
function Scrim({ children }: { children: React.ReactNode }) {
  const { bindBack } = useFanqieTodoGestures();
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div {...bindBack()} className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 mx-3 w-full max-w-[340px] rounded-2xl bg-white p-4 shadow-xl">
        {children}
      </div>
    </div>
  );
}

const CHIP = 'rounded-lg px-3 py-1.5 text-sm';
const CHIP_ON = `${CHIP} bg-[#DCEBFB] text-[#4A90D9]`;
const CHIP_OFF = `${CHIP} bg-[#F1F3F5] text-[#555]`;

// 静态字面量 id 表(add / edit 各一份;静态分析靠字面量出现即计数)
const M = (a: string, e: string, mode: 'add' | 'edit') => (mode === 'add' ? a : e);
const TYPE_IDS: Record<TodoType, [string, string]> = {
  normal: ['todo.add.type.select.normal', 'todo.edit.type.select.normal'],
  goal: ['todo.add.type.select.goal', 'todo.edit.type.select.goal'],
  habit: ['todo.add.type.select.habit', 'todo.edit.type.select.habit'],
};
const TIMING_IDS: Record<TimingMode, [string, string]> = {
  countdown: ['todo.add.timing.select.countdown', 'todo.edit.timing.select.countdown'],
  countup: ['todo.add.timing.select.countup', 'todo.edit.timing.select.countup'],
  none: ['todo.add.timing.select.none', 'todo.edit.timing.select.none'],
};
type Freq = 'daily' | 'weekly' | 'monthly';
const FREQ_IDS: Record<Freq, [string, string]> = {
  daily: ['todo.add.freq.select.daily', 'todo.edit.freq.select.daily'],
  weekly: ['todo.add.freq.select.weekly', 'todo.edit.freq.select.weekly'],
  monthly: ['todo.add.freq.select.monthly', 'todo.edit.freq.select.monthly'],
};
const FREQ_LABEL: Record<Freq, [string, string]> = {
  daily: ['每天', 'Daily'], weekly: ['每周', 'Weekly'], monthly: ['每月', 'Monthly'],
};

function AddDialog({ mode, todoId }: { mode: 'add' | 'edit'; todoId?: string }) {
  const { bindTap, bindBack, action, back } = useFanqieTodoGestures();
  const { t, locale } = useI18n();
  const store = useFanqieTodoStore();
  const existing = mode === 'edit' ? store.todos.find((x) => x.id === todoId) : undefined;
  const [name, setName] = React.useState(existing?.name ?? '');
  const [type, setType] = React.useState<TodoType>(existing?.type ?? 'normal');
  const [timing, setTiming] = React.useState<TimingMode>(existing?.timing ?? 'countdown');
  const preset = existing && [25, 35].includes(existing.durationMin);
  const [dur, setDur] = React.useState<number>(existing?.durationMin ?? 25);
  const [customMin, setCustomMin] = React.useState<number | null>(
    existing && !preset ? existing.durationMin : null);
  const [showCustom, setShowCustom] = React.useState(false);
  const [customInput, setCustomInput] = React.useState('');
  const [freq, setFreq] = React.useState<Freq>('daily');
  const L = mode === 'add' ? 0 : 1;

  const applyCustom = () => {
    const n = parseInt(customInput, 10);
    if (Number.isFinite(n) && n > 0) { setCustomMin(n); setDur(n); }
    setShowCustom(false);
  };

  const commit = () => {
    if (mode === 'edit' && existing) {
      store.updateTodo(existing.id, { name, type, timing, durationMin: dur });
    } else {
      store.addTodo({ name, type, timing, durationMin: dur });
    }
    back();
  };

  return (
    <Scrim>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-semibold">{t(mode === 'edit' ? 'common.edit' : 'add.title')}</span>
        <div className="flex gap-4">
          <button {...action(M('todo.add.submit.commit', 'todo.edit.submit.commit', mode), commit)} aria-label="保存"><IcCheck size={22} /></button>
          <button {...bindBack()} aria-label="关闭"><IcClose size={22} /></button>
        </div>
      </div>
      <input
        {...action(M('todo.add.name.input', 'todo.edit.name.input', mode), () => {}, { params: { value: name } })}
        value={name} onChange={(e) => setName(e.target.value)}
        placeholder={t('add.namePlaceholder')}
        className="mb-3 w-full border-b border-[#DCEBFB] pb-1.5 text-base outline-none"
      />
      <div className="mb-2 flex gap-2">
        {(['normal', 'goal', 'habit'] as TodoType[]).map((ty) => (
          <button key={ty} {...action(TYPE_IDS[ty][mode === 'add' ? 0 : 1], () => setType(ty))}
            className={type === ty ? CHIP_ON : CHIP_OFF}>{t(TYPE_LABEL[ty])}</button>
        ))}
      </div>
      <div className="mb-2 flex gap-2">
        {(['countdown', 'countup', 'none'] as TimingMode[]).map((tm) => (
          <button key={tm} {...action(TIMING_IDS[tm][mode === 'add' ? 0 : 1], () => setTiming(tm))}
            className={timing === tm ? CHIP_ON : CHIP_OFF}>{t(TIMING_LABEL[tm])}</button>
        ))}
      </div>
      {timing === 'countdown' && (
        <>
          <div className="mb-2 flex gap-2">
            <button {...action(M('todo.add.duration.select.min25', 'todo.edit.duration.select.min25', mode), () => { setDur(25); setCustomMin(null); setShowCustom(false); })} className={dur === 25 && customMin === null ? CHIP_ON : CHIP_OFF}>25</button>
            <button {...action(M('todo.add.duration.select.min35', 'todo.edit.duration.select.min35', mode), () => { setDur(35); setCustomMin(null); setShowCustom(false); })} className={dur === 35 && customMin === null ? CHIP_ON : CHIP_OFF}>35</button>
            <button {...action(M('todo.add.duration.select.custom', 'todo.edit.duration.select.custom', mode), () => { setShowCustom(true); setCustomInput(customMin ? String(customMin) : ''); })}
              className={customMin !== null && dur === customMin ? CHIP_ON : CHIP_OFF}>
              {customMin !== null ? `${customMin}${locale === 'en' ? ' min' : '分钟'}` : (locale === 'en' ? 'Custom' : '自定义')}
            </button>
          </div>
          {showCustom && (
            <div className="mb-2 flex items-center gap-2">
              <input type="number" inputMode="numeric" autoFocus value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={locale === 'en' ? 'Minutes' : '输入分钟数'}
                className="flex-1 border-b border-[#DCEBFB] pb-1 text-sm outline-none" />
              <button onClick={applyCustom} className="rounded-lg bg-[#DCEBFB] px-3 py-1.5 text-sm text-[#4A90D9]">{t('common.confirm')}</button>
            </div>
          )}
        </>
      )}
      {type === 'goal' && (
        <div className="mb-2 flex flex-col gap-2">
          <input {...action(M('todo.add.goal.date.input', 'todo.edit.goal.date.input', mode), () => {}, { params: { value: '' } })}
            placeholder={locale === 'en' ? 'Set target date' : '设定目标日期'} className="border-b border-[#EEE] pb-1 text-sm outline-none" />
          <input {...action(M('todo.add.goal.amount.input', 'todo.edit.goal.amount.input', mode), () => {}, { params: { value: '' } })}
            placeholder={locale === 'en' ? 'Target (hours)' : '完成量(小时)'} className="border-b border-[#EEE] pb-1 text-sm outline-none" />
        </div>
      )}
      {type === 'habit' && (
        <div className="mb-2 flex flex-col gap-2">
          <div className="flex gap-2">
            {(['daily', 'weekly', 'monthly'] as Freq[]).map((fq) => (
              <button key={fq} {...action(FREQ_IDS[fq][L], () => setFreq(fq))}
                className={freq === fq ? CHIP_ON : CHIP_OFF}>{FREQ_LABEL[fq][L]}</button>
            ))}
          </div>
          <input {...action(M('todo.add.goal.amount.input', 'todo.edit.goal.amount.input', mode), () => {}, { params: { value: '' } })}
            placeholder={locale === 'en' ? 'Target (hours)' : '完成量(小时)'} className="border-b border-[#EEE] pb-1 text-sm outline-none" />
        </div>
      )}
      {mode === 'add' ? (
        <button {...bindTap('todo.add.advanced.open')} className="mt-1 text-sm text-[#4A90D9]">{t('add.advanced')}</button>
      ) : (
        <button {...bindTap('todo.edit.advanced.open')} className="mt-1 text-sm text-[#4A90D9]">{t('add.advanced')}</button>
      )}
    </Scrim>
  );
}

function AdvancedDialog() {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const [hide, setHide] = React.useState(false);
  return (
    <Scrim>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-semibold">高级设置</span>
        <div className="flex gap-4">
          <button {...action('todo.add.advanced.commit.action', () => back())} aria-label="保存"><IcCheck size={22} /></button>
          <button {...bindBack()} aria-label="关闭"><IcClose size={22} /></button>
        </div>
      </div>
      <label {...action('todo.add.advanced.hideNextDay.toggle', () => setHide((v) => !v))}
        className="mb-3 flex items-center gap-2 text-sm">
        <span className={`inline-block h-4 w-4 rounded border ${hide ? 'bg-[#4A90D9]' : 'bg-white'}`} />完成后第二天不再显示
      </label>
      <input {...action('todo.add.advanced.note.input', () => {}, { params: { value: '' } })} placeholder="任务备注" className="mb-2 block w-full border-b border-[#EEE] pb-1 text-sm text-[#4A90D9] outline-none" />
      <input {...action('todo.add.advanced.loops.input', () => {}, { params: { value: '' } })} placeholder="单次预期循环次数" className="mb-2 block w-full border-b border-[#EEE] pb-1 text-sm text-[#4A90D9] outline-none" />
      <input {...action('todo.add.advanced.restTime.input', () => {}, { params: { value: '' } })} placeholder="自定义休息时间" className="block w-full border-b border-[#EEE] pb-1 text-sm text-[#4A90D9] outline-none" />
    </Scrim>
  );
}

function StudyModeDialog() {
  const { action } = useFanqieTodoGestures();
  const { t } = useI18n();
  const s = useFanqieTodoStore();
  const studyMode = useFanqieTodoStore((x) => x.settings.studyMode);
  const strictMode = useFanqieTodoStore((x) => x.settings.strictMode);
  const toast = () => s.showToast(t('toast.unavailable'));
  return (
    <Scrim>
      <div className="mb-3 text-base font-semibold">学霸模式选项</div>
      <label {...action('todo.studymode.strict.toggle', () => s.toggleSetting('studyMode'))} className="mb-3 flex items-center justify-between text-sm">学霸模式<Switch on={studyMode} /></label>
      <label {...action('todo.studymode.hard.toggle', () => s.toggleSetting('strictMode'))} className="mb-3 flex items-center justify-between text-sm">严格模式<Switch on={strictMode} /></label>
      <button {...action('todo.studymode.blockNotify.wontfixToast', toast)} className="mb-3 block text-left text-sm">拦截通知</button>
      <button {...action('todo.studymode.force.wontfixToast', toast)} className="mb-3 block text-left text-sm">提升强制性选项</button>
      <button {...action('todo.studymode.whitelist.wontfixToast', toast)} className="block text-left text-sm">学霸模式全局白名单</button>
    </Scrim>
  );
}

function QuickMenuDialog() {
  const { bindTap, action } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const { t } = useI18n();
  const toast = () => s.showToast(t('toast.unavailable'));
  return (
    <Scrim>
      <div className="mb-3 text-base font-semibold">快捷菜单</div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <button {...bindTap('todo.quickmenu.future')} className="rounded-lg bg-[#F1F3F5] py-2">未来倒计时</button>
        <button {...action('todo.quickmenu.studyroom.wontfixToast', toast)} className="rounded-lg bg-[#F1F3F5] py-2">自习室</button>
        <button {...bindTap('todo.quickmenu.reorder')} className="rounded-lg bg-[#F1F3F5] py-2">编辑排序</button>
        <button {...bindTap('todo.quickmenu.help')} className="rounded-lg bg-[#F1F3F5] py-2">快速使用帮助</button>
        <button {...bindTap('todo.quickmenu.settings')} className="rounded-lg bg-[#F1F3F5] py-2">设置</button>
        <button {...action('todo.quickmenu.appearance.wontfixToast', toast)} className="rounded-lg bg-[#F1F3F5] py-2">外观</button>
      </div>
    </Scrim>
  );
}

function CardMenuDialog({ todoId }: { todoId: string }) {
  const { bindTap, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const { t } = useI18n();
  const todo = useFanqieTodoStore((x) => x.todos.find((y) => y.id === todoId));
  const toast = () => s.showToast(t('toast.unavailable'));
  return (
    <Scrim>
      <div className="mb-3 text-base font-semibold">{todo?.name ?? '待办'}</div>
      <div className="mb-3 flex justify-around text-xs text-[#8A8F99]">
        <button {...action('todo.card.menu.schedule.wontfixToast', toast)}>定时功能</button>
        <button {...action('todo.card.menu.bg.wontfixToast', toast)}>更换背景</button>
        <button {...action('todo.card.menu.whitelist.wontfixToast', toast)}>独立白名单</button>
      </div>
      <div className="mb-2 flex gap-2 text-sm">
        <button {...bindTap('todo.card.menu.edit', { params: { todoId } })} className="flex-1 rounded-lg bg-[#EAF2FB] py-2 text-[#4A90D9]">编辑</button>
        <button {...action('todo.card.menu.reorder.action', () => s.showToast('排序|移动'))} className="flex-1 rounded-lg bg-[#F1F3F5] py-2">排序|移动</button>
        <button {...action('todo.card.menu.delete.action', () => { s.deleteTodo(todoId); back(); })} className="flex-1 rounded-lg bg-[#FDECEC] py-2 text-[#E5533C]">删除</button>
      </div>
      <div className="flex gap-2 text-sm">
        <button {...bindTap('todo.card.menu.history', { params: { todoId } })} className="flex-1 rounded-lg bg-[#F1F3F5] py-2">专注历史记录</button>
        <button {...bindTap('todo.card.menu.stats', { params: { todoId } })} className="flex-1 rounded-lg bg-[#F1F3F5] py-2">数据统计</button>
      </div>
    </Scrim>
  );
}

function ReorderDialog() {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const todos = useFanqieTodoStore((x) => x.todos);
  const nameById = React.useMemo(() => new Map(todos.map((t) => [t.id, t.name])), [todos]);
  const [ids, setIds] = React.useState<string[]>(() => [...todos].sort((a, b) => a.order - b.order).map((t) => t.id));
  const list = ids.filter((id) => nameById.has(id));
  const dragRef = React.useRef<number | null>(null);
  const [dragging, setDragging] = React.useState<number | null>(null);

  const onDown = (i: number, e: React.PointerEvent) => {
    dragRef.current = i; setDragging(i);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    if (dragRef.current === null) return;
    const el = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest('[data-reorder-idx]');
    if (!el) return;
    const to = Number(el.getAttribute('data-reorder-idx'));
    const from = dragRef.current;
    if (Number.isNaN(to) || to === from) return;
    setIds((prev) => { const n = [...prev]; const [x] = n.splice(from, 1); n.splice(to, 0, x); return n; });
    dragRef.current = to; setDragging(to);
  };
  const onUp = () => { if (dragRef.current !== null) s.reorderTodos(ids); dragRef.current = null; setDragging(null); };

  return (
    <Scrim>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-semibold">长按拖动排序</span>
        <div className="flex gap-4">
          <button {...action('todo.reorder.commit.action', () => { s.reorderTodos(ids); back(); })} aria-label="保存"><IcCheck size={22} /></button>
          <button {...bindBack()} aria-label="关闭"><IcClose size={22} /></button>
        </div>
      </div>
      <div className="flex flex-col select-none">
        {list.map((id, i) => (
          <div key={id} data-reorder-idx={i}
            className={`flex touch-none items-center justify-between border-b border-[#F0F0F0] py-2.5 text-sm ${dragging === i ? 'rounded-lg bg-[#EAF2FB]' : ''}`}>
            <span {...action('todo.reorder.move.action', () => {}, { params: { todoId: id } })}
              onPointerDown={(e) => onDown(i, e)} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
              className="flex flex-1 cursor-grab items-center gap-2 active:cursor-grabbing">
              <span className="text-[#C8CDD4]">☰</span>{nameById.get(id)}
            </span>
            <button {...action('todo.reorder.delete.action', () => { s.deleteTodo(id); setIds((prev) => prev.filter((x) => x !== id)); }, { params: { todoId: id } })} aria-label="删除"><IcTrash size={18} /></button>
          </div>
        ))}
      </div>
    </Scrim>
  );
}

function HelpDialog() {
  const { action } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const { t } = useI18n();
  const toast = () => s.showToast(t('toast.unavailable'));
  return (
    <Scrim>
      <div className="mb-3 text-sm leading-relaxed text-[#555]">番茄ToDo 围绕【计划】【专注】【回顾】设计。</div>
      <button {...action('todo.help.plan.wontfixToast', toast)} className="mb-2 block w-full rounded-2xl bg-[#EAF2FB] py-3 text-center font-semibold">待办【计划】</button>
      <button {...action('todo.help.focus.wontfixToast', toast)} className="mb-2 block w-full rounded-2xl bg-[#EAF2FB] py-3 text-center font-semibold">专注计时【专注】</button>
      <button {...action('todo.help.review.wontfixToast', toast)} className="block w-full rounded-2xl bg-[#FDECEC] py-3 text-center font-semibold">记录和统计【回顾】</button>
    </Scrim>
  );
}

function CheckinConfirmDialog({ todoId }: { todoId: string }) {
  const { bindBack, action, back } = useFanqieTodoGestures();
  const s = useFanqieTodoStore();
  const { t } = useI18n();
  return (
    <Scrim>
      <div className="mb-2 text-center text-base font-semibold">打卡提示</div>
      <div className="mb-4 text-center text-sm text-[#555]">「不计时」类型的待办,点击确认即可完成一次。</div>
      <div className="flex gap-3">
        <button {...bindBack()} className="flex-1 rounded-2xl bg-[#F1F3F5] py-2.5">{t('common.cancel')}</button>
        <button {...action('focus.checkin.confirm.commit', () => { s.completeTodoOnce(todoId); back(); })}
          className="flex-1 rounded-2xl bg-[#DCEBFB] py-2.5 text-[#4A90D9]">{t('common.confirm')}</button>
      </div>
    </Scrim>
  );
}

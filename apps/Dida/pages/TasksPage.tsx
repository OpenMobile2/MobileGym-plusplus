import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { priorityColor } from '../res/colors';
import { PRIORITY_META } from '../constants';
import type { Task, Priority } from '../types';
import {
  IcMenu, IcMore, IcPlus, IcChevronDown, IcInbox, IcToday, IcCheck, IcBell, IcGear,
} from '../res/icons';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
// 优先级菜单选项:id 用字符串字面量(静态分析要求),behavior=select
const PRIO_OPTS: { p: Priority; id: string }[] = [
  { p: 'high', id: 'quickadd.priority.select.high' },
  { p: 'medium', id: 'quickadd.priority.select.medium' },
  { p: 'low', id: 'quickadd.priority.select.low' },
  { p: 'none', id: 'quickadd.priority.select.none' },
];

/** 快速添加草稿优先级(模块级,抵御选优先级后路由/片层 remount 丢 ref/state) */
let stickyQuickaddPriority: Priority = 'none';

function isSameDay(a: number, b: number): boolean {
  const da = TimeService.fromTimestamp(a);
  const db = TimeService.fromTimestamp(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

const TasksPage: React.FC = () => {
  const [params] = useSearchParams();
  const { t, locale } = useI18n();
  const { bindTap, action, bindBack, back } = useDidaGestures();
  const { isDark } = useDidaTheme();

  const tasks = useDidaStore((s) => s.tasks);
  const lists = useDidaStore((s) => s.lists);
  const currentListId = useDidaStore((s) => s.currentListId);
  const user = useDidaStore((s) => s.user);
  const showToast = useDidaStore((s) => s.showToast);
  const toggleComplete = useDidaStore((s) => s.toggleComplete);
  const setCurrentList = useDidaStore((s) => s.setCurrentList);
  const addTask = useDidaStore((s) => s.addTask);
  const setSetting = useDidaStore((s) => s.setSetting);
  const showCompletedSetting = useDidaStore((s) => s.settings.showCompleted);

  const drawerOpen = params.get('drawer') === 'open';
  const addOpen = params.get('sheet') === 'add';
  const prioOpen = params.get('prio') === 'open';
  const menuOpen = params.get('listmenu') === 'open';

  const [completedExpanded, setCompletedExpanded] = useState(true);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftPriority, setDraftPriority] = useState<Priority>('none');
  // 提交时直接读 input DOM 值,规避中文输入法(IME)/失焦/闭包导致的丢字
  const inputRef = useRef<HTMLInputElement>(null);
  const draftPriorityRef = useRef<Priority>('none');

  const now = TimeService.now();
  const listName = (id: string) =>
    locale === 'en' ? (lists.find((l) => l.id === id)?.name ?? id) : (lists.find((l) => l.id === id)?.name ?? id);

  const title =
    currentListId === 'today' ? t('tasks.today')
      : currentListId === 'inbox' ? t('tasks.inbox')
        : currentListId === 'completed' ? t('tasks.completed')
          : listName(currentListId);

  const inView = (task: Task): boolean => {
    if (currentListId === 'today') return task.dueTs !== null && task.dueTs <= now + 0;
    if (currentListId === 'inbox') return task.listId === 'inbox';
    if (currentListId === 'completed') return task.completed; // 已完成清单只显示已完成任务
    return task.listId === currentListId;
  };
  const isCompletedList = currentListId === 'completed';
  const todayDue = (task: Task) => task.dueTs !== null && (isSameDay(task.dueTs, now) || task.dueTs <= now);

  const visible = tasks.filter(inView);
  const active = visible
    .filter((tk) => !tk.completed && (currentListId !== 'today' || todayDue(tk)))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || (a.dueTs ?? Infinity) - (b.dueTs ?? Infinity));
  const done = visible.filter((tk) => tk.completed);

  const formatDue = (task: Task): string => {
    if (task.dueTs === null) return '';
    const d = TimeService.fromTimestamp(task.dueTs);
    if (isSameDay(task.dueTs, now)) return task.hasTime ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : t('common.today');
    return locale === 'en' ? `${MONTHS_EN[d.getMonth()]} ${d.getDate()}` : `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const renderRow = (task: Task) => (
    <div key={task.id} className="flex items-center gap-3 px-4 py-3">
      <button
        {...action('tasks.item.complete', () => toggleComplete(task.id), { params: { taskId: task.id } })}
        aria-label="complete"
        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border-2"
        style={{ borderColor: task.completed ? '#5A5A5E' : priorityColor(PRIORITY_META[task.priority].color) }}
      >
        {task.completed && <IcCheck size={14} color="#5A5A5E" />}
      </button>
      <button
        {...bindTap('task.open', { params: { id: task.id } })}
        className="flex min-w-0 flex-1 items-center justify-between bg-transparent text-left"
      >
        <span className={`truncate text-[17px] ${task.completed ? 'text-[#5A5A5E] line-through' : 'text-white'}`}>
          {task.title}
        </span>
        {formatDue(task) && (
          <span className="ml-2 shrink-0 text-[13px]" style={{ color: task.completed ? 'var(--dida-tertiary)' : 'var(--dida-accent)' }}>
            {formatDue(task)}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-4 py-2">
        <button {...bindTap('task.openSidebar')} aria-label="menu" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]">
          <IcMenu size={20} />
        </button>
        <button {...bindTap('task.moreMenu')} aria-label="more" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E] text-white">
          <IcMore size={18} />
        </button>
      </div>
      <h1 className="px-4 pb-3 pt-1 text-[34px] font-bold">{title}</h1>

      {/* 列表 */}
      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-3">
        {active.length === 0 && done.length === 0 && (
          <div className="mt-24 text-center text-[15px] text-[#8E8E93]">{t('tasks.empty')}</div>
        )}
        {active.length > 0 && (
          <div className="mb-3 overflow-hidden rounded-2xl bg-[#1C1C1E]">{active.map(renderRow)}</div>
        )}
        {/* 已完成清单页:平铺已完成任务(无折叠头);其它清单:折叠区展示 */}
        {isCompletedList && done.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">{done.map(renderRow)}</div>
        )}
        {!isCompletedList && showCompletedSetting && done.length > 0 && (
          <div className="overflow-hidden rounded-2xl bg-[#1C1C1E]">
            <button
              {...action('tasks.completed.toggle', () => setCompletedExpanded((v) => !v))}
              className="flex w-full items-center justify-between bg-transparent px-4 py-3 text-left"
            >
              <span className="text-[15px] text-[#8E8E93]">{t('tasks.completed')}</span>
              <span className="flex items-center gap-1 text-[13px] text-[#8E8E93]">
                {done.length}
                <span className={completedExpanded ? '' : '-rotate-90'}><IcChevronDown size={16} /></span>
              </span>
            </button>
            {completedExpanded && done.map(renderRow)}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        {...bindTap('task.quickadd', {
          beforeTrigger: () => {
            stickyQuickaddPriority = 'none';
            draftPriorityRef.current = 'none';
            setDraftPriority('none');
            setDraftTitle('');
          },
        })}
        aria-label="add"
        className="absolute bottom-24 right-5 flex h-14 w-14 items-center justify-center rounded-full shadow-lg"
        style={{ background: 'var(--dida-accent)' }}
      >
        <IcPlus size={26} color="#fff" />
      </button>

      {/* 抽屉 */}
      {drawerOpen && (
        <div className="absolute inset-0 z-40 flex">
          <div className="flex w-[80%] flex-col bg-[#0E0E0F] pt-12">
            <div className="flex items-center justify-between px-4 pb-4">
              <button {...bindTap('sidebar.profile.open')} className="flex items-center gap-2 bg-transparent text-left" aria-label="profile">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E79] text-sm">🐷</div>
                <span className="text-[15px] font-medium">{user.name}</span>
              </button>
              <div className="flex items-center gap-2">
                <button {...action('sidebar.bell.toast', () => showToast(t('common.notAvailable')))} aria-label="bell" className="text-[#8E8E93]"><IcBell size={20} /></button>
                <button {...bindTap('sidebar.settings')} aria-label="settings" className="text-[#8E8E93]"><IcGear size={20} /></button>
              </div>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-2">
              {[
                { id: 'today', name: t('tasks.today'), Icon: IcToday },
                { id: 'inbox', name: t('tasks.inbox'), Icon: IcInbox },
                ...lists.filter((l) => l.kind !== 'inbox').map((l) => ({ id: l.id, name: l.name, Icon: IcToday })),
                { id: 'completed', name: t('tasks.completed'), Icon: IcCheck },
              ].map((row) => (
                <button
                  key={row.id}
                  {...action('sidebar.list.select.item', () => { setCurrentList(row.id); back(); }, { params: { listId: row.id } })}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left"
                  style={{ background: currentListId === row.id ? 'var(--dida-row-selected)' : 'transparent' }}
                >
                  <span style={{ color: 'var(--dida-accent)' }}><row.Icon size={20} /></span>
                  <span className="text-[16px] text-white">{row.name}</span>
                </button>
              ))}
            </div>
            <button {...action('sidebar.add.toast', () => showToast(t('common.notAvailable')))} className="flex items-center gap-2 px-5 py-4 text-[16px] text-white">
              <IcPlus size={20} /> Add
            </button>
          </div>
          <div {...bindBack()} className="flex-1 bg-black/50" aria-label="close-drawer" />
        </div>
      )}

      {/* 快速添加 */}
      {addOpen && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-add" />
          <div data-keep-keyboard="true" className="dida-popover relative rounded-t-2xl bg-[#1C1C1E] px-4 pb-6 pt-4">
            {/* 优先级选择菜单(URL 驱动,浮在输入栏上方) */}
            {prioOpen && (
              <div className="dida-popover absolute bottom-full left-4 mb-2 w-52 overflow-hidden rounded-xl bg-[#2A2A2C] py-1">
                {PRIO_OPTS.map((opt) => (
                  <button
                    key={opt.p}
                    data-keep-keyboard="true"
                    onPointerDown={(e) => e.preventDefault()}
                    {...action(opt.id, () => {
                      stickyQuickaddPriority = opt.p;
                      draftPriorityRef.current = opt.p;
                      setDraftPriority(opt.p);
                      back();
                    })}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-[15px] text-white"
                  >
                    <span style={{ color: priorityColor(PRIORITY_META[opt.p].color) }}>⚑</span>
                    {t(PRIORITY_META[opt.p].key)}
                  </button>
                ))}
              </div>
            )}
            <input
              ref={inputRef}
              {...action('quickadd.title.input', () => { /* onChange 承载输入 */ }, { params: { value: draftTitle } })}
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder={t('tasks.addPlaceholder')}
              className="w-full bg-transparent text-[18px] text-white placeholder-[#8E8E93] outline-none"
            />
            <div className="mt-4 flex items-center gap-4">
              <button
                data-keep-keyboard="true"
                onPointerDown={(e) => e.preventDefault()}
                {...bindTap('quickadd.priority.open')}
                aria-label="priority"
                style={{ color: priorityColor(PRIORITY_META[draftPriority].color) }}
              >
                ⚑
              </button>
              <button data-keep-keyboard="true" onPointerDown={(e) => e.preventDefault()} {...action('quickadd.tag.insert', () => { const v = (inputRef.current?.value ?? draftTitle) + ' #'; setDraftTitle(v); })} aria-label="tag" className="text-[#8E8E93]">#</button>
              <div className="flex-1" />
              <button
                data-keep-keyboard="true"
                onPointerDown={(e) => e.preventDefault()}
                {...action('quickadd.submit.commit', () => {
                  const title = (inputRef.current?.value ?? draftTitle).trim();
                  if (!title) return;
                  // sticky > ref > state,避免选优先级后 remount/闭包导致落成 none
                  const priority: Priority =
                    stickyQuickaddPriority !== 'none'
                      ? stickyQuickaddPriority
                      : draftPriorityRef.current !== 'none'
                        ? draftPriorityRef.current
                        : draftPriority;
                  const patch: Parameters<typeof addTask>[0] = {
                    title,
                    priority,
                    quadrant: priority === 'high' ? 1 : priority === 'medium' ? 2 : priority === 'low' ? 3 : 4,
                  };
                  // 在「今天」新建:默认截止今天,否则进不了今天视图
                  if (currentListId === 'today') {
                    const d = TimeService.getDate();
                    patch.dueTs = TimeService.fromLocalParts(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
                    patch.hasTime = false;
                  }
                  addTask(patch);
                  stickyQuickaddPriority = 'none';
                  draftPriorityRef.current = 'none';
                  setDraftTitle('');
                  setDraftPriority('none');
                  // 若优先级菜单仍开着,先关掉再关添加层
                  if (prioOpen) back();
                  back();
                })}
                className="rounded-full px-5 py-2 text-[15px] font-medium text-white"
                style={{ background: 'var(--dida-accent)' }}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 清单选项菜单（顶栏 ⋯ → 上方弹出） */}
      {menuOpen && (
        <div className="absolute inset-0 z-40 flex flex-col">
          <div className="dida-card dida-popover mx-3 mt-14 overflow-hidden rounded-2xl px-1 py-1">
            <button {...action('listmenu.completed.toggle', () => setSetting('showCompleted', !showCompletedSetting))} className="flex w-full items-center justify-between px-4 py-3.5 text-left text-[16px] text-white">
              <span>{t('listmenu.hideCompleted')}</span><span className="dida-muted text-[14px]">{showCompletedSetting ? t('common.off') : t('common.on')}</span>
            </button>
            <button {...action('listmenu.groupsort.toast', () => showToast(t('common.notAvailable')))} className="flex w-full px-4 py-3.5 text-left text-[16px] text-white">{t('listmenu.groupSort')}</button>
            <button {...action('listmenu.multiselect.toast', () => showToast(t('common.notAvailable')))} className="flex w-full px-4 py-3.5 text-left text-[16px] text-white">{t('listmenu.select')}</button>
            <button {...action('listmenu.view.toast', () => showToast(t('common.notAvailable')))} className="flex w-full px-4 py-3.5 text-left text-[16px] text-white">{t('listmenu.more')}</button>
          </div>
          <div {...bindBack()} className="min-h-0 flex-1" aria-label="close-menu" />
        </div>
      )}
    </div>
  );
};

export default TasksPage;

import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as TimeService from '../../../os/TimeService';
import { pickImages } from '@/os/albumBridge';
import { sharePlainText } from '@/os/shareBridge';
import { useDidaStore } from '../state';
import { useDidaGestures } from '../hooks/useDidaGestures';
import { useDidaTheme } from '../hooks/useDidaTheme';
import { useI18n } from '../i18n';
import { priorityColor } from '../res/colors';
import { PRIORITY_META } from '../constants';
import type { Priority } from '../types';
import { IcBack, IcMore, IcCheck, IcPlus, IcTag, IcChecklist, IcAttach, IcClock, IcAlarm, IcRepeat, IcFlag, IcChevronRight } from '../res/icons';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WD = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const REMINDER_OPTS: { id: string; key: string; val: string | null }[] = [
  { id: 'detail.reminder.select.none', key: 'reminder.none', val: null },
  { id: 'detail.reminder.select.ontime', key: 'reminder.onTime', val: 'reminder.onTime' },
  { id: 'detail.reminder.select.min5', key: 'reminder.5min', val: 'reminder.5min' },
  { id: 'detail.reminder.select.min30', key: 'reminder.30min', val: 'reminder.30min' },
  { id: 'detail.reminder.select.hour1', key: 'reminder.1hour', val: 'reminder.1hour' },
  { id: 'detail.reminder.select.day1', key: 'reminder.1day', val: 'reminder.1day' },
];
const REPEAT_OPTS: { id: string; key: string; val: string | null }[] = [
  { id: 'detail.repeat.select.none', key: 'repeat.none', val: null },
  { id: 'detail.repeat.select.daily', key: 'repeat.daily', val: 'repeat.daily' },
  { id: 'detail.repeat.select.weekly', key: 'repeat.weekly', val: 'repeat.weekly' },
  { id: 'detail.repeat.select.monthly', key: 'repeat.monthly', val: 'repeat.monthly' },
  { id: 'detail.repeat.select.yearly', key: 'repeat.yearly', val: 'repeat.yearly' },
];
const PRIO_OPTS: { id: string; p: Priority }[] = [
  { id: 'detail.priority.select.high', p: 'high' },
  { id: 'detail.priority.select.medium', p: 'medium' },
  { id: 'detail.priority.select.low', p: 'low' },
  { id: 'detail.priority.select.none', p: 'none' },
];

const TaskDetailPage: React.FC = () => {
  const { id = '' } = useParams();
  const [params] = useSearchParams();
  const { t, locale } = useI18n();
  const { action, bindTap, bindBack, back } = useDidaGestures();
  const { isDark } = useDidaTheme();
  const task = useDidaStore((s) => s.tasks.find((tk) => tk.id === id));
  const toggleComplete = useDidaStore((s) => s.toggleComplete);
  const toggleSubtask = useDidaStore((s) => s.toggleSubtask);
  const addSubtask = useDidaStore((s) => s.addSubtask);
  const updateTask = useDidaStore((s) => s.updateTask);
  const showToast = useDidaStore((s) => s.showToast);
  const [newSub, setNewSub] = useState('');

  const edit = params.get('edit');
  const menu = params.get('menu');

  if (!task) {
    return (
      <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page flex h-full flex-col pt-10">
        <button {...bindBack()} aria-label="back" className="m-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcBack size={20} /></button>
      </div>
    );
  }

  const taskText = [task.title, task.note].filter(Boolean).join('\n');

  const shareTask = () => {
    const launched = sharePlainText(taskText, {
      onResult: (result) => {
        if (result.resultCode === 'OK') showToast(t('common.shareSuccess'));
      },
    });
    if (!launched) showToast(t('common.notAvailable'));
  };

  const copyTask = () => {
    const clipboard = window.__OS__?.clipboard;
    if (!clipboard?.copyText) {
      showToast(t('common.notAvailable'));
      return;
    }
    clipboard.copyText(taskText, 'dida');
    showToast(t('common.copied'));
    back();
  };

  const pickAttach = () => {
    void pickImages({ multiple: true, maxSelect: 9 }).then((result) => {
      if (result.cancelled || !result.selected.length) return;
      showToast(t('common.attachPicked'));
    }).catch(() => showToast(t('common.notAvailable')));
  };

  const fmtLabel = (v: string | null) => (v ? (v.startsWith('reminder.') || v.startsWith('repeat.') ? t(v) : v) : t('detail.none'));
  const dateLabel = (() => {
    if (task.dueTs === null) return t('detail.none');
    const d = TimeService.fromTimestamp(task.dueTs);
    return locale === 'en' ? `${MONTHS_EN[d.getMonth()]} ${d.getDate()}` : `${d.getMonth() + 1}月${d.getDate()}日`;
  })();

  const today = TimeService.getDate();
  const y = today.getFullYear();
  const mo = today.getMonth();
  const firstWd = TimeService.fromLocalParts(y, mo, 1).getDay();
  const dim = TimeService.fromLocalParts(y, mo + 1, 0).getDate();
  const selDay = task.dueTs !== null ? TimeService.fromTimestamp(task.dueTs).getDate() : today.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let d = 1; d <= dim; d++) cells.push(d);

  const PropRow = ({ Icon, label, value, bind }: { Icon: React.FC<{ size?: number }>; label: string; value: string; bind: React.ComponentProps<'button'> }) => (
    <button {...bind} className="flex w-full items-center gap-3 bg-transparent px-4 py-3.5 text-left">
      <span className="text-[#8E8E93]"><Icon size={19} /></span>
      <span className="flex-1 text-[16px] text-white">{label}</span>
      <span className="text-[15px] text-[#8E8E93]">{value}</span>
      <span className="text-[#5A5A5E]"><IcChevronRight size={16} /></span>
    </button>
  );

  return (
    <div data-status-bar-foreground={isDark ? 'light' : 'dark'} className="dida-page relative flex h-full flex-col pt-10">
      <div className="flex items-center justify-between px-3 py-2">
        <button {...bindBack()} aria-label="back" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcBack size={20} /></button>
        <button {...bindTap('detail.more.open', { params: { id: task.id } })} aria-label="more" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1C1C1E]"><IcMore size={18} /></button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="min-h-0 flex-1 overflow-y-auto px-4">
        <div className="flex items-start gap-3 py-3">
          <button
            {...action('detail.main.complete', () => toggleComplete(task.id))}
            aria-label="complete"
            className="mt-1 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border-2"
            style={{ borderColor: task.completed ? '#5A5A5E' : priorityColor(PRIORITY_META[task.priority].color) }}
          >
            {task.completed && <IcCheck size={14} color="#5A5A5E" />}
          </button>
          <div className="flex-1">
            <div className={`text-[22px] font-semibold ${task.completed ? 'text-[#5A5A5E] line-through' : 'text-white'}`}>{task.title}</div>
            {task.note && <div className="mt-1 text-[14px] text-[#8E8E93]">{task.note}</div>}
          </div>
        </div>

        <div className="mt-2 overflow-hidden rounded-2xl bg-[#1C1C1E]">
          <PropRow Icon={IcClock} label={t('detail.date')} value={dateLabel} bind={bindTap('detail.edit.date', { params: { id } })} />
          <PropRow Icon={IcAlarm} label={t('detail.reminder')} value={fmtLabel(task.reminder)} bind={bindTap('detail.edit.reminder', { params: { id } })} />
          <PropRow Icon={IcRepeat} label={t('detail.repeat')} value={fmtLabel(task.repeat)} bind={bindTap('detail.edit.repeat', { params: { id } })} />
          <PropRow Icon={IcFlag} label={t('detail.priority')} value={t(PRIORITY_META[task.priority].key)} bind={bindTap('detail.edit.priority', { params: { id } })} />
        </div>

        <div className="mt-4 rounded-2xl bg-[#1C1C1E] p-2">
          {task.subtasks.map((sub) => (
            <button
              key={sub.id}
              {...action('detail.sub.complete', () => toggleSubtask(task.id, sub.id), { params: { subId: sub.id } })}
              className="flex w-full items-center gap-3 bg-transparent px-2 py-2.5 text-left"
            >
              <span className="flex h-[20px] w-[20px] items-center justify-center rounded-[5px] border-2 border-[#5A5A5E]">
                {sub.done && <IcCheck size={12} color="#5A5A5E" />}
              </span>
              <span className={`text-[16px] ${sub.done ? 'text-[#5A5A5E] line-through' : 'text-white'}`}>{sub.title}</span>
            </button>
          ))}
          <div className="flex items-center gap-2 px-2 py-2">
            <IcPlus size={18} color="#F79A28" />
            <input
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              placeholder={t('tasks.addSubtask')}
              className="flex-1 bg-transparent text-[16px] text-white placeholder-[#F79A28] outline-none"
            />
            <button
              {...action('detail.sub.add', () => { if (newSub.trim()) { addSubtask(task.id, newSub); setNewSub(''); } })}
              className="text-[13px]"
              style={{ color: 'var(--dida-accent)', opacity: newSub.trim() ? 1 : 0.35 }}
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6 border-t border-[color:var(--dida-divider)] px-5 py-3 text-[#8E8E93]">
        <button {...action('detail.tag.toast', () => showToast(t('common.notAvailable')))} aria-label="tag" className="text-[#8E8E93]"><IcTag size={20} /></button>
        <button {...action('detail.checklist.toast', () => showToast(t('common.notAvailable')))} aria-label="checklist" className="text-[#8E8E93]"><IcChecklist size={20} /></button>
        <button {...action('detail.attach.pick', pickAttach)} aria-label="attach" className="text-[#8E8E93]"><IcAttach size={20} /></button>
      </div>

      {menu === 'open' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-menu" />
          <div className="dida-popover rounded-t-2xl bg-[#1C1C1E] px-2 pb-6 pt-2">
            <button {...action('detail.menu.share', shareTask)} className="flex w-full px-4 py-3.5 text-left text-[16px] text-white">
              {t('detail.share')}
            </button>
            <button {...action('detail.menu.copy', copyTask)} className="flex w-full px-4 py-3.5 text-left text-[16px] text-white">
              {t('detail.copy')}
            </button>
            <button {...bindBack()} className="mt-1 w-full py-3 text-center text-[15px] text-[#8E8E93]">{t('common.cancel')}</button>
          </div>
        </div>
      )}

      {edit === 'date' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-edit" />
          <div className="dida-popover rounded-t-2xl bg-[#1C1C1E] px-4 pb-6 pt-4">
            <div className="grid grid-cols-7 pb-1 text-center text-[12px] text-[#8E8E93]">{WD.map((w, i) => <div key={i}>{w}</div>)}</div>
            <div className="grid grid-cols-7 text-center">
              {cells.map((d, i) => (
                <div key={i} className="py-1">
                  {d && (
                    <button
                      {...action('detail.date.select.item', () => { updateTask(task.id, { dueTs: TimeService.fromLocalParts(y, mo, d).getTime(), hasTime: false }); back(); }, { params: { day: String(d) } })}
                      className="mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[15px]"
                      style={{ background: d === selDay && task.dueTs !== null ? 'var(--dida-accent)' : 'transparent', color: d === selDay && task.dueTs !== null ? '#fff' : d === today.getDate() ? 'var(--dida-accent)' : 'var(--dida-text)' }}
                    >
                      {d}
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button {...action('detail.date.clear.action', () => { updateTask(task.id, { dueTs: null, hasTime: false }); back(); })} className="mt-3 w-full py-2 text-center text-[15px] text-[#FF4D4F]">{t('detail.clear')}</button>
          </div>
        </div>
      )}

      {edit === 'reminder' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-edit" />
          <div className="dida-popover rounded-t-2xl bg-[#1C1C1E] px-2 pb-6 pt-2">
            {REMINDER_OPTS.map((o) => (
              <button key={o.id} {...action(o.id, () => { updateTask(task.id, { reminder: o.val }); back(); })} className="flex w-full items-center justify-between px-4 py-3 text-left text-[16px] text-white">
                {t(o.key)}
                {task.reminder === o.val && <span style={{ color: 'var(--dida-accent)' }}><IcCheck size={18} /></span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {edit === 'repeat' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-edit" />
          <div className="dida-popover rounded-t-2xl bg-[#1C1C1E] px-2 pb-6 pt-2">
            {REPEAT_OPTS.map((o) => (
              <button key={o.id} {...action(o.id, () => { updateTask(task.id, { repeat: o.val }); back(); })} className="flex w-full items-center justify-between px-4 py-3 text-left text-[16px] text-white">
                {t(o.key)}
                {task.repeat === o.val && <span style={{ color: 'var(--dida-accent)' }}><IcCheck size={18} /></span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {edit === 'priority' && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div {...bindBack()} className="flex-1" aria-label="close-edit" />
          <div className="dida-popover rounded-t-2xl bg-[#1C1C1E] px-2 pb-6 pt-2">
            {PRIO_OPTS.map((o) => (
              <button key={o.id} {...action(o.id, () => { updateTask(task.id, { priority: o.p }); back(); })} className="flex w-full items-center gap-3 px-4 py-3 text-left text-[16px] text-white">
                <span style={{ color: priorityColor(PRIORITY_META[o.p].color) }}>⚑</span>
                <span className="flex-1">{t(PRIORITY_META[o.p].key)}</span>
                {task.priority === o.p && <span style={{ color: 'var(--dida-accent)' }}><IcCheck size={18} /></span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetailPage;

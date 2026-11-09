import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { useDialogs } from '../hooks/useDialogs';
import { colors } from '../res/colors';
import { IconRenderer, IcCheck, IcPlus, IcMoreV, IcTomato, IcHeart, IcBell } from '../res/icons';
import { Sheet } from '../components/Sheet';
import { MenuRow } from '../components/common';
import { totalDoneDays } from '../utils/metrics';

/** 打卡管理(s172)。习惯行 ⋮ 菜单为 URL 弹层(sheet=rowmenu,s202 真机 7 项 + 裁定1 增补 2 项)。 */
export default function HabitManagePage() {
  const [sp] = useSearchParams();
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const [filter, setFilter] = useState('all');

  const habits = st.habits.filter((h) => !h.archived).sort((a, b) => a.order - b.order);
  const shown = filter === 'all' ? habits
    : filter === 'groups' ? habits
      : habits.filter((h) => st.contexts.find((c) => c.id === h.contextId)?.name === filter);

  const sheet = sp.get('sheet');
  const rowHabitId = sp.get('habitId') ?? '';

  const FChip = ({ k, label, bind }: { k: string; label: string; bind: Record<string, any> }) => (
    <button {...bind} className="shrink-0 rounded-full px-3.5 py-1.5 text-[13px]"
      style={filter === k ? { background: colors.inkStrong, color: '#fff' } : { background: '#F2F3F5', color: '#424242' }}>
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <div className="flex shrink-0 items-center justify-between px-4 pb-2 pt-10">
        <button {...bindTap('habits.today.open')} aria-label="今日"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F7]"><IcCheck size={18} /></button>
        <div className="text-[15px] font-semibold text-[#424242]">{s.tabHabits}</div>
        <button {...bindTap('habits.create')} aria-label="新建"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F6F7]"><IcPlus size={18} /></button>
      </div>

      {/* 筛选:全部 / 习惯组 / 七情境 */}
      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 py-2">
        <FChip k="all" label={s.all} bind={action('habits.filter.select.all', () => setFilter('all'))} />
        <FChip k="groups" label={s.habitGroups} bind={action('habits.filter.select.groups', () => setFilter('groups'))} />
        <FChip k="起床" label={s.contextWakeup} bind={action('habits.filter.select.wakeup', () => setFilter('起床'))} />
        <FChip k="晨间" label={s.contextMorning} bind={action('habits.filter.select.morning', () => setFilter('晨间'))} />
        <FChip k="中午" label={s.contextNoon} bind={action('habits.filter.select.noon', () => setFilter('中午'))} />
        <FChip k="午间" label={s.contextAfternoon} bind={action('habits.filter.select.afternoon', () => setFilter('午间'))} />
        <FChip k="晚间" label={s.contextEvening} bind={action('habits.filter.select.evening', () => setFilter('晚间'))} />
        <FChip k="睡前" label={s.contextBedtime} bind={action('habits.filter.select.bedtime', () => setFilter('睡前'))} />
        <FChip k="全天" label={s.contextAllDay} bind={action('habits.filter.select.allday', () => setFilter('全天'))} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-24" data-scroll-container="main" data-scroll-direction="vertical">
        {filter === 'groups' ? (
          <>
            {st.groups.map((g) => (
              <div key={g.id} className="mb-2 rounded-2xl bg-[#F8F8F8] p-3">
                <div className="text-sm font-semibold text-[#424242]">{text(g.name)}</div>
                <div className="mt-1 text-xs text-[#9AA5B1]">{g.habitIds.length} {s.habitsUnit}</div>
              </div>
            ))}
            <button {...bindTap('habits.group.create')}
              className="mt-2 w-full rounded-2xl border-2 border-dashed border-[#E3E5E8] py-3 text-sm text-[#9AA5B1]">
              + {s.addHabitGroup}
            </button>
          </>
        ) : (
          shown.map((h) => (
            <div key={h.id} className="mb-1 flex items-center gap-3 rounded-2xl px-1 py-2">
              <button {...bindTap('habits.detail.open', { params: { habitId: h.id } })}
                className="flex min-w-0 flex-1 items-center gap-3 text-left">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: h.color, color: '#fff' }}>
                  <IconRenderer name={h.icon} size={22} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-sm text-[#212121]">
                    {text(h.name)}
                    {h.important && <IcHeart size={12} color={colors.stateFail} />}
                    {h.focusRequired && <IcTomato size={12} color={colors.focusStop} />}
                    {h.reminders?.length ? <IcBell size={12} color="#9AA5B1" /> : null}
                  </span>
                  <span className="text-xs text-[#9AA5B1]">{text(st.contexts.find((c) => c.id === h.contextId)?.name)}</span>
                </span>
              </button>
              <span className="text-xs text-[#9AA5B1]">{totalDoneDays(st.logs, h.id)}d</span>
              <button {...bindTap('habits.rowmenu.open', { params: { habitId: h.id } })}
                className="p-2 text-[#C9CDD3]"><IcMoreV size={17} /></button>
            </div>
          ))
        )}
      </div>

      {sheet === 'rowmenu' && <RowMenuSheet habitId={rowHabitId} />}
    </div>
  );
}

function RowMenuSheet({ habitId }: { habitId: string }) {
  const st = useXiaorichangStore();
  const { bindTap, action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { dialogs, confirm } = useDialogs();
  return (
    <Sheet>
      <MenuRow label={s.habitEdit} {...bindTap('habits.rowmenu.edit', { params: { habitId } })} />
      <MenuRow label={s.habitStartFocus} {...bindTap('habits.rowmenu.focus', { params: { habitId } })} />
      <MenuRow label={s.habitViewLogs} {...bindTap('habits.rowmenu.logs', { params: { habitId } })} />
      <MenuRow label={s.habitArchive}
        {...action('habits.rowmenu.archive', () => { st.archiveHabit(habitId); back(); }, { params: { habitId } })} />
      <MenuRow label={s.habitMarkImportant}
        {...action('habits.rowmenu.markImportant', () => { st.toggleImportant(habitId); back(); }, { params: { habitId } })} />
      <MenuRow label={s.habitReminder} {...bindTap('habits.rowmenu.reminder', { params: { habitId } })} />
      <MenuRow label={s.habitDelete} danger
        {...action('habits.rowmenu.delete', () => confirm({
          title: `${s.habitDelete}?`, desc: '该习惯及其全部打卡记录都会被删除', danger: true,
          onConfirm: () => { st.deleteHabit(habitId); back(); },
        }), { params: { habitId } })} />
      <div className="mx-6 my-1 border-t border-[#F2F2F2]" />
      {/* 真机菜单无以下两项(s202)。裁定1:替代情境内拖拽排序的复刻增补 */}
      <MenuRow label={s.moveUp}
        {...action('habits.rowmenu.moveUp', () => { st.moveHabit(habitId, -1); back(); }, { params: { habitId } })} />
      <MenuRow label={s.moveDown}
        {...action('habits.rowmenu.moveDown', () => { st.moveHabit(habitId, 1); back(); }, { params: { habitId } })} />
      {dialogs}
    </Sheet>
  );
}

import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcBell, IcTrash } from '../res/icons';
import { MissingContent, PageHeader } from '../components/common';
import type { HabitFormDraft } from './HabitEditPage';

const REPEAT_ZH: Record<string, string> = { daily: '每天', workday: '工作日', weekend: '周末', custom: '自定义' };

/** 习惯提醒(Gate4 订正:新增提醒 = 打开弹层,不是就地加一行)。 */
export default function ReminderPage() {
  const [sp] = useSearchParams();
  const habitId = sp.get('habitId') ?? '';
  const st = useXiaorichangStore();
  const { bindTap, action } = useXiaorichangGestures();
  const s = useStrings();
  const habit = st.habits.find((h) => h.id === habitId);
  const habitForm = (st._temp.draft as { habitForm?: HabitFormDraft } | null)?.habitForm;
  const reminders = habitId === 'draft' ? habitForm?.reminders ?? [] : habit?.reminders ?? [];
  const removeReminder = (reminderId: string) => {
    if (habitId === 'draft' && habitForm) {
      st.setDraft({ habitForm: { ...habitForm, reminders: habitForm.reminders.filter((r) => r.id !== reminderId) } });
    } else {
      st.removeReminder(habitId, reminderId);
    }
  };

  if ((habitId === 'draft' && !habitForm) || (habitId !== 'draft' && !habit)) return <MissingContent />;

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={s.habitReminder} />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {reminders.length === 0 ? (
          <div className="pt-20 text-center">
            <div className="text-3xl text-[#E3E5E8]">🔔</div>
            <div className="mt-2 text-sm text-[#9AA5B1]">还没有提醒</div>
          </div>
        ) : (
          reminders.map((r) => (
            <div key={r.id} className="mb-2 flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ background: colors.brandSoft, color: '#8A6A1E' }}><IcBell size={16} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold text-[#212121]">{r.time}</span>
                <span className="text-xs text-[#9AA5B1]">{REPEAT_ZH[r.repeat]} · 软提醒</span>
              </span>
              <button {...action('habit.reminder.remove', () => removeReminder(r.id), { params: { reminderId: r.id } })}
                aria-label="删除" className="p-1 text-[#C9CDD3]"><IcTrash size={16} /></button>
            </div>
          ))
        )}
        <button {...bindTap('habit.reminder.add.open', { params: { habitId } })}
          className="mt-2 w-full rounded-2xl border-2 border-dashed border-[#E3E5E8] py-3 text-sm text-[#9AA5B1]">
          + 新增提醒
        </button>
      </div>
    </div>
  );
}

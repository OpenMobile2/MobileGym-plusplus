import React from 'react';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { useLocalizedContent } from '../hooks/useLocalizedContent';
import { colors } from '../res/colors';
import { IconRenderer } from '../res/icons';
import { MissingContent, PageHeader } from '../components/common';
import type { GroupFormDraft } from './GroupCreatePage';

/** 新建习惯组的专用多选页；与番茄专注的单选目标状态完全隔离。 */
export default function GroupHabitPickerPage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const { text } = useLocalizedContent();
  const form = (st._temp.draft as { groupForm?: GroupFormDraft } | null)?.groupForm;
  const selected = form?.habitIds ?? [];
  const habits = st.habits.filter((h) => !h.archived);
  const toggle = (habitId: string) => {
    if (!form) return;
    st.setDraft({ groupForm: {
      ...form,
      habitIds: selected.includes(habitId) ? selected.filter((id) => id !== habitId) : [...selected, habitId],
    } });
  };

  if (!form) return <MissingContent />;

  return (
    <div className="flex h-full flex-col bg-[#F8F8F8]" data-status-bar-foreground="dark">
      <PageHeader title={`${s.selectHabits} (${selected.length})`} right={
        <button {...action('habits.group.pick.commit', () => back())}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>{s.done}</button>
      } />
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-8" data-scroll-container="main" data-scroll-direction="vertical">
        {habits.map((habit) => {
          const checked = selected.includes(habit.id);
          return (
            <button key={habit.id}
              {...action('habits.group.pick.toggle', () => toggle(habit.id), { params: { habitId: habit.id } })}
              className="mb-2 flex w-full items-center gap-3 rounded-2xl bg-white px-3 py-3 text-left">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: habit.color }}>
                <IconRenderer name={habit.icon} size={20} />
              </span>
              <span className="min-w-0 flex-1 text-sm text-[#424242]">{text(habit.name)}</span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-xs"
                style={checked ? { background: colors.brand, borderColor: colors.brand, color: '#5B4718' } : { borderColor: '#D8DCE2' }}>
                {checked ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

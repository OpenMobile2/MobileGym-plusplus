import React from 'react';
import * as TimeService from '../../../os/TimeService';
import { useXiaorichangStore } from '../state';
import { useXiaorichangGestures } from '../hooks/useXiaorichangGestures';
import { useStrings } from '../hooks/useStrings';
import { colors } from '../res/colors';
import { IcClock } from '../res/icons';
import { MissingContent, PageHeader } from '../components/common';

/** 打卡备注全屏(s159)。经 _temp.draft 与打卡弹层共享,完成即回写并返回。 */
export default function CheckinNotePage() {
  const st = useXiaorichangStore();
  const { action, back } = useXiaorichangGestures();
  const s = useStrings();
  const draft = (st._temp.draft ?? {}) as { note?: string; checkinHabitId?: string };
  const note = draft.note ?? '';

  if (!draft.checkinHabitId) return <MissingContent />;

  const stamp = () => {
    const d = TimeService.getDate();
    st.setDraft({ note: `${note}【${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}】` });
  };

  return (
    <div className="flex h-full flex-col bg-white" data-status-bar-foreground="dark">
      <PageHeader title={s.checkinNote}
        right={<button {...action('checkin.notefull.commit', () => back())}
          className="rounded-full px-4 py-1.5 text-sm font-bold text-[#5B4718]" style={{ background: colors.brand }}>
          完成
        </button>} />
      <textarea
        {...action('checkin.notefull.body.input', () => {}, { params: { value: note } })}
        value={note} onChange={(e) => st.setDraft({ note: e.target.value })}
        placeholder={s.noteWriteSomething}
        className="min-h-0 flex-1 resize-none px-5 text-sm leading-relaxed outline-none" />
      <div className="flex shrink-0 items-center gap-5 px-5 pb-8 pt-2 text-[#9AA5B1]" data-keep-keyboard="true">
        <button {...action('checkin.notefull.ul.toggle', () => st.setDraft({ note: `${note}${note.endsWith('\n') || !note ? '' : '\n'}• ` }))}>•≡</button>
        <button {...action('checkin.notefull.ol.toggle', () => st.setDraft({ note: `${note}${note.endsWith('\n') || !note ? '' : '\n'}1. ` }))}>1≡</button>
        <button {...action('checkin.notefull.stamp', stamp)} aria-label="插入时间"><IcClock size={17} /></button>
      </div>
    </div>
  );
}

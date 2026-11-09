import React from 'react';
import { useStrings } from '../hooks/useStrings';
import { useXiaorichangStore } from '../state';

/** 未实现能力必须停留到用户手动确认，避免短 toast 被 agent 忽略。 */
export default function NoticeDialog() {
  const notice = useXiaorichangStore((st) => st._temp.notice ?? '');
  const dismiss = useXiaorichangStore((st) => st.dismissNotice);
  const s = useStrings();

  if (!notice) return null;
  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/40 px-8"
      role="dialog" aria-modal="true" aria-label={s.noticeTitle}>
      <div className="w-full rounded-3xl bg-white p-5 text-center shadow-xl">
        <div className="text-base font-bold text-[#212121]">{s.noticeTitle}</div>
        <div className="mt-2 text-sm leading-relaxed text-[#6B7280]">{notice}</div>
        <button onClick={dismiss} autoFocus
          className="mt-5 w-full rounded-full bg-[#424242] py-2.5 text-sm font-semibold text-white">
          {s.noticeConfirm}
        </button>
      </div>
    </div>
  );
}

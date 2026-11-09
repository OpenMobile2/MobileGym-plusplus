import type { DMEvent, DMNotebook } from '../types';
import { dayInfo, phrase } from '../utils/dayMath';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { useI18n } from '../i18n';
import type { TransitionId } from '../navigation.declaration';

interface Props {
  event: DMEvent;
  notebook?: DMNotebook;
  openTrigger: TransitionId;
  longPressTrigger?: TransitionId;
}

export function DayPill({ event }: { event: DMEvent }) {
  const { t } = useI18n();
  const info = dayInfo(event);
  if (info.state === 'today') {
    return (
      <span className="flex-shrink-0 rounded-lg bg-[#4CAF50] px-4 py-1.5 text-[17px] font-bold text-white">
        {t('common.today')}
      </span>
    );
  }
  const numBg = info.state === 'past' ? 'bg-[#F2A23C]' : 'bg-[#5B9BD5]';
  const unitBg = info.state === 'past' ? 'bg-[#E08C2E]' : 'bg-[#4A90D9]';
  return (
    <span className="flex flex-shrink-0 items-stretch overflow-hidden rounded-lg">
      <span className={`flex min-w-[52px] items-center justify-center px-3 py-1 text-[22px] font-bold leading-none text-white ${numBg}`}>
        {info.count}
      </span>
      <span className={`flex items-center px-2.5 text-[13px] text-white ${unitBg}`}>{t('common.days')}</span>
    </span>
  );
}

export default function EventRow({ event, openTrigger, longPressTrigger }: Props) {
  const { bindTap, bindLongPress } = useDaysmatterGestures();
  const { locale } = useI18n();
  const info = dayInfo(event);

  const bindOpen = bindTap<HTMLDivElement>(openTrigger, { params: { id: event.id } });
  const bindLong = longPressTrigger
    ? bindLongPress<HTMLDivElement>(longPressTrigger, { params: { eid: event.id } })
    : {};

  return (
    <div
      {...bindOpen}
      {...bindLong}
      className="mx-3 mb-2 flex items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] active:bg-[#F2F1EC]"
    >
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {event.pinned && <span className="flex-shrink-0 text-xs">📌</span>}
        <span className="truncate text-[15px] text-[#1A1A1A]">{event.title}</span>
        <span className="flex-shrink-0 text-[13px] text-[#9A9A9A]">{phrase(info, locale)}</span>
      </div>
      <DayPill event={event} />
    </div>
  );
}

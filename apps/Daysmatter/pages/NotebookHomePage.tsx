import {
  Settings,
  Plus,
  Globe,
  CalendarDays,
  BookImage,
  Archive,
  AlarmClock,
  Calculator,
  Star,
  Package,
  BookOpen,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { dayInfo } from '../utils/dayMath';
import { coverUrl } from '../assets';
import type { DMEvent } from '../types';
import { useI18n } from '../i18n';

export default function NotebookHomePage() {
  const { t } = useI18n();
  const { bindTap, action } = useDaysmatterGestures();
  const notebooks = useDaysmatterStore((s) => s.notebooks);
  const events = useDaysmatterStore((s) => s.events);
  const setFilter = useDaysmatterStore((s) => s.setFilter);
  const showToast = useDaysmatterStore((s) => s.showToast);

  const active = events.filter((e) => !e.archived && !e.parentId);
  const sortedNbs = [...notebooks].sort((a, b) => a.order - b.order);

  const nextOf = (list: DMEvent[]): DMEvent | null => {
    if (!list.length) return null;
    const future = list
      .filter((e) => dayInfo(e).diff >= 0)
      .sort((a, b) => dayInfo(a).diff - dayInfo(b).diff);
    if (future.length) return future[0];
    return [...list].sort((a, b) => Math.abs(dayInfo(a).diff) - Math.abs(dayInfo(b).diff))[0];
  };
  const preview = (e: DMEvent | null): string => {
    if (!e) return '';
    const info = dayInfo(e);
    if (info.state === 'today') return t('notebook.previewToday', { title: e.title });
    if (info.state === 'future') return t('notebook.previewFuture', { title: e.title, count: info.count });
    return t('notebook.previewPast', { title: e.title, count: info.count });
  };
  const countOf = (nbId: string) => active.filter((e) => e.notebookId === nbId).length;

  const pinned = active
    .filter((e) => e.pinned)
    .sort((a, b) => dayInfo(a).diff - dayInfo(b).diff);

  const pinnedSuffix = (info: ReturnType<typeof dayInfo>) => {
    if (info.state === 'today') return t('day.phraseToday');
    return info.state === 'future' ? t('notebook.pinnedFuture') : t('notebook.pinnedPast');
  };

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EDECE6]">
      <div className="flex h-[84px] flex-shrink-0 items-center bg-[#3E7CB1] px-2 pt-10 text-white">
        <button {...bindTap<HTMLButtonElement>('notebook.manage-open')} className="p-1.5" aria-label="manage">
          <Settings size={21} />
        </button>
        <div className="flex-1 text-center text-[17px] font-semibold">{t('notebook.title')}</div>
        <button {...bindTap<HTMLButtonElement>('notebook.add-open')} className="p-1.5" aria-label="add">
          <Plus size={22} />
        </button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto no-scrollbar">
        <div className="flex gap-2.5 overflow-x-auto px-3 py-3 no-scrollbar">
          <button
            {...bindTap<HTMLButtonElement>('notebook.add-open')}
            className="flex h-[116px] w-[84px] flex-shrink-0 flex-col items-center justify-center gap-2 rounded-xl bg-white shadow-sm active:bg-[#F2F1EC]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#4CAF50] text-white">
              <Plus size={20} />
            </span>
            <span className="whitespace-pre-line text-center text-[11px] leading-tight text-[#9A9A9A]">{t('notebook.addNew')}</span>
          </button>
          {sortedNbs.map((n) => {
            const url = coverUrl(n.cover);
            return (
              <button
                key={n.id}
                {...bindTap<HTMLButtonElement>('notebook.filter-open', {
                  beforeTrigger: () => setFilter({ kind: 'notebook', notebookId: n.id }),
                })}
                className="relative h-[116px] w-[84px] flex-shrink-0 overflow-hidden rounded-xl bg-[#8B5A2B] shadow-sm active:opacity-90"
              >
                {url && <img src={url} alt="" className="absolute inset-0 h-full w-full object-cover" />}
                <span className="absolute left-2 top-2 text-[13px] font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  {n.name}
                </span>
                <span className="absolute bottom-1.5 left-2 text-[12px] font-medium text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                  {countOf(n.id)}
                </span>
              </button>
            );
          })}
        </div>

        <div className="bg-white">
          <Row
            icon={<Globe size={22} className="text-[#4A90D9]" />}
            label={t('common.all')}
            badge={active.length}
            right={<span className="text-[13px] text-[#9A9A9A]">{preview(nextOf(active))}</span>}
            trailing={
              <span
                {...action<HTMLSpanElement>('notebook.calendar.tap', () => showToast(t('toast.calendarUnavailable')), { stopPropagation: true })}
                className="ml-2 flex items-center gap-1 border-l border-[#EEEDE8] pl-3 text-[13px] text-[#1A1A1A] active:opacity-60"
              >
                <CalendarDays size={18} className="text-[#E07A5F]" />{t('notebook.calendar')}
              </span>
            }
            {...bindTap<HTMLButtonElement>('notebook.allEvents-open', { beforeTrigger: () => setFilter({ kind: 'all' }) })}
          />
          <Row
            icon={<BookImage size={22} className="text-[#5B9BD5]" />}
            label={t('notebook.album')}
            right={<span className="text-[13px] text-[#3E7CB1]">{t('notebook.albumHint')}</span>}
            chevron
            {...bindTap<HTMLButtonElement>('notebook.album-open')}
          />
          {sortedNbs.map((n, i) => (
            <Row
              key={n.id}
              icon={<span className="text-[20px] leading-none">{n.icon}</span>}
              label={n.name}
              badge={countOf(n.id)}
              right={<span className="text-[13px] text-[#9A9A9A]">{preview(nextOf(active.filter((e) => e.notebookId === n.id)))}</span>}
              chevron
              last={i === sortedNbs.length - 1}
              {...bindTap<HTMLButtonElement>('notebook.filter-open', {
                beforeTrigger: () => setFilter({ kind: 'notebook', notebookId: n.id }),
              })}
            />
          ))}
        </div>

        <div className="mt-2 bg-white">
          <div className="flex border-b border-[#F2F1EC]">
            <HalfRow icon={<Archive size={22} className="text-[#8A8A8A]" />} label={t('notebook.archiveHide')} chevron {...bindTap<HTMLButtonElement>('notebook.archive-open')} />
            <HalfRow icon={<AlarmClock size={22} className="text-[#5B9BD5]" />} label={t('notebook.strongReminder')} badge={0} chevron divider {...action<HTMLButtonElement>('notebook.strongReminder.tap', () => showToast(t('toast.strongPro')))} />
          </div>
          <div className="flex">
            <HalfRow icon={<Calculator size={22} className="text-[#6BBF8A]" />} label={t('notebook.dateCalc')} {...bindTap<HTMLButtonElement>('notebook.datecalc-open')} />
            <HalfRow icon={<Star size={22} className="text-[#F2C94C]" fill="#F2C94C" />} label={t('notebook.milestone')} divider {...action<HTMLButtonElement>('notebook.milestone.tap', () => showToast(t('toast.milestoneUnavailable')))} />
          </div>
        </div>

        <div className="mt-2 bg-white">
          <Row
            icon={<Package size={22} className="text-[#C98A4B]" />}
            label={t('notebook.library')}
            right={<span className="text-[13px] text-[#9A9A9A]">{t('notebook.libraryHint')}</span>}
            chevron
            last
            {...action<HTMLButtonElement>('notebook.library.tap', () => showToast(t('toast.libraryUnavailable')))}
          />
        </div>

        {pinned.length > 0 && (
          <div className="mt-2 bg-white">
            {pinned.map((e, i) => {
              const info = dayInfo(e);
              return (
                <Row
                  key={e.id}
                  icon={<span className="text-[20px] leading-none">📌</span>}
                  label={e.title}
                  right={
                    <span className="text-[13px] text-[#9A9A9A]">
                      {pinnedSuffix(info)}{' '}
                      <span className="text-[15px] font-bold text-[#3E7CB1]">{info.count}</span> {t('common.days')}
                    </span>
                  }
                  chevron
                  last={i === pinned.length - 1}
                  {...bindTap<HTMLButtonElement>('notebook.item-open', { params: { id: e.id } })}
                />
              );
            })}
          </div>
        )}

        <div className="mb-4 mt-2 bg-white">
          <div className="flex">
            <HalfRow icon={<BookOpen size={22} className="text-[#5B9BD5]" />} label={t('notebook.guide')} {...bindTap<HTMLButtonElement>('notebook.faq-open')} />
            <HalfRow
              icon={<Crown size={22} className="text-[#C09A4C]" />}
              label={t('notebook.pro')}
              trailing={<span className="ml-1 rounded-full bg-[#E8543F] px-1.5 py-0.5 text-[10px] font-bold text-white">Pro</span>}
              divider
              {...bindTap<HTMLButtonElement>('notebook.pro-open')}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  badge,
  right,
  trailing,
  chevron,
  last,
  ...rest
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  right?: React.ReactNode;
  trailing?: React.ReactNode;
  chevron?: boolean;
  last?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-[#F7F6F2] ${last ? '' : 'border-b border-[#F2F1EC]'}`}
    >
      <span className="flex w-6 flex-shrink-0 justify-center">{icon}</span>
      <span className="text-[15px] text-[#1A1A1A]">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-[#E7E5DF] px-1.5 text-[11px] leading-[18px] text-[#9A9A9A]">{badge}</span>
      )}
      <span className="ml-auto flex items-center gap-0.5 overflow-hidden">
        <span className="truncate">{right}</span>
        {trailing}
        {chevron && <ChevronRight size={18} className="ml-1 flex-shrink-0 text-[#C4C4C4]" />}
      </span>
    </button>
  );
}

function HalfRow({
  icon,
  label,
  badge,
  trailing,
  chevron,
  divider,
  ...rest
}: {
  icon: React.ReactNode;
  label: string;
  badge?: number;
  trailing?: React.ReactNode;
  chevron?: boolean;
  divider?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`flex flex-1 items-center gap-2.5 px-4 py-3 text-left active:bg-[#F7F6F2] ${divider ? 'border-l border-[#F2F1EC]' : ''}`}
    >
      <span className="flex w-6 flex-shrink-0 justify-center">{icon}</span>
      <span className="text-[15px] text-[#1A1A1A]">{label}</span>
      {badge !== undefined && (
        <span className="rounded-full bg-[#E7E5DF] px-1.5 text-[11px] leading-[18px] text-[#9A9A9A]">{badge}</span>
      )}
      {trailing}
      {chevron && <ChevronRight size={18} className="ml-auto flex-shrink-0 text-[#C4C4C4]" />}
    </button>
  );
}

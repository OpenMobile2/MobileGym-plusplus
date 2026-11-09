import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Briefcase, CalendarDays, Book, Pin, RotateCcw, Clock, Boxes, Star, CalendarX2, Archive, EyeOff } from 'lucide-react';
import { useDaysmatterStore } from '../state';
import { useDaysmatterGestures } from '../hooks/useDaysmatterGestures';
import { dateLabel, parts, fromParts, todayMidnight } from '../utils/dayMath';
import type { EventDraft } from '../types';
import DateWheel from './DateWheel';
import CoverThumb from './CoverThumb';
import { useI18n, optionLabel } from '../i18n';

interface Props {
  mode: 'add' | 'edit';
}

export default function EventForm({ mode }: Props) {
  const { t, locale } = useI18n();
  const { id = '' } = useParams();
  const location = useLocation();
  const sp = new URLSearchParams(location.search);
  const pickerOpen = sp.get('picker') === 'date';
  const parentId = sp.get('parent');
  const isSub = mode === 'add' && !!parentId;
  const { bindTap, action, bindBack, back, go } = useDaysmatterGestures();

  const draft = useDaysmatterStore((s) => s._temp.draft);
  const notebooks = useDaysmatterStore((s) => s.notebooks);
  const sourceEvent = useDaysmatterStore((s) => s.events.find((e) => e.id === id));
  const initDraft = useDaysmatterStore((s) => s.initDraft);
  const patchDraft = useDaysmatterStore((s) => s.patchDraft);
  const clearDraft = useDaysmatterStore((s) => s.clearDraft);
  const addEvent = useDaysmatterStore((s) => s.addEvent);
  const updateEvent = useDaysmatterStore((s) => s.updateEvent);
  const deleteEvent = useDaysmatterStore((s) => s.deleteEvent);
  const setArchived = useDaysmatterStore((s) => s.setArchived);
  const showToast = useDaysmatterStore((s) => s.showToast);
  const autoPin = useDaysmatterStore((s) => s.settings.autoPin);
  const [advanced, setAdvanced] = useState(false);
  const [pickerField, setPickerField] = useState<'target' | 'end'>('target');

  useEffect(() => {
    if (draft) return;
    if (mode === 'edit' && sourceEvent) {
      initDraft({
        id: sourceEvent.id,
        title: sourceEvent.title,
        targetDate: sourceEvent.targetDate,
        notebookId: sourceEvent.notebookId,
        calendar: sourceEvent.calendar,
        pinned: sourceEvent.pinned,
        showOnHome: sourceEvent.showOnHome,
        repeat: sourceEvent.repeat,
        reminder: sourceEvent.reminder,
        plusOne: sourceEvent.plusOne,
        hasEndDate: sourceEvent.hasEndDate,
        endDate: sourceEvent.endDate ?? null,
        parentId: sourceEvent.parentId ?? null,
      });
    } else if (mode === 'add') {
      initDraft({
        id: null,
        title: '',
        targetDate: todayMidnight(),
        notebookId: notebooks[0]?.id ?? 'nb_life',
        calendar: 'solar',
        pinned: isSub ? false : autoPin,
        showOnHome: !isSub,
        repeat: 'none',
        reminder: 'none',
        plusOne: false,
        hasEndDate: false,
        endDate: null,
        parentId: parentId ?? null,
      });
    }
  }, [draft, mode, sourceEvent, initDraft, notebooks, autoPin, isSub, parentId]);

  if (!draft) return <div className="h-full bg-[#EFEEE9] pt-10" />;

  const d = draft as EventDraft;
  const nb = notebooks.find((n) => n.id === d.notebookId);
  const pickerBase = pickerField === 'end' ? d.endDate ?? d.targetDate : d.targetDate;
  const pp = parts(pickerBase);
  const repeatLabel = optionLabel(t, 'repeat', d.repeat);
  const reminderLabel = optionLabel(t, 'reminder', d.reminder);
  const formTitle = mode === 'edit' ? t('eventForm.edit') : isSub ? t('eventForm.addSub') : t('eventForm.add');
  const setActionId = pickerField === 'end'
    ? (mode === 'add' ? 'add.endDate.set' : 'edit.endDate.set')
    : (mode === 'add' ? 'add.date.set' : 'edit.date.set');

  function openPicker(field: 'target' | 'end') {
    setPickerField(field);
  }

  function save() {
    const { id: draftId, ...rest } = d;
    if (mode === 'add') {
      if (isSub) {
        addEvent({ ...rest, parentId: parentId ?? null, showOnHome: false });
        showToast(t('toast.subAdded'));
        clearDraft();
        back();
        return;
      }
      addEvent(rest);
      showToast(t('toast.saved'));
    } else if (draftId) {
      updateEvent(draftId, rest);
      showToast(t('toast.updated'));
    }
    clearDraft();
    go('tabbar.home-open', {}, { mode: 'replace' });
  }

  function remove() {
    if (d.id) deleteEvent(d.id);
    clearDraft();
    go('tabbar.home-open', {}, { mode: 'replace' });
  }

  function archive() {
    if (d.id) setArchived(d.id, true);
    clearDraft();
    showToast(t('toast.archived'));
    go('tabbar.home-open', {}, { mode: 'replace' });
  }

  const saveProps = action<HTMLButtonElement>(mode === 'add' ? 'add.event.save' : 'edit.event.save', save);

  return (
    <div data-status-bar-foreground="light" className="flex h-full flex-col bg-[#EFEEE9]">
      <div className="flex h-[84px] flex-shrink-0 items-center bg-[#3E7CB1] px-2 pt-10 text-white">
        <button {...bindBack<HTMLButtonElement>()} className="p-1" aria-label="back"><ChevronLeft size={26} /></button>
        <div className="flex-1 text-center text-[17px] font-semibold">{formTitle}</div>
        <button {...saveProps} className="px-2 text-[16px]">{t('common.save')}</button>
      </div>

      <div data-scroll-container="main" data-scroll-direction="vertical" className="flex-1 overflow-y-auto px-3 py-3 no-scrollbar">
        <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3.5">
          <Briefcase size={20} className="flex-shrink-0 text-[#9A9A9A]" />
          <input
            {...action<HTMLInputElement>(mode === 'add' ? 'add.name.input' : 'edit.name.input', () => {})}
            value={d.title}
            onChange={(e) => patchDraft({ title: e.target.value })}
            placeholder={t('eventForm.namePlaceholder')}
            className="w-full text-[16px] outline-none placeholder:text-[#B8B8B8]"
          />
        </div>

        <div className="mt-3 overflow-hidden rounded-xl bg-white">
          <div className="flex items-center border-b border-[#F2F1EC] px-4 py-3">
            <CalendarDays size={20} className="flex-shrink-0 text-[#9A9A9A]" />
            <button
              {...bindTap<HTMLButtonElement>(mode === 'add' ? 'add.datePicker-open' : 'edit.datePicker-open', { params: mode === 'edit' ? { id } : {}, beforeTrigger: () => openPicker('target') })}
              className="ml-3 flex flex-1 flex-col items-start text-left active:opacity-70"
            >
              <span className="text-[15px] text-[#1A1A1A]">{t('eventForm.targetDay')}</span>
              <span className="mt-0.5 text-[15px] font-medium text-[#3E7CB1]">{dateLabel(d.targetDate, d.calendar, locale)}</span>
            </button>
            <button
              {...action<HTMLButtonElement>(mode === 'add' ? 'add.calendar.toggle' : 'edit.calendar.toggle', () => patchDraft({ calendar: d.calendar === 'lunar' ? 'solar' : 'lunar' }))}
              className="flex items-center"
              aria-label="calendar toggle"
            >
              <span className={`relative flex h-7 w-16 items-center rounded-full text-[12px] font-medium text-white transition-colors ${d.calendar === 'lunar' ? 'bg-[#9A8C7A]' : 'bg-[#3E7CB1]'}`}>
                <span className={`absolute ${d.calendar === 'lunar' ? 'right-2' : 'left-2'}`}>{d.calendar === 'lunar' ? t('eventForm.lunar') : t('eventForm.solar')}</span>
                <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${d.calendar === 'lunar' ? 'left-0.5' : 'left-[38px]'}`} />
              </span>
            </button>
          </div>

          {!isSub && (
            <>
              <FieldRow icon={<Book size={20} />} label={t('eventForm.notebook')}
                right={<span className="flex items-center gap-1.5"><CoverThumb cover={nb?.cover ?? 'cover_life'} icon={nb?.icon} className="h-6 w-6" rounded="rounded" /><span className="text-[15px] text-[#3E7CB1]">{nb?.name ?? ''}</span></span>}
                onProps={bindTap<HTMLButtonElement>('event.notebook-open')} />
              <SwitchRow icon={<Star size={20} />} label={t('eventForm.showOnHome')} on={d.showOnHome}
                {...action<HTMLButtonElement>(mode === 'add' ? 'add.showHome.toggle' : 'edit.showHome.toggle', () => patchDraft({ showOnHome: !d.showOnHome }))} />
              <SwitchRow icon={<Pin size={20} />} label={t('common.pin')} on={d.pinned}
                {...action<HTMLButtonElement>(mode === 'add' ? 'add.pin.toggle' : 'edit.pin.toggle', () => patchDraft({ pinned: !d.pinned }))} />
            </>
          )}
          <FieldRow icon={<RotateCcw size={20} />} label={t('eventForm.repeat')} value={repeatLabel}
            onProps={bindTap<HTMLButtonElement>('event.repeat-open')} />
          <FieldRow icon={<Clock size={20} />} label={t('eventForm.reminder')} value={reminderLabel} last
            onProps={bindTap<HTMLButtonElement>('event.reminder-open')} />
        </div>

        <button
          {...action<HTMLButtonElement>(mode === 'add' ? 'add.advanced.toggle' : 'edit.advanced.toggle', () => setAdvanced((v) => !v))}
          className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 text-left active:bg-[#F2F1EC]"
        >
          <Boxes size={20} className="flex-shrink-0 text-[#9A9A9A]" />
          <span className="flex-1">
            <span className="block text-[15px] text-[#1A1A1A]">{t('eventForm.advanced')}</span>
            <span className="mt-0.5 block text-[12px] text-[#B0B0B0]">{t('eventForm.advancedHint')}</span>
          </span>
          <ChevronRight size={18} className={`flex-shrink-0 text-[#C4C4C4] transition-transform ${advanced ? 'rotate-90' : ''}`} />
        </button>
        {advanced && (
          <div className="mt-3 overflow-hidden rounded-xl bg-white">
            <SwitchRow icon={<CalendarX2 size={20} />} label={t('eventForm.setEndDate')} on={d.hasEndDate}
              {...action<HTMLButtonElement>(mode === 'add' ? 'add.endDate.toggle' : 'edit.endDate.toggle', () => patchDraft(d.hasEndDate ? { hasEndDate: false } : { hasEndDate: true, endDate: d.endDate ?? d.targetDate }))} />
            {d.hasEndDate && (
              <FieldRow label={t('eventForm.endDate')} value={dateLabel(d.endDate ?? d.targetDate, d.calendar, locale)}
                onProps={bindTap<HTMLButtonElement>(mode === 'add' ? 'add.datePicker-open' : 'edit.datePicker-open', { params: mode === 'edit' ? { id } : {}, beforeTrigger: () => openPicker('end') })} />
            )}
            <SwitchRow label={t('eventForm.plusOne')} on={d.plusOne}
              {...action<HTMLButtonElement>(mode === 'add' ? 'add.plusOne.toggle' : 'edit.plusOne.toggle', () => patchDraft({ plusOne: !d.plusOne }))} />
            <FieldRow label={t('eventForm.eventColor')} value={t('eventForm.followNotebook')} last
              onProps={action<HTMLButtonElement>(mode === 'add' ? 'add.color.tap' : 'edit.color.tap', () => showToast(t('toast.colorPro')))} />
          </div>
        )}

        <p className="mt-4 px-1 text-[12px] leading-relaxed text-[#9A9A9A]">
          {t('eventForm.notice')}<br />{t('eventForm.noticeBgRefresh')}<br />{t('eventForm.noticePush')}
        </p>

        <button {...saveProps} className="mb-4 mt-4 w-full rounded-full bg-[#5B9BD5] py-3.5 text-center text-[17px] font-semibold text-white shadow-md active:bg-[#4A90D9]">
          {t('common.save')}
        </button>

        {mode === 'edit' && (
          <div className="mb-8 overflow-hidden rounded-xl bg-white">
            <button
              {...action<HTMLButtonElement>('edit.event.archive', archive)}
              className="flex w-full items-center gap-3 border-b border-[#F2F1EC] px-4 py-3.5 text-[15px] text-[#1A1A1A] active:bg-[#F2F1EC]"
            >
              <Archive size={20} className="text-[#9A9A9A]" />{t('common.archive')}
            </button>
            <button
              {...action<HTMLButtonElement>('edit.event.hide', () => showToast(t('toast.hideUnavailable')))}
              className="flex w-full items-center gap-3 border-b border-[#F2F1EC] px-4 py-3.5 text-[15px] text-[#1A1A1A] active:bg-[#F2F1EC]"
            >
              <EyeOff size={20} className="text-[#9A9A9A]" />{t('eventForm.hide')}
            </button>
            <button
              {...action<HTMLButtonElement>('edit.event.delete', remove)}
              className="flex w-full items-center justify-center px-4 py-3.5 text-[15px] text-[#E0524D] active:bg-[#F2F1EC]"
            >
              {t('eventForm.deleteEvent')}
            </button>
          </div>
        )}
      </div>

      {pickerOpen && (
        <div className="absolute inset-0 z-[200] flex flex-col justify-end">
          <button {...bindBack<HTMLButtonElement>()} className="absolute inset-0 bg-black/40" aria-label="close" />
          <div className="relative z-10 rounded-t-2xl bg-white pb-4 pt-2">
            <div className="flex items-center justify-between px-4 py-2">
              <span className="text-sm text-[#9A9A9A]">{pickerField === 'end' ? t('eventForm.pickEndDate') : t('eventForm.pickTargetDate')}</span>
              <button {...bindBack<HTMLButtonElement>()} className="text-sm font-medium text-[#3E7CB1]">{t('common.done')}</button>
            </div>
            <DateWheel
              y={pp.y}
              m={pp.m}
              d={pp.d}
              actionId={setActionId}
              onSet={(y, m, day) => patchDraft(pickerField === 'end' ? { endDate: fromParts(y, m, day) } : { targetDate: fromParts(y, m, day) })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FieldRow({ icon, label, value, right, onProps, last }: { icon?: React.ReactNode; label: string; value?: string; right?: React.ReactNode; onProps: React.HTMLAttributes<HTMLButtonElement>; last?: boolean }) {
  return (
    <button {...onProps} className={`flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-[#F2F1EC] ${last ? '' : 'border-b border-[#F2F1EC]'}`}>
      {icon && <span className="flex-shrink-0 text-[#9A9A9A]">{icon}</span>}
      <span className="flex-1 text-[15px] text-[#1A1A1A]">{label}</span>
      {right ?? <span className="text-[15px] text-[#3E7CB1]">{value}</span>}
      <ChevronRight size={16} className="flex-shrink-0 text-[#C4C4C4]" />
    </button>
  );
}

function SwitchRow({ icon, label, on, ...rest }: { icon?: React.ReactNode; label: string; on: boolean } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...rest} className="flex w-full items-center gap-3 border-b border-[#F2F1EC] px-4 py-3.5 text-left last:border-b-0 active:bg-[#F2F1EC]">
      {icon && <span className="flex-shrink-0 text-[#9A9A9A]">{icon}</span>}
      <span className="flex-1 text-[15px] text-[#1A1A1A]">{label}</span>
      <span className={`relative h-6 w-10 flex-shrink-0 rounded-full transition-colors ${on ? 'bg-[#3E7CB1]' : 'bg-[#D8D6D0]'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
